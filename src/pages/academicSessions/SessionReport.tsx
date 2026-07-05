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
  formatReportDate,
} from '../../lib/reportUtils'
import type { SessionReport as SessionReportData } from '../../types'
import type { AcademicSessionsChildProps } from './types'

export function SessionReport({
  data,
  onNotice,
}: AcademicSessionsChildProps) {
  const [sessionId, setSessionId] = useState(
    data.currentSession?.id ?? data.sessions[0]?.id ?? '',
  )
  const [report, setReport] = useState<SessionReportData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const effectiveSessionId = data.sessions.some(
    (session) => session.id === sessionId,
  )
    ? sessionId
    : data.currentSession?.id ?? data.sessions[0]?.id ?? ''

  useEffect(() => {
    let current = true
    if (!effectiveSessionId) {
      void Promise.resolve().then(() => {
        if (current) setReport(null)
      })
      return () => {
        current = false
      }
    }
    void Promise.resolve().then(() => {
      if (current) setIsLoading(true)
    })
    void getAcademicSessionsErpApi()
      .getPromotionReport({ sessionId: effectiveSessionId })
      .then((result) => {
        if (current) setReport(result)
      })
      .catch((error: unknown) => {
        if (current) {
          setReport(null)
          onNotice({ type: 'error', message: getErrorMessage(error) })
        }
      })
      .finally(() => {
        if (current) setIsLoading(false)
      })
    return () => {
      current = false
    }
  }, [effectiveSessionId, onNotice])

  const exportReport = () => {
    if (!report) return
    exportCsv(
      `session-report-${report.session.sessionName}.csv`,
      ['Class', 'Section', 'Active Students'],
      report.classCounts.map((item) => [
        item.className,
        item.section,
        item.studentCount,
      ]),
    )
    onNotice({
      type: 'success',
      message: `${report.classCounts.length} class summary row(s) exported.`,
    })
  }

  if (data.sessions.length === 0) {
    return (
      <section className="panel document-empty-state">
        <Icon name="calendar" size={28} />
        <h3>Create an academic session to view its report.</h3>
      </section>
    )
  }

  return (
    <section className="panel session-report-panel">
      <div className="session-report-toolbar">
        <div>
          <h3>Academic Session Report</h3>
          <p>Student movement, current strength and carried dues by session.</p>
        </div>
        <div>
          <label className="form-field">
            <span>Academic Session</span>
            <select
              onChange={(event) => setSessionId(event.target.value)}
              value={effectiveSessionId}
            >
              {data.sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.sessionName}
                </option>
              ))}
            </select>
          </label>
          <button
            className="secondary-button"
            disabled={!report}
            onClick={exportReport}
            type="button"
          >
            <Icon name="download" size={16} />
            Export CSV
          </button>
          <button
            className="primary-button"
            disabled={!report}
            onClick={() => window.setTimeout(() => window.print(), 50)}
            type="button"
          >
            <Icon name="print" size={16} />
            Print Report
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="document-empty-state">
          <span className="loading-spinner" />
          <h3>Loading session report...</h3>
        </div>
      ) : report ? (
        <div className="session-report-print-area">
          <header className="academic-print-header">
            <div>
              <span>Academic Session Report</span>
              <h2>{data.settings.schoolName || 'Vidhya School ERP'}</h2>
              <p>
                {[data.settings.address, data.settings.phone, data.settings.email]
                  .filter(Boolean)
                  .join(' · ') || 'Offline School Management System'}
              </p>
            </div>
            <div>
              <strong>{report.session.sessionName}</strong>
              <span>
                {report.session.startDate
                  ? formatReportDate(report.session.startDate)
                  : 'Start not set'}{' '}
                –{' '}
                {report.session.endDate
                  ? formatReportDate(report.session.endDate)
                  : 'End not set'}
              </span>
              <small>Generated {formatGeneratedAt()}</small>
            </div>
          </header>
          <div className="session-report-summary">
            {[
              ['Active Students', report.summary.totalActiveStudents],
              ['New Admissions', report.summary.newAdmissions],
              ['Promoted In', report.summary.promotedStudents],
              ['Repeated In', report.summary.repeatedStudents],
              ['TC', report.summary.tcStudents],
              ['Left', report.summary.leftStudents],
              ['Inactive', report.summary.inactiveStudents],
              ['Carried Dues', formatCurrency(report.summary.totalCarriedDues)],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <div className="session-class-summary">
            <h3>Class-wise Active Student Count</h3>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Section</th>
                    <th>Active Students</th>
                  </tr>
                </thead>
                <tbody>
                  {report.classCounts.map((item) => (
                    <tr key={`${item.className}-${item.section}`}>
                      <td><strong>{item.className}</strong></td>
                      <td>{item.section || 'All / Unassigned'}</td>
                      <td>{item.studentCount}</td>
                    </tr>
                  ))}
                  {report.classCounts.length === 0 && (
                    <tr>
                      <td className="empty-table" colSpan={3}>
                        No active student history found for this session.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="document-empty-state">
          <Icon name="reports" size={28} />
          <h3>No session report data is available.</h3>
        </div>
      )}
    </section>
  )
}
