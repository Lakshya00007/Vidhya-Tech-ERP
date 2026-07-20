import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { DataTable, type TableColumn } from '../components/DataTable'
import { Icon } from '../components/Icon'
import { getErpApi, getErrorMessage } from '../lib/erpApi'
import type {
  CreateEmployeeLoginAccountInput,
  Employee,
  EmployeeLoginAccount,
  PermissionRole,
  UpdateEmployeeLoginAccountInput,
} from '../types'

type EmployeeLoginRole = Exclude<PermissionRole, 'Owner' | 'Student'>

const allowedRoles: EmployeeLoginRole[] = [
  'Teacher',
  'Accountant',
  'Viewer',
  'Admin',
]

const emptyCreateForm: CreateEmployeeLoginAccountInput & {
  confirmPassword: string
} = {
  employeeId: '',
  username: '',
  password: '',
  confirmPassword: '',
  role: 'Teacher',
  status: 'Active',
  mustChangePassword: true,
}

const formatDateTime = (value: string | null) =>
  value ? new Date(value).toLocaleString() : 'Never'

const suggestedEmployeeUsername = (employee?: Employee) =>
  employee?.employeeNo
    ? `emp_${employee.employeeNo}`.toLowerCase().replace(/[^a-z0-9_]/g, '')
    : ''

export function EmployeeLoginManagement() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [accounts, setAccounts] = useState<EmployeeLoginAccount[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>(
    'All',
  )
  const [createForm, setCreateForm] = useState(emptyCreateForm)
  const [editingAccount, setEditingAccount] =
    useState<EmployeeLoginAccount | null>(null)
  const [editForm, setEditForm] = useState<UpdateEmployeeLoginAccountInput>({})
  const [resetAccount, setResetAccount] = useState<EmployeeLoginAccount | null>(
    null,
  )
  const [resetPassword, setResetPassword] = useState('')
  const [resetConfirm, setResetConfirm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    try {
      const [employeeRows, accountRows] = await Promise.all([
        getErpApi().getEmployees(),
        getErpApi().getEmployeeLoginAccounts({
          search,
          status: statusFilter,
        }),
      ])
      setEmployees(employeeRows.filter((employee) => employee.status === 'Active'))
      setAccounts(accountRows)
      setError('')
    } catch (loadError) {
      setError(getErrorMessage(loadError))
    } finally {
      setIsLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    void Promise.resolve().then(loadData)
  }, [loadData])

  const linkedEmployeeIds = useMemo(
    () =>
      new Set(
        accounts
          .filter((account) => account.status === 'Active')
          .map((account) => account.employeeId),
      ),
    [accounts],
  )

  const availableEmployees = useMemo(
    () =>
      employees.filter(
        (employee) =>
          !linkedEmployeeIds.has(employee.id) ||
          employee.id === createForm.employeeId,
      ),
    [createForm.employeeId, employees, linkedEmployeeIds],
  )

  const selectedEmployee = employees.find(
    (employee) => employee.id === createForm.employeeId,
  )

  const showNotice = (type: 'success' | 'error', text: string) => {
    if (type === 'success') {
      setMessage(text)
      setError('')
    } else {
      setError(text)
      setMessage('')
    }
  }

  const createAccount = async (event: FormEvent) => {
    event.preventDefault()
    if (createForm.password !== createForm.confirmPassword) {
      showNotice('error', 'Password and confirmation do not match.')
      return
    }
    setIsSaving(true)
    try {
      await getErpApi().createEmployeeLoginAccount({
        employeeId: createForm.employeeId,
        username: createForm.username,
        password: createForm.password,
        role: createForm.role,
        status: createForm.status,
        mustChangePassword: createForm.mustChangePassword,
      })
      setCreateForm(emptyCreateForm)
      setMessage('Employee login account was created.')
      await loadData()
    } catch (createError) {
      showNotice('error', getErrorMessage(createError))
    } finally {
      setIsSaving(false)
    }
  }

  const saveEdit = async (event: FormEvent) => {
    event.preventDefault()
    if (!editingAccount) return
    setIsSaving(true)
    try {
      await getErpApi().updateEmployeeLoginAccount(editingAccount.id, editForm)
      setEditingAccount(null)
      setEditForm({})
      setMessage('Employee login account was updated.')
      await loadData()
    } catch (updateError) {
      showNotice('error', getErrorMessage(updateError))
    } finally {
      setIsSaving(false)
    }
  }

  const resetAccountPassword = async (event: FormEvent) => {
    event.preventDefault()
    if (!resetAccount) return
    if (resetPassword !== resetConfirm) {
      showNotice('error', 'Password and confirmation do not match.')
      return
    }
    setIsSaving(true)
    try {
      await getErpApi().resetEmployeeLoginPassword(resetAccount.id, {
        password: resetPassword,
        mustChangePassword: true,
      })
      setResetAccount(null)
      setResetPassword('')
      setResetConfirm('')
      setMessage('Temporary password was reset.')
    } catch (resetError) {
      showNotice('error', getErrorMessage(resetError))
    } finally {
      setIsSaving(false)
    }
  }

  const disableAccount = async (account: EmployeeLoginAccount) => {
    const reason = window.prompt(`Reason for disabling ${account.username}`) ?? ''
    if (!reason.trim()) return
    try {
      await getErpApi().disableEmployeeLoginAccount(account.id, reason)
      setMessage('Employee login account was disabled.')
      await loadData()
    } catch (disableError) {
      showNotice('error', getErrorMessage(disableError))
    }
  }

  const enableAccount = async (account: EmployeeLoginAccount) => {
    try {
      await getErpApi().enableEmployeeLoginAccount(account.id)
      setMessage('Employee login account was enabled.')
      await loadData()
    } catch (enableError) {
      showNotice('error', getErrorMessage(enableError))
    }
  }

  const unlinkAccount = async (account: EmployeeLoginAccount) => {
    if (!window.confirm(`Unlink and disable ${account.username}?`)) return
    try {
      await getErpApi().unlinkEmployeeLoginAccount(account.id)
      setMessage('Employee login account was unlinked and disabled.')
      await loadData()
    } catch (unlinkError) {
      showNotice('error', getErrorMessage(unlinkError))
    }
  }

  const columns: TableColumn<EmployeeLoginAccount>[] = [
    {
      key: 'employee',
      header: 'Employee',
      render: (account) => (
        <div>
          <strong>{account.employeeName}</strong>
          <span className="table-secondary">{account.employeeCode}</span>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      render: (account) => (
        <div>
          <span>{account.department || '-'}</span>
          <span className="table-secondary">{account.designation || '-'}</span>
        </div>
      ),
    },
    {
      key: 'username',
      header: 'Username',
      render: (account) => <span className="table-primary">{account.username}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      render: (account) => account.role,
    },
    {
      key: 'status',
      header: 'Status',
      render: (account) => (
        <span className={`status-pill status-pill--${account.status.toLowerCase()}`}>
          {account.status}
        </span>
      ),
    },
    {
      key: 'last-login',
      header: 'Last Login',
      render: (account) => formatDateTime(account.lastLoginAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (account) => (
        <div className="table-actions">
          <button
            className="table-action-button"
            onClick={() => {
              setEditingAccount(account)
              setEditForm({
                username: account.username,
                role: account.role,
                status: account.status,
                mustChangePassword: account.mustChangePassword,
              })
            }}
            type="button"
          >
            Edit
          </button>
          <button
            className="table-action-button"
            onClick={() => setResetAccount(account)}
            type="button"
          >
            Reset
          </button>
          {account.status === 'Active' ? (
            <button
              className="table-action-button"
              onClick={() => void disableAccount(account)}
              type="button"
            >
              Disable
            </button>
          ) : (
            <button
              className="table-action-button"
              onClick={() => void enableAccount(account)}
              type="button"
            >
              Enable
            </button>
          )}
          <button
            className="table-action-button table-action-button--danger"
            onClick={() => void unlinkAccount(account)}
            type="button"
          >
            Unlink
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="page-stack login-management-page">
      <section className="page-header">
        <div>
          <h2>Employee Manage Login</h2>
          <p>Link local users to employee records without changing Owner controls.</p>
        </div>
      </section>

      {(message || error) && (
        <div className={`inline-message${error ? ' inline-message--error' : ''}`}>
          <Icon name={error ? 'close' : 'check'} size={17} />
          <span>{error || message}</span>
          <button
            aria-label="Dismiss message"
            onClick={() => {
              setMessage('')
              setError('')
            }}
            type="button"
          >
            <Icon name="close" size={15} />
          </button>
        </div>
      )}

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Create Employee Login</h3>
            <p>Use an operational role. Owner is intentionally not assignable here.</p>
          </div>
        </div>
        <form className="settings-form" onSubmit={(event) => void createAccount(event)}>
          <div className="form-grid">
            <label>
              <span>Employee</span>
              <select
                required
                value={createForm.employeeId}
                onChange={(event) => {
                  const employee = employees.find(
                    (item) => item.id === event.target.value,
                  )
                  setCreateForm((current) => ({
                    ...current,
                    employeeId: event.target.value,
                    username: current.username || suggestedEmployeeUsername(employee),
                  }))
                }}
              >
                <option value="">Select employee</option>
                {availableEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.employeeNo} - {employee.name} ({employee.department || 'Staff'})
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Username</span>
              <input
                required
                value={createForm.username}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    username: event.target.value,
                  }))
                }
                placeholder={suggestedEmployeeUsername(selectedEmployee) || 'employee username'}
              />
            </label>
            <label>
              <span>Role</span>
              <select
                value={createForm.role}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    role: event.target.value as EmployeeLoginRole,
                  }))
                }
              >
                {allowedRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Status</span>
              <select
                value={createForm.status}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    status: event.target.value as 'Active' | 'Inactive',
                  }))
                }
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>
            <label>
              <span>Temporary Password</span>
              <input
                autoComplete="new-password"
                minLength={8}
                required
                type="password"
                value={createForm.password}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              <span>Confirm Password</span>
              <input
                autoComplete="new-password"
                minLength={8}
                required
                type="password"
                value={createForm.confirmPassword}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    confirmPassword: event.target.value,
                  }))
                }
              />
            </label>
            <label className="toggle-field">
              <input
                checked={createForm.mustChangePassword}
                type="checkbox"
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    mustChangePassword: event.target.checked,
                  }))
                }
              />
              <span>Force password change on first login</span>
            </label>
          </div>
          <div className="settings-form__actions">
            <button className="primary-button" disabled={isSaving} type="submit">
              <Icon name="plus" size={16} />
              Create Login
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Employee Login Accounts</h3>
            <p>Search by employee code, name, department, designation, username or role.</p>
          </div>
          <div className="table-toolbar">
            <input
              aria-label="Search employee login accounts"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search accounts"
              value={search}
            />
            <select
              aria-label="Filter account status"
              onChange={(event) =>
                setStatusFilter(event.target.value as 'All' | 'Active' | 'Inactive')
              }
              value={statusFilter}
            >
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
        {isLoading ? (
          <div className="document-empty-state">
            <span className="loading-spinner" />
            <h3>Loading employee logins...</h3>
          </div>
        ) : (
          <DataTable
            columns={columns}
            emptyMessage="No employee login accounts found"
            getRowKey={(account) => account.id}
            rows={accounts}
          />
        )}
      </section>

      {editingAccount && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Edit Employee Login</h3>
              <p>{editingAccount.employeeName}</p>
            </div>
          </div>
          <form className="settings-form" onSubmit={(event) => void saveEdit(event)}>
            <div className="form-grid">
              <label>
                <span>Username</span>
                <input
                  required
                  value={editForm.username ?? ''}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      username: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>Role</span>
                <select
                  value={editForm.role ?? 'Teacher'}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      role: event.target.value as EmployeeLoginRole,
                    }))
                  }
                >
                  {allowedRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Status</span>
                <select
                  value={editForm.status ?? 'Active'}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      status: event.target.value as 'Active' | 'Inactive',
                    }))
                  }
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </label>
              <label className="toggle-field">
                <input
                  checked={Boolean(editForm.mustChangePassword)}
                  type="checkbox"
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      mustChangePassword: event.target.checked,
                    }))
                  }
                />
                <span>Require password change</span>
              </label>
            </div>
            <div className="settings-form__actions">
              <button className="primary-button" disabled={isSaving} type="submit">
                Save Changes
              </button>
              <button
                className="secondary-button"
                onClick={() => setEditingAccount(null)}
                type="button"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {resetAccount && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Reset Temporary Password</h3>
              <p>{resetAccount.username}</p>
            </div>
          </div>
          <form
            className="settings-form"
            onSubmit={(event) => void resetAccountPassword(event)}
          >
            <div className="form-grid">
              <label>
                <span>New Temporary Password</span>
                <input
                  autoComplete="new-password"
                  minLength={8}
                  required
                  type="password"
                  value={resetPassword}
                  onChange={(event) => setResetPassword(event.target.value)}
                />
              </label>
              <label>
                <span>Confirm Password</span>
                <input
                  autoComplete="new-password"
                  minLength={8}
                  required
                  type="password"
                  value={resetConfirm}
                  onChange={(event) => setResetConfirm(event.target.value)}
                />
              </label>
            </div>
            <div className="settings-form__actions">
              <button className="primary-button" disabled={isSaving} type="submit">
                Reset Password
              </button>
              <button
                className="secondary-button"
                onClick={() => {
                  setResetAccount(null)
                  setResetPassword('')
                  setResetConfirm('')
                }}
                type="button"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  )
}
