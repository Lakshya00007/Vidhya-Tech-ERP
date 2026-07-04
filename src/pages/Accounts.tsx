import { useEffect, useState } from 'react'
import { Icon, type IconName } from '../components/Icon'
import { getAccountsErpApi, getErrorMessage } from '../lib/erpApi'
import type {
  AccountCategory,
  AccountTransaction,
  SchoolSettings,
} from '../types'
import { AccountStatement } from './accounts/AccountStatement'
import { AccountTransactionForm } from './accounts/AccountTransactionForm'
import { AccountsReport } from './accounts/AccountsReport'
import { ChartOfAccounts } from './accounts/ChartOfAccounts'
import type { AccountsNotice } from './accounts/types'

export type AccountsView =
  | 'chart'
  | 'income'
  | 'expense'
  | 'statement'
  | 'report'

interface AccountsProps {
  initialView?: AccountsView
}

const tabs: { id: AccountsView; label: string; icon: IconName }[] = [
  { id: 'chart', label: 'Chart Of Account', icon: 'wallet' },
  { id: 'income', label: 'Add Income', icon: 'plus' },
  { id: 'expense', label: 'Add Expense', icon: 'arrow' },
  { id: 'statement', label: 'Account Statement', icon: 'reports' },
  { id: 'report', label: 'Accounts Report', icon: 'dashboard' },
]

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

export function Accounts({ initialView = 'chart' }: AccountsProps) {
  const [activeView, setActiveView] = useState<AccountsView>(initialView)
  const [categories, setCategories] = useState<AccountCategory[]>([])
  const [transactions, setTransactions] = useState<AccountTransaction[]>([])
  const [settings, setSettings] = useState<SchoolSettings>(fallbackSettings)
  const [notice, setNotice] = useState<AccountsNotice | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isCurrent = true
    Promise.resolve()
      .then(() => {
        const api = getAccountsErpApi()
        return Promise.all([
          api.getAccountCategories(),
          api.getAccountTransactions(),
          api.getSchoolSettings(),
        ])
      })
      .then(([categoryRows, transactionRows, schoolSettings]) => {
        if (!isCurrent) return
        setCategories(categoryRows)
        setTransactions(transactionRows)
        setSettings(schoolSettings)
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setNotice({ type: 'error', message: getErrorMessage(error) })
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })
    return () => {
      isCurrent = false
    }
  }, [])

  const changeView = (view: AccountsView) => {
    setActiveView(view)
    setNotice(null)
  }

  const addTransaction = (transaction: AccountTransaction) => {
    setTransactions((current) => [
      transaction,
      ...current.filter((item) => item.id !== transaction.id),
    ])
  }

  return (
    <div className="page-stack accounts-page">
      <section className="page-header">
        <div>
          <h2>Accounts</h2>
          <p>
            Manage the chart of accounts and reconcile school income and
            expenses.
          </p>
        </div>
      </section>

      <nav className="settings-tabs accounts-tabs" aria-label="Accounts sections">
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
          <h3>Loading account records...</h3>
        </section>
      ) : (
        <>
          {activeView === 'chart' && (
            <ChartOfAccounts
              categories={categories}
              onCategoriesChange={setCategories}
              onNotice={setNotice}
            />
          )}
          {activeView === 'income' && (
            <AccountTransactionForm
              categories={categories}
              onNotice={setNotice}
              onTransactionCreated={addTransaction}
              type="Income"
            />
          )}
          {activeView === 'expense' && (
            <AccountTransactionForm
              categories={categories}
              onNotice={setNotice}
              onTransactionCreated={addTransaction}
              type="Expense"
            />
          )}
          {activeView === 'statement' && (
            <AccountStatement
              categories={categories}
              onNotice={setNotice}
              onTransactionsChange={setTransactions}
              settings={settings}
              transactions={transactions}
            />
          )}
          {activeView === 'report' && (
            <AccountsReport settings={settings} transactions={transactions} />
          )}
        </>
      )}
    </div>
  )
}
