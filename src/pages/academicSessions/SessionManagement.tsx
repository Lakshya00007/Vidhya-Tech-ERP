import { useState } from 'react'
import { Icon } from '../../components/Icon'
import {
  getAcademicSessionsErpApi,
  getErrorMessage,
} from '../../lib/erpApi'
import { formatReportDate } from '../../lib/reportUtils'
import type { AcademicSession } from '../../types'
import type { AcademicSessionsChildProps } from './types'

const emptyForm = {
  sessionName: '',
  startDate: '',
  endDate: '',
}

export function SessionManagement({
  data,
  onNotice,
  onRefresh,
}: AcademicSessionsChildProps) {
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState('')
  const [nextSessionId, setNextSessionId] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const resetForm = () => {
    setEditingId('')
    setForm(emptyForm)
  }

  const editSession = (session: AcademicSession) => {
    setEditingId(session.id)
    setForm({
      sessionName: session.sessionName,
      startDate: session.startDate,
      endDate: session.endDate,
    })
  }

  const saveSession = async () => {
    if (!form.sessionName.trim()) {
      onNotice({ type: 'error', message: 'Session name is required.' })
      return
    }
    setIsSaving(true)
    try {
      const api = getAcademicSessionsErpApi()
      if (editingId) {
        await api.updateAcademicSession(editingId, form)
      } else {
        const created = await api.createAcademicSession(form)
        if (!data.currentSession) {
          await api.setCurrentAcademicSession(created.id)
        }
      }
      await onRefresh()
      onNotice({
        type: 'success',
        message: editingId
          ? 'Academic session updated.'
          : data.currentSession
            ? 'Academic session created.'
            : 'Academic session created and set as current.',
      })
      resetForm()
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  const setCurrent = async (session: AcademicSession) => {
    if (
      !window.confirm(
        `Set ${session.sessionName} as the current academic session? Active students will be assigned to it when history is missing.`,
      )
    ) {
      return
    }
    try {
      await getAcademicSessionsErpApi().setCurrentAcademicSession(session.id)
      await onRefresh()
      onNotice({
        type: 'success',
        message: `${session.sessionName} is now the current session.`,
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const closeSession = async (session: AcademicSession) => {
    const api = getAcademicSessionsErpApi()
    if (session.isCurrent) {
      if (!nextSessionId || nextSessionId === session.id) {
        onNotice({
          type: 'error',
          message: 'Select the next session before closing the current session.',
        })
        return
      }
      if (
        !window.confirm(
          `Set the selected next session as current and close ${session.sessionName}?`,
        )
      ) {
        return
      }
      try {
        await api.setCurrentAcademicSession(nextSessionId)
        await api.closeAcademicSession(session.id)
        await onRefresh()
        setNextSessionId('')
        onNotice({
          type: 'success',
          message: `${session.sessionName} was closed and the next session is current.`,
        })
      } catch (error) {
        onNotice({ type: 'error', message: getErrorMessage(error) })
      }
      return
    }
    if (!window.confirm(`Close academic session ${session.sessionName}?`)) {
      return
    }
    try {
      await api.closeAcademicSession(session.id)
      await onRefresh()
      onNotice({
        type: 'success',
        message: `${session.sessionName} was closed.`,
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const deleteSession = async (session: AcademicSession) => {
    if (!window.confirm(`Delete unused session ${session.sessionName}?`)) {
      return
    }
    try {
      const result =
        await getAcademicSessionsErpApi().deleteAcademicSession(session.id)
      if (!result.success) throw new Error('Academic session was not found.')
      await onRefresh()
      onNotice({
        type: 'success',
        message: `${session.sessionName} was deleted.`,
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const nextSessionOptions = data.sessions.filter(
    (session) =>
      !session.isCurrent &&
      session.status !== 'Closed' &&
      session.id !== data.currentSession?.id,
  )

  return (
    <div className="academic-session-management">
      <section className="academic-current-session">
        <div>
          <span>Current Academic Session</span>
          <strong>
            {data.currentSession?.sessionName || 'No current session configured'}
          </strong>
          <small>
            {data.currentSession
              ? `${data.currentSession.startDate ? formatReportDate(data.currentSession.startDate) : 'Start date not set'} – ${
                  data.currentSession.endDate
                    ? formatReportDate(data.currentSession.endDate)
                    : 'End date not set'
                }`
              : 'Create the first session to begin session-wise history.'}
          </small>
        </div>
        <Icon name="calendar" size={32} />
      </section>

      <div className="academic-session-grid">
        <section className="panel academic-session-form">
          <div className="panel-heading">
            <div>
              <h3>{editingId ? 'Edit Session' : 'Create Academic Session'}</h3>
              <p>Configure the yearly date range before admitting or promoting students.</p>
            </div>
          </div>
          <label className="form-field">
            <span>Session Name *</span>
            <input
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  sessionName: event.target.value,
                }))
              }
              placeholder="e.g. 2026-27"
              value={form.sessionName}
            />
          </label>
          <label className="form-field">
            <span>Start Date</span>
            <input
              max={form.endDate || undefined}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  startDate: event.target.value,
                }))
              }
              type="date"
              value={form.startDate}
            />
          </label>
          <label className="form-field">
            <span>End Date</span>
            <input
              min={form.startDate || undefined}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  endDate: event.target.value,
                }))
              }
              type="date"
              value={form.endDate}
            />
          </label>
          <div className="academic-session-form-actions">
            {editingId && (
              <button
                className="secondary-button"
                onClick={resetForm}
                type="button"
              >
                Cancel
              </button>
            )}
            <button
              className="primary-button"
              disabled={isSaving}
              onClick={() => void saveSession()}
              type="button"
            >
              <Icon name={editingId ? 'check' : 'plus'} size={16} />
              {isSaving
                ? 'Saving...'
                : editingId
                  ? 'Update Session'
                  : 'Create Session'}
            </button>
          </div>
        </section>

        <section className="panel academic-session-list">
          <div className="panel-heading academic-session-list-heading">
            <div>
              <h3>Academic Sessions</h3>
              <p>Only one session can be current at any time.</p>
            </div>
            {data.currentSession && nextSessionOptions.length > 0 && (
              <label className="form-field">
                <span>Next session when closing current</span>
                <select
                  onChange={(event) => setNextSessionId(event.target.value)}
                  value={nextSessionId}
                >
                  <option value="">Select next session</option>
                  {nextSessionOptions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.sessionName}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Date Range</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.sessions.map((session) => (
                  <tr key={session.id}>
                    <td>
                      <strong>{session.sessionName}</strong>
                      {session.isCurrent && (
                        <small className="table-secondary-text">Current session</small>
                      )}
                    </td>
                    <td>
                      {session.startDate
                        ? formatReportDate(session.startDate)
                        : '—'}{' '}
                      –{' '}
                      {session.endDate
                        ? formatReportDate(session.endDate)
                        : '—'}
                    </td>
                    <td>
                      <span className={`session-status session-status--${session.status.toLowerCase()}`}>
                        {session.status}
                      </span>
                    </td>
                    <td>
                      <div className="session-row-actions">
                        {session.status !== 'Closed' && (
                          <button
                            className="secondary-button secondary-button--small"
                            onClick={() => editSession(session)}
                            type="button"
                          >
                            Edit
                          </button>
                        )}
                        {!session.isCurrent && session.status !== 'Closed' && (
                          <button
                            className="secondary-button secondary-button--small"
                            onClick={() => void setCurrent(session)}
                            type="button"
                          >
                            Set Current
                          </button>
                        )}
                        {session.status !== 'Closed' && (
                          <button
                            className="secondary-button secondary-button--small"
                            onClick={() => void closeSession(session)}
                            type="button"
                          >
                            Close
                          </button>
                        )}
                        {!session.isCurrent && session.status !== 'Closed' && (
                          <button
                            aria-label={`Delete ${session.sessionName}`}
                            className="icon-button icon-button--danger"
                            onClick={() => void deleteSession(session)}
                            type="button"
                          >
                            <Icon name="trash" size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {data.sessions.length === 0 && (
                  <tr>
                    <td className="empty-table" colSpan={4}>
                      No academic sessions exist. Create the first session.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
