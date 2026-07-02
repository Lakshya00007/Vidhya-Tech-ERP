import { DataTable, type TableColumn } from '../components/DataTable'
import { Icon, type IconName } from '../components/Icon'
import { StatCard } from '../components/StatCard'
import { payments } from '../data/mockData'
import type { PageId, Payment } from '../types'

interface DashboardProps {
  onNavigate: (page: PageId) => void
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)

const paymentColumns: TableColumn<Payment>[] = [
  {
    key: 'receipt',
    header: 'Receipt No.',
    render: (payment) => <span className="table-primary">{payment.receiptNo}</span>,
  },
  {
    key: 'student',
    header: 'Student',
    render: (payment) => (
      <div className="person-cell">
        <span className="person-avatar">{payment.studentName.slice(0, 1)}</span>
        <div>
          <strong>{payment.studentName}</strong>
          <span>{payment.admissionNo}</span>
        </div>
      </div>
    ),
  },
  {
    key: 'class',
    header: 'Class',
    render: (payment) => payment.className,
  },
  {
    key: 'type',
    header: 'Fee Type',
    render: (payment) => payment.feeType,
  },
  {
    key: 'mode',
    header: 'Mode',
    render: (payment) => <span className="neutral-badge">{payment.paymentMode}</span>,
  },
  {
    key: 'amount',
    header: 'Amount',
    className: 'align-right',
    render: (payment) => <strong>{formatCurrency(payment.amount)}</strong>,
  },
]

const quickActions: {
  label: string
  description: string
  icon: IconName
  page: PageId
  tone: string
}[] = [
  {
    label: 'Add Student',
    description: 'Create admission record',
    icon: 'students',
    page: 'students',
    tone: 'blue',
  },
  {
    label: 'Collect Fee',
    description: 'Record a new payment',
    icon: 'wallet',
    page: 'fees',
    tone: 'green',
  },
  {
    label: 'Mark Attendance',
    description: 'Update today’s register',
    icon: 'attendance',
    page: 'attendance',
    tone: 'violet',
  },
  {
    label: 'View Reports',
    description: 'Generate school reports',
    icon: 'reports',
    page: 'reports',
    tone: 'amber',
  },
]

export function Dashboard({ onNavigate }: DashboardProps) {
  return (
    <div className="page-stack">
      <section className="welcome-row">
        <div>
          <p className="eyebrow">Friday, 3 July 2026</p>
          <h2>Good morning, Administrator</h2>
          <p>Here is today’s overview for Vidhya Public School.</p>
        </div>
        <div className="academic-year">
          <Icon name="calendar" size={18} />
          <div>
            <span>Academic Year</span>
            <strong>2026–2027</strong>
          </div>
        </div>
      </section>

      <section className="stats-grid" aria-label="School statistics">
        <StatCard
          icon="students"
          label="Total Students"
          meta="+18 this academic year"
          tone="blue"
          value="1,248"
        />
        <StatCard
          icon="wallet"
          label="Today’s Collection"
          meta="12 receipts collected"
          tone="green"
          value="₹48,650"
        />
        <StatCard
          icon="clock"
          label="Pending Fees"
          meta="86 student accounts"
          tone="amber"
          value="₹2,84,500"
        />
        <StatCard
          icon="check"
          label="Attendance Today"
          meta="1,193 of 1,248 present"
          tone="violet"
          value="95.6%"
        />
      </section>

      <section className="dashboard-grid">
        <div className="panel recent-payments">
          <div className="panel-heading">
            <div>
              <h3>Recent Fee Payments</h3>
              <p>Latest receipts recorded at the fee counter</p>
            </div>
            <button className="text-button" type="button" onClick={() => onNavigate('fees')}>
              View all
              <Icon name="arrow" size={16} />
            </button>
          </div>
          <DataTable
            columns={paymentColumns}
            getRowKey={(payment) => payment.id}
            rows={payments.slice(0, 4)}
          />
        </div>

        <div className="panel quick-actions">
          <div className="panel-heading">
            <div>
              <h3>Quick Actions</h3>
              <p>Common daily tasks</p>
            </div>
          </div>
          <div className="quick-action-list">
            {quickActions.map((action) => (
              <button
                className="quick-action"
                key={action.label}
                onClick={() => onNavigate(action.page)}
                type="button"
              >
                <span className={`quick-action__icon quick-action__icon--${action.tone}`}>
                  <Icon name={action.icon} size={18} />
                </span>
                <span>
                  <strong>{action.label}</strong>
                  <small>{action.description}</small>
                </span>
                <Icon className="quick-action__arrow" name="chevron" size={17} />
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
