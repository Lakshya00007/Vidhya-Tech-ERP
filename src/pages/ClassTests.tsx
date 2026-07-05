import { useCallback, useEffect, useState } from 'react'
import { Icon, type IconName } from '../components/Icon'
import { getClassTestsErpApi, getErrorMessage } from '../lib/erpApi'
import type { SchoolSettings } from '../types'
import { ClassTestResult } from './classTests/ClassTestResult'
import { ManageClassTests } from './classTests/ManageClassTests'
import type {
  ClassTestsData,
  ClassTestsNotice,
  ClassTestsView,
} from './classTests/types'

export type { ClassTestsView } from './classTests/types'

interface ClassTestsProps {
  initialView?: ClassTestsView
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

const initialData: ClassTestsData = {
  tests: [],
  classes: [],
  sections: [],
  subjects: [],
  employees: [],
  settings: fallbackSettings,
}

const tabs: { id: ClassTestsView; label: string; icon: IconName }[] = [
  { id: 'manage', label: 'Manage Test Marks', icon: 'edit' },
  { id: 'result', label: 'Test Result', icon: 'reports' },
]

export function ClassTests({ initialView = 'manage' }: ClassTestsProps) {
  const [activeView, setActiveView] = useState<ClassTestsView>(initialView)
  const [data, setData] = useState<ClassTestsData>(initialData)
  const [notice, setNotice] = useState<ClassTestsNotice | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadTests = useCallback(async () => {
    const tests = await getClassTestsErpApi().getClassTests()
    setData((current) => ({ ...current, tests }))
  }, [])

  useEffect(() => {
    let current = true
    Promise.resolve()
      .then(() => {
        const api = getClassTestsErpApi()
        return Promise.all([
          api.getClassTests(),
          api.getClasses(),
          api.getSections(),
          api.getSubjects(),
          api.getEmployees(),
          api.getSchoolSettings(),
        ])
      })
      .then(([tests, classes, sections, subjects, employees, settings]) => {
        if (!current) return
        setData({
          tests,
          classes,
          sections,
          subjects,
          employees,
          settings,
        })
      })
      .catch((error: unknown) => {
        if (current) {
          setNotice({ type: 'error', message: getErrorMessage(error) })
        }
      })
      .finally(() => {
        if (current) setIsLoading(false)
      })
    return () => {
      current = false
    }
  }, [])

  const childProps = { data, onNotice: setNotice }

  return (
    <div className="page-stack class-tests-page">
      <section className="page-header">
        <div>
          <h2>Class Tests</h2>
          <p>
            Create subject tests, enter marks and print student result
            registers.
          </p>
        </div>
      </section>

      <nav
        aria-label="Class test sections"
        className="settings-tabs class-tests-tabs"
      >
        {tabs.map((tab) => (
          <button
            className={`settings-tab${
              activeView === tab.id ? ' settings-tab--active' : ''
            }`}
            key={tab.id}
            onClick={() => {
              setActiveView(tab.id)
              setNotice(null)
            }}
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
          <h3>Loading class tests...</h3>
        </section>
      ) : (
        <>
          {activeView === 'manage' && (
            <ManageClassTests {...childProps} onRefresh={loadTests} />
          )}
          {activeView === 'result' && <ClassTestResult {...childProps} />}
        </>
      )}
    </div>
  )
}
