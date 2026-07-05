import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon, type IconName } from '../components/Icon'
import { getErrorMessage, getTimetableErpApi } from '../lib/erpApi'
import type { SchoolSettings } from '../types'
import { TimetableEditor } from './timetable/TimetableEditor'
import {
  ClassroomsSetup,
  PeriodsSetup,
  WeekdaysSetup,
} from './timetable/TimetableMasters'
import {
  ClassTimetable,
  TeacherTimetable,
} from './timetable/TimetableViews'
import type {
  TimetableData,
  TimetableNotice,
  TimetableView,
} from './timetable/types'

export type { TimetableView } from './timetable/types'

interface TimetableProps {
  canManage: boolean
  initialView?: TimetableView
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

const initialData: TimetableData = {
  weekdays: [],
  periods: [],
  classrooms: [],
  entries: [],
  classes: [],
  sections: [],
  subjects: [],
  employees: [],
  settings: fallbackSettings,
}

const tabs: {
  id: TimetableView
  label: string
  icon: IconName
  manageOnly?: boolean
}[] = [
  { id: 'weekdays', label: 'Weekdays', icon: 'calendar', manageOnly: true },
  { id: 'periods', label: 'Time Periods', icon: 'clock', manageOnly: true },
  { id: 'classrooms', label: 'Class Rooms', icon: 'building', manageOnly: true },
  { id: 'create', label: 'Create Timetable', icon: 'edit', manageOnly: true },
  { id: 'class', label: 'Class Timetable', icon: 'school' },
  { id: 'teacher', label: 'Teacher Timetable', icon: 'user' },
]

export function Timetable({
  canManage,
  initialView = canManage ? 'weekdays' : 'class',
}: TimetableProps) {
  const allowedTabs = useMemo(
    () => tabs.filter((tab) => canManage || !tab.manageOnly),
    [canManage],
  )
  const initialTab = allowedTabs.some((tab) => tab.id === initialView)
    ? initialView
    : 'class'
  const [activeView, setActiveView] =
    useState<TimetableView>(initialTab)
  const [data, setData] = useState<TimetableData>(initialData)
  const [notice, setNotice] = useState<TimetableNotice | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async () => {
    const api = getTimetableErpApi()
    const [
      weekdays,
      periods,
      classrooms,
      entries,
      classes,
      sections,
      subjects,
      employees,
      settings,
    ] = await Promise.all([
      api.getTimetableWeekdays(),
      api.getTimetablePeriods(),
      api.getClassrooms(),
      api.getTimetableEntries(),
      api.getClasses(),
      api.getSections(),
      api.getSubjects(),
      api.getEmployees(),
      api.getSchoolSettings(),
    ])
    setData({
      weekdays,
      periods,
      classrooms,
      entries,
      classes,
      sections,
      subjects,
      employees,
      settings,
    })
  }, [])

  useEffect(() => {
    let current = true
    Promise.resolve()
      .then(loadData)
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
  }, [loadData])

  const refresh = useCallback(async () => {
    await loadData()
  }, [loadData])

  const childProps = { data, onNotice: setNotice, onRefresh: refresh }

  return (
    <div className="page-stack timetable-page">
      <section className="page-header">
        <div>
          <h2>Timetable</h2>
          <p>
            Configure the school week, assign conflict-free periods and print
            class or teacher schedules.
          </p>
        </div>
      </section>

      <nav
        aria-label="Timetable sections"
        className="settings-tabs timetable-tabs"
      >
        {allowedTabs.map((tab) => (
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
          <h3>Loading timetable setup...</h3>
        </section>
      ) : (
        <>
          {activeView === 'weekdays' && canManage && (
            <WeekdaysSetup {...childProps} />
          )}
          {activeView === 'periods' && canManage && (
            <PeriodsSetup {...childProps} />
          )}
          {activeView === 'classrooms' && canManage && (
            <ClassroomsSetup {...childProps} />
          )}
          {activeView === 'create' && canManage && (
            <TimetableEditor {...childProps} />
          )}
          {activeView === 'class' && <ClassTimetable {...childProps} />}
          {activeView === 'teacher' && <TeacherTimetable {...childProps} />}
        </>
      )}
    </div>
  )
}
