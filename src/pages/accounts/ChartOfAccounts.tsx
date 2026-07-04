import { useState, type FormEvent } from 'react'
import { DataTable, type TableColumn } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import { getAccountsErpApi, getErrorMessage } from '../../lib/erpApi'
import type {
  AccountCategory,
  AccountType,
  CreateAccountCategoryInput,
} from '../../types'
import type { AccountsNoticeProps } from './types'

interface ChartOfAccountsProps extends AccountsNoticeProps {
  categories: AccountCategory[]
  onCategoriesChange: (categories: AccountCategory[]) => void
}

const emptyForm: CreateAccountCategoryInput = {
  name: '',
  type: 'Income',
  description: '',
  status: 'Active',
}

export function ChartOfAccounts({
  categories,
  onCategoriesChange,
  onNotice,
}: ChartOfAccountsProps) {
  const [form, setForm] =
    useState<CreateAccountCategoryInput>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const refresh = async () => {
    onCategoriesChange(await getAccountsErpApi().getAccountCategories())
  }

  const reset = () => {
    setEditingId(null)
    setForm(emptyForm)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      setIsSaving(true)
      const api = getAccountsErpApi()
      const saved = editingId
        ? await api.updateAccountCategory(editingId, form)
        : await api.createAccountCategory(form)
      await refresh()
      onNotice({
        type: 'success',
        message: editingId
          ? `${saved.name} was updated.`
          : `${saved.name} was added to the chart of accounts.`,
      })
      reset()
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  const editCategory = (category: AccountCategory) => {
    setEditingId(category.id)
    setForm({
      name: category.name,
      type: category.type,
      description: category.description,
      status: category.status,
    })
  }

  const deleteCategory = async (category: AccountCategory) => {
    if (
      !window.confirm(
        `Delete "${category.name}"? Existing transactions will retain the category name.`,
      )
    ) {
      return
    }
    try {
      const result = await getAccountsErpApi().deleteAccountCategory(
        category.id,
      )
      if (!result.success) throw new Error('Account category was not found.')
      if (editingId === category.id) reset()
      await refresh()
      onNotice({
        type: 'success',
        message: `${category.name} was removed from active categories.`,
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const columns: TableColumn<AccountCategory>[] = [
    {
      key: 'name',
      header: 'Category',
      render: (category) => (
        <div className="primary-cell">
          <strong>{category.name}</strong>
          <span>{category.description || 'No description'}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (category) => (
        <span
          className={`account-type-badge account-type-badge--${category.type.toLowerCase()}`}
        >
          {category.type}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (category) => (
        <span
          className={`status-badge${
            category.status === 'Active' ? '' : ' status-badge--inactive'
          }`}
        >
          {category.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (category) => (
        <div className="table-actions">
          <button
            className="table-action-button"
            onClick={() => editCategory(category)}
            type="button"
          >
            <Icon name="edit" size={13} />
            Edit
          </button>
          <button
            className="table-action-button table-action-button--danger"
            onClick={() => void deleteCategory(category)}
            type="button"
          >
            <Icon name="trash" size={13} />
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="account-chart-layout">
      <form className="panel account-category-form" onSubmit={submit}>
        <div className="panel-heading">
          <div>
            <h3>{editingId ? 'Edit Category' : 'Add Account Category'}</h3>
            <p>Organize manual and linked income or expense entries.</p>
          </div>
          {editingId && (
            <button className="text-button" onClick={reset} type="button">
              Cancel edit
            </button>
          )}
        </div>
        <div className="account-category-fields">
          <label className="form-field">
            <span>Category Name</span>
            <input
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="e.g. Transport Income"
              required
              value={form.name}
            />
          </label>
          <label className="form-field">
            <span>Type</span>
            <select
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  type: event.target.value as AccountType,
                }))
              }
              value={form.type}
            >
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
            </select>
          </label>
          <label className="form-field">
            <span>Status</span>
            <select
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as 'Active' | 'Inactive',
                }))
              }
              value={form.status}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </label>
          <label className="form-field">
            <span>Description</span>
            <textarea
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Optional category purpose"
              rows={3}
              value={form.description}
            />
          </label>
        </div>
        <div className="account-category-footer">
          <button className="primary-button" disabled={isSaving} type="submit">
            <Icon name={editingId ? 'check' : 'plus'} size={16} />
            {isSaving
              ? 'Saving...'
              : editingId
                ? 'Update Category'
                : 'Add Category'}
          </button>
        </div>
      </form>

      <section className="panel account-category-list">
        <div className="panel-heading">
          <div>
            <h3>Chart Of Account</h3>
            <p>Default and custom ledger categories.</p>
          </div>
          <span className="neutral-badge">{categories.length} categories</span>
        </div>
        <DataTable
          columns={columns}
          emptyMessage="No account categories found."
          getRowKey={(category) => category.id}
          rows={categories}
        />
      </section>
    </div>
  )
}
