import { useEffect, useState, type FormEvent } from 'react'
import { DataTable, type TableColumn } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import { getErpApi, getErrorMessage } from '../../lib/erpApi'
import type { FeeFrequency, FeeHead, MasterStatus } from '../../types'
import type { SettingsSectionProps } from '../Settings'

interface FeeHeadForm {
  name: string
  description: string
  frequency: FeeFrequency
  status: MasterStatus
}

const emptyForm: FeeHeadForm = {
  name: '',
  description: '',
  frequency: 'Monthly',
  status: 'Active',
}

const frequencies: FeeFrequency[] = [
  'Monthly',
  'Quarterly',
  'Half-Yearly',
  'Yearly',
  'One-Time',
]

export function FeeHeadsSettings({ onNotice }: SettingsSectionProps) {
  const [feeHeads, setFeeHeads] = useState<FeeHead[]>([])
  const [form, setForm] = useState<FeeHeadForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const refreshFeeHeads = async () => {
    setFeeHeads(await getErpApi().getFeeHeads())
  }

  useEffect(() => {
    let isCurrent = true

    Promise.resolve()
      .then(() => getErpApi().getFeeHeads())
      .then((rows) => {
        if (isCurrent) {
          setFeeHeads(rows)
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          onNotice({ type: 'error', message: getErrorMessage(error) })
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [onNotice])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    try {
      if (editingId) {
        await getErpApi().updateFeeHead(editingId, form)
        onNotice({ type: 'success', message: 'Fee head updated successfully.' })
      } else {
        await getErpApi().createFeeHead(form)
        onNotice({ type: 'success', message: 'Fee head created successfully.' })
      }
      await refreshFeeHeads()
      setForm(emptyForm)
      setEditingId(null)
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (feeHead: FeeHead) => {
    if (!window.confirm(`Delete the fee head "${feeHead.name}"?`)) {
      return
    }
    try {
      await getErpApi().deleteFeeHead(feeHead.id)
      await refreshFeeHeads()
      onNotice({ type: 'success', message: `${feeHead.name} was removed.` })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const columns: TableColumn<FeeHead>[] = [
    {
      key: 'name',
      header: 'Fee Head',
      render: (item) => (
        <div>
          <strong className="table-block">{item.name}</strong>
          <span className="table-secondary">{item.description || 'No description'}</span>
        </div>
      ),
    },
    {
      key: 'frequency',
      header: 'Frequency',
      render: (item) => <span className="neutral-badge">{item.frequency}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <span className={`status-badge status-badge--${item.status.toLowerCase()}`}>
          {item.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'align-right',
      render: (item) => (
        <div className="row-action-group">
          <button
            className="row-action"
            type="button"
            aria-label={`Edit ${item.name}`}
            onClick={() => {
              setEditingId(item.id)
              setForm({
                name: item.name,
                description: item.description,
                frequency: item.frequency,
                status: item.status,
              })
            }}
          >
            <Icon name="edit" size={14} />
          </button>
          <button
            className="row-action row-action--danger"
            type="button"
            aria-label={`Delete ${item.name}`}
            onClick={() => void handleDelete(item)}
          >
            <Icon name="trash" size={14} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <section className="master-page-grid">
      <form className="panel master-form-card" onSubmit={(event) => void handleSubmit(event)}>
        <div className="panel-heading">
          <div>
            <h3>{editingId ? 'Edit Fee Head' : 'Add Fee Head'}</h3>
            <p>Define a reusable fee category and collection frequency</p>
          </div>
        </div>
        <div className="master-form-fields">
          <label className="form-field">
            <span>Fee Head Name</span>
            <input
              placeholder="Example: Tuition Fee"
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </label>
          <label className="form-field">
            <span>Description</span>
            <textarea
              placeholder="Optional description"
              rows={3}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </label>
          <div className="form-row">
            <label className="form-field">
              <span>Frequency</span>
              <select
                value={form.frequency}
                onChange={(event) =>
                  setForm({ ...form, frequency: event.target.value as FeeFrequency })
                }
              >
                {frequencies.map((frequency) => (
                  <option key={frequency}>{frequency}</option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Status</span>
              <select
                value={form.status}
                onChange={(event) =>
                  setForm({ ...form, status: event.target.value as MasterStatus })
                }
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </label>
          </div>
          <div className="master-form-actions">
            {editingId && (
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setEditingId(null)
                  setForm(emptyForm)
                }}
              >
                Cancel
              </button>
            )}
            <button className="primary-button" disabled={isSaving} type="submit">
              <Icon name={editingId ? 'check' : 'plus'} size={16} />
              {editingId ? 'Update Fee Head' : 'Add Fee Head'}
            </button>
          </div>
        </div>
      </form>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>Fee Heads</h3>
            <p>{feeHeads.length} fee categories configured</p>
          </div>
        </div>
        <DataTable
          columns={columns}
          getRowKey={(item) => item.id}
          rows={feeHeads}
          emptyMessage={isLoading ? 'Loading fee heads...' : 'No fee heads configured yet.'}
        />
      </div>
    </section>
  )
}
