import { useState } from 'react'
import { Icon, type IconName } from '../components/Icon'
import { ClassesSectionsSettings } from './settings/ClassesSectionsSettings'
import { FeeHeadsSettings } from './settings/FeeHeadsSettings'
import { FeeStructureSettings } from './settings/FeeStructureSettings'
import { SchoolProfileSettings } from './settings/SchoolProfileSettings'
import { BackupRestoreSettings } from './settings/BackupRestoreSettings'
import { UsersRolesSettings } from './settings/UsersRolesSettings'
import { AboutSettings } from './settings/AboutSettings'
import { DemoToolsSettings } from './settings/DemoToolsSettings'
import { LicenseSettings } from './settings/LicenseSettings'
import type { AuthUser, LicenseStatus } from '../types'

export type SettingsNotice = {
  type: 'success' | 'error'
  message: string
}

export interface SettingsSectionProps {
  onNotice: (notice: SettingsNotice) => void
}

export type SettingsTab =
  | 'profile'
  | 'classes'
  | 'fee-heads'
  | 'fee-structure'
  | 'users'
  | 'backup'
  | 'demo'
  | 'license'
  | 'about'

const tabs: { id: SettingsTab; label: string; icon: IconName }[] = [
  { id: 'profile', label: 'School Profile', icon: 'school' },
  { id: 'classes', label: 'Classes & Sections', icon: 'building' },
  { id: 'fee-heads', label: 'Fee Heads', icon: 'wallet' },
  { id: 'fee-structure', label: 'Fee Structure', icon: 'fees' },
  { id: 'users', label: 'Users & Roles', icon: 'user' },
  { id: 'backup', label: 'Backup & Restore', icon: 'download' },
  { id: 'demo', label: 'Demo Tools', icon: 'settings' },
  { id: 'license', label: 'License', icon: 'check' },
  { id: 'about', label: 'About', icon: 'school' },
]

interface SettingsProps {
  currentUser: AuthUser
  licenseStatus: LicenseStatus
  onLicenseStatusChange: (status: LicenseStatus) => void
  initialTab?: SettingsTab
}

export function Settings({
  currentUser,
  licenseStatus,
  onLicenseStatusChange,
  initialTab = 'profile',
}: SettingsProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab)
  const [notice, setNotice] = useState<SettingsNotice | null>(null)

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab)
    setNotice(null)
  }

  const visibleTabs =
    currentUser.role === 'Accountant'
      ? tabs.filter(
          (tab) =>
            tab.id === 'profile' ||
            tab.id === 'license' ||
            tab.id === 'about',
        )
      : tabs.filter((tab) => tab.id !== 'demo' || currentUser.role === 'Owner')

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <h2>Settings</h2>
          <p>Configure the school profile, academic masters and fee structure.</p>
        </div>
      </section>

      <nav className="settings-tabs" aria-label="Settings sections">
        {visibleTabs.map((tab) => (
          <button
            className={`settings-tab${activeTab === tab.id ? ' settings-tab--active' : ''}`}
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            type="button"
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
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss message">
            <Icon name="close" size={15} />
          </button>
        </div>
      )}

      {activeTab === 'profile' && (
        <SchoolProfileSettings
          onNotice={setNotice}
          readOnly={currentUser.role === 'Accountant'}
        />
      )}
      {activeTab === 'classes' && <ClassesSectionsSettings onNotice={setNotice} />}
      {activeTab === 'fee-heads' && <FeeHeadsSettings onNotice={setNotice} />}
      {activeTab === 'fee-structure' && <FeeStructureSettings onNotice={setNotice} />}
      {activeTab === 'users' && (
        <UsersRolesSettings currentUser={currentUser} onNotice={setNotice} />
      )}
      {activeTab === 'backup' && (
        <BackupRestoreSettings
          canRestore={currentUser.role === 'Owner'}
          onNotice={setNotice}
        />
      )}
      {activeTab === 'demo' && currentUser.role === 'Owner' && (
        <DemoToolsSettings onNotice={setNotice} />
      )}
      {activeTab === 'license' && (
        <LicenseSettings
          currentUser={currentUser}
          initialStatus={licenseStatus}
          onNotice={setNotice}
          onStatusChange={onLicenseStatusChange}
        />
      )}
      {activeTab === 'about' && <AboutSettings />}
    </div>
  )
}
