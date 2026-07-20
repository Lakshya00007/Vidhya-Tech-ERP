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
import { DiscountTypesSettings } from './settings/DiscountTypesSettings'
import { FeeInvoiceAccountsSettings } from './settings/FeeInvoiceAccountsSettings'
import { MarksGradingSettings } from './settings/MarksGradingSettings'
import { SchoolRulesSettings } from './settings/SchoolRulesSettings'
import { ThemeLanguageSettings } from './settings/ThemeLanguageSettings'
import { AccountSettings } from './settings/AccountSettings'
import { CommunicationIntegrationsSettings } from './settings/CommunicationIntegrationsSettings'
import { translateText } from '../lib/i18n'
import type { AppPreference, AuthUser, LicenseStatus } from '../types'

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
  | 'discount-types'
  | 'fee-invoice-accounts'
  | 'rules'
  | 'marks-grading'
  | 'theme-language'
  | 'account'
  | 'communications'
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
  { id: 'discount-types', label: 'Discount Types', icon: 'minus' },
  { id: 'fee-invoice-accounts', label: 'Fee Invoice Accounts', icon: 'reports' },
  { id: 'rules', label: 'Rules & Regulations', icon: 'reports' },
  { id: 'marks-grading', label: 'Marks Grading', icon: 'exams' },
  { id: 'theme-language', label: 'Theme & Language', icon: 'settings' },
  { id: 'account', label: 'Account Settings', icon: 'user' },
  { id: 'communications', label: 'Communication Integrations', icon: 'bell' },
  { id: 'users', label: 'Users & Roles', icon: 'user' },
  { id: 'backup', label: 'Backup & Restore', icon: 'download' },
  { id: 'demo', label: 'Demo Tools', icon: 'settings' },
  { id: 'license', label: 'License', icon: 'check' },
  { id: 'about', label: 'About', icon: 'school' },
]

interface SettingsProps {
  currentUser: AuthUser
  preferences: AppPreference
  licenseStatus: LicenseStatus
  onCurrentUserChange: (user: AuthUser) => void
  onLicenseStatusChange: (status: LicenseStatus) => void
  onLogout: () => void
  onPreferencesChange: (preferences: AppPreference) => void
  initialTab?: SettingsTab
}

export function Settings({
  currentUser,
  preferences,
  licenseStatus,
  onCurrentUserChange,
  onLicenseStatusChange,
  onLogout,
  onPreferencesChange,
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
      ? tabs.filter((tab) =>
          [
            'profile',
            'discount-types',
            'fee-invoice-accounts',
            'rules',
            'marks-grading',
            'theme-language',
            'account',
            'communications',
            'license',
            'about',
          ].includes(tab.id),
        )
      : currentUser.role === 'Teacher'
        ? tabs.filter((tab) =>
            [
              'rules',
              'marks-grading',
              'theme-language',
              'account',
              'about',
            ].includes(tab.id),
          )
        : currentUser.role === 'Viewer'
          ? tabs.filter((tab) =>
              ['rules', 'theme-language', 'account', 'about'].includes(tab.id),
            )
          : tabs.filter((tab) => tab.id !== 'demo' || currentUser.role === 'Owner')
  const language = preferences.language
  const t = (text: string) => translateText(text, language)
  const selectedTab = visibleTabs.some((tab) => tab.id === activeTab)
    ? activeTab
    : visibleTabs[0]?.id ?? 'account'

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
            className={`settings-tab${selectedTab === tab.id ? ' settings-tab--active' : ''}`}
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            type="button"
          >
            <Icon name={tab.icon} size={17} />
            {t(tab.label)}
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

      {selectedTab === 'profile' && (
        <SchoolProfileSettings
          onNotice={setNotice}
          readOnly={currentUser.role === 'Accountant'}
        />
      )}
      {selectedTab === 'classes' && <ClassesSectionsSettings onNotice={setNotice} />}
      {selectedTab === 'fee-heads' && <FeeHeadsSettings onNotice={setNotice} />}
      {selectedTab === 'fee-structure' && <FeeStructureSettings onNotice={setNotice} />}
      {selectedTab === 'discount-types' && (
        <DiscountTypesSettings
          onNotice={setNotice}
          readOnly={currentUser.role === 'Accountant'}
        />
      )}
      {selectedTab === 'fee-invoice-accounts' && (
        <FeeInvoiceAccountsSettings
          onNotice={setNotice}
          readOnly={currentUser.role === 'Accountant'}
        />
      )}
      {selectedTab === 'rules' && (
        <SchoolRulesSettings
          currentUser={currentUser}
          language={language}
          onNotice={setNotice}
          preferences={preferences}
          readOnly={
            currentUser.role !== 'Owner' && currentUser.role !== 'Admin'
          }
        />
      )}
      {selectedTab === 'marks-grading' && (
        <MarksGradingSettings
          onNotice={setNotice}
          readOnly={
            currentUser.role === 'Accountant' ||
            currentUser.role === 'Teacher'
          }
        />
      )}
      {selectedTab === 'theme-language' && (
        <ThemeLanguageSettings
          currentUser={currentUser}
          onNotice={setNotice}
          onPreferencesChange={onPreferencesChange}
          preferences={preferences}
        />
      )}
      {selectedTab === 'account' && (
        <AccountSettings
          currentUser={currentUser}
          language={language}
          onCurrentUserChange={onCurrentUserChange}
          onLogout={onLogout}
          onNotice={setNotice}
          preferences={preferences}
        />
      )}
      {selectedTab === 'communications' && (
        <CommunicationIntegrationsSettings onNotice={setNotice} />
      )}
      {selectedTab === 'users' && (
        <UsersRolesSettings currentUser={currentUser} onNotice={setNotice} />
      )}
      {selectedTab === 'backup' && (
        <BackupRestoreSettings
          canRestore={currentUser.role === 'Owner'}
          onNotice={setNotice}
        />
      )}
      {selectedTab === 'demo' && currentUser.role === 'Owner' && (
        <DemoToolsSettings onNotice={setNotice} />
      )}
      {selectedTab === 'license' && (
        <LicenseSettings
          currentUser={currentUser}
          initialStatus={licenseStatus}
          onNotice={setNotice}
          onStatusChange={onLicenseStatusChange}
        />
      )}
      {selectedTab === 'about' && <AboutSettings />}
    </div>
  )
}
