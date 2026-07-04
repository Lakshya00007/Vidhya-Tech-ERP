const crypto = require("node:crypto");
const Database = require("better-sqlite3");

const DEFAULT_SETTINGS_ID = "school-profile";
const STUDENT_STATUSES = new Set(["Active", "Inactive"]);
const MASTER_STATUSES = new Set(["Active", "Inactive"]);
const PAYMENT_MODES = new Set([
  "Cash",
  "UPI",
  "Card",
  "Bank Transfer",
  "Cheque",
]);
const SALARY_PAYMENT_MODES = new Set([
  "Cash",
  "UPI",
  "Bank Transfer",
  "Cheque",
]);
const ATTENDANCE_STATUSES = new Set(["Present", "Absent", "Leave"]);
const USER_ROLES = new Set([
  "Owner",
  "Admin",
  "Accountant",
  "Teacher",
  "Viewer",
]);
const FEE_FREQUENCIES = new Set([
  "Monthly",
  "Quarterly",
  "Half-Yearly",
  "Yearly",
  "One-Time",
]);
const CERTIFICATE_TYPES = new Set([
  "Bonafide",
  "Character",
  "Transfer",
  "Admission",
  "Custom",
]);
const ACCOUNT_TYPES = new Set(["Income", "Expense"]);
const STUDENT_IMPORT_TEMPLATE_COLUMNS = [
  "Admission No",
  "Student Name",
  "Class",
  "Section",
  "Guardian Name",
  "Mobile",
  "Address",
  "Date of Birth",
  "Admission Date",
  "Status",
];

class StudentImportValidationError extends Error {}

function now() {
  return new Date().toISOString();
}

function optionalText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function requiredText(value, fieldName) {
  const text = optionalText(value);
  if (!text) {
    throw new Error(`${fieldName} is required.`);
  }
  return text;
}

function addColumnIfMissing(db, tableName, columnName, definition) {
  const columns = db.prepare(`PRAGMA table_info("${tableName}")`).all();
  if (!columns.some((column) => column.name === columnName)) {
    db.exec(
      `ALTER TABLE "${tableName}" ADD COLUMN "${columnName}" ${definition}`,
    );
  }
}

function normalizeDate(value, fieldName) {
  const dateText = requiredText(value, fieldName);
  const dateOnly = dateText.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  const parsedDate = dateOnly ? new Date(`${dateOnly}T00:00:00Z`) : null;
  if (
    !dateOnly ||
    !parsedDate ||
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== dateOnly
  ) {
    throw new Error(`${fieldName} is invalid.`);
  }
  return dateOnly;
}

function normalizeOptionalImportDate(value, fieldName) {
  const text = optionalText(value);
  if (!text) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new StudentImportValidationError(
      `${fieldName} must use YYYY-MM-DD format.`,
    );
  }
  try {
    return normalizeDate(text, fieldName);
  } catch (error) {
    throw new StudentImportValidationError(
      error instanceof Error ? error.message : `${fieldName} is invalid.`,
    );
  }
}

function importText(value, fieldName, maximumLength, required = false) {
  const text = optionalText(value);
  if (required && !text) {
    throw new StudentImportValidationError(`${fieldName} is required.`);
  }
  if (text.length > maximumLength) {
    throw new StudentImportValidationError(
      `${fieldName} must not exceed ${maximumLength} characters.`,
    );
  }
  return text;
}

function studentFromRow(row) {
  return {
    id: row.id,
    admissionNo: row.admission_no,
    name: row.name,
    className: row.class_name,
    section: row.section ?? "",
    guardianName: row.guardian_name ?? "",
    mobile: row.mobile ?? "",
    fatherName: row.father_name ?? "",
    motherName: row.mother_name ?? "",
    email: row.email ?? "",
    gender: row.gender ?? "",
    bloodGroup: row.blood_group ?? "",
    aadharNo: row.aadhar_no ?? "",
    previousSchool: row.previous_school ?? "",
    notes: row.notes ?? "",
    status: row.status,
    address: row.address ?? "",
    dateOfBirth: row.date_of_birth ?? "",
    admissionDate: row.admission_date ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function employeeFromRow(row) {
  return {
    id: row.id,
    employeeNo: row.employee_no,
    name: row.name,
    designation: row.designation ?? "",
    department: row.department ?? "",
    mobile: row.mobile ?? "",
    email: row.email ?? "",
    gender: row.gender ?? "",
    dateOfBirth: row.date_of_birth ?? "",
    joiningDate: row.joining_date ?? "",
    qualification: row.qualification ?? "",
    experience: row.experience ?? "",
    address: row.address ?? "",
    salaryAmount: Number(row.salary_amount ?? 0),
    status: row.status,
    userId: row.user_id ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function salaryPaymentFromRow(row) {
  return {
    id: row.id,
    salaryNo: row.salary_no,
    employeeId: row.employee_id,
    employeeNo: row.employee_no ?? "",
    employeeName: row.employee_name,
    designation: row.designation ?? "",
    department: row.department ?? "",
    salaryMonth: row.salary_month,
    baseSalary: Number(row.base_salary ?? 0),
    allowances: Number(row.allowances ?? 0),
    deductions: Number(row.deductions ?? 0),
    netSalary: Number(row.net_salary),
    paymentMode: row.payment_mode ?? "Cash",
    paymentDate: row.payment_date,
    notes: row.notes ?? "",
    paidBy: row.paid_by ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? null,
    syncStatus: row.sync_status,
  };
}

function accountCategoryFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    description: row.description ?? "",
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function accountTransactionFromRow(row) {
  return {
    id: row.id,
    transactionNo: row.transaction_no,
    type: row.type,
    categoryId: row.category_id ?? "",
    categoryName: row.category_name,
    title: row.title,
    amount: Number(row.amount),
    paymentMode: row.payment_mode ?? "Cash",
    transactionDate: row.transaction_date,
    referenceNo: row.reference_no ?? "",
    linkedModule: row.linked_module ?? "Manual",
    linkedRecordId: row.linked_record_id ?? "",
    notes: row.notes ?? "",
    createdBy: row.created_by ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function settingsFromRow(row) {
  return {
    id: row.id,
    schoolName: row.school_name,
    address: row.address ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    academicYear: row.academic_year ?? "",
    receiptPrefix: row.receipt_prefix ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function paymentFromRow(row) {
  return {
    id: row.id,
    receiptNo: row.receipt_no,
    studentId: row.student_id,
    studentName: row.student_name,
    admissionNo: row.admission_no ?? row.student_admission_no ?? "",
    className: row.class_name ?? "",
    section: row.section ?? "",
    guardianName: row.guardian_name ?? "",
    mobile: row.mobile ?? "",
    feeType: row.fee_type ?? "",
    amount: row.amount,
    paymentMode: row.payment_mode ?? "Cash",
    paymentDate: row.payment_date,
    notes: row.notes ?? "",
    cashierName: row.cashier_name ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
  };
}

function attendanceFromRow(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    admissionNo: row.admission_no ?? row.student_admission_no ?? "",
    className: row.class_name,
    section: row.section ?? "",
    attendanceDate: row.attendance_date,
    status: row.status,
    remarks: row.remarks ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
  };
}

function classFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    displayOrder: row.display_order ?? 0,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function sectionFromRow(row) {
  return {
    id: row.id,
    classId: row.class_id ?? "",
    className: row.class_name,
    name: row.name,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function feeHeadFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    frequency: row.frequency,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function feeStructureFromRow(row) {
  return {
    id: row.id,
    className: row.class_name,
    feeHeadId: row.fee_head_id,
    feeHeadName: row.fee_head_name,
    amount: row.amount,
    academicYear: row.academic_year ?? "",
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function subjectFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    code: row.code ?? "",
    className: row.class_name ?? "",
    maxMarks: Number(row.max_marks ?? 100),
    passingMarks: Number(row.passing_marks ?? 33),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function examFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    className: row.class_name ?? "",
    section: row.section ?? "",
    academicYear: row.academic_year ?? "",
    examDate: row.exam_date ?? "",
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function markFromRow(row) {
  return {
    id: row.id,
    examId: row.exam_id,
    examName: row.exam_name,
    studentId: row.student_id,
    studentName: row.student_name,
    admissionNo: row.admission_no ?? "",
    className: row.class_name,
    section: row.section ?? "",
    subjectId: row.subject_id,
    subjectName: row.subject_name,
    maxMarks: Number(row.max_marks ?? 100),
    passingMarks: Number(row.passing_marks ?? 33),
    obtainedMarks: Number(row.obtained_marks ?? 0),
    remarks: row.remarks ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
  };
}

function userFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? "",
    username: row.username,
    role: row.role,
    status: row.status,
    lastLoginAt: row.last_login_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function auditLogFromRow(row) {
  return {
    id: row.id,
    userId: row.user_id ?? null,
    userName: row.user_name ?? "",
    action: row.action,
    module: row.module ?? "",
    details: row.details ?? "",
    createdAt: row.created_at,
  };
}

function certificateTemplateFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    bodyTemplate: row.body_template,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function issuedCertificateFromRow(row) {
  return {
    id: row.id,
    certificateNo: row.certificate_no,
    studentId: row.student_id,
    studentName: row.student_name,
    admissionNo: row.admission_no ?? "",
    className: row.class_name ?? "",
    section: row.section ?? "",
    templateId: row.template_id ?? "",
    certificateType: row.certificate_type ?? "",
    issuedDate: row.issued_date,
    body: row.body ?? "",
    issuedBy: row.issued_by ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
  };
}

function licenseActivationFromRow(row) {
  if (!row) return null;
  let features = [];
  try {
    const parsedFeatures = JSON.parse(row.features_json ?? "[]");
    features = Array.isArray(parsedFeatures) ? parsedFeatures : [];
  } catch {
    features = [];
  }
  return {
    id: row.id,
    licenseId: row.license_id ?? "",
    schoolName: row.school_name ?? "",
    deviceId: row.device_id ?? "",
    plan: row.plan ?? "",
    issuedAt: row.issued_at ?? "",
    expiresAt: row.expires_at ?? "",
    maintenanceUntil: row.maintenance_until ?? "",
    maxUsers: Number(row.max_users ?? 0),
    features,
    licenseKey: row.license_key ?? "",
    status: row.status ?? "missing",
    activatedAt: row.activated_at ?? null,
    lastCheckedAt: row.last_checked_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function masterStatus(value, fallback = "Active") {
  const status = optionalText(value) || fallback;
  if (!MASTER_STATUSES.has(status)) {
    throw new Error("Status must be Active or Inactive.");
  }
  return status;
}

function displayOrder(value, fallback = 0) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const order = Number(value);
  if (!Number.isInteger(order) || order < 0) {
    throw new Error("Display order must be a non-negative whole number.");
  }
  return order;
}

function wholeNumber(value, fieldName, minimum = 0) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < minimum) {
    throw new Error(`${fieldName} must be a whole number of at least ${minimum}.`);
  }
  return number;
}

function createDatabase(databasePath) {
  const db = new Database(databasePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  const hadClassesTable = Boolean(
    db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
      )
      .get("classes"),
  );

  db.exec(`
    CREATE TABLE IF NOT EXISTS school_settings (
      id TEXT PRIMARY KEY,
      school_name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      email TEXT,
      academic_year TEXT,
      receipt_prefix TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      admission_no TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      class_name TEXT NOT NULL,
      section TEXT,
      guardian_name TEXT,
      mobile TEXT,
      father_name TEXT,
      mother_name TEXT,
      email TEXT,
      gender TEXT,
      blood_group TEXT,
      aadhar_no TEXT,
      previous_school TEXT,
      notes TEXT,
      status TEXT DEFAULT 'Active',
      address TEXT,
      date_of_birth TEXT,
      admission_date TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      employee_no TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      designation TEXT,
      department TEXT,
      mobile TEXT,
      email TEXT,
      gender TEXT,
      date_of_birth TEXT,
      joining_date TEXT,
      qualification TEXT,
      experience TEXT,
      address TEXT,
      salary_amount INTEGER DEFAULT 0,
      status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
      user_id TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS salary_payments (
      id TEXT PRIMARY KEY,
      salary_no TEXT UNIQUE NOT NULL,
      employee_id TEXT NOT NULL,
      employee_no TEXT,
      employee_name TEXT NOT NULL,
      designation TEXT,
      department TEXT,
      salary_month TEXT NOT NULL,
      base_salary INTEGER DEFAULT 0,
      allowances INTEGER DEFAULT 0,
      deductions INTEGER DEFAULT 0,
      net_salary INTEGER NOT NULL,
      payment_mode TEXT,
      payment_date TEXT,
      notes TEXT,
      paid_by TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS account_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('Income', 'Expense')),
      description TEXT,
      status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS account_transactions (
      id TEXT PRIMARY KEY,
      transaction_no TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('Income', 'Expense')),
      category_id TEXT,
      category_name TEXT NOT NULL,
      title TEXT NOT NULL,
      amount INTEGER NOT NULL,
      payment_mode TEXT,
      transaction_date TEXT NOT NULL,
      reference_no TEXT,
      linked_module TEXT,
      linked_record_id TEXT,
      notes TEXT,
      created_by TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (category_id) REFERENCES account_categories(id)
    );

    CREATE TABLE IF NOT EXISTS fee_payments (
      id TEXT PRIMARY KEY,
      receipt_no TEXT UNIQUE NOT NULL,
      student_id TEXT,
      student_name TEXT NOT NULL,
      admission_no TEXT,
      class_name TEXT,
      section TEXT,
      guardian_name TEXT,
      mobile TEXT,
      fee_type TEXT,
      amount INTEGER NOT NULL,
      payment_mode TEXT,
      payment_date TEXT,
      notes TEXT,
      cashier_name TEXT,
      created_at TEXT,
      updated_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      admission_no TEXT,
      class_name TEXT NOT NULL,
      section TEXT,
      attendance_date TEXT NOT NULL,
      status TEXT NOT NULL,
      remarks TEXT,
      created_at TEXT,
      updated_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      display_order INTEGER,
      status TEXT DEFAULT 'Active',
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS sections (
      id TEXT PRIMARY KEY,
      class_id TEXT,
      class_name TEXT NOT NULL,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'Active',
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (class_id) REFERENCES classes(id)
    );

    CREATE TABLE IF NOT EXISTS fee_heads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      frequency TEXT NOT NULL,
      status TEXT DEFAULT 'Active',
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS fee_structures (
      id TEXT PRIMARY KEY,
      class_name TEXT NOT NULL,
      fee_head_id TEXT NOT NULL,
      fee_head_name TEXT NOT NULL,
      amount INTEGER NOT NULL,
      academic_year TEXT,
      status TEXT DEFAULT 'Active',
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (fee_head_id) REFERENCES fee_heads(id)
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT,
      class_name TEXT,
      max_marks INTEGER DEFAULT 100,
      passing_marks INTEGER DEFAULT 33,
      status TEXT DEFAULT 'Active',
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS exams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      class_name TEXT,
      section TEXT,
      academic_year TEXT,
      exam_date TEXT,
      status TEXT DEFAULT 'Active',
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS marks (
      id TEXT PRIMARY KEY,
      exam_id TEXT NOT NULL,
      exam_name TEXT NOT NULL,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      admission_no TEXT,
      class_name TEXT NOT NULL,
      section TEXT,
      subject_id TEXT NOT NULL,
      subject_name TEXT NOT NULL,
      max_marks INTEGER DEFAULT 100,
      passing_marks INTEGER DEFAULT 33,
      obtained_marks INTEGER DEFAULT 0,
      remarks TEXT,
      created_at TEXT,
      updated_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (exam_id) REFERENCES exams(id),
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (subject_id) REFERENCES subjects(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT DEFAULT 'Active',
      last_login_at TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS license_activation (
      id TEXT PRIMARY KEY,
      license_id TEXT,
      school_name TEXT,
      device_id TEXT,
      plan TEXT,
      issued_at TEXT,
      expires_at TEXT,
      maintenance_until TEXT,
      max_users INTEGER,
      features_json TEXT,
      license_key TEXT,
      status TEXT,
      activated_at TEXT,
      last_checked_at TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_name TEXT,
      action TEXT NOT NULL,
      module TEXT,
      details TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS certificate_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (
        type IN ('Bonafide', 'Character', 'Transfer', 'Admission', 'Custom')
      ),
      body_template TEXT NOT NULL,
      status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS issued_certificates (
      id TEXT PRIMARY KEY,
      certificate_no TEXT UNIQUE NOT NULL,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      admission_no TEXT,
      class_name TEXT,
      section TEXT,
      template_id TEXT,
      certificate_type TEXT,
      issued_date TEXT,
      body TEXT,
      issued_by TEXT,
      created_at TEXT,
      updated_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (template_id) REFERENCES certificate_templates(id)
    );

    CREATE INDEX IF NOT EXISTS idx_students_active
      ON students(deleted_at, created_at);
    CREATE INDEX IF NOT EXISTS idx_employees_active
      ON employees(deleted_at, status, department, designation, name);
    CREATE INDEX IF NOT EXISTS idx_fee_payments_date
      ON fee_payments(payment_date);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_student_date
      ON attendance(student_id, attendance_date);
    CREATE INDEX IF NOT EXISTS idx_classes_active
      ON classes(deleted_at, display_order, name);
    CREATE INDEX IF NOT EXISTS idx_sections_class
      ON sections(class_id, deleted_at, name);
    CREATE INDEX IF NOT EXISTS idx_fee_heads_active
      ON fee_heads(deleted_at, name);
    CREATE INDEX IF NOT EXISTS idx_fee_structures_class
      ON fee_structures(class_name, academic_year, deleted_at);
    CREATE INDEX IF NOT EXISTS idx_subjects_class
      ON subjects(class_name, deleted_at, name);
    CREATE INDEX IF NOT EXISTS idx_exams_class
      ON exams(class_name, section, deleted_at, exam_date);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_marks_exam_student_subject
      ON marks(exam_id, student_id, subject_id);
    CREATE INDEX IF NOT EXISTS idx_marks_exam
      ON marks(exam_id, student_name, subject_name);
    CREATE INDEX IF NOT EXISTS idx_marks_student_exam
      ON marks(student_id, exam_id);
    CREATE INDEX IF NOT EXISTS idx_users_active
      ON users(deleted_at, status, role);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created
      ON audit_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_certificate_templates_active
      ON certificate_templates(deleted_at, status, name);
    CREATE INDEX IF NOT EXISTS idx_issued_certificates_student
      ON issued_certificates(student_id, issued_date DESC);
    CREATE INDEX IF NOT EXISTS idx_issued_certificates_date
      ON issued_certificates(issued_date DESC, created_at DESC);
  `);

  addColumnIfMissing(db, "fee_payments", "admission_no", "TEXT");
  addColumnIfMissing(db, "fee_payments", "section", "TEXT");
  addColumnIfMissing(db, "fee_payments", "guardian_name", "TEXT");
  addColumnIfMissing(db, "fee_payments", "mobile", "TEXT");
  addColumnIfMissing(db, "fee_payments", "cashier_name", "TEXT");
  addColumnIfMissing(db, "attendance", "admission_no", "TEXT");
  addColumnIfMissing(db, "attendance", "remarks", "TEXT");
  addColumnIfMissing(db, "students", "father_name", "TEXT");
  addColumnIfMissing(db, "students", "mother_name", "TEXT");
  addColumnIfMissing(db, "students", "email", "TEXT");
  addColumnIfMissing(db, "students", "gender", "TEXT");
  addColumnIfMissing(db, "students", "blood_group", "TEXT");
  addColumnIfMissing(db, "students", "aadhar_no", "TEXT");
  addColumnIfMissing(db, "students", "previous_school", "TEXT");
  addColumnIfMissing(db, "students", "notes", "TEXT");
  addColumnIfMissing(db, "salary_payments", "deleted_at", "TEXT");
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_salary_employee_month_active
      ON salary_payments(employee_id, salary_month)
      WHERE deleted_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_salary_payments_date
      ON salary_payments(payment_date, deleted_at);
    CREATE INDEX IF NOT EXISTS idx_account_categories_active
      ON account_categories(type, status, deleted_at, name);
    CREATE INDEX IF NOT EXISTS idx_account_transactions_date
      ON account_transactions(transaction_date, type, deleted_at);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_account_linked_record_active
      ON account_transactions(linked_module, linked_record_id, type)
      WHERE deleted_at IS NULL
        AND linked_record_id IS NOT NULL
        AND trim(linked_record_id) <> '';
  `);

  const timestamp = now();
  db.prepare(`
    INSERT OR IGNORE INTO school_settings (
      id, school_name, address, phone, email, academic_year,
      receipt_prefix, created_at, updated_at
    ) VALUES (
      @id, @schoolName, @address, @phone, @email, @academicYear,
      @receiptPrefix, @createdAt, @updatedAt
    )
  `).run({
    id: DEFAULT_SETTINGS_ID,
    schoolName: "Vidhya Public School",
    address: "24, Knowledge Park, Indore, Madhya Pradesh – 452010",
    phone: "+91 731 456 7890",
    email: "office@vidhyaschool.edu.in",
    academicYear: "2026–2027",
    receiptPrefix: "VSE-RC",
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  const insertDefaultTemplate = db.prepare(`
    INSERT OR IGNORE INTO certificate_templates (
      id, name, type, body_template, status, created_at, updated_at,
      deleted_at, sync_status
    ) VALUES (
      @id, @name, @type, @bodyTemplate, 'Active', @createdAt, @updatedAt,
      NULL, 'pending'
    )
  `);
  const defaultCertificateTemplates = [
    {
      id: "default-bonafide-certificate",
      name: "Bonafide Certificate",
      type: "Bonafide",
      bodyTemplate:
        "This is to certify that {{studentName}}, Admission No. {{admissionNo}}, is a bonafide student of {{schoolName}} studying in Class {{className}}, Section {{section}}, during the academic year {{academicYear}}.\n\nThis certificate is issued on {{date}} at the request of the student/guardian for official purposes.",
    },
    {
      id: "default-character-certificate",
      name: "Character Certificate",
      type: "Character",
      bodyTemplate:
        "This is to certify that {{studentName}}, Admission No. {{admissionNo}}, of Class {{className}}, Section {{section}}, has been a student of {{schoolName}} during the academic year {{academicYear}}.\n\nTo the best of our knowledge, the student's conduct and character have been satisfactory. We wish the student success in future endeavours.",
    },
    {
      id: "default-transfer-certificate",
      name: "Transfer Certificate",
      type: "Transfer",
      bodyTemplate:
        "This is to certify that {{studentName}}, Admission No. {{admissionNo}}, studied at {{schoolName}} in Class {{className}}, Section {{section}}, during the academic year {{academicYear}}.\n\nThis basic transfer certificate is issued on {{date}}. Complete statutory transfer details may be added by editing this template before issue.",
    },
  ];
  for (const template of defaultCertificateTemplates) {
    insertDefaultTemplate.run({
      ...template,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  const insertDefaultAccountCategory = db.prepare(`
    INSERT OR IGNORE INTO account_categories (
      id, name, type, description, status, created_at, updated_at,
      deleted_at, sync_status
    ) VALUES (
      @id, @name, @type, @description, 'Active', @createdAt, @updatedAt,
      NULL, 'pending'
    )
  `);
  const defaultAccountCategories = [
    ["default-income-tuition-fee", "Tuition Fee Income", "Income"],
    ["default-income-admission-fee", "Admission Fee Income", "Income"],
    ["default-income-exam-fee", "Exam Fee Income", "Income"],
    ["default-income-other", "Other Income", "Income"],
    ["default-expense-salary", "Salary Expense", "Expense"],
    ["default-expense-rent", "Rent", "Expense"],
    ["default-expense-electricity", "Electricity", "Expense"],
    ["default-expense-stationery", "Stationery", "Expense"],
    ["default-expense-maintenance", "Maintenance", "Expense"],
    ["default-expense-other", "Other Expense", "Expense"],
  ];
  for (const [id, name, type] of defaultAccountCategories) {
    insertDefaultAccountCategory.run({
      id,
      name,
      type,
      description: `Default ${type.toLowerCase()} category`,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  if (!hadClassesTable) {
    const legacyClasses = db
      .prepare(`
        SELECT class_name, MIN(created_at) AS first_created
        FROM students
        WHERE deleted_at IS NULL AND trim(class_name) <> ''
        GROUP BY class_name
        ORDER BY CAST(class_name AS INTEGER), class_name
      `)
      .all();
    const insertMigratedClass = db.prepare(`
      INSERT INTO classes (
        id, name, display_order, status, created_at, updated_at, deleted_at,
        sync_status
      ) VALUES (
        @id, @name, @displayOrder, 'Active', @createdAt, @updatedAt, NULL,
        'pending'
      )
    `);
    const insertMigratedSection = db.prepare(`
      INSERT INTO sections (
        id, class_id, class_name, name, status, created_at, updated_at,
        deleted_at, sync_status
      ) VALUES (
        @id, @classId, @className, @name, 'Active', @createdAt, @updatedAt,
        NULL, 'pending'
      )
    `);

    db.transaction(() => {
      legacyClasses.forEach((legacyClass, index) => {
        const classId = crypto.randomUUID();
        const createdAt = legacyClass.first_created || timestamp;
        insertMigratedClass.run({
          id: classId,
          name: legacyClass.class_name,
          displayOrder: index + 1,
          createdAt,
          updatedAt: timestamp,
        });

        const legacySections = db
          .prepare(`
            SELECT DISTINCT section
            FROM students
            WHERE deleted_at IS NULL
              AND class_name = ?
              AND trim(COALESCE(section, '')) <> ''
            ORDER BY section
          `)
          .all(legacyClass.class_name);
        for (const legacySection of legacySections) {
          insertMigratedSection.run({
            id: crypto.randomUUID(),
            classId,
            className: legacyClass.class_name,
            name: legacySection.section,
            createdAt,
            updatedAt: timestamp,
          });
        }
      });
    })();
  }

  const getStudentsStatement = db.prepare(`
    SELECT *
    FROM students
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
  `);

  const getStudentStatement = db.prepare(`
    SELECT *
    FROM students
    WHERE id = ? AND deleted_at IS NULL
  `);

  const insertStudentStatement = db.prepare(`
    INSERT INTO students (
      id, admission_no, name, class_name, section, guardian_name, mobile,
      father_name, mother_name, email, gender, blood_group, aadhar_no,
      previous_school, notes, status, address, date_of_birth, admission_date,
      created_at, updated_at, deleted_at, sync_status
    ) VALUES (
      @id, @admissionNo, @name, @className, @section, @guardianName, @mobile,
      @fatherName, @motherName, @email, @gender, @bloodGroup, @aadharNo,
      @previousSchool, @notes, @status, @address, @dateOfBirth,
      @admissionDate, @createdAt, @updatedAt, NULL, 'pending'
    )
  `);

  const updateStudentStatement = db.prepare(`
    UPDATE students
    SET admission_no = @admissionNo,
        name = @name,
        class_name = @className,
        section = @section,
        guardian_name = @guardianName,
        mobile = @mobile,
        father_name = @fatherName,
        mother_name = @motherName,
        email = @email,
        gender = @gender,
        blood_group = @bloodGroup,
        aadhar_no = @aadharNo,
        previous_school = @previousSchool,
        notes = @notes,
        status = @status,
        address = @address,
        date_of_birth = @dateOfBirth,
        admission_date = @admissionDate,
        updated_at = @updatedAt,
        sync_status = 'pending'
    WHERE id = @id AND deleted_at IS NULL
  `);

  const paymentSelect = `
    SELECT
      fee_payments.*,
      students.admission_no AS student_admission_no
    FROM fee_payments
    LEFT JOIN students ON students.id = fee_payments.student_id
  `;

  const getPaymentsStatement = db.prepare(`
    ${paymentSelect}
    ORDER BY fee_payments.payment_date DESC, fee_payments.created_at DESC
  `);

  const attendanceSelect = `
    SELECT
      attendance.*,
      students.admission_no AS student_admission_no
    FROM attendance
    LEFT JOIN students ON students.id = attendance.student_id
  `;

  const getActiveClassById = db.prepare(`
    SELECT * FROM classes WHERE id = ? AND deleted_at IS NULL
  `);
  const getActiveClassByName = db.prepare(`
    SELECT * FROM classes
    WHERE name = ? COLLATE NOCASE AND deleted_at IS NULL
  `);
  const getActiveFeeHeadById = db.prepare(`
    SELECT * FROM fee_heads WHERE id = ? AND deleted_at IS NULL
  `);
  const getActiveSubjectById = db.prepare(`
    SELECT * FROM subjects WHERE id = ? AND deleted_at IS NULL
  `);
  const getActiveExamById = db.prepare(`
    SELECT * FROM exams WHERE id = ? AND deleted_at IS NULL
  `);

  function generateAdmissionNumber() {
    const year = new Date().getFullYear();
    const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();
    return `VSE-${year}-${suffix}`;
  }

  function generateReceiptNumber(paymentDate) {
    const settings = db
      .prepare("SELECT receipt_prefix FROM school_settings WHERE id = ?")
      .get(DEFAULT_SETTINGS_ID);
    const prefix =
      optionalText(settings?.receipt_prefix).replace(/-+$/, "") || "VSE-RC";
    const year = normalizeDate(paymentDate, "Payment date").slice(0, 4);
    const receiptStem = `${prefix}-${year}-`;
    const sequence = db
      .prepare(`
        SELECT MAX(
          CAST(substr(receipt_no, length(?) + 1) AS INTEGER)
        ) AS last_sequence
        FROM fee_payments
        WHERE substr(receipt_no, 1, length(?)) = ?
      `)
      .get(receiptStem, receiptStem, receiptStem);
    const nextSequence = Number(sequence?.last_sequence ?? 0) + 1;
    return `${receiptStem}${String(nextSequence).padStart(4, "0")}`;
  }

  function generateCertificateNumber(issuedDate) {
    const year = normalizeDate(issuedDate, "Issue date").slice(0, 4);
    const certificateStem = `CERT-${year}-`;
    const sequence = db
      .prepare(`
        SELECT MAX(
          CAST(substr(certificate_no, length(?) + 1) AS INTEGER)
        ) AS last_sequence
        FROM issued_certificates
        WHERE substr(certificate_no, 1, length(?)) = ?
      `)
      .get(certificateStem, certificateStem, certificateStem);
    const nextSequence = Number(sequence?.last_sequence ?? 0) + 1;
    return `${certificateStem}${String(nextSequence).padStart(4, "0")}`;
  }

  function normalizeSalaryMonth(value) {
    const month = requiredText(value, "Salary month");
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      throw new Error("Salary month must use YYYY-MM format.");
    }
    return month;
  }

  function generateSalaryNumber(paymentDate) {
    const year = normalizeDate(paymentDate, "Payment date").slice(0, 4);
    const salaryStem = `SAL-${year}-`;
    const sequence = db
      .prepare(`
        SELECT MAX(
          CAST(substr(salary_no, length(?) + 1) AS INTEGER)
        ) AS last_sequence
        FROM salary_payments
        WHERE substr(salary_no, 1, length(?)) = ?
      `)
      .get(salaryStem, salaryStem, salaryStem);
    const nextSequence = Number(sequence?.last_sequence ?? 0) + 1;
    return `${salaryStem}${String(nextSequence).padStart(4, "0")}`;
  }

  function generateAccountTransactionNumber(transactionDate) {
    const year = normalizeDate(
      transactionDate,
      "Transaction date",
    ).slice(0, 4);
    const transactionStem = `ACC-${year}-`;
    const sequence = db
      .prepare(`
        SELECT MAX(
          CAST(substr(transaction_no, length(?) + 1) AS INTEGER)
        ) AS last_sequence
        FROM account_transactions
        WHERE substr(transaction_no, 1, length(?)) = ?
      `)
      .get(transactionStem, transactionStem, transactionStem);
    const nextSequence = Number(sequence?.last_sequence ?? 0) + 1;
    return `${transactionStem}${String(nextSequence).padStart(4, "0")}`;
  }

  function getActiveAccountCategory(type, names) {
    for (const name of names) {
      const category = db
        .prepare(`
          SELECT *
          FROM account_categories
          WHERE type = ?
            AND name = ? COLLATE NOCASE
            AND status = 'Active'
            AND deleted_at IS NULL
        `)
        .get(type, name);
      if (category) return category;
    }
    return null;
  }

  function resolveFeeIncomeCategory(feeType) {
    const normalizedFeeType = requiredText(feeType, "Fee type");
    const candidates = [`${normalizedFeeType} Income`];
    if (/admission/i.test(normalizedFeeType)) {
      candidates.push("Admission Fee Income");
    } else if (/exam/i.test(normalizedFeeType)) {
      candidates.push("Exam Fee Income");
    } else if (/tuition/i.test(normalizedFeeType)) {
      candidates.push("Tuition Fee Income");
    }
    candidates.push("Tuition Fee Income", "Other Income");
    return getActiveAccountCategory("Income", [...new Set(candidates)]);
  }

  function createLinkedAccountTransaction(input) {
    const linkedModule = requiredText(input?.linkedModule, "Linked module");
    const linkedRecordId = requiredText(
      input?.linkedRecordId,
      "Linked record id",
    );
    const existing = db
      .prepare(`
        SELECT *
        FROM account_transactions
        WHERE linked_module = ?
          AND linked_record_id = ?
          AND type = ?
          AND deleted_at IS NULL
      `)
      .get(linkedModule, linkedRecordId, input.type);
    if (existing) return accountTransactionFromRow(existing);

    const category = input.category;
    if (!category) {
      throw new Error(`An active ${input.type.toLowerCase()} account category is required.`);
    }
    const amount = wholeNumber(input.amount, "Account amount", 1);
    const transactionDate = normalizeDate(
      input.transactionDate,
      "Transaction date",
    );
    const paymentMode = requiredText(input.paymentMode, "Payment mode");
    if (!PAYMENT_MODES.has(paymentMode)) {
      throw new Error("Account payment mode is invalid.");
    }
    const id = crypto.randomUUID();
    const timestamp = now();
    db.prepare(`
      INSERT INTO account_transactions (
        id, transaction_no, type, category_id, category_name, title, amount,
        payment_mode, transaction_date, reference_no, linked_module,
        linked_record_id, notes, created_by, created_at, updated_at,
        deleted_at, sync_status
      ) VALUES (
        @id, @transactionNo, @type, @categoryId, @categoryName, @title,
        @amount, @paymentMode, @transactionDate, @referenceNo, @linkedModule,
        @linkedRecordId, @notes, @createdBy, @createdAt, @updatedAt,
        NULL, 'pending'
      )
    `).run({
      id,
      transactionNo: generateAccountTransactionNumber(transactionDate),
      type: input.type,
      categoryId: category.id,
      categoryName: category.name,
      title: requiredText(input.title, "Account title"),
      amount,
      paymentMode,
      transactionDate,
      referenceNo: optionalText(input.referenceNo),
      linkedModule,
      linkedRecordId,
      notes: optionalText(input.notes),
      createdBy: optionalText(input.createdBy),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    return accountTransactionFromRow(
      db.prepare("SELECT * FROM account_transactions WHERE id = ?").get(id),
    );
  }

  function syncSalaryAccountTransaction(salaryPayment) {
    const category = getActiveAccountCategory("Expense", [
      "Salary Expense",
      "Other Expense",
    ]);
    if (!category) {
      throw new Error("Create an active Salary Expense account category first.");
    }
    const existing = db
      .prepare(`
        SELECT *
        FROM account_transactions
        WHERE linked_module = 'Salary'
          AND linked_record_id = ?
          AND type = 'Expense'
          AND deleted_at IS NULL
      `)
      .get(salaryPayment.id);
    if (!existing) {
      return createLinkedAccountTransaction({
        type: "Expense",
        category,
        title: `Salary - ${salaryPayment.employeeName} (${salaryPayment.salaryMonth})`,
        amount: salaryPayment.netSalary,
        paymentMode: salaryPayment.paymentMode,
        transactionDate: salaryPayment.paymentDate,
        referenceNo: salaryPayment.salaryNo,
        linkedModule: "Salary",
        linkedRecordId: salaryPayment.id,
        notes: salaryPayment.notes,
        createdBy: salaryPayment.paidBy,
      });
    }
    db.prepare(`
      UPDATE account_transactions
      SET category_id = @categoryId,
          category_name = @categoryName,
          title = @title,
          amount = @amount,
          payment_mode = @paymentMode,
          transaction_date = @transactionDate,
          reference_no = @referenceNo,
          notes = @notes,
          created_by = @createdBy,
          updated_at = @updatedAt,
          sync_status = 'pending'
      WHERE id = @id AND deleted_at IS NULL
    `).run({
      id: existing.id,
      categoryId: category.id,
      categoryName: category.name,
      title: `Salary - ${salaryPayment.employeeName} (${salaryPayment.salaryMonth})`,
      amount: salaryPayment.netSalary,
      paymentMode: salaryPayment.paymentMode,
      transactionDate: salaryPayment.paymentDate,
      referenceNo: salaryPayment.salaryNo,
      notes: salaryPayment.notes,
      createdBy: salaryPayment.paidBy,
      updatedAt: now(),
    });
    return accountTransactionFromRow(
      db
        .prepare("SELECT * FROM account_transactions WHERE id = ?")
        .get(existing.id),
    );
  }

  function formatDocumentDate(value) {
    const date = new Date(`${normalizeDate(value, "Issue date")}T00:00:00`);
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);
  }

  function renderCertificateBody(bodyTemplate, settings, student, issuedDate) {
    const variables = {
      schoolName: settings.school_name ?? "",
      studentName: student.name ?? "",
      admissionNo: student.admission_no ?? "",
      className: student.class_name ?? "",
      section: student.section ?? "",
      guardianName: student.guardian_name ?? "",
      date: formatDocumentDate(issuedDate),
      academicYear: settings.academic_year ?? "",
    };
    return Object.entries(variables).reduce(
      (body, [name, value]) =>
        body.replaceAll(`{{${name}}}`, optionalText(value)),
      requiredText(bodyTemplate, "Certificate body"),
    );
  }

  return {
    getStudents() {
      return getStudentsStatement.all().map(studentFromRow);
    },

    createStudent(input) {
      const timestamp = now();
      const status = optionalText(input?.status) || "Active";
      if (!STUDENT_STATUSES.has(status)) {
        throw new Error("Student status is invalid.");
      }

      const className = requiredText(input?.className, "Class");
      const schoolClass = getActiveClassByName.get(className);
      if (!schoolClass || schoolClass.status !== "Active") {
        throw new Error("Select an active class from Settings.");
      }
      const section = optionalText(input?.section);
      if (section) {
        const schoolSection = db
          .prepare(`
            SELECT id
            FROM sections
            WHERE class_id = ?
              AND name = ? COLLATE NOCASE
              AND status = 'Active'
              AND deleted_at IS NULL
          `)
          .get(schoolClass.id, section);
        if (!schoolSection) {
          throw new Error("Select an active section for the chosen class.");
        }
      }

      const student = {
        id: crypto.randomUUID(),
        admissionNo: optionalText(input?.admissionNo) || generateAdmissionNumber(),
        name: requiredText(input?.name, "Student name"),
        className: schoolClass.name,
        section,
        guardianName: optionalText(input?.guardianName),
        mobile: optionalText(input?.mobile),
        fatherName: optionalText(input?.fatherName),
        motherName: optionalText(input?.motherName),
        email: optionalText(input?.email),
        gender: optionalText(input?.gender),
        bloodGroup: optionalText(input?.bloodGroup),
        aadharNo: optionalText(input?.aadharNo),
        previousSchool: optionalText(input?.previousSchool),
        notes: optionalText(input?.notes),
        status,
        address: optionalText(input?.address),
        dateOfBirth: optionalText(input?.dateOfBirth),
        admissionDate: optionalText(input?.admissionDate),
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      insertStudentStatement.run(student);
      return studentFromRow(getStudentStatement.get(student.id));
    },

    updateStudent(id, input) {
      const studentId = requiredText(id, "Student id");
      const existing = getStudentStatement.get(studentId);
      if (!existing) {
        throw new Error("Student record was not found.");
      }

      const existingStudent = studentFromRow(existing);
      const status = optionalText(input?.status) || existingStudent.status;
      if (!STUDENT_STATUSES.has(status)) {
        throw new Error("Student status is invalid.");
      }

      let className = existingStudent.className;
      if (input?.className !== undefined) {
        const schoolClass = getActiveClassByName.get(
          requiredText(input.className, "Class"),
        );
        if (!schoolClass || schoolClass.status !== "Active") {
          throw new Error("Select an active class from Settings.");
        }
        className = schoolClass.name;
      }
      const section =
        input?.section === undefined
          ? existingStudent.section
          : optionalText(input.section);
      if ((input?.className !== undefined || input?.section !== undefined) && section) {
        const schoolClass = getActiveClassByName.get(className);
        const schoolSection = schoolClass
          ? db
              .prepare(`
                SELECT id
                FROM sections
                WHERE class_id = ?
                  AND name = ? COLLATE NOCASE
                  AND status = 'Active'
                  AND deleted_at IS NULL
              `)
              .get(schoolClass.id, section)
          : null;
        if (!schoolSection) {
          throw new Error("Select an active section for the chosen class.");
        }
      }

      updateStudentStatement.run({
        id: studentId,
        admissionNo:
          optionalText(input?.admissionNo) || existingStudent.admissionNo,
        name: optionalText(input?.name) || existingStudent.name,
        className,
        section,
        guardianName:
          input?.guardianName === undefined
            ? existingStudent.guardianName
            : optionalText(input.guardianName),
        mobile:
          input?.mobile === undefined
            ? existingStudent.mobile
            : optionalText(input.mobile),
        fatherName:
          input?.fatherName === undefined
            ? existingStudent.fatherName
            : optionalText(input.fatherName),
        motherName:
          input?.motherName === undefined
            ? existingStudent.motherName
            : optionalText(input.motherName),
        email:
          input?.email === undefined
            ? existingStudent.email
            : optionalText(input.email),
        gender:
          input?.gender === undefined
            ? existingStudent.gender
            : optionalText(input.gender),
        bloodGroup:
          input?.bloodGroup === undefined
            ? existingStudent.bloodGroup
            : optionalText(input.bloodGroup),
        aadharNo:
          input?.aadharNo === undefined
            ? existingStudent.aadharNo
            : optionalText(input.aadharNo),
        previousSchool:
          input?.previousSchool === undefined
            ? existingStudent.previousSchool
            : optionalText(input.previousSchool),
        notes:
          input?.notes === undefined
            ? existingStudent.notes
            : optionalText(input.notes),
        status,
        address:
          input?.address === undefined
            ? existingStudent.address
            : optionalText(input.address),
        dateOfBirth:
          input?.dateOfBirth === undefined
            ? existingStudent.dateOfBirth
            : optionalText(input.dateOfBirth),
        admissionDate:
          input?.admissionDate === undefined
            ? existingStudent.admissionDate
            : optionalText(input.admissionDate),
        updatedAt: now(),
      });

      return studentFromRow(getStudentStatement.get(studentId));
    },

    deleteStudent(id) {
      const result = db
        .prepare(`
          UPDATE students
          SET deleted_at = @deletedAt,
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE id = @id AND deleted_at IS NULL
        `)
        .run({ id: requiredText(id, "Student id"), deletedAt: now(), updatedAt: now() });
      return { success: result.changes === 1 };
    },

    getStudentImportTemplate() {
      return {
        columns: STUDENT_IMPORT_TEMPLATE_COLUMNS,
        sampleRows: [
          [
            "VSE-2026-001",
            "Sample Student",
            "10",
            "A",
            "Sample Guardian",
            "9876543210",
            "School Road, City",
            "2011-05-15",
            "2026-04-01",
            "Active",
          ],
        ],
        filename: "vidhya-student-import-template.xlsx",
      };
    },

    importStudentsBulk(rows, options = {}) {
      if (!Array.isArray(rows)) {
        throw new Error("Student import rows must be an array.");
      }
      if (rows.length === 0) {
        throw new Error("No student rows were provided for import.");
      }
      if (rows.length > 5000) {
        throw new Error("A maximum of 5,000 students can be imported at once.");
      }
      const mode = options?.mode === "update" ? "update" : "skip";
      const autoCreateMasters = options?.autoCreateMasters === true;
      const result = {
        totalRows: rows.length,
        imported: 0,
        inserted: 0,
        updated: 0,
        skipped: 0,
        duplicates: 0,
        errors: [],
        classesCreated: 0,
        sectionsCreated: 0,
      };
      const seenAdmissionNumbers = new Set();

      const importTransaction = db.transaction(() => {
        for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
          const input = rows[rowIndex] ?? {};
          const providedFields = Array.isArray(input.providedFields)
            ? new Set(input.providedFields.map(optionalText))
            : null;
          const wasProvided = (fieldName) =>
            !providedFields || providedFields.has(fieldName);
          const rowNumber =
            Number.isInteger(Number(input.rowNumber)) &&
            Number(input.rowNumber) > 0
              ? Number(input.rowNumber)
              : rowIndex + 2;
          let admissionNo = optionalText(input.admissionNo);

          try {
            admissionNo = importText(
              input.admissionNo,
              "Admission number",
              100,
              true,
            );
            const normalizedAdmissionNo = admissionNo.toLowerCase();
            if (seenAdmissionNumbers.has(normalizedAdmissionNo)) {
              result.duplicates += 1;
              result.skipped += 1;
              continue;
            }
            seenAdmissionNumbers.add(normalizedAdmissionNo);

            const name = importText(
              input.name,
              "Student name",
              200,
              true,
            );
            const className = importText(
              input.className,
              "Class",
              100,
              true,
            );
            const section = importText(input.section, "Section", 100);
            const guardianName = importText(
              input.guardianName,
              "Guardian name",
              200,
            );
            const mobile = importText(input.mobile, "Mobile", 50);
            const fatherName = importText(
              input.fatherName,
              "Father name",
              200,
            );
            const motherName = importText(
              input.motherName,
              "Mother name",
              200,
            );
            const address = importText(input.address, "Address", 1000);
            const email = importText(input.email, "Email", 254);
            if (
              email &&
              !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
            ) {
              throw new StudentImportValidationError(
                "Email address is invalid.",
              );
            }
            const gender = importText(input.gender, "Gender", 50);
            const bloodGroup = importText(
              input.bloodGroup,
              "Blood group",
              20,
            );
            const aadharNo = importText(input.aadharNo, "Aadhar number", 30);
            const previousSchool = importText(
              input.previousSchool,
              "Previous school",
              300,
            );
            const notes = importText(input.notes, "Notes", 2000);
            const dateOfBirth = normalizeOptionalImportDate(
              input.dateOfBirth,
              "Date of birth",
            );
            const admissionDate = normalizeOptionalImportDate(
              input.admissionDate,
              "Admission date",
            );
            const rawStatus = optionalText(input.status) || "Active";
            const status =
              rawStatus.toLowerCase() === "active"
                ? "Active"
                : rawStatus.toLowerCase() === "inactive"
                  ? "Inactive"
                  : "";
            if (!status) {
              throw new StudentImportValidationError(
                "Status must be Active or Inactive.",
              );
            }

            const existingStudent = db
              .prepare(`
                SELECT *
                FROM students
                WHERE admission_no = ? COLLATE NOCASE
              `)
              .get(admissionNo);
            if (existingStudent?.deleted_at) {
              result.duplicates += 1;
              result.skipped += 1;
              result.errors.push({
                rowNumber,
                admissionNo,
                message:
                  "A soft-deleted student already uses this admission number.",
              });
              continue;
            }
            if (existingStudent && mode === "skip") {
              result.duplicates += 1;
              result.skipped += 1;
              continue;
            }

            let schoolClass = db
              .prepare(`
                SELECT *
                FROM classes
                WHERE name = ? COLLATE NOCASE AND deleted_at IS NULL
              `)
              .get(className);
            if (schoolClass?.status !== "Active") {
              if (schoolClass) {
                throw new StudentImportValidationError(
                  `Class "${className}" is inactive.`,
                );
              }
              if (!autoCreateMasters) {
                throw new StudentImportValidationError(
                  `Class "${className}" does not exist.`,
                );
              }
              const nextDisplayOrder =
                Number(
                  db
                    .prepare(
                      "SELECT MAX(display_order) AS maximum FROM classes",
                    )
                    .get()?.maximum ?? 0,
                ) + 1;
              const createdClass = this.createClass({
                name: className,
                displayOrder: nextDisplayOrder,
                status: "Active",
              });
              result.classesCreated += 1;
              schoolClass = db
                .prepare("SELECT * FROM classes WHERE id = ?")
                .get(createdClass.id);
            }

            if (section) {
              const schoolSection = db
                .prepare(`
                  SELECT *
                  FROM sections
                  WHERE class_id = ?
                    AND name = ? COLLATE NOCASE
                    AND deleted_at IS NULL
                `)
                .get(schoolClass.id, section);
              if (schoolSection?.status !== "Active") {
                if (schoolSection) {
                  throw new StudentImportValidationError(
                    `Section "${section}" is inactive for class "${className}".`,
                  );
                }
                if (!autoCreateMasters) {
                  throw new StudentImportValidationError(
                    `Section "${section}" does not exist for class "${className}".`,
                  );
                }
                this.createSection({
                  classId: schoolClass.id,
                  name: section,
                  status: "Active",
                });
                result.sectionsCreated += 1;
              }
            }

            const studentValues = {
              id: existingStudent?.id ?? crypto.randomUUID(),
              admissionNo,
              name,
              className: schoolClass.name,
              section:
                existingStudent && !wasProvided("section")
                  ? existingStudent.section ?? ""
                  : section,
              guardianName:
                existingStudent && !wasProvided("guardianName")
                  ? existingStudent.guardian_name ?? ""
                  : guardianName,
              mobile:
                existingStudent && !wasProvided("mobile")
                  ? existingStudent.mobile ?? ""
                  : mobile,
              fatherName:
                existingStudent && !wasProvided("fatherName")
                  ? existingStudent.father_name ?? ""
                  : fatherName,
              motherName:
                existingStudent && !wasProvided("motherName")
                  ? existingStudent.mother_name ?? ""
                  : motherName,
              email:
                existingStudent && !wasProvided("email")
                  ? existingStudent.email ?? ""
                  : email,
              gender:
                existingStudent && !wasProvided("gender")
                  ? existingStudent.gender ?? ""
                  : gender,
              bloodGroup:
                existingStudent && !wasProvided("bloodGroup")
                  ? existingStudent.blood_group ?? ""
                  : bloodGroup,
              aadharNo:
                existingStudent && !wasProvided("aadharNo")
                  ? existingStudent.aadhar_no ?? ""
                  : aadharNo,
              previousSchool:
                existingStudent && !wasProvided("previousSchool")
                  ? existingStudent.previous_school ?? ""
                  : previousSchool,
              notes:
                existingStudent && !wasProvided("notes")
                  ? existingStudent.notes ?? ""
                  : notes,
              status:
                existingStudent && !wasProvided("status")
                  ? existingStudent.status
                  : status,
              address:
                existingStudent && !wasProvided("address")
                  ? existingStudent.address ?? ""
                  : address,
              dateOfBirth:
                existingStudent && !wasProvided("dateOfBirth")
                  ? existingStudent.date_of_birth ?? ""
                  : dateOfBirth,
              admissionDate:
                existingStudent && !wasProvided("admissionDate")
                  ? existingStudent.admission_date ?? ""
                  : admissionDate,
              createdAt: existingStudent?.created_at ?? now(),
              updatedAt: now(),
            };

            if (existingStudent) {
              updateStudentStatement.run(studentValues);
              result.updated += 1;
            } else {
              insertStudentStatement.run(studentValues);
              result.inserted += 1;
            }
            result.imported += 1;
          } catch (error) {
            if (!(error instanceof StudentImportValidationError)) {
              throw error;
            }
            result.skipped += 1;
            result.errors.push({
              rowNumber,
              admissionNo,
              message: error.message,
            });
          }
        }
      });

      importTransaction();
      return result;
    },

    getSchoolSettings() {
      const row = db
        .prepare("SELECT * FROM school_settings WHERE id = ?")
        .get(DEFAULT_SETTINGS_ID);
      return settingsFromRow(row);
    },

    saveSchoolSettings(input) {
      const existing = db
        .prepare("SELECT * FROM school_settings WHERE id = ?")
        .get(DEFAULT_SETTINGS_ID);
      const existingSettings = settingsFromRow(existing);
      const updatedAt = now();

      db.prepare(`
        UPDATE school_settings
        SET school_name = @schoolName,
            address = @address,
            phone = @phone,
            email = @email,
            academic_year = @academicYear,
            receipt_prefix = @receiptPrefix,
            updated_at = @updatedAt
        WHERE id = @id
      `).run({
        id: DEFAULT_SETTINGS_ID,
        schoolName: requiredText(input?.schoolName, "School name"),
        address: optionalText(input?.address),
        phone: optionalText(input?.phone),
        email: optionalText(input?.email),
        academicYear: optionalText(input?.academicYear),
        receiptPrefix: optionalText(input?.receiptPrefix) || "VSE-RC",
        updatedAt,
      });

      return settingsFromRow(
        db.prepare("SELECT * FROM school_settings WHERE id = ?").get(existingSettings.id),
      );
    },

    getFeePayments() {
      return getPaymentsStatement.all().map(paymentFromRow);
    },

    getFeePaymentsByDateRange(startDate, endDate) {
      const normalizedStart = normalizeDate(startDate, "Start date");
      const normalizedEnd = normalizeDate(endDate, "End date");
      if (normalizedStart > normalizedEnd) {
        throw new Error("Start date must be before or equal to end date.");
      }

      return db
        .prepare(`
          ${paymentSelect}
          WHERE date(fee_payments.payment_date)
            BETWEEN date(?) AND date(?)
          ORDER BY fee_payments.payment_date DESC, fee_payments.created_at DESC
        `)
        .all(normalizedStart, normalizedEnd)
        .map(paymentFromRow);
    },

    createFeePayment(input) {
      const amount = Number(input?.amount);
      if (!Number.isInteger(amount) || amount <= 0) {
        throw new Error("Payment amount must be a positive whole number.");
      }

      const paymentMode = optionalText(input?.paymentMode) || "Cash";
      if (!PAYMENT_MODES.has(paymentMode)) {
        throw new Error("Payment mode is invalid.");
      }

      const studentId = requiredText(input?.studentId, "Student");
      const student = getStudentStatement.get(studentId);
      if (!student) {
        throw new Error("The selected student was not found.");
      }
      const feeType = requiredText(input?.feeType, "Fee type");
      const feeHead = db
        .prepare(`
          SELECT id
          FROM fee_heads
          WHERE name = ? COLLATE NOCASE
            AND status = 'Active'
            AND deleted_at IS NULL
        `)
        .get(feeType);
      if (!feeHead) {
        throw new Error("Select an active fee head from Settings.");
      }

      const timestamp = now();
      const paymentDate = normalizeDate(
        optionalText(input?.paymentDate) || timestamp.slice(0, 10),
        "Payment date",
      );
      const id = crypto.randomUUID();
      db.transaction(() => {
        const receiptNo = generateReceiptNumber(paymentDate);
        const cashierName = optionalText(input?.cashierName);
        db.prepare(`
          INSERT INTO fee_payments (
            id, receipt_no, student_id, student_name, admission_no, class_name,
            section, guardian_name, mobile, fee_type, amount, payment_mode,
            payment_date, notes, cashier_name, created_at, updated_at,
            sync_status
          ) VALUES (
            @id, @receiptNo, @studentId, @studentName, @admissionNo, @className,
            @section, @guardianName, @mobile, @feeType, @amount, @paymentMode,
            @paymentDate, @notes, @cashierName, @createdAt, @updatedAt,
            'pending'
          )
        `).run({
          id,
          receiptNo,
          studentId,
          studentName: student.name,
          admissionNo: student.admission_no,
          className: student.class_name,
          section: student.section ?? "",
          guardianName: student.guardian_name ?? "",
          mobile: student.mobile ?? "",
          feeType,
          amount,
          paymentMode,
          paymentDate,
          notes: optionalText(input?.notes),
          cashierName,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
        createLinkedAccountTransaction({
          type: "Income",
          category: resolveFeeIncomeCategory(feeType),
          title: `${feeType} - ${student.name}`,
          amount,
          paymentMode,
          transactionDate: paymentDate,
          referenceNo: receiptNo,
          linkedModule: "Fees",
          linkedRecordId: id,
          notes: optionalText(input?.notes),
          createdBy: cashierName,
        });
      })();

      return paymentFromRow(
        db.prepare(`
          ${paymentSelect}
          WHERE fee_payments.id = ?
        `).get(id),
      );
    },

    getAttendance() {
      return db
        .prepare(`
          ${attendanceSelect}
          ORDER BY attendance.attendance_date DESC, attendance.student_name
        `)
        .all()
        .map(attendanceFromRow);
    },

    getAttendanceByDate(date) {
      const attendanceDate = normalizeDate(date, "Attendance date");
      return db
        .prepare(`
          ${attendanceSelect}
          WHERE attendance.attendance_date = ?
          ORDER BY attendance.class_name, attendance.section, attendance.student_name
        `)
        .all(attendanceDate)
        .map(attendanceFromRow);
    },

    getAttendanceByClassDate(className, section, date) {
      const normalizedClass = requiredText(className, "Class");
      const sectionValue = optionalText(section);
      const normalizedSection =
        sectionValue.toLowerCase() === "all" ? "" : sectionValue;
      const attendanceDate = normalizeDate(date, "Attendance date");
      const sectionFilter = normalizedSection
        ? "AND COALESCE(attendance.section, '') = ?"
        : "";
      const parameters = normalizedSection
        ? [normalizedClass, attendanceDate, normalizedSection]
        : [normalizedClass, attendanceDate];

      return db
        .prepare(`
          ${attendanceSelect}
          WHERE attendance.class_name = ?
            AND attendance.attendance_date = ?
            ${sectionFilter}
          ORDER BY attendance.student_name
        `)
        .all(...parameters)
        .map(attendanceFromRow);
    },

    getAttendanceByDateRange(startDate, endDate) {
      const normalizedStart = normalizeDate(startDate, "Start date");
      const normalizedEnd = normalizeDate(endDate, "End date");
      if (normalizedStart > normalizedEnd) {
        throw new Error("Start date must be before or equal to end date.");
      }

      return db
        .prepare(`
          ${attendanceSelect}
          WHERE attendance.attendance_date BETWEEN ? AND ?
          ORDER BY attendance.attendance_date DESC,
                   attendance.class_name,
                   attendance.section,
                   attendance.student_name
        `)
        .all(normalizedStart, normalizedEnd)
        .map(attendanceFromRow);
    },

    getAttendanceSummary(startDate, endDate) {
      const normalizedStart = normalizeDate(startDate, "Start date");
      const normalizedEnd = normalizeDate(endDate, "End date");
      if (normalizedStart > normalizedEnd) {
        throw new Error("Start date must be before or equal to end date.");
      }

      const summary = db
        .prepare(`
          SELECT
            COUNT(*) AS total_marked,
            SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS present,
            SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS absent,
            SUM(CASE WHEN status = 'Leave' THEN 1 ELSE 0 END) AS leave_count
          FROM attendance
          WHERE attendance_date BETWEEN ? AND ?
        `)
        .get(normalizedStart, normalizedEnd);
      const totalMarked = Number(summary.total_marked ?? 0);
      const present = Number(summary.present ?? 0);

      return {
        startDate: normalizedStart,
        endDate: normalizedEnd,
        totalMarked,
        present,
        absent: Number(summary.absent ?? 0),
        leave: Number(summary.leave_count ?? 0),
        percentage:
          totalMarked > 0
            ? Math.round((present / totalMarked) * 10000) / 100
            : null,
      };
    },

    saveAttendanceBulk(records) {
      if (!Array.isArray(records)) {
        throw new Error("Attendance records must be an array.");
      }
      if (records.length === 0) {
        return [];
      }

      const savedIds = db.transaction(() =>
        records.map((input) => {
          const status = requiredText(input?.status, "Attendance status");
          if (!ATTENDANCE_STATUSES.has(status)) {
            throw new Error("Attendance status is invalid.");
          }
          const studentId = requiredText(input?.studentId, "Student id");
          const student = getStudentStatement.get(studentId);
          if (!student) {
            throw new Error("A selected student was not found.");
          }
          const attendanceDate = normalizeDate(
            input?.attendanceDate,
            "Attendance date",
          );
          const existing = db
            .prepare(`
              SELECT id, created_at
              FROM attendance
              WHERE student_id = ? AND attendance_date = ?
            `)
            .get(studentId, attendanceDate);
          const timestamp = now();
          const id = existing?.id ?? crypto.randomUUID();

          db.prepare(`
            INSERT INTO attendance (
              id, student_id, student_name, admission_no, class_name, section,
              attendance_date, status, remarks, created_at, updated_at,
              sync_status
            ) VALUES (
              @id, @studentId, @studentName, @admissionNo, @className, @section,
              @attendanceDate, @status, @remarks, @createdAt, @updatedAt,
              'pending'
            )
            ON CONFLICT(student_id, attendance_date) DO UPDATE SET
              student_name = excluded.student_name,
              admission_no = excluded.admission_no,
              class_name = excluded.class_name,
              section = excluded.section,
              status = excluded.status,
              remarks = excluded.remarks,
              updated_at = excluded.updated_at,
              sync_status = 'pending'
          `).run({
            id,
            studentId,
            studentName: student.name,
            admissionNo: student.admission_no,
            className: student.class_name,
            section: student.section ?? "",
            attendanceDate,
            status,
            remarks: optionalText(input?.remarks),
            createdAt: existing?.created_at ?? timestamp,
            updatedAt: timestamp,
          });

          return id;
        }),
      )();

      const getSavedAttendance = db.prepare(`
        ${attendanceSelect}
        WHERE attendance.id = ?
      `);
      return savedIds.map((id) =>
        attendanceFromRow(getSavedAttendance.get(id)),
      );
    },

    saveAttendance(input) {
      return this.saveAttendanceBulk([input])[0];
    },

    updateAttendance(id, input) {
      const attendanceId = requiredText(id, "Attendance id");
      const existing = db
        .prepare("SELECT * FROM attendance WHERE id = ?")
        .get(attendanceId);
      if (!existing) {
        throw new Error("Attendance record was not found.");
      }
      const status =
        input?.status === undefined
          ? existing.status
          : requiredText(input.status, "Attendance status");
      if (!ATTENDANCE_STATUSES.has(status)) {
        throw new Error("Attendance status is invalid.");
      }

      db.prepare(`
        UPDATE attendance
        SET status = @status,
            remarks = @remarks,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id
      `).run({
        id: attendanceId,
        status,
        remarks:
          input?.remarks === undefined
            ? existing.remarks ?? ""
            : optionalText(input.remarks),
        updatedAt: now(),
      });

      return attendanceFromRow(
        db
          .prepare(`
            ${attendanceSelect}
            WHERE attendance.id = ?
          `)
          .get(attendanceId),
      );
    },

    getClasses() {
      return db
        .prepare(`
          SELECT *
          FROM classes
          WHERE deleted_at IS NULL
          ORDER BY display_order, name COLLATE NOCASE
        `)
        .all()
        .map(classFromRow);
    },

    createClass(input) {
      const name = requiredText(input?.name, "Class name");
      const duplicate = db
        .prepare(`
          SELECT id FROM classes
          WHERE name = ? COLLATE NOCASE AND deleted_at IS NULL
        `)
        .get(name);
      if (duplicate) {
        throw new Error("A class with this name already exists.");
      }

      const timestamp = now();
      const id = crypto.randomUUID();
      db.prepare(`
        INSERT INTO classes (
          id, name, display_order, status, created_at, updated_at, deleted_at,
          sync_status
        ) VALUES (
          @id, @name, @displayOrder, @status, @createdAt, @updatedAt, NULL,
          'pending'
        )
      `).run({
        id,
        name,
        displayOrder: displayOrder(input?.displayOrder),
        status: masterStatus(input?.status),
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      return classFromRow(getActiveClassById.get(id));
    },

    updateClass(id, input) {
      const classId = requiredText(id, "Class id");
      const existing = getActiveClassById.get(classId);
      if (!existing) {
        throw new Error("Class record was not found.");
      }

      const name =
        input?.name === undefined
          ? existing.name
          : requiredText(input.name, "Class name");
      const duplicate = db
        .prepare(`
          SELECT id FROM classes
          WHERE name = ? COLLATE NOCASE
            AND id <> ?
            AND deleted_at IS NULL
        `)
        .get(name, classId);
      if (duplicate) {
        throw new Error("A class with this name already exists.");
      }

      const updatedAt = now();
      db.transaction(() => {
        db.prepare(`
          UPDATE classes
          SET name = @name,
              display_order = @displayOrder,
              status = @status,
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE id = @id AND deleted_at IS NULL
        `).run({
          id: classId,
          name,
          displayOrder: displayOrder(input?.displayOrder, existing.display_order ?? 0),
          status: masterStatus(input?.status, existing.status),
          updatedAt,
        });

        if (name !== existing.name) {
          db.prepare(`
            UPDATE sections
            SET class_name = ?, updated_at = ?, sync_status = 'pending'
            WHERE class_id = ? AND deleted_at IS NULL
          `).run(name, updatedAt, classId);
          db.prepare(`
            UPDATE fee_structures
            SET class_name = ?, updated_at = ?, sync_status = 'pending'
            WHERE class_name = ? AND deleted_at IS NULL
          `).run(name, updatedAt, existing.name);
          db.prepare(`
            UPDATE subjects
            SET class_name = ?, updated_at = ?, sync_status = 'pending'
            WHERE class_name = ? AND deleted_at IS NULL
          `).run(name, updatedAt, existing.name);
          db.prepare(`
            UPDATE exams
            SET class_name = ?, updated_at = ?, sync_status = 'pending'
            WHERE class_name = ? AND deleted_at IS NULL
          `).run(name, updatedAt, existing.name);
          db.prepare(`
            UPDATE marks
            SET class_name = ?, updated_at = ?, sync_status = 'pending'
            WHERE class_name = ?
          `).run(name, updatedAt, existing.name);
        }
      })();

      return classFromRow(getActiveClassById.get(classId));
    },

    deleteClass(id) {
      const classId = requiredText(id, "Class id");
      const existing = getActiveClassById.get(classId);
      if (!existing) {
        return { success: false };
      }
      const deletedAt = now();
      const result = db.transaction(() => {
        const classResult = db
          .prepare(`
            UPDATE classes
            SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
            WHERE id = ? AND deleted_at IS NULL
          `)
          .run(deletedAt, deletedAt, classId);
        db.prepare(`
          UPDATE sections
          SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
          WHERE class_id = ? AND deleted_at IS NULL
        `).run(deletedAt, deletedAt, classId);
        db.prepare(`
          UPDATE fee_structures
          SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
          WHERE class_name = ? AND deleted_at IS NULL
        `).run(deletedAt, deletedAt, existing.name);
        db.prepare(`
          UPDATE subjects
          SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
          WHERE class_name = ? AND deleted_at IS NULL
        `).run(deletedAt, deletedAt, existing.name);
        db.prepare(`
          UPDATE exams
          SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
          WHERE class_name = ? AND deleted_at IS NULL
        `).run(deletedAt, deletedAt, existing.name);
        return classResult;
      })();
      return { success: result.changes === 1 };
    },

    getSections() {
      return db
        .prepare(`
          SELECT *
          FROM sections
          WHERE deleted_at IS NULL
          ORDER BY class_name COLLATE NOCASE, name COLLATE NOCASE
        `)
        .all()
        .map(sectionFromRow);
    },

    createSection(input) {
      const classId = requiredText(input?.classId, "Class");
      const schoolClass = getActiveClassById.get(classId);
      if (!schoolClass || schoolClass.status !== "Active") {
        throw new Error("Select an active class.");
      }
      const name = requiredText(input?.name, "Section name");
      const duplicate = db
        .prepare(`
          SELECT id
          FROM sections
          WHERE class_id = ?
            AND name = ? COLLATE NOCASE
            AND deleted_at IS NULL
        `)
        .get(classId, name);
      if (duplicate) {
        throw new Error("This section already exists for the selected class.");
      }

      const timestamp = now();
      const id = crypto.randomUUID();
      db.prepare(`
        INSERT INTO sections (
          id, class_id, class_name, name, status, created_at, updated_at,
          deleted_at, sync_status
        ) VALUES (
          @id, @classId, @className, @name, @status, @createdAt, @updatedAt,
          NULL, 'pending'
        )
      `).run({
        id,
        classId,
        className: schoolClass.name,
        name,
        status: masterStatus(input?.status),
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      return sectionFromRow(
        db
          .prepare("SELECT * FROM sections WHERE id = ? AND deleted_at IS NULL")
          .get(id),
      );
    },

    updateSection(id, input) {
      const sectionId = requiredText(id, "Section id");
      const existing = db
        .prepare("SELECT * FROM sections WHERE id = ? AND deleted_at IS NULL")
        .get(sectionId);
      if (!existing) {
        throw new Error("Section record was not found.");
      }

      const classId = optionalText(input?.classId) || existing.class_id;
      const schoolClass = getActiveClassById.get(classId);
      if (!schoolClass || schoolClass.status !== "Active") {
        throw new Error("Select an active class.");
      }
      const name =
        input?.name === undefined
          ? existing.name
          : requiredText(input.name, "Section name");
      const duplicate = db
        .prepare(`
          SELECT id
          FROM sections
          WHERE class_id = ?
            AND name = ? COLLATE NOCASE
            AND id <> ?
            AND deleted_at IS NULL
        `)
        .get(classId, name, sectionId);
      if (duplicate) {
        throw new Error("This section already exists for the selected class.");
      }

      db.prepare(`
        UPDATE sections
        SET class_id = @classId,
            class_name = @className,
            name = @name,
            status = @status,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id AND deleted_at IS NULL
      `).run({
        id: sectionId,
        classId,
        className: schoolClass.name,
        name,
        status: masterStatus(input?.status, existing.status),
        updatedAt: now(),
      });

      const updatedAt = now();
      if (
        existing.class_name !== schoolClass.name ||
        existing.name !== name
      ) {
        db.prepare(`
          UPDATE exams
          SET class_name = ?, section = ?, updated_at = ?, sync_status = 'pending'
          WHERE class_name = ? AND section = ? AND deleted_at IS NULL
        `).run(
          schoolClass.name,
          name,
          updatedAt,
          existing.class_name,
          existing.name,
        );
        db.prepare(`
          UPDATE marks
          SET class_name = ?, section = ?, updated_at = ?, sync_status = 'pending'
          WHERE class_name = ? AND section = ?
        `).run(
          schoolClass.name,
          name,
          updatedAt,
          existing.class_name,
          existing.name,
        );
      }

      return sectionFromRow(
        db
          .prepare("SELECT * FROM sections WHERE id = ? AND deleted_at IS NULL")
          .get(sectionId),
      );
    },

    deleteSection(id) {
      const timestamp = now();
      const result = db
        .prepare(`
          UPDATE sections
          SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
          WHERE id = ? AND deleted_at IS NULL
        `)
        .run(timestamp, timestamp, requiredText(id, "Section id"));
      return { success: result.changes === 1 };
    },

    getFeeHeads() {
      return db
        .prepare(`
          SELECT *
          FROM fee_heads
          WHERE deleted_at IS NULL
          ORDER BY name COLLATE NOCASE
        `)
        .all()
        .map(feeHeadFromRow);
    },

    createFeeHead(input) {
      const name = requiredText(input?.name, "Fee head name");
      const duplicate = db
        .prepare(`
          SELECT id FROM fee_heads
          WHERE name = ? COLLATE NOCASE AND deleted_at IS NULL
        `)
        .get(name);
      if (duplicate) {
        throw new Error("A fee head with this name already exists.");
      }
      const frequency = requiredText(input?.frequency, "Frequency");
      if (!FEE_FREQUENCIES.has(frequency)) {
        throw new Error("Fee frequency is invalid.");
      }

      const timestamp = now();
      const id = crypto.randomUUID();
      db.prepare(`
        INSERT INTO fee_heads (
          id, name, description, frequency, status, created_at, updated_at,
          deleted_at, sync_status
        ) VALUES (
          @id, @name, @description, @frequency, @status, @createdAt,
          @updatedAt, NULL, 'pending'
        )
      `).run({
        id,
        name,
        description: optionalText(input?.description),
        frequency,
        status: masterStatus(input?.status),
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      return feeHeadFromRow(
        db
          .prepare("SELECT * FROM fee_heads WHERE id = ? AND deleted_at IS NULL")
          .get(id),
      );
    },

    updateFeeHead(id, input) {
      const feeHeadId = requiredText(id, "Fee head id");
      const existing = getActiveFeeHeadById.get(feeHeadId);
      if (!existing) {
        throw new Error("Fee head record was not found.");
      }

      const name =
        input?.name === undefined
          ? existing.name
          : requiredText(input.name, "Fee head name");
      const duplicate = db
        .prepare(`
          SELECT id FROM fee_heads
          WHERE name = ? COLLATE NOCASE
            AND id <> ?
            AND deleted_at IS NULL
        `)
        .get(name, feeHeadId);
      if (duplicate) {
        throw new Error("A fee head with this name already exists.");
      }
      const frequency =
        input?.frequency === undefined
          ? existing.frequency
          : requiredText(input.frequency, "Frequency");
      if (!FEE_FREQUENCIES.has(frequency)) {
        throw new Error("Fee frequency is invalid.");
      }

      const updatedAt = now();
      db.transaction(() => {
        db.prepare(`
          UPDATE fee_heads
          SET name = @name,
              description = @description,
              frequency = @frequency,
              status = @status,
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE id = @id AND deleted_at IS NULL
        `).run({
          id: feeHeadId,
          name,
          description:
            input?.description === undefined
              ? existing.description ?? ""
              : optionalText(input.description),
          frequency,
          status: masterStatus(input?.status, existing.status),
          updatedAt,
        });

        if (name !== existing.name) {
          db.prepare(`
            UPDATE fee_structures
            SET fee_head_name = ?, updated_at = ?, sync_status = 'pending'
            WHERE fee_head_id = ? AND deleted_at IS NULL
          `).run(name, updatedAt, feeHeadId);
        }
      })();

      return feeHeadFromRow(getActiveFeeHeadById.get(feeHeadId));
    },

    deleteFeeHead(id) {
      const feeHeadId = requiredText(id, "Fee head id");
      const existing = getActiveFeeHeadById.get(feeHeadId);
      if (!existing) {
        return { success: false };
      }
      const deletedAt = now();
      const result = db.transaction(() => {
        const feeHeadResult = db
          .prepare(`
            UPDATE fee_heads
            SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
            WHERE id = ? AND deleted_at IS NULL
          `)
          .run(deletedAt, deletedAt, feeHeadId);
        db.prepare(`
          UPDATE fee_structures
          SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
          WHERE fee_head_id = ? AND deleted_at IS NULL
        `).run(deletedAt, deletedAt, feeHeadId);
        return feeHeadResult;
      })();
      return { success: result.changes === 1 };
    },

    getFeeStructures() {
      return db
        .prepare(`
          SELECT *
          FROM fee_structures
          WHERE deleted_at IS NULL
          ORDER BY class_name COLLATE NOCASE, fee_head_name COLLATE NOCASE
        `)
        .all()
        .map(feeStructureFromRow);
    },

    createFeeStructure(input) {
      const className = requiredText(input?.className, "Class");
      const schoolClass = getActiveClassByName.get(className);
      if (!schoolClass || schoolClass.status !== "Active") {
        throw new Error("Select an active class.");
      }
      const feeHeadId = requiredText(input?.feeHeadId, "Fee head");
      const feeHead = getActiveFeeHeadById.get(feeHeadId);
      if (!feeHead || feeHead.status !== "Active") {
        throw new Error("Select an active fee head.");
      }
      const amount = Number(input?.amount);
      if (!Number.isInteger(amount) || amount <= 0) {
        throw new Error("Fee amount must be a positive whole number.");
      }
      const academicYear = optionalText(input?.academicYear);
      const duplicate = db
        .prepare(`
          SELECT id
          FROM fee_structures
          WHERE class_name = ? COLLATE NOCASE
            AND fee_head_id = ?
            AND academic_year = ?
            AND deleted_at IS NULL
        `)
        .get(schoolClass.name, feeHeadId, academicYear);
      if (duplicate) {
        throw new Error(
          "This fee head is already configured for the class and academic year.",
        );
      }

      const timestamp = now();
      const id = crypto.randomUUID();
      db.prepare(`
        INSERT INTO fee_structures (
          id, class_name, fee_head_id, fee_head_name, amount, academic_year,
          status, created_at, updated_at, deleted_at, sync_status
        ) VALUES (
          @id, @className, @feeHeadId, @feeHeadName, @amount, @academicYear,
          @status, @createdAt, @updatedAt, NULL, 'pending'
        )
      `).run({
        id,
        className: schoolClass.name,
        feeHeadId,
        feeHeadName: feeHead.name,
        amount,
        academicYear,
        status: masterStatus(input?.status),
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      return feeStructureFromRow(
        db
          .prepare(
            "SELECT * FROM fee_structures WHERE id = ? AND deleted_at IS NULL",
          )
          .get(id),
      );
    },

    updateFeeStructure(id, input) {
      const feeStructureId = requiredText(id, "Fee structure id");
      const existing = db
        .prepare(
          "SELECT * FROM fee_structures WHERE id = ? AND deleted_at IS NULL",
        )
        .get(feeStructureId);
      if (!existing) {
        throw new Error("Fee structure record was not found.");
      }

      const className =
        input?.className === undefined
          ? existing.class_name
          : requiredText(input.className, "Class");
      const schoolClass = getActiveClassByName.get(className);
      if (!schoolClass || schoolClass.status !== "Active") {
        throw new Error("Select an active class.");
      }
      const feeHeadId = optionalText(input?.feeHeadId) || existing.fee_head_id;
      const feeHead = getActiveFeeHeadById.get(feeHeadId);
      if (!feeHead || feeHead.status !== "Active") {
        throw new Error("Select an active fee head.");
      }
      const amount =
        input?.amount === undefined ? existing.amount : Number(input.amount);
      if (!Number.isInteger(amount) || amount <= 0) {
        throw new Error("Fee amount must be a positive whole number.");
      }
      const academicYear =
        input?.academicYear === undefined
          ? existing.academic_year ?? ""
          : optionalText(input.academicYear);
      const duplicate = db
        .prepare(`
          SELECT id
          FROM fee_structures
          WHERE class_name = ? COLLATE NOCASE
            AND fee_head_id = ?
            AND academic_year = ?
            AND id <> ?
            AND deleted_at IS NULL
        `)
        .get(schoolClass.name, feeHeadId, academicYear, feeStructureId);
      if (duplicate) {
        throw new Error(
          "This fee head is already configured for the class and academic year.",
        );
      }

      db.prepare(`
        UPDATE fee_structures
        SET class_name = @className,
            fee_head_id = @feeHeadId,
            fee_head_name = @feeHeadName,
            amount = @amount,
            academic_year = @academicYear,
            status = @status,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id AND deleted_at IS NULL
      `).run({
        id: feeStructureId,
        className: schoolClass.name,
        feeHeadId,
        feeHeadName: feeHead.name,
        amount,
        academicYear,
        status: masterStatus(input?.status, existing.status),
        updatedAt: now(),
      });

      return feeStructureFromRow(
        db
          .prepare(
            "SELECT * FROM fee_structures WHERE id = ? AND deleted_at IS NULL",
          )
          .get(feeStructureId),
      );
    },

    deleteFeeStructure(id) {
      const timestamp = now();
      const result = db
        .prepare(`
          UPDATE fee_structures
          SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
          WHERE id = ? AND deleted_at IS NULL
        `)
        .run(timestamp, timestamp, requiredText(id, "Fee structure id"));
      return { success: result.changes === 1 };
    },

    getSubjects() {
      return db
        .prepare(`
          SELECT *
          FROM subjects
          WHERE deleted_at IS NULL
          ORDER BY class_name COLLATE NOCASE, name COLLATE NOCASE
        `)
        .all()
        .map(subjectFromRow);
    },

    createSubject(input) {
      const name = requiredText(input?.name, "Subject name");
      const className = requiredText(input?.className, "Class");
      const schoolClass = getActiveClassByName.get(className);
      if (!schoolClass || schoolClass.status !== "Active") {
        throw new Error("Select an active class.");
      }
      const maxMarks = wholeNumber(input?.maxMarks ?? 100, "Maximum marks", 1);
      const passingMarks = wholeNumber(
        input?.passingMarks ?? 33,
        "Passing marks",
      );
      if (passingMarks > maxMarks) {
        throw new Error("Passing marks cannot exceed maximum marks.");
      }
      const duplicate = db
        .prepare(`
          SELECT id
          FROM subjects
          WHERE name = ? COLLATE NOCASE
            AND class_name = ? COLLATE NOCASE
            AND deleted_at IS NULL
        `)
        .get(name, schoolClass.name);
      if (duplicate) {
        throw new Error("This subject already exists for the selected class.");
      }

      const timestamp = now();
      const id = crypto.randomUUID();
      db.prepare(`
        INSERT INTO subjects (
          id, name, code, class_name, max_marks, passing_marks, status,
          created_at, updated_at, deleted_at, sync_status
        ) VALUES (
          @id, @name, @code, @className, @maxMarks, @passingMarks, @status,
          @createdAt, @updatedAt, NULL, 'pending'
        )
      `).run({
        id,
        name,
        code: optionalText(input?.code),
        className: schoolClass.name,
        maxMarks,
        passingMarks,
        status: masterStatus(input?.status),
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      return subjectFromRow(getActiveSubjectById.get(id));
    },

    updateSubject(id, input) {
      const subjectId = requiredText(id, "Subject id");
      const existing = getActiveSubjectById.get(subjectId);
      if (!existing) {
        throw new Error("Subject record was not found.");
      }
      const name =
        input?.name === undefined
          ? existing.name
          : requiredText(input.name, "Subject name");
      const className =
        input?.className === undefined
          ? existing.class_name
          : requiredText(input.className, "Class");
      const schoolClass = getActiveClassByName.get(className);
      if (!schoolClass || schoolClass.status !== "Active") {
        throw new Error("Select an active class.");
      }
      const maxMarks =
        input?.maxMarks === undefined
          ? existing.max_marks
          : wholeNumber(input.maxMarks, "Maximum marks", 1);
      const passingMarks =
        input?.passingMarks === undefined
          ? existing.passing_marks
          : wholeNumber(input.passingMarks, "Passing marks");
      if (passingMarks > maxMarks) {
        throw new Error("Passing marks cannot exceed maximum marks.");
      }
      const duplicate = db
        .prepare(`
          SELECT id
          FROM subjects
          WHERE name = ? COLLATE NOCASE
            AND class_name = ? COLLATE NOCASE
            AND id <> ?
            AND deleted_at IS NULL
        `)
        .get(name, schoolClass.name, subjectId);
      if (duplicate) {
        throw new Error("This subject already exists for the selected class.");
      }

      db.prepare(`
        UPDATE subjects
        SET name = @name,
            code = @code,
            class_name = @className,
            max_marks = @maxMarks,
            passing_marks = @passingMarks,
            status = @status,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id AND deleted_at IS NULL
      `).run({
        id: subjectId,
        name,
        code:
          input?.code === undefined
            ? existing.code ?? ""
            : optionalText(input.code),
        className: schoolClass.name,
        maxMarks,
        passingMarks,
        status: masterStatus(input?.status, existing.status),
        updatedAt: now(),
      });

      return subjectFromRow(getActiveSubjectById.get(subjectId));
    },

    deleteSubject(id) {
      const timestamp = now();
      const result = db
        .prepare(`
          UPDATE subjects
          SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
          WHERE id = ? AND deleted_at IS NULL
        `)
        .run(timestamp, timestamp, requiredText(id, "Subject id"));
      return { success: result.changes === 1 };
    },

    getExams() {
      return db
        .prepare(`
          SELECT *
          FROM exams
          WHERE deleted_at IS NULL
          ORDER BY exam_date DESC, name COLLATE NOCASE
        `)
        .all()
        .map(examFromRow);
    },

    createExam(input) {
      const name = requiredText(input?.name, "Exam name");
      const className = requiredText(input?.className, "Class");
      const schoolClass = getActiveClassByName.get(className);
      if (!schoolClass || schoolClass.status !== "Active") {
        throw new Error("Select an active class.");
      }
      const section = optionalText(input?.section);
      if (section) {
        const sectionRecord = db
          .prepare(`
            SELECT id
            FROM sections
            WHERE class_name = ? COLLATE NOCASE
              AND name = ? COLLATE NOCASE
              AND status = 'Active'
              AND deleted_at IS NULL
          `)
          .get(schoolClass.name, section);
        if (!sectionRecord) {
          throw new Error("Select an active section for the class.");
        }
      }
      const academicYear = optionalText(input?.academicYear);
      const examDate = normalizeDate(input?.examDate, "Exam date");
      const duplicate = db
        .prepare(`
          SELECT id
          FROM exams
          WHERE name = ? COLLATE NOCASE
            AND class_name = ? COLLATE NOCASE
            AND COALESCE(section, '') = ?
            AND COALESCE(academic_year, '') = ?
            AND deleted_at IS NULL
        `)
        .get(name, schoolClass.name, section, academicYear);
      if (duplicate) {
        throw new Error(
          "This exam already exists for the selected class, section and academic year.",
        );
      }

      const timestamp = now();
      const id = crypto.randomUUID();
      db.prepare(`
        INSERT INTO exams (
          id, name, class_name, section, academic_year, exam_date, status,
          created_at, updated_at, deleted_at, sync_status
        ) VALUES (
          @id, @name, @className, @section, @academicYear, @examDate, @status,
          @createdAt, @updatedAt, NULL, 'pending'
        )
      `).run({
        id,
        name,
        className: schoolClass.name,
        section,
        academicYear,
        examDate,
        status: masterStatus(input?.status),
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      return examFromRow(getActiveExamById.get(id));
    },

    updateExam(id, input) {
      const examId = requiredText(id, "Exam id");
      const existing = getActiveExamById.get(examId);
      if (!existing) {
        throw new Error("Exam record was not found.");
      }
      const name =
        input?.name === undefined
          ? existing.name
          : requiredText(input.name, "Exam name");
      const className =
        input?.className === undefined
          ? existing.class_name
          : requiredText(input.className, "Class");
      const schoolClass = getActiveClassByName.get(className);
      if (!schoolClass || schoolClass.status !== "Active") {
        throw new Error("Select an active class.");
      }
      const section =
        input?.section === undefined
          ? existing.section ?? ""
          : optionalText(input.section);
      if (section) {
        const sectionRecord = db
          .prepare(`
            SELECT id
            FROM sections
            WHERE class_name = ? COLLATE NOCASE
              AND name = ? COLLATE NOCASE
              AND status = 'Active'
              AND deleted_at IS NULL
          `)
          .get(schoolClass.name, section);
        if (!sectionRecord) {
          throw new Error("Select an active section for the class.");
        }
      }
      const academicYear =
        input?.academicYear === undefined
          ? existing.academic_year ?? ""
          : optionalText(input.academicYear);
      const examDate =
        input?.examDate === undefined
          ? existing.exam_date
          : normalizeDate(input.examDate, "Exam date");
      const duplicate = db
        .prepare(`
          SELECT id
          FROM exams
          WHERE name = ? COLLATE NOCASE
            AND class_name = ? COLLATE NOCASE
            AND COALESCE(section, '') = ?
            AND COALESCE(academic_year, '') = ?
            AND id <> ?
            AND deleted_at IS NULL
        `)
        .get(name, schoolClass.name, section, academicYear, examId);
      if (duplicate) {
        throw new Error(
          "This exam already exists for the selected class, section and academic year.",
        );
      }

      const updatedAt = now();
      db.transaction(() => {
        db.prepare(`
          UPDATE exams
          SET name = @name,
              class_name = @className,
              section = @section,
              academic_year = @academicYear,
              exam_date = @examDate,
              status = @status,
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE id = @id AND deleted_at IS NULL
        `).run({
          id: examId,
          name,
          className: schoolClass.name,
          section,
          academicYear,
          examDate,
          status: masterStatus(input?.status, existing.status),
          updatedAt,
        });
        if (name !== existing.name) {
          db.prepare(`
            UPDATE marks
            SET exam_name = ?, updated_at = ?, sync_status = 'pending'
            WHERE exam_id = ?
          `).run(name, updatedAt, examId);
        }
      })();

      return examFromRow(getActiveExamById.get(examId));
    },

    deleteExam(id) {
      const timestamp = now();
      const result = db
        .prepare(`
          UPDATE exams
          SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
          WHERE id = ? AND deleted_at IS NULL
        `)
        .run(timestamp, timestamp, requiredText(id, "Exam id"));
      return { success: result.changes === 1 };
    },

    getMarks() {
      return db
        .prepare(`
          SELECT *
          FROM marks
          ORDER BY exam_name COLLATE NOCASE,
                   student_name COLLATE NOCASE,
                   subject_name COLLATE NOCASE
        `)
        .all()
        .map(markFromRow);
    },

    getMarksByExam(examId) {
      return db
        .prepare(`
          SELECT *
          FROM marks
          WHERE exam_id = ?
          ORDER BY student_name COLLATE NOCASE, subject_name COLLATE NOCASE
        `)
        .all(requiredText(examId, "Exam id"))
        .map(markFromRow);
    },

    getMarksByStudentExam(studentId, examId) {
      return db
        .prepare(`
          SELECT *
          FROM marks
          WHERE student_id = ? AND exam_id = ?
          ORDER BY subject_name COLLATE NOCASE
        `)
        .all(
          requiredText(studentId, "Student id"),
          requiredText(examId, "Exam id"),
        )
        .map(markFromRow);
    },

    saveMarksBulk(records) {
      if (!Array.isArray(records)) {
        throw new Error("Marks records must be an array.");
      }
      if (records.length === 0) {
        return [];
      }

      const savedIds = db.transaction(() =>
        records.map((input) => {
          const examId = requiredText(input?.examId, "Exam id");
          const exam = getActiveExamById.get(examId);
          if (!exam || exam.status !== "Active") {
            throw new Error("Select an active exam.");
          }
          const studentId = requiredText(input?.studentId, "Student id");
          const student = getStudentStatement.get(studentId);
          if (!student || student.status !== "Active") {
            throw new Error("A selected active student was not found.");
          }
          const subjectId = requiredText(input?.subjectId, "Subject id");
          const subject = getActiveSubjectById.get(subjectId);
          if (!subject || subject.status !== "Active") {
            throw new Error("A selected active subject was not found.");
          }
          if (
            student.class_name !== exam.class_name ||
            subject.class_name !== exam.class_name
          ) {
            throw new Error(
              "Exam, student and subject must belong to the same class.",
            );
          }
          if (exam.section && student.section !== exam.section) {
            throw new Error("The student does not belong to the exam section.");
          }
          const maxMarks = Number(subject.max_marks ?? 100);
          const passingMarks = Number(subject.passing_marks ?? 33);
          const obtainedMarks = wholeNumber(
            input?.obtainedMarks,
            "Obtained marks",
          );
          if (obtainedMarks > maxMarks) {
            throw new Error(
              `Obtained marks for ${student.name} in ${subject.name} cannot exceed ${maxMarks}.`,
            );
          }

          const existing = db
            .prepare(`
              SELECT id, created_at
              FROM marks
              WHERE exam_id = ? AND student_id = ? AND subject_id = ?
            `)
            .get(examId, studentId, subjectId);
          const timestamp = now();
          const id = existing?.id ?? crypto.randomUUID();
          db.prepare(`
            INSERT INTO marks (
              id, exam_id, exam_name, student_id, student_name, admission_no,
              class_name, section, subject_id, subject_name, max_marks,
              passing_marks, obtained_marks, remarks, created_at, updated_at,
              sync_status
            ) VALUES (
              @id, @examId, @examName, @studentId, @studentName, @admissionNo,
              @className, @section, @subjectId, @subjectName, @maxMarks,
              @passingMarks, @obtainedMarks, @remarks, @createdAt, @updatedAt,
              'pending'
            )
            ON CONFLICT(exam_id, student_id, subject_id) DO UPDATE SET
              exam_name = excluded.exam_name,
              student_name = excluded.student_name,
              admission_no = excluded.admission_no,
              class_name = excluded.class_name,
              section = excluded.section,
              subject_name = excluded.subject_name,
              max_marks = excluded.max_marks,
              passing_marks = excluded.passing_marks,
              obtained_marks = excluded.obtained_marks,
              remarks = excluded.remarks,
              updated_at = excluded.updated_at,
              sync_status = 'pending'
          `).run({
            id,
            examId,
            examName: exam.name,
            studentId,
            studentName: student.name,
            admissionNo: student.admission_no,
            className: student.class_name,
            section: student.section ?? "",
            subjectId,
            subjectName: subject.name,
            maxMarks,
            passingMarks,
            obtainedMarks,
            remarks: optionalText(input?.remarks),
            createdAt: existing?.created_at ?? timestamp,
            updatedAt: timestamp,
          });

          return id;
        }),
      )();

      const getSavedMark = db.prepare("SELECT * FROM marks WHERE id = ?");
      return savedIds.map((id) => markFromRow(getSavedMark.get(id)));
    },

    updateMark(id, input) {
      const markId = requiredText(id, "Mark id");
      const existing = db.prepare("SELECT * FROM marks WHERE id = ?").get(markId);
      if (!existing) {
        throw new Error("Mark record was not found.");
      }
      const obtainedMarks =
        input?.obtainedMarks === undefined
          ? existing.obtained_marks
          : wholeNumber(input.obtainedMarks, "Obtained marks");
      if (obtainedMarks > existing.max_marks) {
        throw new Error(
          `Obtained marks cannot exceed ${existing.max_marks}.`,
        );
      }

      db.prepare(`
        UPDATE marks
        SET obtained_marks = @obtainedMarks,
            remarks = @remarks,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id
      `).run({
        id: markId,
        obtainedMarks,
        remarks:
          input?.remarks === undefined
            ? existing.remarks ?? ""
            : optionalText(input.remarks),
        updatedAt: now(),
      });

      return markFromRow(db.prepare("SELECT * FROM marks WHERE id = ?").get(markId));
    },

    createDemoData(cashierName = "Demo Administrator") {
      const created = {
        classes: 0,
        sections: 0,
        feeHeads: 0,
        feeStructures: 0,
        students: 0,
        feePayments: 0,
        attendance: 0,
        subjects: 0,
        exams: 0,
        marks: 0,
      };
      const todayDate = new Date();
      const today = [
        todayDate.getFullYear(),
        String(todayDate.getMonth() + 1).padStart(2, "0"),
        String(todayDate.getDate()).padStart(2, "0"),
      ].join("-");
      const settings = this.getSchoolSettings();
      const academicYear =
        optionalText(settings.academicYear) ||
        `${todayDate.getFullYear()}–${todayDate.getFullYear() + 1}`;

      const ensureClass = (name, order) => {
        const existing = db
          .prepare(`
            SELECT * FROM classes
            WHERE name = ? COLLATE NOCASE AND deleted_at IS NULL
          `)
          .get(name);
        if (existing) return classFromRow(existing);
        created.classes += 1;
        return this.createClass({
          name,
          displayOrder: order,
          status: "Active",
        });
      };

      const ensureSection = (schoolClass, name) => {
        const existing = db
          .prepare(`
            SELECT * FROM sections
            WHERE class_id = ?
              AND name = ? COLLATE NOCASE
              AND deleted_at IS NULL
          `)
          .get(schoolClass.id, name);
        if (existing) return sectionFromRow(existing);
        created.sections += 1;
        return this.createSection({
          classId: schoolClass.id,
          name,
          status: "Active",
        });
      };

      const ensureFeeHead = (name, description, frequency) => {
        const existing = db
          .prepare(`
            SELECT * FROM fee_heads
            WHERE name = ? COLLATE NOCASE AND deleted_at IS NULL
          `)
          .get(name);
        if (existing) return feeHeadFromRow(existing);
        created.feeHeads += 1;
        return this.createFeeHead({
          name,
          description,
          frequency,
          status: "Active",
        });
      };

      const ensureFeeStructure = (schoolClass, feeHead, amount) => {
        const existing = db
          .prepare(`
            SELECT *
            FROM fee_structures
            WHERE class_name = ? COLLATE NOCASE
              AND fee_head_id = ?
              AND academic_year = ?
              AND deleted_at IS NULL
          `)
          .get(schoolClass.name, feeHead.id, academicYear);
        if (existing) return feeStructureFromRow(existing);
        created.feeStructures += 1;
        return this.createFeeStructure({
          className: schoolClass.name,
          feeHeadId: feeHead.id,
          amount,
          academicYear,
          status: "Active",
        });
      };

      const ensureStudent = (input) => {
        const existing = db
          .prepare("SELECT * FROM students WHERE admission_no = ?")
          .get(input.admissionNo);
        if (existing) {
          return existing.deleted_at ? null : studentFromRow(existing);
        }
        created.students += 1;
        return this.createStudent(input);
      };

      const ensureSubject = (input) => {
        const existing = db
          .prepare(`
            SELECT *
            FROM subjects
            WHERE name = ? COLLATE NOCASE
              AND class_name = ? COLLATE NOCASE
              AND deleted_at IS NULL
          `)
          .get(input.name, input.className);
        if (existing) return subjectFromRow(existing);
        created.subjects += 1;
        return this.createSubject(input);
      };

      const demoClassNine = ensureClass("Demo Class 9", 900);
      const demoClassTen = ensureClass("Demo Class 10", 1000);
      ensureSection(demoClassNine, "A");
      ensureSection(demoClassNine, "B");
      ensureSection(demoClassTen, "A");
      ensureSection(demoClassTen, "B");

      const tuitionHead = ensureFeeHead(
        "Demo Tuition Fee",
        "Sample monthly tuition fee for demo records.",
        "Monthly",
      );
      const admissionHead = ensureFeeHead(
        "Demo Admission Fee",
        "Sample one-time admission fee for demo records.",
        "One-Time",
      );
      ensureFeeStructure(demoClassNine, tuitionHead, 2200);
      ensureFeeStructure(demoClassNine, admissionHead, 5000);
      ensureFeeStructure(demoClassTen, tuitionHead, 2500);
      ensureFeeStructure(demoClassTen, admissionHead, 5500);

      const demoStudentInputs = [
        {
          admissionNo: "DEMO-001",
          name: "Aarav Sharma",
          className: demoClassTen.name,
          section: "A",
          guardianName: "Rakesh Sharma",
          mobile: "9000000001",
        },
        {
          admissionNo: "DEMO-002",
          name: "Diya Patel",
          className: demoClassTen.name,
          section: "A",
          guardianName: "Mehul Patel",
          mobile: "9000000002",
        },
        {
          admissionNo: "DEMO-003",
          name: "Kabir Verma",
          className: demoClassTen.name,
          section: "A",
          guardianName: "Sanjay Verma",
          mobile: "9000000003",
        },
        {
          admissionNo: "DEMO-004",
          name: "Meera Singh",
          className: demoClassNine.name,
          section: "B",
          guardianName: "Anita Singh",
          mobile: "9000000004",
        },
        {
          admissionNo: "DEMO-005",
          name: "Vivaan Rao",
          className: demoClassNine.name,
          section: "B",
          guardianName: "Kiran Rao",
          mobile: "9000000005",
        },
      ];
      const demoStudents = demoStudentInputs
        .map((input) =>
          ensureStudent({
            ...input,
            status: "Active",
            address: "Demo address",
            admissionDate: today,
          }),
        )
        .filter(Boolean);

      [
        {
          marker: "[DEMO:RECEIPT-001]",
          student: demoStudents.find(
            (student) => student.admissionNo === "DEMO-001",
          ),
          amount: 2500,
          paymentMode: "Cash",
        },
        {
          marker: "[DEMO:RECEIPT-002]",
          student: demoStudents.find(
            (student) => student.admissionNo === "DEMO-002",
          ),
          amount: 2500,
          paymentMode: "UPI",
        },
      ].forEach(({ marker, student, amount, paymentMode }) => {
        if (!student) return;
        const existing = db
          .prepare("SELECT id FROM fee_payments WHERE notes = ?")
          .get(marker);
        if (existing) return;
        this.createFeePayment({
          studentId: student.id,
          feeType: tuitionHead.name,
          amount,
          paymentMode,
          paymentDate: today,
          notes: marker,
          cashierName: optionalText(cashierName) || "Demo Administrator",
        });
        created.feePayments += 1;
      });

      const attendanceInputs = demoStudents
        .filter(
          (student) =>
            !db
              .prepare(`
                SELECT id FROM attendance
                WHERE student_id = ? AND attendance_date = ?
              `)
              .get(student.id, today),
        )
        .map((student, index) => ({
          studentId: student.id,
          attendanceDate: today,
          status: index === demoStudents.length - 1 ? "Absent" : "Present",
          remarks: "Sample demo attendance",
        }));
      if (attendanceInputs.length > 0) {
        this.saveAttendanceBulk(attendanceInputs);
        created.attendance += attendanceInputs.length;
      }

      const mathematics = ensureSubject({
        name: "Demo Mathematics",
        code: "D-MATH",
        className: demoClassTen.name,
        maxMarks: 100,
        passingMarks: 33,
        status: "Active",
      });
      const science = ensureSubject({
        name: "Demo Science",
        code: "D-SCI",
        className: demoClassTen.name,
        maxMarks: 100,
        passingMarks: 33,
        status: "Active",
      });
      const examRow = db
        .prepare(`
          SELECT *
          FROM exams
          WHERE name = ? COLLATE NOCASE
            AND class_name = ? COLLATE NOCASE
            AND section = ?
            AND academic_year = ?
            AND deleted_at IS NULL
        `)
        .get(
          "Demo Term Examination",
          demoClassTen.name,
          "A",
          academicYear,
        );
      const demoExam = examRow
        ? examFromRow(examRow)
        : this.createExam({
            name: "Demo Term Examination",
            className: demoClassTen.name,
            section: "A",
            academicYear,
            examDate: today,
            status: "Active",
          });
      if (!examRow) created.exams += 1;

      const marksInputs = [];
      demoStudents
        .filter(
          (student) =>
            student.className === demoClassTen.name &&
            student.section === "A",
        )
        .forEach((student, studentIndex) => {
          [mathematics, science].forEach((subject, subjectIndex) => {
            const existing = db
              .prepare(`
                SELECT id
                FROM marks
                WHERE exam_id = ? AND student_id = ? AND subject_id = ?
              `)
              .get(demoExam.id, student.id, subject.id);
            if (!existing) {
              marksInputs.push({
                examId: demoExam.id,
                studentId: student.id,
                subjectId: subject.id,
                obtainedMarks: 72 + studentIndex * 5 + subjectIndex * 3,
                remarks: "Sample demo marks",
              });
            }
          });
        });
      if (marksInputs.length > 0) {
        this.saveMarksBulk(marksInputs);
        created.marks += marksInputs.length;
      }

      const totalCreated = Object.values(created).reduce(
        (total, count) => total + count,
        0,
      );
      return {
        success: true,
        alreadyPresent: totalCreated === 0,
        message:
          totalCreated === 0
            ? "Sample demo data already exists. No duplicate records were created."
            : `Created ${totalCreated} sample demo record(s).`,
        created,
      };
    },

    getEmployees() {
      return db
        .prepare(`
          SELECT *
          FROM employees
          WHERE deleted_at IS NULL
          ORDER BY
            CASE status WHEN 'Active' THEN 0 ELSE 1 END,
            name COLLATE NOCASE
        `)
        .all()
        .map(employeeFromRow);
    },

    getEmployeeById(id) {
      const row = db
        .prepare(`
          SELECT *
          FROM employees
          WHERE id = ? AND deleted_at IS NULL
        `)
        .get(requiredText(id, "Employee id"));
      return row ? employeeFromRow(row) : null;
    },

    createEmployee(input) {
      const employeeNo = requiredText(input?.employeeNo, "Employee number");
      const duplicate = db
        .prepare("SELECT id FROM employees WHERE employee_no = ? COLLATE NOCASE")
        .get(employeeNo);
      if (duplicate) {
        throw new Error("This employee number is already in use.");
      }
      const email = optionalText(input?.email).toLowerCase();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Employee email address is invalid.");
      }
      const dateOfBirth = optionalText(input?.dateOfBirth);
      const joiningDate = optionalText(input?.joiningDate);
      const userId = optionalText(input?.userId);
      if (
        userId &&
        !db
          .prepare("SELECT id FROM users WHERE id = ? AND deleted_at IS NULL")
          .get(userId)
      ) {
        throw new Error("The linked user account was not found.");
      }

      const id = crypto.randomUUID();
      const timestamp = now();
      db.prepare(`
        INSERT INTO employees (
          id, employee_no, name, designation, department, mobile, email,
          gender, date_of_birth, joining_date, qualification, experience,
          address, salary_amount, status, user_id, created_at, updated_at,
          deleted_at, sync_status
        ) VALUES (
          @id, @employeeNo, @name, @designation, @department, @mobile, @email,
          @gender, @dateOfBirth, @joiningDate, @qualification, @experience,
          @address, @salaryAmount, @status, @userId, @createdAt, @updatedAt,
          NULL, 'pending'
        )
      `).run({
        id,
        employeeNo,
        name: requiredText(input?.name, "Employee name"),
        designation: optionalText(input?.designation),
        department: optionalText(input?.department),
        mobile: optionalText(input?.mobile),
        email,
        gender: optionalText(input?.gender),
        dateOfBirth: dateOfBirth
          ? normalizeDate(dateOfBirth, "Date of birth")
          : "",
        joiningDate: joiningDate
          ? normalizeDate(joiningDate, "Joining date")
          : "",
        qualification: optionalText(input?.qualification),
        experience: optionalText(input?.experience),
        address: optionalText(input?.address),
        salaryAmount: wholeNumber(
          input?.salaryAmount ?? 0,
          "Salary amount",
          0,
        ),
        status: masterStatus(input?.status),
        userId: userId || null,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      return this.getEmployeeById(id);
    },

    updateEmployee(id, input) {
      const employeeId = requiredText(id, "Employee id");
      const existing = db
        .prepare(`
          SELECT *
          FROM employees
          WHERE id = ? AND deleted_at IS NULL
        `)
        .get(employeeId);
      if (!existing) {
        throw new Error("Employee record was not found.");
      }

      const employeeNo =
        input?.employeeNo === undefined
          ? existing.employee_no
          : requiredText(input.employeeNo, "Employee number");
      const duplicate = db
        .prepare(`
          SELECT id
          FROM employees
          WHERE employee_no = ? COLLATE NOCASE AND id <> ?
        `)
        .get(employeeNo, employeeId);
      if (duplicate) {
        throw new Error("This employee number is already in use.");
      }
      const email =
        input?.email === undefined
          ? existing.email ?? ""
          : optionalText(input.email).toLowerCase();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Employee email address is invalid.");
      }
      const dateOfBirth =
        input?.dateOfBirth === undefined
          ? existing.date_of_birth ?? ""
          : optionalText(input.dateOfBirth);
      const joiningDate =
        input?.joiningDate === undefined
          ? existing.joining_date ?? ""
          : optionalText(input.joiningDate);
      const userId =
        input?.userId === undefined
          ? existing.user_id ?? ""
          : optionalText(input.userId);
      if (
        userId &&
        !db
          .prepare("SELECT id FROM users WHERE id = ? AND deleted_at IS NULL")
          .get(userId)
      ) {
        throw new Error("The linked user account was not found.");
      }

      db.prepare(`
        UPDATE employees
        SET employee_no = @employeeNo,
            name = @name,
            designation = @designation,
            department = @department,
            mobile = @mobile,
            email = @email,
            gender = @gender,
            date_of_birth = @dateOfBirth,
            joining_date = @joiningDate,
            qualification = @qualification,
            experience = @experience,
            address = @address,
            salary_amount = @salaryAmount,
            status = @status,
            user_id = @userId,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id AND deleted_at IS NULL
      `).run({
        id: employeeId,
        employeeNo,
        name:
          input?.name === undefined
            ? existing.name
            : requiredText(input.name, "Employee name"),
        designation:
          input?.designation === undefined
            ? existing.designation ?? ""
            : optionalText(input.designation),
        department:
          input?.department === undefined
            ? existing.department ?? ""
            : optionalText(input.department),
        mobile:
          input?.mobile === undefined
            ? existing.mobile ?? ""
            : optionalText(input.mobile),
        email,
        gender:
          input?.gender === undefined
            ? existing.gender ?? ""
            : optionalText(input.gender),
        dateOfBirth: dateOfBirth
          ? normalizeDate(dateOfBirth, "Date of birth")
          : "",
        joiningDate: joiningDate
          ? normalizeDate(joiningDate, "Joining date")
          : "",
        qualification:
          input?.qualification === undefined
            ? existing.qualification ?? ""
            : optionalText(input.qualification),
        experience:
          input?.experience === undefined
            ? existing.experience ?? ""
            : optionalText(input.experience),
        address:
          input?.address === undefined
            ? existing.address ?? ""
            : optionalText(input.address),
        salaryAmount:
          input?.salaryAmount === undefined
            ? Number(existing.salary_amount ?? 0)
            : wholeNumber(input.salaryAmount, "Salary amount", 0),
        status: masterStatus(input?.status, existing.status),
        userId: userId || null,
        updatedAt: now(),
      });
      return this.getEmployeeById(employeeId);
    },

    deleteEmployee(id) {
      const timestamp = now();
      const result = db
        .prepare(`
          UPDATE employees
          SET deleted_at = ?,
              updated_at = ?,
              sync_status = 'pending'
          WHERE id = ? AND deleted_at IS NULL
        `)
        .run(timestamp, timestamp, requiredText(id, "Employee id"));
      return { success: result.changes === 1 };
    },

    getSalaryPayments() {
      return db
        .prepare(`
          SELECT *
          FROM salary_payments
          WHERE deleted_at IS NULL
          ORDER BY payment_date DESC, created_at DESC
        `)
        .all()
        .map(salaryPaymentFromRow);
    },

    getSalaryPaymentsByDateRange(startDate, endDate) {
      const normalizedStart = normalizeDate(startDate, "Start date");
      const normalizedEnd = normalizeDate(endDate, "End date");
      if (normalizedStart > normalizedEnd) {
        throw new Error("Start date must be before or equal to end date.");
      }
      return db
        .prepare(`
          SELECT *
          FROM salary_payments
          WHERE deleted_at IS NULL
            AND date(payment_date) BETWEEN date(?) AND date(?)
          ORDER BY payment_date DESC, created_at DESC
        `)
        .all(normalizedStart, normalizedEnd)
        .map(salaryPaymentFromRow);
    },

    getSalaryPaymentsByEmployee(employeeId) {
      return db
        .prepare(`
          SELECT *
          FROM salary_payments
          WHERE employee_id = ? AND deleted_at IS NULL
          ORDER BY salary_month DESC, payment_date DESC
        `)
        .all(requiredText(employeeId, "Employee id"))
        .map(salaryPaymentFromRow);
    },

    createSalaryPayment(input) {
      const employeeId = requiredText(input?.employeeId, "Employee");
      const employee = db
        .prepare(`
          SELECT *
          FROM employees
          WHERE id = ? AND deleted_at IS NULL AND status = 'Active'
        `)
        .get(employeeId);
      if (!employee) {
        throw new Error("Select an active employee.");
      }
      const salaryMonth = normalizeSalaryMonth(input?.salaryMonth);
      const duplicate = db
        .prepare(`
          SELECT id
          FROM salary_payments
          WHERE employee_id = ?
            AND salary_month = ?
            AND deleted_at IS NULL
        `)
        .get(employeeId, salaryMonth);
      if (duplicate) {
        throw new Error("Salary for this employee and month is already paid.");
      }
      const baseSalary = wholeNumber(
        input?.baseSalary ?? employee.salary_amount ?? 0,
        "Base salary",
        0,
      );
      const allowances = wholeNumber(
        input?.allowances ?? 0,
        "Allowances",
        0,
      );
      const deductions = wholeNumber(
        input?.deductions ?? 0,
        "Deductions",
        0,
      );
      const netSalary = baseSalary + allowances - deductions;
      if (netSalary < 0) {
        throw new Error("Deductions cannot exceed salary and allowances.");
      }
      const paymentMode = requiredText(input?.paymentMode, "Payment mode");
      if (!SALARY_PAYMENT_MODES.has(paymentMode)) {
        throw new Error("Salary payment mode is invalid.");
      }
      const paymentDate = normalizeDate(
        optionalText(input?.paymentDate) || now().slice(0, 10),
        "Payment date",
      );
      const id = crypto.randomUUID();
      const timestamp = now();

      db.transaction(() => {
        db.prepare(`
          INSERT INTO salary_payments (
            id, salary_no, employee_id, employee_no, employee_name,
            designation, department, salary_month, base_salary, allowances,
            deductions, net_salary, payment_mode, payment_date, notes,
            paid_by, created_at, updated_at, deleted_at, sync_status
          ) VALUES (
            @id, @salaryNo, @employeeId, @employeeNo, @employeeName,
            @designation, @department, @salaryMonth, @baseSalary, @allowances,
            @deductions, @netSalary, @paymentMode, @paymentDate, @notes,
            @paidBy, @createdAt, @updatedAt, NULL, 'pending'
          )
        `).run({
          id,
          salaryNo: generateSalaryNumber(paymentDate),
          employeeId,
          employeeNo: employee.employee_no,
          employeeName: employee.name,
          designation: employee.designation ?? "",
          department: employee.department ?? "",
          salaryMonth,
          baseSalary,
          allowances,
          deductions,
          netSalary,
          paymentMode,
          paymentDate,
          notes: optionalText(input?.notes),
          paidBy: optionalText(input?.paidBy),
          createdAt: timestamp,
          updatedAt: timestamp,
        });
        syncSalaryAccountTransaction(
          salaryPaymentFromRow(
            db.prepare("SELECT * FROM salary_payments WHERE id = ?").get(id),
          ),
        );
      })();
      return salaryPaymentFromRow(
        db.prepare("SELECT * FROM salary_payments WHERE id = ?").get(id),
      );
    },

    updateSalaryPayment(id, input) {
      const paymentId = requiredText(id, "Salary payment id");
      const existing = db
        .prepare(`
          SELECT *
          FROM salary_payments
          WHERE id = ? AND deleted_at IS NULL
        `)
        .get(paymentId);
      if (!existing) {
        throw new Error("Salary payment was not found.");
      }
      const employeeId =
        input?.employeeId === undefined
          ? existing.employee_id
          : requiredText(input.employeeId, "Employee");
      const employee = db
        .prepare(`
          SELECT *
          FROM employees
          WHERE id = ? AND deleted_at IS NULL
        `)
        .get(employeeId);
      if (!employee) {
        throw new Error("The selected employee was not found.");
      }
      const salaryMonth =
        input?.salaryMonth === undefined
          ? existing.salary_month
          : normalizeSalaryMonth(input.salaryMonth);
      const duplicate = db
        .prepare(`
          SELECT id
          FROM salary_payments
          WHERE employee_id = ?
            AND salary_month = ?
            AND id <> ?
            AND deleted_at IS NULL
        `)
        .get(employeeId, salaryMonth, paymentId);
      if (duplicate) {
        throw new Error("Salary for this employee and month is already paid.");
      }
      const baseSalary =
        input?.baseSalary === undefined
          ? Number(existing.base_salary ?? 0)
          : wholeNumber(input.baseSalary, "Base salary", 0);
      const allowances =
        input?.allowances === undefined
          ? Number(existing.allowances ?? 0)
          : wholeNumber(input.allowances, "Allowances", 0);
      const deductions =
        input?.deductions === undefined
          ? Number(existing.deductions ?? 0)
          : wholeNumber(input.deductions, "Deductions", 0);
      const netSalary = baseSalary + allowances - deductions;
      if (netSalary < 0) {
        throw new Error("Deductions cannot exceed salary and allowances.");
      }
      const paymentMode =
        input?.paymentMode === undefined
          ? existing.payment_mode
          : requiredText(input.paymentMode, "Payment mode");
      if (!SALARY_PAYMENT_MODES.has(paymentMode)) {
        throw new Error("Salary payment mode is invalid.");
      }
      const paymentDate =
        input?.paymentDate === undefined
          ? existing.payment_date
          : normalizeDate(input.paymentDate, "Payment date");

      let updatedPayment;
      db.transaction(() => {
        db.prepare(`
          UPDATE salary_payments
          SET employee_id = @employeeId,
              employee_no = @employeeNo,
              employee_name = @employeeName,
              designation = @designation,
              department = @department,
              salary_month = @salaryMonth,
              base_salary = @baseSalary,
              allowances = @allowances,
              deductions = @deductions,
              net_salary = @netSalary,
              payment_mode = @paymentMode,
              payment_date = @paymentDate,
              notes = @notes,
              paid_by = @paidBy,
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE id = @id AND deleted_at IS NULL
        `).run({
          id: paymentId,
          employeeId,
          employeeNo: employee.employee_no,
          employeeName: employee.name,
          designation: employee.designation ?? "",
          department: employee.department ?? "",
          salaryMonth,
          baseSalary,
          allowances,
          deductions,
          netSalary,
          paymentMode,
          paymentDate,
          notes:
            input?.notes === undefined
              ? existing.notes ?? ""
              : optionalText(input.notes),
          paidBy:
            input?.paidBy === undefined
              ? existing.paid_by ?? ""
              : optionalText(input.paidBy),
          updatedAt: now(),
        });
        updatedPayment = salaryPaymentFromRow(
          db
            .prepare("SELECT * FROM salary_payments WHERE id = ?")
            .get(paymentId),
        );
        syncSalaryAccountTransaction(updatedPayment);
      })();
      return updatedPayment;
    },

    deleteSalaryPayment(id) {
      const timestamp = now();
      const paymentId = requiredText(id, "Salary payment id");
      let result;
      db.transaction(() => {
        result = db
          .prepare(`
            UPDATE salary_payments
            SET deleted_at = ?,
                updated_at = ?,
                sync_status = 'pending'
            WHERE id = ? AND deleted_at IS NULL
          `)
          .run(timestamp, timestamp, paymentId);
        if (result.changes === 1) {
          db.prepare(`
            UPDATE account_transactions
            SET deleted_at = ?,
                updated_at = ?,
                sync_status = 'pending'
            WHERE linked_module = 'Salary'
              AND linked_record_id = ?
              AND type = 'Expense'
              AND deleted_at IS NULL
          `).run(timestamp, timestamp, paymentId);
        }
      })();
      return { success: result.changes === 1 };
    },

    getAccountCategories() {
      return db
        .prepare(`
          SELECT *
          FROM account_categories
          WHERE deleted_at IS NULL
          ORDER BY
            CASE type WHEN 'Income' THEN 0 ELSE 1 END,
            CASE status WHEN 'Active' THEN 0 ELSE 1 END,
            name COLLATE NOCASE
        `)
        .all()
        .map(accountCategoryFromRow);
    },

    createAccountCategory(input) {
      const name = requiredText(input?.name, "Category name");
      const type = requiredText(input?.type, "Account type");
      if (!ACCOUNT_TYPES.has(type)) {
        throw new Error("Account type must be Income or Expense.");
      }
      const duplicate = db
        .prepare(`
          SELECT id
          FROM account_categories
          WHERE type = ?
            AND name = ? COLLATE NOCASE
            AND deleted_at IS NULL
        `)
        .get(type, name);
      if (duplicate) {
        throw new Error("An active account category with this name already exists.");
      }
      const id = crypto.randomUUID();
      const timestamp = now();
      db.prepare(`
        INSERT INTO account_categories (
          id, name, type, description, status, created_at, updated_at,
          deleted_at, sync_status
        ) VALUES (
          @id, @name, @type, @description, @status, @createdAt, @updatedAt,
          NULL, 'pending'
        )
      `).run({
        id,
        name,
        type,
        description: optionalText(input?.description),
        status: masterStatus(input?.status),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      return accountCategoryFromRow(
        db.prepare("SELECT * FROM account_categories WHERE id = ?").get(id),
      );
    },

    updateAccountCategory(id, input) {
      const categoryId = requiredText(id, "Category id");
      const existing = db
        .prepare(`
          SELECT *
          FROM account_categories
          WHERE id = ? AND deleted_at IS NULL
        `)
        .get(categoryId);
      if (!existing) {
        throw new Error("Account category was not found.");
      }
      const name =
        input?.name === undefined
          ? existing.name
          : requiredText(input.name, "Category name");
      const type =
        input?.type === undefined
          ? existing.type
          : requiredText(input.type, "Account type");
      if (!ACCOUNT_TYPES.has(type)) {
        throw new Error("Account type must be Income or Expense.");
      }
      const duplicate = db
        .prepare(`
          SELECT id
          FROM account_categories
          WHERE type = ?
            AND name = ? COLLATE NOCASE
            AND id <> ?
            AND deleted_at IS NULL
        `)
        .get(type, name, categoryId);
      if (duplicate) {
        throw new Error("An active account category with this name already exists.");
      }
      db.prepare(`
        UPDATE account_categories
        SET name = @name,
            type = @type,
            description = @description,
            status = @status,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id AND deleted_at IS NULL
      `).run({
        id: categoryId,
        name,
        type,
        description:
          input?.description === undefined
            ? existing.description ?? ""
            : optionalText(input.description),
        status: masterStatus(input?.status, existing.status),
        updatedAt: now(),
      });
      return accountCategoryFromRow(
        db
          .prepare("SELECT * FROM account_categories WHERE id = ?")
          .get(categoryId),
      );
    },

    deleteAccountCategory(id) {
      const timestamp = now();
      const result = db
        .prepare(`
          UPDATE account_categories
          SET deleted_at = ?,
              updated_at = ?,
              sync_status = 'pending'
          WHERE id = ? AND deleted_at IS NULL
        `)
        .run(timestamp, timestamp, requiredText(id, "Category id"));
      return { success: result.changes === 1 };
    },

    getAccountTransactions() {
      return db
        .prepare(`
          SELECT *
          FROM account_transactions
          WHERE deleted_at IS NULL
          ORDER BY transaction_date DESC, created_at DESC
        `)
        .all()
        .map(accountTransactionFromRow);
    },

    getAccountTransactionsByDateRange(startDate, endDate) {
      const normalizedStart = normalizeDate(startDate, "Start date");
      const normalizedEnd = normalizeDate(endDate, "End date");
      if (normalizedStart > normalizedEnd) {
        throw new Error("Start date must be before or equal to end date.");
      }
      return db
        .prepare(`
          SELECT *
          FROM account_transactions
          WHERE deleted_at IS NULL
            AND date(transaction_date) BETWEEN date(?) AND date(?)
          ORDER BY transaction_date DESC, created_at DESC
        `)
        .all(normalizedStart, normalizedEnd)
        .map(accountTransactionFromRow);
    },

    getAccountTransactionByLink(linkedModule, linkedRecordId) {
      const row = db
        .prepare(`
          SELECT *
          FROM account_transactions
          WHERE linked_module = ?
            AND linked_record_id = ?
            AND deleted_at IS NULL
          ORDER BY created_at DESC
          LIMIT 1
        `)
        .get(
          requiredText(linkedModule, "Linked module"),
          requiredText(linkedRecordId, "Linked record id"),
        );
      return row ? accountTransactionFromRow(row) : null;
    },

    createAccountTransaction(input) {
      const type = requiredText(input?.type, "Account type");
      if (!ACCOUNT_TYPES.has(type)) {
        throw new Error("Account type must be Income or Expense.");
      }
      const categoryId = requiredText(input?.categoryId, "Account category");
      const category = db
        .prepare(`
          SELECT *
          FROM account_categories
          WHERE id = ?
            AND type = ?
            AND status = 'Active'
            AND deleted_at IS NULL
        `)
        .get(categoryId, type);
      if (!category) {
        throw new Error(`Select an active ${type.toLowerCase()} category.`);
      }
      const amount = wholeNumber(input?.amount, "Account amount", 1);
      const paymentMode = requiredText(input?.paymentMode, "Payment mode");
      if (!PAYMENT_MODES.has(paymentMode)) {
        throw new Error("Account payment mode is invalid.");
      }
      const transactionDate = normalizeDate(
        optionalText(input?.transactionDate) || now().slice(0, 10),
        "Transaction date",
      );
      const linkedModule = optionalText(input?.linkedModule) || "Manual";
      const linkedRecordId = optionalText(input?.linkedRecordId);
      if (linkedRecordId) {
        const existing = db
          .prepare(`
            SELECT id
            FROM account_transactions
            WHERE linked_module = ?
              AND linked_record_id = ?
              AND type = ?
              AND deleted_at IS NULL
          `)
          .get(linkedModule, linkedRecordId, type);
        if (existing) {
          throw new Error("An account transaction already exists for this linked record.");
        }
      }
      const id = crypto.randomUUID();
      const timestamp = now();
      db.prepare(`
        INSERT INTO account_transactions (
          id, transaction_no, type, category_id, category_name, title, amount,
          payment_mode, transaction_date, reference_no, linked_module,
          linked_record_id, notes, created_by, created_at, updated_at,
          deleted_at, sync_status
        ) VALUES (
          @id, @transactionNo, @type, @categoryId, @categoryName, @title,
          @amount, @paymentMode, @transactionDate, @referenceNo, @linkedModule,
          @linkedRecordId, @notes, @createdBy, @createdAt, @updatedAt,
          NULL, 'pending'
        )
      `).run({
        id,
        transactionNo: generateAccountTransactionNumber(transactionDate),
        type,
        categoryId,
        categoryName: category.name,
        title: requiredText(input?.title, "Transaction title"),
        amount,
        paymentMode,
        transactionDate,
        referenceNo: optionalText(input?.referenceNo),
        linkedModule,
        linkedRecordId: linkedRecordId || null,
        notes: optionalText(input?.notes),
        createdBy: optionalText(input?.createdBy),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      return accountTransactionFromRow(
        db.prepare("SELECT * FROM account_transactions WHERE id = ?").get(id),
      );
    },

    updateAccountTransaction(id, input) {
      const transactionId = requiredText(id, "Account transaction id");
      const existing = db
        .prepare(`
          SELECT *
          FROM account_transactions
          WHERE id = ? AND deleted_at IS NULL
        `)
        .get(transactionId);
      if (!existing) {
        throw new Error("Account transaction was not found.");
      }
      if ((existing.linked_module ?? "Manual") !== "Manual") {
        throw new Error("Linked account transactions are managed by their source module.");
      }
      const type =
        input?.type === undefined
          ? existing.type
          : requiredText(input.type, "Account type");
      if (!ACCOUNT_TYPES.has(type)) {
        throw new Error("Account type must be Income or Expense.");
      }
      const categoryId =
        input?.categoryId === undefined
          ? existing.category_id
          : requiredText(input.categoryId, "Account category");
      const category = db
        .prepare(`
          SELECT *
          FROM account_categories
          WHERE id = ?
            AND type = ?
            AND status = 'Active'
            AND deleted_at IS NULL
        `)
        .get(categoryId, type);
      if (!category) {
        throw new Error(`Select an active ${type.toLowerCase()} category.`);
      }
      const paymentMode =
        input?.paymentMode === undefined
          ? existing.payment_mode
          : requiredText(input.paymentMode, "Payment mode");
      if (!PAYMENT_MODES.has(paymentMode)) {
        throw new Error("Account payment mode is invalid.");
      }
      db.prepare(`
        UPDATE account_transactions
        SET type = @type,
            category_id = @categoryId,
            category_name = @categoryName,
            title = @title,
            amount = @amount,
            payment_mode = @paymentMode,
            transaction_date = @transactionDate,
            reference_no = @referenceNo,
            notes = @notes,
            created_by = @createdBy,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id AND deleted_at IS NULL
      `).run({
        id: transactionId,
        type,
        categoryId,
        categoryName: category.name,
        title:
          input?.title === undefined
            ? existing.title
            : requiredText(input.title, "Transaction title"),
        amount:
          input?.amount === undefined
            ? Number(existing.amount)
            : wholeNumber(input.amount, "Account amount", 1),
        paymentMode,
        transactionDate:
          input?.transactionDate === undefined
            ? existing.transaction_date
            : normalizeDate(input.transactionDate, "Transaction date"),
        referenceNo:
          input?.referenceNo === undefined
            ? existing.reference_no ?? ""
            : optionalText(input.referenceNo),
        notes:
          input?.notes === undefined
            ? existing.notes ?? ""
            : optionalText(input.notes),
        createdBy:
          input?.createdBy === undefined
            ? existing.created_by ?? ""
            : optionalText(input.createdBy),
        updatedAt: now(),
      });
      return accountTransactionFromRow(
        db
          .prepare("SELECT * FROM account_transactions WHERE id = ?")
          .get(transactionId),
      );
    },

    deleteAccountTransaction(id) {
      const transactionId = requiredText(id, "Account transaction id");
      const existing = db
        .prepare(`
          SELECT *
          FROM account_transactions
          WHERE id = ? AND deleted_at IS NULL
        `)
        .get(transactionId);
      if (!existing) return { success: false };
      if ((existing.linked_module ?? "Manual") !== "Manual") {
        throw new Error("Linked account transactions are managed by their source module.");
      }
      const timestamp = now();
      const result = db
        .prepare(`
          UPDATE account_transactions
          SET deleted_at = ?,
              updated_at = ?,
              sync_status = 'pending'
          WHERE id = ? AND deleted_at IS NULL
        `)
        .run(timestamp, timestamp, transactionId);
      return { success: result.changes === 1 };
    },

    getCertificateTemplates() {
      return db
        .prepare(`
          SELECT *
          FROM certificate_templates
          WHERE deleted_at IS NULL
          ORDER BY
            CASE status WHEN 'Active' THEN 0 ELSE 1 END,
            name COLLATE NOCASE
        `)
        .all()
        .map(certificateTemplateFromRow);
    },

    createCertificateTemplate(input) {
      const name = requiredText(input?.name, "Template name");
      const type = requiredText(input?.type, "Certificate type");
      if (!CERTIFICATE_TYPES.has(type)) {
        throw new Error("Certificate type is invalid.");
      }
      const bodyTemplate = requiredText(
        input?.bodyTemplate,
        "Certificate body",
      );
      if (bodyTemplate.length > 10000) {
        throw new Error("Certificate body must not exceed 10,000 characters.");
      }
      const duplicate = db
        .prepare(`
          SELECT id
          FROM certificate_templates
          WHERE name = ? COLLATE NOCASE AND deleted_at IS NULL
        `)
        .get(name);
      if (duplicate) {
        throw new Error("An active certificate template with this name already exists.");
      }

      const id = crypto.randomUUID();
      const timestamp = now();
      db.prepare(`
        INSERT INTO certificate_templates (
          id, name, type, body_template, status, created_at, updated_at,
          deleted_at, sync_status
        ) VALUES (
          @id, @name, @type, @bodyTemplate, @status, @createdAt, @updatedAt,
          NULL, 'pending'
        )
      `).run({
        id,
        name,
        type,
        bodyTemplate,
        status: masterStatus(input?.status),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      return certificateTemplateFromRow(
        db.prepare("SELECT * FROM certificate_templates WHERE id = ?").get(id),
      );
    },

    updateCertificateTemplate(id, input) {
      const templateId = requiredText(id, "Template id");
      const existing = db
        .prepare(`
          SELECT *
          FROM certificate_templates
          WHERE id = ? AND deleted_at IS NULL
        `)
        .get(templateId);
      if (!existing) {
        throw new Error("Certificate template was not found.");
      }

      const name =
        input?.name === undefined
          ? existing.name
          : requiredText(input.name, "Template name");
      const type =
        input?.type === undefined
          ? existing.type
          : requiredText(input.type, "Certificate type");
      if (!CERTIFICATE_TYPES.has(type)) {
        throw new Error("Certificate type is invalid.");
      }
      const bodyTemplate =
        input?.bodyTemplate === undefined
          ? existing.body_template
          : requiredText(input.bodyTemplate, "Certificate body");
      if (bodyTemplate.length > 10000) {
        throw new Error("Certificate body must not exceed 10,000 characters.");
      }
      const duplicate = db
        .prepare(`
          SELECT id
          FROM certificate_templates
          WHERE name = ? COLLATE NOCASE
            AND id <> ?
            AND deleted_at IS NULL
        `)
        .get(name, templateId);
      if (duplicate) {
        throw new Error("An active certificate template with this name already exists.");
      }

      db.prepare(`
        UPDATE certificate_templates
        SET name = @name,
            type = @type,
            body_template = @bodyTemplate,
            status = @status,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id AND deleted_at IS NULL
      `).run({
        id: templateId,
        name,
        type,
        bodyTemplate,
        status: masterStatus(input?.status, existing.status),
        updatedAt: now(),
      });
      return certificateTemplateFromRow(
        db
          .prepare("SELECT * FROM certificate_templates WHERE id = ?")
          .get(templateId),
      );
    },

    deleteCertificateTemplate(id) {
      const timestamp = now();
      const result = db
        .prepare(`
          UPDATE certificate_templates
          SET deleted_at = ?,
              updated_at = ?,
              sync_status = 'pending'
          WHERE id = ? AND deleted_at IS NULL
        `)
        .run(timestamp, timestamp, requiredText(id, "Template id"));
      return { success: result.changes === 1 };
    },

    issueCertificate(input) {
      const studentId = requiredText(input?.studentId, "Student");
      const templateId = requiredText(
        input?.templateId,
        "Certificate template",
      );
      const student = getStudentStatement.get(studentId);
      if (!student) {
        throw new Error("The selected student was not found.");
      }
      const template = db
        .prepare(`
          SELECT *
          FROM certificate_templates
          WHERE id = ?
            AND status = 'Active'
            AND deleted_at IS NULL
        `)
        .get(templateId);
      if (!template) {
        throw new Error("Select an active certificate template.");
      }
      const issuedDate = normalizeDate(
        optionalText(input?.issuedDate) || now().slice(0, 10),
        "Issue date",
      );
      const settings = db
        .prepare("SELECT * FROM school_settings WHERE id = ?")
        .get(DEFAULT_SETTINGS_ID);
      const timestamp = now();
      const id = crypto.randomUUID();

      db.transaction(() => {
        db.prepare(`
          INSERT INTO issued_certificates (
            id, certificate_no, student_id, student_name, admission_no,
            class_name, section, template_id, certificate_type, issued_date,
            body, issued_by, created_at, updated_at, sync_status
          ) VALUES (
            @id, @certificateNo, @studentId, @studentName, @admissionNo,
            @className, @section, @templateId, @certificateType, @issuedDate,
            @body, @issuedBy, @createdAt, @updatedAt, 'pending'
          )
        `).run({
          id,
          certificateNo: generateCertificateNumber(issuedDate),
          studentId,
          studentName: student.name,
          admissionNo: student.admission_no,
          className: student.class_name,
          section: student.section ?? "",
          templateId,
          certificateType: template.type,
          issuedDate,
          body: renderCertificateBody(
            template.body_template,
            settings,
            student,
            issuedDate,
          ),
          issuedBy: optionalText(input?.issuedBy),
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      })();

      return issuedCertificateFromRow(
        db.prepare("SELECT * FROM issued_certificates WHERE id = ?").get(id),
      );
    },

    getIssuedCertificates() {
      return db
        .prepare(`
          SELECT *
          FROM issued_certificates
          ORDER BY issued_date DESC, created_at DESC
        `)
        .all()
        .map(issuedCertificateFromRow);
    },

    getIssuedCertificatesByStudent(studentId) {
      return db
        .prepare(`
          SELECT *
          FROM issued_certificates
          WHERE student_id = ?
          ORDER BY issued_date DESC, created_at DESC
        `)
        .all(requiredText(studentId, "Student id"))
        .map(issuedCertificateFromRow);
    },

    getLicenseActivationRecord() {
      return licenseActivationFromRow(
        db
          .prepare(
            "SELECT * FROM license_activation WHERE id = 'active-license'",
          )
          .get(),
      );
    },

    saveLicenseActivation(license, licenseKey, status) {
      const existing = db
        .prepare(
          "SELECT created_at FROM license_activation WHERE id = 'active-license'",
        )
        .get();
      const timestamp = now();
      db.prepare(`
        INSERT INTO license_activation (
          id, license_id, school_name, device_id, plan, issued_at, expires_at,
          maintenance_until, max_users, features_json, license_key, status,
          activated_at, last_checked_at, created_at, updated_at
        ) VALUES (
          'active-license', @licenseId, @schoolName, @deviceId, @plan,
          @issuedAt, @expiresAt, @maintenanceUntil, @maxUsers, @featuresJson,
          @licenseKey, @status, @activatedAt, @lastCheckedAt, @createdAt,
          @updatedAt
        )
        ON CONFLICT(id) DO UPDATE SET
          license_id = excluded.license_id,
          school_name = excluded.school_name,
          device_id = excluded.device_id,
          plan = excluded.plan,
          issued_at = excluded.issued_at,
          expires_at = excluded.expires_at,
          maintenance_until = excluded.maintenance_until,
          max_users = excluded.max_users,
          features_json = excluded.features_json,
          license_key = excluded.license_key,
          status = excluded.status,
          activated_at = excluded.activated_at,
          last_checked_at = excluded.last_checked_at,
          updated_at = excluded.updated_at
      `).run({
        licenseId: requiredText(license?.licenseId, "License id"),
        schoolName: requiredText(license?.schoolName, "Licensed school name"),
        deviceId: requiredText(license?.deviceId, "License device id"),
        plan: requiredText(license?.plan, "License plan"),
        issuedAt: requiredText(license?.issuedAt, "License issue date"),
        expiresAt: requiredText(license?.expiresAt, "License expiry date"),
        maintenanceUntil: requiredText(
          license?.maintenanceUntil,
          "License maintenance date",
        ),
        maxUsers: wholeNumber(license?.maxUsers, "Maximum users", 1),
        featuresJson: JSON.stringify(
          Array.isArray(license?.features) ? license.features : [],
        ),
        licenseKey: requiredText(licenseKey, "License key"),
        status: requiredText(status, "License status"),
        activatedAt: timestamp,
        lastCheckedAt: timestamp,
        createdAt: existing?.created_at ?? timestamp,
        updatedAt: timestamp,
      });
      return this.getLicenseActivationRecord();
    },

    updateLicenseActivationCheck(status) {
      const timestamp = now();
      db.prepare(`
        UPDATE license_activation
        SET status = ?, last_checked_at = ?, updated_at = ?
        WHERE id = 'active-license'
      `).run(requiredText(status, "License status"), timestamp, timestamp);
      return this.getLicenseActivationRecord();
    },

    deactivateLicenseActivation() {
      const result = db
        .prepare(
          "DELETE FROM license_activation WHERE id = 'active-license'",
        )
        .run();
      return { success: result.changes === 1 };
    },

    getUserCount() {
      return Number(
        db
          .prepare(
            "SELECT COUNT(*) AS count FROM users WHERE deleted_at IS NULL",
          )
          .get().count,
      );
    },

    getUsers() {
      return db
        .prepare(`
          SELECT *
          FROM users
          WHERE deleted_at IS NULL
          ORDER BY
            CASE role
              WHEN 'Owner' THEN 1
              WHEN 'Admin' THEN 2
              WHEN 'Accountant' THEN 3
              WHEN 'Teacher' THEN 4
              ELSE 5
            END,
            name COLLATE NOCASE
        `)
        .all()
        .map(userFromRow);
    },

    getUserById(id) {
      const row = db
        .prepare("SELECT * FROM users WHERE id = ? AND deleted_at IS NULL")
        .get(requiredText(id, "User id"));
      return row ? userFromRow(row) : null;
    },

    getUserAuthRecord(username) {
      return (
        db
          .prepare(`
            SELECT *
            FROM users
            WHERE username = ? COLLATE NOCASE
              AND deleted_at IS NULL
          `)
          .get(requiredText(username, "Username")) ?? null
      );
    },

    createUserRecord(input) {
      const name = requiredText(input?.name, "User name");
      const username = requiredText(input?.username, "Username").toLowerCase();
      const email = optionalText(input?.email).toLowerCase() || null;
      const passwordHash = requiredText(
        input?.passwordHash,
        "Password hash",
      );
      const passwordSalt = requiredText(
        input?.passwordSalt,
        "Password salt",
      );
      const role = requiredText(input?.role, "Role");
      if (!USER_ROLES.has(role)) {
        throw new Error("User role is invalid.");
      }
      const status = masterStatus(input?.status);
      const duplicateUsername = db
        .prepare(
          "SELECT id FROM users WHERE username = ? COLLATE NOCASE",
        )
        .get(username);
      if (duplicateUsername) {
        throw new Error("This username is already in use.");
      }
      if (
        email &&
        db
          .prepare("SELECT id FROM users WHERE email = ? COLLATE NOCASE")
          .get(email)
      ) {
        throw new Error("This email address is already in use.");
      }

      const timestamp = now();
      const id = crypto.randomUUID();
      db.prepare(`
        INSERT INTO users (
          id, name, email, username, password_hash, password_salt, role,
          status, last_login_at, created_at, updated_at, deleted_at,
          sync_status
        ) VALUES (
          @id, @name, @email, @username, @passwordHash, @passwordSalt, @role,
          @status, NULL, @createdAt, @updatedAt, NULL, 'pending'
        )
      `).run({
        id,
        name,
        email,
        username,
        passwordHash,
        passwordSalt,
        role,
        status,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      return this.getUserById(id);
    },

    updateUserRecord(id, input) {
      const userId = requiredText(id, "User id");
      const existing = db
        .prepare("SELECT * FROM users WHERE id = ? AND deleted_at IS NULL")
        .get(userId);
      if (!existing) {
        throw new Error("User record was not found.");
      }
      const name =
        input?.name === undefined
          ? existing.name
          : requiredText(input.name, "User name");
      const email =
        input?.email === undefined
          ? existing.email
          : optionalText(input.email).toLowerCase() || null;
      const role =
        input?.role === undefined
          ? existing.role
          : requiredText(input.role, "Role");
      if (!USER_ROLES.has(role)) {
        throw new Error("User role is invalid.");
      }
      const status = masterStatus(input?.status, existing.status);
      if (
        existing.role === "Owner" &&
        existing.status === "Active" &&
        (role !== "Owner" || status !== "Active")
      ) {
        const otherOwners = Number(
          db
            .prepare(`
              SELECT COUNT(*) AS count
              FROM users
              WHERE role = 'Owner'
                AND status = 'Active'
                AND deleted_at IS NULL
                AND id <> ?
            `)
            .get(userId).count,
        );
        if (otherOwners === 0) {
          throw new Error("The only active Owner cannot be changed.");
        }
      }
      if (
        email &&
        db
          .prepare(`
            SELECT id
            FROM users
            WHERE email = ? COLLATE NOCASE AND id <> ?
          `)
          .get(email, userId)
      ) {
        throw new Error("This email address is already in use.");
      }

      db.prepare(`
        UPDATE users
        SET name = @name,
            email = @email,
            role = @role,
            status = @status,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id AND deleted_at IS NULL
      `).run({
        id: userId,
        name,
        email,
        role,
        status,
        updatedAt: now(),
      });
      return this.getUserById(userId);
    },

    setUserPassword(id, passwordHash, passwordSalt) {
      const result = db
        .prepare(`
          UPDATE users
          SET password_hash = ?,
              password_salt = ?,
              updated_at = ?,
              sync_status = 'pending'
          WHERE id = ? AND deleted_at IS NULL
        `)
        .run(
          requiredText(passwordHash, "Password hash"),
          requiredText(passwordSalt, "Password salt"),
          now(),
          requiredText(id, "User id"),
        );
      if (result.changes !== 1) {
        throw new Error("User record was not found.");
      }
      return this.getUserById(id);
    },

    updateUserLastLogin(id) {
      const timestamp = now();
      db.prepare(`
        UPDATE users
        SET last_login_at = ?, updated_at = ?
        WHERE id = ? AND deleted_at IS NULL
      `).run(timestamp, timestamp, requiredText(id, "User id"));
      return this.getUserById(id);
    },

    deleteUserRecord(id) {
      const userId = requiredText(id, "User id");
      const existing = db
        .prepare("SELECT * FROM users WHERE id = ? AND deleted_at IS NULL")
        .get(userId);
      if (!existing) return { success: false };
      if (existing.role === "Owner" && existing.status === "Active") {
        const otherOwners = Number(
          db
            .prepare(`
              SELECT COUNT(*) AS count
              FROM users
              WHERE role = 'Owner'
                AND status = 'Active'
                AND deleted_at IS NULL
                AND id <> ?
            `)
            .get(userId).count,
        );
        if (otherOwners === 0) {
          throw new Error("The only active Owner cannot be deleted.");
        }
      }
      const timestamp = now();
      const result = db
        .prepare(`
          UPDATE users
          SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
          WHERE id = ? AND deleted_at IS NULL
        `)
        .run(timestamp, timestamp, userId);
      return { success: result.changes === 1 };
    },

    createAuditLog(user, action, module, details = "") {
      const id = crypto.randomUUID();
      db.prepare(`
        INSERT INTO audit_logs (
          id, user_id, user_name, action, module, details, created_at
        ) VALUES (
          @id, @userId, @userName, @action, @module, @details, @createdAt
        )
      `).run({
        id,
        userId: user?.id ?? null,
        userName: optionalText(user?.name) || "System",
        action: requiredText(action, "Audit action"),
        module: optionalText(module),
        details: optionalText(details),
        createdAt: now(),
      });
      return auditLogFromRow(
        db.prepare("SELECT * FROM audit_logs WHERE id = ?").get(id),
      );
    },

    getAuditLogs(limit = 100) {
      const safeLimit = Math.min(
        500,
        Math.max(1, wholeNumber(limit, "Audit log limit", 1)),
      );
      return db
        .prepare(`
          SELECT *
          FROM audit_logs
          ORDER BY created_at DESC
          LIMIT ?
        `)
        .all(safeLimit)
        .map(auditLogFromRow);
    },

    backupTo(destinationPath) {
      if (!db.open) {
        throw new Error("The local database is not open.");
      }
      return db.backup(destinationPath);
    },

    close() {
      if (db.open) {
        db.close();
      }
    },
  };
}

module.exports = { createDatabase };
