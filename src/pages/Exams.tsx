import { useEffect, useState } from 'react'
import { Icon, type IconName } from '../components/Icon'
import { getErpApi, getErrorMessage } from '../lib/erpApi'
import type {
  ClassItem,
  AcademicSession,
  Employee,
  Exam,
  SchoolSettings,
  SectionItem,
  Student,
  Subject,
} from '../types'
import { ExamsSetupTab } from './exams/ExamsSetupTab'
import { MarksEntryTab } from './exams/MarksEntryTab'
import { MarksheetTab } from './exams/MarksheetTab'
import { SubjectsTab } from './exams/SubjectsTab'
import {
  BlankAwardListTab,
  DateSheetTab,
  ExamScheduleTab,
  ResultSheetTab,
} from './exams/ExamOperationalTabs'
import type { ExamNotice } from './exams/types'

export type ExamTab =
  | 'subjects'
  | 'exams'
  | 'marks'
  | 'marksheet'
  | 'schedule'
  | 'date-sheet'
  | 'result-sheet'
  | 'blank-award-list'

const tabs: { id: ExamTab; label: string; icon: IconName }[] = [
  { id: 'subjects', label: 'Subjects', icon: 'exams' },
  { id: 'exams', label: 'Exams', icon: 'calendar' },
  { id: 'schedule', label: 'Exam Schedule', icon: 'calendar' },
  { id: 'date-sheet', label: 'Date Sheet', icon: 'reports' },
  { id: 'marks', label: 'Marks Entry', icon: 'edit' },
  { id: 'marksheet', label: 'Marksheet', icon: 'reports' },
  { id: 'result-sheet', label: 'Result Sheet', icon: 'reports' },
  { id: 'blank-award-list', label: 'Blank Award List', icon: 'print' },
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

interface ExamsProps {
  initialTab?: ExamTab
}

export function Exams({ initialTab = 'subjects' }: ExamsProps) {
  const [activeTab, setActiveTab] = useState<ExamTab>(initialTab)
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [sections, setSections] = useState<SectionItem[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [academicSessions, setAcademicSessions] = useState<AcademicSession[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [settings, setSettings] = useState<SchoolSettings>(fallbackSettings)
  const [notice, setNotice] = useState<ExamNotice | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isCurrent = true

    Promise.resolve()
      .then(() => {
        const api = getErpApi()
        return Promise.all([
          api.getClasses(),
          api.getSections(),
          api.getStudents(),
          api.getSubjects(),
          api.getExams(),
          api.getAcademicSessions(),
          api.getEmployees(),
          api.getSchoolSettings(),
        ])
      })
      .then(
        ([
          classRows,
          sectionRows,
          studentRows,
          subjectRows,
          examRows,
          sessionRows,
          employeeRows,
          schoolSettings,
        ]) => {
          if (!isCurrent) return
          setClasses(classRows)
          setSections(sectionRows)
          setStudents(studentRows)
          setSubjects(subjectRows)
          setExams(examRows)
          setAcademicSessions(sessionRows)
          setEmployees(employeeRows)
          setSettings(schoolSettings)
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

  const changeTab = (tab: ExamTab) => {
    setActiveTab(tab)
    setNotice(null)
  }

  return (
    <div className="page-stack exams-page">
      <section className="page-header">
        <div>
          <h2>Examinations</h2>
          <p>Configure subjects, schedule exams, enter marks and print marksheets.</p>
        </div>
      </section>

      <nav className="settings-tabs exam-tabs" aria-label="Examination sections">
        {tabs.map((tab) => (
          <button
            className={`settings-tab${activeTab === tab.id ? ' settings-tab--active' : ''}`}
            key={tab.id}
            type="button"
            onClick={() => changeTab(tab.id)}
          >
            <Icon name={tab.icon} size={17} />
            {tab.label}
          </button>
        ))}
      </nav>

      {notice && (
        <div
          className={`inline-message${notice.type === 'error' ? ' inline-message--error' : ''}`}
        >
          <Icon name={notice.type === 'error' ? 'close' : 'check'} size={17} />
          <span>{notice.message}</span>
          <button
            aria-label="Dismiss message"
            type="button"
            onClick={() => setNotice(null)}
          >
            <Icon name="close" size={15} />
          </button>
        </div>
      )}

      {isLoading ? (
        <section className="panel exam-loading-state">
          Loading examination records...
        </section>
      ) : (
        <>
          {activeTab === 'subjects' && (
            <SubjectsTab
              classes={classes}
              subjects={subjects}
              onNotice={setNotice}
              onSubjectsChange={setSubjects}
            />
          )}
          {activeTab === 'exams' && (
            <ExamsSetupTab
              classes={classes}
              exams={exams}
              sections={sections}
              settings={settings}
              onExamsChange={setExams}
              onNotice={setNotice}
            />
          )}
          {activeTab === 'marks' && (
            <MarksEntryTab
              classes={classes}
              exams={exams}
              sections={sections}
              students={students}
              subjects={subjects}
              onNotice={setNotice}
            />
          )}
          {activeTab === 'marksheet' && (
            <MarksheetTab
              exams={exams}
              settings={settings}
              students={students}
              onNotice={setNotice}
            />
          )}
          {activeTab === 'schedule' && (
            <ExamScheduleTab
              academicSessions={academicSessions}
              classes={classes}
              employees={employees}
              exams={exams}
              sections={sections}
              settings={settings}
              subjects={subjects}
              onNotice={setNotice}
            />
          )}
          {activeTab === 'date-sheet' && (
            <DateSheetTab
              academicSessions={academicSessions}
              classes={classes}
              employees={employees}
              exams={exams}
              sections={sections}
              settings={settings}
              subjects={subjects}
              onNotice={setNotice}
            />
          )}
          {activeTab === 'result-sheet' && (
            <ResultSheetTab
              academicSessions={academicSessions}
              classes={classes}
              employees={employees}
              exams={exams}
              sections={sections}
              settings={settings}
              subjects={subjects}
              onNotice={setNotice}
            />
          )}
          {activeTab === 'blank-award-list' && (
            <BlankAwardListTab
              academicSessions={academicSessions}
              classes={classes}
              employees={employees}
              exams={exams}
              sections={sections}
              settings={settings}
              subjects={subjects}
              onNotice={setNotice}
            />
          )}
        </>
      )}
    </div>
  )
}
