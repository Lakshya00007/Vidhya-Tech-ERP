import { useEffect, useMemo, useState } from 'react'
import { AdmissionFormPrint } from '../../components/PrintableSchoolDocuments'
import { Icon } from '../../components/Icon'
import { getDocumentsErpApi, getErrorMessage } from '../../lib/erpApi'
import { getTodayInputValue } from '../../lib/documentPrint'
import type { AdmissionFormData, AdmissionFormSnapshot, Student } from '../../types'
import type { DocumentNoticeProps } from './types'

interface AdmissionFormProps extends DocumentNoticeProps {
  students: Student[]
}

export function AdmissionForm({ onNotice, students }: AdmissionFormProps) {
  const selectableStudents = useMemo(
    () => students.filter((student) => student.status !== 'Inactive'),
    [students],
  )
  const [mode, setMode] = useState<'Blank' | 'Prefilled'>('Prefilled')
  const [studentId, setStudentId] = useState(selectableStudents[0]?.id ?? '')
  const [formDate, setFormDate] = useState(getTodayInputValue)
  const [data, setData] = useState<AdmissionFormData | null>(null)
  const [snapshots, setSnapshots] = useState<AdmissionFormSnapshot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [scaleMode, setScaleMode] = useState<'fit-page' | 'fit-width' | 'actual'>('fit-page')
  const selectedStudentId = useMemo(() => {
    if (mode === 'Blank') return ''
    if (selectableStudents.some((student) => student.id === studentId)) {
      return studentId
    }
    return selectableStudents[0]?.id ?? ''
  }, [mode, selectableStudents, studentId])

  useEffect(() => {
    let isCurrent = true

    void (async () => {
      await Promise.resolve()
      if (!isCurrent) return

      if (mode === 'Prefilled' && !selectedStudentId) {
        setData(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const nextData = await getDocumentsErpApi().getAdmissionFormData({
          mode,
          studentId: mode === 'Prefilled' ? selectedStudentId : undefined,
          formDate,
        })
        const nextSnapshots =
          mode === 'Prefilled' && selectedStudentId
            ? await getDocumentsErpApi().getAdmissionFormSnapshots({
                studentId: selectedStudentId,
              })
            : []
        if (isCurrent) {
          setData(nextData)
          setSnapshots(nextSnapshots)
        }
      } catch (error) {
        if (isCurrent) {
          setData(null)
          onNotice({ type: 'error', message: getErrorMessage(error) })
        }
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    })()

    return () => {
      isCurrent = false
    }
  }, [formDate, mode, onNotice, selectedStudentId])

  const saveSnapshot = async () => {
    if (mode === 'Prefilled' && !selectedStudentId) return
    setIsSaving(true)
    try {
      const snapshot = await getDocumentsErpApi().saveAdmissionFormSnapshot({
        mode,
        studentId: mode === 'Prefilled' ? selectedStudentId : undefined,
        formDate,
      })
      onNotice({
        type: 'success',
        message: `${snapshot.snapshotNo} was saved.`,
      })
      if (mode === 'Prefilled' && selectedStudentId) {
        setSnapshots(
          await getDocumentsErpApi().getAdmissionFormSnapshots({
            studentId: selectedStudentId,
          }),
        )
      }
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="document-workspace">
      <section className="panel document-toolbar">
        <div className="document-toolbar__heading">
          <span className="document-toolbar__icon">
            <Icon name="reports" size={20} />
          </span>
          <div>
            <h3>Admission Form</h3>
            <p>Print blank or prefilled admission forms from student records.</p>
          </div>
        </div>
        <div className="document-filter-grid document-filter-grid--certificate">
          <label className="form-field">
            <span>Mode</span>
            <select
              value={mode}
              onChange={(event) =>
                setMode(event.target.value as 'Blank' | 'Prefilled')
              }
            >
              <option value="Prefilled">Prefilled Admission Form</option>
              <option value="Blank">Blank Admission Form</option>
            </select>
          </label>
          <label className="form-field">
            <span>Student</span>
            <select
              disabled={mode === 'Blank' || selectableStudents.length === 0}
              value={selectedStudentId}
              onChange={(event) => setStudentId(event.target.value)}
            >
              {selectableStudents.length === 0 && (
                <option value="">No students available</option>
              )}
              {selectableStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.admissionNo} · {student.name}
                  {student.status === 'Draft' ? ' · Draft' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Form Date</span>
            <input
              type="date"
              value={formDate}
              onChange={(event) => setFormDate(event.target.value)}
            />
          </label>
          <button
            className={scaleMode === 'fit-page' ? 'secondary-button secondary-button--active' : 'secondary-button'}
            onClick={() => setScaleMode('fit-page')}
            type="button"
          >
            Fit Page
          </button>
          <button
            className={scaleMode === 'fit-width' ? 'secondary-button secondary-button--active' : 'secondary-button'}
            onClick={() => setScaleMode('fit-width')}
            type="button"
          >
            Fit Width
          </button>
          <button
            className={scaleMode === 'actual' ? 'secondary-button secondary-button--active' : 'secondary-button'}
            onClick={() => setScaleMode('actual')}
            type="button"
          >
            Actual Size
          </button>
          <button
            className="secondary-button document-print-button"
            disabled={!data || isSaving}
            onClick={() => void saveSnapshot()}
            type="button"
          >
            <Icon name="check" size={16} />
            {isSaving ? 'Saving...' : 'Issue / Save Form'}
          </button>
          <button
            className="primary-button document-print-button"
            disabled={!data}
            onClick={() => window.setTimeout(() => window.print(), 50)}
            type="button"
          >
            <Icon name="print" size={16} />
            Print / Save PDF
          </button>
        </div>
      </section>

      {!data ? (
        <section className="panel document-empty-state">
          {isLoading ? <span className="loading-spinner" /> : <Icon name="students" size={28} />}
          <h3>{isLoading ? 'Preparing admission form...' : 'No form selected'}</h3>
          <p>Select a student or choose blank form mode.</p>
        </section>
      ) : (
        <>
          <section className="document-preview-shell document-preview-shell--a4">
            <div className="document-preview-label panel">
              <span>A4 print preview</span>
              <strong>{mode}</strong>
            </div>
            <div className="document-preview-canvas">
              <div className={`document-preview-page document-preview-page--${scaleMode}`}>
                <AdmissionFormPrint data={data} />
              </div>
            </div>
          </section>
          {mode === 'Prefilled' && (
            <section className="panel document-history-panel">
              <div className="panel-heading">
                <div>
                  <h3>Saved Admission Form Snapshots</h3>
                  <p>Historical issued forms remain unchanged after student edits.</p>
                </div>
              </div>
              {snapshots.length === 0 ? (
                <p className="empty-inline">No saved admission form snapshots yet.</p>
              ) : (
                <div className="document-history-list">
                  {snapshots.map((snapshot) => (
                    <div key={snapshot.id}>
                      <strong>{snapshot.snapshotNo}</strong>
                      <span>{snapshot.studentName || 'Blank form'}</span>
                      <small>{snapshot.formDate}</small>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  )
}
