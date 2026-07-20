import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { DataTable, type TableColumn } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import {
  getAcademicSessionsErpApi,
  getErpApi,
  getErrorMessage,
} from '../../lib/erpApi'
import { translateText } from '../../lib/i18n'
import { formatPreferenceDate } from '../../lib/preferenceFormat'
import { exportCsv } from '../../lib/reportUtils'
import type {
  AcademicSession,
  AppPreference,
  AuthUser,
  MasterStatus,
  PreferenceLanguage,
  RuleCategory,
  SchoolRule,
  SchoolSettings,
} from '../../types'
import type { SettingsSectionProps } from '../Settings'

interface SchoolRulesSettingsProps extends SettingsSectionProps {
  currentUser: AuthUser
  language: PreferenceLanguage
  preferences: AppPreference
  readOnly?: boolean
}

interface RuleForm {
  title: string
  category: RuleCategory
  ruleText: string
  displayOrder: string
  status: MasterStatus
  academicSessionId: string
  effectiveFrom: string
}

const categories: RuleCategory[] = [
  'General',
  'Fees',
  'Attendance',
  'Discipline',
  'Examination',
  'Transport',
  'Uniform',
  'Library',
  'Safety',
  'Other',
]

const emptyForm: RuleForm = {
  title: '',
  category: 'General',
  ruleText: '',
  displayOrder: '0',
  status: 'Active',
  academicSessionId: '',
  effectiveFrom: '',
}

const fallbackSettings: SchoolSettings = {
  id: 'school-profile',
  schoolName: 'Vidhya School ERP',
  address: '',
  phone: '',
  email: '',
  academicYear: '',
  receiptPrefix: '',
  createdAt: '',
  updatedAt: '',
}

export function SchoolRulesSettings({
  currentUser,
  language,
  onNotice,
  preferences,
  readOnly = false,
}: SchoolRulesSettingsProps) {
  const [rules, setRules] = useState<SchoolRule[]>([])
  const [sessions, setSessions] = useState<AcademicSession[]>([])
  const [settings, setSettings] = useState<SchoolSettings>(fallbackSettings)
  const [form, setForm] = useState<RuleForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<RuleCategory | 'All'>(
    'All',
  )
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const t = (text: string) => translateText(text, language)

  const visibleRules = useMemo(() => {
    const query = search.trim().toLowerCase()
    return rules.filter(
      (rule) =>
        (categoryFilter === 'All' || rule.category === categoryFilter) &&
        (!query ||
          rule.title.toLowerCase().includes(query) ||
          rule.category.toLowerCase().includes(query) ||
          rule.ruleText.toLowerCase().includes(query)),
    )
  }, [categoryFilter, rules, search])

  const groupedRules = useMemo(
    () =>
      categories
        .map((category) => ({
          category,
          rules: rules.filter(
            (rule) => rule.status === 'Active' && rule.category === category,
          ),
        }))
        .filter((group) => group.rules.length > 0),
    [rules],
  )

  const refreshRules = async () => {
    setRules(await getErpApi().getSchoolRules({}))
  }

  useEffect(() => {
    let isCurrent = true
    Promise.resolve()
      .then(() =>
        Promise.all([
          getErpApi().getSchoolRules({}),
          getAcademicSessionsErpApi().getAcademicSessions(),
          getErpApi().getSchoolSettings(),
        ]),
      )
      .then(([ruleRows, sessionRows, schoolSettings]) => {
        if (!isCurrent) return
        setRules(ruleRows)
        setSessions(sessionRows)
        setSettings(schoolSettings)
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
  }

  const editRule = (rule: SchoolRule) => {
    setEditingId(rule.id)
    setForm({
      title: rule.title,
      category: rule.category,
      ruleText: rule.ruleText,
      displayOrder: String(rule.displayOrder),
      status: rule.status,
      academicSessionId: rule.academicSessionId,
      effectiveFrom: rule.effectiveFrom,
    })
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (readOnly) return
    const displayOrder = Number(form.displayOrder)
    if (!Number.isInteger(displayOrder) || displayOrder < 0) {
      onNotice({ type: 'error', message: 'Enter a valid display order.' })
      return
    }
    setIsSaving(true)
    try {
      const input = {
        title: form.title,
        category: form.category,
        ruleText: form.ruleText,
        displayOrder,
        status: form.status,
        academicSessionId: form.academicSessionId,
        effectiveFrom: form.effectiveFrom,
      }
      if (editingId) {
        await getErpApi().updateSchoolRule(editingId, input)
        onNotice({ type: 'success', message: 'Rule updated.' })
      } else {
        await getErpApi().createSchoolRule(input)
        onNotice({ type: 'success', message: 'Rule created.' })
      }
      await refreshRules()
      resetForm()
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  const deleteRule = async (rule: SchoolRule) => {
    if (readOnly) return
    if (!window.confirm(`Delete "${rule.title}"?`)) return
    try {
      await getErpApi().deleteSchoolRule(rule.id)
      await refreshRules()
      onNotice({ type: 'success', message: 'Rule removed.' })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const moveRule = async (rule: SchoolRule, direction: -1 | 1) => {
    if (readOnly) return
    const ordered = [...rules].sort(
      (left, right) =>
        left.category.localeCompare(right.category) ||
        left.displayOrder - right.displayOrder,
    )
    const index = ordered.findIndex((item) => item.id === rule.id)
    const target = ordered[index + direction]
    if (!target || target.category !== rule.category) return
    const nextRows = ordered.map((item) => ({ ...item }))
    nextRows[index].displayOrder = target.displayOrder
    nextRows[index + direction].displayOrder = rule.displayOrder
    try {
      setRules(
        await getErpApi().reorderSchoolRules(
          nextRows.map((item) => ({
            id: item.id,
            displayOrder: item.displayOrder,
          })),
        ),
      )
      onNotice({ type: 'success', message: 'Rule order updated.' })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const exportRules = () =>
    exportCsv(
      'school-rules.csv',
      ['Category', 'Title', 'Rule', 'Session', 'Effective From', 'Status'],
      visibleRules.map((rule) => [
        rule.category,
        rule.title,
        rule.ruleText,
        rule.academicSessionName,
        rule.effectiveFrom,
        rule.status,
      ]),
    )

  const columns: TableColumn<SchoolRule>[] = [
    {
      key: 'rule',
      header: t('Title'),
      render: (rule) => (
        <div className="primary-cell">
          <strong>{rule.title}</strong>
          <span>{rule.ruleText}</span>
        </div>
      ),
    },
    { key: 'category', header: t('Category'), render: (rule) => rule.category },
    {
      key: 'effective',
      header: t('Effective Date'),
      render: (rule) => formatPreferenceDate(rule.effectiveFrom, preferences),
    },
    {
      key: 'status',
      header: t('Status'),
      render: (rule) => (
        <span className={`status-badge status-badge--${rule.status.toLowerCase()}`}>
          {t(rule.status)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'align-right',
      render: (rule) =>
        readOnly ? (
          <span className="table-secondary">View only</span>
        ) : (
          <div className="row-action-group">
            <button className="row-action" onClick={() => void moveRule(rule, -1)} type="button">
              <Icon name="chevron-up" size={14} />
            </button>
            <button className="row-action" onClick={() => void moveRule(rule, 1)} type="button">
              <Icon name="chevron-down" size={14} />
            </button>
            <button className="row-action" onClick={() => editRule(rule)} type="button">
              <Icon name="edit" size={14} />
            </button>
            <button className="row-action row-action--danger" onClick={() => void deleteRule(rule)} type="button">
              <Icon name="trash" size={14} />
            </button>
          </div>
        ),
    },
  ]

  if (isLoading) {
    return <section className="panel exam-loading-state">{t('Loading')}...</section>
  }

  return (
    <div className="settings-master-stack school-rules-page">
      <section className="master-page-grid">
        <form className="panel master-form-card" onSubmit={(event) => void handleSubmit(event)}>
          <div className="panel-heading">
            <div>
              <h3>{editingId ? t('Edit Rule') : t('Add Rule')}</h3>
              <p>Maintain official school policies for printing and reference.</p>
            </div>
          </div>
          <div className="master-form-fields">
            {readOnly && (
              <div className="form-note">
                <Icon name="lock" size={17} />
                Rules are read-only for your role.
              </div>
            )}
            <label className="form-field">
              <span>{t('Title')}</span>
              <input
                disabled={readOnly}
                required
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
              />
            </label>
            <div className="form-row">
              <label className="form-field">
                <span>{t('Category')}</span>
                <select
                  disabled={readOnly}
                  value={form.category}
                  onChange={(event) =>
                    setForm({ ...form, category: event.target.value as RuleCategory })
                  }
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>{t('Display Order')}</span>
                <input
                  disabled={readOnly}
                  min="0"
                  step="1"
                  type="number"
                  value={form.displayOrder}
                  onChange={(event) =>
                    setForm({ ...form, displayOrder: event.target.value })
                  }
                />
              </label>
            </div>
            <label className="form-field">
              <span>{t('Academic Sessions')}</span>
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
            <div className="form-row">
              <label className="form-field">
                <span>{t('Effective Date')}</span>
                <input
                  disabled={readOnly}
                  type="date"
                  value={form.effectiveFrom}
                  onChange={(event) =>
                    setForm({ ...form, effectiveFrom: event.target.value })
                  }
                />
              </label>
              <label className="form-field">
                <span>{t('Status')}</span>
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
            </div>
            <label className="form-field">
              <span>{t('Rule Text')}</span>
              <textarea
                disabled={readOnly}
                required
                rows={5}
                value={form.ruleText}
                onChange={(event) =>
                  setForm({ ...form, ruleText: event.target.value })
                }
              />
            </label>
            {!readOnly && (
              <div className="master-form-actions">
                {editingId && (
                  <button className="secondary-button" onClick={resetForm} type="button">
                    {t('Cancel')}
                  </button>
                )}
                <button className="primary-button" disabled={isSaving} type="submit">
                  <Icon name="check" size={17} />
                  {t('Save')}
                </button>
              </div>
            )}
          </div>
        </form>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>{t('Rules & Regulations')}</h3>
              <p>{currentUser.role === 'Viewer' ? 'Read-only policy booklet.' : 'Create and maintain school policy rules.'}</p>
            </div>
          </div>
          <div className="report-filter-fields report-filter-fields--compact school-rules-filters">
            <label className="form-field">
              <span>{t('Search')}</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
            <label className="form-field">
              <span>{t('Category')}</span>
              <select
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(event.target.value as RuleCategory | 'All')
                }
              >
                <option value="All">All</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <button className="secondary-button" disabled={visibleRules.length === 0} onClick={exportRules} type="button">
              <Icon name="download" size={16} />
              {t('Export')}
            </button>
            <button className="primary-button" disabled={rules.length === 0} onClick={() => window.setTimeout(() => window.print(), 50)} type="button">
              <Icon name="print" size={16} />
              {t('Print')}
            </button>
          </div>
          <DataTable
            columns={columns}
            emptyMessage={t('No records found')}
            getRowKey={(rule) => rule.id}
            rows={visibleRules}
          />
        </section>
      </section>

      {rules.length > 0 && (
        <section className="panel report-print-area school-rules-print-area">
          <header className="report-document-header">
            <div className="report-school-identity">
              <span className="report-school-mark">
                <Icon name="school" size={24} />
              </span>
              <div>
                <h2>{settings.schoolName}</h2>
                {settings.address && <p>{settings.address}</p>}
                {(settings.phone || settings.email) && (
                  <span>
                    {[settings.phone, settings.email].filter(Boolean).join(' · ')}
                  </span>
                )}
              </div>
            </div>
            <div className="report-document-title">
              <h1>Rules & Regulations</h1>
              <p>{settings.academicYear || 'All academic sessions'}</p>
            </div>
          </header>
          {groupedRules.map((group) => (
            <section className="school-rules-booklet-section" key={group.category}>
              <h3>{group.category}</h3>
              {group.rules.map((rule, index) => (
                <article key={rule.id}>
                  <strong>
                    {index + 1}. {rule.title}
                  </strong>
                  <p>{rule.ruleText}</p>
                  {(rule.academicSessionName || rule.effectiveFrom) && (
                    <span>
                      {rule.academicSessionName || 'All sessions'}
                      {rule.effectiveFrom
                        ? ` · Effective ${formatPreferenceDate(rule.effectiveFrom, preferences)}`
                        : ''}
                    </span>
                  )}
                </article>
              ))}
            </section>
          ))}
          <footer className="marksheet-signatures school-rules-signature">
            <div>
              <span />
              <strong>Principal</strong>
            </div>
          </footer>
        </section>
      )}
    </div>
  )
}
