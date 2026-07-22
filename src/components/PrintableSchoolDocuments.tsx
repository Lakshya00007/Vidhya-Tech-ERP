import { Icon } from './Icon'
import {
  amountToWords,
  displayValue,
  formatCurrency,
  formatDocumentDate,
} from '../lib/documentPrint'
import type {
  AdmissionFormData,
  DocumentTemplateSettings,
  FeeReceiptPrintData,
  SchoolSettings,
  TransferCertificate,
  TransferCertificatePreview,
} from '../types'

const contactLine = (settings: SchoolSettings) =>
  [settings.phone, settings.email].filter(Boolean).join(' | ')

function SchoolLogo({
  path,
  label = 'School logo',
}: {
  path?: string
  label?: string
}) {
  if (path) {
    return <img alt={label} className="print-school-logo" src={path} />
  }
  return (
    <span className="print-school-logo print-school-logo--placeholder">
      <Icon name="school" size={26} />
    </span>
  )
}

function SignatureImage({
  path,
  label,
}: {
  path?: string
  label: string
}) {
  if (!path) return <span className="print-signature-line" />
  return <img alt={label} className="print-signature-image" src={path} />
}

export function PrintDocumentHeader({
  settings,
  template,
  title,
  subtitle,
}: {
  settings: SchoolSettings
  template: DocumentTemplateSettings
  title: string
  subtitle?: string
}) {
  return (
    <header
      className="print-document-header"
      style={{ borderColor: template.accentColor }}
    >
      <SchoolLogo path={template.schoolStampPath} />
      <div>
        <h1>{settings.schoolName}</h1>
        {settings.address && <p>{settings.address}</p>}
        {contactLine(settings) && <span>{contactLine(settings)}</span>}
        {(template.udiseCode || template.recognitionNumber) && (
          <small>
            {[
              template.udiseCode ? `UDISE: ${template.udiseCode}` : '',
              template.recognitionNumber
                ? `Recognition No.: ${template.recognitionNumber}`
                : '',
            ]
              .filter(Boolean)
              .join(' | ')}
          </small>
        )}
      </div>
      <div className="print-document-title-block">
        <strong>{title}</strong>
        {subtitle && <span>{subtitle}</span>}
      </div>
    </header>
  )
}

function FieldLine({
  label,
  value,
  wide = false,
}: {
  label: string
  value?: string | number | null
  wide?: boolean
}) {
  return (
    <div className={wide ? 'print-field print-field--wide' : 'print-field'}>
      <span>{label}</span>
      <strong>{displayValue(value)}</strong>
    </div>
  )
}

function PhotoBox({ label, path }: { label: string; path?: string }) {
  if (path) {
    return (
      <div className="print-photo-box">
        <img alt={label} src={path} />
      </div>
    )
  }
  return (
    <div className="print-photo-box">
      <span>{label}</span>
    </div>
  )
}

export function AdmissionFormPrint({ data }: { data: AdmissionFormData }) {
  const student = data.student
  const father = data.father
  const mother = data.mother
  const primaryGuardian = data.primaryGuardian
  const admissionDetails = data.admissionDetails
  const officeUse = data.officeUse
  const settings = data.schoolSettings
  const template = data.templateSettings
  const blank = data.mode === 'Blank'
  const documents =
    data.admissionDocuments.length > 0
      ? data.admissionDocuments
      : [
          'Birth certificate',
          'Child Aadhaar card',
          'Previous school Transfer Certificate',
          'Previous report card',
          'Passport photographs',
          'Address proof',
          'Other document',
        ].map((documentType) => ({
          documentType,
          receivedStatus: 'Pending',
        }))

  return (
    <article className="school-document-print admission-form-print">
      <PrintDocumentHeader
        settings={settings}
        template={template}
        title="ADMISSION FORM"
        subtitle={settings.academicYear}
      />
      <section className="print-document-meta-grid">
        <FieldLine label="Academic Year" value={settings.academicYear} />
        <FieldLine
          label="Application / Form No."
          value={blank ? '' : admissionDetails?.applicationNo}
        />
        <FieldLine label="Admission No." value={student?.admissionNo} />
        <FieldLine label="Admission Date" value={formatDocumentDate(student?.admissionDate ?? '')} />
      </section>

      <section className="admission-child-grid">
        <div className="print-section-block">
          <h2>Child Details</h2>
          <div className="print-field-grid">
            <FieldLine label="Name of child" value={student?.name} wide />
            <FieldLine label="Date of birth" value={formatDocumentDate(student?.dateOfBirth ?? '')} />
            <FieldLine label="Date of birth in words" value={data.dateOfBirthWords} wide />
            <FieldLine label="Age - Years" value={data.ageAtAdmission.years} />
            <FieldLine label="Age - Months" value={data.ageAtAdmission.months} />
            <FieldLine label="Gender" value={student?.gender} />
            <FieldLine label="Aadhaar number" value={student?.aadharNo} />
            <FieldLine label="PEN number" value={admissionDetails?.penNo} />
            <FieldLine label="SR number" value={admissionDetails?.srNo} />
            <FieldLine label="Caste" value={admissionDetails?.caste} />
            <FieldLine label="Category" value={admissionDetails?.category} />
            <FieldLine label="Nationality" value={admissionDetails?.nationality || 'Indian'} />
            <FieldLine label="Religion" value={admissionDetails?.religion} />
            <FieldLine label="Blood group" value={student?.bloodGroup} />
            <FieldLine label="Admission required for" value={admissionDetails?.admissionRequiredFor || student?.className} />
            <FieldLine label="Class" value={student?.className} />
            <FieldLine label="Section" value={student?.section} />
            <FieldLine label="Previous school" value={student?.previousSchool} wide />
            <FieldLine label="Previous class" value={admissionDetails?.previousClass} />
          </div>
        </div>
        <PhotoBox label="Child photograph" path={admissionDetails?.childPhotoPath} />
      </section>

      <section className="print-section-block">
        <h2>Parent / Guardian Details</h2>
        <div className="admission-parent-grid">
          <div>
            <PhotoBox label="Father photo" path={admissionDetails?.fatherPhotoPath} />
            <FieldLine label="Father name" value={student?.fatherName || father?.guardianName} />
            <FieldLine label="Qualification" value={father?.guardianFullName ? father?.relation : ''} />
            <FieldLine label="Occupation" value={father?.occupation} />
            <FieldLine label="Contact number" value={father?.mobile || student?.mobile} />
            <FieldLine label="WhatsApp number" value={father?.mobile || student?.mobile} />
            <FieldLine label="Email" value={father?.email || student?.email} />
          </div>
          <div>
            <PhotoBox label="Mother photo" path={admissionDetails?.motherPhotoPath} />
            <FieldLine label="Mother name" value={student?.motherName || mother?.guardianName} />
            <FieldLine label="Qualification" value="" />
            <FieldLine label="Occupation" value={mother?.occupation} />
            <FieldLine label="Contact number" value={mother?.mobile} />
            <FieldLine label="WhatsApp number" value={mother?.mobile} />
            <FieldLine label="Email" value={mother?.email} />
          </div>
          <div>
            <FieldLine label="Guardian name" value={primaryGuardian?.guardianName || student?.guardianName} />
            <FieldLine label="Relationship" value={primaryGuardian?.relationToStudent} />
            <FieldLine label="Contact number" value={primaryGuardian?.mobile || student?.mobile} />
            <FieldLine label="Emergency contact" value={primaryGuardian?.emergencyContactMobile || student?.mobile} />
            <FieldLine label="Pickup authorized" value={primaryGuardian?.pickupAuthorized ? 'Yes' : ''} />
          </div>
        </div>
      </section>

      <section className="print-section-block">
        <h2>Address and Contact</h2>
        <div className="print-field-grid">
          <FieldLine label="Residential address" value={student?.address} wide />
          <FieldLine label="City / district" value={[admissionDetails?.city, admissionDetails?.district].filter(Boolean).join(' / ')} />
          <FieldLine label="State / PIN" value={[admissionDetails?.state, admissionDetails?.pinCode].filter(Boolean).join(' / ')} />
          <FieldLine label="Distance from school" value={admissionDetails?.distanceFromSchool} />
          <FieldLine label="Emergency contact number" value={admissionDetails?.emergencyContactNumber || primaryGuardian?.emergencyContactMobile || student?.mobile} />
          <FieldLine label="Preferred phone for school SMS" value={admissionDetails?.preferredSmsNumber || student?.mobile} />
          <FieldLine label="Transport required" value={admissionDetails?.transportRequired ? 'Yes' : ''} />
          <FieldLine label="Pickup point" value={admissionDetails?.pickupPoint} />
        </div>
      </section>

      <section className="print-section-block">
        <h2>Documents Checklist</h2>
        <div className="document-checklist">
          {documents.map((documentItem) => (
            <span key={documentItem.documentType}>
              <i />
              {documentItem.documentType}
              {documentItem.receivedStatus ? ` · ${documentItem.receivedStatus}` : ''}
            </span>
          ))}
        </div>
      </section>

      <section className="print-declaration">
        <p>
          I declare that the information provided above is true to the best of
              my knowledge and that I will follow the school rules and regulations.
              {admissionDetails?.declarationAcceptedBy
                ? ` Accepted by ${admissionDetails.declarationAcceptedBy}.`
                : ''}
        </p>
      </section>

      <footer className="print-signature-grid print-signature-grid--four">
        <div><span />Father / Guardian</div>
        <div><span />Mother</div>
        <div><span />Admission Officer</div>
        <div>
          <SignatureImage path={template.principalSignaturePath} label="Principal signature" />
          {template.principalName || 'Principal'}
        </div>
      </footer>
      <section className="print-section-block office-use">
        <h2>Office Use</h2>
        <div className="print-field-grid">
          <FieldLine label="Admission approved by" value={officeUse?.approvedBy} />
          <FieldLine label="Approval date" value={formatDocumentDate(officeUse?.approvalDate ?? '')} />
          <FieldLine label="Fee receipt no." value={officeUse?.feeReceiptNo} />
          <FieldLine label="Student ID issued" value={officeUse?.studentIdIssued ? 'Yes' : ''} />
          <FieldLine label="Admission officer" value={officeUse?.admissionOfficer} />
          <FieldLine label="Principal approval" value={officeUse?.principalApproval} />
          <FieldLine label="Remarks" value={officeUse?.remarks} wide />
        </div>
      </section>
    </article>
  )
}

export function TransferCertificatePrint({
  certificate,
  settings,
  template,
  reprint = false,
}: {
  certificate: TransferCertificate | TransferCertificatePreview
  settings: SchoolSettings
  template: DocumentTemplateSettings
  reprint?: boolean
}) {
  const rows = [
    ['1. Name of pupil', certificate.studentName],
    ["2. Father's / Guardian's name", certificate.fatherGuardianName],
    ["3. Mother's name", certificate.motherName],
    ['4. Nationality', certificate.nationality],
    ['5. Caste / category', certificate.casteCategory],
    ['6. Date of admission in school', formatDocumentDate(certificate.dateOfAdmission ?? '')],
    ['7. Class at the time of admission', certificate.admissionClass],
    ['8. Date of birth according to admission register', formatDocumentDate(certificate.dateOfBirth ?? '')],
    ['Date of birth in words', certificate.dateOfBirthWords],
    ['9. Class in which pupil last studied', certificate.lastClassStudied],
    ['10. Whether qualified for promotion', certificate.promotionQualified],
    ['11. Class promoted to', certificate.promotedToClass],
    ['12. School dues paid up to', certificate.duesPaidUpto],
    ['13. General conduct', certificate.generalConduct],
    ['14. Date of issue', formatDocumentDate(certificate.issueDate ?? '')],
    ['15. Reason for leaving school', certificate.reasonForLeaving],
    ['16. Additional remarks', certificate.remarks],
  ]

  return (
    <article className="school-document-print transfer-certificate-print">
      {(reprint || ('reprintCount' in certificate && Number(certificate.reprintCount) > 0)) && (
        <div className="document-watermark">DUPLICATE COPY</div>
      )}
      {'status' in certificate && certificate.status === 'Cancelled' && (
        <div className="document-watermark document-watermark--danger">CANCELLED</div>
      )}
      <PrintDocumentHeader
        settings={settings}
        template={template}
        title="TRANSFER CERTIFICATE"
        subtitle={settings.academicYear}
      />
      <section className="print-document-meta-grid">
        <FieldLine label="Certificate No." value={certificate.certificateNumber} />
        <FieldLine label="Serial No." value={certificate.serialNumber} />
        <FieldLine label="SR No." value={certificate.srNumber} />
        <FieldLine label="PEN No." value={certificate.penNumber} />
        <FieldLine label="Issue Date" value={formatDocumentDate(certificate.issueDate ?? '')} />
      </section>
      <table className="transfer-certificate-table">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <th>{label}</th>
              <td>{displayValue(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer className="print-signature-grid">
        <div><span />Prepared By</div>
        <div><span />Checked By</div>
        <div>
          <SignatureImage path={template.principalSignaturePath} label="Principal signature" />
          {template.principalName || 'Principal'}
        </div>
        <div>
          <SignatureImage path={template.schoolStampPath} label="School stamp" />
          School Stamp
        </div>
      </footer>
      {template.footerText && <p className="print-footer-note">{template.footerText}</p>}
    </article>
  )
}

export function FeeReceiptPrint({
  data,
  copyLabel,
  duplicate = false,
}: {
  data: FeeReceiptPrintData
  copyLabel?: string
  duplicate?: boolean
}) {
  const { payment, schoolSettings, templateSettings, student, rows, totals } = data
  const amountWords = data.amountInWords || amountToWords(payment.amount)
  return (
    <article className="school-document-print fee-receipt-print">
      {(duplicate || data.isReversed) && (
        <div className={`document-watermark${data.isReversed ? ' document-watermark--danger' : ''}`}>
          {data.isReversed ? data.reversedLabel : 'DUPLICATE COPY'}
        </div>
      )}
      {copyLabel && <div className="receipt-copy-label">{copyLabel}</div>}
      <PrintDocumentHeader
        settings={schoolSettings}
        template={templateSettings}
        title="FEE RECEIPT"
        subtitle={schoolSettings.academicYear}
      />
      <section className="print-document-meta-grid">
        <FieldLine label="Receipt No." value={payment.receiptNo} />
        <FieldLine label="Date" value={formatDocumentDate(payment.paymentDate)} />
        <FieldLine label="Payment Mode" value={payment.paymentMode} />
        <FieldLine label="Collected By" value={payment.cashierName || 'Administrator'} />
      </section>
      <section className="print-section-block">
        <h2>Student Information</h2>
        <div className="print-field-grid">
          <FieldLine label="Student name" value={payment.studentName} />
          <FieldLine label="Admission no." value={payment.admissionNo} />
          <FieldLine label="Class" value={payment.className || student?.className} />
          <FieldLine label="Section" value={payment.section || student?.section} />
          <FieldLine label="Academic session" value={student?.academicSessionName || schoolSettings.academicYear} />
          <FieldLine label="Fee period" value={rows[0]?.period} />
        </div>
      </section>
      <table className="fee-receipt-table">
        <thead>
          <tr>
            <th>S.No.</th>
            <th>Particulars</th>
            <th>Period</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.serialNo}-${row.particulars}-${row.invoiceNo}`}>
              <td>{row.serialNo}</td>
              <td>
                <strong>{row.particulars}</strong>
                {row.invoiceNo && <span>Invoice: {row.invoiceNo}</span>}
              </td>
              <td>{row.period}</td>
              <td>{formatCurrency(row.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <section className="receipt-total-grid">
        <FieldLine label="Gross amount" value={formatCurrency(totals.grossAmount)} />
        <FieldLine label="Discount / concession" value={formatCurrency(totals.discountAmount)} />
        <FieldLine label="Late fee" value={formatCurrency(totals.lateFee)} />
        <FieldLine label="Previous balance" value={formatCurrency(totals.previousBalance)} />
        <FieldLine label="Amount paid" value={formatCurrency(totals.amountPaid)} />
        <FieldLine label="Remaining balance" value={formatCurrency(totals.remainingBalance)} />
        <FieldLine label="Amount in words" value={amountWords} wide />
      </section>
      <section className="print-section-block">
        <h2>Payment Details</h2>
        <div className="print-field-grid">
          <FieldLine label="Reference / remarks" value={payment.notes} wide />
          <FieldLine label="Receipt status" value={data.isReversed ? data.reversedLabel : payment.status} />
          <FieldLine label="Reversal reason" value={payment.reversalReason} />
        </div>
      </section>
      <footer className="print-signature-grid">
        <div><span />Cashier / Authorized Signature</div>
        <div>
          <SignatureImage path={templateSettings.schoolStampPath} label="School stamp" />
          School Stamp
        </div>
      </footer>
      <p className="print-footer-note">
        {templateSettings.feeReceiptTerms ||
          'Fees once paid are not refundable or transferable.'}
      </p>
    </article>
  )
}
