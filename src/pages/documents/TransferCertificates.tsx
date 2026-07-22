import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { DataTable, type TableColumn } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import { TransferCertificatePrint } from '../../components/PrintableSchoolDocuments'
import { getDocumentsErpApi, getErrorMessage } from '../../lib/erpApi'
import { exportCsv } from '../../lib/reportUtils'
import { formatDocumentDate, getTodayInputValue } from '../../lib/documentPrint'
import type {
  DocumentTemplateSettings,
  SchoolSettings,
  Student,
  TransferCertificate,
  TransferCertificateInput,
  TransferCertificatePreview,
} from '../../types'
import type { DocumentNoticeProps } from './types'

interface TransferCertificatesProps extends DocumentNoticeProps {
  settings: SchoolSettings
  students: Student[]
}

const emptyTemplate: DocumentTemplateSettings = {
  id: '',
  documentType: 'Transfer Certificate',
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
  createdAt: '',
  updatedAt: '',
  syncStatus: 'pending',
}

const emptyForm: TransferCertificateInput = {
  studentId: '',
  issueDate: getTodayInputValue(),
  promotionQualified: '',
  promotedToClass: '',
  duesPaidUpto: '',
  generalConduct: 'Good',
  reasonForLeaving: '',
  nationality: 'Indian',
  casteCategory: '',
  remarks: '',
}

export function TransferCertificates({
  onNotice,
  settings,
  students,
}: TransferCertificatesProps) {
  const activeStudents = useMemo(
    () => students.filter((student) => student.status === 'Active'),
    [students],
  )
  const [certificates, setCertificates] = useState<TransferCertificate[]>([])
  const [templateSettings, setTemplateSettings] =
    useState<DocumentTemplateSettings>(emptyTemplate)
  const [form, setForm] = useState<TransferCertificateInput>({
    ...emptyForm,
    studentId: activeStudents[0]?.id ?? '',
  })
  const [selected, setSelected] = useState<TransferCertificate | null>(null)
  const [preview, setPreview] = useState<TransferCertificatePreview | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const loadCertificates = useCallback(async () => {
    const [rows, documentSettings] = await Promise.all([
      getDocumentsErpApi().getTransferCertificates({}),
      getDocumentsErpApi().getDocumentTemplateSettings(),
    ])
    setCertificates(rows)
    setTemplateSettings(
      documentSettings.find(
        (item) => item.documentType === 'Transfer Certificate',
      ) ?? emptyTemplate,
    )
  }, [])

  useEffect(() => {
    let isCurrent = true
    Promise.resolve()
      .then(loadCertificates)
      .catch((error: unknown) => {
        if (isCurrent) onNotice({ type: 'error', message: getErrorMessage(error) })
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })
    return () => {
      isCurrent = false
    }
  }, [loadCertificates, onNotice])

  useEffect(() => {
    if (!form.studentId) return
    let isCurrent = true
    Promise.resolve()
      .then(() => getDocumentsErpApi().getTransferCertificatePreview(form))
      .then((nextPreview) => {
        if (isCurrent) setPreview(nextPreview)
      })
      .catch(() => {
        if (isCurrent) setPreview(null)
      })
    return () => {
      isCurrent = false
    }
  }, [form])

  const updateForm = (field: keyof TransferCertificateInput, value: string) => {
    setSelected(null)
    setForm((current) => ({ ...current, [field]: value }))
  }

  const loadIntoForm = (certificate: TransferCertificate) => {
    setSelected(certificate)
    setForm({
      studentId: certificate.studentId,
      certificateNumber: certificate.certificateNumber,
      serialNumber: certificate.serialNumber,
      srNumber: certificate.srNumber,
      penNumber: certificate.penNumber,
      academicSessionId: certificate.academicSessionId,
      academicSessionName: certificate.academicSessionName,
      studentName: certificate.studentName,
      admissionNo: certificate.admissionNo,
      className: certificate.className,
      section: certificate.section,
      fatherGuardianName: certificate.fatherGuardianName,
      motherName: certificate.motherName,
      dateOfAdmission: certificate.dateOfAdmission,
      admissionClass: certificate.admissionClass,
      dateOfBirth: certificate.dateOfBirth,
      dateOfBirthWords: certificate.dateOfBirthWords,
      lastClassStudied: certificate.lastClassStudied,
      promotionQualified: certificate.promotionQualified,
      promotedToClass: certificate.promotedToClass,
      duesPaidUpto: certificate.duesPaidUpto,
      generalConduct: certificate.generalConduct,
      issueDate: certificate.issueDate,
      reasonForLeaving: certificate.reasonForLeaving,
      nationality: certificate.nationality,
      casteCategory: certificate.casteCategory,
      remarks: certificate.remarks,
      issuedBy: certificate.issuedBy,
      reissuedFromId: certificate.reissuedFromId,
    })
  }

  const saveDraft = async (event: FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    try {
      const saved =
        selected?.status === 'Draft'
          ? await getDocumentsErpApi().updateTransferCertificateDraft(
              selected.id,
              form,
            )
          : await getDocumentsErpApi().createTransferCertificateDraft(form)
      await loadCertificates()
      setSelected(saved)
      onNotice({
        type: 'success',
        message: `Draft ${saved.certificateNumber} saved.`,
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  const issueSelected = async () => {
    if (!selected || selected.status !== 'Draft') return
    if (!window.confirm(`Issue transfer certificate ${selected.certificateNumber}?`)) {
      return
    }
    setIsSaving(true)
    try {
      const issued = await getDocumentsErpApi().issueTransferCertificate(
        selected.id,
        { issueDate: form.issueDate },
      )
      await loadCertificates()
      setSelected(issued)
      onNotice({
        type: 'success',
        message: `${issued.certificateNumber} issued.`,
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  const reprint = async (certificate: TransferCertificate) => {
    try {
      const updated = await getDocumentsErpApi().reprintTransferCertificate(
        certificate.id,
      )
      setSelected(updated)
      await loadCertificates()
      window.setTimeout(() => window.print(), 80)
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const cancelSelected = async () => {
    if (!selected) return
    const reason = window.prompt('Enter cancellation reason')
    if (!reason) return
    try {
      const cancelled = await getDocumentsErpApi().cancelTransferCertificate(
        selected.id,
        reason,
      )
      await loadCertificates()
      setSelected(cancelled)
      onNotice({
        type: 'success',
        message: `${cancelled.certificateNumber} cancelled.`,
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const markTransferred = async () => {
    if (!selected || selected.status !== 'Issued') return
    if (
      !window.confirm(
        `Mark ${selected.studentName} as transferred/inactive? This does not edit the certificate.`,
      )
    ) {
      return
    }
    try {
      await getDocumentsErpApi().markStudentTransferredFromCertificate(selected.id)
      onNotice({
        type: 'success',
        message: `${selected.studentName} was marked inactive.`,
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const filteredCertificates = certificates.filter((certificate) => {
    const query = search.trim().toLowerCase()
    const matchesStatus =
      statusFilter === 'All' || certificate.status === statusFilter
    const matchesSearch =
      !query ||
      [
        certificate.certificateNumber,
        certificate.serialNumber,
        certificate.srNumber,
        certificate.penNumber,
        certificate.studentName,
        certificate.admissionNo,
      ].some((value) => value.toLowerCase().includes(query))
    return matchesStatus && matchesSearch
  })

  const exportRegister = () => {
    exportCsv(
      'transfer-certificate-register.csv',
      [
        'Certificate No.',
        'Serial No.',
        'Student',
        'Admission No.',
        'Class',
        'Issue Date',
        'Status',
      ],
      filteredCertificates.map((certificate) => [
        certificate.certificateNumber,
        certificate.serialNumber,
        certificate.studentName,
        certificate.admissionNo,
        `${certificate.className}${certificate.section ? `-${certificate.section}` : ''}`,
        certificate.issueDate,
        certificate.status,
      ]),
    )
  }

  const columns: TableColumn<TransferCertificate>[] = [
    {
      key: 'certificate',
      header: 'Certificate No.',
      render: (certificate) => (
        <strong className="receipt-number">{certificate.certificateNumber}</strong>
      ),
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
      key: 'class',
      header: 'Class / Section',
      render: (certificate) =>
        `${certificate.className || '-'}${certificate.section ? `-${certificate.section}` : ''}`,
    },
    {
      key: 'date',
      header: 'Issue Date',
      render: (certificate) => formatDocumentDate(certificate.issueDate),
    },
    {
      key: 'status',
      header: 'Status',
      render: (certificate) => (
        <span className={`status-badge status-badge--${certificate.status.toLowerCase()}`}>
          {certificate.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      render: (certificate) => (
        <div className="table-actions">
          <button
            className="table-action-button"
            type="button"
            onClick={() => loadIntoForm(certificate)}
          >
            View
          </button>
          <button
            className="table-action-button"
            type="button"
            disabled={certificate.status === 'Draft'}
            onClick={() => void reprint(certificate)}
          >
            <Icon name="print" size={13} />
            Reprint
          </button>
        </div>
      ),
    },
  ]

  const printCertificate = selected ?? preview

  return (
    <div className="document-workspace">
      <section className="panel document-toolbar">
        <div className="document-toolbar__heading">
          <span className="document-toolbar__icon">
            <Icon name="school" size={20} />
          </span>
          <div>
            <h3>Transfer Certificates</h3>
            <p>Prepare drafts, issue certificates and reprint register copies.</p>
          </div>
        </div>
      </section>

      <form className="panel certificate-editor" onSubmit={(event) => void saveDraft(event)}>
        <div className="panel-heading">
          <div>
            <h3>{selected ? `Editing ${selected.certificateNumber}` : 'New TC Draft'}</h3>
            <p>Issued certificates cannot be silently overwritten.</p>
          </div>
          <div className="row-action-group">
            <button
              className="secondary-button"
              disabled={!selected || selected.status !== 'Draft' || isSaving}
              type="button"
              onClick={() => void issueSelected()}
            >
              Issue
            </button>
            <button
              className="secondary-button"
              disabled={!selected || selected.status === 'Cancelled'}
              type="button"
              onClick={() => void cancelSelected()}
            >
              Cancel
            </button>
            <button
              className="secondary-button"
              disabled={!selected || selected.status !== 'Issued'}
              type="button"
              onClick={() => void markTransferred()}
            >
              Mark Student Transferred
            </button>
            <button
              className="primary-button"
              disabled={isSaving || selected?.status === 'Issued'}
              type="submit"
            >
              <Icon name="check" size={16} />
              {isSaving ? 'Saving...' : 'Save Draft'}
            </button>
          </div>
        </div>
        <div className="settings-fields">
          <label className="form-field">
            <span>Student</span>
            <select
              required
              disabled={selected?.status === 'Issued'}
              value={form.studentId ?? ''}
              onChange={(event) => updateForm('studentId', event.target.value)}
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
            <span>Issue Date</span>
            <input
              required
              type="date"
              value={form.issueDate ?? ''}
              onChange={(event) => updateForm('issueDate', event.target.value)}
            />
          </label>
          <label className="form-field">
            <span>Certificate No.</span>
            <input
              placeholder="Auto-generated if blank"
              value={form.certificateNumber ?? ''}
              onChange={(event) =>
                updateForm('certificateNumber', event.target.value)
              }
            />
          </label>
          <label className="form-field">
            <span>Serial No.</span>
            <input
              placeholder="Auto-generated if blank"
              value={form.serialNumber ?? ''}
              onChange={(event) =>
                updateForm('serialNumber', event.target.value)
              }
            />
          </label>
          <label className="form-field">
            <span>SR No.</span>
            <input
              value={form.srNumber ?? ''}
              onChange={(event) => updateForm('srNumber', event.target.value)}
            />
          </label>
          <label className="form-field">
            <span>PEN No.</span>
            <input
              value={form.penNumber ?? ''}
              onChange={(event) => updateForm('penNumber', event.target.value)}
            />
          </label>
          <label className="form-field">
            <span>Admission Class</span>
            <input
              value={form.admissionClass ?? ''}
              onChange={(event) =>
                updateForm('admissionClass', event.target.value)
              }
            />
          </label>
          <label className="form-field">
            <span>Last Class Studied</span>
            <input
              value={form.lastClassStudied ?? ''}
              onChange={(event) =>
                updateForm('lastClassStudied', event.target.value)
              }
            />
          </label>
          <label className="form-field">
            <span>Qualified for Promotion</span>
            <input
              placeholder="Yes / No"
              value={form.promotionQualified ?? ''}
              onChange={(event) =>
                updateForm('promotionQualified', event.target.value)
              }
            />
          </label>
          <label className="form-field">
            <span>Promoted To Class</span>
            <input
              value={form.promotedToClass ?? ''}
              onChange={(event) =>
                updateForm('promotedToClass', event.target.value)
              }
            />
          </label>
          <label className="form-field">
            <span>Dues Paid Up To</span>
            <input
              value={form.duesPaidUpto ?? ''}
              onChange={(event) =>
                updateForm('duesPaidUpto', event.target.value)
              }
            />
          </label>
          <label className="form-field">
            <span>General Conduct</span>
            <input
              value={form.generalConduct ?? ''}
              onChange={(event) =>
                updateForm('generalConduct', event.target.value)
              }
            />
          </label>
          <label className="form-field">
            <span>Reason for Leaving</span>
            <input
              value={form.reasonForLeaving ?? ''}
              onChange={(event) =>
                updateForm('reasonForLeaving', event.target.value)
              }
            />
          </label>
          <label className="form-field">
            <span>Nationality</span>
            <input
              value={form.nationality ?? ''}
              onChange={(event) =>
                updateForm('nationality', event.target.value)
              }
            />
          </label>
          <label className="form-field">
            <span>Caste / Category</span>
            <input
              value={form.casteCategory ?? ''}
              onChange={(event) =>
                updateForm('casteCategory', event.target.value)
              }
            />
          </label>
          <label className="form-field form-field--full">
            <span>Remarks</span>
            <textarea
              rows={2}
              value={form.remarks ?? ''}
              onChange={(event) => updateForm('remarks', event.target.value)}
            />
          </label>
        </div>
      </form>

      {printCertificate && (
        <section className="panel document-preview-shell document-preview-shell--paper">
          <div className="document-preview-label">
            <span>A4 print preview</span>
            <strong>{selected?.status ?? 'Draft Preview'}</strong>
            <button
              className="secondary-button"
              type="button"
              onClick={() => window.setTimeout(() => window.print(), 50)}
            >
              <Icon name="print" size={16} />
              Print / Save PDF
            </button>
          </div>
          <TransferCertificatePrint
            certificate={printCertificate}
            settings={settings}
            template={templateSettings}
          />
        </section>
      )}

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Issue Register</h3>
            <p>Search issued, draft and cancelled transfer certificates.</p>
          </div>
          <button className="secondary-button" type="button" onClick={exportRegister}>
            <Icon name="download" size={16} />
            Export CSV
          </button>
        </div>
        <div className="list-toolbar">
          <label className="search-field search-field--wide">
            <Icon name="search" size={18} />
            <input
              type="search"
              placeholder="Search by certificate, serial, student, SR or PEN"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label className="student-list-filter">
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">All</option>
              <option value="Draft">Draft</option>
              <option value="Issued">Issued</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </label>
        </div>
        <DataTable
          columns={columns}
          rows={filteredCertificates}
          getRowKey={(certificate) => certificate.id}
          emptyMessage={
            isLoading
              ? 'Loading transfer certificates...'
              : 'No transfer certificates found.'
          }
        />
      </section>
    </div>
  )
}
