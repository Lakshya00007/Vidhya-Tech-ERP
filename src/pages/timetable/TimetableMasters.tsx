import { useState, type FormEvent } from 'react'
import { DataTable, type TableColumn } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import { getErrorMessage, getTimetableErpApi } from '../../lib/erpApi'
import type {
  Classroom,
  CreateClassroomInput,
  CreateTimetablePeriodInput,
  CreateTimetableWeekdayInput,
  MasterStatus,
  TimetablePeriod,
  TimetableWeekday,
} from '../../types'
import type { TimetableChildProps } from './types'

const weekdayForm: CreateTimetableWeekdayInput = {
  name: '',
  displayOrder: 1,
  isActive: true,
}

const periodForm: CreateTimetablePeriodInput = {
  name: '',
  startTime: '08:00',
  endTime: '08:45',
  displayOrder: 1,
  isBreak: false,
}

const classroomForm: CreateClassroomInput = {
  name: '',
  capacity: 0,
  description: '',
  status: 'Active',
}

export function WeekdaysSetup({
  data,
  onNotice,
  onRefresh,
}: TimetableChildProps) {
  const [form, setForm] =
    useState<CreateTimetableWeekdayInput>(weekdayForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const reset = () => {
    setEditingId(null)
    setForm({
      ...weekdayForm,
      displayOrder: data.weekdays.length + 1,
    })
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      setIsSaving(true)
      const api = getTimetableErpApi()
      const saved = editingId
        ? await api.updateTimetableWeekday(editingId, form)
        : await api.createTimetableWeekday(form)
      await onRefresh()
      onNotice({
        type: 'success',
        message: `${saved.name} was ${editingId ? 'updated' : 'added'}.`,
      })
      reset()
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  const edit = (weekday: TimetableWeekday) => {
    setEditingId(weekday.id)
    setForm({
      name: weekday.name,
      displayOrder: weekday.displayOrder,
      isActive: weekday.isActive,
    })
  }

  const toggle = async (weekday: TimetableWeekday) => {
    try {
      await getTimetableErpApi().updateTimetableWeekday(weekday.id, {
        isActive: !weekday.isActive,
      })
      await onRefresh()
      onNotice({
        type: 'success',
        message: `${weekday.name} is now ${weekday.isActive ? 'inactive' : 'active'}.`,
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const remove = async (weekday: TimetableWeekday) => {
    if (
      !window.confirm(
        `Delete ${weekday.name}? Its timetable entries will also be removed.`,
      )
    ) {
      return
    }
    try {
      await getTimetableErpApi().deleteTimetableWeekday(weekday.id)
      if (editingId === weekday.id) reset()
      await onRefresh()
      onNotice({ type: 'success', message: `${weekday.name} was removed.` })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const columns: TableColumn<TimetableWeekday>[] = [
    {
      key: 'order',
      header: 'Order',
      render: (row) => row.displayOrder,
    },
    {
      key: 'name',
      header: 'Weekday',
      render: (row) => <strong>{row.name}</strong>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span
          className={`status-badge${
            row.isActive ? '' : ' status-badge--inactive'
          }`}
        >
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="table-actions">
          <button
            className="table-action-button"
            onClick={() => void toggle(row)}
            type="button"
          >
            <Icon name={row.isActive ? 'minus' : 'check'} size={13} />
            {row.isActive ? 'Disable' : 'Enable'}
          </button>
          <button
            className="table-action-button"
            onClick={() => edit(row)}
            type="button"
          >
            <Icon name="edit" size={13} />
            Edit
          </button>
          <button
            className="table-action-button table-action-button--danger"
            onClick={() => void remove(row)}
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
    <div className="timetable-master-layout">
      <form className="panel timetable-master-form" onSubmit={submit}>
        <div className="panel-heading">
          <div>
            <h3>{editingId ? 'Edit Weekday' : 'Add Weekday'}</h3>
            <p>Active weekdays appear as rows in the timetable grid.</p>
          </div>
          {editingId && (
            <button className="text-button" onClick={reset} type="button">
              Cancel edit
            </button>
          )}
        </div>
        <div className="timetable-form-fields">
          <label className="form-field">
            <span>Weekday Name</span>
            <input
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="e.g. Monday"
              required
              value={form.name}
            />
          </label>
          <label className="form-field">
            <span>Display Order</span>
            <input
              min="0"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  displayOrder: Number(event.target.value),
                }))
              }
              type="number"
              value={form.displayOrder}
            />
          </label>
          <label className="checkbox-field">
            <input
              checked={form.isActive}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  isActive: event.target.checked,
                }))
              }
              type="checkbox"
            />
            <span>Active weekday</span>
          </label>
        </div>
        <div className="timetable-form-footer">
          <button className="primary-button" disabled={isSaving} type="submit">
            <Icon name={editingId ? 'check' : 'plus'} size={16} />
            {isSaving ? 'Saving...' : editingId ? 'Update' : 'Add Weekday'}
          </button>
        </div>
      </form>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>School Weekdays</h3>
            <p>Monday to Saturday are created automatically.</p>
          </div>
          <span className="record-count">{data.weekdays.length} days</span>
        </div>
        <DataTable
          columns={columns}
          emptyMessage="No weekdays configured."
          getRowKey={(row) => row.id}
          rows={data.weekdays}
        />
      </section>
    </div>
  )
}

export function PeriodsSetup({
  data,
  onNotice,
  onRefresh,
}: TimetableChildProps) {
  const [form, setForm] =
    useState<CreateTimetablePeriodInput>(periodForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const reset = () => {
    setEditingId(null)
    setForm({ ...periodForm, displayOrder: data.periods.length + 1 })
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      setIsSaving(true)
      const api = getTimetableErpApi()
      const saved = editingId
        ? await api.updateTimetablePeriod(editingId, form)
        : await api.createTimetablePeriod(form)
      await onRefresh()
      onNotice({
        type: 'success',
        message: `${saved.name} was ${editingId ? 'updated' : 'added'}.`,
      })
      reset()
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  const edit = (period: TimetablePeriod) => {
    setEditingId(period.id)
    setForm({
      name: period.name,
      startTime: period.startTime,
      endTime: period.endTime,
      displayOrder: period.displayOrder,
      isBreak: period.isBreak,
    })
  }

  const remove = async (period: TimetablePeriod) => {
    if (
      !window.confirm(
        `Delete ${period.name}? Its timetable entries will also be removed.`,
      )
    ) {
      return
    }
    try {
      await getTimetableErpApi().deleteTimetablePeriod(period.id)
      if (editingId === period.id) reset()
      await onRefresh()
      onNotice({ type: 'success', message: `${period.name} was removed.` })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const columns: TableColumn<TimetablePeriod>[] = [
    { key: 'order', header: 'Order', render: (row) => row.displayOrder },
    {
      key: 'name',
      header: 'Period',
      render: (row) => (
        <div className="primary-cell">
          <strong>{row.name}</strong>
          <span>{row.isBreak ? 'Break period' : 'Teaching period'}</span>
        </div>
      ),
    },
    {
      key: 'time',
      header: 'Time',
      render: (row) => `${row.startTime} – ${row.endTime}`,
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <span className={`status-badge${row.isBreak ? ' status-badge--inactive' : ''}`}>
          {row.isBreak ? 'Break' : 'Class'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="table-actions">
          <button
            className="table-action-button"
            onClick={() => edit(row)}
            type="button"
          >
            <Icon name="edit" size={13} />
            Edit
          </button>
          <button
            className="table-action-button table-action-button--danger"
            onClick={() => void remove(row)}
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
    <div className="timetable-master-layout">
      <form className="panel timetable-master-form" onSubmit={submit}>
        <div className="panel-heading">
          <div>
            <h3>{editingId ? 'Edit Time Period' : 'Add Time Period'}</h3>
            <p>Define teaching periods and breaks in display order.</p>
          </div>
          {editingId && (
            <button className="text-button" onClick={reset} type="button">
              Cancel edit
            </button>
          )}
        </div>
        <div className="timetable-form-fields timetable-form-fields--two">
          <label className="form-field timetable-field--full">
            <span>Period Name</span>
            <input
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="e.g. Period 1"
              required
              value={form.name}
            />
          </label>
          <label className="form-field">
            <span>Start Time</span>
            <input
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  startTime: event.target.value,
                }))
              }
              required
              type="time"
              value={form.startTime}
            />
          </label>
          <label className="form-field">
            <span>End Time</span>
            <input
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  endTime: event.target.value,
                }))
              }
              required
              type="time"
              value={form.endTime}
            />
          </label>
          <label className="form-field">
            <span>Display Order</span>
            <input
              min="0"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  displayOrder: Number(event.target.value),
                }))
              }
              type="number"
              value={form.displayOrder}
            />
          </label>
          <label className="checkbox-field timetable-break-checkbox">
            <input
              checked={form.isBreak}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  isBreak: event.target.checked,
                }))
              }
              type="checkbox"
            />
            <span>Break period</span>
          </label>
        </div>
        <div className="timetable-form-footer">
          <button className="primary-button" disabled={isSaving} type="submit">
            <Icon name={editingId ? 'check' : 'plus'} size={16} />
            {isSaving ? 'Saving...' : editingId ? 'Update' : 'Add Period'}
          </button>
        </div>
      </form>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Time Periods</h3>
            <p>Break columns are displayed automatically in the grid.</p>
          </div>
          <span className="record-count">{data.periods.length} periods</span>
        </div>
        <DataTable
          columns={columns}
          emptyMessage="Create a time period to build the timetable."
          getRowKey={(row) => row.id}
          rows={data.periods}
        />
      </section>
    </div>
  )
}

export function ClassroomsSetup({
  data,
  onNotice,
  onRefresh,
}: TimetableChildProps) {
  const [form, setForm] = useState<CreateClassroomInput>(classroomForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const reset = () => {
    setEditingId(null)
    setForm(classroomForm)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      setIsSaving(true)
      const api = getTimetableErpApi()
      const saved = editingId
        ? await api.updateClassroom(editingId, form)
        : await api.createClassroom(form)
      await onRefresh()
      onNotice({
        type: 'success',
        message: `${saved.name} was ${editingId ? 'updated' : 'added'}.`,
      })
      reset()
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  const edit = (room: Classroom) => {
    setEditingId(room.id)
    setForm({
      name: room.name,
      capacity: room.capacity,
      description: room.description,
      status: room.status,
    })
  }

  const remove = async (room: Classroom) => {
    if (!window.confirm(`Delete classroom ${room.name}?`)) return
    try {
      await getTimetableErpApi().deleteClassroom(room.id)
      if (editingId === room.id) reset()
      await onRefresh()
      onNotice({ type: 'success', message: `${room.name} was removed.` })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const columns: TableColumn<Classroom>[] = [
    {
      key: 'name',
      header: 'Class Room',
      render: (row) => <strong>{row.name}</strong>,
    },
    {
      key: 'capacity',
      header: 'Capacity',
      render: (row) => (row.capacity > 0 ? row.capacity : '—'),
    },
    {
      key: 'description',
      header: 'Description',
      render: (row) => row.description || '—',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span
          className={`status-badge${
            row.status === 'Active' ? '' : ' status-badge--inactive'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="table-actions">
          <button
            className="table-action-button"
            onClick={() => edit(row)}
            type="button"
          >
            <Icon name="edit" size={13} />
            Edit
          </button>
          <button
            className="table-action-button table-action-button--danger"
            onClick={() => void remove(row)}
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
    <div className="timetable-master-layout">
      <form className="panel timetable-master-form" onSubmit={submit}>
        <div className="panel-heading">
          <div>
            <h3>{editingId ? 'Edit Class Room' : 'Add Class Room'}</h3>
            <p>Rooms are checked for slot conflicts when saving.</p>
          </div>
          {editingId && (
            <button className="text-button" onClick={reset} type="button">
              Cancel edit
            </button>
          )}
        </div>
        <div className="timetable-form-fields">
          <label className="form-field">
            <span>Room Name</span>
            <input
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="e.g. Room 101"
              required
              value={form.name}
            />
          </label>
          <label className="form-field">
            <span>Capacity</span>
            <input
              min="0"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  capacity: Number(event.target.value),
                }))
              }
              type="number"
              value={form.capacity}
            />
          </label>
          <label className="form-field">
            <span>Status</span>
            <select
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  status: event.target.value as MasterStatus,
                }))
              }
              value={form.status}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </label>
          <label className="form-field">
            <span>Description</span>
            <textarea
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Optional room details"
              rows={3}
              value={form.description}
            />
          </label>
        </div>
        <div className="timetable-form-footer">
          <button className="primary-button" disabled={isSaving} type="submit">
            <Icon name={editingId ? 'check' : 'plus'} size={16} />
            {isSaving ? 'Saving...' : editingId ? 'Update' : 'Add Room'}
          </button>
        </div>
      </form>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Class Rooms</h3>
            <p>Inactive rooms remain in history but cannot be assigned.</p>
          </div>
          <span className="record-count">{data.classrooms.length} rooms</span>
        </div>
        <DataTable
          columns={columns}
          emptyMessage="No classrooms configured."
          getRowKey={(row) => row.id}
          rows={data.classrooms}
        />
      </section>
    </div>
  )
}
