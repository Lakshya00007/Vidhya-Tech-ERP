import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Icon } from './Icon'
import {
  parseStudentImportFile,
  validateStudentImportRows,
} from '../lib/studentImport'
import { getErpApi, getErrorMessage } from '../lib/erpApi'
import type {
  ClassItem,
  SectionItem,
  Student,
  StudentImportMode,
  StudentImportResult,
} from '../types'

interface StudentImportDialogProps {
  classes: ClassItem[]
  sections: SectionItem[]
  students: Student[]
  onClose: () => void
  onImported: () => Promise<void>
}

type ParsedRows = Awaited<ReturnType<typeof parseStudentImportFile>>

export function StudentImportDialog({
  classes,
  sections,
  students,
  onClose,
  onImported,
}: StudentImportDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload')
  const [fileName, setFileName] = useState('')
  const [parsedRows, setParsedRows] = useState<ParsedRows>([])
  const [mode, setMode] = useState<StudentImportMode>('skip')
  const [autoCreateMasters, setAutoCreateMasters] = useState(false)
  const [result, setResult] = useState<StudentImportResult | null>(null)
  const [error, setError] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const previewRows = useMemo(
    () =>
      validateStudentImportRows(
        parsedRows,
        { mode, autoCreateMasters },
        students,
        classes,
        sections,
      ),
    [autoCreateMasters, classes, mode, parsedRows, sections, students],
  )
  const validRows = previewRows.filter((row) => row.valid)
  const invalidRows = previewRows.length - validRows.length
  const duplicateRows = previewRows.filter((row) => row.duplicate).length

  const chooseFile = () => inputRef.current?.click()

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setIsParsing(true)
    setError('')
    try {
      const rows = await parseStudentImportFile(file)
      setParsedRows(rows)
      setFileName(file.name)
      setStep('preview')
    } catch (parseError) {
      setError(getErrorMessage(parseError))
    } finally {
      setIsParsing(false)
    }
  }

  const importStudents = async () => {
    setIsImporting(true)
    setError('')
    try {
      const importResult = await getErpApi().importStudentsBulk(
        parsedRows.map((row) => row.data),
        { mode, autoCreateMasters },
      )
      setResult(importResult)
      setStep('result')
      await onImported()
    } catch (importError) {
      setError(getErrorMessage(importError))
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="import-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-labelledby="student-import-title"
        aria-modal="true"
        className="student-import-modal"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="student-import-header">
          <div>
            <p className="eyebrow">Students · Import</p>
            <h2 id="student-import-title">Import Students from Excel or CSV</h2>
            <span>Upload, validate and save student records to the local database.</span>
          </div>
          <button className="icon-button" onClick={onClose} type="button">
            <Icon name="close" size={18} />
          </button>
        </header>

        <div className="import-stepper" aria-label="Import progress">
          {['Upload File', 'Preview & Validate', 'Import Result'].map(
            (label, index) => {
              const currentIndex =
                step === 'upload' ? 0 : step === 'preview' ? 1 : 2
              return (
                <div
                  className={index <= currentIndex ? 'import-step import-step--active' : 'import-step'}
                  key={label}
                >
                  <span>{index + 1}</span>
                  {label}
                </div>
              )
            },
          )}
        </div>

        {error && (
          <div className="inline-message inline-message--error import-message">
            <Icon name="close" size={16} />
            <span>{error}</span>
          </div>
        )}

        {step === 'upload' && (
          <div className="import-upload-step">
            <input
              accept=".xlsx,.xls,.csv"
              className="visually-hidden"
              onChange={(event) => void handleFile(event)}
              ref={inputRef}
              type="file"
            />
            <button
              className="import-drop-zone"
              disabled={isParsing}
              onClick={chooseFile}
              type="button"
            >
              <span><Icon name="download" size={25} /></span>
              <strong>{isParsing ? 'Reading file...' : 'Choose Excel or CSV file'}</strong>
              <small>.xlsx, .xls or .csv · maximum 10 MB and 5,000 rows</small>
            </button>
            <div className="import-option-grid">
              <label className="form-field">
                <span>Duplicate Admission Numbers</span>
                <select
                  onChange={(event) => setMode(event.target.value as StudentImportMode)}
                  value={mode}
                >
                  <option value="skip">Skip duplicates</option>
                  <option value="update">Update existing students</option>
                </select>
              </label>
              <label className="import-checkbox">
                <input
                  checked={autoCreateMasters}
                  onChange={(event) => setAutoCreateMasters(event.target.checked)}
                  type="checkbox"
                />
                <span>
                  <strong>Auto-create classes and sections</strong>
                  <small>Missing academic masters will be created during import.</small>
                </span>
              </label>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="import-preview-step">
            <div className="import-preview-toolbar">
              <div>
                <strong>{fileName}</strong>
                <span>{previewRows.length} non-empty student row(s)</span>
              </div>
              <div className="import-preview-counts">
                <span className="import-count import-count--valid">{validRows.length} valid</span>
                <span className="import-count import-count--error">{invalidRows} invalid</span>
                <span className="import-count">{duplicateRows} duplicate</span>
              </div>
            </div>
            <div className="import-preview-options">
              <label className="inline-select">
                <span>Duplicate mode</span>
                <select
                  onChange={(event) => setMode(event.target.value as StudentImportMode)}
                  value={mode}
                >
                  <option value="skip">Skip duplicates</option>
                  <option value="update">Update existing</option>
                </select>
              </label>
              <label className="import-checkbox import-checkbox--compact">
                <input
                  checked={autoCreateMasters}
                  onChange={(event) => setAutoCreateMasters(event.target.checked)}
                  type="checkbox"
                />
                <span><strong>Auto-create classes/sections</strong></span>
              </label>
            </div>
            <div className="import-table-scroll">
              <table className="data-table import-preview-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Admission No.</th>
                    <th>Student Name</th>
                    <th>Class / Section</th>
                    <th>Guardian</th>
                    <th>Mobile</th>
                    <th>Validation</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.slice(0, 250).map((row) => (
                    <tr
                      className={row.valid ? '' : 'import-row--invalid'}
                      key={`${row.data.rowNumber}-${row.data.admissionNo}`}
                    >
                      <td>{row.data.rowNumber}</td>
                      <td>{row.data.admissionNo || '—'}</td>
                      <td>{row.data.name || '—'}</td>
                      <td>
                        {row.data.className || '—'}
                        {row.data.section ? ` / ${row.data.section}` : ''}
                      </td>
                      <td>{row.data.guardianName || '—'}</td>
                      <td>{row.data.mobile || '—'}</td>
                      <td className="import-validation-cell">
                        {row.errors.length > 0 ? (
                          row.errors.map((item) => <span className="import-error" key={item}>{item}</span>)
                        ) : row.warnings.length > 0 ? (
                          row.warnings.map((item) => <span className="import-warning" key={item}>{item}</span>)
                        ) : (
                          <span className="import-valid"><Icon name="check" size={12} /> Valid</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {previewRows.length > 250 && (
              <p className="import-row-limit">
                Preview shows the first 250 rows. All {previewRows.length} rows will be validated.
              </p>
            )}
          </div>
        )}

        {step === 'result' && result && (
          <div className="import-result-step">
            <span className="import-result-icon"><Icon name="check" size={28} /></span>
            <h3>Student import complete</h3>
            <p>Valid records were committed to the local SQLite database.</p>
            <div className="import-result-grid">
              <div><span>Total Rows</span><strong>{result.totalRows}</strong></div>
              <div><span>Imported</span><strong>{result.imported}</strong></div>
              <div><span>Inserted</span><strong>{result.inserted}</strong></div>
              <div><span>Updated</span><strong>{result.updated}</strong></div>
              <div><span>Skipped</span><strong>{result.skipped}</strong></div>
              <div><span>Duplicates</span><strong>{result.duplicates}</strong></div>
              <div><span>Errors</span><strong>{result.errors.length}</strong></div>
            </div>
            {(result.classesCreated > 0 || result.sectionsCreated > 0) && (
              <p className="import-masters-result">
                Created {result.classesCreated} class(es) and {result.sectionsCreated} section(s).
              </p>
            )}
            {result.errors.length > 0 && (
              <div className="import-result-errors">
                {result.errors.map((item) => (
                  <p key={`${item.rowNumber}-${item.message}`}>
                    <strong>Row {item.rowNumber}{item.admissionNo ? ` · ${item.admissionNo}` : ''}</strong>
                    <span>{item.message}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        <footer className="student-import-footer">
          <span>
            Import writes are processed transactionally through Electron.
          </span>
          <div>
            {step === 'preview' && (
              <button className="secondary-button" onClick={() => setStep('upload')} type="button">
                Back
              </button>
            )}
            <button className="secondary-button" onClick={onClose} type="button">
              {step === 'result' ? 'Done' : 'Cancel'}
            </button>
            {step === 'preview' && (
              <button
                className="primary-button"
                disabled={validRows.length === 0 || isImporting}
                onClick={() => void importStudents()}
                type="button"
              >
                <Icon name="check" size={16} />
                {isImporting
                  ? 'Importing...'
                  : `Import Valid Students (${validRows.length})`}
              </button>
            )}
          </div>
        </footer>
      </section>
    </div>
  )
}
