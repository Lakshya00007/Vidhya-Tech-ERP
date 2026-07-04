import { useMemo, useState } from 'react'
import { DataTable, type TableColumn } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import { getAccountsErpApi, getErrorMessage } from '../../lib/erpApi'
import {
  exportCsv,
  formatCurrency,
  formatGeneratedAt,
  formatReportDate,
  getCurrentMonthValue,
  getMonthDateRange,
} from '../../lib/reportUtils'
import type {
  AccountCategory,
  AccountTransaction,
  AccountType,
  SchoolSettings,
} from '../../types'
import type { AccountsNoticeProps } from './types'

interface AccountStatementProps extends AccountsNoticeProps {
  categories: AccountCategory[]
  onTransactionsChange: (transactions: AccountTransaction[]) => void
  settings: SchoolSettings
  transactions: AccountTransaction[]
}

export function AccountStatement({
  categories,
  onNotice,
  onTransactionsChange,
  settings,
  transactions,
}: AccountStatementProps) {
  const currentRange = getMonthDateRange(getCurrentMonthValue())
  const [startDate, setStartDate] = useState(currentRange?.startDate ?? '')
  const [endDate, setEndDate] = useState(currentRange?.endDate ?? '')
  const [type, setType] = useState<'All' | AccountType>('All')
  const [categoryId, setCategoryId] = useState('')

  const visibleCategories = categories.filter(
    (category) => type === 'All' || category.type === type,
  )
  const visibleTransactions = useMemo(
    () =>
      transactions.filter(
        (transaction) =>
          transaction.transactionDate >= startDate &&
          transaction.transactionDate <= endDate &&
          (type === 'All' || transaction.type === type) &&
          (!categoryId || transaction.categoryId === categoryId),
      ),
    [categoryId, endDate, startDate, transactions, type],
  )
  const totalIncome = visibleTransactions
    .filter((transaction) => transaction.type === 'Income')
    .reduce((total, transaction) => total + transaction.amount, 0)
  const totalExpense = visibleTransactions
    .filter((transaction) => transaction.type === 'Expense')
    .reduce((total, transaction) => total + transaction.amount, 0)
  const netBalance = totalIncome - totalExpense

  const deleteTransaction = async (transaction: AccountTransaction) => {
    if (
      !window.confirm(
        `Delete ${transaction.transactionNo}? This manual ledger entry will be soft-deleted.`,
      )
    ) {
      return
    }
    try {
      const api = getAccountsErpApi()
      const result = await api.deleteAccountTransaction(transaction.id)
      if (!result.success) throw new Error('Account transaction was not found.')
      onTransactionsChange(await api.getAccountTransactions())
      onNotice({
        type: 'success',
        message: `${transaction.transactionNo} was removed from active accounts.`,
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const columns: TableColumn<AccountTransaction>[] = [
    {
      key: 'number',
      header: 'Transaction No.',
      render: (transaction) => (
        <strong className="table-primary">{transaction.transactionNo}</strong>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (transaction) => formatReportDate(transaction.transactionDate),
    },
    {
      key: 'type',
      header: 'Type',
      render: (transaction) => (
        <span
          className={`account-type-badge account-type-badge--${transaction.type.toLowerCase()}`}
        >
          {transaction.type}
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (transaction) => transaction.categoryName,
    },
    {
      key: 'title',
      header: 'Title',
      render: (transaction) => (
        <div className="primary-cell">
          <strong>{transaction.title}</strong>
          <span>{transaction.referenceNo || 'No reference'}</span>
        </div>
      ),
    },
    {
      key: 'mode',
      header: 'Payment Mode',
      render: (transaction) => transaction.paymentMode,
    },
    {
      key: 'amount',
      header: 'Amount',
      className: 'align-right',
      render: (transaction) => (
        <strong
          className={`account-amount account-amount--${transaction.type.toLowerCase()}`}
        >
          {transaction.type === 'Expense' ? '− ' : '+ '}
          {formatCurrency(transaction.amount)}
        </strong>
      ),
    },
    {
      key: 'linked',
      header: 'Linked Module',
      render: (transaction) => (
        <span className="neutral-badge">{transaction.linkedModule}</span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      className: 'account-statement-actions',
      render: (transaction) =>
        transaction.linkedModule === 'Manual' ? (
          <button
            className="table-action-button table-action-button--danger"
            onClick={() => void deleteTransaction(transaction)}
            type="button"
          >
            <Icon name="trash" size={13} />
          </button>
        ) : (
          <span className="account-linked-label">Auto</span>
        ),
    },
  ]

  const exportStatement = () => {
    exportCsv(
      `account-statement-${startDate}-to-${endDate}.csv`,
      [
        'Transaction No',
        'Date',
        'Type',
        'Category',
        'Title',
        'Payment Mode',
        'Amount',
        'Reference No',
        'Linked Module',
        'Created By',
      ],
      visibleTransactions.map((transaction) => [
        transaction.transactionNo,
        transaction.transactionDate,
        transaction.type,
        transaction.categoryName,
        transaction.title,
        transaction.paymentMode,
        transaction.amount,
        transaction.referenceNo,
        transaction.linkedModule,
        transaction.createdBy,
      ]),
    )
  }

  return (
    <div className="account-report-workspace">
      <section className="panel account-statement-toolbar">
        <div>
          <h3>Account Statement</h3>
          <p>Filter and reconcile income and expense ledger activity.</p>
        </div>
        <div className="account-statement-filters">
          <label className="form-field form-field--compact">
            <span>Start Date</span>
            <input
              onChange={(event) => setStartDate(event.target.value)}
              type="date"
              value={startDate}
            />
          </label>
          <label className="form-field form-field--compact">
            <span>End Date</span>
            <input
              onChange={(event) => setEndDate(event.target.value)}
              type="date"
              value={endDate}
            />
          </label>
          <label className="form-field form-field--compact">
            <span>Type</span>
            <select
              onChange={(event) => {
                setType(event.target.value as 'All' | AccountType)
                setCategoryId('')
              }}
              value={type}
            >
              <option value="All">All</option>
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
            </select>
          </label>
          <label className="form-field form-field--compact">
            <span>Category</span>
            <select
              onChange={(event) => setCategoryId(event.target.value)}
              value={categoryId}
            >
              <option value="">All categories</option>
              {visibleCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="account-report-actions">
          <button
            className="secondary-button"
            disabled={visibleTransactions.length === 0}
            onClick={exportStatement}
            type="button"
          >
            <Icon name="download" size={15} />
            Export CSV
          </button>
          <button
            className="secondary-button"
            disabled={visibleTransactions.length === 0}
            onClick={() => window.setTimeout(() => window.print(), 50)}
            type="button"
          >
            <Icon name="print" size={15} />
            Print
          </button>
        </div>
      </section>

      <section className="panel account-statement-print-area">
        <header className="account-report-header">
          <div>
            <span className="account-report-mark">
              <Icon name="school" size={22} />
            </span>
            <div>
              <h2>{settings.schoolName}</h2>
              <p>{settings.address}</p>
            </div>
          </div>
          <div>
            <h1>Account Statement</h1>
            <p>
              {formatReportDate(startDate)} to {formatReportDate(endDate)}
            </p>
            <span>Generated {formatGeneratedAt()}</span>
          </div>
        </header>
        <div className="account-summary-grid">
          <div>
            <span>Total Income</span>
            <strong className="account-income-text">
              {formatCurrency(totalIncome)}
            </strong>
          </div>
          <div>
            <span>Total Expense</span>
            <strong className="account-expense-text">
              {formatCurrency(totalExpense)}
            </strong>
          </div>
          <div>
            <span>Net Balance</span>
            <strong className={netBalance >= 0 ? 'account-income-text' : 'account-expense-text'}>
              {formatCurrency(netBalance)}
            </strong>
          </div>
        </div>
        <DataTable
          columns={columns}
          emptyMessage="No account transactions found for these filters."
          getRowKey={(transaction) => transaction.id}
          rows={visibleTransactions}
        />
        <footer className="account-report-footer">
          <span>{visibleTransactions.length} transaction(s)</span>
          <strong>Net balance: {formatCurrency(netBalance)}</strong>
        </footer>
      </section>
    </div>
  )
}
