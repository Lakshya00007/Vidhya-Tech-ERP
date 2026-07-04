import { useMemo, useState, type FormEvent } from 'react'
import { Icon } from '../../components/Icon'
import { getAccountsErpApi, getErrorMessage } from '../../lib/erpApi'
import { formatCurrency, getTodayValue } from '../../lib/reportUtils'
import type {
  AccountCategory,
  AccountTransaction,
  AccountType,
  PaymentMode,
} from '../../types'
import type { AccountsNoticeProps } from './types'

interface AccountTransactionFormProps extends AccountsNoticeProps {
  categories: AccountCategory[]
  onTransactionCreated: (transaction: AccountTransaction) => void
  type: AccountType
}

const paymentModes: PaymentMode[] = [
  'Cash',
  'UPI',
  'Bank Transfer',
  'Cheque',
  'Card',
]

export function AccountTransactionForm({
  categories,
  onNotice,
  onTransactionCreated,
  type,
}: AccountTransactionFormProps) {
  const activeCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          category.type === type && category.status === 'Active',
      ),
    [categories, type],
  )
  const [categoryId, setCategoryId] = useState(activeCategories[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState(0)
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Cash')
  const [transactionDate, setTransactionDate] = useState(getTodayValue)
  const [referenceNo, setReferenceNo] = useState('')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      setIsSaving(true)
      const transaction = await getAccountsErpApi().createAccountTransaction({
        type,
        categoryId,
        title,
        amount,
        paymentMode,
        transactionDate,
        referenceNo,
        notes,
      })
      onTransactionCreated(transaction)
      onNotice({
        type: 'success',
        message: `${transaction.transactionNo} was saved as ${type.toLowerCase()}.`,
      })
      setTitle('')
      setAmount(0)
      setReferenceNo('')
      setNotes('')
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="account-entry-layout">
      <form className="panel account-entry-form" onSubmit={submit}>
        <div className="panel-heading">
          <div>
            <h3>Add {type}</h3>
            <p>Record a manual {type.toLowerCase()} ledger transaction.</p>
          </div>
          <span
            className={`account-entry-icon account-entry-icon--${type.toLowerCase()}`}
          >
            <Icon name={type === 'Income' ? 'plus' : 'arrow'} size={19} />
          </span>
        </div>
        <div className="account-entry-fields">
          <label className="form-field">
            <span>{type} Category</span>
            <select
              disabled={activeCategories.length === 0}
              onChange={(event) => setCategoryId(event.target.value)}
              required
              value={categoryId}
            >
              {activeCategories.length === 0 && (
                <option value="">No active {type.toLowerCase()} categories</option>
              )}
              {activeCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Title</span>
            <input
              onChange={(event) => setTitle(event.target.value)}
              placeholder={
                type === 'Income'
                  ? 'e.g. School event sponsorship'
                  : 'e.g. Office stationery purchase'
              }
              required
              value={title}
            />
          </label>
          <label className="form-field">
            <span>Amount</span>
            <input
              min="1"
              onChange={(event) => setAmount(Number(event.target.value) || 0)}
              required
              step="1"
              type="number"
              value={amount}
            />
          </label>
          <label className="form-field">
            <span>Payment Mode</span>
            <select
              onChange={(event) =>
                setPaymentMode(event.target.value as PaymentMode)
              }
              value={paymentMode}
            >
              {paymentModes.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Date</span>
            <input
              onChange={(event) => setTransactionDate(event.target.value)}
              required
              type="date"
              value={transactionDate}
            />
          </label>
          <label className="form-field">
            <span>Reference No.</span>
            <input
              onChange={(event) => setReferenceNo(event.target.value)}
              placeholder="Optional cheque, invoice or UTR reference"
              value={referenceNo}
            />
          </label>
          <label className="form-field account-entry-notes">
            <span>Notes</span>
            <textarea
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional transaction notes"
              rows={3}
              value={notes}
            />
          </label>
        </div>
        <div className="account-entry-footer">
          <div>
            <span>Transaction Amount</span>
            <strong>{formatCurrency(amount)}</strong>
          </div>
          <button
            className="primary-button"
            disabled={!categoryId || amount <= 0 || isSaving}
            type="submit"
          >
            <Icon name="check" size={16} />
            {isSaving ? 'Saving...' : `Save ${type}`}
          </button>
        </div>
      </form>

      <aside className="panel account-entry-guidance">
        <span
          className={`account-entry-guidance__icon account-entry-guidance__icon--${type.toLowerCase()}`}
        >
          <Icon name={type === 'Income' ? 'wallet' : 'fees'} size={25} />
        </span>
        <h3>Manual {type}</h3>
        <p>
          {type === 'Income'
            ? 'Fee receipts are posted automatically. Use this form only for other school income.'
            : 'Salary payments are posted automatically. Use this form for rent, utilities and other expenses.'}
        </p>
        <small>
          Transactions receive a permanent ACC-YYYY sequence number.
        </small>
      </aside>
    </div>
  )
}
