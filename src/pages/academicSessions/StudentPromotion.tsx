import { useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import {
  getAcademicSessionsErpApi,
  getErrorMessage,
} from '../../lib/erpApi'
import { formatCurrency, getTodayValue } from '../../lib/reportUtils'
import type { PromotionAction, PromotionPreviewRow } from '../../types'
import type { AcademicSessionsChildProps } from './types'

const actions: PromotionAction[] = [
  'Promote',
  'Repeat',
  'TC',
  'Left',
  'Inactive',
]

export function StudentPromotion({
  data,
  onNotice,
  onRefresh,
}: AcademicSessionsChildProps) {
  const fromSessionId = data.currentSession?.id ?? ''
  const availableTargets = data.sessions.filter(
    (session) =>
      session.id !== fromSessionId && session.status !== 'Closed',
  )
  const activeClasses = data.classes.filter((item) => item.status === 'Active')
  const [toSessionId, setToSessionId] = useState(
    availableTargets[0]?.id ?? '',
  )
  const [className, setClassName] = useState(activeClasses[0]?.name ?? '')
  const [section, setSection] = useState('')
  const [promotionDate, setPromotionDate] = useState(getTodayValue())
  const [remarks, setRemarks] = useState('')
  const [rows, setRows] = useState<PromotionPreviewRow[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isPromoting, setIsPromoting] = useState(false)

  const sections = data.sections.filter(
    (item) => item.status === 'Active' && item.className === className,
  )
  const summary = useMemo(
    () => ({
      totalStudents: rows.length,
      promote: rows.filter((row) => row.action === 'Promote').length,
      repeat: rows.filter((row) => row.action === 'Repeat').length,
      tc: rows.filter((row) => row.action === 'TC').length,
      left: rows.filter((row) => row.action === 'Left').length,
      inactive: rows.filter((row) => row.action === 'Inactive').length,
      totalDueAmount: rows.reduce(
        (total, row) => total + Number(row.oldDueAmount || 0),
        0,
      ),
      carryForwardAmount: rows.reduce(
        (total, row) =>
          total +
          (row.carryForwardDue ? Number(row.carryForwardAmount || 0) : 0),
        0,
      ),
    }),
    [rows],
  )

  const updateRow = (
    studentId: string,
    update: Partial<PromotionPreviewRow>,
  ) => {
    setRows((current) =>
      current.map((row) =>
        row.studentId === studentId ? { ...row, ...update } : row,
      ),
    )
  }

  const changeAction = (row: PromotionPreviewRow, action: PromotionAction) => {
    const remainsActive = action === 'Promote' || action === 'Repeat'
    updateRow(row.studentId, {
      action,
      newClass:
        action === 'Repeat'
          ? row.currentClass
          : action === 'Promote'
            ? row.newClass
            : '',
      newSection:
        action === 'Repeat'
          ? row.currentSection
          : action === 'Promote'
            ? row.newSection
            : '',
      carryForwardDue: remainsActive ? row.carryForwardDue : false,
      carryForwardAmount: remainsActive ? row.carryForwardAmount : 0,
    })
  }

  const applyBulkAction = (action: PromotionAction, all = false) => {
    setRows((current) =>
      current.map((row) =>
        all || selected.has(row.studentId)
          ? {
              ...row,
              action,
              newClass:
                action === 'Repeat'
                  ? row.currentClass
                  : action === 'Promote'
                    ? row.newClass
                    : '',
              newSection:
                action === 'Repeat'
                  ? row.currentSection
                  : action === 'Promote'
                    ? row.newSection
                    : '',
              carryForwardDue:
                action === 'Promote' || action === 'Repeat'
                  ? row.carryForwardDue
                  : false,
              carryForwardAmount:
                action === 'Promote' || action === 'Repeat'
                  ? row.carryForwardAmount
                  : 0,
            }
          : row,
      ),
    )
  }

  const loadPreview = async () => {
    if (!fromSessionId || !toSessionId || !className) {
      onNotice({
        type: 'error',
        message: 'Select from session, to session and class.',
      })
      return
    }
    setIsLoading(true)
    try {
      const preview = await getAcademicSessionsErpApi().getPromotionPreview({
        fromSessionId,
        toSessionId,
        className,
        section,
      })
      setRows(preview.rows)
      setSelected(new Set())
      onNotice(
        preview.rows.length > 0
          ? {
              type: 'success',
              message: `${preview.rows.length} student(s) loaded for promotion preview.`,
            }
          : {
              type: 'error',
              message: 'No active students found for this class and section.',
            },
      )
    } catch (error) {
      setRows([])
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsLoading(false)
    }
  }

  const runPromotion = async () => {
    if (rows.length === 0) {
      onNotice({ type: 'error', message: 'Load students before promotion.' })
      return
    }
    if (
      rows.some(
        (row) =>
          row.action === 'Promote' &&
          (!row.newClass ||
            (data.sections.some(
              (item) =>
                item.status === 'Active' &&
                item.className === row.newClass,
            ) &&
              !row.newSection)),
      )
    ) {
      onNotice({
        type: 'error',
        message: 'Select a destination class and section for promoted students.',
      })
      return
    }
    if (
      !window.confirm(
        'This action will update students for the new academic session. Old records will be preserved.',
      )
    ) {
      return
    }
    setIsPromoting(true)
    try {
      const promotion =
        await getAcademicSessionsErpApi().promoteStudentsBulk({
          fromSessionId,
          toSessionId,
          fromClass: className,
          fromSection: section,
          promotionDate,
          remarks,
          items: rows.map((row) => ({
            studentId: row.studentId,
            action: row.action,
            newClass: row.newClass,
            newSection: row.newSection,
            oldDueAmount: Number(row.oldDueAmount || 0),
            carryForwardDue: row.carryForwardDue,
            carryForwardAmount: Number(row.carryForwardAmount || 0),
            remarks: row.remarks,
          })),
        })
      await onRefresh()
      setRows([])
      setSelected(new Set())
      onNotice({
        type: 'success',
        message: `${promotion.promotionNo} completed for ${promotion.totalStudents} student(s).`,
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsPromoting(false)
    }
  }

  if (!data.currentSession) {
    return (
      <section className="panel document-empty-state">
        <Icon name="calendar" size={28} />
        <h3>Create and set the current academic session first.</h3>
      </section>
    )
  }

  return (
    <div className="promotion-workspace">
      <section className="panel promotion-filter-panel">
        <div className="panel-heading">
          <div>
            <h3>Promotion Setup</h3>
            <p>Load the current class roster and review every action before committing.</p>
          </div>
        </div>
        <div className="promotion-filter-grid">
          <label className="form-field">
            <span>From Session</span>
            <select disabled value={fromSessionId}>
              <option value={fromSessionId}>
                {data.currentSession.sessionName}
              </option>
            </select>
          </label>
          <label className="form-field">
            <span>To Session</span>
            <select
              onChange={(event) => {
                setToSessionId(event.target.value)
                setRows([])
              }}
              value={toSessionId}
            >
              {availableTargets.length === 0 && (
                <option value="">Create the next session first</option>
              )}
              {availableTargets.map((session) => (
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
                setRows([])
              }}
              value={className}
            >
              {activeClasses.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Section</span>
            <select
              onChange={(event) => {
                setSection(event.target.value)
                setRows([])
              }}
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
            <span>Promotion Date</span>
            <input
              onChange={(event) => setPromotionDate(event.target.value)}
              type="date"
              value={promotionDate}
            />
          </label>
          <button
            className="primary-button promotion-load-button"
            disabled={isLoading || !toSessionId || !className}
            onClick={() => void loadPreview()}
            type="button"
          >
            <Icon name="students" size={16} />
            {isLoading ? 'Loading...' : 'Load Students'}
          </button>
        </div>
      </section>

      {rows.length > 0 && (
        <>
          <section className="promotion-summary-grid">
            {[
              ['Total', summary.totalStudents],
              ['Promote', summary.promote],
              ['Repeat', summary.repeat],
              ['TC', summary.tc],
              ['Left', summary.left],
              ['Inactive', summary.inactive],
              ['Old Due', formatCurrency(summary.totalDueAmount)],
              ['Carry Forward', formatCurrency(summary.carryForwardAmount)],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </section>

          <section className="panel promotion-preview-panel">
            <div className="promotion-bulk-toolbar">
              <div>
                <strong>{selected.size} selected</strong>
                <span>Use bulk actions or edit individual rows.</span>
              </div>
              <div>
                <button
                  className="secondary-button secondary-button--small"
                  onClick={() => applyBulkAction('Promote', true)}
                  type="button"
                >
                  Promote All
                </button>
                <button
                  className="secondary-button secondary-button--small"
                  disabled={selected.size === 0}
                  onClick={() => applyBulkAction('Repeat')}
                  type="button"
                >
                  Repeat Selected
                </button>
                <button
                  className="secondary-button secondary-button--small"
                  disabled={selected.size === 0}
                  onClick={() => applyBulkAction('TC')}
                  type="button"
                >
                  Mark TC
                </button>
                <button
                  className="secondary-button secondary-button--small"
                  disabled={selected.size === 0}
                  onClick={() => applyBulkAction('Left')}
                  type="button"
                >
                  Mark Left
                </button>
              </div>
            </div>
            <div className="table-scroll">
              <table className="data-table promotion-preview-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        aria-label="Select all students"
                        checked={selected.size === rows.length}
                        onChange={(event) =>
                          setSelected(
                            event.target.checked
                              ? new Set(rows.map((row) => row.studentId))
                              : new Set(),
                          )
                        }
                        type="checkbox"
                      />
                    </th>
                    <th>Admission / Student</th>
                    <th>Current Class</th>
                    <th>Old Due</th>
                    <th>Action</th>
                    <th>New Class</th>
                    <th>New Section</th>
                    <th>Carry Due</th>
                    <th>Carry Amount</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const targetSections = data.sections.filter(
                      (item) =>
                        item.status === 'Active' &&
                        item.className === row.newClass,
                    )
                    const isExit = ['TC', 'Left', 'Inactive'].includes(
                      row.action,
                    )
                    return (
                      <tr key={row.studentId}>
                        <td>
                          <input
                            aria-label={`Select ${row.studentName}`}
                            checked={selected.has(row.studentId)}
                            onChange={(event) =>
                              setSelected((current) => {
                                const next = new Set(current)
                                if (event.target.checked) {
                                  next.add(row.studentId)
                                } else {
                                  next.delete(row.studentId)
                                }
                                return next
                              })
                            }
                            type="checkbox"
                          />
                        </td>
                        <td>
                          <strong>{row.admissionNo}</strong>
                          <small className="table-secondary-text">
                            {row.studentName}
                          </small>
                        </td>
                        <td>
                          {row.currentClass}
                          {row.currentSection ? ` / ${row.currentSection}` : ''}
                        </td>
                        <td>
                          <input
                            className="promotion-number-input"
                            min="0"
                            onChange={(event) =>
                              updateRow(row.studentId, {
                                oldDueAmount: Number(event.target.value),
                              })
                            }
                            type="number"
                            value={row.oldDueAmount}
                          />
                        </td>
                        <td>
                          <select
                            className="promotion-table-select"
                            onChange={(event) =>
                              changeAction(
                                row,
                                event.target.value as PromotionAction,
                              )
                            }
                            value={row.action}
                          >
                            {actions.map((action) => (
                              <option key={action} value={action}>
                                {action}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            className="promotion-table-select"
                            disabled={row.action !== 'Promote'}
                            onChange={(event) => {
                              const nextClass = event.target.value
                              const firstSection = data.sections.find(
                                (item) =>
                                  item.status === 'Active' &&
                                  item.className === nextClass,
                              )
                              updateRow(row.studentId, {
                                newClass: nextClass,
                                newSection: firstSection?.name ?? '',
                              })
                            }}
                            value={isExit ? '' : row.newClass}
                          >
                            {isExit && <option value="">—</option>}
                            {activeClasses.map((item) => (
                              <option key={item.id} value={item.name}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            className="promotion-table-select"
                            disabled={row.action !== 'Promote'}
                            onChange={(event) =>
                              updateRow(row.studentId, {
                                newSection: event.target.value,
                              })
                            }
                            value={isExit ? '' : row.newSection}
                          >
                            {(isExit || targetSections.length === 0) && (
                              <option value="">—</option>
                            )}
                            {targetSections.map((item) => (
                              <option key={item.id} value={item.name}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            aria-label={`Carry due for ${row.studentName}`}
                            checked={row.carryForwardDue}
                            disabled={isExit}
                            onChange={(event) =>
                              updateRow(row.studentId, {
                                carryForwardDue: event.target.checked,
                              })
                            }
                            type="checkbox"
                          />
                        </td>
                        <td>
                          <input
                            className="promotion-number-input"
                            disabled={!row.carryForwardDue || isExit}
                            min="0"
                            onChange={(event) =>
                              updateRow(row.studentId, {
                                carryForwardAmount: Number(event.target.value),
                              })
                            }
                            type="number"
                            value={row.carryForwardAmount}
                          />
                        </td>
                        <td>
                          <input
                            className="promotion-remarks-input"
                            onChange={(event) =>
                              updateRow(row.studentId, {
                                remarks: event.target.value,
                              })
                            }
                            placeholder="Optional"
                            value={row.remarks}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="promotion-finalize">
              <label className="form-field">
                <span>Batch Remarks</span>
                <input
                  onChange={(event) => setRemarks(event.target.value)}
                  placeholder="Optional promotion batch note"
                  value={remarks}
                />
              </label>
              <button
                className="primary-button"
                disabled={isPromoting}
                onClick={() => void runPromotion()}
                type="button"
              >
                <Icon name="check" size={16} />
                {isPromoting ? 'Promoting...' : 'Confirm Final Promotion'}
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
