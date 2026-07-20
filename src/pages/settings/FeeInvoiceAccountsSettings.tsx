import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { DataTable, type TableColumn } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import { getErpApi, getErrorMessage } from '../../lib/erpApi'
import type {
  AccountCategory,
  FeeHead,
  FeeInvoiceAccountMapping,
  MasterStatus,
} from '../../types'
import type { SettingsSectionProps } from '../Settings'

interface FeeInvoiceAccountsSettingsProps extends SettingsSectionProps {
  readOnly?: boolean
}

interface MappingForm {
  feeHeadId: string
  accountCategoryId: string
  status: MasterStatus
}

const emptyForm: MappingForm = {
  feeHeadId: '',
  accountCategoryId: '',
  status: 'Active',
}

export function FeeInvoiceAccountsSettings({
  onNotice,
  readOnly = false,
}: FeeInvoiceAccountsSettingsProps) {
  const [feeHeads, setFeeHeads] = useState<FeeHead[]>([])
  const [categories, setCategories] = useState<AccountCategory[]>([])
  const [mappings, setMappings] = useState<FeeInvoiceAccountMapping[]>([])
  const [form, setForm] = useState<MappingForm>(emptyForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const activeFeeHeads = useMemo(
    () => feeHeads.filter((feeHead) => feeHead.status === 'Active'),
    [feeHeads],
  )
  const incomeCategories = useMemo(
    () =>
      categories.filter(
        (category) => category.type === 'Income' && category.status === 'Active',
      ),
    [categories],
  )

  const refreshMappings = async () => {
    setMappings(await getErpApi().getFeeInvoiceAccountMappings())
  }

  useEffect(() => {
    let isCurrent = true

    Promise.resolve()
      .then(() =>
        Promise.all([
          getErpApi().getFeeHeads(),
          getErpApi().getAccountCategories(),
          getErpApi().getFeeInvoiceAccountMappings(),
        ]),
      )
      .then(([headRows, categoryRows, mappingRows]) => {
        if (!isCurrent) return

        const availableHeads = headRows.filter((feeHead) => feeHead.status === 'Active')
        const availableCategories = categoryRows.filter(
          (category) => category.type === 'Income' && category.status === 'Active',
        )
        setFeeHeads(headRows)
        setCategories(categoryRows)
        setMappings(mappingRows)
        setForm((current) => ({
          ...current,
          feeHeadId: current.feeHeadId || availableHeads[0]?.id || '',
          accountCategoryId:
            current.accountCategoryId || availableCategories[0]?.id || '',
        }))
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
    if (readOnly) return

    setIsSaving(true)
    try {
      await getErpApi().saveFeeInvoiceAccountMapping(form)
      await refreshMappings()
      onNotice({ type: 'success', message: 'Fee-head account mapping saved.' })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (mapping: FeeInvoiceAccountMapping) => {
    if (readOnly) return
    if (!window.confirm(`Remove account mapping for "${mapping.feeHeadName}"?`)) {
      return
    }
    try {
      await getErpApi().deleteFeeInvoiceAccountMapping(mapping.id)
      await refreshMappings()
      onNotice({ type: 'success', message: 'Account mapping removed.' })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const canSave = activeFeeHeads.length > 0 && incomeCategories.length > 0

  const columns: TableColumn<FeeInvoiceAccountMapping>[] = [
    {
      key: 'feeHead',
      header: 'Fee Head',
      render: (item) => <strong className="table-block">{item.feeHeadName}</strong>,
    },
    {
      key: 'category',
      header: 'Income Category',
      render: (item) => item.accountCategoryName,
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
              aria-label={`Edit mapping for ${item.feeHeadName}`}
              className="row-action"
              onClick={() =>
                setForm({
                  feeHeadId: item.feeHeadId,
                  accountCategoryId: item.accountCategoryId,
                  status: item.status,
                })
              }
              type="button"
            >
              <Icon name="edit" size={14} />
            </button>
            <button
              aria-label={`Delete mapping for ${item.feeHeadName}`}
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
            <h3>Accounts For Fees Invoice</h3>
            <p>Map fee heads to income categories for fee collection</p>
          </div>
        </div>
        <div className="master-form-fields">
          {readOnly && (
            <div className="form-note">
              <Icon name="lock" size={17} />
              Configuration is read-only for your role.
            </div>
          )}
          {!canSave && !isLoading && (
            <div className="form-note form-note--warning">
              <Icon name="clock" size={17} />
              Create active fee heads and income account categories first.
            </div>
          )}
          <label className="form-field">
            <span>Fee Head</span>
            <select
              disabled={readOnly || activeFeeHeads.length === 0}
              required
              value={form.feeHeadId}
              onChange={(event) =>
                setForm({ ...form, feeHeadId: event.target.value })
              }
            >
              {activeFeeHeads.length === 0 && <option value="">No fee heads</option>}
              {activeFeeHeads.map((feeHead) => (
                <option key={feeHead.id} value={feeHead.id}>
                  {feeHead.name}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Income Category</span>
            <select
              disabled={readOnly || incomeCategories.length === 0}
              required
              value={form.accountCategoryId}
              onChange={(event) =>
                setForm({ ...form, accountCategoryId: event.target.value })
              }
            >
              {incomeCategories.length === 0 && (
                <option value="">No income categories</option>
              )}
              {incomeCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
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
              <button
                className="primary-button"
                disabled={!canSave || isSaving}
                type="submit"
              >
                <Icon name="check" size={17} />
                {isSaving ? 'Saving...' : 'Save Mapping'}
              </button>
            </div>
          )}
        </div>
      </form>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Configured Mappings</h3>
            <p>Mapped fee heads are used when fee receipts create income entries</p>
          </div>
        </div>
        <DataTable
          columns={columns}
          getRowKey={(item) => item.id}
          rows={mappings}
          emptyMessage={isLoading ? 'Loading account mappings...' : 'No mappings found.'}
        />
      </section>
    </section>
  )
}
