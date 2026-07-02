import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { DataTable, type TableColumn } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import { getErpApi, getErrorMessage } from '../../lib/erpApi'
import type {
  ClassItem,
  FeeHead,
  FeeStructure,
  MasterStatus,
  SchoolSettings,
} from '../../types'
import type { SettingsSectionProps } from '../Settings'

interface FeeStructureForm {
  className: string
  feeHeadId: string
  amount: string
  academicYear: string
  status: MasterStatus
}

const emptyForm: FeeStructureForm = {
  className: '',
  feeHeadId: '',
  amount: '',
  academicYear: '',
  status: 'Active',
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)

export function FeeStructureSettings({ onNotice }: SettingsSectionProps) {
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [feeHeads, setFeeHeads] = useState<FeeHead[]>([])
  const [structures, setStructures] = useState<FeeStructure[]>([])
  const [settings, setSettings] = useState<SchoolSettings | null>(null)
  const [form, setForm] = useState<FeeStructureForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const activeClasses = useMemo(
    () => classes.filter((item) => item.status === 'Active'),
    [classes],
  )
  const activeFeeHeads = useMemo(
    () => feeHeads.filter((item) => item.status === 'Active'),
    [feeHeads],
  )

  const applyData = (
    classRows: ClassItem[],
    feeHeadRows: FeeHead[],
    structureRows: FeeStructure[],
    schoolSettings: SchoolSettings,
  ) => {
    const availableClasses = classRows.filter((item) => item.status === 'Active')
    const availableFeeHeads = feeHeadRows.filter((item) => item.status === 'Active')
    setClasses(classRows)
    setFeeHeads(feeHeadRows)
    setStructures(structureRows)
    setSettings(schoolSettings)
    setForm((current) => ({
      ...current,
      className:
        current.className || availableClasses[0]?.name || '',
      feeHeadId:
        current.feeHeadId || availableFeeHeads[0]?.id || '',
      academicYear:
        current.academicYear || schoolSettings.academicYear || '',
    }))
  }

  useEffect(() => {
    let isCurrent = true

    Promise.resolve()
      .then(() =>
        Promise.all([
          getErpApi().getClasses(),
          getErpApi().getFeeHeads(),
          getErpApi().getFeeStructures(),
          getErpApi().getSchoolSettings(),
        ]),
      )
      .then(([classRows, feeHeadRows, structureRows, schoolSettings]) => {
        if (isCurrent) {
          applyData(classRows, feeHeadRows, structureRows, schoolSettings)
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

  const refreshStructures = async () => {
    setStructures(await getErpApi().getFeeStructures())
  }

  const resetForm = () => {
    setEditingId(null)
    setForm({
      ...emptyForm,
      className: activeClasses[0]?.name ?? '',
      feeHeadId: activeFeeHeads[0]?.id ?? '',
      academicYear: settings?.academicYear ?? '',
    })
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    try {
      const input = {
        className: form.className,
        feeHeadId: form.feeHeadId,
        amount: Number(form.amount),
        academicYear: form.academicYear,
        status: form.status,
      }
      if (editingId) {
        await getErpApi().updateFeeStructure(editingId, input)
        onNotice({ type: 'success', message: 'Fee structure updated successfully.' })
      } else {
        await getErpApi().createFeeStructure(input)
        onNotice({ type: 'success', message: 'Fee structure created successfully.' })
      }
      await refreshStructures()
      resetForm()
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (structure: FeeStructure) => {
    if (
      !window.confirm(
        `Delete ${structure.feeHeadName} for Class ${structure.className}?`,
      )
    ) {
      return
    }
    try {
      await getErpApi().deleteFeeStructure(structure.id)
      await refreshStructures()
      onNotice({ type: 'success', message: 'Fee structure was removed.' })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const academicYears = Array.from(
    new Set(
      [settings?.academicYear, form.academicYear]
        .filter((year): year is string => Boolean(year)),
    ),
  )

  const columns: TableColumn<FeeStructure>[] = [
    {
      key: 'class',
      header: 'Class',
      render: (item) => <strong className="table-block">Class {item.className}</strong>,
    },
    { key: 'head', header: 'Fee Head', render: (item) => item.feeHeadName },
    {
      key: 'amount',
      header: 'Amount',
      render: (item) => <strong>{formatCurrency(item.amount)}</strong>,
    },
    {
      key: 'year',
      header: 'Academic Year',
      render: (item) => item.academicYear || '—',
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
            aria-label={`Edit ${item.feeHeadName} for Class ${item.className}`}
            onClick={() => {
              setEditingId(item.id)
              setForm({
                className: item.className,
                feeHeadId: item.feeHeadId,
                amount: String(item.amount),
                academicYear: item.academicYear,
                status: item.status,
              })
            }}
          >
            <Icon name="edit" size={14} />
          </button>
          <button
            className="row-action row-action--danger"
            type="button"
            aria-label={`Delete ${item.feeHeadName} for Class ${item.className}`}
            onClick={() => void handleDelete(item)}
          >
            <Icon name="trash" size={14} />
          </button>
        </div>
      ),
    },
  ]

  const canCreate = activeClasses.length > 0 && activeFeeHeads.length > 0

  return (
    <section className="master-page-grid master-page-grid--structure">
      <form className="panel master-form-card" onSubmit={(event) => void handleSubmit(event)}>
        <div className="panel-heading">
          <div>
            <h3>{editingId ? 'Edit Fee Structure' : 'Add Fee Structure'}</h3>
            <p>Assign a fee head and amount to a class</p>
          </div>
        </div>
        <div className="master-form-fields">
          {!canCreate && !isLoading && (
            <div className="form-note form-note--warning">
              <Icon name="clock" size={17} />
              Create at least one active class and fee head before adding a fee structure.
            </div>
          )}
          <div className="form-row">
            <label className="form-field">
              <span>Class</span>
              <select
                disabled={activeClasses.length === 0}
                required
                value={form.className}
                onChange={(event) => setForm({ ...form, className: event.target.value })}
              >
                {activeClasses.length === 0 && <option value="">No classes available</option>}
                {activeClasses.map((item) => (
                  <option key={item.id} value={item.name}>Class {item.name}</option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Fee Head</span>
              <select
                disabled={activeFeeHeads.length === 0}
                required
                value={form.feeHeadId}
                onChange={(event) => setForm({ ...form, feeHeadId: event.target.value })}
              >
                {activeFeeHeads.length === 0 && (
                  <option value="">No fee heads available</option>
                )}
                {activeFeeHeads.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-row">
            <label className="form-field">
              <span>Amount (₹)</span>
              <input
                min="1"
                placeholder="Enter amount"
                required
                step="1"
                type="number"
                value={form.amount}
                onChange={(event) => setForm({ ...form, amount: event.target.value })}
              />
            </label>
            <label className="form-field">
              <span>Academic Year</span>
              <select
                required
                value={form.academicYear}
                onChange={(event) =>
                  setForm({ ...form, academicYear: event.target.value })
                }
              >
                {academicYears.length === 0 && (
                  <option value="">Set an academic year in School Profile</option>
                )}
                {academicYears.map((year) => (
                  <option key={year}>{year}</option>
                ))}
              </select>
            </label>
          </div>
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
          <div className="master-form-actions">
            {editingId && (
              <button className="secondary-button" type="button" onClick={resetForm}>
                Cancel
              </button>
            )}
            <button
              className="primary-button"
              disabled={isSaving || !canCreate || !form.academicYear}
              type="submit"
            >
              <Icon name={editingId ? 'check' : 'plus'} size={16} />
              {editingId ? 'Update Structure' : 'Save Fee Structure'}
            </button>
          </div>
        </div>
      </form>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>Fee Structure</h3>
            <p>{structures.length} class fee assignments</p>
          </div>
        </div>
        <DataTable
          columns={columns}
          getRowKey={(item) => item.id}
          rows={structures}
          emptyMessage={
            isLoading ? 'Loading fee structure...' : 'No fee structure configured yet.'
          }
        />
      </div>
    </section>
  )
}
