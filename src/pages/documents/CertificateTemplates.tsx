import { useState, type FormEvent } from 'react'
import { DataTable, type TableColumn } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import { getDocumentsErpApi, getErrorMessage } from '../../lib/erpApi'
import { certificateVariables } from '../../lib/studentDocuments'
import type {
  CertificateTemplate,
  CertificateType,
  CreateCertificateTemplateInput,
} from '../../types'
import type { DocumentNoticeProps } from './types'

interface CertificateTemplatesProps extends DocumentNoticeProps {
  onTemplatesChange: (templates: CertificateTemplate[]) => void
  templates: CertificateTemplate[]
}

const certificateTypes: CertificateType[] = [
  'Bonafide',
  'Character',
  'Transfer',
  'Admission',
  'Custom',
]

const emptyTemplate: CreateCertificateTemplateInput = {
  name: '',
  type: 'Bonafide',
  bodyTemplate: '',
  status: 'Active',
}

export function CertificateTemplates({
  onNotice,
  onTemplatesChange,
  templates,
}: CertificateTemplatesProps) {
  const [form, setForm] =
    useState<CreateCertificateTemplateInput>(emptyTemplate)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const resetForm = () => {
    setEditingId(null)
    setForm(emptyTemplate)
  }

  const refreshTemplates = async () => {
    onTemplatesChange(await getDocumentsErpApi().getCertificateTemplates())
  }

  const submitTemplate = async (event: FormEvent) => {
    event.preventDefault()
    try {
      setIsSaving(true)
      const api = getDocumentsErpApi()
      const saved = editingId
        ? await api.updateCertificateTemplate(editingId, form)
        : await api.createCertificateTemplate(form)
      await refreshTemplates()
      onNotice({
        type: 'success',
        message: editingId
          ? `${saved.name} was updated.`
          : `${saved.name} was created.`,
      })
      resetForm()
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  const editTemplate = (template: CertificateTemplate) => {
    setEditingId(template.id)
    setForm({
      name: template.name,
      type: template.type,
      bodyTemplate: template.bodyTemplate,
      status: template.status,
    })
  }

  const deleteTemplate = async (template: CertificateTemplate) => {
    if (
      !window.confirm(
        `Delete "${template.name}"? Previously issued certificates will remain unchanged.`,
      )
    ) {
      return
    }
    try {
      const result = await getDocumentsErpApi().deleteCertificateTemplate(
        template.id,
      )
      if (!result.success) throw new Error('Certificate template was not found.')
      if (editingId === template.id) resetForm()
      await refreshTemplates()
      onNotice({
        type: 'success',
        message: `${template.name} was removed from active templates.`,
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const columns: TableColumn<CertificateTemplate>[] = [
    {
      key: 'name',
      header: 'Template',
      render: (template) => (
        <div className="primary-cell">
          <strong>{template.name}</strong>
          <span>{template.type} certificate</span>
        </div>
      ),
    },
    {
      key: 'body',
      header: 'Body preview',
      className: 'certificate-template-body-cell',
      render: (template) => template.bodyTemplate,
    },
    {
      key: 'status',
      header: 'Status',
      render: (template) => (
        <span
          className={`status-badge${
            template.status === 'Active' ? '' : ' status-badge--inactive'
          }`}
        >
          {template.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (template) => (
        <div className="table-actions">
          <button
            className="table-action-button"
            onClick={() => editTemplate(template)}
            type="button"
          >
            <Icon name="edit" size={14} />
            Edit
          </button>
          <button
            className="table-action-button table-action-button--danger"
            onClick={() => void deleteTemplate(template)}
            type="button"
          >
            <Icon name="trash" size={14} />
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="document-template-layout">
      <form className="panel document-template-form" onSubmit={submitTemplate}>
        <div className="panel-heading">
          <div>
            <h3>{editingId ? 'Edit Template' : 'New Certificate Template'}</h3>
            <p>Use variables to merge school and student details safely.</p>
          </div>
          {editingId && (
            <button className="text-button" onClick={resetForm} type="button">
              Cancel edit
            </button>
          )}
        </div>
        <div className="form-grid">
          <label className="form-field">
            <span>Template name</span>
            <input
              maxLength={150}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="e.g. Sports Participation Certificate"
              required
              value={form.name}
            />
          </label>
          <label className="form-field">
            <span>Certificate type</span>
            <select
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  type: event.target.value as CertificateType,
                }))
              }
              value={form.type}
            >
              {certificateTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Status</span>
            <select
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as 'Active' | 'Inactive',
                }))
              }
              value={form.status}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </label>
          <label className="form-field form-field--full">
            <span>Body template</span>
            <textarea
              maxLength={10000}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  bodyTemplate: event.target.value,
                }))
              }
              placeholder="Write the certificate wording and insert variables below."
              required
              rows={10}
              value={form.bodyTemplate}
            />
          </label>
        </div>
        <div className="certificate-variable-list">
          <span>Insert variable</span>
          <div>
            {certificateVariables.map((variable) => (
              <button
                key={variable}
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    bodyTemplate: `${current.bodyTemplate}${current.bodyTemplate ? ' ' : ''}${variable}`,
                  }))
                }
                type="button"
              >
                {variable}
              </button>
            ))}
          </div>
        </div>
        <div className="settings-actions">
          <span>
            {form.bodyTemplate.length.toLocaleString('en-IN')} / 10,000 characters
          </span>
          <button className="primary-button" disabled={isSaving} type="submit">
            <Icon name={editingId ? 'check' : 'plus'} size={16} />
            {isSaving
              ? 'Saving...'
              : editingId
                ? 'Update Template'
                : 'Create Template'}
          </button>
        </div>
      </form>

      <section className="panel document-template-list">
        <div className="panel-heading">
          <div>
            <h3>Certificate Templates</h3>
            <p>Default and custom templates available for issue.</p>
          </div>
          <span className="neutral-badge">{templates.length} templates</span>
        </div>
        <DataTable
          columns={columns}
          emptyMessage="No certificate templates found."
          getRowKey={(template) => template.id}
          rows={templates}
        />
      </section>
    </div>
  )
}
