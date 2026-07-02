import { useState } from 'react'
import './App.css'
import { AppLayout } from './components/AppLayout'
import { Attendance } from './pages/Attendance'
import { Dashboard } from './pages/Dashboard'
import { Exams } from './pages/Exams'
import { Fees } from './pages/Fees'
import { Reports } from './pages/Reports'
import { Settings } from './pages/Settings'
import { Students } from './pages/Students'
import type { PageId } from './types'

function App() {
  const [activePage, setActivePage] = useState<PageId>('dashboard')

  const renderPage = () => {
    switch (activePage) {
      case 'students':
        return <Students />
      case 'fees':
        return <Fees />
      case 'attendance':
        return <Attendance />
      case 'exams':
        return <Exams />
      case 'reports':
        return <Reports />
      case 'settings':
        return <Settings />
      case 'dashboard':
      default:
        return <Dashboard onNavigate={setActivePage} />
    }
  }

  return (
    <AppLayout activePage={activePage} onNavigate={setActivePage}>
      {renderPage()}
    </AppLayout>
  )
}

export default App
