import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { DataTable, type TableColumn } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import {
  getAcademicSessionsErpApi,
  getErpApi,
  getErrorMessage,
  getReportCardsErpApi,
} from '../../lib/erpApi'
import type {
  AcademicSession,
  ClassItem,
  GradingCalculationMode,
  GradingRangeInput,
  GradingResultStatus,
  GradingScheme,
  MasterStatus,
} from '../../types'
import type { SettingsSectionProps } from '../Settings'

interface MarksGradingSettingsProps extends SettingsSectionProps {
  readOnly?: boolean
}

interface SchemeForm {
  name: string
  scope: 'Global' | 'Session' | 'Class'
  academicSessionId: string
  className: string
  calculationMode: GradingCalculationMode
  status: MasterStatus
  isDefault: boolean
  description: string
  ranges: GradingRangeInput[]
}

const defaultRanges: GradingRangeInput[] = [
  { minValue: 90, maxValue: 100, grade: 'A+', gradePoint: 10, resultStatus: 'Pass' },
  { minValue: 80, maxValue: 89.99, grade: 'A', gradePoint: 9, resultStatus: 'Pass' },
  { minValue: 70, maxValue: 79.99, grade: 'B+', gradePoint: 8, resultStatus: 'Pass' },
  { minValue: 60, maxValue: 69.99, grade: 'B', gradePoint: 7, resultStatus: 'Pass' },
  { minValue: 50, maxValue: 59.99, grade: 'C', gradePoint: 6, resultStatus: 'Pass' },
  { minValue: 33, maxValue: 49.99, grade: 'D', gradePoint: 5, resultStatus: 'Pass' },
  { minValue: 0, maxValue: 32.99, grade: 'F', gradePoint: 0, resultStatus: 'Fail' },
]

const emptyForm: SchemeForm = {
  name: '',
  scope: 'Global',
  academicSessionId: '',
  className: '',
  calculationMode: 'Percentage',
  status: 'Active',
  isDefault: false,
  description: '',
  ranges: defaultRanges,
}

const scopeForScheme = (scheme: GradingScheme): SchemeForm['scope'] => {
  if (scheme.className) return 'Class'
  if (scheme.academicSessionId) return 'Session'
  return 'Global'
}

const scopeLabel = (scheme: GradingScheme) => {
  if (scheme.className && scheme.academicSessionName) {
    return `${scheme.academicSessionName} · Class ${scheme.className}`
  }
  if (scheme.className) return `Class ${scheme.className}`
  if (scheme.academicSessionName) return scheme.academicSessionName
  return 'Global'
}

export function MarksGradingSettings({
  onNotice,
  readOnly = false,
}: MarksGradingSettingsProps) {
  const [schemes, setSchemes] = useState<GradingScheme[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [sessions, setSessions] = useState<AcademicSession[]>([])
  const [form, setForm] = useState<SchemeForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [previewValue, setPreviewValue] = useState('75')
  const [preview, setPreview] = useState('')

  const activeClasses = useMemo(
    () => classes.filter((item) => item.status === 'Active'),
    [classes],
  )

  const refreshSchemes = async () => {
    setSchemes(await getReportCardsErpApi().getGradingSchemes())
  }

  useEffect(() => {
    let isCurrent = true
    Promise.resolve()
      .then(() =>
        Promise.all([
          getReportCardsErpApi().getGradingSchemes(),
          getErpApi().getClasses(),
          getAcademicSessionsErpApi().getAcademicSessions(),
        ]),
      )
      .then(([schemeRows, classRows, sessionRows]) => {
        if (!isCurrent) return
        setSchemes(schemeRows)
        setClasses(classRows)
        setSessions(sessionRows)
      })
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
  }, [onNotice])

  const resetForm = () => {
    setEditingId(null)
    setForm(emptyForm)
    setPreview('')
  }

  const editScheme = (scheme: GradingScheme) => {
    setEditingId(scheme.id)
    setForm({
      name: scheme.name,
      scope: scopeForScheme(scheme),
      academicSessionId: scheme.academicSessionId,
      className: scheme.className,
      calculationMode: scheme.calculationMode,
      status: scheme.status,
      isDefault: scheme.isDefault,
      description: scheme.description,
      ranges: scheme.ranges.map((range) => ({
        id: range.id,
        minValue: range.minValue,
        maxValue: range.maxValue,
        grade: range.grade,
        gradePoint: range.gradePoint,
        resultStatus: range.resultStatus,
        description: range.description,
        displayOrder: range.displayOrder,
      })),
    })
    setPreview('')
  }

  const updateRange = (
    index: number,
    patch: Partial<GradingRangeInput>,
  ) => {
    setForm((current) => ({
      ...current,
      ranges: current.ranges.map((range, rangeIndex) =>
        rangeIndex === index ? { ...range, ...patch } : range,
      ),
    }))
  }

  const removeRange = (index: number) => {
    setForm((current) => ({
      ...current,
      ranges: current.ranges.filter((_, rangeIndex) => rangeIndex !== index),
    }))
  }

  const addRange = () => {
    setForm((current) => ({
      ...current,
      ranges: [
        ...current.ranges,
        {
          minValue: 0,
          maxValue: 0,
          grade: '',
          gradePoint: null,
          resultStatus: 'Pass',
          displayOrder: current.ranges.length,
        },
      ],
    }))
  }

  const buildInput = () => ({
    name: form.name,
    academicSessionId:
      form.scope === 'Session' || form.scope === 'Class'
        ? form.academicSessionId
        : '',
    className: form.scope === 'Class' ? form.className : '',
    calculationMode: form.calculationMode,
    status: form.status,
    isDefault: form.isDefault,
    description: form.description,
    ranges: form.ranges.map((range, index) => ({
      ...range,
      minValue: Number(range.minValue),
      maxValue: Number(range.maxValue),
      gradePoint:
        range.gradePoint === null || range.gradePoint === undefined
          ? null
          : Number(range.gradePoint),
      displayOrder: index,
    })),
  })

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (readOnly) return
    setIsSaving(true)
    try {
      if (editingId) {
        await getReportCardsErpApi().updateGradingScheme(editingId, buildInput())
        onNotice({ type: 'success', message: 'Grading scheme updated.' })
      } else {
        await getReportCardsErpApi().createGradingScheme(buildInput())
        onNotice({ type: 'success', message: 'Grading scheme created.' })
      }
      await refreshSchemes()
      resetForm()
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  const setDefault = async (scheme: GradingScheme) => {
    if (readOnly) return
    try {
      await getReportCardsErpApi().setDefaultGradingScheme(scheme.id)
      await refreshSchemes()
      onNotice({ type: 'success', message: `${scheme.name} is now default.` })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const deleteScheme = async (scheme: GradingScheme) => {
    if (readOnly) return
    if (!window.confirm(`Delete grading scheme "${scheme.name}"?`)) return
    try {
      await getReportCardsErpApi().deleteGradingScheme(scheme.id)
      await refreshSchemes()
      if (editingId === scheme.id) resetForm()
      onNotice({ type: 'success', message: 'Grading scheme deleted.' })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const calculatePreview = async () => {
    const value = Number(previewValue)
    if (!Number.isFinite(value)) {
      onNotice({ type: 'error', message: 'Enter a valid preview value.' })
      return
    }
    try {
      const result = await getReportCardsErpApi().calculateGrade({
        value,
        gradingSchemeId: editingId || undefined,
        academicSessionId: form.academicSessionId || undefined,
        className: form.className || undefined,
      })
      setPreview(
        `${result.grade || 'No grade'} · ${result.resultStatus}${
          result.gradePoint == null ? '' : ` · GP ${result.gradePoint}`
        }`,
      )
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const columns: TableColumn<GradingScheme>[] = [
    {
      key: 'name',
      header: 'Scheme',
      render: (scheme) => (
        <div className="primary-cell">
          <strong>{scheme.name}</strong>
          <span>{scheme.description || 'No description'}</span>
        </div>
      ),
    },
    { key: 'scope', header: 'Scope', render: scopeLabel },
    {
      key: 'mode',
      header: 'Mode',
      render: (scheme) => <span className="neutral-badge">{scheme.calculationMode}</span>,
    },
    {
      key: 'default',
      header: 'Default',
      render: (scheme) => (scheme.isDefault ? 'Yes' : 'No'),
    },
    {
      key: 'status',
      header: 'Status',
      render: (scheme) => (
        <span className={`status-badge status-badge--${scheme.status.toLowerCase()}`}>
          {scheme.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'align-right',
      render: (scheme) =>
        readOnly ? (
          <button
            className="table-action-button"
            onClick={() => editScheme(scheme)}
            type="button"
          >
            View
          </button>
        ) : (
          <div className="row-action-group">
            {!scheme.isDefault && (
              <button
                className="table-action-button"
                onClick={() => void setDefault(scheme)}
                type="button"
              >
                Set Default
              </button>
            )}
            <button className="row-action" onClick={() => editScheme(scheme)} type="button">
              <Icon name="edit" size={14} />
            </button>
            <button
              className="row-action row-action--danger"
              onClick={() => void deleteScheme(scheme)}
              type="button"
            >
              <Icon name="trash" size={14} />
            </button>
          </div>
        ),
    },
  ]

  return (
    <section className="master-page-grid master-page-grid--grading">
      <form className="panel master-form-card" onSubmit={(event) => void handleSubmit(event)}>
        <div className="panel-heading">
          <div>
            <h3>{editingId ? 'Edit Grading Scheme' : 'Add Grading Scheme'}</h3>
            <p>Configure grade ranges for exam and report-card results</p>
          </div>
        </div>
        <div className="master-form-fields">
          {readOnly && (
            <div className="form-note">
              <Icon name="lock" size={17} />
              Grading configuration is read-only for your role.
            </div>
          )}
          <label className="form-field">
            <span>Scheme Name</span>
            <input
              disabled={readOnly}
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </label>
          <div className="form-row">
            <label className="form-field">
              <span>Scope</span>
              <select
                disabled={readOnly}
                value={form.scope}
                onChange={(event) =>
                  setForm({
                    ...form,
                    scope: event.target.value as SchemeForm['scope'],
                    className: event.target.value === 'Class' ? form.className : '',
                  })
                }
              >
                <option>Global</option>
                <option>Session</option>
                <option>Class</option>
              </select>
            </label>
            <label className="form-field">
              <span>Mode</span>
              <select
                disabled={readOnly}
                value={form.calculationMode}
                onChange={(event) =>
                  setForm({
                    ...form,
                    calculationMode: event.target.value as GradingCalculationMode,
                  })
                }
              >
                <option>Percentage</option>
                <option>Marks</option>
              </select>
            </label>
          </div>
          {(form.scope === 'Session' || form.scope === 'Class') && (
            <label className="form-field">
              <span>Academic Session</span>
              <select
                disabled={readOnly}
                value={form.academicSessionId}
                onChange={(event) =>
                  setForm({ ...form, academicSessionId: event.target.value })
                }
              >
                <option value="">All sessions</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.sessionName}
                  </option>
                ))}
              </select>
            </label>
          )}
          {form.scope === 'Class' && (
            <label className="form-field">
              <span>Class</span>
              <select
                disabled={readOnly}
                required
                value={form.className}
                onChange={(event) =>
                  setForm({ ...form, className: event.target.value })
                }
              >
                <option value="">Select class</option>
                {activeClasses.map((item) => (
                  <option key={item.id} value={item.name}>
                    Class {item.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="form-row">
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
            <label className="import-checkbox import-checkbox--compact">
              <input
                checked={form.isDefault}
                disabled={readOnly}
                type="checkbox"
                onChange={(event) =>
                  setForm({ ...form, isDefault: event.target.checked })
                }
              />
              <span><strong>Default for scope</strong></span>
            </label>
          </div>
          <label className="form-field">
            <span>Description</span>
            <textarea
              disabled={readOnly}
              rows={3}
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
            />
          </label>
          <div className="grading-ranges-editor">
            <div className="grading-ranges-header">
              <strong>Grade Ranges</strong>
              {!readOnly && (
                <button className="text-button" onClick={addRange} type="button">
                  Add Range
                </button>
              )}
            </div>
            {form.ranges.map((range, index) => (
              <div className="grading-range-row" key={`${range.id ?? 'new'}-${index}`}>
                <input
                  disabled={readOnly}
                  min="0"
                  step="0.01"
                  type="number"
                  value={range.minValue}
                  onChange={(event) =>
                    updateRange(index, { minValue: Number(event.target.value) })
                  }
                />
                <input
                  disabled={readOnly}
                  min="0"
                  step="0.01"
                  type="number"
                  value={range.maxValue}
                  onChange={(event) =>
                    updateRange(index, { maxValue: Number(event.target.value) })
                  }
                />
                <input
                  disabled={readOnly}
                  placeholder="Grade"
                  value={range.grade}
                  onChange={(event) => updateRange(index, { grade: event.target.value })}
                />
                <input
                  disabled={readOnly}
                  min="0"
                  step="0.01"
                  type="number"
                  value={range.gradePoint ?? ''}
                  onChange={(event) =>
                    updateRange(index, {
                      gradePoint: event.target.value ? Number(event.target.value) : null,
                    })
                  }
                />
                <select
                  disabled={readOnly}
                  value={range.resultStatus ?? 'Pass'}
                  onChange={(event) =>
                    updateRange(index, {
                      resultStatus: event.target.value as GradingResultStatus,
                    })
                  }
                >
                  <option>Pass</option>
                  <option>Fail</option>
                </select>
                {!readOnly && (
                  <button
                    aria-label="Remove range"
                    className="row-action row-action--danger"
                    onClick={() => removeRange(index)}
                    type="button"
                  >
                    <Icon name="trash" size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="grading-preview-row">
            <label className="form-field">
              <span>Preview Value</span>
              <input
                step="0.01"
                type="number"
                value={previewValue}
                onChange={(event) => setPreviewValue(event.target.value)}
              />
            </label>
            <button className="secondary-button" onClick={() => void calculatePreview()} type="button">
              Calculate
            </button>
            {preview && <strong>{preview}</strong>}
          </div>
          <div className="master-form-actions">
            {editingId && (
              <button className="secondary-button" onClick={resetForm} type="button">
                Cancel
              </button>
            )}
            {!readOnly && (
              <button className="primary-button" disabled={isSaving} type="submit">
                <Icon name="check" size={17} />
                {isSaving ? 'Saving...' : editingId ? 'Update Scheme' : 'Create Scheme'}
              </button>
            )}
          </div>
        </div>
      </form>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Grading Schemes</h3>
            <p>Defaults are scoped by session and class where configured.</p>
          </div>
        </div>
        <DataTable
          columns={columns}
          emptyMessage={isLoading ? 'Loading grading schemes...' : 'No grading schemes found.'}
          getRowKey={(scheme) => scheme.id}
          rows={schemes}
        />
      </section>
    </section>
  )
}
