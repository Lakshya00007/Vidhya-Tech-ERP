import { useCallback, useEffect, useState } from 'react'
import './App.css'
import { AppLayout } from './components/AppLayout'
import { ModulePlaceholder } from './components/ModulePlaceholder'
import { PermissionDenied } from './components/PermissionDenied'
import {
  getAuthErpApi,
  getErrorMessage,
  getLicenseErpApi,
} from './lib/erpApi'
import { canAccessPage, canManageStudents } from './lib/permissions'
import type { NavigationTarget } from './lib/navigation'
import { Attendance } from './pages/Attendance'
import { CreateOwner } from './pages/CreateOwner'
import { Dashboard } from './pages/Dashboard'
import { Exams } from './pages/Exams'
import { Fees } from './pages/Fees'
import { Login } from './pages/Login'
import { LicenseActivation } from './pages/LicenseActivation'
import { Reports } from './pages/Reports'
import { Settings } from './pages/Settings'
import { Students } from './pages/Students'
import { StudentDocuments } from './pages/StudentDocuments'
import type {
  AuthUser,
  LicenseStatus,
  ModulePlaceholderInfo,
  PageId,
} from './types'
import type { ExamTab } from './pages/Exams'
import type { ReportTab } from './pages/Reports'
import type { SettingsTab } from './pages/Settings'
import type { StudentDocumentsView } from './pages/StudentDocuments'

function App() {
  const [activePage, setActivePage] = useState<PageId>('dashboard')
  const [activeView, setActiveView] = useState('')
  const [activeNavigationId, setActiveNavigationId] = useState('dashboard')
  const [navigationRevision, setNavigationRevision] = useState(0)
  const [placeholder, setPlaceholder] =
    useState<ModulePlaceholderInfo | null>(null)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null)
  const [authState, setAuthState] = useState<
    'loading' | 'license' | 'setup' | 'login' | 'authenticated' | 'unavailable'
  >('loading')
  const [authError, setAuthError] = useState('')

  const initializeApplication = useCallback(async () => {
    setAuthState('loading')
    setAuthError('')
    try {
      const nextLicenseStatus = await getLicenseErpApi().getLicenseStatus()
      setLicenseStatus(nextLicenseStatus)
      if (!nextLicenseStatus.isValid) {
        setCurrentUser(null)
        setAuthState('license')
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
      setAuthState(sessionUser ? 'authenticated' : 'login')
    } catch (error) {
      setAuthError(getErrorMessage(error))
      setAuthState('unavailable')
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(initializeApplication)
  }, [initializeApplication])

  const handleAuthenticated = (user: AuthUser) => {
    setCurrentUser(user)
    setActivePage('dashboard')
    setActiveView('')
    setActiveNavigationId('dashboard')
    setPlaceholder(null)
    setAuthState('authenticated')
  }

  const handleLogout = async () => {
    try {
      await getAuthErpApi().logout()
    } finally {
      setCurrentUser(null)
      setActivePage('dashboard')
      setActiveView('')
      setActiveNavigationId('dashboard')
      setPlaceholder(null)
      setAuthState('login')
    }
  }

  const handleLicenseStatusChange = useCallback((status: LicenseStatus) => {
    setLicenseStatus(status)
    if (!status.isValid) {
      setCurrentUser(null)
      setActivePage('dashboard')
      setActiveView('')
      setActiveNavigationId('dashboard')
      setPlaceholder(null)
      setAuthState('license')
    }
  }, [])

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
      void getLicenseErpApi()
        .getLicenseStatus()
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
      case 'students':
        return (
          <Students
            canManage={canManageStudents(currentUser.role)}
            initialAction={
              activeView === 'add' || activeView === 'import'
                ? activeView
                : undefined
            }
            key={`students-${activeView}-${navigationRevision}`}
          />
        )
      case 'fees':
        return <Fees />
      case 'attendance':
        return <Attendance />
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
            onLicenseStatusChange={handleLicenseStatusChange}
          />
        ) : null
      case 'documents':
        return (
          <StudentDocuments
            initialView={(activeView || 'id-cards') as StudentDocumentsView}
            key={`documents-${activeView}-${navigationRevision}`}
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

  if (authState === 'setup') {
    return <CreateOwner onCreated={() => setAuthState('login')} />
  }

  if (authState === 'login' || !currentUser) {
    return <Login onAuthenticated={handleAuthenticated} />
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
    >
      {renderPage()}
    </AppLayout>
  )
}

export default App
