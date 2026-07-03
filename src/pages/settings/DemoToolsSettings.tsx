import { useState } from 'react'
import { Icon } from '../../components/Icon'
import { getErpApi, getErrorMessage } from '../../lib/erpApi'
import type { DemoDataResult } from '../../types'
import type { SettingsSectionProps } from '../Settings'

const countLabels: Record<keyof DemoDataResult['created'], string> = {
  classes: 'Classes',
  sections: 'Sections',
  feeHeads: 'Fee Heads',
  feeStructures: 'Fee Structures',
  students: 'Students',
  feePayments: 'Fee Receipts',
  attendance: 'Attendance',
  subjects: 'Subjects',
  exams: 'Exams',
  marks: 'Marks',
}

export function DemoToolsSettings({ onNotice }: SettingsSectionProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [result, setResult] = useState<DemoDataResult | null>(null)

  const createSampleData = async () => {
    if (
      !window.confirm(
        'Create clearly labelled sample records in the current local database?',
      )
    ) {
      return
    }

    setIsCreating(true)
    try {
      const nextResult = await getErpApi().createDemoData()
      setResult(nextResult)
      onNotice({
        type: nextResult.success ? 'success' : 'error',
        message: nextResult.message,
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="demo-tools-layout">
      <section className="panel demo-tools-panel">
        <div className="panel-heading">
          <div>
            <h3>Demo Tools</h3>
            <p>Create a consistent sample dataset for demonstrations and testing</p>
          </div>
          <span className="neutral-badge">Owner only</span>
        </div>

        <div className="demo-warning">
          <Icon name="clock" size={20} />
          <div>
            <strong>Demo tools are for testing only.</strong>
            <p>
              Sample records are added to the active local database. Back up
              production data before using this utility.
            </p>
          </div>
        </div>

        <div className="demo-tools-content">
          <div>
            <h4>Create Sample Demo Data</h4>
            <p>
              Adds labelled classes, sections, fees, five students, two
              receipts, today&apos;s attendance, an exam, subjects and marks.
            </p>
            <ul>
              <li>Existing manual records are never deleted.</li>
              <li>Stable demo identifiers prevent duplicate sample records.</li>
              <li>Running the tool again creates only missing demo records.</li>
            </ul>
          </div>
          <button
            className="primary-button"
            disabled={isCreating}
            onClick={() => void createSampleData()}
            type="button"
          >
            <Icon name="plus" size={17} />
            {isCreating ? 'Creating Demo Data...' : 'Create Sample Demo Data'}
          </button>
        </div>
      </section>

      {result && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Last Demo Data Result</h3>
              <p>{result.message}</p>
            </div>
          </div>
          <div className="demo-result-grid">
            {Object.entries(result.created).map(([key, value]) => (
              <div key={key}>
                <span>{countLabels[key as keyof DemoDataResult['created']]}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
