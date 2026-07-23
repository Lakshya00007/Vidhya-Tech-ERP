import { useCallback, useEffect, useMemo, useState } from 'react'
import { DataTable, type TableColumn } from '../components/DataTable'
import { Icon } from '../components/Icon'
import { ManagedImagePreview } from '../components/ManagedImage'
import { StudentImportDialog } from '../components/StudentImportDialog'
import { getErpApi, getErrorMessage } from '../lib/erpApi'
import { downloadStudentImportTemplate } from '../lib/studentImport'
import { StudentAdmissionForm } from './students/StudentAdmissionForm'
import type {
  ClassItem,
  Family,
  SectionItem,
  Student,
  StudentAdmissionProfile,
} from '../types'

interface StudentsProps {
  canManage: boolean
  initialAction?: 'add' | 'import'
  initialSessionFilter?: 'Current' | 'All'
  initialStatusFilter?: StudentListStatusFilter
  onOpenDocuments?: (view: 'admission-letter' | 'id-cards') => void
  onOpenFees?: (view: 'generate-invoice') => void
}

export type StudentListStatusFilter =
  | 'Draft'
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
  onOpenDocuments,
  onOpenFees,
}: StudentsProps) {
  const [studentRows, setStudentRows] = useState<Student[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [sections, setSections] = useState<SectionItem[]>([])
  const [families, setFamilies] = useState<Family[]>([])
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
  const [isLoading, setIsLoading] = useState(true)
  const [isTemplateDownloading, setIsTemplateDownloading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadStudents = useCallback(async () => {
    try {
      const [students, familyRows] = await Promise.all([
        getErpApi().getStudents(),
        getErpApi().getFamilies({}),
      ])
      setStudentRows(students)
      setFamilies(familyRows)
      setError('')
    } catch (loadError) {
      setError(getErrorMessage(loadError))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshImportedData = useCallback(async () => {
    const [students, classRows, sectionRows, familyRows] = await Promise.all([
      getErpApi().getStudents(),
      getErpApi().getClasses(),
      getErpApi().getSections(),
      getErpApi().getFamilies({}),
    ])
    setStudentRows(students)
    setClasses(classRows)
    setSections(sectionRows)
    setFamilies(familyRows)
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
        ]),
      )
      .then(([students, classRows, sectionRows, familyRows]) => {
        if (isCurrent) {
          setStudentRows(students)
          setClasses(classRows)
          setSections(sectionRows)
          setFamilies(familyRows)
          setError('')
          if (canManage && initialAction === 'add') {
            setEditingStudentId(null)
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
    setEditingStudentId(null)
    setIsFormOpen(true)
  }

  const openEditForm = (student: Student) => {
    setEditingStudentId(student.id)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingStudentId(null)
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
            <ManagedImagePreview
              alt={`${student.name} photo`}
              assetKey={student.photoAssetKey}
              fallback={
                <>
                  {student.name
                    .split(' ')
                    .map((name) => name[0])
                    .join('')
                    .slice(0, 2)}
                </>
              }
            />
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

  const handleAdmissionSaved = async (profile: StudentAdmissionProfile) => {
    await loadStudents()
    setMessage(
      profile.student.status === 'Draft'
        ? `${profile.student.name} was saved as an admission draft.`
        : `${profile.student.name} was saved successfully.`,
    )
    setError('')
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
	                    | 'Draft'
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
	              <option value="Draft">Draft</option>
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
        <StudentAdmissionForm
          classes={classes}
          editingStudent={
            editingStudentId
              ? studentRows.find((student) => student.id === editingStudentId)
              : null
          }
          families={families}
          onClose={closeForm}
          onOpenDocuments={(view) => {
            closeForm()
            onOpenDocuments?.(view)
          }}
          onOpenFees={(view) => {
            closeForm()
            onOpenFees?.(view)
          }}
          onSaved={handleAdmissionSaved}
          sections={sections}
        />
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
