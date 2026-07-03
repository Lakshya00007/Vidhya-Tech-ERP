import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { DataTable, type TableColumn } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import { getErpApi, getErrorMessage } from '../../lib/erpApi'
import type {
  AuditLog,
  AuthUser,
  CreateUserInput,
  MasterStatus,
  PermissionRole,
  User,
} from '../../types'
import type { SettingsSectionProps } from '../Settings'

const roles: PermissionRole[] = [
  'Owner',
  'Admin',
  'Accountant',
  'Teacher',
  'Viewer',
]

type DrawerMode = 'create' | 'edit' | 'password' | null

const initialForm: CreateUserInput = {
  name: '',
  email: '',
  username: '',
  password: '',
  role: 'Viewer',
  status: 'Active',
}

interface UsersRolesSettingsProps extends SettingsSectionProps {
  currentUser: AuthUser
}

export function UsersRolesSettings({
  currentUser,
  onNotice,
}: UsersRolesSettingsProps) {
  const [users, setUsers] = useState<User[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [form, setForm] = useState<CreateUserInput>(initialForm)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const loadData = useCallback(async () => {
    const [userRows, logs] = await Promise.all([
      getErpApi().getUsers(),
      getErpApi().getAuditLogs(12),
    ])
    setUsers(userRows)
    setAuditLogs(logs)
  }, [])

  useEffect(() => {
    let isCurrent = true
    Promise.resolve()
      .then(loadData)
      .catch((error: unknown) => {
        if (isCurrent) {
          onNotice({ type: 'error', message: getErrorMessage(error) })
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })
    return () => {
      isCurrent = false
    }
  }, [loadData, onNotice])

  const selectableRoles = useMemo(
    () => roles.filter((role) => currentUser.role === 'Owner' || role !== 'Owner'),
    [currentUser.role],
  )

  const closeDrawer = () => {
    setDrawerMode(null)
    setSelectedUser(null)
    setForm(initialForm)
    setConfirmPassword('')
  }

  const openCreate = () => {
    setForm(initialForm)
    setSelectedUser(null)
    setConfirmPassword('')
    setDrawerMode('create')
  }

  const openEdit = (user: User) => {
    setSelectedUser(user)
    setForm({
      name: user.name,
      email: user.email,
      username: user.username,
      password: '',
      role: user.role,
      status: user.status,
    })
    setDrawerMode('edit')
  }

  const openPasswordReset = (user: User) => {
    setSelectedUser(user)
    setForm({ ...initialForm, password: '' })
    setConfirmPassword('')
    setDrawerMode('password')
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (
      (drawerMode === 'create' || drawerMode === 'password') &&
      form.password !== confirmPassword
    ) {
      onNotice({ type: 'error', message: 'Passwords do not match.' })
      return
    }

    setIsSaving(true)
    try {
      if (drawerMode === 'create') {
        await getErpApi().createUser(form)
        onNotice({ type: 'success', message: 'User account created.' })
      } else if (drawerMode === 'edit' && selectedUser) {
        await getErpApi().updateUser(selectedUser.id, {
          name: form.name,
          email: form.email,
          role: form.role,
          status: form.status,
        })
        onNotice({ type: 'success', message: 'User account updated.' })
      } else if (drawerMode === 'password' && selectedUser) {
        await getErpApi().resetUserPassword(selectedUser.id, form.password)
        onNotice({ type: 'success', message: 'User password reset.' })
      }
      await loadData()
      closeDrawer()
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  const deleteUser = async (user: User) => {
    if (!window.confirm(`Delete the account for ${user.name}?`)) return
    try {
      const result = await getErpApi().deleteUser(user.id)
      if (!result.success) throw new Error('The user account could not be deleted.')
      onNotice({ type: 'success', message: `${user.name} was removed.` })
      await loadData()
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const canManageTarget = (user: User) =>
    currentUser.role === 'Owner' || user.role !== 'Owner'

  const columns: TableColumn<User>[] = [
    {
      key: 'user',
      header: 'User',
      render: (user) => (
        <div className="person-cell">
          <span className="person-avatar person-avatar--blue">
            {user.name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <strong>{user.name}</strong>
            <span>@{user.username}</span>
          </div>
        </div>
      ),
    },
    { key: 'email', header: 'Email', render: (user) => user.email || '—' },
    {
      key: 'role',
      header: 'Role',
      render: (user) => <span className="neutral-badge">{user.role}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (user) => (
        <span className={`status-badge status-badge--${user.status.toLowerCase()}`}>
          {user.status}
        </span>
      ),
    },
    {
      key: 'last-login',
      header: 'Last Login',
      render: (user) =>
        user.lastLoginAt
          ? new Date(user.lastLoginAt).toLocaleString('en-IN')
          : 'Never',
    },
    {
      key: 'actions',
      header: '',
      className: 'align-right',
      render: (user) => (
        <div className="row-action-group">
          <button
            aria-label={`Edit ${user.name}`}
            className="row-action"
            disabled={!canManageTarget(user)}
            onClick={() => openEdit(user)}
            title="Edit user"
            type="button"
          >
            <Icon name="edit" size={14} />
          </button>
          <button
            aria-label={`Reset password for ${user.name}`}
            className="row-action"
            disabled={!canManageTarget(user)}
            onClick={() => openPasswordReset(user)}
            title="Reset password"
            type="button"
          >
            <Icon name="user" size={14} />
          </button>
          <button
            aria-label={`Delete ${user.name}`}
            className="row-action row-action--danger"
            disabled={user.id === currentUser.id || !canManageTarget(user)}
            onClick={() => void deleteUser(user)}
            title="Delete user"
            type="button"
          >
            <Icon name="trash" size={14} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="users-settings-layout">
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Users & Roles</h3>
            <p>Local accounts and their ERP access level</p>
          </div>
          <button className="primary-button" onClick={openCreate} type="button">
            <Icon name="plus" size={16} />
            Add User
          </button>
        </div>
        <DataTable
          columns={columns}
          emptyMessage={isLoading ? 'Loading users...' : 'No user accounts found.'}
          getRowKey={(user) => user.id}
          rows={users}
        />
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Recent Security Activity</h3>
            <p>Latest login and account-management audit entries</p>
          </div>
        </div>
        <div className="audit-log-list">
          {auditLogs.map((log) => (
            <article key={log.id}>
              <span className="audit-log-icon">
                <Icon name="check" size={14} />
              </span>
              <div>
                <strong>{log.action}</strong>
                <p>{log.details || log.module || 'Local ERP action'}</p>
              </div>
              <small>
                {log.userName} · {new Date(log.createdAt).toLocaleString('en-IN')}
              </small>
            </article>
          ))}
          {!isLoading && auditLogs.length === 0 && (
            <p className="empty-result">No audit activity recorded yet.</p>
          )}
        </div>
      </section>

      {drawerMode && (
        <div className="drawer-backdrop" role="presentation" onMouseDown={closeDrawer}>
          <aside
            className="form-drawer"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="drawer-header">
              <div>
                <h2>
                  {drawerMode === 'create'
                    ? 'Add User'
                    : drawerMode === 'edit'
                      ? 'Edit User'
                      : 'Reset Password'}
                </h2>
                <p>
                  {drawerMode === 'password'
                    ? `Set a new local password for ${selectedUser?.name}.`
                    : 'Configure the local account and access role.'}
                </p>
              </div>
              <button className="icon-button" onClick={closeDrawer} type="button">
                <Icon name="close" size={18} />
              </button>
            </div>
            <form className="drawer-form" onSubmit={(event) => void handleSubmit(event)}>
              {drawerMode !== 'password' && (
                <>
                  <label className="form-field">
                    <span>Name</span>
                    <input
                      onChange={(event) => setForm({ ...form, name: event.target.value })}
                      required
                      value={form.name}
                    />
                  </label>
                  <label className="form-field">
                    <span>Username</span>
                    <input
                      disabled={drawerMode === 'edit'}
                      onChange={(event) =>
                        setForm({ ...form, username: event.target.value })
                      }
                      required
                      value={form.username}
                    />
                  </label>
                  <label className="form-field">
                    <span>Email (optional)</span>
                    <input
                      onChange={(event) => setForm({ ...form, email: event.target.value })}
                      type="email"
                      value={form.email}
                    />
                  </label>
                  <div className="form-row">
                    <label className="form-field">
                      <span>Role</span>
                      <select
                        onChange={(event) =>
                          setForm({
                            ...form,
                            role: event.target.value as PermissionRole,
                          })
                        }
                        value={form.role}
                      >
                        {selectableRoles.map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </label>
                    <label className="form-field">
                      <span>Status</span>
                      <select
                        onChange={(event) =>
                          setForm({
                            ...form,
                            status: event.target.value as MasterStatus,
                          })
                        }
                        value={form.status}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </label>
                  </div>
                </>
              )}
              {(drawerMode === 'create' || drawerMode === 'password') && (
                <>
                  <label className="form-field">
                    <span>New Password</span>
                    <input
                      minLength={8}
                      onChange={(event) =>
                        setForm({ ...form, password: event.target.value })
                      }
                      required
                      type="password"
                      value={form.password}
                    />
                    <small>Use at least 8 characters.</small>
                  </label>
                  <label className="form-field">
                    <span>Confirm Password</span>
                    <input
                      minLength={8}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                      type="password"
                      value={confirmPassword}
                    />
                  </label>
                </>
              )}
              <div className="drawer-actions">
                <button className="secondary-button" onClick={closeDrawer} type="button">
                  Cancel
                </button>
                <button className="primary-button" disabled={isSaving} type="submit">
                  <Icon name="check" size={16} />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </div>
  )
}
