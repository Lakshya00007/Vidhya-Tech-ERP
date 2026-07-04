import { useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import {
  exportCsv,
  formatCurrency,
  formatGeneratedAt,
  formatReportDate,
  getCurrentMonthValue,
  getMonthDateRange,
} from '../../lib/reportUtils'
import type {
  AccountTransaction,
  AccountType,
  PaymentMode,
  SchoolSettings,
} from '../../types'

interface AccountsReportProps {
  settings: SchoolSettings
  transactions: AccountTransaction[]
}

interface BreakdownRow {
  name: string
  count: number
  amount: number
}

const paymentModes: PaymentMode[] = [
  'Cash',
  'UPI',
  'Bank Transfer',
  'Cheque',
  'Card',
]

const categoryBreakdown = (
  transactions: AccountTransaction[],
  type: AccountType,
) => {
  const grouped = new Map<string, BreakdownRow>()
  transactions
    .filter((transaction) => transaction.type === type)
    .forEach((transaction) => {
      const row = grouped.get(transaction.categoryName) ?? {
        name: transaction.categoryName,
        count: 0,
        amount: 0,
      }
      row.count += 1
      row.amount += transaction.amount
      grouped.set(transaction.categoryName, row)
    })
  return [...grouped.values()].sort((left, right) => right.amount - left.amount)
}

export function AccountsReport({
  settings,
  transactions,
}: AccountsReportProps) {
  const currentRange = getMonthDateRange(getCurrentMonthValue())
  const [startDate, setStartDate] = useState(currentRange?.startDate ?? '')
  const [endDate, setEndDate] = useState(currentRange?.endDate ?? '')
  const visibleTransactions = useMemo(
    () =>
      transactions.filter(
        (transaction) =>
          transaction.transactionDate >= startDate &&
          transaction.transactionDate <= endDate,
      ),
    [endDate, startDate, transactions],
  )
  const incomeRows = categoryBreakdown(visibleTransactions, 'Income')
  const expenseRows = categoryBreakdown(visibleTransactions, 'Expense')
  const totalIncome = incomeRows.reduce((total, row) => total + row.amount, 0)
  const totalExpense = expenseRows.reduce((total, row) => total + row.amount, 0)
  const netBalance = totalIncome - totalExpense

  const exportReport = () => {
    exportCsv(
      `accounts-report-${startDate}-to-${endDate}.csv`,
      ['Section', 'Category / Mode', 'Transaction Count', 'Amount'],
      [
        ...incomeRows.map((row) => [
          'Income Category',
          row.name,
          row.count,
          row.amount,
        ]),
        ...expenseRows.map((row) => [
          'Expense Category',
          row.name,
          row.count,
          row.amount,
        ]),
        ...paymentModes.map((mode) => [
          'Payment Mode',
          mode,
          visibleTransactions.filter(
            (transaction) => transaction.paymentMode === mode,
          ).length,
          visibleTransactions
            .filter((transaction) => transaction.paymentMode === mode)
            .reduce((total, transaction) => total + transaction.amount, 0),
        ]),
        ['Summary', 'Net Balance', visibleTransactions.length, netBalance],
      ],
    )
  }

  return (
    <div className="account-report-workspace">
      <section className="panel account-report-toolbar">
        <div>
          <h3>Accounts Report</h3>
          <p>Category and payment-mode analysis of the school ledger.</p>
        </div>
        <div className="account-report-date-filters">
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
        </div>
        <div className="account-report-actions">
          <button
            className="secondary-button"
            disabled={visibleTransactions.length === 0}
            onClick={exportReport}
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

      <section className="panel accounts-report-print-area">
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
            <h1>Accounts Report</h1>
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
            <strong
              className={
                netBalance >= 0
                  ? 'account-income-text'
                  : 'account-expense-text'
              }
            >
              {formatCurrency(netBalance)}
            </strong>
          </div>
          <div>
            <span>Transactions</span>
            <strong>{visibleTransactions.length}</strong>
          </div>
        </div>
        <div className="account-breakdown-grid">
          <section>
            <header>
              <div>
                <h3>Income Category Breakdown</h3>
                <span>{incomeRows.length} categories</span>
              </div>
              <strong>{formatCurrency(totalIncome)}</strong>
            </header>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Entries</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {incomeRows.length > 0 ? (
                  incomeRows.map((row) => (
                    <tr key={row.name}>
                      <td>{row.name}</td>
                      <td>{row.count}</td>
                      <td>{formatCurrency(row.amount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3}>No income in this range.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
          <section>
            <header>
              <div>
                <h3>Expense Category Breakdown</h3>
                <span>{expenseRows.length} categories</span>
              </div>
              <strong>{formatCurrency(totalExpense)}</strong>
            </header>
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Entries</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenseRows.length > 0 ? (
                  expenseRows.map((row) => (
                    <tr key={row.name}>
                      <td>{row.name}</td>
                      <td>{row.count}</td>
                      <td>{formatCurrency(row.amount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3}>No expenses in this range.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </div>
        <section className="account-mode-breakdown">
          <h3>Payment Mode Breakdown</h3>
          <div>
            {paymentModes.map((mode) => {
              const modeTransactions = visibleTransactions.filter(
                (transaction) => transaction.paymentMode === mode,
              )
              return (
                <span key={mode}>
                  <small>{mode}</small>
                  <strong>
                    {formatCurrency(
                      modeTransactions.reduce(
                        (total, transaction) => total + transaction.amount,
                        0,
                      ),
                    )}
                  </strong>
                  <i>{modeTransactions.length} entries</i>
                </span>
              )
            })}
          </div>
        </section>
        <footer className="account-report-footer">
          <span>{visibleTransactions.length} transaction(s)</span>
          <strong>Net balance: {formatCurrency(netBalance)}</strong>
        </footer>
      </section>
    </div>
  )
}
