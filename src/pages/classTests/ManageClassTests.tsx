import { useEffect, useState, type FormEvent } from 'react'
import { DataTable, type TableColumn } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import { getClassTestsErpApi, getErrorMessage } from '../../lib/erpApi'
import { formatReportDate, getTodayValue } from '../../lib/reportUtils'
import type {
  ClassTest,
  ClassTestMark,
  ClassTestResultStatus,
  ClassTestStatus,
  CreateClassTestInput,
} from '../../types'
import type { ClassTestsChildProps } from './types'

interface ManageClassTestsProps extends ClassTestsChildProps {
  onRefresh: () => Promise<void>
}

interface MarkDraft extends ClassTestMark {
  marksInput: string
}

const buildForm = (
  data: ClassTestsChildProps['data'],
  test: ClassTest | null,
): CreateClassTestInput => {
  if (test) {
    return {
      testName: test.testName,
      className: test.className,
      section: test.section,
      subjectId: test.subjectId,
      teacherId: test.teacherId,
      testDate: test.testDate,
      maxMarks: test.maxMarks,
      passingMarks: test.passingMarks,
      description: test.description,
      status: test.status,
    }
  }
  const className =
    data.classes.find((item) => item.status === 'Active')?.name ?? ''
  const subject = data.subjects.find(
    (item) => item.status === 'Active' && item.className === className,
  )
  return {
    testName: '',
    className,
    section: '',
    subjectId: subject?.id ?? '',
    teacherId:
      data.employees.find((item) => item.status === 'Active')?.id ?? '',
    testDate: getTodayValue(),
    maxMarks: subject?.maxMarks ?? 20,
    passingMarks: subject
      ? Math.min(subject.passingMarks, subject.maxMarks)
      : 7,
    description: '',
    status: 'Active',
  }
}

const asDrafts = (marks: ClassTestMark[]): MarkDraft[] =>
  marks.map((mark) => ({
    ...mark,
    marksInput:
      mark.resultStatus === 'Pending' || mark.resultStatus === 'Absent'
        ? ''
        : String(mark.marksObtained),
  }))

export function ManageClassTests({
  data,
  onNotice,
  onRefresh,
}: ManageClassTestsProps) {
  const [editingTest, setEditingTest] = useState<ClassTest | null>(null)
  const [form, setForm] = useState<CreateClassTestInput>(() =>
    buildForm(data, null),
  )
  const [selectedTestId, setSelectedTestId] = useState(
    data.tests[0]?.id ?? '',
  )
  const [drafts, setDrafts] = useState<MarkDraft[]>([])
  const [isLoadingMarks, setIsLoadingMarks] = useState(false)
  const [isSavingTest, setIsSavingTest] = useState(false)
  const [isSavingMarks, setIsSavingMarks] = useState(false)

  const selectedTest = data.tests.find((item) => item.id === selectedTestId)
  const sections = data.sections.filter(
    (item) => item.status === 'Active' && item.className === form.className,
  )
  const subjects = data.subjects.filter(
    (item) =>
      item.className === form.className &&
      (item.status === 'Active' || item.id === form.subjectId),
  )
  const teachers = data.employees.filter(
    (item) => item.status === 'Active' || item.id === form.teacherId,
  )

  useEffect(() => {
    if (!selectedTestId) return
    let current = true
    Promise.resolve()
      .then(() => {
        if (current) setIsLoadingMarks(true)
        return getClassTestsErpApi().getClassTestMarks(selectedTestId)
      })
      .then((rows) => {
        if (current) setDrafts(asDrafts(rows))
      })
      .catch((error: unknown) => {
        if (current) {
          setDrafts([])
          onNotice({ type: 'error', message: getErrorMessage(error) })
        }
      })
      .finally(() => {
        if (current) setIsLoadingMarks(false)
      })
    return () => {
      current = false
    }
  }, [onNotice, selectedTestId])

  const resetForm = () => {
    setEditingTest(null)
    setForm(buildForm(data, null))
  }

  const submitTest = async (event: FormEvent) => {
    event.preventDefault()
    try {
      setIsSavingTest(true)
      const api = getClassTestsErpApi()
      const saved = editingTest
        ? await api.updateClassTest(editingTest.id, form)
        : await api.createClassTest(form)
      await onRefresh()
      setSelectedTestId(saved.id)
      if (editingTest) {
        setDrafts(asDrafts(await api.getClassTestMarks(saved.id)))
      }
      onNotice({
        type: 'success',
        message: editingTest
          ? `${saved.testName} was updated.`
          : `${saved.testName} was created with ${saved.markCount} student mark row(s).`,
      })
      resetForm()
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSavingTest(false)
    }
  }

  const edit = (test: ClassTest) => {
    setEditingTest(test)
    setForm(buildForm(data, test))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const remove = async (test: ClassTest) => {
    if (!window.confirm(`Delete "${test.testName}"?`)) return
    try {
      const result = await getClassTestsErpApi().deleteClassTest(test.id)
      if (!result.success) throw new Error('Class test was not found.')
      await onRefresh()
      if (selectedTestId === test.id) {
        const nextTest = data.tests.find((item) => item.id !== test.id)
        setSelectedTestId(nextTest?.id ?? '')
        setDrafts([])
      }
      if (editingTest?.id === test.id) resetForm()
      onNotice({
        type: 'success',
        message: `${test.testName} was removed.`,
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const updateDraft = (id: string, patch: Partial<MarkDraft>) => {
    setDrafts((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    )
  }

  const updateMarks = (draft: MarkDraft, value: string) => {
    if (!selectedTest) return
    if (value === '') {
      updateDraft(draft.id, {
        marksInput: '',
        marksObtained: 0,
        resultStatus: 'Pending',
      })
      return
    }
    const marks = Number(value)
    updateDraft(draft.id, {
      marksInput: value,
      marksObtained: marks,
      resultStatus:
        Number.isFinite(marks) && marks >= selectedTest.passingMarks
          ? 'Pass'
          : 'Fail',
    })
  }

  const updateStatus = (
    draft: MarkDraft,
    status: ClassTestResultStatus,
  ) => {
    if (!selectedTest) return
    if (status === 'Absent' || status === 'Pending') {
      updateDraft(draft.id, {
        resultStatus: status,
        marksInput: '',
        marksObtained: 0,
      })
      return
    }
    const marks = Number(draft.marksInput || 0)
    updateDraft(draft.id, {
      resultStatus:
        marks >= selectedTest.passingMarks ? 'Pass' : 'Fail',
    })
  }

  const saveMarks = async () => {
    if (!selectedTest || drafts.length === 0) return
    const invalid = drafts.find(
      (item) =>
        item.resultStatus !== 'Pending' &&
        item.resultStatus !== 'Absent' &&
        (item.marksInput.trim() === '' ||
          !Number.isInteger(Number(item.marksInput)) ||
          Number(item.marksInput) < 0 ||
          Number(item.marksInput) > selectedTest.maxMarks),
    )
    if (invalid) {
      onNotice({
        type: 'error',
        message: `Enter marks from 0 to ${selectedTest.maxMarks} for ${invalid.studentName}.`,
      })
      return
    }
    try {
      setIsSavingMarks(true)
      const saved = await getClassTestsErpApi().saveClassTestMarksBulk(
        drafts.map((item) => ({
          testId: item.testId,
          studentId: item.studentId,
          marksObtained:
            item.resultStatus === 'Pending' ||
            item.resultStatus === 'Absent'
              ? 0
              : Number(item.marksInput),
          resultStatus: item.resultStatus,
          remarks: item.remarks,
        })),
      )
      setDrafts(asDrafts(saved))
      await onRefresh()
      onNotice({
        type: 'success',
        message: `Test marks were saved for ${saved.length} student(s).`,
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSavingMarks(false)
    }
  }

  const columns: TableColumn<ClassTest>[] = [
    {
      key: 'test',
      header: 'Class Test',
      render: (test) => (
        <div className="primary-cell">
          <strong>{test.testName}</strong>
          <span>{test.subjectName}</span>
        </div>
      ),
    },
    {
      key: 'class',
      header: 'Class / Section',
      render: (test) =>
        `${test.className} / ${test.section || 'All Sections'}`,
    },
    {
      key: 'date',
      header: 'Test Date',
      render: (test) => formatReportDate(test.testDate),
    },
    {
      key: 'marks',
      header: 'Marks',
      render: (test) => `${test.passingMarks} / ${test.maxMarks} pass`,
    },
    {
      key: 'pending',
      header: 'Pending',
      render: (test) => `${test.pendingMarkCount} / ${test.markCount}`,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (test) => (
        <div className="table-actions">
          <button
            className="table-action-button"
            onClick={() => setSelectedTestId(test.id)}
            type="button"
          >
            <Icon name="edit" size={13} />
            Marks
          </button>
          <button
            className="table-action-button"
            onClick={() => edit(test)}
            type="button"
          >
            Edit
          </button>
          <button
            className="table-action-button table-action-button--danger"
            onClick={() => void remove(test)}
            type="button"
          >
            <Icon name="trash" size={13} />
            Delete
          </button>
        </div>
      ),
    },
  ]

  if (!data.classes.some((item) => item.status === 'Active')) {
    return (
      <section className="panel document-empty-state">
        <Icon name="building" size={26} />
        <h3>Create classes from Settings first.</h3>
      </section>
    )
  }

  return (
    <div className="class-test-manage-stack">
      <div className="class-test-setup-layout">
        <form className="panel class-test-form" onSubmit={submitTest}>
          <div className="panel-heading">
            <div>
              <h3>{editingTest ? 'Edit Class Test' : 'Create Class Test'}</h3>
              <p>Student mark rows are created automatically.</p>
            </div>
            {editingTest && (
              <button
                className="text-button"
                onClick={resetForm}
                type="button"
              >
                Cancel edit
              </button>
            )}
          </div>
          <div className="class-test-form-fields">
            <label className="form-field class-test-field--full">
              <span>Test Name</span>
              <input
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    testName: event.target.value,
                  }))
                }
                placeholder="e.g. Weekly Mathematics Test"
                required
                value={form.testName}
              />
            </label>
            <label className="form-field">
              <span>Class</span>
              <select
                onChange={(event) => {
                  const className = event.target.value
                  const subject = data.subjects.find(
                    (item) =>
                      item.status === 'Active' &&
                      item.className === className,
                  )
                  setForm((current) => ({
                    ...current,
                    className,
                    section: '',
                    subjectId: subject?.id ?? '',
                    maxMarks: subject?.maxMarks ?? current.maxMarks,
                    passingMarks: subject
                      ? Math.min(subject.passingMarks, subject.maxMarks)
                      : current.passingMarks,
                  }))
                }}
                value={form.className}
              >
                {data.classes
                  .filter((item) => item.status === 'Active')
                  .map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="form-field">
              <span>Section</span>
              <select
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    section: event.target.value,
                  }))
                }
                value={form.section}
              >
                <option value="">All Sections</option>
                {sections.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Subject</span>
              <select
                onChange={(event) => {
                  const subject = data.subjects.find(
                    (item) => item.id === event.target.value,
                  )
                  setForm((current) => ({
                    ...current,
                    subjectId: event.target.value,
                    maxMarks: subject?.maxMarks ?? current.maxMarks,
                    passingMarks: subject
                      ? Math.min(subject.passingMarks, subject.maxMarks)
                      : current.passingMarks,
                  }))
                }}
                required
                value={form.subjectId}
              >
                <option value="">Select subject</option>
                {subjects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Teacher</span>
              <select
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    teacherId: event.target.value,
                  }))
                }
                required
                value={form.teacherId}
              >
                <option value="">Select teacher</option>
                {teachers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Test Date</span>
              <input
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    testDate: event.target.value,
                  }))
                }
                required
                type="date"
                value={form.testDate}
              />
            </label>
            <label className="form-field">
              <span>Maximum Marks</span>
              <input
                min="1"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    maxMarks: Number(event.target.value),
                  }))
                }
                required
                type="number"
                value={form.maxMarks}
              />
            </label>
            <label className="form-field">
              <span>Passing Marks</span>
              <input
                max={form.maxMarks}
                min="0"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    passingMarks: Number(event.target.value),
                  }))
                }
                required
                type="number"
                value={form.passingMarks}
              />
            </label>
            <label className="form-field">
              <span>Status</span>
              <select
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as ClassTestStatus,
                  }))
                }
                value={form.status}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>
            <label className="form-field class-test-field--full">
              <span>Description</span>
              <textarea
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Optional test syllabus or description"
                rows={3}
                value={form.description}
              />
            </label>
          </div>
          <div className="class-test-form-footer">
            <button
              className="primary-button"
              disabled={
                isSavingTest || !form.subjectId || !form.teacherId
              }
              type="submit"
            >
              <Icon name={editingTest ? 'check' : 'plus'} size={16} />
              {isSavingTest
                ? 'Saving...'
                : editingTest
                  ? 'Update Test'
                  : 'Create Test'}
            </button>
          </div>
        </form>

        <section className="panel class-test-list-panel">
          <div className="panel-heading">
            <div>
              <h3>Existing Class Tests</h3>
              <p>Select Marks to open the student entry register.</p>
            </div>
            <span className="record-count">{data.tests.length} tests</span>
          </div>
          <DataTable
            columns={columns}
            emptyMessage="No class tests have been created."
            getRowKey={(test) => test.id}
            rows={data.tests}
          />
        </section>
      </div>

      <section className="panel class-test-marks-panel">
        <div className="class-test-marks-toolbar">
          <div>
            <h3>Student Test Marks</h3>
            <p>
              {selectedTest
                ? `${selectedTest.testName} · ${selectedTest.subjectName} · Class ${selectedTest.className}${selectedTest.section ? `-${selectedTest.section}` : ''}`
                : 'Select a class test to enter marks.'}
            </p>
          </div>
          <div className="class-test-marks-actions">
            <label className="form-field">
              <span>Class Test</span>
              <select
                onChange={(event) => setSelectedTestId(event.target.value)}
                value={selectedTestId}
              >
                {data.tests.length === 0 && (
                  <option value="">No tests available</option>
                )}
                {data.tests.map((test) => (
                  <option key={test.id} value={test.id}>
                    {test.testName} · Class {test.className}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="primary-button"
              disabled={!selectedTest || drafts.length === 0 || isSavingMarks}
              onClick={() => void saveMarks()}
              type="button"
            >
              <Icon name="check" size={16} />
              {isSavingMarks ? 'Saving...' : 'Save Marks'}
            </button>
          </div>
        </div>
        {isLoadingMarks ? (
          <div className="timetable-view-loading">
            <span className="loading-spinner" />
            Loading mark rows...
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table class-test-marks-table">
              <thead>
                <tr>
                  <th>Admission No</th>
                  <th>Student Name</th>
                  <th>Marks Obtained</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {drafts.length > 0 ? (
                  drafts.map((draft) => (
                    <tr key={draft.id}>
                      <td>{draft.admissionNo}</td>
                      <td>
                        <strong>{draft.studentName}</strong>
                      </td>
                      <td>
                        <div className="class-test-mark-input">
                          <input
                            disabled={draft.resultStatus === 'Absent'}
                            max={selectedTest?.maxMarks}
                            min="0"
                            onChange={(event) =>
                              updateMarks(draft, event.target.value)
                            }
                            placeholder="—"
                            type="number"
                            value={draft.marksInput}
                          />
                          <span>/ {selectedTest?.maxMarks ?? 0}</span>
                        </div>
                      </td>
                      <td>
                        <select
                          className={`class-test-status class-test-status--${draft.resultStatus.toLowerCase()}`}
                          onChange={(event) =>
                            updateStatus(
                              draft,
                              event.target.value as ClassTestResultStatus,
                            )
                          }
                          value={draft.resultStatus}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Pass">Pass</option>
                          <option value="Fail">Fail</option>
                          <option value="Absent">Absent</option>
                        </select>
                      </td>
                      <td>
                        <input
                          className="class-test-remarks-input"
                          onChange={(event) =>
                            updateDraft(draft.id, {
                              remarks: event.target.value,
                            })
                          }
                          placeholder="Optional remarks"
                          value={draft.remarks}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="empty-table" colSpan={5}>
                      {selectedTest
                        ? 'No active students were found for this test.'
                        : 'Create or select a class test first.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
