import { useEffect, useState, type FormEvent } from 'react'
import { DataTable, type TableColumn } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import { getErpApi, getErrorMessage } from '../../lib/erpApi'
import type { ClassItem, MasterStatus, SectionItem } from '../../types'
import type { SettingsSectionProps } from '../Settings'

interface ClassForm {
  name: string
  displayOrder: string
  status: MasterStatus
}

interface SectionForm {
  classId: string
  name: string
  status: MasterStatus
}

const emptyClassForm: ClassForm = {
  name: '',
  displayOrder: '1',
  status: 'Active',
}

const emptySectionForm: SectionForm = {
  classId: '',
  name: '',
  status: 'Active',
}

export function ClassesSectionsSettings({ onNotice }: SettingsSectionProps) {
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [sections, setSections] = useState<SectionItem[]>([])
  const [classForm, setClassForm] = useState<ClassForm>(emptyClassForm)
  const [sectionForm, setSectionForm] = useState<SectionForm>(emptySectionForm)
  const [editingClassId, setEditingClassId] = useState<string | null>(null)
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const applyMasterData = (classRows: ClassItem[], sectionRows: SectionItem[]) => {
    setClasses(classRows)
    setSections(sectionRows)
    setSectionForm((current) => ({
      ...current,
      classId: classRows.some((item) => item.id === current.classId)
        ? current.classId
        : (classRows.find((item) => item.status === 'Active')?.id ?? ''),
    }))
  }

  const refreshMasterData = async () => {
    const [classRows, sectionRows] = await Promise.all([
      getErpApi().getClasses(),
      getErpApi().getSections(),
    ])
    applyMasterData(classRows, sectionRows)
  }

  useEffect(() => {
    let isCurrent = true

    Promise.resolve()
      .then(() => Promise.all([getErpApi().getClasses(), getErpApi().getSections()]))
      .then(([classRows, sectionRows]) => {
        if (isCurrent) {
          applyMasterData(classRows, sectionRows)
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          onNotice({ type: 'error', message: getErrorMessage(error) })
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [onNotice])

  const handleClassSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    try {
      const input = {
        name: classForm.name,
        displayOrder: Number(classForm.displayOrder),
        status: classForm.status,
      }
      if (editingClassId) {
        await getErpApi().updateClass(editingClassId, input)
        onNotice({ type: 'success', message: 'Class updated successfully.' })
      } else {
        await getErpApi().createClass(input)
        onNotice({ type: 'success', message: 'Class created successfully.' })
      }
      await refreshMasterData()
      setClassForm({
        ...emptyClassForm,
        displayOrder: String(classes.length + 2),
      })
      setEditingClassId(null)
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSectionSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    try {
      if (editingSectionId) {
        await getErpApi().updateSection(editingSectionId, sectionForm)
        onNotice({ type: 'success', message: 'Section updated successfully.' })
      } else {
        await getErpApi().createSection(sectionForm)
        onNotice({ type: 'success', message: 'Section created successfully.' })
      }
      await refreshMasterData()
      setSectionForm((current) => ({
        ...emptySectionForm,
        classId: current.classId,
      }))
      setEditingSectionId(null)
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  const editClass = (schoolClass: ClassItem) => {
    setEditingClassId(schoolClass.id)
    setClassForm({
      name: schoolClass.name,
      displayOrder: String(schoolClass.displayOrder),
      status: schoolClass.status,
    })
  }

  const editSection = (section: SectionItem) => {
    setEditingSectionId(section.id)
    setSectionForm({
      classId: section.classId,
      name: section.name,
      status: section.status,
    })
  }

  const deleteClass = async (schoolClass: ClassItem) => {
    if (!window.confirm(`Delete Class ${schoolClass.name} and its linked sections?`)) {
      return
    }
    try {
      await getErpApi().deleteClass(schoolClass.id)
      await refreshMasterData()
      onNotice({ type: 'success', message: `Class ${schoolClass.name} was removed.` })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const deleteSection = async (section: SectionItem) => {
    if (!window.confirm(`Delete Section ${section.name} from Class ${section.className}?`)) {
      return
    }
    try {
      await getErpApi().deleteSection(section.id)
      await refreshMasterData()
      onNotice({ type: 'success', message: `Section ${section.name} was removed.` })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const classColumns: TableColumn<ClassItem>[] = [
    {
      key: 'class',
      header: 'Class Name',
      render: (item) => <strong className="table-block">Class {item.name}</strong>,
    },
    { key: 'order', header: 'Display Order', render: (item) => item.displayOrder },
    {
      key: 'sections',
      header: 'Sections',
      render: (item) =>
        sections.filter((section) => section.classId === item.id).length,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <span className={`status-badge status-badge--${item.status.toLowerCase()}`}>
          {item.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'align-right',
      render: (item) => (
        <div className="row-action-group">
          <button
            className="row-action"
            type="button"
            aria-label={`Edit Class ${item.name}`}
            onClick={() => editClass(item)}
          >
            <Icon name="edit" size={14} />
          </button>
          <button
            className="row-action row-action--danger"
            type="button"
            aria-label={`Delete Class ${item.name}`}
            onClick={() => void deleteClass(item)}
          >
            <Icon name="trash" size={14} />
          </button>
        </div>
      ),
    },
  ]

  const sectionColumns: TableColumn<SectionItem>[] = [
    { key: 'class', header: 'Class', render: (item) => `Class ${item.className}` },
    {
      key: 'section',
      header: 'Section',
      render: (item) => <strong className="table-block">{item.name}</strong>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <span className={`status-badge status-badge--${item.status.toLowerCase()}`}>
          {item.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'align-right',
      render: (item) => (
        <div className="row-action-group">
          <button
            className="row-action"
            type="button"
            aria-label={`Edit Section ${item.name}`}
            onClick={() => editSection(item)}
          >
            <Icon name="edit" size={14} />
          </button>
          <button
            className="row-action row-action--danger"
            type="button"
            aria-label={`Delete Section ${item.name}`}
            onClick={() => void deleteSection(item)}
          >
            <Icon name="trash" size={14} />
          </button>
        </div>
      ),
    },
  ]

  const activeClasses = classes.filter((item) => item.status === 'Active')

  return (
    <div className="settings-master-stack">
      <section className="master-forms-grid">
        <form className="panel master-form-card" onSubmit={(event) => void handleClassSubmit(event)}>
          <div className="panel-heading">
            <div>
              <h3>{editingClassId ? 'Edit Class' : 'Add Class'}</h3>
              <p>Set the class name and display order</p>
            </div>
          </div>
          <div className="master-form-fields">
            <label className="form-field">
              <span>Class Name</span>
              <input
                placeholder="Example: 10"
                required
                value={classForm.name}
                onChange={(event) => setClassForm({ ...classForm, name: event.target.value })}
              />
            </label>
            <div className="form-row">
              <label className="form-field">
                <span>Display Order</span>
                <input
                  min="0"
                  required
                  type="number"
                  value={classForm.displayOrder}
                  onChange={(event) =>
                    setClassForm({ ...classForm, displayOrder: event.target.value })
                  }
                />
              </label>
              <label className="form-field">
                <span>Status</span>
                <select
                  value={classForm.status}
                  onChange={(event) =>
                    setClassForm({
                      ...classForm,
                      status: event.target.value as MasterStatus,
                    })
                  }
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </label>
            </div>
            <div className="master-form-actions">
              {editingClassId && (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => {
                    setEditingClassId(null)
                    setClassForm(emptyClassForm)
                  }}
                >
                  Cancel
                </button>
              )}
              <button className="primary-button" disabled={isSaving} type="submit">
                <Icon name={editingClassId ? 'check' : 'plus'} size={16} />
                {editingClassId ? 'Update Class' : 'Add Class'}
              </button>
            </div>
          </div>
        </form>

        <form
          className="panel master-form-card"
          onSubmit={(event) => void handleSectionSubmit(event)}
        >
          <div className="panel-heading">
            <div>
              <h3>{editingSectionId ? 'Edit Section' : 'Add Section'}</h3>
              <p>Link a section to an active class</p>
            </div>
          </div>
          <div className="master-form-fields">
            <label className="form-field">
              <span>Class</span>
              <select
                disabled={activeClasses.length === 0}
                required
                value={sectionForm.classId}
                onChange={(event) =>
                  setSectionForm({ ...sectionForm, classId: event.target.value })
                }
              >
                {activeClasses.length === 0 && (
                  <option value="">Create a class first</option>
                )}
                {activeClasses.map((item) => (
                  <option key={item.id} value={item.id}>Class {item.name}</option>
                ))}
              </select>
            </label>
            <div className="form-row">
              <label className="form-field">
                <span>Section Name</span>
                <input
                  placeholder="Example: A"
                  required
                  value={sectionForm.name}
                  onChange={(event) =>
                    setSectionForm({ ...sectionForm, name: event.target.value })
                  }
                />
              </label>
              <label className="form-field">
                <span>Status</span>
                <select
                  value={sectionForm.status}
                  onChange={(event) =>
                    setSectionForm({
                      ...sectionForm,
                      status: event.target.value as MasterStatus,
                    })
                  }
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </label>
            </div>
            <div className="master-form-actions">
              {editingSectionId && (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => {
                    setEditingSectionId(null)
                    setSectionForm((current) => ({
                      ...emptySectionForm,
                      classId: current.classId,
                    }))
                  }}
                >
                  Cancel
                </button>
              )}
              <button
                className="primary-button"
                disabled={isSaving || activeClasses.length === 0}
                type="submit"
              >
                <Icon name={editingSectionId ? 'check' : 'plus'} size={16} />
                {editingSectionId ? 'Update Section' : 'Add Section'}
              </button>
            </div>
          </div>
        </form>
      </section>

      <section className="master-tables-grid">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>Classes</h3>
              <p>{classes.length} configured classes</p>
            </div>
          </div>
          <DataTable
            columns={classColumns}
            getRowKey={(item) => item.id}
            rows={classes}
            emptyMessage={isLoading ? 'Loading classes...' : 'No classes configured yet.'}
          />
        </div>
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>Sections</h3>
              <p>{sections.length} configured sections</p>
            </div>
          </div>
          <DataTable
            columns={sectionColumns}
            getRowKey={(item) => item.id}
            rows={sections}
            emptyMessage={isLoading ? 'Loading sections...' : 'No sections configured yet.'}
          />
        </div>
      </section>
    </div>
  )
}
