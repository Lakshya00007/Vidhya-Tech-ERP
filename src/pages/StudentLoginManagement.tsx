import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { DataTable, type TableColumn } from '../components/DataTable'
import { Icon } from '../components/Icon'
import { getErpApi, getErrorMessage } from '../lib/erpApi'
import type {
  CreateStudentLoginAccountInput,
  Student,
  StudentLoginAccount,
  UpdateStudentLoginAccountInput,
} from '../types'

const emptyCreateForm: CreateStudentLoginAccountInput & {
  confirmPassword: string
} = {
  studentId: '',
  username: '',
  password: '',
  confirmPassword: '',
  status: 'Active',
  mustChangePassword: true,
}

const formatDateTime = (value: string | null) =>
  value ? new Date(value).toLocaleString() : 'Never'

const suggestedStudentUsername = (student?: Student) =>
  student?.admissionNo
    ? `stu_${student.admissionNo}`.toLowerCase().replace(/[^a-z0-9_]/g, '')
    : ''

export function StudentLoginManagement() {
  const [students, setStudents] = useState<Student[]>([])
  const [accounts, setAccounts] = useState<StudentLoginAccount[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>(
    'All',
  )
  const [createForm, setCreateForm] = useState(emptyCreateForm)
  const [editingAccount, setEditingAccount] =
    useState<StudentLoginAccount | null>(null)
  const [editForm, setEditForm] = useState<UpdateStudentLoginAccountInput>({})
  const [resetAccount, setResetAccount] = useState<StudentLoginAccount | null>(
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
      const [studentRows, accountRows] = await Promise.all([
        getErpApi().getStudents(),
        getErpApi().getStudentLoginAccounts({
          search,
          status: statusFilter,
        }),
      ])
      setStudents(studentRows.filter((student) => student.status === 'Active'))
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

  const linkedStudentIds = useMemo(
    () =>
      new Set(
        accounts
          .filter((account) => account.status === 'Active')
          .map((account) => account.studentId),
      ),
    [accounts],
  )

  const availableStudents = useMemo(
    () =>
      students.filter(
        (student) =>
          !linkedStudentIds.has(student.id) ||
          student.id === createForm.studentId,
      ),
    [createForm.studentId, linkedStudentIds, students],
  )

  const selectedStudent = students.find(
    (student) => student.id === createForm.studentId,
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
      await getErpApi().createStudentLoginAccount({
        studentId: createForm.studentId,
        username: createForm.username,
        password: createForm.password,
        status: createForm.status,
        mustChangePassword: createForm.mustChangePassword,
      })
      setCreateForm(emptyCreateForm)
      setMessage('Student login account was created.')
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
      await getErpApi().updateStudentLoginAccount(editingAccount.id, editForm)
      setEditingAccount(null)
      setEditForm({})
      setMessage('Student login account was updated.')
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
      await getErpApi().resetStudentLoginPassword(resetAccount.id, {
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

  const disableAccount = async (account: StudentLoginAccount) => {
    const reason = window.prompt(`Reason for disabling ${account.username}`) ?? ''
    if (!reason.trim()) return
    try {
      await getErpApi().disableStudentLoginAccount(account.id, reason)
      setMessage('Student login account was disabled.')
      await loadData()
    } catch (disableError) {
      showNotice('error', getErrorMessage(disableError))
    }
  }

  const enableAccount = async (account: StudentLoginAccount) => {
    try {
      await getErpApi().enableStudentLoginAccount(account.id)
      setMessage('Student login account was enabled.')
      await loadData()
    } catch (enableError) {
      showNotice('error', getErrorMessage(enableError))
    }
  }

  const unlinkAccount = async (account: StudentLoginAccount) => {
    if (!window.confirm(`Unlink and disable ${account.username}?`)) return
    try {
      await getErpApi().unlinkStudentLoginAccount(account.id)
      setMessage('Student login account was unlinked and disabled.')
      await loadData()
    } catch (unlinkError) {
      showNotice('error', getErrorMessage(unlinkError))
    }
  }

  const columns: TableColumn<StudentLoginAccount>[] = [
    {
      key: 'student',
      header: 'Student',
      render: (account) => (
        <div>
          <strong>{account.studentName}</strong>
          <span className="table-secondary">{account.admissionNo}</span>
        </div>
      ),
    },
    {
      key: 'class',
      header: 'Class/Section',
      render: (account) =>
        [account.className, account.section].filter(Boolean).join(' / ') || '-',
    },
    {
      key: 'username',
      header: 'Username',
      render: (account) => <span className="table-primary">{account.username}</span>,
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
      key: 'must-change',
      header: 'Must Change',
      render: (account) => (account.mustChangePassword ? 'Yes' : 'No'),
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
          <h2>Student Manage Login</h2>
          <p>Create and maintain restricted local accounts linked to students.</p>
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
            <h3>Create Student Login</h3>
            <p>Student accounts always receive the Student role and self-service access only.</p>
          </div>
        </div>
        <form className="settings-form" onSubmit={(event) => void createAccount(event)}>
          <div className="form-grid">
            <label>
              <span>Student</span>
              <select
                required
                value={createForm.studentId}
                onChange={(event) => {
                  const student = students.find(
                    (item) => item.id === event.target.value,
                  )
                  setCreateForm((current) => ({
                    ...current,
                    studentId: event.target.value,
                    username: current.username || suggestedStudentUsername(student),
                  }))
                }}
              >
                <option value="">Select student</option>
                {availableStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.admissionNo} - {student.name} ({student.className}
                    {student.section ? `/${student.section}` : ''})
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
                placeholder={suggestedStudentUsername(selectedStudent) || 'student username'}
              />
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
            <h3>Student Login Accounts</h3>
            <p>Search by student, admission number, class, username or status.</p>
          </div>
          <div className="table-toolbar">
            <input
              aria-label="Search student login accounts"
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
            <h3>Loading student logins...</h3>
          </div>
        ) : (
          <DataTable
            columns={columns}
            emptyMessage="No student login accounts found"
            getRowKey={(account) => account.id}
            rows={accounts}
          />
        )}
      </section>

      {editingAccount && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Edit Student Login</h3>
              <p>{editingAccount.studentName}</p>
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
