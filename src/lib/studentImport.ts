import type {
  ClassItem,
  SectionItem,
  Student,
  StudentImportOptions,
  StudentImportRow,
  StudentImportTemplate,
} from '../types'

const MAX_IMPORT_FILE_SIZE = 10 * 1024 * 1024
const MAX_IMPORT_ROWS = 5000

const columnAliases = {
  admissionNo: ['Admission No', 'Admission Number', 'Adm No', 'admission_no'],
  name: ['Student Name', 'Name', 'Full Name'],
  className: ['Class', 'Class Name'],
  section: ['Section'],
  guardianName: ['Guardian Name', 'Father Name', 'Parent Name'],
  mobile: ['Mobile', 'Phone', 'Contact No'],
  fatherName: ['Father Name'],
  motherName: ['Mother Name'],
  address: ['Address'],
  dateOfBirth: ['Date of Birth', 'DOB', 'Birth Date'],
  admissionDate: ['Admission Date', 'Date of Admission'],
  status: ['Status'],
  email: ['Email', 'Email Address'],
  gender: ['Gender'],
  bloodGroup: ['Blood Group', 'BloodGroup'],
  aadharNo: ['Aadhar No', 'Aadhaar No', 'Aadhar Number', 'Aadhaar Number'],
  previousSchool: ['Previous School', 'Previous School Name'],
  notes: ['Notes', 'Remarks'],
} as const

const requiredColumnKeys = [
  'admissionNo',
  'name',
  'className',
  'section',
  'guardianName',
  'mobile',
] as const

const requiredColumnLabels: Record<(typeof requiredColumnKeys)[number], string> = {
  admissionNo: 'Admission No',
  name: 'Student Name',
  className: 'Class',
  section: 'Section',
  guardianName: 'Guardian Name',
  mobile: 'Mobile',
}

type ImportColumnKey = keyof typeof columnAliases

export interface StudentImportPreviewRow {
  data: StudentImportRow
  errors: string[]
  warnings: string[]
  duplicate: boolean
  valid: boolean
}

function normalizeHeader(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function cellText(value: unknown) {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) {
    return [
      value.getFullYear(),
      String(value.getMonth() + 1).padStart(2, '0'),
      String(value.getDate()).padStart(2, '0'),
    ].join('-')
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Number.isInteger(value) ? value.toFixed(0) : String(value)
  }
  return String(value).trim()
}

function normalizeDateValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return { value: '', error: '' }
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return { value: cellText(value), error: '' }
  }
  const text = cellText(value)
  const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (isoMatch) {
    const normalized = `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`
    const parsed = new Date(`${normalized}T00:00:00Z`)
    if (
      !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === normalized
    ) {
      return { value: normalized, error: '' }
    }
  }
  const slashMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (slashMatch) {
    const first = Number(slashMatch[1])
    const second = Number(slashMatch[2])
    const day = second > 12 ? second : first
    const month = second > 12 ? first : second
    const normalized = `${slashMatch[3]}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const parsed = new Date(`${normalized}T00:00:00Z`)
    if (
      !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === normalized
    ) {
      return { value: normalized, error: '' }
    }
  }
  return {
    value: text,
    error: `Date "${text}" is invalid. Use YYYY-MM-DD.`,
  }
}

function findColumnIndex(headers: unknown[], key: ImportColumnKey) {
  const normalizedAliases = new Set(columnAliases[key].map(normalizeHeader))
  return headers.findIndex((header) =>
    normalizedAliases.has(normalizeHeader(header)),
  )
}

export async function parseStudentImportFile(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!extension || !['xlsx', 'xls', 'csv'].includes(extension)) {
    throw new Error('Select an .xlsx, .xls or .csv file.')
  }
  if (file.size > MAX_IMPORT_FILE_SIZE) {
    throw new Error('The import file must not exceed 10 MB.')
  }

  const { read, utils } = await import('xlsx')
  const workbook = read(await file.arrayBuffer(), {
    type: 'array',
    cellDates: true,
  })
  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) {
    throw new Error('The workbook does not contain a worksheet.')
  }
  const worksheet = workbook.Sheets[firstSheetName]
  const grid = utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: '',
    raw: true,
    blankrows: false,
  })
  if (grid.length === 0) {
    throw new Error('The selected worksheet is empty.')
  }

  const headers = grid[0]
  const columnIndexes = Object.fromEntries(
    Object.keys(columnAliases).map((key) => [
      key,
      findColumnIndex(headers, key as ImportColumnKey),
    ]),
  ) as Record<ImportColumnKey, number>
  const missingColumns = requiredColumnKeys
    .filter((key) => columnIndexes[key] < 0)
    .map((key) => requiredColumnLabels[key])
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(', ')}.`)
  }

  const rows = grid
    .slice(1)
    .map((cells, index) => {
      const getValue = (key: ImportColumnKey) => {
        const columnIndex = columnIndexes[key]
        return columnIndex >= 0 ? cells[columnIndex] : ''
      }
      const dateOfBirth = normalizeDateValue(getValue('dateOfBirth'))
      const admissionDate = normalizeDateValue(getValue('admissionDate'))
      const guardianName = cellText(getValue('guardianName'))
      const fatherName = cellText(getValue('fatherName'))
      const data: StudentImportRow = {
        rowNumber: index + 2,
        providedFields: Object.entries(columnIndexes)
          .filter(([, columnIndex]) => columnIndex >= 0)
          .map(([key]) => key),
        admissionNo: cellText(getValue('admissionNo')),
        name: cellText(getValue('name')),
        className: cellText(getValue('className')),
        section: cellText(getValue('section')),
        guardianName,
        mobile: cellText(getValue('mobile')),
        fatherName: fatherName || guardianName,
        motherName: cellText(getValue('motherName')),
        address: cellText(getValue('address')),
        dateOfBirth: dateOfBirth.value,
        admissionDate: admissionDate.value,
        status: cellText(getValue('status')) || 'Active',
        email: cellText(getValue('email')),
        gender: cellText(getValue('gender')),
        bloodGroup: cellText(getValue('bloodGroup')),
        aadharNo: cellText(getValue('aadharNo')),
        previousSchool: cellText(getValue('previousSchool')),
        notes: cellText(getValue('notes')),
      }
      return {
        data,
        dateErrors: [dateOfBirth.error, admissionDate.error].filter(Boolean),
      }
    })
    .filter(({ data }) =>
      Object.entries(data).some(
        ([key, value]) => key !== 'rowNumber' && String(value).trim() !== '',
      ),
    )

  if (rows.length === 0) {
    throw new Error('No student rows were found below the header row.')
  }
  if (rows.length > MAX_IMPORT_ROWS) {
    throw new Error('A maximum of 5,000 students can be imported at once.')
  }
  return rows
}

export function validateStudentImportRows(
  rows: Awaited<ReturnType<typeof parseStudentImportFile>>,
  options: StudentImportOptions,
  students: Student[],
  classes: ClassItem[],
  sections: SectionItem[],
): StudentImportPreviewRow[] {
  const existingAdmissions = new Set(
    students.map((student) => student.admissionNo.trim().toLowerCase()),
  )
  const seenAdmissions = new Set<string>()

  return rows.map(({ data, dateErrors }) => {
    const errors = [...dateErrors]
    const warnings: string[] = []
    const admissionKey = data.admissionNo.trim().toLowerCase()
    if (!data.admissionNo.trim()) errors.push('Admission number is required.')
    if (!data.name.trim()) errors.push('Student name is required.')
    if (!data.className.trim()) errors.push('Class is required.')
    if (
      data.status &&
      !['active', 'inactive'].includes(data.status.trim().toLowerCase())
    ) {
      errors.push('Status must be Active or Inactive.')
    }
    if (
      data.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)
    ) {
      errors.push('Email address is invalid.')
    }

    let duplicate = false
    if (admissionKey && seenAdmissions.has(admissionKey)) {
      duplicate = true
      errors.push('Duplicate admission number in this file.')
    } else if (admissionKey) {
      seenAdmissions.add(admissionKey)
    }
    if (admissionKey && existingAdmissions.has(admissionKey)) {
      duplicate = true
      if (options.mode === 'skip') {
        errors.push('Admission number already exists and will be skipped.')
      } else {
        warnings.push('Existing student will be updated.')
      }
    }

    const schoolClass = classes.find(
      (item) =>
        item.name.toLowerCase() === data.className.trim().toLowerCase() &&
        item.status === 'Active',
    )
    if (data.className && !schoolClass) {
      if (options.autoCreateMasters) {
        warnings.push(`Class "${data.className}" will be created.`)
      } else {
        errors.push(`Class "${data.className}" does not exist.`)
      }
    }
    if (data.section) {
      const sectionExists = schoolClass
        ? sections.some(
            (item) =>
              item.classId === schoolClass.id &&
              item.name.toLowerCase() === data.section.trim().toLowerCase() &&
              item.status === 'Active',
          )
        : false
      if (!sectionExists) {
        if (options.autoCreateMasters) {
          warnings.push(
            `Section "${data.section}" will be created for class "${data.className}".`,
          )
        } else if (schoolClass) {
          errors.push(
            `Section "${data.section}" does not exist for class "${data.className}".`,
          )
        }
      }
    }

    return {
      data,
      errors,
      warnings,
      duplicate,
      valid: errors.length === 0,
    }
  })
}

export async function downloadStudentImportTemplate(
  template: StudentImportTemplate,
) {
  const { utils, writeFileXLSX } = await import('xlsx')
  const worksheet = utils.aoa_to_sheet([
    template.columns,
    ...template.sampleRows,
  ])
  worksheet['!cols'] = template.columns.map((column) => ({
    wch: Math.max(14, column.length + 2),
  }))
  const workbook = utils.book_new()
  utils.book_append_sheet(workbook, worksheet, 'Students')
  writeFileXLSX(workbook, template.filename)
}
