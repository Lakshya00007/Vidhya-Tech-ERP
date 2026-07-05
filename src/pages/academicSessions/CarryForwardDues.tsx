import { useEffect, useState } from 'react'
import { Icon } from '../../components/Icon'
import {
  getAcademicSessionsErpApi,
  getErrorMessage,
} from '../../lib/erpApi'
import {
  exportCsv,
  formatCurrency,
  formatGeneratedAt,
} from '../../lib/reportUtils'
import type { CarryForwardDue, CarryForwardDueStatus } from '../../types'
import type { AcademicSessionsChildProps } from './types'

export function CarryForwardDues({
  data,
  onNotice,
}: AcademicSessionsChildProps) {
  const [toSessionId, setToSessionId] = useState(
    data.currentSession?.id ?? '',
  )
  const [className, setClassName] = useState('')
  const [section, setSection] = useState('')
  const [status, setStatus] = useState<CarryForwardDueStatus | ''>('')
  const [dues, setDues] = useState<CarryForwardDue[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const sections = data.sections.filter(
    (item) => item.status === 'Active' && item.className === className,
  )
  const canWaive = data.role === 'Owner' || data.role === 'Admin'
  const total = dues.reduce((sum, due) => sum + due.carriedAmount, 0)
  const pending = dues
    .filter((due) => due.status === 'Pending')
    .reduce((sum, due) => sum + due.carriedAmount, 0)

  useEffect(() => {
    let current = true
    void Promise.resolve().then(() => {
      if (current) setIsLoading(true)
    })
    void getAcademicSessionsErpApi()
      .getCarryForwardDues({
        toSessionId,
        className,
        section,
        status,
      })
      .then((rows) => {
        if (current) setDues(rows)
      })
      .catch((error: unknown) => {
        if (current) {
          setDues([])
          onNotice({ type: 'error', message: getErrorMessage(error) })
        }
      })
      .finally(() => {
        if (current) setIsLoading(false)
      })
    return () => {
      current = false
    }
  }, [className, onNotice, section, status, toSessionId])

  const refresh = async () => {
    setDues(
      await getAcademicSessionsErpApi().getCarryForwardDues({
        toSessionId,
        className,
        section,
        status,
      }),
    )
  }

  const markPaid = async (due: CarryForwardDue) => {
    try {
      await getAcademicSessionsErpApi().updateCarryForwardDue(due.id, {
        status: 'Paid',
      })
      await refresh()
      onNotice({
        type: 'success',
        message: `Carry-forward due for ${due.studentName} marked paid.`,
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const waiveDue = async (due: CarryForwardDue) => {
    const reason = window.prompt(
      `Reason for waiving ${formatCurrency(due.carriedAmount)} for ${due.studentName}:`,
    )
    if (reason === null) return
    if (!reason.trim()) {
      onNotice({ type: 'error', message: 'A waiver reason is required.' })
      return
    }
    try {
      await getAcademicSessionsErpApi().waiveCarryForwardDue(
        due.id,
        reason,
      )
      await refresh()
      onNotice({
        type: 'success',
        message: `Carry-forward due for ${due.studentName} was waived.`,
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const exportDues = () => {
    exportCsv(
      'carry-forward-dues.csv',
      [
        'Admission No',
        'Student Name',
        'Class',
        'Section',
        'From Session',
        'To Session',
        'Old Due',
        'Carried Amount',
        'Status',
      ],
      dues.map((due) => [
        due.admissionNo,
        due.studentName,
        due.className,
        due.section,
        due.fromSessionName,
        due.toSessionName,
        due.oldDueAmount,
        due.carriedAmount,
        due.status,
      ]),
    )
    onNotice({
      type: 'success',
      message: `${dues.length} carry-forward due row(s) exported.`,
    })
  }

  return (
    <section className="panel carry-forward-panel">
      <div className="carry-forward-toolbar">
        <div>
          <h3>Carry Forward Fee Dues</h3>
          <p>Track balances brought into a new academic session.</p>
        </div>
        <div>
          <button
            className="secondary-button"
            disabled={dues.length === 0}
            onClick={exportDues}
            type="button"
          >
            <Icon name="download" size={16} />
            Export CSV
          </button>
          <button
            className="primary-button"
            disabled={dues.length === 0}
            onClick={() => window.setTimeout(() => window.print(), 50)}
            type="button"
          >
            <Icon name="print" size={16} />
            Print Due List
          </button>
        </div>
      </div>

      <div className="carry-forward-filters">
        <label className="form-field">
          <span>To Session</span>
          <select
            onChange={(event) => setToSessionId(event.target.value)}
            value={toSessionId}
          >
            <option value="">All Sessions</option>
            {data.sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.sessionName}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>Class</span>
          <select
            onChange={(event) => {
              setClassName(event.target.value)
              setSection('')
            }}
            value={className}
          >
            <option value="">All Classes</option>
            {data.classes
              .filter((item) => item.status === 'Active')
              .map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
          </select>
        </label>
        <label className="form-field">
          <span>Section</span>
          <select
            disabled={!className}
            onChange={(event) => setSection(event.target.value)}
            value={section}
          >
            <option value="">All Sections</option>
            {sections.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>Status</span>
          <select
            onChange={(event) =>
              setStatus(event.target.value as CarryForwardDueStatus | '')
            }
            value={status}
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Waived">Waived</option>
          </select>
        </label>
      </div>

      <div className="carry-forward-print-area">
        <header className="academic-print-header">
          <div>
            <span>Carry Forward Fee Due List</span>
            <h2>{data.settings.schoolName || 'Vidhya School ERP'}</h2>
            <p>
              {[data.settings.address, data.settings.phone, data.settings.email]
                .filter(Boolean)
                .join(' · ') || 'Offline School Management System'}
            </p>
          </div>
          <div>
            <strong>{dues.length} Record(s)</strong>
            <span>Pending {formatCurrency(pending)}</span>
            <small>Generated {formatGeneratedAt()}</small>
          </div>
        </header>
        <div className="carry-forward-summary">
          <div><span>Total Listed</span><strong>{formatCurrency(total)}</strong></div>
          <div><span>Pending Balance</span><strong>{formatCurrency(pending)}</strong></div>
          <div><span>Records</span><strong>{dues.length}</strong></div>
        </div>
        <div className="table-scroll">
          <table className="data-table carry-forward-table">
            <thead>
              <tr>
                <th>Admission No</th>
                <th>Student</th>
                <th>Class / Section</th>
                <th>From Session</th>
                <th>To Session</th>
                <th>Old Due</th>
                <th>Amount</th>
                <th>Status</th>
                <th className="carry-forward-screen-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="empty-table" colSpan={9}>Loading carried dues...</td></tr>
              ) : dues.length === 0 ? (
                <tr><td className="empty-table" colSpan={9}>No carry-forward dues match these filters.</td></tr>
              ) : (
                dues.map((due) => (
                  <tr key={due.id}>
                    <td><strong>{due.admissionNo}</strong></td>
                    <td>{due.studentName}</td>
                    <td>{due.className}{due.section ? ` / ${due.section}` : ''}</td>
                    <td>{due.fromSessionName}</td>
                    <td>{due.toSessionName}</td>
                    <td>{formatCurrency(due.oldDueAmount)}</td>
                    <td>{formatCurrency(due.carriedAmount)}</td>
                    <td><span className={`carry-status carry-status--${due.status.toLowerCase()}`}>{due.status}</span></td>
                    <td className="carry-forward-screen-actions">
                      <div className="session-row-actions">
                        {due.status === 'Pending' && (
                          <button
                            className="secondary-button secondary-button--small"
                            onClick={() => void markPaid(due)}
                            type="button"
                          >
                            Mark Paid
                          </button>
                        )}
                        {canWaive && due.status === 'Pending' && (
                          <button
                            className="secondary-button secondary-button--small"
                            onClick={() => void waiveDue(due)}
                            type="button"
                          >
                            Waive
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
