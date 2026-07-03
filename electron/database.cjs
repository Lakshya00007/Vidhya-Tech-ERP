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

function studentFromRow(row) {
  return {
    id: row.id,
    admissionNo: row.admission_no,
    name: row.name,
    className: row.class_name,
    section: row.section ?? "",
    guardianName: row.guardian_name ?? "",
    mobile: row.mobile ?? "",
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
      status TEXT DEFAULT 'Active',
      address TEXT,
      date_of_birth TEXT,
      admission_date TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending'
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

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_name TEXT,
      action TEXT NOT NULL,
      module TEXT,
      details TEXT,
      created_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_students_active
      ON students(deleted_at, created_at);
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
  `);

  addColumnIfMissing(db, "fee_payments", "admission_no", "TEXT");
  addColumnIfMissing(db, "fee_payments", "section", "TEXT");
  addColumnIfMissing(db, "fee_payments", "guardian_name", "TEXT");
  addColumnIfMissing(db, "fee_payments", "mobile", "TEXT");
  addColumnIfMissing(db, "fee_payments", "cashier_name", "TEXT");
  addColumnIfMissing(db, "attendance", "admission_no", "TEXT");
  addColumnIfMissing(db, "attendance", "remarks", "TEXT");

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
      status, address, date_of_birth, admission_date, created_at, updated_at,
      deleted_at, sync_status
    ) VALUES (
      @id, @admissionNo, @name, @className, @section, @guardianName, @mobile,
      @status, @address, @dateOfBirth, @admissionDate, @createdAt, @updatedAt,
      NULL, 'pending'
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
          receiptNo: generateReceiptNumber(paymentDate),
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
          cashierName: optionalText(input?.cashierName),
          createdAt: timestamp,
          updatedAt: timestamp,
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
