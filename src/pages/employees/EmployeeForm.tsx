import { useState, type FormEvent } from 'react'
import { Icon } from '../../components/Icon'
import { getEmployeesErpApi, getErrorMessage } from '../../lib/erpApi'
import type { CreateEmployeeInput, Employee } from '../../types'
import type { EmployeeNoticeProps } from './types'

interface EmployeeFormProps extends EmployeeNoticeProps {
  employee: Employee | null
  onCancelEdit: () => void
  onSaved: (employee: Employee, wasEditing: boolean) => void
}

const emptyForm: CreateEmployeeInput = {
  employeeNo: '',
  name: '',
  designation: '',
  department: '',
  mobile: '',
  email: '',
  gender: '',
  dateOfBirth: '',
  joiningDate: '',
  qualification: '',
  experience: '',
  address: '',
  salaryAmount: 0,
  status: 'Active',
}

const formFromEmployee = (employee: Employee): CreateEmployeeInput => ({
  employeeNo: employee.employeeNo,
  name: employee.name,
  designation: employee.designation,
  department: employee.department,
  mobile: employee.mobile,
  email: employee.email,
  gender: employee.gender,
  dateOfBirth: employee.dateOfBirth,
  joiningDate: employee.joiningDate,
  qualification: employee.qualification,
  experience: employee.experience,
  address: employee.address,
  salaryAmount: employee.salaryAmount,
  status: employee.status,
  userId: employee.userId,
})

export function EmployeeForm({
  employee,
  onCancelEdit,
  onNotice,
  onSaved,
}: EmployeeFormProps) {
  const [form, setForm] = useState<CreateEmployeeInput>(
    employee ? formFromEmployee(employee) : emptyForm,
  )
  const [isSaving, setIsSaving] = useState(false)

  const setField = <Key extends keyof CreateEmployeeInput>(
    field: Key,
    value: CreateEmployeeInput[Key],
  ) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      setIsSaving(true)
      const api = getEmployeesErpApi()
      const saved = employee
        ? await api.updateEmployee(employee.id, form)
        : await api.createEmployee(form)
      onNotice({
        type: 'success',
        message: employee
          ? `${saved.name}'s employee record was updated.`
          : `${saved.name} was added to the employee directory.`,
      })
      onSaved(saved, Boolean(employee))
      if (!employee) setForm(emptyForm)
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="panel employee-form-panel" onSubmit={submit}>
      <div className="panel-heading">
        <div>
          <h3>{employee ? 'Edit Employee' : 'Add New Employee'}</h3>
          <p>
            Employee number and name are required. Other employment details are
            optional.
          </p>
        </div>
        {employee && (
          <button className="secondary-button" onClick={onCancelEdit} type="button">
            Cancel Edit
          </button>
        )}
      </div>
      <div className="employee-form-grid">
        <label className="form-field">
          <span>Employee No. *</span>
          <input
            maxLength={100}
            onChange={(event) => setField('employeeNo', event.target.value)}
            placeholder="e.g. EMP-001"
            required
            value={form.employeeNo}
          />
        </label>
        <label className="form-field">
          <span>Employee Name *</span>
          <input
            maxLength={200}
            onChange={(event) => setField('name', event.target.value)}
            placeholder="Full name"
            required
            value={form.name}
          />
        </label>
        <label className="form-field">
          <span>Designation</span>
          <input
            onChange={(event) => setField('designation', event.target.value)}
            placeholder="e.g. Senior Teacher"
            value={form.designation}
          />
        </label>
        <label className="form-field">
          <span>Department</span>
          <input
            onChange={(event) => setField('department', event.target.value)}
            placeholder="e.g. Academics"
            value={form.department}
          />
        </label>
        <label className="form-field">
          <span>Mobile</span>
          <input
            inputMode="tel"
            onChange={(event) => setField('mobile', event.target.value)}
            placeholder="Mobile number"
            value={form.mobile}
          />
        </label>
        <label className="form-field">
          <span>Email</span>
          <input
            onChange={(event) => setField('email', event.target.value)}
            placeholder="employee@example.com"
            type="email"
            value={form.email}
          />
        </label>
        <label className="form-field">
          <span>Gender</span>
          <select
            onChange={(event) => setField('gender', event.target.value)}
            value={form.gender}
          >
            <option value="">Not specified</option>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Other">Other</option>
          </select>
        </label>
        <label className="form-field">
          <span>Date of Birth</span>
          <input
            onChange={(event) => setField('dateOfBirth', event.target.value)}
            type="date"
            value={form.dateOfBirth}
          />
        </label>
        <label className="form-field">
          <span>Joining Date</span>
          <input
            onChange={(event) => setField('joiningDate', event.target.value)}
            type="date"
            value={form.joiningDate}
          />
        </label>
        <label className="form-field">
          <span>Monthly Salary</span>
          <input
            min="0"
            onChange={(event) =>
              setField('salaryAmount', Number(event.target.value) || 0)
            }
            step="1"
            type="number"
            value={form.salaryAmount}
          />
        </label>
        <label className="form-field">
          <span>Qualification</span>
          <input
            onChange={(event) => setField('qualification', event.target.value)}
            placeholder="Highest qualification"
            value={form.qualification}
          />
        </label>
        <label className="form-field">
          <span>Experience</span>
          <input
            onChange={(event) => setField('experience', event.target.value)}
            placeholder="e.g. 6 years"
            value={form.experience}
          />
        </label>
        <label className="form-field">
          <span>Status</span>
          <select
            onChange={(event) =>
              setField(
                'status',
                event.target.value as 'Active' | 'Inactive',
              )
            }
            value={form.status}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </label>
        <label className="form-field employee-address-field">
          <span>Address</span>
          <textarea
            onChange={(event) => setField('address', event.target.value)}
            placeholder="Residential address"
            rows={3}
            value={form.address}
          />
        </label>
      </div>
      <div className="employee-form-footer">
        <span>Employee login linking will be available in the next release.</span>
        <button className="primary-button" disabled={isSaving} type="submit">
          <Icon name="check" size={16} />
          {isSaving
            ? 'Saving...'
            : employee
              ? 'Update Employee'
              : 'Save Employee'}
        </button>
      </div>
    </form>
  )
}
