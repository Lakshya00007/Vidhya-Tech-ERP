import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon, type IconName } from '../components/Icon'
import {
  getAcademicSessionsErpApi,
  getErrorMessage,
} from '../lib/erpApi'
import type { PermissionRole, SchoolSettings } from '../types'
import { CarryForwardDues } from './academicSessions/CarryForwardDues'
import { PromotionHistory } from './academicSessions/PromotionHistory'
import { SessionManagement } from './academicSessions/SessionManagement'
import { SessionReport } from './academicSessions/SessionReport'
import { StudentPromotion } from './academicSessions/StudentPromotion'
import type {
  AcademicSessionsData,
  AcademicSessionsNotice,
  AcademicSessionsView,
} from './academicSessions/types'

export type { AcademicSessionsView } from './academicSessions/types'

interface AcademicSessionsProps {
  initialView?: AcademicSessionsView
  currentUserRole: PermissionRole
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

const tabs: {
  id: AcademicSessionsView
  label: string
  icon: IconName
  roles: PermissionRole[]
}[] = [
  {
    id: 'sessions',
    label: 'Academic Sessions',
    icon: 'calendar',
    roles: ['Owner', 'Admin'],
  },
  {
    id: 'promote',
    label: 'Promote Students',
    icon: 'students',
    roles: ['Owner', 'Admin'],
  },
  {
    id: 'history',
    label: 'Promotion History',
    icon: 'clock',
    roles: ['Owner', 'Admin', 'Accountant', 'Teacher'],
  },
  {
    id: 'dues',
    label: 'Carry Forward Dues',
    icon: 'fees',
    roles: ['Owner', 'Admin', 'Accountant'],
  },
  {
    id: 'report',
    label: 'Session Report',
    icon: 'reports',
    roles: ['Owner', 'Admin', 'Accountant', 'Teacher'],
  },
]

export function AcademicSessions({
  initialView = 'sessions',
  currentUserRole,
}: AcademicSessionsProps) {
  const allowedTabs = useMemo(
    () => tabs.filter((tab) => tab.roles.includes(currentUserRole)),
    [currentUserRole],
  )
  const initialAllowedView = allowedTabs.some((tab) => tab.id === initialView)
    ? initialView
    : allowedTabs[0]?.id ?? 'report'
  const [activeView, setActiveView] =
    useState<AcademicSessionsView>(initialAllowedView)
  const [data, setData] = useState<AcademicSessionsData>({
    sessions: [],
    currentSession: null,
    classes: [],
    sections: [],
    students: [],
    promotions: [],
    settings: fallbackSettings,
    role: currentUserRole,
  })
  const [notice, setNotice] = useState<AcademicSessionsNotice | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async () => {
    const api = getAcademicSessionsErpApi()
    const [
      sessions,
      currentSession,
      classes,
      sections,
      students,
      promotions,
      settings,
    ] = await Promise.all([
      api.getAcademicSessions(),
      api.getCurrentAcademicSession(),
      api.getClasses(),
      api.getSections(),
      api.getStudents(),
      api.getStudentPromotions(),
      api.getSchoolSettings(),
    ])
    setData({
      sessions,
      currentSession,
      classes,
      sections,
      students,
      promotions,
      settings,
      role: currentUserRole,
    })
  }, [currentUserRole])

  useEffect(() => {
    let current = true
    void Promise.resolve()
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

  const childProps = {
    data,
    onNotice: setNotice,
    onRefresh: loadData,
  }

  return (
    <div className="page-stack academic-sessions-page">
      <section className="page-header">
        <div>
          <h2>Academic Sessions & Promotion</h2>
          <p>
            Manage yearly student movement while preserving prior academic and
            financial records.
          </p>
        </div>
        {data.currentSession && (
          <div className="page-header-session-badge">
            <span>Current Session</span>
            <strong>{data.currentSession.sessionName}</strong>
          </div>
        )}
      </section>

      <nav
        aria-label="Academic session sections"
        className="settings-tabs academic-session-tabs"
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
          <h3>Loading academic session data...</h3>
        </section>
      ) : (
        <>
          {activeView === 'sessions' && <SessionManagement {...childProps} />}
          {activeView === 'promote' && <StudentPromotion {...childProps} />}
          {activeView === 'history' && <PromotionHistory {...childProps} />}
          {activeView === 'dues' && <CarryForwardDues {...childProps} />}
          {activeView === 'report' && <SessionReport {...childProps} />}
        </>
      )}
    </div>
  )
}
