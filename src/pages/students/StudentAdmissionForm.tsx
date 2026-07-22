import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { AdmissionFormPrint } from '../../components/PrintableSchoolDocuments'
import { Icon } from '../../components/Icon'
import { getErpApi, getErrorMessage } from '../../lib/erpApi'
import {
  formatDocumentDate,
  getTodayInputValue,
} from '../../lib/documentPrint'
import type {
  AdmissionDocumentReceivedStatus,
  AdmissionDocumentRequirementStatus,
  AdmissionFormData,
  ClassItem,
  CreateStudentInput,
  Family,
  FeeStructure,
  GuardianRelation,
  SectionItem,
  Student,
  StudentAdmissionDetails,
  StudentAdmissionDocument,
  StudentAdmissionGuardianInput,
  StudentAdmissionOfficeUse,
  StudentAdmissionProfile,
  StudentAdmissionSaveInput,
} from '../../types'

const admissionSteps = [
  'Admission Details',
  'Child Details',
  'Father Details',
  'Mother Details',
  'Guardian Details',
  'Address & Contact',
  'Previous School',
  'Documents Checklist',
  'Office Use',
  'Review & Save',
] as const

const admissionDocumentTypes = [
  'Birth certificate',
  'Child Aadhaar card',
  'Parent Aadhaar/identity',
  'Previous school Transfer Certificate',
  'Previous report card',
  'Passport photographs',
  'Address proof',
  'Caste/category certificate',
  'Medical certificate',
  'Other document',
]

type AdmissionStep = (typeof admissionSteps)[number]

interface StudentAdmissionFormProps {
  classes: ClassItem[]
  editingStudent?: Student | null
  families: Family[]
  onClose: () => void
  onOpenDocuments?: (view: 'admission-letter' | 'id-cards') => void
  onOpenFees?: (view: 'generate-invoice') => void
  onSaved: (profile: StudentAdmissionProfile) => Promise<void> | void
  sections: SectionItem[]
}

type StudentFormState = Partial<CreateStudentInput> & {
  name: string
  className: string
}

const emptyStudentForm: StudentFormState = {
  admissionNo: '',
  name: '',
  className: '',
  section: '',
  guardianName: '',
  mobile: '',
  fatherName: '',
  motherName: '',
  email: '',
  gender: '',
  bloodGroup: '',
  aadharNo: '',
  previousSchool: '',
  notes: '',
  status: 'Draft',
  address: '',
  dateOfBirth: '',
  admissionDate: getTodayInputValue(),
}

const emptyDetails: Partial<StudentAdmissionDetails> = {
  applicationNo: '',
  academicSessionId: '',
  academicSessionName: '',
  admissionRequiredFor: '',
  rollNo: '',
  admissionType: '',
  feeStructureId: '',
  feeStructureName: '',
  transportRequired: false,
  pickupPoint: '',
  routeName: '',
  childPhotoPath: '',
  fatherPhotoPath: '',
  motherPhotoPath: '',
  guardianPhotoPath: '',
  firstName: '',
  middleName: '',
  lastName: '',
  penNo: '',
  srNo: '',
  caste: '',
  category: '',
  nationality: 'Indian',
  religion: '',
  motherTongue: '',
  identificationMarks: '',
  medicalNotes: '',
  previousClass: '',
  previousBoard: '',
  previousSchoolAddress: '',
  previousTcNumber: '',
  previousTcDate: '',
  previousResultStatus: '',
  reasonForLeavingPreviousSchool: '',
  locality: '',
  city: '',
  district: '',
  state: '',
  pinCode: '',
  distanceFromSchool: '',
  emergencyContactNumber: '',
  preferredSmsNumber: '',
  preferredWhatsappNumber: '',
  sameAsGuardianAddress: false,
  guardianDifferentFromParents: false,
  primaryGuardianRole: 'Father',
  feeContactRole: 'Father',
  smsContactRole: 'Father',
  emergencyContactRole: 'Father',
  pickupAuthorizedRole: 'Father',
  declarationAccepted: false,
  declarationAcceptedDate: '',
  declarationAcceptedBy: '',
  schoolRulesAccepted: false,
  communicationConsent: false,
  emergencyConsent: false,
  photoConsent: false,
}

const defaultDocuments = (): Array<Partial<StudentAdmissionDocument>> =>
  admissionDocumentTypes.map((documentType) => ({
    documentType,
    requirementStatus: documentType === 'Other document' ? 'Optional' : 'Required',
    receivedStatus: 'Pending',
    filePath: '',
    notes: '',
    receivedAt: '',
    verifiedBy: '',
  }))

const emptyOfficeUse: Partial<StudentAdmissionOfficeUse> = {
  approvedBy: '',
  approvalDate: '',
  feePaymentId: '',
  feeReceiptNo: '',
  studentIdIssued: false,
  studentIdIssueDate: '',
  admissionOfficer: '',
  principalApproval: '',
  remarks: '',
}

const blankGuardian = (
  relation: GuardianRelation,
): StudentAdmissionGuardianInput => ({
  relation,
  fullName: '',
  mobile: '',
  whatsappNumber: '',
  email: '',
  occupation: '',
  employerOrganization: '',
  qualification: '',
  annualIncome: null,
  address: '',
  isPrimary: relation === 'Father',
  financialResponsibility: relation === 'Father' || relation === 'Guardian',
  smsContact: relation === 'Father',
  emergencyContact: relation === 'Guardian',
  pickupAuthorized: true,
  livesWithStudent: true,
})

const splitName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  return {
    firstName: parts[0] ?? '',
    middleName: parts.length > 2 ? parts.slice(1, -1).join(' ') : '',
    lastName: parts.length > 1 ? parts[parts.length - 1] : '',
  }
}

const calculateAgeAtAdmission = (dateOfBirth?: string, admissionDate?: string) => {
  if (!dateOfBirth || !admissionDate) return ''
  const dob = new Date(`${dateOfBirth.slice(0, 10)}T00:00:00`)
  const admission = new Date(`${admissionDate.slice(0, 10)}T00:00:00`)
  if (
    Number.isNaN(dob.getTime()) ||
    Number.isNaN(admission.getTime()) ||
    admission < dob
  ) {
    return ''
  }
  let years = admission.getFullYear() - dob.getFullYear()
  let months = admission.getMonth() - dob.getMonth()
  if (admission.getDate() < dob.getDate()) months -= 1
  if (months < 0) {
    years -= 1
    months += 12
  }
  return `${years} years ${months} months`
}

const dateToWords = (value?: string) => {
  if (!value) return ''
  const text = formatDocumentDate(value)
  return text ? text.replaceAll(',', '') : ''
}

export function StudentAdmissionForm({
  classes,
  editingStudent,
  families,
  onClose,
  onOpenDocuments,
  onOpenFees,
  onSaved,
  sections,
}: StudentAdmissionFormProps) {
  const [activeStep, setActiveStep] = useState<AdmissionStep>('Admission Details')
  const [student, setStudent] = useState<StudentFormState>(emptyStudentForm)
  const [details, setDetails] =
    useState<Partial<StudentAdmissionDetails>>(emptyDetails)
  const [familyId, setFamilyId] = useState('')
  const [createNewFamily, setCreateNewFamily] = useState(false)
  const [father, setFather] = useState<StudentAdmissionGuardianInput>(
    blankGuardian('Father'),
  )
  const [mother, setMother] = useState<StudentAdmissionGuardianInput>(
    blankGuardian('Mother'),
  )
  const [guardian, setGuardian] = useState<StudentAdmissionGuardianInput>(
    blankGuardian('Guardian'),
  )
  const [documents, setDocuments] =
    useState<Array<Partial<StudentAdmissionDocument>>>(defaultDocuments)
  const [officeUse, setOfficeUse] =
    useState<Partial<StudentAdmissionOfficeUse>>(emptyOfficeUse)
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [successProfile, setSuccessProfile] =
    useState<StudentAdmissionProfile | null>(null)
  const [printData, setPrintData] = useState<AdmissionFormData | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const activeClasses = useMemo(
    () => classes.filter((item) => item.status === 'Active'),
    [classes],
  )
  const availableSections = useMemo(
    () =>
      sections.filter(
        (section) =>
          section.status === 'Active' && section.className === student.className,
      ),
    [sections, student.className],
  )
  const selectedFeeStructure = feeStructures.find(
    (structure) => structure.id === details.feeStructureId,
  )
  const ageDisplay = calculateAgeAtAdmission(
    student.dateOfBirth,
    student.admissionDate,
  )

  useEffect(() => {
    let isCurrent = true
    void (async () => {
      await Promise.resolve()
      if (!isCurrent) return
      setIsLoading(true)
      try {
        const [settings, feeStructureRows] = await Promise.all([
          getErpApi().getSchoolSettings(),
          getErpApi().getFeeStructures(),
        ])
        if (!isCurrent) return
        setFeeStructures(feeStructureRows)
        if (editingStudent) {
          const profile = await getErpApi().getStudentAdmissionProfile(
            editingStudent.id,
          )
          if (!isCurrent || !profile) return
          // eslint-disable-next-line react-hooks/immutability
          loadProfile(profile)
        } else {
          const firstClass = activeClasses[0]
          const firstSection = sections.find(
            (section) =>
              section.status === 'Active' && section.classId === firstClass?.id,
          )
          const numbers = await getErpApi().getNextStudentAdmissionNumbers()
          if (!isCurrent) return
          setStudent({
            ...emptyStudentForm,
            admissionNo: numbers.admissionNo,
            className: firstClass?.name ?? '',
            section: firstSection?.name ?? '',
          })
          setDetails({
            ...emptyDetails,
            applicationNo: numbers.applicationNo,
            academicSessionName: settings.academicYear,
            admissionRequiredFor: firstClass?.name ?? '',
            srNo: numbers.admissionNo,
          })
        }
        setError('')
      } catch (loadError) {
        if (isCurrent) setError(getErrorMessage(loadError))
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    })()
    return () => {
      isCurrent = false
    }
  }, [activeClasses, editingStudent, sections])

  function loadProfile(profile: StudentAdmissionProfile) {
    const profileStudent = profile.student
    const fatherLink = profile.guardians.find(
      (link) => link.relationToStudent === 'Father' || link.relation === 'Father',
    )
    const motherLink = profile.guardians.find(
      (link) => link.relationToStudent === 'Mother' || link.relation === 'Mother',
    )
    const guardianLink = profile.guardians.find(
      (link) =>
        !['Father', 'Mother'].includes(link.relationToStudent || link.relation),
    )
    const names = splitName(profileStudent.name)
    setStudent({
      admissionNo: profileStudent.admissionNo,
      name: profileStudent.name,
      className: profileStudent.className,
      section: profileStudent.section,
      guardianName: profileStudent.guardianName,
      mobile: profileStudent.mobile,
      fatherName: profileStudent.fatherName,
      motherName: profileStudent.motherName,
      email: profileStudent.email,
      gender: profileStudent.gender,
      bloodGroup: profileStudent.bloodGroup,
      aadharNo: profileStudent.aadharNo,
      previousSchool: profileStudent.previousSchool,
      notes: profileStudent.notes,
      status: profileStudent.status,
      address: profileStudent.address,
      dateOfBirth: profileStudent.dateOfBirth,
      admissionDate: profileStudent.admissionDate,
    })
    setDetails({
      ...emptyDetails,
      ...profile.admissionDetails,
      firstName: profile.admissionDetails?.firstName || names.firstName,
      middleName: profile.admissionDetails?.middleName || names.middleName,
      lastName: profile.admissionDetails?.lastName || names.lastName,
    })
    setFamilyId(profile.family?.id ?? fatherLink?.familyId ?? '')
    setCreateNewFamily(false)
    setFather(
      fatherLink
        ? {
            guardianId: fatherLink.guardianId,
            relation: 'Father',
            fullName: fatherLink.guardianFullName,
            mobile: fatherLink.mobile,
            whatsappNumber: fatherLink.alternateMobile,
            email: fatherLink.email,
            occupation: fatherLink.occupation,
            employerOrganization: fatherLink.employerOrganization,
            qualification: fatherLink.qualification,
            annualIncome: null,
            address: fatherLink.address,
            isPrimary: fatherLink.isPrimary,
            financialResponsibility: fatherLink.financialResponsibility,
            smsContact: false,
            emergencyContact: fatherLink.guardianEmergencyContact,
            pickupAuthorized: fatherLink.pickupAuthorized,
            livesWithStudent: fatherLink.livesWithStudent,
          }
        : {
            ...blankGuardian('Father'),
            fullName: profileStudent.fatherName,
            mobile: profileStudent.mobile,
            email: profileStudent.email,
            address: profileStudent.address,
          },
    )
    setMother(
      motherLink
        ? {
            guardianId: motherLink.guardianId,
            relation: 'Mother',
            fullName: motherLink.guardianFullName,
            mobile: motherLink.mobile,
            whatsappNumber: motherLink.alternateMobile,
            email: motherLink.email,
            occupation: motherLink.occupation,
            employerOrganization: motherLink.employerOrganization,
            qualification: motherLink.qualification,
            annualIncome: null,
            address: motherLink.address,
            isPrimary: motherLink.isPrimary,
            financialResponsibility: motherLink.financialResponsibility,
            smsContact: false,
            emergencyContact: motherLink.guardianEmergencyContact,
            pickupAuthorized: motherLink.pickupAuthorized,
            livesWithStudent: motherLink.livesWithStudent,
          }
        : { ...blankGuardian('Mother'), fullName: profileStudent.motherName },
    )
    setGuardian(
      guardianLink
        ? {
            guardianId: guardianLink.guardianId,
            relation: (guardianLink.relationToStudent || 'Guardian') as GuardianRelation,
            fullName: guardianLink.guardianFullName,
            mobile: guardianLink.mobile,
            whatsappNumber: guardianLink.alternateMobile,
            email: guardianLink.email,
            occupation: guardianLink.occupation,
            employerOrganization: guardianLink.employerOrganization,
            qualification: guardianLink.qualification,
            annualIncome: null,
            address: guardianLink.address,
            isPrimary: guardianLink.isPrimary,
            financialResponsibility: guardianLink.financialResponsibility,
            smsContact: false,
            emergencyContact: guardianLink.guardianEmergencyContact,
            pickupAuthorized: guardianLink.pickupAuthorized,
            livesWithStudent: guardianLink.livesWithStudent,
          }
        : { ...blankGuardian('Guardian'), fullName: profileStudent.guardianName },
    )
    setDocuments(
      profile.documents.length > 0
        ? profile.documents
        : defaultDocuments(),
    )
    setOfficeUse(profile.officeUse ?? emptyOfficeUse)
  }

  const updateStudent = (patch: Partial<StudentFormState>) => {
    setStudent((current) => ({ ...current, ...patch }))
    setIsDirty(true)
  }

  const updateDetails = (patch: Partial<StudentAdmissionDetails>) => {
    setDetails((current) => ({ ...current, ...patch }))
    setIsDirty(true)
  }

  const updateOfficeUse = (patch: Partial<StudentAdmissionOfficeUse>) => {
    setOfficeUse((current) => ({ ...current, ...patch }))
    setIsDirty(true)
  }

  const closeWithWarning = () => {
    if (
      isDirty &&
      !successProfile &&
      !window.confirm('Close admission form without saving changes?')
    ) {
      return
    }
    onClose()
  }

  const validateCurrentStep = (step = activeStep) => {
    const messages: string[] = []
    if (step === 'Admission Details') {
      if (!student.admissionNo?.trim()) messages.push('Admission number is required.')
      if (!details.applicationNo?.trim()) messages.push('Application/Form number is required.')
      if (!student.className?.trim()) messages.push('Class is required.')
      if (!student.admissionDate?.trim()) messages.push('Admission date is required.')
    }
    if (step === 'Child Details') {
      if (!student.name.trim()) messages.push('Student full name is required.')
      if (
        student.aadharNo?.trim() &&
        !/^\d{12}$/.test(student.aadharNo.replace(/\s+/g, ''))
      ) {
        messages.push('Aadhaar number must contain 12 digits.')
      }
      if (
        details.penNo?.trim() &&
        !/^[A-Za-z0-9/-]{4,30}$/.test(details.penNo)
      ) {
        messages.push('PEN number format is invalid.')
      }
    }
    if (messages.length > 0) {
      setError(messages.join(' '))
      return false
    }
    setError('')
    return true
  }

  const goNext = () => {
    if (!validateCurrentStep()) return
    const currentIndex = admissionSteps.indexOf(activeStep)
    setActiveStep(admissionSteps[Math.min(currentIndex + 1, admissionSteps.length - 1)])
  }

  const goBack = () => {
    const currentIndex = admissionSteps.indexOf(activeStep)
    setActiveStep(admissionSteps[Math.max(currentIndex - 1, 0)])
  }

  const saveAdmission = async (mode: 'Draft' | 'Admit' | 'Update') => {
    if (mode !== 'Draft') {
      const allValid = admissionSteps
        .filter((step) => step !== 'Review & Save')
        .every((step) => validateCurrentStep(step))
      if (!allValid) return
    }
    setIsSaving(true)
    try {
      const saved = await getErpApi().saveStudentAdmission({
        studentId: editingStudent?.id,
        mode: editingStudent ? 'Update' : mode,
        student: {
          ...student,
          status:
            mode === 'Draft'
              ? 'Draft'
              : mode === 'Admit'
                ? 'Active'
                : student.status,
        } as CreateStudentInput,
        admissionDetails: {
          ...details,
          admissionRequiredFor: details.admissionRequiredFor || student.className,
          feeStructureName: selectedFeeStructure
            ? `${selectedFeeStructure.feeHeadName} · ${selectedFeeStructure.academicYear}`
            : details.feeStructureName,
        },
        family: {
          familyId,
          createNew: createNewFamily,
          familyName: `${student.name} Family`,
        },
        guardians: {
          father,
          mother,
          guardian: details.guardianDifferentFromParents ? guardian : undefined,
        },
        documents,
        officeUse,
      } satisfies StudentAdmissionSaveInput)
      setSuccessProfile(saved)
      setIsDirty(false)
      await onSaved(saved)
    } catch (saveError) {
      setError(getErrorMessage(saveError))
    } finally {
      setIsSaving(false)
    }
  }

  const printAdmissionForm = async () => {
    if (!successProfile) return
    try {
      const nextPrintData = await getErpApi().getAdmissionFormData({
        mode: 'Prefilled',
        studentId: successProfile.student.id,
        formDate: getTodayInputValue(),
      })
      setPrintData(nextPrintData)
      window.setTimeout(() => window.print(), 80)
    } catch (printError) {
      setError(getErrorMessage(printError))
    }
  }

  const issueSnapshot = async () => {
    if (!successProfile) return
    try {
      const snapshot = await getErpApi().saveAdmissionFormSnapshot({
        mode: 'Prefilled',
        studentId: successProfile.student.id,
        formDate: getTodayInputValue(),
      })
      setError('')
      window.alert(`${snapshot.snapshotNo} was saved.`)
    } catch (snapshotError) {
      setError(getErrorMessage(snapshotError))
    }
  }

  const renderTextInput = (
    label: string,
    value: string | undefined,
    onChange: (value: string) => void,
    options: { required?: boolean; type?: string; placeholder?: string } = {},
  ) => (
    <label className="form-field">
      <span>{label}{options.required ? ' *' : ''}</span>
      <input
        onChange={(event) => onChange(event.target.value)}
        placeholder={options.placeholder}
        required={options.required}
        type={options.type ?? 'text'}
        value={value ?? ''}
      />
    </label>
  )

  const renderGuardianFields = (
    title: string,
    value: StudentAdmissionGuardianInput,
    setValue: (value: StudentAdmissionGuardianInput) => void,
    photoPath: string | undefined,
    setPhotoPath: (value: string) => void,
  ) => (
    <section className="admission-step-card">
      <h3>{title}</h3>
      <div className="admission-form-grid">
        {renderTextInput(`${title} name`, value.fullName, (next) =>
          setValue({ ...value, fullName: next }),
        )}
        {renderTextInput('Educational qualification', value.qualification, (next) =>
          setValue({ ...value, qualification: next }),
        )}
        {renderTextInput('Occupation / profession', value.occupation, (next) =>
          setValue({ ...value, occupation: next }),
        )}
        {renderTextInput('Employer / organization', value.employerOrganization, (next) =>
          setValue({ ...value, employerOrganization: next }),
        )}
        {renderTextInput(`${title} photo path`, photoPath, setPhotoPath, {
          placeholder: `${title.toLowerCase()}-photos/name.jpg`,
        })}
        {renderTextInput('Residential address', value.address, (next) =>
          setValue({ ...value, address: next }),
        )}
        {renderTextInput('Contact number', value.mobile, (next) =>
          setValue({ ...value, mobile: next }),
          { type: 'tel' },
        )}
        {renderTextInput('WhatsApp number', value.whatsappNumber, (next) =>
          setValue({ ...value, whatsappNumber: next }),
          { type: 'tel' },
        )}
        {renderTextInput('Email', value.email, (next) =>
          setValue({ ...value, email: next }),
          { type: 'email' },
        )}
        {renderTextInput(
          'Annual income',
          value.annualIncome === null || value.annualIncome === undefined
            ? ''
            : String(value.annualIncome),
          (next) =>
            setValue({
              ...value,
              annualIncome: next ? Number(next) : null,
            }),
          { type: 'number' },
        )}
      </div>
      <div className="admission-checkbox-grid">
        {[
          ['Primary guardian', 'isPrimary'],
          ['Fee contact', 'financialResponsibility'],
          ['SMS contact', 'smsContact'],
          ['Emergency contact', 'emergencyContact'],
          ['Pickup authorized', 'pickupAuthorized'],
          ['Lives with student', 'livesWithStudent'],
        ].map(([label, key]) => (
          <label className="form-checkbox-row" key={key}>
            <input
              checked={Boolean(value[key as keyof StudentAdmissionGuardianInput])}
              onChange={(event) =>
                setValue({ ...value, [key]: event.target.checked })
              }
              type="checkbox"
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </section>
  )

  const renderStep = () => {
    switch (activeStep) {
      case 'Admission Details':
        return (
          <section className="admission-step-card">
            <h3>Admission Details</h3>
            <div className="admission-form-grid">
              {renderTextInput('Application / Form number', details.applicationNo, (value) =>
                updateDetails({ applicationNo: value }),
                { required: true },
              )}
              {renderTextInput('Admission number', student.admissionNo, (value) =>
                updateStudent({ admissionNo: value }),
                { required: true },
              )}
              {renderTextInput('Admission date', student.admissionDate, (value) =>
                updateStudent({ admissionDate: value }),
                { required: true, type: 'date' },
              )}
              <label className="form-field">
                <span>Class *</span>
                <select
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
                    updateStudent({
                      className,
                      section: firstSection?.name ?? '',
                    })
                    updateDetails({ admissionRequiredFor: className })
                  }}
                  required
                  value={student.className}
                >
                  {activeClasses.length === 0 && <option value="">No classes configured</option>}
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
                  onChange={(event) => updateStudent({ section: event.target.value })}
                  value={student.section ?? ''}
                >
                  <option value="">No section</option>
                  {availableSections.map((section) => (
                    <option key={section.id} value={section.name}>
                      Section {section.name}
                    </option>
                  ))}
                </select>
              </label>
              {renderTextInput('Roll number', details.rollNo, (value) =>
                updateDetails({ rollNo: value }),
              )}
              {renderTextInput('Admission required for', details.admissionRequiredFor, (value) =>
                updateDetails({ admissionRequiredFor: value }),
              )}
              {renderTextInput('Admission type', details.admissionType, (value) =>
                updateDetails({ admissionType: value }),
                { placeholder: 'New / Transfer / Re-admission' },
              )}
              <label className="form-field">
                <span>Student status</span>
                <select
                  onChange={(event) =>
                    updateStudent({
                      status: event.target.value as CreateStudentInput['status'],
                    })
                  }
                  value={student.status ?? 'Draft'}
                >
                  <option value="Draft">Draft</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </label>
              <label className="form-field">
                <span>Fee structure assignment</span>
                <select
                  onChange={(event) => {
                    const feeStructure = feeStructures.find(
                      (row) => row.id === event.target.value,
                    )
                    updateDetails({
                      feeStructureId: feeStructure?.id ?? '',
                      feeStructureName: feeStructure
                        ? `${feeStructure.feeHeadName} · ${feeStructure.academicYear}`
                        : '',
                    })
                  }}
                  value={details.feeStructureId ?? ''}
                >
                  <option value="">Assign later</option>
                  {feeStructures
                    .filter((row) => row.className === student.className)
                    .map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.feeHeadName} · {row.academicYear}
                      </option>
                    ))}
                </select>
              </label>
              {renderTextInput('Pickup point', details.pickupPoint, (value) =>
                updateDetails({ pickupPoint: value }),
              )}
              <label className="form-checkbox-row">
                <input
                  checked={Boolean(details.transportRequired)}
                  onChange={(event) =>
                    updateDetails({ transportRequired: event.target.checked })
                  }
                  type="checkbox"
                />
                <span>Transport required</span>
              </label>
            </div>
          </section>
        )
      case 'Child Details':
        return (
          <section className="admission-step-card">
            <h3>Child Details</h3>
            <div className="admission-form-grid">
              {renderTextInput('Full name', student.name, (value) => {
                const names = splitName(value)
                updateStudent({ name: value })
                updateDetails(names)
              }, { required: true })}
              {renderTextInput('First name', details.firstName, (value) =>
                updateDetails({ firstName: value }),
              )}
              {renderTextInput('Middle name', details.middleName, (value) =>
                updateDetails({ middleName: value }),
              )}
              {renderTextInput('Last name', details.lastName, (value) =>
                updateDetails({ lastName: value }),
              )}
              {renderTextInput('Child photo path', details.childPhotoPath, (value) =>
                updateDetails({ childPhotoPath: value }),
                { placeholder: 'student-photos/admission-no.jpg' },
              )}
              {renderTextInput('Date of birth', student.dateOfBirth, (value) =>
                updateStudent({ dateOfBirth: value }),
                { type: 'date' },
              )}
              <label className="form-field">
                <span>Date of birth in words</span>
                <input readOnly value={dateToWords(student.dateOfBirth)} />
              </label>
              <label className="form-field">
                <span>Age at admission</span>
                <input readOnly value={ageDisplay} />
              </label>
              {renderTextInput('Gender', student.gender, (value) =>
                updateStudent({ gender: value }),
              )}
              {renderTextInput('Aadhaar number', student.aadharNo, (value) =>
                updateStudent({ aadharNo: value }),
              )}
              {renderTextInput('PEN number', details.penNo, (value) =>
                updateDetails({ penNo: value }),
              )}
              {renderTextInput('SR number', details.srNo, (value) =>
                updateDetails({ srNo: value }),
              )}
              {renderTextInput('Caste', details.caste, (value) =>
                updateDetails({ caste: value }),
              )}
              {renderTextInput('Category', details.category, (value) =>
                updateDetails({ category: value }),
              )}
              {renderTextInput('Nationality', details.nationality, (value) =>
                updateDetails({ nationality: value }),
              )}
              {renderTextInput('Religion', details.religion, (value) =>
                updateDetails({ religion: value }),
              )}
              {renderTextInput('Blood group', student.bloodGroup, (value) =>
                updateStudent({ bloodGroup: value }),
              )}
              {renderTextInput('Mother tongue', details.motherTongue, (value) =>
                updateDetails({ motherTongue: value }),
              )}
              {renderTextInput('Identification marks', details.identificationMarks, (value) =>
                updateDetails({ identificationMarks: value }),
              )}
              {renderTextInput('Medical notes / allergies', details.medicalNotes, (value) =>
                updateDetails({ medicalNotes: value }),
              )}
            </div>
          </section>
        )
      case 'Father Details':
        return renderGuardianFields(
          'Father',
          father,
          (value) => {
            setFather(value)
            updateStudent({
              fatherName: value.fullName,
              guardianName: value.isPrimary ? value.fullName : student.guardianName,
              mobile: value.mobile || student.mobile,
              email: value.email || student.email,
            })
            setIsDirty(true)
          },
          details.fatherPhotoPath,
          (value) => updateDetails({ fatherPhotoPath: value }),
        )
      case 'Mother Details':
        return renderGuardianFields(
          'Mother',
          mother,
          (value) => {
            setMother(value)
            updateStudent({ motherName: value.fullName })
            setIsDirty(true)
          },
          details.motherPhotoPath,
          (value) => updateDetails({ motherPhotoPath: value }),
        )
      case 'Guardian Details':
        return (
          <section className="admission-step-card">
            <h3>Guardian Details</h3>
            <label className="form-checkbox-row">
              <input
                checked={Boolean(details.guardianDifferentFromParents)}
                onChange={(event) =>
                  updateDetails({ guardianDifferentFromParents: event.target.checked })
                }
                type="checkbox"
              />
              <span>Guardian is different from parents</span>
            </label>
            {details.guardianDifferentFromParents &&
              renderGuardianFields(
                'Guardian',
                guardian,
                (value) => {
                  setGuardian(value)
                  updateStudent({
                    guardianName: value.fullName || student.guardianName,
                    mobile: value.mobile || student.mobile,
                  })
                  setIsDirty(true)
                },
                details.guardianPhotoPath,
                (value) => updateDetails({ guardianPhotoPath: value }),
              )}
            <div className="admission-form-grid">
              <label className="form-field">
                <span>Link existing family</span>
                <select
                  value={familyId}
                  onChange={(event) => {
                    setFamilyId(event.target.value)
                    setCreateNewFamily(false)
                    setIsDirty(true)
                  }}
                >
                  <option value="">No existing family</option>
                  {families.map((family) => (
                    <option key={family.id} value={family.id}>
                      {family.familyCode} · {family.familyName || family.primaryContactName || 'Family'}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-checkbox-row">
                <input
                  checked={createNewFamily}
                  onChange={(event) => {
                    setCreateNewFamily(event.target.checked)
                    if (event.target.checked) setFamilyId('')
                    setIsDirty(true)
                  }}
                  type="checkbox"
                />
                <span>Create a new family from admission details</span>
              </label>
            </div>
          </section>
        )
      case 'Address & Contact':
        return (
          <section className="admission-step-card">
            <h3>Address & Contact</h3>
            <div className="admission-form-grid">
              <label className="form-field form-field--full">
                <span>Residential address</span>
                <textarea
                  onChange={(event) => updateStudent({ address: event.target.value })}
                  rows={3}
                  value={student.address ?? ''}
                />
              </label>
              {renderTextInput('Locality', details.locality, (value) =>
                updateDetails({ locality: value }),
              )}
              {renderTextInput('City', details.city, (value) =>
                updateDetails({ city: value }),
              )}
              {renderTextInput('District', details.district, (value) =>
                updateDetails({ district: value }),
              )}
              {renderTextInput('State', details.state, (value) =>
                updateDetails({ state: value }),
              )}
              {renderTextInput('PIN code', details.pinCode, (value) =>
                updateDetails({ pinCode: value }),
              )}
              {renderTextInput('Distance from school', details.distanceFromSchool, (value) =>
                updateDetails({ distanceFromSchool: value }),
              )}
              {renderTextInput('Emergency contact number', details.emergencyContactNumber, (value) =>
                updateDetails({ emergencyContactNumber: value }),
                { type: 'tel' },
              )}
              {renderTextInput('Preferred SMS phone', details.preferredSmsNumber, (value) =>
                updateDetails({ preferredSmsNumber: value }),
                { type: 'tel' },
              )}
              {renderTextInput('Preferred WhatsApp number', details.preferredWhatsappNumber, (value) =>
                updateDetails({ preferredWhatsappNumber: value }),
                { type: 'tel' },
              )}
              {renderTextInput('Transport pickup point', details.pickupPoint, (value) =>
                updateDetails({ pickupPoint: value }),
              )}
            </div>
          </section>
        )
      case 'Previous School':
        return (
          <section className="admission-step-card">
            <h3>Previous School</h3>
            <div className="admission-form-grid">
              {renderTextInput('Previous school name', student.previousSchool, (value) =>
                updateStudent({ previousSchool: value }),
              )}
              {renderTextInput('Previous class', details.previousClass, (value) =>
                updateDetails({ previousClass: value }),
              )}
              {renderTextInput('Previous board', details.previousBoard, (value) =>
                updateDetails({ previousBoard: value }),
              )}
              {renderTextInput('Previous TC number', details.previousTcNumber, (value) =>
                updateDetails({ previousTcNumber: value }),
              )}
              {renderTextInput('Previous TC date', details.previousTcDate, (value) =>
                updateDetails({ previousTcDate: value }),
                { type: 'date' },
              )}
              {renderTextInput('Previous result / status', details.previousResultStatus, (value) =>
                updateDetails({ previousResultStatus: value }),
              )}
              <label className="form-field form-field--full">
                <span>Previous school address</span>
                <textarea
                  onChange={(event) =>
                    updateDetails({ previousSchoolAddress: event.target.value })
                  }
                  rows={2}
                  value={details.previousSchoolAddress ?? ''}
                />
              </label>
              <label className="form-field form-field--full">
                <span>Reason for leaving previous school</span>
                <textarea
                  onChange={(event) =>
                    updateDetails({
                      reasonForLeavingPreviousSchool: event.target.value,
                    })
                  }
                  rows={2}
                  value={details.reasonForLeavingPreviousSchool ?? ''}
                />
              </label>
            </div>
          </section>
        )
      case 'Documents Checklist':
        return (
          <section className="admission-step-card">
            <h3>Documents Checklist</h3>
            <div className="admission-document-table">
              <div className="admission-document-table__header">
                <span>Document</span>
                <span>Required</span>
                <span>Status</span>
                <span>File / Notes</span>
              </div>
              {documents.map((document, index) => (
                <div className="admission-document-row" key={document.documentType ?? index}>
                  <strong>{document.documentType}</strong>
                  <select
                    value={document.requirementStatus ?? 'Optional'}
                    onChange={(event) => {
                      const next = [...documents]
                      next[index] = {
                        ...document,
                        requirementStatus: event.target.value as AdmissionDocumentRequirementStatus,
                      }
                      setDocuments(next)
                      setIsDirty(true)
                    }}
                  >
                    <option value="Required">Required</option>
                    <option value="Optional">Optional</option>
                  </select>
                  <select
                    value={document.receivedStatus ?? 'Pending'}
                    onChange={(event) => {
                      const next = [...documents]
                      next[index] = {
                        ...document,
                        receivedStatus: event.target.value as AdmissionDocumentReceivedStatus,
                      }
                      setDocuments(next)
                      setIsDirty(true)
                    }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Received">Received</option>
                    <option value="Not Applicable">Not Applicable</option>
                  </select>
                  <div>
                    <input
                      onChange={(event) => {
                        const next = [...documents]
                        next[index] = { ...document, filePath: event.target.value }
                        setDocuments(next)
                        setIsDirty(true)
                      }}
                      placeholder="Managed file path"
                      value={document.filePath ?? ''}
                    />
                    <input
                      onChange={(event) => {
                        const next = [...documents]
                        next[index] = { ...document, notes: event.target.value }
                        setDocuments(next)
                        setIsDirty(true)
                      }}
                      placeholder="Notes"
                      value={document.notes ?? ''}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      case 'Office Use':
        return (
          <section className="admission-step-card">
            <h3>Office Use</h3>
            <div className="form-note form-note--warning">
              <Icon name="clock" size={17} />
              Fee receipt number must come from an existing fee payment. Entering a
              receipt here does not create a payment.
            </div>
            <div className="admission-form-grid">
              {renderTextInput('Admission approved by', officeUse.approvedBy, (value) =>
                updateOfficeUse({ approvedBy: value }),
              )}
              {renderTextInput('Approval date', officeUse.approvalDate, (value) =>
                updateOfficeUse({ approvalDate: value }),
                { type: 'date' },
              )}
              {renderTextInput('Fee receipt number', officeUse.feeReceiptNo, (value) =>
                updateOfficeUse({ feeReceiptNo: value }),
              )}
              {renderTextInput('Admission officer', officeUse.admissionOfficer, (value) =>
                updateOfficeUse({ admissionOfficer: value }),
              )}
              {renderTextInput('Principal approval', officeUse.principalApproval, (value) =>
                updateOfficeUse({ principalApproval: value }),
              )}
              {renderTextInput('Student ID issue date', officeUse.studentIdIssueDate, (value) =>
                updateOfficeUse({ studentIdIssueDate: value }),
                { type: 'date' },
              )}
              <label className="form-checkbox-row">
                <input
                  checked={Boolean(officeUse.studentIdIssued)}
                  onChange={(event) =>
                    updateOfficeUse({
                      studentIdIssued: event.target.checked,
                    })
                  }
                  type="checkbox"
                />
                <span>Student ID issued</span>
              </label>
              <label className="form-field form-field--full">
                <span>Office remarks</span>
                <textarea
                  onChange={(event) =>
                    updateOfficeUse({
                      remarks: event.target.value,
                    })
                  }
                  rows={3}
                  value={officeUse.remarks ?? ''}
                />
              </label>
            </div>
          </section>
        )
      case 'Review & Save':
        return (
          <section className="admission-step-card">
            <h3>Review & Save</h3>
            <div className="admission-review-grid">
              <div>
                <span>Student</span>
                <strong>{student.name || 'Not entered'}</strong>
                <small>{student.admissionNo} · Class {student.className}{student.section ? `-${student.section}` : ''}</small>
              </div>
              <div>
                <span>Application</span>
                <strong>{details.applicationNo || 'Not entered'}</strong>
                <small>{formatDocumentDate(student.admissionDate ?? '')}</small>
              </div>
              <div>
                <span>Primary contact</span>
                <strong>{father.fullName || guardian.fullName || student.guardianName || 'Not entered'}</strong>
                <small>{father.mobile || guardian.mobile || student.mobile}</small>
              </div>
              <div>
                <span>Documents</span>
                <strong>{documents.filter((item) => item.receivedStatus === 'Received').length} received</strong>
                <small>{documents.length} checklist items</small>
              </div>
            </div>
            <div className="admission-checkbox-grid">
              {[
                ['Information provided is correct', 'declarationAccepted'],
                ['Parent agrees to school rules', 'schoolRulesAccepted'],
                ['Communication/SMS consent', 'communicationConsent'],
                ['Emergency-contact consent', 'emergencyConsent'],
                ['Photograph/document-use consent', 'photoConsent'],
              ].map(([label, key]) => (
                <label className="form-checkbox-row" key={key}>
                  <input
                    checked={Boolean(details[key as keyof StudentAdmissionDetails])}
                    onChange={(event) =>
                      updateDetails({
                        [key]: event.target.checked,
                        declarationAcceptedDate:
                          key === 'declarationAccepted' && event.target.checked
                            ? getTodayInputValue()
                            : details.declarationAcceptedDate,
                      } as Partial<StudentAdmissionDetails>)
                    }
                    type="checkbox"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            {renderTextInput('Accepted by / parent name', details.declarationAcceptedBy, (value) =>
              updateDetails({ declarationAcceptedBy: value }),
            )}
          </section>
        )
    }
  }

  return (
    <div className="drawer-backdrop" role="presentation" onMouseDown={closeWithWarning}>
      <aside
        aria-labelledby="add-student-title"
        className="form-drawer form-drawer--wide admission-drawer"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="drawer-header">
          <div>
            <h2 id="add-student-title">
              {editingStudent ? 'Edit Student Admission' : 'Add Student Admission'}
            </h2>
            <p>
              Complete admission data is saved once and reused by documents,
              fees and student profile records.
            </p>
          </div>
          <button
            aria-label="Close form"
            className="icon-button"
            onClick={closeWithWarning}
            type="button"
          >
            <Icon name="close" size={19} />
          </button>
        </div>

        {error && (
          <div className="inline-message inline-message--error">
            <Icon name="close" size={17} />
            <span>{error}</span>
            <button aria-label="Dismiss error" onClick={() => setError('')} type="button">
              <Icon name="close" size={15} />
            </button>
          </div>
        )}

        {successProfile ? (
          <section className="admission-success-panel">
            <Icon name="check" size={34} />
            <div>
              <h3>Student admitted successfully</h3>
              <p>
                {successProfile.student.name} · {successProfile.student.admissionNo}
              </p>
            </div>
            <div className="admission-after-save-actions">
              <button className="secondary-button" onClick={closeWithWarning} type="button">
                View Student Profile
              </button>
              <button className="secondary-button" onClick={() => void printAdmissionForm()} type="button">
                <Icon name="print" size={16} />
                Print Admission Form
              </button>
              <button className="secondary-button" onClick={() => void issueSnapshot()} type="button">
                Issue / Save Admission Form Snapshot
              </button>
              <button
                className="secondary-button"
                onClick={() => onOpenDocuments?.('admission-letter')}
                type="button"
              >
                Generate Admission Letter
              </button>
              <button
                className="secondary-button"
                onClick={() => onOpenDocuments?.('id-cards')}
                type="button"
              >
                Print Student ID Card
              </button>
              <button
                className="secondary-button"
                onClick={() => onOpenFees?.('generate-invoice')}
                type="button"
              >
                Generate Initial Fee Invoice
              </button>
              <button
                className="primary-button"
                onClick={() => {
                  void (async () => {
                    try {
                      const firstClass = activeClasses[0]
                      const firstSection = sections.find(
                        (section) =>
                          section.status === 'Active' &&
                          section.classId === firstClass?.id,
                      )
                      const [settings, numbers] = await Promise.all([
                        getErpApi().getSchoolSettings(),
                        getErpApi().getNextStudentAdmissionNumbers(),
                      ])
                      setStudent({
                        ...emptyStudentForm,
                        admissionNo: numbers.admissionNo,
                        className: firstClass?.name ?? '',
                        section: firstSection?.name ?? '',
                      })
                      setDetails({
                        ...emptyDetails,
                        applicationNo: numbers.applicationNo,
                        academicSessionName: settings.academicYear,
                        admissionRequiredFor: firstClass?.name ?? '',
                        srNo: numbers.admissionNo,
                      })
                      setFamilyId('')
                      setCreateNewFamily(false)
                      setFather(blankGuardian('Father'))
                      setMother(blankGuardian('Mother'))
                      setGuardian(blankGuardian('Guardian'))
                      setDocuments(defaultDocuments())
                      setOfficeUse(emptyOfficeUse)
                      setError('')
                      setIsDirty(false)
                    } catch (resetError) {
                      setError(getErrorMessage(resetError))
                    }
                  })()
                  setSuccessProfile(null)
                  setPrintData(null)
                  setActiveStep('Admission Details')
                }}
                type="button"
              >
                Add Another Student
              </button>
            </div>
            {printData && (
              <div className="document-preview-shell document-preview-shell--paper">
                <AdmissionFormPrint data={printData} />
              </div>
            )}
          </section>
        ) : (
          <form className="drawer-form admission-form" onSubmit={(event: FormEvent) => event.preventDefault()}>
            <nav className="admission-stepper" aria-label="Admission form sections">
              {admissionSteps.map((step, index) => (
                <button
                  className={`admission-stepper__item${activeStep === step ? ' admission-stepper__item--active' : ''}`}
                  key={step}
                  onClick={() => setActiveStep(step)}
                  type="button"
                >
                  <span>{index + 1}</span>
                  {step}
                </button>
              ))}
            </nav>
            {isLoading ? (
              <section className="panel document-empty-state">
                <span className="loading-spinner" />
                <h3>Preparing admission workflow...</h3>
              </section>
            ) : (
              renderStep()
            )}
            {editingStudent && (
              <div className="form-note form-note--warning">
                <Icon name="clock" size={17} />
                Previously issued documents retain their saved details. Reissue
                them explicitly when required.
              </div>
            )}
            <div className="drawer-actions admission-drawer-actions">
              <button className="secondary-button" onClick={closeWithWarning} type="button">
                Cancel
              </button>
              <button className="secondary-button" disabled={admissionSteps.indexOf(activeStep) === 0} onClick={goBack} type="button">
                Back
              </button>
              {activeStep !== 'Review & Save' && (
                <button className="secondary-button" onClick={goNext} type="button">
                  Next
                </button>
              )}
              <button
                className="secondary-button"
                disabled={isSaving || isLoading}
                onClick={() => void saveAdmission('Draft')}
                type="button"
              >
                {isSaving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                className="primary-button"
                disabled={isSaving || isLoading}
                onClick={() => void saveAdmission(editingStudent ? 'Update' : 'Admit')}
                type="button"
              >
                {isSaving
                  ? 'Saving...'
                  : editingStudent
                    ? 'Update Student Admission'
                    : 'Admit Student'}
              </button>
            </div>
          </form>
        )}
      </aside>
    </div>
  )
}
