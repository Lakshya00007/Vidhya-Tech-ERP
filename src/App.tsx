import { useEffect, useState } from 'react'
import './App.css'
import { AppLayout } from './components/AppLayout'
import { PermissionDenied } from './components/PermissionDenied'
import { getAuthErpApi, getErrorMessage } from './lib/erpApi'
import { canAccessPage, canManageStudents } from './lib/permissions'
import { Attendance } from './pages/Attendance'
import { CreateOwner } from './pages/CreateOwner'
import { Dashboard } from './pages/Dashboard'
import { Exams } from './pages/Exams'
import { Fees } from './pages/Fees'
import { Login } from './pages/Login'
import { Reports } from './pages/Reports'
import { Settings } from './pages/Settings'
import { Students } from './pages/Students'
import type { AuthUser, PageId } from './types'

function App() {
  const [activePage, setActivePage] = useState<PageId>('dashboard')
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [authState, setAuthState] = useState<
    'loading' | 'setup' | 'login' | 'authenticated' | 'unavailable'
  >('loading')
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    let isCurrent = true

    const loadAuth = async () => {
      try {
        const api = getAuthErpApi()
        const hasUsers = await api.hasUsers()
        if (!isCurrent) return
        if (!hasUsers) {
          setAuthState('setup')
          return
        }
        const sessionUser = await api.getCurrentUser()
        if (!isCurrent) return
        setCurrentUser(sessionUser)
        setAuthState(sessionUser ? 'authenticated' : 'login')
      } catch (error) {
        if (!isCurrent) return
        setAuthError(getErrorMessage(error))
        setAuthState('unavailable')
      }
    }

    void loadAuth()
    return () => {
      isCurrent = false
    }
  }, [])

  const handleAuthenticated = (user: AuthUser) => {
    setCurrentUser(user)
    setActivePage('dashboard')
    setAuthState('authenticated')
  }

  const handleLogout = async () => {
    try {
      await getAuthErpApi().logout()
    } finally {
      setCurrentUser(null)
      setActivePage('dashboard')
      setAuthState('login')
    }
  }

  const renderPage = () => {
    if (!currentUser || !canAccessPage(currentUser.role, activePage)) {
      return <PermissionDenied />
    }

    switch (activePage) {
      case 'students':
        return <Students canManage={canManageStudents(currentUser.role)} />
      case 'fees':
        return <Fees />
      case 'attendance':
        return <Attendance />
      case 'exams':
        return <Exams />
      case 'reports':
        return <Reports />
      case 'settings':
        return <Settings currentUser={currentUser} />
      case 'dashboard':
      default:
        return (
          <Dashboard
            currentUser={currentUser}
            onNavigate={setActivePage}
          />
        )
    }
  }

  if (authState === 'loading') {
    return (
      <main className="auth-loading">
        <span className="auth-loading__mark">V</span>
        <strong>Opening Vidhya School ERP</strong>
        <p>Checking the local account database...</p>
      </main>
    )
  }

  if (authState === 'unavailable') {
    return (
      <main className="auth-loading auth-loading--error">
        <strong>Electron login API is not available</strong>
        <p>{authError}</p>
        <small>Open the application with npm run desktop.</small>
      </main>
    )
  }

  if (authState === 'setup') {
    return <CreateOwner onCreated={() => setAuthState('login')} />
  }

  if (authState === 'login' || !currentUser) {
    return <Login onAuthenticated={handleAuthenticated} />
  }

  return (
    <AppLayout
      activePage={activePage}
      currentUser={currentUser}
      onLogout={() => void handleLogout()}
      onNavigate={setActivePage}
    >
      {renderPage()}
    </AppLayout>
  )
}

export default App
