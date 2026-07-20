import { useCallback, useEffect, useState } from 'react'
import './App.css'
import { AppLayout } from './components/AppLayout'
import { ModulePlaceholder } from './components/ModulePlaceholder'
import { PermissionDenied } from './components/PermissionDenied'
import {
  getAuthErpApi,
  getErpApi,
  getErrorMessage,
  getLicenseErpApi,
} from './lib/erpApi'
import { shouldCheckRemoteLicense } from './lib/license'
import {
  canAccessPage,
  canDeleteStudentObservations,
  canManageBehaviourSkillsMasters,
  canManageStudents,
  canManageTimetable,
} from './lib/permissions'
import type { NavigationTarget } from './lib/navigation'
import { Attendance, type AttendanceView } from './pages/Attendance'
import { Accounts } from './pages/Accounts'
import { AcademicSessions } from './pages/AcademicSessions'
import { BehaviourSkills } from './pages/BehaviourSkills'
import { CreateOwner } from './pages/CreateOwner'
import { ClassTests } from './pages/ClassTests'
import { Dashboard } from './pages/Dashboard'
import { Exams } from './pages/Exams'
import { Employees } from './pages/Employees'
import { EmployeeLoginManagement } from './pages/EmployeeLoginManagement'
import { EmployeePortal } from './pages/EmployeePortal'
import {
  ExternalCommunications,
  type ExternalCommunicationsView,
} from './pages/ExternalCommunications'
import { Fees, type FeesView } from './pages/Fees'
import { ManageFamilies } from './pages/ManageFamilies'
import { MessageCenter, type MessageCenterTab } from './pages/MessageCenter'
import { Login } from './pages/Login'
import { QuestionPaper } from './pages/QuestionPaper'
import { LicenseActivation } from './pages/LicenseActivation'
import { Homework } from './pages/Homework'
import { Reports } from './pages/Reports'
import { RemoteLicenseLock } from './pages/RemoteLicenseLock'
import { Settings } from './pages/Settings'
import { Salary } from './pages/Salary'
import { Students, type StudentListStatusFilter } from './pages/Students'
import { StudentLoginManagement } from './pages/StudentLoginManagement'
import { StudentPortal } from './pages/StudentPortal'
import { StudentDocuments } from './pages/StudentDocuments'
import { TemporaryPasswordChange } from './pages/TemporaryPasswordChange'
import { Timetable } from './pages/Timetable'
import type {
  AuthUser,
  AppPreference,
  LicenseStatus,
  ModulePlaceholderInfo,
  PageId,
} from './types'
import type { ExamTab } from './pages/Exams'
import type { AccountsView } from './pages/Accounts'
import type { EmployeesView } from './pages/Employees'
import type { ReportTab } from './pages/Reports'
import type { SettingsTab } from './pages/Settings'
import type { SalaryView } from './pages/Salary'
import type { StudentDocumentsView } from './pages/StudentDocuments'
import type { TimetableView } from './pages/Timetable'
import type { HomeworkView } from './pages/Homework'
import type { ClassTestsView } from './pages/ClassTests'
import type { QuestionPaperView } from './pages/QuestionPaper'
import type { BehaviourSkillsView } from './pages/BehaviourSkills'
import type { AcademicSessionsView } from './pages/AcademicSessions'

const studentStatusViews: Record<string, StudentListStatusFilter> = {
  'status-active': 'Active',
  'status-inactive': 'Inactive',
  'status-tc': 'TC',
  'status-left': 'Left',
  'status-all': 'All',
}

const defaultPreferences: AppPreference = {
  id: 'application-defaults',
  preferenceScope: 'Application',
  userId: '',
  themeMode: 'Light',
  accentColor: 'Blue',
  language: 'English',
  compactSidebar: false,
  fontScale: 'Normal',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '12 Hour',
  createdAt: '',
  updatedAt: '',
}

const defaultTargetForUser = (user: AuthUser): {
  page: PageId
  navigationId: string
} => {
  if (user.role === 'Student' || user.accountType === 'Student') {
    return { page: 'student-portal', navigationId: 'student-portal' }
  }
  if (user.entityLink?.entityType === 'Employee') {
    return { page: 'employee-portal', navigationId: 'employee-portal' }
  }
  return { page: 'dashboard', navigationId: 'dashboard' }
}

function getStudentInitialState(view: string): {
  action?: 'add' | 'import'
  sessionFilter?: 'Current' | 'All'
  statusFilter?: StudentListStatusFilter
} {
  if (view === 'add' || view === 'import') {
    return { action: view }
  }

  const statusFilter = studentStatusViews[view]
  if (statusFilter) {
    return {
      sessionFilter: statusFilter === 'All' ? 'All' : 'Current',
      statusFilter,
    }
  }

  return {}
}

function App() {
  const [activePage, setActivePage] = useState<PageId>('dashboard')
  const [activeView, setActiveView] = useState('')
  const [activeNavigationId, setActiveNavigationId] = useState('dashboard')
  const [navigationRevision, setNavigationRevision] = useState(0)
  const [placeholder, setPlaceholder] =
    useState<ModulePlaceholderInfo | null>(null)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [preferences, setPreferences] =
    useState<AppPreference>(defaultPreferences)
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null)
  const [authState, setAuthState] = useState<
    | 'loading'
    | 'license'
    | 'remote-lock'
    | 'setup'
    | 'login'
    | 'password-change'
    | 'authenticated'
    | 'unavailable'
  >('loading')
  const [authError, setAuthError] = useState('')

  const initializeApplication = useCallback(async () => {
    setAuthState('loading')
    setAuthError('')
    try {
      const licenseApi = getLicenseErpApi()
      let nextLicenseStatus = await licenseApi.getLicenseStatus()
      if (!nextLicenseStatus.isValid) {
        setLicenseStatus(nextLicenseStatus)
        setCurrentUser(null)
        setAuthState('license')
        return
      }
      await licenseApi.checkRemoteLicenseNow()
      nextLicenseStatus = await licenseApi.getLicenseStatus()
      setLicenseStatus(nextLicenseStatus)
      if (nextLicenseStatus.remote?.blocksUsage) {
        setAuthState('remote-lock')
        return
      }

      const api = getAuthErpApi()
      const hasUsers = await api.hasUsers()
      if (!hasUsers) {
        setCurrentUser(null)
        setAuthState('setup')
        return
      }
      const sessionUser = await api.getCurrentUser()
      setCurrentUser(sessionUser)
      if (sessionUser?.mustChangePassword) {
        setAuthState('password-change')
      } else if (sessionUser) {
        const target = defaultTargetForUser(sessionUser)
        setActivePage(target.page)
        setActiveNavigationId(target.navigationId)
        setAuthState('authenticated')
      } else {
        setAuthState('login')
      }
    } catch (error) {
      setAuthError(getErrorMessage(error))
      setAuthState('unavailable')
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(initializeApplication)
  }, [initializeApplication])

  const handleAuthenticated = (user: AuthUser) => {
    const target = defaultTargetForUser(user)
    setCurrentUser(user)
    setActivePage(target.page)
    setActiveView('')
    setActiveNavigationId(target.navigationId)
    setPlaceholder(null)
    setAuthState(user.mustChangePassword ? 'password-change' : 'authenticated')
  }

  const handleTemporaryPasswordChanged = (user: AuthUser) => {
    const target = defaultTargetForUser(user)
    setCurrentUser(user)
    setActivePage(target.page)
    setActiveView('')
    setActiveNavigationId(target.navigationId)
    setPlaceholder(null)
    setAuthState('authenticated')
  }

  const handleLogout = async () => {
    try {
      await getAuthErpApi().logout()
    } finally {
      setCurrentUser(null)
      setPreferences(defaultPreferences)
      setActivePage('dashboard')
      setActiveView('')
      setActiveNavigationId('dashboard')
      setPlaceholder(null)
      setAuthState('login')
    }
  }

  useEffect(() => {
    if (authState !== 'authenticated' || !currentUser) return
    let isCurrent = true
    Promise.resolve()
      .then(() => getErpApi().getUserPreferences())
      .then((userPreferences) => {
        if (isCurrent) setPreferences(userPreferences)
      })
      .catch(() => {
        if (isCurrent) setPreferences(defaultPreferences)
      })
    return () => {
      isCurrent = false
    }
  }, [authState, currentUser])

  useEffect(() => {
    document.documentElement.dataset.theme = preferences.themeMode.toLowerCase()
    document.documentElement.dataset.accent =
      preferences.accentColor.toLowerCase()
    document.documentElement.dataset.fontScale =
      preferences.fontScale.toLowerCase()
    document.documentElement.lang = preferences.language === 'Hindi' ? 'hi' : 'en'
  }, [preferences])

  const handleLicenseStatusChange = useCallback((status: LicenseStatus) => {
    setLicenseStatus(status)
    if (!status.isValid) {
      setCurrentUser(null)
      setActivePage('dashboard')
      setActiveView('')
      setActiveNavigationId('dashboard')
      setPlaceholder(null)
      setAuthState('license')
      return
    }
    if (status.remote?.blocksUsage) {
      setActivePage('dashboard')
      setActiveView('')
      setActiveNavigationId('dashboard')
      setPlaceholder(null)
      setAuthState('remote-lock')
    }
  }, [])

  const handleRemoteLicenseUnlocked = useCallback(
    (status: LicenseStatus) => {
      setLicenseStatus(status)
      void initializeApplication()
    },
    [initializeApplication],
  )

  const handleNavigate = (
    target: NavigationTarget,
    navigationId: string = target.page,
  ) => {
    setActivePage(target.page)
    setActiveView(target.view ?? '')
    setActiveNavigationId(navigationId)
    setNavigationRevision((revision) => revision + 1)
    setPlaceholder(null)
  }

  const handlePlaceholder = (info: ModulePlaceholderInfo) => {
    setActivePage('placeholder')
    setActiveView('')
    setActiveNavigationId(info.id)
    setPlaceholder(info)
  }

  useEffect(() => {
    if (authState !== 'authenticated') return
    const intervalId = window.setInterval(() => {
      void Promise.resolve()
        .then(async () => {
          const licenseApi = getLicenseErpApi()
          let nextStatus = await licenseApi.getLicenseStatus()
          if (shouldCheckRemoteLicense(nextStatus)) {
            await licenseApi.checkRemoteLicenseNow()
            nextStatus = await licenseApi.getLicenseStatus()
          }
          return nextStatus
        })
        .then(handleLicenseStatusChange)
        .catch((error: unknown) => {
          setAuthError(getErrorMessage(error))
          setAuthState('unavailable')
        })
    }, 60_000)
    return () => window.clearInterval(intervalId)
  }, [authState, handleLicenseStatusChange])

  const renderPage = () => {
    if (!currentUser || !canAccessPage(currentUser.role, activePage)) {
      return <PermissionDenied />
    }

    switch (activePage) {
      case 'placeholder':
        return placeholder ? (
          <ModulePlaceholder
            info={placeholder}
            onBack={() => handleNavigate({ page: 'dashboard' }, 'dashboard')}
          />
        ) : (
          <PermissionDenied />
        )
      case 'students': {
        const studentInitialState = getStudentInitialState(activeView)
        return (
          <Students
            canManage={canManageStudents(currentUser.role)}
            initialAction={studentInitialState.action}
            initialSessionFilter={studentInitialState.sessionFilter}
            initialStatusFilter={studentInitialState.statusFilter}
            key={`students-${activeView}-${navigationRevision}`}
          />
        )
      }
      case 'families':
        return (
          <ManageFamilies
            canManage={canManageStudents(currentUser.role)}
            initialTab={activeView || 'families'}
            key={`families-${activeView}-${navigationRevision}`}
          />
        )
      case 'student-login-management':
        return <StudentLoginManagement />
      case 'employee-login-management':
        return <EmployeeLoginManagement />
      case 'message-center':
        return (
          <MessageCenter
            currentUser={currentUser}
            initialTab={(activeView || 'inbox') as MessageCenterTab}
            key={`message-center-${activeView}-${navigationRevision}`}
          />
        )
      case 'external-communications': {
        const communicationsView =
          (activeView || 'whatsapp') as ExternalCommunicationsView
        return (
          <ExternalCommunications
            channel={communicationsView.startsWith('sms') ? 'SMS' : 'WhatsApp'}
            initialView={communicationsView}
            key={`external-communications-${activeView}-${navigationRevision}`}
          />
        )
      }
      case 'student-portal':
        return (
          <StudentPortal
            onOpenMessages={() =>
              handleNavigate({ page: 'message-center', view: 'inbox' }, 'message-center')
            }
          />
        )
      case 'employee-portal':
        return (
          <EmployeePortal
            onOpenMessages={() =>
              handleNavigate({ page: 'message-center', view: 'inbox' }, 'message-center')
            }
          />
        )
      case 'fees':
        return (
          <Fees
            currentUser={currentUser}
            initialView={(activeView || 'collect') as FeesView}
            key={`fees-${activeView}-${navigationRevision}`}
          />
        )
      case 'attendance':
        return (
          <Attendance
            currentUser={currentUser}
            initialView={(activeView || 'students') as AttendanceView}
            key={`attendance-${activeView}-${navigationRevision}`}
          />
        )
      case 'exams':
        return (
          <Exams
            initialTab={(activeView || 'subjects') as ExamTab}
            key={`exams-${activeView}-${navigationRevision}`}
          />
        )
      case 'reports':
        return (
          <Reports
            currentUser={currentUser}
            initialTab={(activeView || 'students') as ReportTab}
            key={`reports-${activeView}-${navigationRevision}`}
          />
        )
      case 'settings':
        return licenseStatus ? (
          <Settings
            currentUser={currentUser}
            initialTab={(activeView || 'profile') as SettingsTab}
            key={`settings-${activeView}-${navigationRevision}`}
            licenseStatus={licenseStatus}
            preferences={preferences}
            onCurrentUserChange={setCurrentUser}
            onLicenseStatusChange={handleLicenseStatusChange}
            onPreferencesChange={setPreferences}
            onLogout={() => void handleLogout()}
          />
        ) : null
      case 'documents':
        return (
          <StudentDocuments
            initialView={(activeView || 'id-cards') as StudentDocumentsView}
            key={`documents-${activeView}-${navigationRevision}`}
          />
        )
      case 'employees':
        return (
          <Employees
            initialView={(activeView || 'all') as EmployeesView}
            key={`employees-${activeView}-${navigationRevision}`}
          />
        )
      case 'salary':
        return (
          <Salary
            initialView={(activeView || 'pay') as SalaryView}
            key={`salary-${activeView}-${navigationRevision}`}
          />
        )
      case 'accounts':
        return (
          <Accounts
            initialView={(activeView || 'chart') as AccountsView}
            key={`accounts-${activeView}-${navigationRevision}`}
          />
        )
      case 'timetable':
        return (
          <Timetable
            canManage={canManageTimetable(currentUser.role)}
            initialView={(activeView || 'class') as TimetableView}
            key={`timetable-${activeView}-${navigationRevision}`}
          />
        )
      case 'homework':
        return (
          <Homework
            initialView={(activeView || 'dashboard') as HomeworkView}
            key={`homework-${activeView}-${navigationRevision}`}
          />
        )
      case 'class-tests':
        return (
          <ClassTests
            initialView={(activeView || 'manage') as ClassTestsView}
            key={`class-tests-${activeView}-${navigationRevision}`}
          />
        )
      case 'question-paper':
        return (
          <QuestionPaper
            initialView={(activeView || 'chapters') as QuestionPaperView}
            key={`question-paper-${activeView}-${navigationRevision}`}
          />
        )
      case 'behaviour-skills':
        return (
          <BehaviourSkills
            canDeleteObservations={canDeleteStudentObservations(
              currentUser.role,
            )}
            canManageMasters={canManageBehaviourSkillsMasters(
              currentUser.role,
            )}
            initialView={
              (activeView || 'behaviours') as BehaviourSkillsView
            }
            key={`behaviour-skills-${activeView}-${navigationRevision}`}
          />
        )
      case 'academic-sessions':
        return (
          <AcademicSessions
            currentUserRole={currentUser.role}
            initialView={
              (activeView || 'sessions') as AcademicSessionsView
            }
            key={`academic-sessions-${activeView}-${navigationRevision}`}
          />
        )
      case 'dashboard':
      default:
        return (
          <Dashboard
            currentUser={currentUser}
            onNavigate={(page) => handleNavigate({ page }, page)}
          />
        )
    }
  }

  if (authState === 'loading') {
    return (
      <main className="auth-loading">
        <span className="auth-loading__mark">V</span>
        <strong>Opening Vidhya School ERP</strong>
        <p>Checking the offline license and local account database...</p>
      </main>
    )
  }

  if (authState === 'unavailable') {
    return (
      <main className="auth-loading auth-loading--error">
        <strong>Electron desktop services are not available</strong>
        <p>{authError}</p>
        <small>Open the application with npm run desktop.</small>
      </main>
    )
  }

  if (authState === 'license') {
    return (
      <LicenseActivation
        initialStatus={licenseStatus}
        onActivated={() => void initializeApplication()}
      />
    )
  }

  if (authState === 'remote-lock' && licenseStatus) {
    return (
      <RemoteLicenseLock
        onStatusChange={handleLicenseStatusChange}
        onUnlocked={handleRemoteLicenseUnlocked}
        status={licenseStatus}
      />
    )
  }

  if (authState === 'setup') {
    return <CreateOwner onCreated={() => setAuthState('login')} />
  }

  if (authState === 'login' || !currentUser) {
    return <Login onAuthenticated={handleAuthenticated} />
  }

  if (authState === 'password-change') {
    return (
      <TemporaryPasswordChange
        currentUser={currentUser}
        onChanged={handleTemporaryPasswordChanged}
        onLogout={() => void handleLogout()}
      />
    )
  }

  if (!licenseStatus) {
    return (
      <main className="auth-loading">
        <span className="auth-loading__mark">V</span>
        <strong>Opening Vidhya School ERP</strong>
        <p>Loading the offline license...</p>
      </main>
    )
  }

  return (
    <AppLayout
      activePage={activePage}
      activeNavigationId={activeNavigationId}
      activeTitle={placeholder?.title}
      currentUser={currentUser}
      licenseStatus={licenseStatus}
      onLogout={() => void handleLogout()}
      onNavigate={handleNavigate}
      onPlaceholder={handlePlaceholder}
      preferences={preferences}
    >
      {renderPage()}
    </AppLayout>
  )
}

export default App
