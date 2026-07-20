import { useEffect, useState, type FormEvent } from 'react'
import { DataTable, type TableColumn } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import { getErpApi, getErrorMessage } from '../../lib/erpApi'
import type {
  DiscountMode,
  DiscountType,
  MasterStatus,
} from '../../types'
import type { SettingsSectionProps } from '../Settings'

interface DiscountTypesSettingsProps extends SettingsSectionProps {
  readOnly?: boolean
}

interface DiscountTypeForm {
  name: string
  discountMode: DiscountMode
  defaultValue: string
  description: string
  status: MasterStatus
}

const emptyForm: DiscountTypeForm = {
  name: '',
  discountMode: 'Fixed',
  defaultValue: '0',
  description: '',
  status: 'Active',
}

export function DiscountTypesSettings({
  onNotice,
  readOnly = false,
}: DiscountTypesSettingsProps) {
  const [discountTypes, setDiscountTypes] = useState<DiscountType[]>([])
  const [form, setForm] = useState<DiscountTypeForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const refreshDiscountTypes = async () => {
    setDiscountTypes(await getErpApi().getDiscountTypes())
  }

  useEffect(() => {
    let isCurrent = true

    Promise.resolve()
      .then(() => getErpApi().getDiscountTypes())
      .then((rows) => {
        if (isCurrent) {
          setDiscountTypes(rows)
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

  const resetForm = () => {
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (readOnly) return

    const defaultValue = Number(form.defaultValue)
    if (
      !Number.isInteger(defaultValue) ||
      defaultValue < 0 ||
      (form.discountMode === 'Percentage' && defaultValue > 100)
    ) {
      onNotice({
        type: 'error',
        message: 'Enter a valid whole-number default value.',
      })
      return
    }

    setIsSaving(true)
    try {
      const input = {
        name: form.name,
        discountMode: form.discountMode,
        defaultValue,
        description: form.description,
        status: form.status,
      }
      if (editingId) {
        await getErpApi().updateDiscountType(editingId, input)
        onNotice({ type: 'success', message: 'Discount type updated.' })
      } else {
        await getErpApi().createDiscountType(input)
        onNotice({ type: 'success', message: 'Discount type created.' })
      }
      await refreshDiscountTypes()
      resetForm()
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (discountType: DiscountType) => {
    if (readOnly) return
    if (!window.confirm(`Delete the discount type "${discountType.name}"?`)) {
      return
    }
    try {
      await getErpApi().deleteDiscountType(discountType.id)
      await refreshDiscountTypes()
      onNotice({ type: 'success', message: `${discountType.name} was removed.` })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const columns: TableColumn<DiscountType>[] = [
    {
      key: 'name',
      header: 'Discount Type',
      render: (item) => (
        <div>
          <strong className="table-block">{item.name}</strong>
          <span className="table-secondary">
            {item.description || 'No description'}
          </span>
        </div>
      ),
    },
    {
      key: 'mode',
      header: 'Mode',
      render: (item) => <span className="neutral-badge">{item.discountMode}</span>,
    },
    {
      key: 'value',
      header: 'Default Value',
      render: (item) =>
        item.discountMode === 'Percentage'
          ? `${item.defaultValue}%`
          : item.defaultValue.toLocaleString('en-IN'),
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
      render: (item) =>
        readOnly ? (
          <span className="table-secondary">View only</span>
        ) : (
          <div className="row-action-group">
            <button
              aria-label={`Edit ${item.name}`}
              className="row-action"
              onClick={() => {
                setEditingId(item.id)
                setForm({
                  name: item.name,
                  discountMode: item.discountMode,
                  defaultValue: String(item.defaultValue),
                  description: item.description,
                  status: item.status,
                })
              }}
              type="button"
            >
              <Icon name="edit" size={14} />
            </button>
            <button
              aria-label={`Delete ${item.name}`}
              className="row-action row-action--danger"
              onClick={() => void handleDelete(item)}
              type="button"
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
            <h3>{editingId ? 'Edit Discount Type' : 'Add Discount Type'}</h3>
            <p>Configure reusable concessions for fee invoices</p>
          </div>
        </div>
        <div className="master-form-fields">
          {readOnly && (
            <div className="form-note">
              <Icon name="lock" size={17} />
              Configuration is read-only for your role.
            </div>
          )}
          <label className="form-field">
            <span>Name</span>
            <input
              disabled={readOnly}
              placeholder="Example: Sibling Discount"
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </label>
          <div className="form-row">
            <label className="form-field">
              <span>Mode</span>
              <select
                disabled={readOnly}
                value={form.discountMode}
                onChange={(event) =>
                  setForm({
                    ...form,
                    discountMode: event.target.value as DiscountMode,
                  })
                }
              >
                <option>Fixed</option>
                <option>Percentage</option>
              </select>
            </label>
            <label className="form-field">
              <span>Default Value</span>
              <input
                disabled={readOnly}
                min="0"
                max={form.discountMode === 'Percentage' ? 100 : undefined}
                required
                step="1"
                type="number"
                value={form.defaultValue}
                onChange={(event) =>
                  setForm({ ...form, defaultValue: event.target.value })
                }
              />
            </label>
          </div>
          <label className="form-field">
            <span>Description</span>
            <textarea
              disabled={readOnly}
              rows={3}
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
            />
          </label>
          <label className="form-field">
            <span>Status</span>
            <select
              disabled={readOnly}
              value={form.status}
              onChange={(event) =>
                setForm({ ...form, status: event.target.value as MasterStatus })
              }
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </label>
          {!readOnly && (
            <div className="master-form-actions">
              {editingId && (
                <button className="secondary-button" onClick={resetForm} type="button">
                  Cancel
                </button>
              )}
              <button className="primary-button" disabled={isSaving} type="submit">
                <Icon name="check" size={17} />
                {isSaving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
            </div>
          )}
        </div>
      </form>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Discount Types</h3>
            <p>Active and inactive concession definitions</p>
          </div>
        </div>
        <DataTable
          columns={columns}
          getRowKey={(item) => item.id}
          rows={discountTypes}
          emptyMessage={isLoading ? 'Loading discount types...' : 'No discount types found.'}
        />
      </section>
    </section>
  )
}
