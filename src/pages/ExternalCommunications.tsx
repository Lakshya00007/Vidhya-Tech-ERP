import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { DataTable, type TableColumn } from '../components/DataTable'
import { Icon } from '../components/Icon'
import { getErpApi, getErrorMessage } from '../lib/erpApi'
import type {
  CommunicationGatewaySettings,
  CommunicationTemplate,
  ExternalCommunicationChannel,
  ExternalCommunicationJob,
  ExternalRecipientCandidate,
  ExternalRecipientPreview,
  ParentsInfoReport,
  Student,
  Employee,
} from '../types'

export type ExternalCommunicationsView =
  | 'whatsapp'
  | 'whatsapp-bulk'
  | 'whatsapp-templates'
  | 'whatsapp-logs'
  | 'whatsapp-status'
  | 'sms'
  | 'sms-bulk'
  | 'sms-templates'
  | 'sms-logs'
  | 'sms-status'

interface ExternalCommunicationsProps {
  channel: ExternalCommunicationChannel
  initialView?: ExternalCommunicationsView
}

type RecipientType = 'Guardian' | 'Student' | 'Employee'

const channelTabs = (channel: ExternalCommunicationChannel) =>
  channel === 'WhatsApp'
    ? [
        { id: 'whatsapp', label: 'Send Message' },
        { id: 'whatsapp-bulk', label: 'Bulk/Class Message' },
        { id: 'whatsapp-templates', label: 'Templates' },
        { id: 'whatsapp-logs', label: 'Delivery Logs' },
        { id: 'whatsapp-status', label: 'Configuration Status' },
      ]
    : [
        { id: 'sms', label: 'Send SMS' },
        { id: 'sms-bulk', label: 'Bulk/Class SMS' },
        { id: 'sms-templates', label: 'SMS Templates' },
        { id: 'sms-logs', label: 'Delivery Logs' },
        { id: 'sms-status', label: 'DLT Configuration Status' },
      ]

const formatDateTime = (value: string | null) =>
  value ? new Date(value).toLocaleString() : 'Never'

const variableName = (definition: { name?: string; key?: string; label?: string }) =>
  definition.name || definition.key || definition.label || ''

function renderPreview(template: CommunicationTemplate | undefined, variables: Record<string, string>) {
  let preview = template?.bodyPreview || 'Select an approved template to preview the provider-approved content.'
  Object.entries(variables).forEach(([key, value]) => {
    preview = preview.replaceAll(`{{${key}}}`, value || `[${key}]`)
  })
  return preview
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`)
        .join(','),
    )
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function ExternalCommunications({
  channel,
  initialView,
}: ExternalCommunicationsProps) {
  const defaultView = channel === 'WhatsApp' ? 'whatsapp' : 'sms'
  const [activeTab, setActiveTab] = useState<ExternalCommunicationsView>(
    initialView || defaultView,
  )
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([])
  const [jobs, setJobs] = useState<ExternalCommunicationJob[]>([])
  const [settings, setSettings] = useState<CommunicationGatewaySettings | null>(
    null,
  )
  const [students, setStudents] = useState<Student[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [parentsReport, setParentsReport] = useState<ParentsInfoReport | null>(
    null,
  )
  const [recipientType, setRecipientType] = useState<RecipientType>('Guardian')
  const [selectedRecipientId, setSelectedRecipientId] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [variableValues, setVariableValues] = useState<Record<string, string>>({})
  const [bulkTemplateId, setBulkTemplateId] = useState('')
  const [bulkClass, setBulkClass] = useState('')
  const [bulkSection, setBulkSection] = useState('')
  const [includeAllGuardians, setIncludeAllGuardians] = useState(false)
  const [preview, setPreview] = useState<ExternalRecipientPreview | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [templateRows, jobRows, status, studentRows, employeeRows, parentRows] =
        await Promise.all([
          getErpApi().getCommunicationTemplates(channel),
          getErpApi().getCommunicationJobs({ channel }),
          getErpApi().getCommunicationIntegrationStatus(),
          getErpApi().getStudents(),
          getErpApi().getEmployees(),
          getErpApi().getParentsInfoReport({}),
        ])
      setTemplates(templateRows.filter((template) => template.status === 'Approved'))
      setJobs(jobRows)
      setSettings(status)
      setStudents(studentRows.filter((student) => student.status === 'Active'))
      setEmployees(employeeRows.filter((employee) => employee.status === 'Active'))
      setParentsReport(parentRows)
      setError('')
    } catch (loadError) {
      setError(getErrorMessage(loadError))
    } finally {
      setIsLoading(false)
    }
  }, [channel])

  useEffect(() => {
    void Promise.resolve().then(loadData)
  }, [loadData])

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId)
  const selectedBulkTemplate = templates.find((template) => template.id === bulkTemplateId)
  const variableDefinitions = selectedTemplate?.variableDefinitions ?? []

  const candidates = useMemo<ExternalRecipientCandidate[]>(() => {
    if (recipientType === 'Student') {
      return students.map((student) => ({
        type: 'Student',
        entityId: student.id,
        name: student.name,
        label: `${student.name} · ${student.className}${student.section ? `-${student.section}` : ''}`,
        className: student.className,
        section: student.section,
        phoneMasked: student.mobile ? 'Main mobile on file' : 'Missing mobile',
      }))
    }
    if (recipientType === 'Employee') {
      return employees.map((employee) => ({
        type: 'Employee',
        entityId: employee.id,
        name: employee.name,
        label: `${employee.name} · ${employee.department || 'Staff'}`,
        department: employee.department,
        designation: employee.designation,
        phoneMasked: employee.mobile ? 'Mobile on file' : 'Missing mobile',
      }))
    }
    return (parentsReport?.rows ?? []).map((row) => ({
      type: 'Guardian',
      entityId: row.guardianId || row.studentId,
      studentId: row.studentId,
      name: row.primaryGuardian,
      label: `${row.primaryGuardian} · ${row.studentName}`,
      relation: row.relation,
      className: row.className,
      section: row.section,
      phoneMasked: row.mobile ? row.mobile.replace(/^(\+91|91)?(\d{2})\d{4}(\d{4})$/, '+91******$3') : 'Missing mobile',
    }))
  }, [employees, parentsReport?.rows, recipientType, students])

  const selectedRecipient = candidates.find(
    (candidate) => `${candidate.type}:${candidate.entityId}:${candidate.studentId ?? ''}` === selectedRecipientId,
  )

  const classOptions = useMemo(
    () => Array.from(new Set(students.map((student) => student.className))).filter(Boolean).sort(),
    [students],
  )

  const sectionOptions = useMemo(
    () =>
      Array.from(
        new Set(
          students
            .filter((student) => !bulkClass || student.className === bulkClass)
            .map((student) => student.section),
        ),
      )
        .filter(Boolean)
        .sort(),
    [bulkClass, students],
  )

  const showSuccess = (text: string) => {
    setMessage(text)
    setError('')
  }

  const showError = (text: string) => {
    setError(text)
    setMessage('')
  }

  const sendSingle = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedTemplate || !selectedRecipient) {
      showError('Select an approved template and recipient first.')
      return
    }
    if (!window.confirm(`Send ${channel} template to ${selectedRecipient.label || selectedRecipient.name}?`)) {
      return
    }
    setIsSaving(true)
    try {
      const result = await getErpApi().sendExternalMessage({
        channel,
        templateId: selectedTemplate.id,
        recipient: selectedRecipient,
        variables: variableValues,
      })
      showSuccess(`Message queued. Job ${result.job.id} is ${result.job.status}.`)
      await loadData()
    } catch (sendError) {
      showError(getErrorMessage(sendError))
    } finally {
      setIsSaving(false)
    }
  }

  const loadBulkPreview = async () => {
    if (!selectedBulkTemplate) {
      showError('Select an approved template first.')
      return
    }
    setIsSaving(true)
    try {
      const nextPreview = await getErpApi().getExternalRecipientPreview({
        audienceType: 'Class students',
        className: bulkClass,
        section: bulkSection,
        includeAllGuardians,
      })
      setPreview(nextPreview)
      showSuccess(`Preview resolved ${nextPreview.validCount} valid recipient(s).`)
    } catch (previewError) {
      showError(getErrorMessage(previewError))
    } finally {
      setIsSaving(false)
    }
  }

  const sendBulk = async () => {
    if (!selectedBulkTemplate || !preview?.candidates.length) {
      showError('Generate a recipient preview before sending.')
      return
    }
    if (
      !window.confirm(
        `Queue ${preview.candidates.length} ${channel} message(s)? This may incur provider charges in live mode.`,
      )
    ) {
      return
    }
    setIsSaving(true)
    try {
      const result = await getErpApi().sendExternalBatch({
        channel,
        templateId: selectedBulkTemplate.id,
        title: `${channel} ${selectedBulkTemplate.internalName}`,
        audienceType: 'Class students',
        recipients: preview.candidates,
      })
      showSuccess(`Batch ${result.batchId} queued ${result.queuedCount} recipient(s).`)
      await loadData()
    } catch (bulkError) {
      showError(getErrorMessage(bulkError))
    } finally {
      setIsSaving(false)
    }
  }

  const exportLogs = () => {
    downloadCsv(`${channel.toLowerCase()}-delivery-logs.csv`, [
      ['Date', 'Recipient', 'Phone', 'Template', 'Status', 'Provider ID', 'Error'],
      ...jobs.map((job) => [
        formatDateTime(job.createdAt),
        job.recipientName ?? '',
        job.recipientPhoneMasked ?? '',
        job.templateId ?? '',
        job.status,
        job.providerMessageId ?? '',
        job.errorMessage ?? '',
      ]),
    ])
  }

  const jobColumns: TableColumn<ExternalCommunicationJob>[] = [
    {
      key: 'recipient',
      header: 'Recipient',
      render: (job) => (
        <>
          <strong className="table-block">{job.recipientName || 'Recipient'}</strong>
          <span className="table-secondary">{job.recipientPhoneMasked || '-'}</span>
        </>
      ),
    },
    { key: 'status', header: 'Status', render: (job) => <span className={`status-badge status-badge--${job.status.toLowerCase()}`}>{job.status}</span> },
    { key: 'provider', header: 'Provider ID', render: (job) => job.providerMessageId || '-' },
    { key: 'attempts', header: 'Attempts', render: (job) => String(job.attemptCount) },
    { key: 'date', header: 'Date', render: (job) => formatDateTime(job.createdAt) },
    {
      key: 'error',
      header: 'Error',
      render: (job) => job.errorMessage || '-',
    },
  ]

  const tabs = channelTabs(channel)
  const disclaimer =
    channel === 'SMS'
      ? 'External provider charges and DLT registration may apply.'
      : 'WhatsApp delivery uses approved Meta Cloud API templates only.'

  return (
    <div className="page-stack external-communications-page">
      <section className="page-header">
        <div>
          <h2>{channel === 'WhatsApp' ? 'WhatsApp Services' : 'SMS Gateway'}</h2>
          <p>{disclaimer}</p>
        </div>
      </section>

      <nav className="settings-tabs" aria-label={`${channel} tabs`}>
        {tabs.map((tab) => (
          <button
            className={`settings-tab${activeTab === tab.id ? ' settings-tab--active' : ''}`}
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ExternalCommunicationsView)}
            type="button"
          >
            <Icon name={tab.id.includes('logs') ? 'reports' : tab.id.includes('templates') ? 'edit' : 'bell'} size={17} />
            {tab.label}
          </button>
        ))}
      </nav>

      {(message || error) && (
        <div className={`inline-message${error ? ' inline-message--error' : ''}`}>
          <Icon name={error ? 'close' : 'check'} size={17} />
          <span>{error || message}</span>
        </div>
      )}

      {(activeTab === 'whatsapp' || activeTab === 'sms') && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>{channel === 'WhatsApp' ? 'Send WhatsApp Template' : 'Send SMS Flow'}</h3>
              <p>Choose an approved provider template and one verified local recipient</p>
            </div>
          </div>
          <form className="settings-form" onSubmit={sendSingle}>
            <div className="report-filter-fields report-filter-fields--attendance">
              <label className="form-field">
                <span>Recipient type</span>
                <select value={recipientType} onChange={(event) => {
                  setRecipientType(event.target.value as RecipientType)
                  setSelectedRecipientId('')
                }}>
                  <option>Guardian</option>
                  <option>Student</option>
                  <option>Employee</option>
                </select>
              </label>
              <label className="form-field">
                <span>Recipient</span>
                <select value={selectedRecipientId} onChange={(event) => setSelectedRecipientId(event.target.value)} required>
                  <option value="">Select recipient</option>
                  {candidates.map((candidate) => {
                    const value = `${candidate.type}:${candidate.entityId}:${candidate.studentId ?? ''}`
                    return (
                      <option key={value} value={value}>
                        {candidate.label || candidate.name} · {candidate.phoneMasked}
                      </option>
                    )
                  })}
                </select>
              </label>
              <label className="form-field">
                <span>Template</span>
                <select value={selectedTemplateId} onChange={(event) => {
                  setSelectedTemplateId(event.target.value)
                  setVariableValues({})
                }} required>
                  <option value="">Select approved template</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.internalName} · {template.category || 'General'}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {variableDefinitions.length > 0 && (
              <div className="report-filter-fields report-filter-fields--attendance">
                {variableDefinitions.map((definition) => {
                  const name = variableName(definition)
                  if (!name) return null
                  return (
                    <label className="form-field" key={name}>
                      <span>{name}</span>
                      <input value={variableValues[name] ?? ''} onChange={(event) => setVariableValues({ ...variableValues, [name]: event.target.value })} required />
                    </label>
                  )
                })}
              </div>
            )}
            <div className="document-empty-state">
              <strong>Template preview</strong>
              <p>{renderPreview(selectedTemplate, variableValues)}</p>
              {selectedRecipient && (
                <small>
                  Recipient: {selectedRecipient.label || selectedRecipient.name} · {selectedRecipient.phoneMasked}
                </small>
              )}
            </div>
            <div className="form-actions">
              <button className="primary-button" disabled={isSaving || !settings?.hasToken} type="submit">
                <Icon name="bell" size={16} />
                {isSaving ? 'Sending...' : `Send ${channel}`}
              </button>
            </div>
          </form>
        </section>
      )}

      {(activeTab === 'whatsapp-bulk' || activeTab === 'sms-bulk') && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>{channel} Bulk/Class Message</h3>
              <p>Resolve recipients locally, review counts, then queue through the gateway</p>
            </div>
          </div>
          <div className="report-filter-fields report-filter-fields--attendance">
            <label className="form-field">
              <span>Template</span>
              <select value={bulkTemplateId} onChange={(event) => setBulkTemplateId(event.target.value)}>
                <option value="">Select approved template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.internalName}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Class</span>
              <select value={bulkClass} onChange={(event) => {
                setBulkClass(event.target.value)
                setBulkSection('')
              }}>
                <option value="">All classes</option>
                {classOptions.map((className) => (
                  <option key={className}>{className}</option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Section</span>
              <select value={bulkSection} onChange={(event) => setBulkSection(event.target.value)}>
                <option value="">All sections</option>
                {sectionOptions.map((section) => (
                  <option key={section}>{section}</option>
                ))}
              </select>
            </label>
            <label className="form-field checkbox-field">
              <span>All guardians</span>
              <input type="checkbox" checked={includeAllGuardians} onChange={(event) => setIncludeAllGuardians(event.target.checked)} />
            </label>
          </div>
          <div className="form-actions">
            <button className="secondary-button" disabled={isSaving} onClick={() => void loadBulkPreview()} type="button">
              <Icon name="view" size={16} />
              Preview Recipients
            </button>
            <button className="primary-button" disabled={isSaving || !preview?.candidates.length} onClick={() => void sendBulk()} type="button">
              <Icon name="bell" size={16} />
              Queue Batch
            </button>
          </div>
          {preview && (
            <>
              <div className="stats-grid">
                <article className="stat-card"><span>Total</span><strong>{preview.totalRecords}</strong></article>
                <article className="stat-card"><span>Valid</span><strong>{preview.validCount}</strong></article>
                <article className="stat-card"><span>Missing</span><strong>{preview.missingCount}</strong></article>
                <article className="stat-card"><span>Duplicates</span><strong>{preview.duplicateCount}</strong></article>
              </div>
              <DataTable
                columns={[
                  { key: 'name', header: 'Recipient', render: (row) => row.label || row.name },
                  { key: 'type', header: 'Type', render: (row) => row.type },
                  { key: 'phone', header: 'Phone', render: (row) => row.phoneMasked },
                  { key: 'class', header: 'Scope', render: (row) => [row.className, row.section].filter(Boolean).join('-') || row.department || '-' },
                ]}
                emptyMessage="No valid recipients found."
                getRowKey={(row) => `${row.type}-${row.entityId}-${row.studentId ?? ''}`}
                rows={preview.candidates}
              />
            </>
          )}
        </section>
      )}

      {(activeTab === 'whatsapp-templates' || activeTab === 'sms-templates') && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>{channel} Templates</h3>
              <p>Read-only approved templates synchronized from ERP-Management</p>
            </div>
          </div>
          <DataTable
            columns={[
              { key: 'name', header: 'Template', render: (template) => <><strong className="table-block">{template.internalName}</strong><span className="table-secondary">{template.category || 'General'}</span></> },
              { key: 'provider', header: 'Provider Mapping', render: (template) => template.providerTemplateName || template.msg91FlowId || template.providerTemplateId || '-' },
              { key: 'dlt', header: 'DLT/Sender', render: (template) => [template.dltTemplateId, template.senderId].filter(Boolean).join(' · ') || '-' },
              { key: 'status', header: 'Status', render: (template) => template.status },
              { key: 'preview', header: 'Preview', render: (template) => template.bodyPreview || '-' },
            ]}
            emptyMessage={isLoading ? 'Loading templates...' : 'No approved templates found.'}
            getRowKey={(template) => template.id}
            rows={templates}
          />
        </section>
      )}

      {(activeTab === 'whatsapp-logs' || activeTab === 'sms-logs') && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>{channel} Delivery Logs</h3>
              <p>Masked delivery metadata returned by the communication gateway</p>
            </div>
            <button className="secondary-button" onClick={exportLogs} type="button">
              <Icon name="download" size={16} />
              Export CSV
            </button>
          </div>
          <DataTable
            columns={jobColumns}
            emptyMessage={isLoading ? 'Loading delivery logs...' : 'No delivery jobs found.'}
            getRowKey={(job) => job.id}
            rows={jobs}
          />
        </section>
      )}

      {(activeTab === 'whatsapp-status' || activeTab === 'sms-status') && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>{channel === 'WhatsApp' ? 'Configuration Status' : 'DLT Configuration Status'}</h3>
              <p>{disclaimer}</p>
            </div>
            <button className="secondary-button" onClick={() => void loadData()} type="button">
              <Icon name="view" size={16} />
              Refresh
            </button>
          </div>
          <dl className="license-detail-grid">
            <div><dt>Gateway</dt><dd>{settings?.connectionStatus || 'Unknown'}</dd></div>
            <div><dt>{channel}</dt><dd>{channel === 'WhatsApp' ? settings?.whatsappStatus : settings?.smsStatus}</dd></div>
            <div><dt>Last Success</dt><dd>{formatDateTime(settings?.lastSuccessAt ?? null)}</dd></div>
            <div><dt>Token</dt><dd>{settings?.hasToken ? settings.tokenPrefix : 'Not configured'}</dd></div>
          </dl>
          {channel === 'SMS' && (
            <div className="document-empty-state">
              <strong>DLT checklist</strong>
              <p>Principal Entity ID, Sender ID/Header and approved Flow/Template IDs must be configured in ERP-Management before live SMS delivery.</p>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
