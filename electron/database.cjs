const crypto = require("node:crypto");
const Database = require("better-sqlite3");

const DEFAULT_SETTINGS_ID = "school-profile";
const STUDENT_STATUSES = new Set(["Active", "Inactive"]);
const PAYMENT_MODES = new Set(["Cash", "UPI", "Card", "Bank Transfer"]);
const ATTENDANCE_STATUSES = new Set(["Present", "Absent", "Leave"]);

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
    admissionNo: row.admission_no ?? "",
    className: row.class_name ?? "",
    feeType: row.fee_type ?? "",
    amount: row.amount,
    paymentMode: row.payment_mode ?? "Cash",
    paymentDate: row.payment_date,
    notes: row.notes ?? "",
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
    className: row.class_name,
    section: row.section ?? "",
    attendanceDate: row.attendance_date,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
  };
}

function createDatabase(databasePath) {
  const db = new Database(databasePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

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
      class_name TEXT,
      fee_type TEXT,
      amount INTEGER NOT NULL,
      payment_mode TEXT,
      payment_date TEXT,
      notes TEXT,
      created_at TEXT,
      updated_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      class_name TEXT NOT NULL,
      section TEXT,
      attendance_date TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT,
      updated_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE INDEX IF NOT EXISTS idx_students_active
      ON students(deleted_at, created_at);
    CREATE INDEX IF NOT EXISTS idx_fee_payments_date
      ON fee_payments(payment_date);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_student_date
      ON attendance(student_id, attendance_date);
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

  const getPaymentsStatement = db.prepare(`
    SELECT fee_payments.*, students.admission_no
    FROM fee_payments
    LEFT JOIN students ON students.id = fee_payments.student_id
    ORDER BY fee_payments.payment_date DESC, fee_payments.created_at DESC
  `);

  function generateAdmissionNumber() {
    const year = new Date().getFullYear();
    const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();
    return `VSE-${year}-${suffix}`;
  }

  function generateReceiptNumber() {
    const settings = db
      .prepare("SELECT receipt_prefix FROM school_settings WHERE id = ?")
      .get(DEFAULT_SETTINGS_ID);
    const prefix = optionalText(settings?.receipt_prefix) || "VSE-RC";
    const sequence = db
      .prepare(`
        SELECT MAX(
          CAST(substr(receipt_no, length(?) + 2) AS INTEGER)
        ) AS last_sequence
        FROM fee_payments
        WHERE receipt_no LIKE ?
      `)
      .get(prefix, `${prefix}-%`);
    const lastSequence = Number(sequence?.last_sequence ?? 1000);
    return `${prefix}-${lastSequence + 1}`;
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

      const student = {
        id: crypto.randomUUID(),
        admissionNo: optionalText(input?.admissionNo) || generateAdmissionNumber(),
        name: requiredText(input?.name, "Student name"),
        className: requiredText(input?.className, "Class"),
        section: optionalText(input?.section),
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

      updateStudentStatement.run({
        id: studentId,
        admissionNo:
          optionalText(input?.admissionNo) || existingStudent.admissionNo,
        name: optionalText(input?.name) || existingStudent.name,
        className: optionalText(input?.className) || existingStudent.className,
        section:
          input?.section === undefined
            ? existingStudent.section
            : optionalText(input.section),
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

    createFeePayment(input) {
      const amount = Number(input?.amount);
      if (!Number.isInteger(amount) || amount <= 0) {
        throw new Error("Payment amount must be a positive whole number.");
      }

      const paymentMode = optionalText(input?.paymentMode) || "Cash";
      if (!PAYMENT_MODES.has(paymentMode)) {
        throw new Error("Payment mode is invalid.");
      }

      const studentId = optionalText(input?.studentId) || null;
      if (studentId && !getStudentStatement.get(studentId)) {
        throw new Error("The selected student was not found.");
      }

      const timestamp = now();
      const id = crypto.randomUUID();
      db.prepare(`
        INSERT INTO fee_payments (
          id, receipt_no, student_id, student_name, class_name, fee_type,
          amount, payment_mode, payment_date, notes, created_at, updated_at,
          sync_status
        ) VALUES (
          @id, @receiptNo, @studentId, @studentName, @className, @feeType,
          @amount, @paymentMode, @paymentDate, @notes, @createdAt, @updatedAt,
          'pending'
        )
      `).run({
        id,
        receiptNo: optionalText(input?.receiptNo) || generateReceiptNumber(),
        studentId,
        studentName: requiredText(input?.studentName, "Student name"),
        className: optionalText(input?.className),
        feeType: optionalText(input?.feeType),
        amount,
        paymentMode,
        paymentDate: optionalText(input?.paymentDate) || timestamp,
        notes: optionalText(input?.notes),
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      return paymentFromRow(
        db.prepare(`
          SELECT fee_payments.*, students.admission_no
          FROM fee_payments
          LEFT JOIN students ON students.id = fee_payments.student_id
          WHERE fee_payments.id = ?
        `).get(id),
      );
    },

    getAttendance() {
      return db
        .prepare("SELECT * FROM attendance ORDER BY attendance_date DESC, student_name")
        .all()
        .map(attendanceFromRow);
    },

    saveAttendance(input) {
      const status = requiredText(input?.status, "Attendance status");
      if (!ATTENDANCE_STATUSES.has(status)) {
        throw new Error("Attendance status is invalid.");
      }

      const studentId = requiredText(input?.studentId, "Student id");
      if (!getStudentStatement.get(studentId)) {
        throw new Error("The selected student was not found.");
      }

      const timestamp = now();
      const id = optionalText(input?.id) || crypto.randomUUID();
      const attendanceDate = requiredText(
        input?.attendanceDate,
        "Attendance date",
      );

      db.prepare(`
        INSERT INTO attendance (
          id, student_id, student_name, class_name, section, attendance_date,
          status, created_at, updated_at, sync_status
        ) VALUES (
          @id, @studentId, @studentName, @className, @section, @attendanceDate,
          @status, @createdAt, @updatedAt, 'pending'
        )
        ON CONFLICT(student_id, attendance_date) DO UPDATE SET
          student_name = excluded.student_name,
          class_name = excluded.class_name,
          section = excluded.section,
          status = excluded.status,
          updated_at = excluded.updated_at,
          sync_status = 'pending'
      `).run({
        id,
        studentId,
        studentName: requiredText(input?.studentName, "Student name"),
        className: requiredText(input?.className, "Class"),
        section: optionalText(input?.section),
        attendanceDate,
        status,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      return attendanceFromRow(
        db
          .prepare(`
            SELECT *
            FROM attendance
            WHERE student_id = ? AND attendance_date = ?
          `)
          .get(studentId, attendanceDate),
      );
    },

    close() {
      if (db.open) {
        db.close();
      }
    },
  };
}

module.exports = { createDatabase };
