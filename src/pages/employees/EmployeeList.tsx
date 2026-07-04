import { useMemo, useState } from 'react'
import { DataTable, type TableColumn } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import { getEmployeesErpApi, getErrorMessage } from '../../lib/erpApi'
import { formatCurrency, formatReportDate } from '../../lib/reportUtils'
import type { Employee } from '../../types'
import type { EmployeeNoticeProps } from './types'

interface EmployeeListProps extends EmployeeNoticeProps {
  employees: Employee[]
  onEdit: (employee: Employee) => void
  onEmployeesChange: (employees: Employee[]) => void
}

const uniqueValues = (values: string[]) =>
  [...new Set(values.filter(Boolean))].sort((left, right) =>
    left.localeCompare(right),
  )

export function EmployeeList({
  employees,
  onEdit,
  onEmployeesChange,
  onNotice,
}: EmployeeListProps) {
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')
  const [designation, setDesignation] = useState('')
  const [status, setStatus] = useState('')

  const departments = useMemo(
    () => uniqueValues(employees.map((employee) => employee.department)),
    [employees],
  )
  const designations = useMemo(
    () => uniqueValues(employees.map((employee) => employee.designation)),
    [employees],
  )
  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase()
    return employees.filter(
      (employee) =>
        (!department || employee.department === department) &&
        (!designation || employee.designation === designation) &&
        (!status || employee.status === status) &&
        (!query ||
          [
            employee.employeeNo,
            employee.name,
            employee.designation,
            employee.department,
            employee.mobile,
            employee.email,
          ].some((value) => value.toLowerCase().includes(query))),
    )
  }, [department, designation, employees, search, status])

  const deleteEmployee = async (employee: Employee) => {
    if (
      !window.confirm(
        `Remove ${employee.name} from the active employee directory?`,
      )
    ) {
      return
    }
    try {
      const api = getEmployeesErpApi()
      const result = await api.deleteEmployee(employee.id)
      if (!result.success) throw new Error('Employee record was not found.')
      onEmployeesChange(await api.getEmployees())
      onNotice({
        type: 'success',
        message: `${employee.name} was removed from the employee directory.`,
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const columns: TableColumn<Employee>[] = [
    {
      key: 'employeeNo',
      header: 'Employee No',
      render: (employee) => (
        <strong className="table-primary">{employee.employeeNo}</strong>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (employee) => (
        <div className="primary-cell">
          <strong>{employee.name}</strong>
          <span>{employee.qualification || 'Qualification not recorded'}</span>
        </div>
      ),
    },
    {
      key: 'designation',
      header: 'Designation',
      render: (employee) => employee.designation || '—',
    },
    {
      key: 'department',
      header: 'Department',
      render: (employee) => employee.department || '—',
    },
    {
      key: 'mobile',
      header: 'Mobile',
      render: (employee) => employee.mobile || '—',
    },
    {
      key: 'email',
      header: 'Email',
      render: (employee) => employee.email || '—',
    },
    {
      key: 'joiningDate',
      header: 'Joining Date',
      render: (employee) =>
        employee.joiningDate ? formatReportDate(employee.joiningDate) : '—',
    },
    {
      key: 'salary',
      header: 'Salary',
      className: 'align-right',
      render: (employee) => formatCurrency(employee.salaryAmount),
    },
    {
      key: 'status',
      header: 'Status',
      render: (employee) => (
        <span
          className={`status-badge${
            employee.status === 'Active' ? '' : ' status-badge--inactive'
          }`}
        >
          {employee.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (employee) => (
        <div className="table-actions">
          <button
            className="table-action-button"
            onClick={() => onEdit(employee)}
            type="button"
          >
            <Icon name="edit" size={13} />
            Edit
          </button>
          <button
            className="table-action-button table-action-button--danger"
            onClick={() => void deleteEmployee(employee)}
            type="button"
          >
            <Icon name="trash" size={13} />
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="employee-list-stack">
      <section className="panel employee-filter-panel">
        <div className="search-box employee-search-box">
          <Icon name="search" size={16} />
          <input
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search employee no, name, department, mobile..."
            type="search"
            value={search}
          />
        </div>
        <label className="form-field">
          <span>Department</span>
          <select
            onChange={(event) => setDepartment(event.target.value)}
            value={department}
          >
            <option value="">All departments</option>
            {departments.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>Designation</span>
          <select
            onChange={(event) => setDesignation(event.target.value)}
            value={designation}
          >
            <option value="">All designations</option>
            {designations.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>Status</span>
          <select
            onChange={(event) => setStatus(event.target.value)}
            value={status}
          >
            <option value="">All statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </label>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Employee Directory</h3>
            <p>Current teaching and non-teaching staff records.</p>
          </div>
          <span className="neutral-badge">
            {filteredEmployees.length} of {employees.length}
          </span>
        </div>
        <DataTable
          columns={columns}
          emptyMessage={
            employees.length === 0
              ? 'No employees found. Add the first employee.'
              : 'No employees match the selected filters.'
          }
          getRowKey={(employee) => employee.id}
          rows={filteredEmployees}
        />
      </section>
    </div>
  )
}
