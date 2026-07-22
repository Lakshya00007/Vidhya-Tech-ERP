import { useState } from 'react'
import type { FeeReceiptPrintData } from '../types'
import { Icon } from './Icon'
import { FeeReceiptPrint } from './PrintableSchoolDocuments'

interface ReceiptPreviewProps {
  receiptData: FeeReceiptPrintData
  onClose: () => void
  onPrint: () => void
}

export function ReceiptPreview({
  receiptData,
  onClose,
  onPrint,
}: ReceiptPreviewProps) {
  const [printMode, setPrintMode] = useState<'a5' | 'half-a4' | 'two-copy'>('a5')
  const payment = receiptData.payment
  return (
    <div className="receipt-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-labelledby="receipt-preview-title"
        aria-modal="true"
        className="receipt-modal"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="receipt-modal__toolbar">
          <div>
            <h2 id="receipt-preview-title">Fee Receipt Preview</h2>
            <p>{payment.receiptNo}</p>
          </div>
          <div className="receipt-toolbar-actions">
            <select
              aria-label="Receipt print format"
              className="receipt-format-select"
              value={printMode}
              onChange={(event) =>
                setPrintMode(event.target.value as 'a5' | 'half-a4' | 'two-copy')
              }
            >
              <option value="a5">A5 Receipt</option>
              <option value="half-a4">Half-A4 Receipt</option>
              <option value="two-copy">Parent + Office Copy</option>
            </select>
            <button className="secondary-button" type="button" onClick={onClose}>
              Close
            </button>
            <button className="primary-button" type="button" onClick={onPrint}>
              <Icon name="print" size={16} />
              Print Receipt
            </button>
          </div>
        </div>

        <div className={`receipt-print-area receipt-print-area--${printMode}`}>
          {printMode === 'two-copy' ? (
            <>
              <FeeReceiptPrint
                copyLabel="Parent Copy"
                data={receiptData}
                duplicate={payment.status === 'Reversed'}
              />
              <FeeReceiptPrint
                copyLabel="Office Copy"
                data={receiptData}
                duplicate={payment.status === 'Reversed'}
              />
            </>
          ) : (
            <FeeReceiptPrint
              data={receiptData}
              duplicate={payment.status === 'Reversed'}
            />
          )}
        </div>
      </section>
    </div>
  )
}
