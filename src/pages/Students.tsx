import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { DataTable, type TableColumn } from '../components/DataTable'
import { Icon } from '../components/Icon'
import { StudentImportDialog } from '../components/StudentImportDialog'
import { getErpApi, getErrorMessage } from '../lib/erpApi'
import { downloadStudentImportTemplate } from '../lib/studentImport'
import type {
  ClassItem,
  CreateStudentInput,
  Family,
  Guardian,
  SectionItem,
  Student,
  StudentGuardianLink,
} from '../types'

const emptyForm: CreateStudentInput = {
  admissionNo: '',
  name: '',
  className: '',
  section: '',
  guardianName: '',
  mobile: '',
}

interface StudentsProps {
  canManage: boolean
  initialAction?: 'add' | 'import'
  initialSessionFilter?: 'Current' | 'All'
  initialStatusFilter?: StudentListStatusFilter
}

export type StudentListStatusFilter =
  | 'Active'
  | 'Inactive'
  | 'TC'
  | 'Left'
  | 'All'

const getStudentDisplayStatus = (student: Student) =>
  student.sessionStatus === 'TC' || student.sessionStatus === 'Left'
    ? student.sessionStatus
    : student.status

export function Students({
  canManage,
  initialAction,
  initialSessionFilter = 'Current',
  initialStatusFilter = 'Active',
}: StudentsProps) {
  const [studentRows, setStudentRows] = useState<Student[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [sections, setSections] = useState<SectionItem[]>([])
  const [families, setFamilies] = useState<Family[]>([])
  const [guardians, setGuardians] = useState<Guardian[]>([])
  const [linkedGuardians, setLinkedGuardians] = useState<StudentGuardianLink[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    StudentListStatusFilter
  >(initialStatusFilter)
  const [sessionFilter, setSessionFilter] = useState<'Current' | 'All'>(
    initialSessionFilter,
  )
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(
    canManage && initialAction === 'import',
  )
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null)
  const [form, setForm] = useState<CreateStudentInput>(emptyForm)
  const [selectedFamilyId, setSelectedFamilyId] = useState('')
  const [createFamilyAfterSave, setCreateFamilyAfterSave] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTemplateDownloading, setIsTemplateDownloading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadStudents = useCallback(async () => {
    try {
      const [students, familyRows, guardianRows] = await Promise.all([
        getErpApi().getStudents(),
        getErpApi().getFamilies({}),
        getErpApi().getGuardians({}),
      ])
      setStudentRows(students)
      setFamilies(familyRows)
      setGuardians(guardianRows)
      setError('')
    } catch (loadError) {
      setError(getErrorMessage(loadError))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshImportedData = useCallback(async () => {
    const [students, classRows, sectionRows, familyRows, guardianRows] = await Promise.all([
      getErpApi().getStudents(),
      getErpApi().getClasses(),
      getErpApi().getSections(),
      getErpApi().getFamilies({}),
      getErpApi().getGuardians({}),
    ])
    setStudentRows(students)
    setClasses(classRows)
    setSections(sectionRows)
    setFamilies(familyRows)
    setGuardians(guardianRows)
    setError('')
  }, [])

  useEffect(() => {
    let isCurrent = true

    Promise.resolve()
      .then(() =>
        Promise.all([
          getErpApi().getStudents(),
          getErpApi().getClasses(),
          getErpApi().getSections(),
          getErpApi().getFamilies({}),
          getErpApi().getGuardians({}),
        ]),
      )
      .then(([students, classRows, sectionRows, familyRows, guardianRows]) => {
        if (isCurrent) {
          setStudentRows(students)
          setClasses(classRows)
          setSections(sectionRows)
          setFamilies(familyRows)
          setGuardians(guardianRows)
          setError('')
          if (canManage && initialAction === 'add') {
            const firstClass = classRows.find((item) => item.status === 'Active')
            const firstSection = sectionRows.find(
              (section) =>
                section.status === 'Active' &&
                section.classId === firstClass?.id,
            )
            setEditingStudentId(null)
            setSelectedFamilyId('')
            setCreateFamilyAfterSave(false)
            setLinkedGuardians([])
            setForm({
              ...emptyForm,
              className: firstClass?.name ?? '',
              section: firstSection?.name ?? '',
            })
            setIsFormOpen(true)
          }
        }
      })
      .catch((loadError: unknown) => {
        if (isCurrent) {
          setError(getErrorMessage(loadError))
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
  }, [canManage, initialAction])

  const activeClasses = useMemo(
    () => classes.filter((item) => item.status === 'Active'),
    [classes],
  )

  const availableSections = useMemo(
    () =>
      sections.filter(
        (section) =>
          section.status === 'Active' && section.className === form.className,
      ),
    [form.className, sections],
  )

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase()
    const hasAssignedSession = studentRows.some(
      (student) => student.academicSessionName,
    )
    return studentRows.filter((student) => {
      const effectiveStatus = getStudentDisplayStatus(student)
      const matchesStatus =
        statusFilter === 'All' || effectiveStatus === statusFilter
      const matchesSession =
        sessionFilter === 'All' ||
        !hasAssignedSession ||
        Boolean(student.academicSessionName)
      const matchesSearch =
        !query ||
        [
          student.admissionNo,
          student.name,
          student.guardianName,
          student.mobile,
          `${student.className}-${student.section}`,
          student.academicSessionName,
        ].some((value) => value.toLowerCase().includes(query))
      return matchesStatus && matchesSession && matchesSearch
    })
  }, [search, sessionFilter, statusFilter, studentRows])

  const handleDelete = async (student: Student) => {
    if (!window.confirm(`Remove ${student.name} from the active student list?`)) {
      return
    }

    try {
      const result = await getErpApi().deleteStudent(student.id)
      if (!result.success) {
        throw new Error('The student record could not be removed.')
      }
      setMessage(`${student.name} was removed from the active student list.`)
      setError('')
      await loadStudents()
    } catch (deleteError) {
      setError(getErrorMessage(deleteError))
      setMessage('')
    }
  }

  const openAddForm = () => {
    const firstClass = activeClasses[0]
    const firstSection = sections.find(
      (section) =>
        section.status === 'Active' && section.classId === firstClass?.id,
    )
    setEditingStudentId(null)
    setSelectedFamilyId('')
    setCreateFamilyAfterSave(false)
    setLinkedGuardians([])
    setForm({
      ...emptyForm,
      className: firstClass?.name ?? '',
      section: firstSection?.name ?? '',
    })
    setIsFormOpen(true)
  }

  const openEditForm = (student: Student) => {
    setEditingStudentId(student.id)
    setSelectedFamilyId('')
    setCreateFamilyAfterSave(false)
    void getErpApi()
      .getStudentGuardians(student.id)
      .then(setLinkedGuardians)
      .catch(() => setLinkedGuardians([]))
    setForm({
      admissionNo: student.admissionNo,
      name: student.name,
      className: student.className,
      section: student.section,
      guardianName: student.guardianName,
      mobile: student.mobile,
      status: student.status,
      address: student.address,
      dateOfBirth: student.dateOfBirth,
      admissionDate: student.admissionDate,
    })
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingStudentId(null)
    setSelectedFamilyId('')
    setCreateFamilyAfterSave(false)
    setLinkedGuardians([])
    setForm(emptyForm)
  }

  const columns: TableColumn<Student>[] = [
    {
      key: 'admission',
      header: 'Admission No.',
      render: (student) => <span className="table-primary">{student.admissionNo}</span>,
    },
    {
      key: 'student',
      header: 'Student Name',
      render: (student) => (
        <div className="person-cell">
          <span className="person-avatar person-avatar--blue">
            {student.name
              .split(' ')
              .map((name) => name[0])
              .join('')
              .slice(0, 2)}
          </span>
          <strong>{student.name}</strong>
        </div>
      ),
    },
    { key: 'class', header: 'Class', render: (student) => student.className },
    { key: 'section', header: 'Section', render: (student) => student.section || '—' },
    {
      key: 'session',
      header: 'Session',
      render: (student) => student.academicSessionName || 'Unassigned',
    },
    {
      key: 'guardian',
      header: 'Guardian',
      render: (student) => student.guardianName || '—',
    },
    { key: 'mobile', header: 'Mobile', render: (student) => student.mobile || '—' },
    {
      key: 'status',
      header: 'Status',
      render: (student) => (
        <span className={`status-badge status-badge--${getStudentDisplayStatus(student).toLowerCase()}`}>
          {getStudentDisplayStatus(student)}
        </span>
      ),
    },
    ...(canManage ? [{
      key: 'action',
      header: '',
      className: 'align-right',
      render: (student) => (
        <div className="row-action-group">
          <button
            className="row-action"
            type="button"
            aria-label={`Edit ${student.name}`}
            title="Edit student"
            onClick={() => openEditForm(student)}
          >
            <Icon name="edit" size={14} />
          </button>
          <button
            className="row-action row-action--danger"
            type="button"
            aria-label={`Delete ${student.name}`}
            title="Delete student"
            onClick={() => void handleDelete(student)}
          >
            <Icon name="trash" size={14} />
          </button>
        </div>
      ),
    } satisfies TableColumn<Student>] : []),
  ]

  const linkSavedStudentToFamily = async (student: Student) => {
    if (createFamilyAfterSave) {
      await getErpApi().createFamilyFromStudentDetails(student.id)
      return
    }
    if (!selectedFamilyId) return
    let familyGuardians = guardians.filter(
      (guardian) =>
        guardian.familyId === selectedFamilyId && guardian.status === 'Active',
    )
    if (familyGuardians.length === 0) {
      const guardian = await getErpApi().createGuardian({
        familyId: selectedFamilyId,
        fullName:
          student.guardianName ||
          student.fatherName ||
          student.motherName ||
          `${student.name} Guardian`,
        relation: student.fatherName ? 'Father' : 'Guardian',
        mobile: student.mobile,
        email: student.email,
        address: student.address,
        isPrimary: true,
        canPickupStudent: true,
        emergencyContact: true,
        status: 'Active',
      })
      familyGuardians = [guardian]
    }
    const guardian =
      familyGuardians.find((item) => item.isPrimary) ?? familyGuardians[0]
    await getErpApi().linkGuardianToStudent({
      studentId: student.id,
      guardianId: guardian.id,
      familyId: selectedFamilyId,
      relationToStudent: guardian.relation,
      isPrimary: true,
      livesWithStudent: true,
      pickupAuthorized: guardian.canPickupStudent,
      financialResponsibility: ['Father', 'Guardian'].includes(guardian.relation),
    })
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsSaving(true)

    try {
      const savedStudent = editingStudentId
        ? await getErpApi().updateStudent(editingStudentId, form)
        : await getErpApi().createStudent(form)
      await linkSavedStudentToFamily(savedStudent)
      await loadStudents()
      closeForm()
      setMessage(
        editingStudentId
          ? `${savedStudent.name} was updated successfully.`
          : `${savedStudent.name} was added successfully.`,
      )
      setError('')
    } catch (saveError) {
      setError(getErrorMessage(saveError))
      setMessage('')
    } finally {
      setIsSaving(false)
    }
  }

  const downloadTemplate = async () => {
    setIsTemplateDownloading(true)
    try {
      const template = await getErpApi().getStudentImportTemplate()
      await downloadStudentImportTemplate(template)
      setMessage('Student import template downloaded.')
      setError('')
    } catch (downloadError) {
      setError(getErrorMessage(downloadError))
      setMessage('')
    } finally {
      setIsTemplateDownloading(false)
    }
  }

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <h2>Students</h2>
          <p>Manage admission records and student information.</p>
        </div>
        {canManage && (
          <div className="page-header-actions">
            <button
              className="secondary-button"
              disabled={isTemplateDownloading}
              onClick={() => void downloadTemplate()}
              type="button"
            >
              <Icon name="download" size={17} />
              {isTemplateDownloading ? 'Preparing...' : 'Download Excel Template'}
            </button>
            <button
              className="secondary-button"
              onClick={() => setIsImportOpen(true)}
              type="button"
            >
              <Icon name="students" size={17} />
              Import Students
            </button>
            <button className="primary-button" type="button" onClick={openAddForm}>
              <Icon name="plus" size={18} />
              Add Student
            </button>
          </div>
        )}
      </section>

      {message && (
        <div className="inline-message">
          <Icon name="check" size={17} />
          <span>{message}</span>
          <button type="button" onClick={() => setMessage('')} aria-label="Dismiss message">
            <Icon name="close" size={15} />
          </button>
        </div>
      )}

      {error && (
        <div className="inline-message inline-message--error">
          <Icon name="close" size={17} />
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} aria-label="Dismiss error">
            <Icon name="close" size={15} />
          </button>
        </div>
      )}

      <section className="panel">
        <div className="list-toolbar">
          <label className="search-field search-field--wide">
            <Icon name="search" size={18} />
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, admission number, guardian or mobile"
              type="search"
              value={search}
            />
          </label>
          <label className="student-list-filter">
            <span>Status</span>
            <select
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as
                    | 'Active'
                    | 'Inactive'
                    | 'TC'
                    | 'Left'
                    | 'All',
                )
              }
              value={statusFilter}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="TC">TC</option>
              <option value="Left">Left</option>
              <option value="All">All Statuses</option>
            </select>
          </label>
          <label className="student-list-filter">
            <span>Academic Session</span>
            <select
              onChange={(event) =>
                setSessionFilter(event.target.value as 'Current' | 'All')
              }
              value={sessionFilter}
            >
              <option value="Current">Current Session</option>
              <option value="All">All / Unassigned</option>
            </select>
          </label>
          <div className="record-count">
            <span>{filteredStudents.length}</span> students
          </div>
        </div>
        <DataTable
          columns={columns}
          getRowKey={(student) => student.id}
          rows={filteredStudents}
          emptyMessage={
            isLoading
              ? 'Loading student records...'
              : search || statusFilter !== 'All' || sessionFilter !== 'All'
                ? 'No students match your search'
                : 'No students yet. Add the first admission record.'
          }
        />
        <div className="table-footer">
          <span>
            Showing {filteredStudents.length} of {studentRows.length} students
          </span>
          <div className="pagination">
            <button disabled type="button">Previous</button>
            <button className="pagination__active" type="button">1</button>
            <button disabled type="button">Next</button>
          </div>
        </div>
      </section>

      {isFormOpen && (
        <div className="drawer-backdrop" role="presentation" onMouseDown={closeForm}>
          <aside
            aria-labelledby="add-student-title"
            className="form-drawer"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="drawer-header">
              <div>
                <h2 id="add-student-title">
                  {editingStudentId ? 'Edit Student' : 'Add New Student'}
                </h2>
                <p>
                  {editingStudentId
                    ? 'Update admission and guardian details.'
                    : 'Enter basic admission and guardian details.'}
                </p>
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={closeForm}
                aria-label="Close form"
              >
                <Icon name="close" size={19} />
              </button>
            </div>
            <form className="drawer-form" onSubmit={(event) => void handleSubmit(event)}>
              <label className="form-field">
                <span>Admission Number</span>
                <input
                  onChange={(event) => setForm({ ...form, admissionNo: event.target.value })}
                  placeholder="Auto-generated if left blank"
                  value={form.admissionNo}
                />
              </label>
              <label className="form-field">
                <span>Student Name *</span>
                <input
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="Full name"
                  required
                  value={form.name}
                />
              </label>
              <div className="form-row">
                <label className="form-field">
                  <span>Class *</span>
                  <select
                    disabled={activeClasses.length === 0}
                    required
                    onChange={(event) => {
                      const className = event.target.value
                      const schoolClass = activeClasses.find(
                        (item) => item.name === className,
                      )
                      const firstSection = sections.find(
                        (section) =>
                          section.status === 'Active' &&
                          section.classId === schoolClass?.id,
                      )
                      setForm({
                        ...form,
                        className,
                        section: firstSection?.name ?? '',
                      })
                    }}
                    value={form.className}
                  >
                    {activeClasses.length === 0 && (
                      <option value="">Create classes from Settings first.</option>
                    )}
                    {activeClasses.map((schoolClass) => (
                      <option key={schoolClass.id} value={schoolClass.name}>
                        Class {schoolClass.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  <span>Section</span>
                  <select
                    disabled={availableSections.length === 0}
                    onChange={(event) => setForm({ ...form, section: event.target.value })}
                    value={form.section}
                  >
                    {availableSections.length === 0 && (
                      <option value="">No sections configured</option>
                    )}
                    {availableSections.map((section) => (
                      <option key={section.id} value={section.name}>
                        Section {section.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {activeClasses.length === 0 && (
                <div className="form-note form-note--warning">
                  <Icon name="clock" size={17} />
                  Create classes from Settings first.
                </div>
              )}
              <label className="form-field">
                <span>Guardian Name</span>
                <input
                  onChange={(event) => setForm({ ...form, guardianName: event.target.value })}
                  placeholder="Parent or guardian name"
                  value={form.guardianName}
                />
              </label>
              <label className="form-field">
                <span>Mobile Number</span>
                <input
                  onChange={(event) => setForm({ ...form, mobile: event.target.value })}
                  placeholder="10-digit mobile number"
                  type="tel"
                  value={form.mobile}
                />
              </label>
              <section className="student-family-section">
                <div>
                  <strong>Family / Guardians</strong>
                  <span>Optional structured family linking.</span>
                </div>
                <label className="form-field">
                  <span>Link Existing Family</span>
                  <select
                    value={selectedFamilyId}
                    onChange={(event) => {
                      setSelectedFamilyId(event.target.value)
                      if (event.target.value) setCreateFamilyAfterSave(false)
                    }}
                  >
                    <option value="">Do not link a family now</option>
                    {families.map((family) => (
                      <option key={family.id} value={family.id}>
                        {family.familyCode} · {family.familyName || family.primaryContactName || 'Family'}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-checkbox-row">
                  <input
                    checked={createFamilyAfterSave}
                    onChange={(event) => {
                      setCreateFamilyAfterSave(event.target.checked)
                      if (event.target.checked) setSelectedFamilyId('')
                    }}
                    type="checkbox"
                  />
                  <span>Create family from this student’s guardian details after save</span>
                </label>
                {editingStudentId && (
                  <div className="linked-guardian-list">
                    {linkedGuardians.length === 0 ? (
                      <span>No structured guardians linked yet.</span>
                    ) : (
                      linkedGuardians.map((link) => (
                        <div key={link.id}>
                          <strong>{link.guardianFullName || link.guardianName}</strong>
                          <span>
                            {link.relationToStudent || link.relation}
                            {link.familyCode ? ` · ${link.familyCode}` : ''}
                            {link.isPrimary ? ' · Primary' : ''}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </section>
              <div className="form-note">
                <Icon name="check" size={17} />
                Additional student details can be added after creating the record.
              </div>
              <div className="drawer-actions">
                <button className="secondary-button" type="button" onClick={closeForm}>
                  Cancel
                </button>
                <button
                  className="primary-button"
                  disabled={isSaving || activeClasses.length === 0}
                  type="submit"
                >
                  {isSaving
                    ? 'Saving...'
                    : editingStudentId
                      ? 'Update Student'
                      : 'Save Student'}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}

      {isImportOpen && (
        <StudentImportDialog
          classes={classes}
          onClose={() => setIsImportOpen(false)}
          onImported={refreshImportedData}
          sections={sections}
          students={studentRows}
        />
      )}
    </div>
  )
}
