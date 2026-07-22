import { useEffect, useState } from 'react'
import { Icon, type IconName } from '../components/Icon'
import { getDocumentsErpApi, getErrorMessage } from '../lib/erpApi'
import type {
  CertificateTemplate,
  ClassItem,
  IssuedCertificate,
  SchoolSettings,
  SectionItem,
  Student,
} from '../types'
import { AdmissionLetter } from './documents/AdmissionLetter'
import { AdmissionForm } from './documents/AdmissionForm'
import { Certificates } from './documents/Certificates'
import { CertificateTemplates } from './documents/CertificateTemplates'
import { StudentIdCards } from './documents/StudentIdCards'
import { TransferCertificates } from './documents/TransferCertificates'
import type { DocumentNotice } from './documents/types'

export type StudentDocumentsView =
  | 'id-cards'
  | 'admission-letter'
  | 'admission-form'
  | 'transfer-certificates'
  | 'certificates'
  | 'templates'

interface StudentDocumentsProps {
  initialView?: StudentDocumentsView
}

const tabs: {
  id: StudentDocumentsView
  label: string
  icon: IconName
}[] = [
  { id: 'id-cards', label: 'Student ID Cards', icon: 'students' },
  { id: 'admission-letter', label: 'Admission Letter', icon: 'reports' },
  { id: 'admission-form', label: 'Admission Form', icon: 'reports' },
  { id: 'transfer-certificates', label: 'Transfer Certificates', icon: 'school' },
  { id: 'certificates', label: 'Generate Certificate', icon: 'school' },
  { id: 'templates', label: 'Certificate Templates', icon: 'edit' },
]

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

export function StudentDocuments({
  initialView = 'id-cards',
}: StudentDocumentsProps) {
  const [activeView, setActiveView] =
    useState<StudentDocumentsView>(initialView)
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [sections, setSections] = useState<SectionItem[]>([])
  const [settings, setSettings] = useState<SchoolSettings>(fallbackSettings)
  const [templates, setTemplates] = useState<CertificateTemplate[]>([])
  const [issuedCertificates, setIssuedCertificates] = useState<
    IssuedCertificate[]
  >([])
  const [notice, setNotice] = useState<DocumentNotice | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isCurrent = true
    Promise.resolve()
      .then(() => {
        const api = getDocumentsErpApi()
        return Promise.all([
          api.getStudents(),
          api.getClasses(),
          api.getSections(),
          api.getSchoolSettings(),
          api.getCertificateTemplates(),
          api.getIssuedCertificates(),
        ])
      })
      .then(
        ([
          studentRows,
          classRows,
          sectionRows,
          schoolSettings,
          templateRows,
          issuedRows,
        ]) => {
          if (!isCurrent) return
          setStudents(studentRows)
          setClasses(classRows)
          setSections(sectionRows)
          setSettings(schoolSettings)
          setTemplates(templateRows)
          setIssuedCertificates(issuedRows)
        },
      )
      .catch((error: unknown) => {
        if (isCurrent) {
          setNotice({ type: 'error', message: getErrorMessage(error) })
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [])

  const changeView = (view: StudentDocumentsView) => {
    setActiveView(view)
    setNotice(null)
  }

  return (
    <div className="page-stack documents-page">
      <section className="page-header">
        <div>
          <h2>Student Documents</h2>
          <p>
            Create printable identity cards, admission letters and numbered
            certificates.
          </p>
        </div>
      </section>

      <nav className="settings-tabs document-tabs" aria-label="Student documents">
        {tabs.map((tab) => (
          <button
            className={`settings-tab${
              activeView === tab.id ? ' settings-tab--active' : ''
            }`}
            key={tab.id}
            onClick={() => changeView(tab.id)}
            type="button"
          >
            <Icon name={tab.icon} size={17} />
            {tab.label}
          </button>
        ))}
      </nav>

      {notice && (
        <div
          className={`inline-message${
            notice.type === 'error' ? ' inline-message--error' : ''
          }`}
        >
          <Icon name={notice.type === 'error' ? 'close' : 'check'} size={17} />
          <span>{notice.message}</span>
          <button
            aria-label="Dismiss message"
            onClick={() => setNotice(null)}
            type="button"
          >
            <Icon name="close" size={15} />
          </button>
        </div>
      )}

      {isLoading ? (
        <section className="panel document-empty-state">
          <span className="loading-spinner" />
          <h3>Loading student documents...</h3>
        </section>
      ) : (
        <>
          {activeView === 'id-cards' && (
            <StudentIdCards
              classes={classes}
              sections={sections}
              settings={settings}
              students={students}
            />
          )}
          {activeView === 'admission-letter' && (
            <AdmissionLetter settings={settings} students={students} />
          )}
          {activeView === 'admission-form' && (
            <AdmissionForm onNotice={setNotice} students={students} />
          )}
          {activeView === 'transfer-certificates' && (
            <TransferCertificates
              onNotice={setNotice}
              settings={settings}
              students={students}
            />
          )}
          {activeView === 'certificates' && (
            <Certificates
              issuedCertificates={issuedCertificates}
              onIssuedCertificatesChange={setIssuedCertificates}
              onNotice={setNotice}
              settings={settings}
              students={students}
              templates={templates}
            />
          )}
          {activeView === 'templates' && (
            <CertificateTemplates
              onNotice={setNotice}
              onTemplatesChange={setTemplates}
              templates={templates}
            />
          )}
        </>
      )}
    </div>
  )
}
