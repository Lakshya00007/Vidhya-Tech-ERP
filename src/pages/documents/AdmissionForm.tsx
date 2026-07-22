import { useEffect, useMemo, useState } from 'react'
import { AdmissionFormPrint } from '../../components/PrintableSchoolDocuments'
import { Icon } from '../../components/Icon'
import { getDocumentsErpApi, getErrorMessage } from '../../lib/erpApi'
import { getTodayInputValue } from '../../lib/documentPrint'
import type { AdmissionFormData, Student } from '../../types'
import type { DocumentNoticeProps } from './types'

interface AdmissionFormProps extends DocumentNoticeProps {
  students: Student[]
}

export function AdmissionForm({ onNotice, students }: AdmissionFormProps) {
  const activeStudents = useMemo(
    () => students.filter((student) => student.status === 'Active'),
    [students],
  )
  const [mode, setMode] = useState<'Blank' | 'Prefilled'>('Prefilled')
  const [studentId, setStudentId] = useState(activeStudents[0]?.id ?? '')
  const [formDate, setFormDate] = useState(getTodayInputValue)
  const [data, setData] = useState<AdmissionFormData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    let isCurrent = true

    void (async () => {
      await Promise.resolve()
      if (!isCurrent) return

      if (mode === 'Prefilled' && !studentId) {
        setData(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const nextData = await getDocumentsErpApi().getAdmissionFormData({
          mode,
          studentId: mode === 'Prefilled' ? studentId : undefined,
          formDate,
        })
        if (isCurrent) setData(nextData)
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
  }, [formDate, mode, onNotice, studentId])

  const saveSnapshot = async () => {
    if (mode === 'Prefilled' && !studentId) return
    setIsSaving(true)
    try {
      const snapshot = await getDocumentsErpApi().saveAdmissionFormSnapshot({
        mode,
        studentId: mode === 'Prefilled' ? studentId : undefined,
        formDate,
      })
      onNotice({
        type: 'success',
        message: `${snapshot.snapshotNo} was saved.`,
      })
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
              disabled={mode === 'Blank' || activeStudents.length === 0}
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
            >
              {activeStudents.length === 0 && (
                <option value="">No active students available</option>
              )}
              {activeStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.admissionNo} · {student.name}
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
        <section className="panel document-preview-shell document-preview-shell--paper">
          <div className="document-preview-label">
            <span>A4 print preview</span>
            <strong>{mode}</strong>
          </div>
          <AdmissionFormPrint data={data} />
        </section>
      )}
    </div>
  )
}
