import { useMemo, useState } from 'react'
import { DataTable, type TableColumn } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import { getDocumentsErpApi, getErrorMessage } from '../../lib/erpApi'
import {
  formatDocumentDate,
  getTodayDateInput,
  renderCertificateTemplate,
} from '../../lib/studentDocuments'
import type {
  CertificateTemplate,
  IssuedCertificate,
  SchoolSettings,
  Student,
} from '../../types'
import type { DocumentNoticeProps } from './types'

interface CertificatesProps extends DocumentNoticeProps {
  issuedCertificates: IssuedCertificate[]
  onIssuedCertificatesChange: (certificates: IssuedCertificate[]) => void
  settings: SchoolSettings
  students: Student[]
  templates: CertificateTemplate[]
}

export function Certificates({
  issuedCertificates,
  onIssuedCertificatesChange,
  onNotice,
  settings,
  students,
  templates,
}: CertificatesProps) {
  const activeStudents = useMemo(
    () => students.filter((student) => student.status === 'Active'),
    [students],
  )
  const activeTemplates = useMemo(
    () => templates.filter((template) => template.status === 'Active'),
    [templates],
  )
  const [studentId, setStudentId] = useState(activeStudents[0]?.id ?? '')
  const [templateId, setTemplateId] = useState(activeTemplates[0]?.id ?? '')
  const [issuedDate, setIssuedDate] = useState(getTodayDateInput)
  const [selectedIssued, setSelectedIssued] =
    useState<IssuedCertificate | null>(null)
  const [isIssuing, setIsIssuing] = useState(false)

  const selectedStudent = activeStudents.find(
    (student) => student.id === studentId,
  )
  const selectedTemplate = activeTemplates.find(
    (template) => template.id === templateId,
  )
  const previewBody =
    selectedIssued?.body ??
    (selectedStudent && selectedTemplate
      ? renderCertificateTemplate(
          selectedTemplate.bodyTemplate,
          settings,
          selectedStudent,
          issuedDate,
        )
      : '')
  const previewTitle =
    templates.find(
      (template) =>
        template.id === (selectedIssued?.templateId ?? selectedTemplate?.id),
    )?.name ??
    (selectedIssued
      ? `${selectedIssued.certificateType} Certificate`
      : 'Certificate Preview')
  const previewStudentName =
    selectedIssued?.studentName ?? selectedStudent?.name ?? ''
  const previewAdmissionNo =
    selectedIssued?.admissionNo ?? selectedStudent?.admissionNo ?? ''
  const previewClass = selectedIssued?.className ?? selectedStudent?.className ?? ''
  const previewSection =
    selectedIssued?.section ?? selectedStudent?.section ?? ''
  const previewDate = selectedIssued?.issuedDate ?? issuedDate

  const changeStudent = (value: string) => {
    setStudentId(value)
    setSelectedIssued(null)
  }

  const changeTemplate = (value: string) => {
    setTemplateId(value)
    setSelectedIssued(null)
  }

  const issueCertificate = async () => {
    if (!selectedStudent || !selectedTemplate) return
    try {
      setIsIssuing(true)
      const issued = await getDocumentsErpApi().issueCertificate({
        studentId: selectedStudent.id,
        templateId: selectedTemplate.id,
        issuedDate,
      })
      const refreshed = await getDocumentsErpApi().getIssuedCertificates()
      onIssuedCertificatesChange(refreshed)
      setSelectedIssued(issued)
      onNotice({
        type: 'success',
        message: `${issued.certificateNo} was issued to ${issued.studentName}.`,
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsIssuing(false)
    }
  }

  const viewIssued = (certificate: IssuedCertificate) => {
    setSelectedIssued(certificate)
    setStudentId(certificate.studentId)
    setTemplateId(
      activeTemplates.some((template) => template.id === certificate.templateId)
        ? certificate.templateId
        : '',
    )
    setIssuedDate(certificate.issuedDate)
  }

  const printIssued = (certificate: IssuedCertificate) => {
    viewIssued(certificate)
    window.setTimeout(() => window.print(), 80)
  }

  const columns: TableColumn<IssuedCertificate>[] = [
    {
      key: 'number',
      header: 'Certificate No.',
      render: (certificate) => (
        <strong className="receipt-number">{certificate.certificateNo}</strong>
      ),
    },
    {
      key: 'date',
      header: 'Issued Date',
      render: (certificate) => formatDocumentDate(certificate.issuedDate),
    },
    {
      key: 'student',
      header: 'Student',
      render: (certificate) => (
        <div className="primary-cell">
          <strong>{certificate.studentName}</strong>
          <span>{certificate.admissionNo}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (certificate) => certificate.certificateType,
    },
    {
      key: 'issuedBy',
      header: 'Issued By',
      render: (certificate) => certificate.issuedBy || '—',
    },
    {
      key: 'actions',
      header: 'Action',
      render: (certificate) => (
        <div className="table-actions">
          <button
            className="table-action-button"
            onClick={() => viewIssued(certificate)}
            type="button"
          >
            View
          </button>
          <button
            className="table-action-button"
            onClick={() => printIssued(certificate)}
            type="button"
          >
            <Icon name="print" size={13} />
            Print
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="document-workspace">
      <section className="panel document-toolbar">
        <div className="document-toolbar__heading">
          <span className="document-toolbar__icon">
            <Icon name="reports" size={20} />
          </span>
          <div>
            <h3>Generate Certificate</h3>
            <p>Preview, issue and print numbered student certificates.</p>
          </div>
        </div>
        <div className="document-filter-grid document-filter-grid--certificate">
          <label className="form-field">
            <span>Student</span>
            <select
              disabled={activeStudents.length === 0}
              onChange={(event) => changeStudent(event.target.value)}
              value={studentId}
            >
              {activeStudents.length === 0 && (
                <option value="">No active students available</option>
              )}
              {activeStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.admissionNo} · {student.name}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Template</span>
            <select
              disabled={activeTemplates.length === 0}
              onChange={(event) => changeTemplate(event.target.value)}
              value={templateId}
            >
              {activeTemplates.length === 0 && (
                <option value="">No active templates available</option>
              )}
              {activeTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Issue date</span>
            <input
              onChange={(event) => {
                setIssuedDate(event.target.value)
                setSelectedIssued(null)
              }}
              type="date"
              value={issuedDate}
            />
          </label>
          <div className="document-action-pair">
            <button
              className="primary-button"
              disabled={!selectedStudent || !selectedTemplate || isIssuing}
              onClick={() => void issueCertificate()}
              type="button"
            >
              <Icon name="check" size={16} />
              {isIssuing ? 'Issuing...' : 'Issue Certificate'}
            </button>
            <button
              className="secondary-button"
              disabled={!selectedIssued}
              onClick={() => window.setTimeout(() => window.print(), 50)}
              type="button"
            >
              <Icon name="print" size={16} />
              Print
            </button>
          </div>
        </div>
      </section>

      {!previewBody ? (
        <section className="panel document-empty-state">
          <Icon name="reports" size={28} />
          <h3>Certificate preview is not available</h3>
          <p>Create a student and an active certificate template first.</p>
        </section>
      ) : (
        <section className="panel document-preview-shell document-preview-shell--paper">
          <div className="document-preview-label">
            <span>
              {selectedIssued ? 'Issued certificate' : 'Preview before issue'}
            </span>
            <strong>
              {selectedIssued?.certificateNo || 'Number assigned when issued'}
            </strong>
          </div>
          <article className="certificate-print-area">
            <div className="certificate-border">
              <header className="official-document-header official-document-header--certificate">
                <span className="official-document-mark">
                  <Icon name="school" size={30} />
                </span>
                <div>
                  <h1>{settings.schoolName}</h1>
                  {settings.address && <p>{settings.address}</p>}
                  {(settings.phone || settings.email) && (
                    <span>
                      {[settings.phone, settings.email]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  )}
                </div>
              </header>
              <div className="certificate-heading">
                <span>Certificate of Record</span>
                <h2>{previewTitle}</h2>
                <i />
              </div>
              <div className="certificate-meta">
                <span>
                  Certificate No:{' '}
                  <strong>{selectedIssued?.certificateNo || 'Pending issue'}</strong>
                </span>
                <span>
                  Date: <strong>{formatDocumentDate(previewDate)}</strong>
                </span>
              </div>
              <p className="certificate-body">{previewBody}</p>
              <div className="certificate-student-summary">
                <span>
                  <small>Student</small>
                  <strong>{previewStudentName}</strong>
                </span>
                <span>
                  <small>Admission No.</small>
                  <strong>{previewAdmissionNo}</strong>
                </span>
                <span>
                  <small>Class / Section</small>
                  <strong>
                    {previewClass}
                    {previewSection ? ` / ${previewSection}` : ''}
                  </strong>
                </span>
              </div>
              <footer className="official-document-signatures certificate-signatures">
                <div>
                  <span />
                  <strong>Class Teacher</strong>
                </div>
                {selectedIssued?.issuedBy && (
                  <p>Issued by {selectedIssued.issuedBy}</p>
                )}
                <div>
                  <span />
                  <strong>Principal</strong>
                </div>
              </footer>
            </div>
          </article>
        </section>
      )}

      <section className="panel issued-certificate-history">
        <div className="panel-heading">
          <div>
            <h3>Issued Certificate History</h3>
            <p>Saved certificates retain their original merged wording.</p>
          </div>
          <span className="neutral-badge">
            {issuedCertificates.length} issued
          </span>
        </div>
        <DataTable
          columns={columns}
          emptyMessage="No certificates have been issued yet."
          getRowKey={(certificate) => certificate.id}
          rows={issuedCertificates}
        />
      </section>
    </div>
  )
}
