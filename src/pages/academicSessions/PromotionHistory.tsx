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
import type { StudentPromotion } from '../../types'
import type { AcademicSessionsChildProps } from './types'

export function PromotionHistory({
  data,
  onNotice,
}: AcademicSessionsChildProps) {
  const [selectedId, setSelectedId] = useState(data.promotions[0]?.id ?? '')
  const [promotion, setPromotion] = useState<StudentPromotion | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const effectiveId = data.promotions.some((item) => item.id === selectedId)
    ? selectedId
    : data.promotions[0]?.id ?? ''

  useEffect(() => {
    let current = true
    if (!effectiveId) {
      void Promise.resolve().then(() => {
        if (current) setPromotion(null)
      })
      return () => {
        current = false
      }
    }
    void Promise.resolve().then(() => {
      if (current) setIsLoading(true)
    })
    void getAcademicSessionsErpApi()
      .getStudentPromotionById(effectiveId)
      .then((result) => {
        if (current) setPromotion(result)
      })
      .catch((error: unknown) => {
        if (current) {
          setPromotion(null)
          onNotice({ type: 'error', message: getErrorMessage(error) })
        }
      })
      .finally(() => {
        if (current) setIsLoading(false)
      })
    return () => {
      current = false
    }
  }, [effectiveId, onNotice])

  const exportPromotion = () => {
    if (!promotion) return
    exportCsv(
      `promotion-${promotion.promotionNo}.csv`,
      [
        'Admission No',
        'Student Name',
        'Old Class',
        'Old Section',
        'Action',
        'New Class',
        'New Section',
        'Old Due',
        'Carried Forward',
        'Remarks',
      ],
      promotion.items.map((item) => [
        item.admissionNo,
        item.studentName,
        item.oldClass,
        item.oldSection,
        item.action,
        item.newClass,
        item.newSection,
        item.oldDueAmount,
        item.carriedForwardAmount,
        item.remarks,
      ]),
    )
    onNotice({
      type: 'success',
      message: `${promotion.items.length} promotion item(s) exported.`,
    })
  }

  return (
    <div className="promotion-history-layout">
      <section className="panel promotion-batch-list">
        <div className="panel-heading">
          <div>
            <h3>Promotion History</h3>
            <p>Open a completed batch to view its preserved student actions.</p>
          </div>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Promotion No</th>
                <th>Sessions</th>
                <th>Class / Section</th>
                <th>Date</th>
                <th>Promoted</th>
                <th>Repeated</th>
                <th>TC / Left</th>
                <th>Carried Due</th>
              </tr>
            </thead>
            <tbody>
              {data.promotions.map((item) => (
                <tr
                  className={effectiveId === item.id ? 'table-row--selected' : ''}
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                >
                  <td><strong>{item.promotionNo}</strong></td>
                  <td>{item.fromSessionName} → {item.toSessionName}</td>
                  <td>
                    {item.fromClass}
                    {item.fromSection ? ` / ${item.fromSection}` : ''}
                  </td>
                  <td>{formatReportDate(item.promotionDate)}</td>
                  <td>{item.promotedCount}</td>
                  <td>{item.repeatedCount}</td>
                  <td>{item.tcCount} / {item.leftCount}</td>
                  <td>{formatCurrency(item.carryForwardDues)}</td>
                </tr>
              ))}
              {data.promotions.length === 0 && (
                <tr>
                  <td className="empty-table" colSpan={8}>
                    No promotion batches have been completed.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {promotion && (
        <section className="panel promotion-detail-panel">
          <div className="promotion-report-toolbar">
            <div>
              <h3>{promotion.promotionNo}</h3>
              <p>{promotion.fromSessionName} to {promotion.toSessionName}</p>
            </div>
            <div>
              <button
                className="secondary-button"
                onClick={exportPromotion}
                type="button"
              >
                <Icon name="download" size={16} />
                Export CSV
              </button>
              <button
                className="primary-button"
                onClick={() => window.setTimeout(() => window.print(), 50)}
                type="button"
              >
                <Icon name="print" size={16} />
                Print Report
              </button>
            </div>
          </div>
          <div className="promotion-print-area">
            <header className="academic-print-header">
              <div>
                <span>Student Promotion Report</span>
                <h2>{data.settings.schoolName || 'Vidhya School ERP'}</h2>
                <p>
                  {[data.settings.address, data.settings.phone, data.settings.email]
                    .filter(Boolean)
                    .join(' · ') || 'Offline School Management System'}
                </p>
              </div>
              <div>
                <strong>{promotion.promotionNo}</strong>
                <span>{promotion.fromSessionName} → {promotion.toSessionName}</span>
                <small>Generated {formatGeneratedAt()}</small>
              </div>
            </header>
            <div className="promotion-print-summary">
              <div><span>Total</span><strong>{promotion.totalStudents}</strong></div>
              <div><span>Promoted</span><strong>{promotion.promotedCount}</strong></div>
              <div><span>Repeated</span><strong>{promotion.repeatedCount}</strong></div>
              <div><span>TC</span><strong>{promotion.tcCount}</strong></div>
              <div><span>Left</span><strong>{promotion.leftCount}</strong></div>
              <div><span>Carried Due</span><strong>{formatCurrency(promotion.carryForwardDues)}</strong></div>
            </div>
            <div className="table-scroll">
              <table className="data-table promotion-detail-table">
                <thead>
                  <tr>
                    <th>Admission No</th>
                    <th>Student</th>
                    <th>Old Class</th>
                    <th>Action</th>
                    <th>New Class</th>
                    <th>Old Due</th>
                    <th>Carried</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {promotion.items.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.admissionNo}</strong></td>
                      <td>{item.studentName}</td>
                      <td>{item.oldClass}{item.oldSection ? ` / ${item.oldSection}` : ''}</td>
                      <td>{item.action}</td>
                      <td>{item.newClass ? `${item.newClass}${item.newSection ? ` / ${item.newSection}` : ''}` : '—'}</td>
                      <td>{formatCurrency(item.oldDueAmount)}</td>
                      <td>{formatCurrency(item.carriedForwardAmount)}</td>
                      <td>{item.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {isLoading && (
        <div className="academic-loading-overlay">
          <span className="loading-spinner" />
        </div>
      )}
    </div>
  )
}
