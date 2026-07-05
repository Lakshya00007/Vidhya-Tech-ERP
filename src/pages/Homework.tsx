import { useCallback, useEffect, useState } from 'react'
import { Icon, type IconName } from '../components/Icon'
import { getErrorMessage, getHomeworkErpApi } from '../lib/erpApi'
import type { Homework as HomeworkItem, SchoolSettings } from '../types'
import { HomeworkAssignment } from './homework/HomeworkAssignment'
import { HomeworkDashboard } from './homework/HomeworkDashboard'
import { HomeworkReport } from './homework/HomeworkReport'
import type {
  HomeworkData,
  HomeworkNotice,
  HomeworkView,
} from './homework/types'

export type { HomeworkView } from './homework/types'

interface HomeworkProps {
  initialView?: HomeworkView
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

const initialData: HomeworkData = {
  homework: [],
  classes: [],
  sections: [],
  subjects: [],
  employees: [],
  settings: fallbackSettings,
}

const tabs: { id: HomeworkView; label: string; icon: IconName }[] = [
  { id: 'dashboard', label: 'Homework Dashboard', icon: 'dashboard' },
  { id: 'assign', label: 'Assign Homework', icon: 'edit' },
  { id: 'report', label: 'Homework Report', icon: 'reports' },
]

export function Homework({ initialView = 'dashboard' }: HomeworkProps) {
  const [activeView, setActiveView] = useState<HomeworkView>(initialView)
  const [data, setData] = useState<HomeworkData>(initialData)
  const [editingHomework, setEditingHomework] =
    useState<HomeworkItem | null>(null)
  const [notice, setNotice] = useState<HomeworkNotice | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadHomework = useCallback(async () => {
    const api = getHomeworkErpApi()
    const homework = await api.getHomework()
    setData((current) => ({ ...current, homework }))
  }, [])

  useEffect(() => {
    let current = true
    Promise.resolve()
      .then(() => {
        const api = getHomeworkErpApi()
        return Promise.all([
          api.getHomework(),
          api.getClasses(),
          api.getSections(),
          api.getSubjects(),
          api.getEmployees(),
          api.getSchoolSettings(),
        ])
      })
      .then(
        ([homework, classes, sections, subjects, employees, settings]) => {
          if (!current) return
          setData({
            homework,
            classes,
            sections,
            subjects,
            employees,
            settings,
          })
        },
      )
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

  const changeView = (view: HomeworkView) => {
    setActiveView(view)
    setEditingHomework(null)
    setNotice(null)
  }

  const editHomework = (homework: HomeworkItem) => {
    setEditingHomework(homework)
    setActiveView('assign')
    setNotice(null)
  }

  const childProps = { data, onNotice: setNotice }

  return (
    <div className="page-stack homework-page">
      <section className="page-header">
        <div>
          <h2>Homework</h2>
          <p>
            Assign class work and track student submissions in the offline
            school database.
          </p>
        </div>
      </section>

      <nav
        aria-label="Homework sections"
        className="settings-tabs homework-tabs"
      >
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
          <h3>Loading homework records...</h3>
        </section>
      ) : (
        <>
          {activeView === 'dashboard' && (
            <HomeworkDashboard
              {...childProps}
              onEdit={editHomework}
            />
          )}
          {activeView === 'assign' && (
            <HomeworkAssignment
              {...childProps}
              editingHomework={editingHomework}
              key={editingHomework?.id ?? 'new-homework'}
              onEdit={setEditingHomework}
              onRefresh={loadHomework}
            />
          )}
          {activeView === 'report' && (
            <HomeworkReport {...childProps} onRefresh={loadHomework} />
          )}
        </>
      )}
    </div>
  )
}
