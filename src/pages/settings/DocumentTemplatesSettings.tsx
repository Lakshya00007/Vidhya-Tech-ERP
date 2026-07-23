import { useEffect, useState, type FormEvent } from 'react'
import { Icon } from '../../components/Icon'
import { ManagedImageField } from '../../components/ManagedImage'
import { getErpApi, getErrorMessage } from '../../lib/erpApi'
import type {
  DocumentTemplateSettings,
  DocumentTemplateType,
  UpdateDocumentTemplateSettingInput,
} from '../../types'
import type { SettingsSectionProps } from '../Settings'

const documentTypes: DocumentTemplateType[] = [
  'Admission Form',
  'Transfer Certificate',
  'Fee Receipt',
]

const emptyForm: UpdateDocumentTemplateSettingInput = {
  udiseCode: '',
  recognitionNumber: '',
  principalName: '',
  principalSignaturePath: '',
  schoolStampPath: '',
  accentColor: '#1f4e79',
  footerText: '',
  feeReceiptTerms: '',
  defaultPaperSize: 'A4',
  showFields: {},
}

const templateSettingsToForm = (
  settings?: DocumentTemplateSettings,
): UpdateDocumentTemplateSettingInput =>
  settings
    ? {
        udiseCode: settings.udiseCode,
        recognitionNumber: settings.recognitionNumber,
        principalName: settings.principalName,
        principalSignaturePath: settings.principalSignaturePath,
        schoolStampPath: settings.schoolStampPath,
        accentColor: settings.accentColor,
        footerText: settings.footerText,
        feeReceiptTerms: settings.feeReceiptTerms,
        defaultPaperSize: settings.defaultPaperSize,
        showFields: settings.showFields,
      }
    : emptyForm

interface DocumentTemplatesSettingsProps extends SettingsSectionProps {
  readOnly?: boolean
}

export function DocumentTemplatesSettings({
  onNotice,
  readOnly = false,
}: DocumentTemplatesSettingsProps) {
  const [rows, setRows] = useState<DocumentTemplateSettings[]>([])
  const [activeType, setActiveType] =
    useState<DocumentTemplateType>('Admission Form')
  const [form, setForm] =
    useState<UpdateDocumentTemplateSettingInput>(emptyForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let isCurrent = true
    Promise.resolve()
      .then(() => getErpApi().getDocumentTemplateSettings())
      .then((settings) => {
        if (!isCurrent) return
        setRows(settings)
        setForm(
          templateSettingsToForm(
            settings.find((row) => row.documentType === 'Admission Form'),
          ),
        )
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

  const updateField = (
    field: keyof UpdateDocumentTemplateSettingInput,
    value: string,
  ) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const selectDocumentType = (documentType: DocumentTemplateType) => {
    setActiveType(documentType)
    setForm(
      templateSettingsToForm(
        rows.find((row) => row.documentType === documentType),
      ),
    )
  }

  const saveSettings = async (event: FormEvent) => {
    event.preventDefault()
    if (readOnly) return
    setIsSaving(true)
    try {
      const updated = await getErpApi().updateDocumentTemplateSetting(
        activeType,
        form,
      )
      setRows((current) =>
        current.map((row) =>
          row.documentType === updated.documentType ? updated : row,
        ),
      )
      setForm(templateSettingsToForm(updated))
      onNotice({
        type: 'success',
        message: `${updated.documentType} print settings saved.`,
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="settings-layout" onSubmit={(event) => void saveSettings(event)}>
      <section className="panel settings-panel">
        <div className="panel-heading">
          <div>
            <h3>Document Templates</h3>
            <p>Presentation settings for printable school documents.</p>
          </div>
        </div>
        <div className="settings-tabs settings-tabs--compact">
          {documentTypes.map((documentType) => (
            <button
              className={`settings-tab${
                activeType === documentType ? ' settings-tab--active' : ''
              }`}
              key={documentType}
              onClick={() => selectDocumentType(documentType)}
              type="button"
            >
              <Icon name="reports" size={16} />
              {documentType}
            </button>
          ))}
        </div>
        <div className="settings-fields">
          <label className="form-field">
            <span>UDISE Code</span>
            <input
              disabled={isLoading || readOnly}
              value={form.udiseCode ?? ''}
              onChange={(event) => updateField('udiseCode', event.target.value)}
            />
          </label>
          <label className="form-field">
            <span>School Recognition Number</span>
            <input
              disabled={isLoading || readOnly}
              value={form.recognitionNumber ?? ''}
              onChange={(event) =>
                updateField('recognitionNumber', event.target.value)
              }
            />
          </label>
          <label className="form-field">
            <span>Principal Name</span>
            <input
              disabled={isLoading || readOnly}
              value={form.principalName ?? ''}
              onChange={(event) =>
                updateField('principalName', event.target.value)
              }
            />
          </label>
          <label className="form-field">
            <span>Accent Colour</span>
            <input
              disabled={isLoading || readOnly}
              type="color"
              value={form.accentColor || '#1f4e79'}
              onChange={(event) =>
                updateField('accentColor', event.target.value)
              }
            />
          </label>
          <label className="form-field">
            <span>Default Paper Size</span>
            <select
              disabled={isLoading || readOnly}
              value={form.defaultPaperSize ?? 'A4'}
              onChange={(event) =>
                updateField('defaultPaperSize', event.target.value)
              }
            >
              <option value="A4">A4</option>
              <option value="A5">A5</option>
              <option value="Half A4">Half A4</option>
            </select>
          </label>
          <div className="form-field form-field--full">
            <ManagedImageField
              assetKey={form.principalSignaturePath}
              category="principal-signature"
              disabled={isLoading || readOnly}
              label="Principal Signature"
              onChange={(assetKey) => updateField('principalSignaturePath', assetKey)}
              onError={(message) => onNotice({ type: 'error', message })}
            />
          </div>
          <div className="form-field form-field--full">
            <ManagedImageField
              assetKey={form.schoolStampPath}
              category="school-stamp"
              disabled={isLoading || readOnly}
              label="School Stamp"
              onChange={(assetKey) => updateField('schoolStampPath', assetKey)}
              onError={(message) => onNotice({ type: 'error', message })}
            />
          </div>
          <label className="form-field form-field--full">
            <span>Footer Text</span>
            <textarea
              disabled={isLoading || readOnly}
              rows={2}
              value={form.footerText ?? ''}
              onChange={(event) =>
                updateField('footerText', event.target.value)
              }
            />
          </label>
          {activeType === 'Fee Receipt' && (
            <label className="form-field form-field--full">
              <span>Fee Receipt Terms</span>
              <textarea
                disabled={isLoading || readOnly}
                rows={2}
                value={form.feeReceiptTerms ?? ''}
                onChange={(event) =>
                  updateField('feeReceiptTerms', event.target.value)
                }
              />
            </label>
          )}
        </div>
      </section>

      <section className="panel settings-panel">
        <div className="panel-heading">
          <div>
            <h3>Asset Storage</h3>
            <p>Upload printable school signatures and stamps into managed local assets.</p>
          </div>
        </div>
        <div className="form-note">
          <Icon name="download" size={17} />
          Uploaded document assets are stored under the app user-data managed
          asset area and are included in full ZIP backups. Keep original school
          profile details in School Profile and use these settings only for
          document presentation.
        </div>
      </section>

      <div className="settings-actions">
        <span>
          {readOnly
            ? 'Your role has read-only access to document templates.'
            : 'Settings are saved locally and used by print previews.'}
        </span>
        {!readOnly && (
          <button className="primary-button" disabled={isSaving} type="submit">
            <Icon name="check" size={17} />
            {isSaving ? 'Saving...' : 'Save Document Settings'}
          </button>
        )}
      </div>
    </form>
  )
}
