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
const EMPLOYEE_ATTENDANCE_STATUSES = new Set([
  "Present",
  "Absent",
  "Leave",
  "Half Day",
  "Late",
  "Holiday",
]);
const USER_ROLES = new Set([
  "Owner",
  "Admin",
  "Accountant",
  "Teacher",
  "Viewer",
  "Student",
]);
const USER_ACCOUNT_TYPES = new Set(["Staff", "Student"]);
const USER_ENTITY_TYPES = new Set(["Student", "Employee"]);
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
const DOCUMENT_TEMPLATE_TYPES = new Set([
  "Admission Form",
  "Transfer Certificate",
  "Fee Receipt",
]);
const DOCUMENT_PAPER_SIZES = new Set(["A4", "A5", "Half A4"]);
const TRANSFER_CERTIFICATE_STATUSES = new Set([
  "Draft",
  "Issued",
  "Cancelled",
]);
const ACCOUNT_TYPES = new Set(["Income", "Expense"]);
const STORE_POS_ACCOUNT_MAPPINGS = {
  sales_income: {
    label: "POS Sales Income",
    accountType: "Income",
    candidates: ["Store Sales Income", "POS Sales Income", "Other Income"],
  },
  cash_income: {
    label: "POS Cash Sales Income",
    accountType: "Income",
    candidates: ["POS Cash Sales Income", "Store Sales Income", "Other Income"],
  },
  upi_income: {
    label: "POS UPI Sales Income",
    accountType: "Income",
    candidates: ["POS UPI Sales Income", "Store Sales Income", "Other Income"],
  },
  card_income: {
    label: "POS Card Sales Income",
    accountType: "Income",
    candidates: ["POS Card Sales Income", "Store Sales Income", "Other Income"],
  },
  reversal_expense: {
    label: "POS Sale Reversal Expense",
    accountType: "Expense",
    candidates: ["POS Sale Reversal Expense", "Store Refund Expense", "Other Expense"],
  },
};
const HOMEWORK_STATUSES = new Set(["Active", "Inactive"]);
const HOMEWORK_SUBMISSION_STATUSES = new Set([
  "Pending",
  "Submitted",
  "Checked",
  "Late",
  "Missing",
]);
const CLASS_TEST_RESULT_STATUSES = new Set([
  "Pending",
  "Pass",
  "Fail",
  "Absent",
]);
const QUESTION_TYPES = new Set([
  "Objective",
  "Short Answer",
  "Long Answer",
  "Fill in the Blanks",
  "True/False",
  "Match the Following",
]);
const QUESTION_DIFFICULTIES = new Set(["Easy", "Medium", "Hard"]);
const RATING_VALUES = new Set([
  "Excellent",
  "Very Good",
  "Good",
  "Average",
  "Needs Improvement",
]);
const SKILL_DOMAINS = new Set(["Affective", "Psychomotor"]);
const OBSERVATION_TYPES = new Set([
  "Academic",
  "Behaviour",
  "Discipline",
  "Health",
  "General",
]);
const OBSERVATION_STATUSES = new Set(["Open", "Follow Up", "Closed"]);
const ACADEMIC_SESSION_STATUSES = new Set([
  "Active",
  "Inactive",
  "Closed",
]);
const STUDENT_SESSION_STATUSES = new Set([
  "Active",
  "Promoted",
  "Repeated",
  "TC",
  "Left",
  "Inactive",
]);
const STUDENT_RESULT_STATUSES = new Set([
  "Pass",
  "Fail",
  "Repeat",
  "TC",
  "Left",
  "Not Applicable",
]);
const PROMOTION_ACTIONS = new Set([
  "Promote",
  "Repeat",
  "TC",
  "Left",
  "Inactive",
]);
const CARRY_FORWARD_STATUSES = new Set(["Pending", "Paid", "Waived"]);
const DISCOUNT_MODES = new Set(["Fixed", "Percentage"]);
const BILLING_PERIODS = new Set([
  "Monthly",
  "Quarterly",
  "Term",
  "Annual",
  "Custom",
]);
const FEE_INVOICE_STATUSES = new Set([
  "Draft",
  "Unpaid",
  "Partially Paid",
  "Paid",
  "Overdue",
  "Cancelled",
]);
const FEE_PAYMENT_STATUSES = new Set(["Active", "Reversed"]);
const REMOTE_LICENSE_STATUSES = new Set([
  "Active",
  "Suspended",
  "Expired",
  "Revoked",
  "Unknown",
]);
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
const GRADING_CALCULATION_MODES = new Set(["Percentage", "Marks"]);
const GRADING_RESULT_STATUSES = new Set(["Pass", "Fail"]);
const REPORT_CARD_TEMPLATE_TYPES = new Set(["Standard", "Detailed"]);
const REPORT_CARD_RESULT_STATUSES = new Set([
  "Pass",
  "Fail",
  "Promoted",
  "Detained",
  "Pending",
]);
const SCHOOL_RULE_CATEGORIES = new Set([
  "General",
  "Fees",
  "Attendance",
  "Discipline",
  "Examination",
  "Transport",
  "Uniform",
  "Library",
  "Safety",
  "Other",
]);
const PREFERENCE_SCOPES = new Set(["Application", "User"]);
const THEME_MODES = new Set(["Light", "Dark", "System"]);
const ACCENT_COLORS = new Set([
  "Blue",
  "Indigo",
  "Green",
  "Purple",
  "Orange",
]);
const PREFERENCE_LANGUAGES = new Set(["English", "Hindi"]);
const FONT_SCALES = new Set(["Small", "Normal", "Large"]);
const DATE_FORMATS = new Set([
  "DD/MM/YYYY",
  "MM/DD/YYYY",
  "YYYY-MM-DD",
  "DD MMM YYYY",
]);
const TIME_FORMATS = new Set(["12 Hour", "24 Hour"]);
const MESSAGE_THREAD_TYPES = new Set([
  "Direct",
  "Announcement",
  "Class Notice",
  "Staff Notice",
  "System",
]);
const MESSAGE_THREAD_STATUSES = new Set(["Active", "Archived", "Closed"]);
const MESSAGE_PRIORITIES = new Set(["Low", "Normal", "High", "Urgent"]);
const MESSAGE_TYPES = new Set(["Text", "Notice", "System"]);
const MESSAGE_DELIVERY_STATUSES = new Set(["Delivered", "Read", "Archived"]);
const ANNOUNCEMENT_AUDIENCE_TYPES = new Set([
  "All Users",
  "All Students",
  "All Employees",
  "Teachers",
  "Accountants",
  "Specific Class",
  "Specific Section",
  "Selected Users",
]);
const ANNOUNCEMENT_STATUSES = new Set([
  "Draft",
  "Published",
  "Expired",
  "Cancelled",
]);
const GUARDIAN_RELATIONS = new Set([
  "Father",
  "Mother",
  "Guardian",
  "Grandfather",
  "Grandmother",
  "Brother",
  "Sister",
  "Uncle",
  "Aunt",
  "Other",
]);
const DEFAULT_GRADING_RANGES = [
  { minValue: 90, maxValue: 100, grade: "A+", gradePoint: 10, resultStatus: "Pass" },
  { minValue: 80, maxValue: 89.99, grade: "A", gradePoint: 9, resultStatus: "Pass" },
  { minValue: 70, maxValue: 79.99, grade: "B+", gradePoint: 8, resultStatus: "Pass" },
  { minValue: 60, maxValue: 69.99, grade: "B", gradePoint: 7, resultStatus: "Pass" },
  { minValue: 50, maxValue: 59.99, grade: "C", gradePoint: 6, resultStatus: "Pass" },
  { minValue: 33, maxValue: 49.99, grade: "D", gradePoint: 5, resultStatus: "Pass" },
  { minValue: 0, maxValue: 32.99, grade: "F", gradePoint: 0, resultStatus: "Fail" },
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
    academicSessionId: row.academic_session_id ?? "",
    academicSessionName: row.academic_session_name ?? "",
    sessionStatus: row.session_status ?? row.status,
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

function timetableWeekdayFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    displayOrder: Number(row.display_order ?? 0),
    isActive: Number(row.is_active ?? 1) === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function timetablePeriodFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    startTime: row.start_time,
    endTime: row.end_time,
    displayOrder: Number(row.display_order ?? 0),
    isBreak: Number(row.is_break ?? 0) === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function classroomFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    capacity: Number(row.capacity ?? 0),
    description: row.description ?? "",
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function timetableEntryFromRow(row) {
  return {
    id: row.id,
    className: row.class_name,
    section: row.section ?? "",
    weekdayId: row.weekday_id,
    weekdayName: row.weekday_name,
    periodId: row.period_id,
    periodName: row.period_name,
    startTime: row.start_time ?? "",
    endTime: row.end_time ?? "",
    subjectId: row.subject_id ?? "",
    subjectName: row.subject_name ?? "",
    teacherId: row.teacher_id ?? "",
    teacherName: row.teacher_name ?? "",
    classroomId: row.classroom_id ?? "",
    classroomName: row.classroom_name ?? "",
    notes: row.notes ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function homeworkFromRow(row) {
  return {
    id: row.id,
    title: row.title,
    className: row.class_name,
    section: row.section ?? "",
    subjectId: row.subject_id ?? "",
    subjectName: row.subject_name ?? "",
    teacherId: row.teacher_id ?? "",
    teacherName: row.teacher_name ?? "",
    homeworkDate: row.homework_date,
    dueDate: row.due_date ?? "",
    description: row.description ?? "",
    instructions: row.instructions ?? "",
    status: row.status,
    createdBy: row.created_by ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function homeworkSubmissionFromRow(row) {
  return {
    id: row.id,
    homeworkId: row.homework_id,
    studentId: row.student_id,
    studentName: row.student_name,
    admissionNo: row.admission_no ?? "",
    className: row.class_name ?? "",
    section: row.section ?? "",
    status: row.status,
    submittedDate: row.submitted_date ?? "",
    remarks: row.remarks ?? "",
    marks: row.marks == null ? null : Number(row.marks),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
  };
}

function classTestFromRow(row) {
  return {
    id: row.id,
    testName: row.test_name,
    className: row.class_name,
    section: row.section ?? "",
    subjectId: row.subject_id ?? "",
    subjectName: row.subject_name ?? "",
    teacherId: row.teacher_id ?? "",
    teacherName: row.teacher_name ?? "",
    testDate: row.test_date,
    maxMarks: Number(row.max_marks),
    passingMarks: Number(row.passing_marks ?? 0),
    description: row.description ?? "",
    status: row.status,
    createdBy: row.created_by ?? "",
    markCount: Number(row.mark_count ?? 0),
    pendingMarkCount: Number(row.pending_mark_count ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function classTestMarkFromRow(row) {
  return {
    id: row.id,
    testId: row.test_id,
    studentId: row.student_id,
    studentName: row.student_name,
    admissionNo: row.admission_no ?? "",
    className: row.class_name ?? "",
    section: row.section ?? "",
    marksObtained: Number(row.marks_obtained ?? 0),
    resultStatus: row.result_status,
    remarks: row.remarks ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
  };
}

function subjectChapterFromRow(row) {
  return {
    id: row.id,
    className: row.class_name,
    subjectId: row.subject_id ?? "",
    subjectName: row.subject_name,
    chapterName: row.chapter_name,
    chapterNo: row.chapter_no ?? "",
    description: row.description ?? "",
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function questionFromRow(row) {
  return {
    id: row.id,
    className: row.class_name,
    subjectId: row.subject_id ?? "",
    subjectName: row.subject_name,
    chapterId: row.chapter_id ?? "",
    chapterName: row.chapter_name ?? "",
    questionType: row.question_type,
    difficulty: row.difficulty,
    questionText: row.question_text,
    optionA: row.option_a ?? "",
    optionB: row.option_b ?? "",
    optionC: row.option_c ?? "",
    optionD: row.option_d ?? "",
    correctAnswer: row.correct_answer ?? "",
    marks: Number(row.marks ?? 1),
    status: row.status,
    createdBy: row.created_by ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function questionPaperItemFromRow(row) {
  return {
    id: row.id,
    paperId: row.paper_id,
    questionId: row.question_id ?? "",
    sectionTitle: row.section_title ?? "Section A",
    displayOrder: Number(row.display_order ?? 0),
    questionType: row.question_type ?? "",
    questionText: row.question_text,
    optionA: row.option_a ?? "",
    optionB: row.option_b ?? "",
    optionC: row.option_c ?? "",
    optionD: row.option_d ?? "",
    correctAnswer: row.correct_answer ?? "",
    marks: Number(row.marks ?? 1),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
  };
}

function questionPaperFromRow(row, items = []) {
  return {
    id: row.id,
    paperNo: row.paper_no,
    title: row.title,
    className: row.class_name,
    section: row.section ?? "",
    subjectId: row.subject_id ?? "",
    subjectName: row.subject_name,
    examName: row.exam_name ?? "",
    durationMinutes: Number(row.duration_minutes ?? 0),
    totalMarks: Number(row.total_marks ?? 0),
    instructions: row.instructions ?? "",
    createdBy: row.created_by ?? "",
    itemCount: Number(row.item_count ?? items.length),
    items,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function behaviourTraitFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function skillTraitFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    domain: row.domain,
    description: row.description ?? "",
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function behaviourRatingFromRow(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    admissionNo: row.admission_no ?? "",
    className: row.class_name ?? "",
    section: row.section ?? "",
    traitId: row.trait_id ?? "",
    traitName: row.trait_name,
    rating: row.rating,
    ratingDate: row.rating_date,
    academicYear: row.academic_year ?? "",
    remarks: row.remarks ?? "",
    ratedBy: row.rated_by ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function skillRatingFromRow(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    admissionNo: row.admission_no ?? "",
    className: row.class_name ?? "",
    section: row.section ?? "",
    skillId: row.skill_id ?? "",
    skillName: row.skill_name,
    domain: row.domain,
    rating: row.rating,
    ratingDate: row.rating_date,
    academicYear: row.academic_year ?? "",
    remarks: row.remarks ?? "",
    ratedBy: row.rated_by ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function studentObservationFromRow(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name,
    admissionNo: row.admission_no ?? "",
    className: row.class_name ?? "",
    section: row.section ?? "",
    observationDate: row.observation_date,
    observationType: row.observation_type,
    observationText: row.observation_text,
    actionTaken: row.action_taken ?? "",
    followUpDate: row.follow_up_date ?? "",
    status: row.status,
    createdBy: row.created_by ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function academicSessionFromRow(row) {
  return {
    id: row.id,
    sessionName: row.session_name,
    startDate: row.start_date ?? "",
    endDate: row.end_date ?? "",
    status: row.status,
    isCurrent: Number(row.is_current ?? 0) === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    closedAt: row.closed_at ?? "",
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function studentSessionHistoryFromRow(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    admissionNo: row.admission_no ?? "",
    studentName: row.student_name ?? "",
    academicSessionId: row.academic_session_id,
    academicSessionName: row.academic_session_name,
    className: row.class_name ?? "",
    section: row.section ?? "",
    rollNo: row.roll_no ?? "",
    status: row.status,
    resultStatus: row.result_status ?? "Not Applicable",
    promotedToSessionId: row.promoted_to_session_id ?? "",
    promotedToSessionName: row.promoted_to_session_name ?? "",
    promotedToClass: row.promoted_to_class ?? "",
    promotedToSection: row.promoted_to_section ?? "",
    promotionDate: row.promotion_date ?? "",
    remarks: row.remarks ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
  };
}

function promotionItemFromRow(row) {
  return {
    id: row.id,
    promotionId: row.promotion_id,
    studentId: row.student_id,
    admissionNo: row.admission_no ?? "",
    studentName: row.student_name ?? "",
    oldClass: row.old_class ?? "",
    oldSection: row.old_section ?? "",
    newClass: row.new_class ?? "",
    newSection: row.new_section ?? "",
    action: row.action,
    oldDueAmount: Number(row.old_due_amount ?? 0),
    carriedForwardAmount: Number(row.carried_forward_amount ?? 0),
    remarks: row.remarks ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
  };
}

function studentPromotionFromRow(row, items = []) {
  return {
    id: row.id,
    promotionNo: row.promotion_no,
    fromSessionId: row.from_session_id,
    fromSessionName: row.from_session_name,
    toSessionId: row.to_session_id,
    toSessionName: row.to_session_name,
    fromClass: row.from_class ?? "",
    fromSection: row.from_section ?? "",
    toClass: row.to_class ?? "",
    toSection: row.to_section ?? "",
    promotionDate: row.promotion_date,
    totalStudents: Number(row.total_students ?? 0),
    promotedCount: Number(row.promoted_count ?? 0),
    repeatedCount: Number(row.repeated_count ?? 0),
    tcCount: Number(row.tc_count ?? 0),
    leftCount: Number(row.left_count ?? 0),
    inactiveCount: Number(row.inactive_count ?? 0),
    carryForwardDues: Number(row.carry_forward_dues ?? 0),
    createdBy: row.created_by ?? "",
    remarks: row.remarks ?? "",
    items,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
  };
}

function carryForwardDueFromRow(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    admissionNo: row.admission_no ?? "",
    studentName: row.student_name ?? "",
    fromSessionId: row.from_session_id ?? "",
    fromSessionName: row.from_session_name ?? "",
    toSessionId: row.to_session_id ?? "",
    toSessionName: row.to_session_name ?? "",
    oldDueAmount: Number(row.old_due_amount ?? 0),
    carriedAmount: Number(row.carried_amount ?? 0),
    status: row.status,
    promotionId: row.promotion_id ?? "",
    className: row.current_class_name ?? "",
    section: row.current_section ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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

function documentTemplateSettingsFromRow(row) {
  let showFields = {};
  try {
    const parsed = JSON.parse(row.show_fields_json ?? "{}");
    showFields = parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    showFields = {};
  }
  return {
    id: row.id,
    documentType: row.document_type,
    udiseCode: row.udise_code ?? "",
    recognitionNumber: row.recognition_number ?? "",
    principalName: row.principal_name ?? "",
    principalSignaturePath: row.principal_signature_path ?? "",
    schoolStampPath: row.school_stamp_path ?? "",
    accentColor: row.accent_color ?? "#1f4e79",
    footerText: row.footer_text ?? "",
    feeReceiptTerms:
      row.fee_receipt_terms ??
      "Fees once paid are not refundable or transferable.",
    defaultPaperSize: row.default_paper_size ?? "A4",
    showFields,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status ?? "pending",
  };
}

function communicationGatewayFromRow(row) {
  if (!row) {
    return {
      id: DEFAULT_SETTINGS_ID,
      gatewayUrl: "",
      encryptedDeviceToken: "",
      tokenStorage: "",
      tokenPrefix: "",
      hasToken: false,
      connectionStatus: "Not configured",
      providerMode: "Unknown",
      whatsappStatus: "Unknown",
      smsStatus: "Unknown",
      lastSuccessAt: null,
      lastError: "",
      createdAt: "",
      updatedAt: "",
    };
  }

  return {
    id: row.id,
    gatewayUrl: row.gateway_url ?? "",
    encryptedDeviceToken: row.encrypted_device_token ?? "",
    tokenStorage: row.token_storage ?? "",
    tokenPrefix: row.token_prefix ?? "",
    hasToken: Boolean(row.encrypted_device_token),
    connectionStatus: row.connection_status ?? "Not configured",
    providerMode: row.provider_mode ?? "Unknown",
    whatsappStatus: row.whatsapp_status ?? "Unknown",
    smsStatus: row.sms_status ?? "Unknown",
    lastSuccessAt: row.last_success_at ?? null,
    lastError: row.last_error ?? "",
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
    status: row.status ?? "Active",
    reversedAt: row.reversed_at ?? null,
    reversedBy: row.reversed_by ?? "",
    reversalReason: row.reversal_reason ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
  };
}

function discountTypeFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    discountMode: row.discount_mode,
    defaultValue: Number(row.default_value ?? 0),
    description: row.description ?? "",
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function studentDiscountFromRow(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    admissionNo: row.admission_no ?? "",
    studentName: row.student_name ?? "",
    discountTypeId: row.discount_type_id,
    discountTypeName: row.discount_type_name,
    discountMode: row.discount_mode,
    discountValue: Number(row.discount_value ?? 0),
    feeHeadId: row.fee_head_id ?? "",
    feeHeadName: row.fee_head_name ?? "",
    academicSessionId: row.academic_session_id ?? "",
    academicSessionName: row.academic_session_name ?? "",
    startDate: row.start_date ?? "",
    endDate: row.end_date ?? "",
    reason: row.reason ?? "",
    status: row.status,
    approvedBy: row.approved_by ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function feeInvoiceItemFromRow(row) {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    feeHeadId: row.fee_head_id ?? "",
    feeHeadName: row.fee_head_name,
    description: row.description ?? "",
    quantity: Number(row.quantity ?? 1),
    unitAmount: Number(row.unit_amount ?? 0),
    grossAmount: Number(row.gross_amount ?? 0),
    discountAmount: Number(row.discount_amount ?? 0),
    netAmount: Number(row.net_amount ?? 0),
    displayOrder: Number(row.display_order ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
  };
}

function feeInvoiceAllocationFromRow(row) {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    feePaymentId: row.fee_payment_id,
    receiptNo: row.receipt_no ?? "",
    allocatedAmount: Number(row.allocated_amount ?? 0),
    createdAt: row.created_at,
    reversedAt: row.reversed_at ?? null,
    reversalId: row.reversal_id ?? "",
    syncStatus: row.sync_status,
  };
}

function feeInvoiceFromRow(row, items = [], allocations = []) {
  return {
    id: row.id,
    invoiceNo: row.invoice_no,
    studentId: row.student_id,
    admissionNo: row.admission_no ?? "",
    studentName: row.student_name,
    className: row.class_name ?? "",
    section: row.section ?? "",
    academicSessionId: row.academic_session_id ?? "",
    academicSessionName: row.academic_session_name ?? "",
    billingPeriod: row.billing_period ?? "",
    invoiceDate: row.invoice_date,
    dueDate: row.due_date ?? "",
    subtotal: Number(row.subtotal ?? 0),
    discountAmount: Number(row.discount_amount ?? 0),
    previousDue: Number(row.previous_due ?? 0),
    lateFee: Number(row.late_fee ?? 0),
    adjustmentAmount: Number(row.adjustment_amount ?? 0),
    grandTotal: Number(row.grand_total ?? 0),
    paidAmount: Number(row.paid_amount ?? 0),
    balanceAmount: Number(row.balance_amount ?? 0),
    status: row.status,
    notes: row.notes ?? "",
    generatedBy: row.generated_by ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    cancelledAt: row.cancelled_at ?? null,
    cancelledBy: row.cancelled_by ?? "",
    cancellationReason: row.cancellation_reason ?? "",
    syncStatus: row.sync_status,
    items,
    allocations,
  };
}

function feeInvoiceAccountMappingFromRow(row) {
  return {
    id: row.id,
    feeHeadId: row.fee_head_id,
    feeHeadName: row.fee_head_name,
    accountCategoryId: row.account_category_id,
    accountCategoryName: row.account_category_name,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function feePaymentReversalFromRow(row) {
  return {
    id: row.id,
    feePaymentId: row.fee_payment_id,
    receiptNo: row.receipt_no ?? "",
    amount: Number(row.amount ?? 0),
    reason: row.reason ?? "",
    reversedBy: row.reversed_by ?? "",
    createdAt: row.created_at,
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

function employeeAttendanceFromRow(row) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeCode: row.employee_code ?? "",
    employeeName: row.employee_name,
    department: row.department ?? "",
    designation: row.designation ?? "",
    attendanceDate: row.attendance_date,
    status: row.status,
    checkInTime: row.check_in_time ?? "",
    checkOutTime: row.check_out_time ?? "",
    lateMinutes: Number(row.late_minutes ?? 0),
    overtimeMinutes: Number(row.overtime_minutes ?? 0),
    leaveType: row.leave_type ?? "",
    remarks: row.remarks ?? "",
    markedBy: row.marked_by ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
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

function examScheduleFromRow(row, entries = []) {
  return {
    id: row.id,
    academicSessionId: row.academic_session_id ?? "",
    academicSessionName: row.academic_session_name ?? "",
    examId: row.exam_id,
    examName: row.exam_name,
    title: row.title ?? "",
    startDate: row.start_date ?? "",
    endDate: row.end_date ?? "",
    status: row.status ?? "Draft",
    instructions: row.instructions ?? "",
    createdBy: row.created_by ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status ?? "pending",
    entryCount: Number(row.entry_count ?? entries.length ?? 0),
    entries,
  };
}

function examScheduleEntryFromRow(row) {
  return {
    id: row.id,
    scheduleId: row.schedule_id,
    className: row.class_name,
    section: row.section ?? "",
    subjectId: row.subject_id ?? "",
    subjectName: row.subject_name,
    examDate: row.exam_date,
    startTime: row.start_time ?? "",
    endTime: row.end_time ?? "",
    room: row.room ?? "",
    maximumMarks: Number(row.maximum_marks ?? 0),
    passingMarks: Number(row.passing_marks ?? 0),
    invigilatorEmployeeId: row.invigilator_employee_id ?? "",
    invigilatorName: row.invigilator_name ?? "",
    instructions: row.instructions ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status ?? "pending",
  };
}

function gradingRangeFromRow(row) {
  return {
    id: row.id,
    gradingSchemeId: row.grading_scheme_id,
    minValue: Number(row.min_value ?? 0),
    maxValue: Number(row.max_value ?? 0),
    grade: row.grade,
    gradePoint:
      row.grade_point === null || row.grade_point === undefined
        ? null
        : Number(row.grade_point),
    resultStatus: row.result_status,
    description: row.description ?? "",
    displayOrder: Number(row.display_order ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function gradingSchemeFromRow(row, ranges = []) {
  return {
    id: row.id,
    name: row.name,
    academicSessionId: row.academic_session_id ?? "",
    academicSessionName: row.academic_session_name ?? "",
    className: row.class_name ?? "",
    calculationMode: row.calculation_mode,
    status: row.status,
    isDefault: Number(row.is_default ?? 0) === 1,
    description: row.description ?? "",
    createdBy: row.created_by ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
    ranges,
  };
}

function reportCardTemplateFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    templateType: row.template_type,
    academicSessionId: row.academic_session_id ?? "",
    className: row.class_name ?? "",
    showAttendance: Number(row.show_attendance ?? 1) === 1,
    showClassTests: Number(row.show_class_tests ?? 0) === 1,
    showBehaviour: Number(row.show_behaviour ?? 1) === 1,
    showSkills: Number(row.show_skills ?? 1) === 1,
    showTeacherRemarks: Number(row.show_teacher_remarks ?? 1) === 1,
    showPrincipalSignature:
      Number(row.show_principal_signature ?? 1) === 1,
    headerText: row.header_text ?? "",
    footerText: row.footer_text ?? "",
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function reportCardSubjectFromRow(row) {
  return {
    id: row.id,
    reportCardId: row.report_card_id,
    subjectId: row.subject_id ?? "",
    subjectName: row.subject_name,
    maxMarks: Number(row.max_marks ?? 0),
    passingMarks: Number(row.passing_marks ?? 0),
    obtainedMarks: Number(row.obtained_marks ?? 0),
    percentage: Number(row.percentage ?? 0),
    grade: row.grade ?? "",
    gradePoint:
      row.grade_point === null || row.grade_point === undefined
        ? null
        : Number(row.grade_point),
    resultStatus: row.result_status ?? "",
    remarks: row.remarks ?? "",
    displayOrder: Number(row.display_order ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status,
  };
}

function reportCardFromRow(row, subjects = []) {
  return {
    id: row.id,
    reportCardNo: row.report_card_no,
    studentId: row.student_id,
    admissionNo: row.admission_no ?? "",
    studentName: row.student_name,
    className: row.class_name ?? "",
    section: row.section ?? "",
    academicSessionId: row.academic_session_id ?? "",
    academicSessionName: row.academic_session_name ?? "",
    examId: row.exam_id ?? "",
    examName: row.exam_name ?? "",
    gradingSchemeId: row.grading_scheme_id ?? "",
    gradingSchemeName: row.grading_scheme_name ?? "",
    totalMaxMarks: Number(row.total_max_marks ?? 0),
    totalObtainedMarks: Number(row.total_obtained_marks ?? 0),
    percentage: Number(row.percentage ?? 0),
    overallGrade: row.overall_grade ?? "",
    resultStatus: row.result_status,
    attendanceWorkingDays: Number(row.attendance_working_days ?? 0),
    attendancePresentDays: Number(row.attendance_present_days ?? 0),
    attendancePercentage: Number(row.attendance_percentage ?? 0),
    classPosition:
      row.class_position === null || row.class_position === undefined
        ? null
        : Number(row.class_position),
    sectionPosition:
      row.section_position === null || row.section_position === undefined
        ? null
        : Number(row.section_position),
    teacherRemarks: row.teacher_remarks ?? "",
    principalRemarks: row.principal_remarks ?? "",
    generatedBy: row.generated_by ?? "",
    generatedAt: row.generated_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
    subjects,
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
    accountType: row.account_type ?? "Staff",
    mustChangePassword: Number(row.must_change_password ?? 0) === 1,
    passwordChangedAt: row.password_changed_at ?? null,
    failedLoginCount: Number(row.failed_login_count ?? 0),
    lockedUntil: row.locked_until ?? null,
    lastLoginAt: row.last_login_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function userEntityLinkFromRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    username: row.username ?? "",
    userName: row.user_name ?? "",
    role: row.role ?? "",
    accountType: row.account_type ?? "",
    status: row.user_status ?? row.status ?? "",
    mustChangePassword: Number(row.must_change_password ?? 0) === 1,
    lastLoginAt: row.last_login_at ?? null,
    entityType: row.entity_type,
    entityId: row.entity_id,
    entityCode: row.entity_code ?? "",
    entityName: row.entity_name ?? "",
    isPrimary: Number(row.is_primary ?? 1) === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function schoolRuleFromRow(row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    ruleText: row.rule_text,
    displayOrder: Number(row.display_order ?? 0),
    status: row.status,
    academicSessionId: row.academic_session_id ?? "",
    academicSessionName: row.academic_session_name ?? "",
    effectiveFrom: row.effective_from ?? "",
    createdBy: row.created_by ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function appPreferenceFromRow(row) {
  return {
    id: row.id,
    preferenceScope: row.preference_scope,
    userId: row.user_id ?? "",
    themeMode: row.theme_mode ?? "Light",
    accentColor: row.accent_color ?? "Blue",
    language: row.language ?? "English",
    compactSidebar: Number(row.compact_sidebar ?? 0) === 1,
    fontScale: row.font_scale ?? "Normal",
    dateFormat: row.date_format ?? "DD/MM/YYYY",
    timeFormat: row.time_format ?? "12 Hour",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function loginHistoryFromRow(row) {
  return {
    id: row.id,
    userId: row.user_id ?? "",
    username: row.username ?? "",
    role: row.role ?? "",
    loginAt: row.login_at ?? "",
    logoutAt: row.logout_at ?? "",
    success: Number(row.success ?? 1) === 1,
    deviceName: row.device_name ?? "",
    os: row.os ?? "",
    failureReason: row.failure_reason ?? "",
    createdAt: row.created_at,
  };
}

function messageThreadFromRow(row) {
  return {
    id: row.id,
    subject: row.subject,
    threadType: row.thread_type,
    createdByUserId: row.created_by_user_id,
    createdByName: row.created_by_name ?? "",
    createdByRole: row.created_by_role ?? "",
    academicSessionId: row.academic_session_id ?? "",
    className: row.class_name ?? "",
    section: row.section ?? "",
    status: row.status ?? "Active",
    priority: row.priority ?? "Normal",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
    senderName: row.sender_name ?? row.created_by_name ?? "",
    senderRole: row.sender_role ?? row.created_by_role ?? "",
    lastMessageAt: row.last_message_at ?? row.updated_at ?? row.created_at,
    lastMessagePreview:
      row.last_message_deleted_at || row.last_message_deleted
        ? "This message was removed."
        : row.last_message_preview ?? "",
    deliveryStatus: row.delivery_status ?? "",
    deliveredAt: row.delivered_at ?? "",
    readAt: row.read_at ?? "",
    archivedAt: row.archived_at ?? "",
    isRead: Boolean(row.read_at) || row.delivery_status === "Read",
    unreadCount: Number(row.unread_count ?? 0),
    recipientCount: Number(row.recipient_count ?? 0),
    readCount: Number(row.read_count ?? 0),
    recipientSummary: row.recipient_summary ?? "",
    announcementId: row.announcement_id ?? "",
  };
}

function messageFromRow(row) {
  const isDeleted = Boolean(row.deleted_at);
  return {
    id: row.id,
    threadId: row.thread_id,
    senderUserId: row.sender_user_id,
    senderName: row.sender_name ?? "",
    senderRole: row.sender_role ?? "",
    messageText: isDeleted
      ? "This message was removed."
      : row.message_text ?? "",
    messageType: row.message_type ?? "Text",
    replyToMessageId: row.reply_to_message_id ?? "",
    editedAt: row.edited_at ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    isDeleted,
    syncStatus: row.sync_status,
  };
}

function messageRecipientFromRow(row) {
  return {
    id: row.id,
    threadId: row.thread_id,
    recipientUserId: row.recipient_user_id,
    recipientName: row.recipient_name ?? row.user_name ?? "",
    recipientUsername: row.recipient_username ?? row.username ?? "",
    recipientRole: row.recipient_role ?? "",
    recipientEntityType: row.recipient_entity_type ?? "",
    recipientEntityId: row.recipient_entity_id ?? "",
    recipientEntityCode: row.recipient_entity_code ?? "",
    recipientEntityName: row.recipient_entity_name ?? "",
    className: row.class_name ?? "",
    section: row.section ?? "",
    deliveryStatus: row.delivery_status ?? "Delivered",
    deliveredAt: row.delivered_at ?? "",
    readAt: row.read_at ?? "",
    archivedAt: row.archived_at ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function announcementFromRow(row) {
  return {
    id: row.id,
    title: row.title,
    announcementText: row.announcement_text,
    audienceType: row.audience_type,
    academicSessionId: row.academic_session_id ?? "",
    className: row.class_name ?? "",
    section: row.section ?? "",
    priority: row.priority ?? "Normal",
    publishFrom: row.publish_from ?? "",
    publishUntil: row.publish_until ?? "",
    status: row.status ?? "Draft",
    selectedUserIds: (() => {
      try {
        const parsed = JSON.parse(row.selected_user_ids_json || "[]");
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      } catch {
        return [];
      }
    })(),
    createdByUserId: row.created_by_user_id ?? "",
    createdByName: row.created_by_name ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
    recipientCount: Number(row.recipient_count ?? 0),
    readCount: Number(row.read_count ?? 0),
    threadId: row.thread_id ?? row.id,
  };
}

function savedReportDefinitionFromRow(row) {
  const parseJson = (value, fallback) => {
    try {
      return JSON.parse(value || JSON.stringify(fallback));
    } catch {
      return fallback;
    }
  };
  return {
    id: row.id,
    name: row.name,
    reportDomain: row.report_domain,
    selectedColumns: parseJson(row.selected_columns, []),
    filters: parseJson(row.filters_json, {}),
    sort: parseJson(row.sort_json, []),
    group: parseJson(row.group_json, []),
    createdBy: row.created_by ?? "",
    visibility: row.visibility ?? "Private",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status ?? "pending",
  };
}

function liveClassFromRow(row, attendance = []) {
  return {
    id: row.id,
    academicSessionId: row.academic_session_id ?? "",
    className: row.class_name ?? "",
    section: row.section ?? "",
    subjectId: row.subject_id ?? "",
    subjectName: row.subject_name ?? "",
    teacherEmployeeId: row.teacher_employee_id ?? "",
    teacherName: row.teacher_name ?? "",
    title: row.title,
    description: row.description ?? "",
    provider: row.provider ?? "",
    meetingUrl: row.meeting_url,
    meetingId: row.meeting_id ?? "",
    startAt: row.start_at,
    endAt: row.end_at,
    status: row.status ?? "Draft",
    recordingUrl: row.recording_url ?? "",
    notes: row.notes ?? "",
    createdBy: row.created_by ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status ?? "pending",
    attendance,
  };
}

function liveClassAttendanceFromRow(row) {
  return {
    id: row.id,
    liveClassId: row.live_class_id,
    studentId: row.student_id,
    studentName: row.student_name ?? "",
    joinedAt: row.joined_at ?? "",
    leftAt: row.left_at ?? "",
    attendanceStatus: row.attendance_status ?? "",
    remarks: row.remarks ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status ?? "pending",
  };
}

function storeCategoryFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    status: row.status ?? "Active",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status ?? "pending",
  };
}

function storeTaxRateFromRow(row) {
  return {
    id: row.id,
    name: row.name,
    rate: Number(row.rate ?? 0),
    status: row.status ?? "Active",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status ?? "pending",
  };
}

function storeProductFromRow(row) {
  return {
    id: row.id,
    categoryId: row.category_id ?? "",
    categoryName: row.category_name ?? "",
    taxRateId: row.tax_rate_id ?? "",
    taxRateName: row.tax_rate_name ?? "",
    taxRate: Number(row.tax_rate ?? 0),
    sku: row.sku ?? "",
    barcode: row.barcode ?? "",
    name: row.name,
    description: row.description ?? "",
    price: Number(row.price ?? 0),
    costPrice: Number(row.cost_price ?? 0),
    currentStock: Number(row.current_stock ?? 0),
    minimumStock: Number(row.minimum_stock ?? 0),
    status: row.status ?? "Active",
    imagePath: row.image_path ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status ?? "pending",
  };
}

function storeInventoryTransactionFromRow(row) {
  return {
    id: row.id,
    productId: row.product_id,
    variantId: row.variant_id ?? "",
    transactionType: row.transaction_type,
    quantity: Number(row.quantity ?? 0),
    unitCost: Number(row.unit_cost ?? 0),
    unitPrice: Number(row.unit_price ?? 0),
    stockBefore: Number(row.stock_before ?? 0),
    stockAfter: Number(row.stock_after ?? 0),
    referenceType: row.reference_type ?? "",
    referenceId: row.reference_id ?? "",
    notes: row.notes ?? "",
    transactionDate: row.transaction_date,
    createdBy: row.created_by ?? "",
    createdAt: row.created_at,
    syncStatus: row.sync_status ?? "pending",
    productName: row.product_name ?? "",
    sku: row.sku ?? "",
  };
}

function storeCustomerFromRow(row) {
  return {
    id: row.id,
    customerType: row.customer_type ?? "Walk-in",
    studentId: row.student_id ?? "",
    admissionNo: row.admission_no ?? "",
    name: row.name,
    mobile: row.mobile ?? "",
    email: row.email ?? "",
    status: row.status ?? "Active",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status ?? "pending",
  };
}

function storeOrderItemFromRow(row) {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    variantId: row.variant_id ?? "",
    sku: row.sku ?? "",
    productName: row.product_name,
    quantity: Number(row.quantity ?? 0),
    unitPrice: Number(row.unit_price ?? 0),
    discountAmount: Number(row.discount_amount ?? 0),
    taxRate: Number(row.tax_rate ?? 0),
    taxAmount: Number(row.tax_amount ?? 0),
    lineTotal: Number(row.line_total ?? 0),
    createdAt: row.created_at,
    syncStatus: row.sync_status ?? "pending",
  };
}

function storePaymentFromRow(row) {
  return {
    id: row.id,
    orderId: row.order_id,
    paymentMode: row.payment_mode,
    amount: Number(row.amount ?? 0),
    referenceNo: row.reference_no ?? "",
    paymentDate: row.payment_date,
    createdAt: row.created_at,
    syncStatus: row.sync_status ?? "pending",
  };
}

function storeOrderFromRow(row, items = [], payments = []) {
  return {
    id: row.id,
    orderNo: row.order_no,
    posSessionId: row.pos_session_id ?? "",
    customerId: row.customer_id ?? "",
    studentId: row.student_id ?? "",
    customerName: row.customer_name ?? "",
    orderDate: row.order_date,
    subtotal: Number(row.subtotal ?? 0),
    discountAmount: Number(row.discount_amount ?? 0),
    taxAmount: Number(row.tax_amount ?? 0),
    grandTotal: Number(row.grand_total ?? 0),
    paidAmount: Number(row.paid_amount ?? 0),
    balanceAmount: Number(row.balance_amount ?? 0),
    status: row.status ?? "Completed",
    reversalOfOrderId: row.reversal_of_order_id ?? "",
    reversedAt: row.reversed_at ?? "",
    reversedBy: row.reversed_by ?? "",
    reversalReason: row.reversal_reason ?? "",
    heldAt: row.held_at ?? "",
    cancelledAt: row.cancelled_at ?? "",
    cancelledBy: row.cancelled_by ?? "",
    cancellationReason: row.cancellation_reason ?? "",
    notes: row.notes ?? "",
    createdBy: row.created_by ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status ?? "pending",
    items,
    payments,
  };
}

function storePosSessionFromRow(row) {
  return {
    id: row.id,
    sessionNo: row.session_no,
    cashierUserId: row.cashier_user_id ?? "",
    username: row.username ?? "",
    displayName: row.display_name ?? row.cashier_name ?? "",
    cashierName: row.cashier_name ?? "",
    openedAt: row.opened_at,
    closedAt: row.closed_at ?? "",
    openingCash: Number(row.opening_cash ?? 0),
    closingCash: Number(row.closing_cash ?? 0),
    expectedCash: Number(row.expected_cash ?? 0),
    countedCash: Number(row.counted_cash ?? 0),
    cashVariance: Number(row.cash_variance ?? 0),
    status: row.status ?? "Open",
    notes: row.notes ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncStatus: row.sync_status ?? "pending",
  };
}

function storePosAccountMappingFromRow(row) {
  return {
    id: row.id,
    mappingKey: row.mapping_key,
    label:
      row.label ||
      STORE_POS_ACCOUNT_MAPPINGS[row.mapping_key]?.label ||
      row.mapping_key,
    accountCategoryId: row.account_category_id ?? "",
    accountCategoryName: row.account_category_name ?? "",
    accountType:
      row.account_type ||
      STORE_POS_ACCOUNT_MAPPINGS[row.mapping_key]?.accountType ||
      "Income",
    status: row.status ?? "Active",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status ?? "pending",
  };
}

function messageRecipientCandidateFromRow(row) {
  const entityType = row.entity_type ?? (
    row.account_type === "Student" || row.role === "Student" ? "Student" : "User"
  );
  const entityId = row.entity_id ?? "";
  const studentName = row.student_name ?? "";
  const employeeName = row.employee_name ?? "";
  const entityName =
    entityType === "Student"
      ? studentName || row.entity_name || row.user_name
      : entityType === "Employee"
        ? employeeName || row.entity_name || row.user_name
        : row.user_name;
  const entityCode =
    entityType === "Student"
      ? row.admission_no ?? row.entity_code ?? ""
      : entityType === "Employee"
        ? row.employee_no ?? row.entity_code ?? ""
        : "";
  return {
    userId: row.user_id,
    name: row.user_name,
    username: row.username,
    role: row.role,
    accountType: row.account_type ?? "Staff",
    entityType,
    entityId,
    entityCode,
    entityName,
    className: row.class_name ?? "",
    section: row.section ?? "",
    department: row.department ?? "",
    designation: row.designation ?? "",
    label: [
      entityName || row.user_name,
      entityCode,
      row.role,
      row.class_name && row.section
        ? `${row.class_name}-${row.section}`
        : row.department,
    ]
      .filter(Boolean)
      .join(" · "),
  };
}

function familyFromRow(row) {
  return {
    id: row.id,
    familyCode: row.family_code,
    familyName: row.family_name ?? "",
    primaryContactName: row.primary_contact_name ?? "",
    primaryMobile: row.primary_mobile ?? "",
    secondaryMobile: row.secondary_mobile ?? "",
    email: row.email ?? "",
    address: row.address ?? "",
    city: row.city ?? "",
    state: row.state ?? "",
    postalCode: row.postal_code ?? "",
    emergencyContactName: row.emergency_contact_name ?? "",
    emergencyContactMobile: row.emergency_contact_mobile ?? "",
    notes: row.notes ?? "",
    status: row.status ?? "Active",
    studentCount: Number(row.student_count ?? 0),
    guardianCount: Number(row.guardian_count ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function guardianFromRow(row) {
  return {
    id: row.id,
    familyId: row.family_id ?? "",
    familyCode: row.family_code ?? "",
    familyName: row.family_name ?? "",
    fullName: row.full_name,
    relation: row.relation,
    mobile: row.mobile ?? "",
    alternateMobile: row.alternate_mobile ?? "",
    email: row.email ?? "",
    occupation: row.occupation ?? "",
    qualification: row.qualification ?? "",
    annualIncome:
      row.annual_income === null || row.annual_income === undefined
        ? null
        : Number(row.annual_income),
    address: row.address ?? "",
    isPrimary: Number(row.is_primary ?? 0) === 1,
    canPickupStudent: Number(row.can_pickup_student ?? 1) === 1,
    emergencyContact: Number(row.emergency_contact ?? 0) === 1,
    status: row.status ?? "Active",
    linkedStudentCount: Number(row.linked_student_count ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function studentGuardianLinkFromRow(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    studentName: row.student_name ?? "",
    admissionNo: row.admission_no ?? "",
    className: row.class_name ?? "",
    section: row.section ?? "",
    guardianId: row.guardian_id,
    guardianName: row.guardian_name ?? row.full_name ?? "",
    guardianFullName: row.full_name ?? row.guardian_name ?? "",
    relation: row.relation ?? "",
    mobile: row.mobile ?? "",
    alternateMobile: row.alternate_mobile ?? "",
    email: row.email ?? "",
    occupation: row.occupation ?? "",
    address: row.address ?? "",
    familyId: row.family_id ?? "",
    familyCode: row.family_code ?? "",
    familyName: row.family_name ?? "",
    relationToStudent: row.relation_to_student ?? row.relation ?? "",
    isPrimary: Number(row.is_primary ?? 0) === 1,
    livesWithStudent: Number(row.lives_with_student ?? 1) === 1,
    financialResponsibility:
      Number(row.financial_responsibility ?? 0) === 1,
    pickupAuthorized: Number(row.pickup_authorized ?? 1) === 1,
    guardianCanPickupStudent:
      Number(row.guardian_can_pickup_student ?? row.can_pickup_student ?? 1) ===
      1,
    guardianEmergencyContact:
      Number(row.guardian_emergency_contact ?? row.emergency_contact ?? 0) ===
      1,
    emergencyContactName: row.emergency_contact_name ?? "",
    emergencyContactMobile: row.emergency_contact_mobile ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status,
  };
}

function parentsInfoRowFromRow(row) {
  return {
    studentId: row.student_id,
    admissionNo: row.admission_no ?? "",
    studentName: row.student_name ?? "",
    className: row.class_name ?? "",
    section: row.section ?? "",
    familyId: row.family_id ?? "",
    familyCode: row.family_code ?? "",
    familyName: row.family_name ?? "",
    guardianId: row.guardian_id ?? "",
    primaryGuardian: row.primary_guardian ?? "",
    relation: row.relation ?? "",
    mobile: row.mobile ?? "",
    alternateMobile: row.alternate_mobile ?? "",
    email: row.email ?? "",
    occupation: row.occupation ?? "",
    address: row.address ?? "",
    emergencyContact: Number(row.emergency_contact ?? 0) === 1,
    emergencyContactName: row.emergency_contact_name ?? "",
    emergencyContactMobile: row.emergency_contact_mobile ?? "",
    pickupAuthorized: Number(row.pickup_authorized ?? 0) === 1,
    hasLinkedGuardian: Number(row.has_linked_guardian ?? 0) === 1,
    source: row.source ?? "Legacy",
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

function admissionFormSnapshotFromRow(row) {
  let snapshot = {};
  try {
    snapshot = JSON.parse(row.snapshot_json ?? "{}");
  } catch {
    snapshot = {};
  }
  return {
    id: row.id,
    snapshotNo: row.snapshot_no,
    studentId: row.student_id ?? "",
    admissionNo: row.admission_no ?? "",
    studentName: row.student_name ?? "",
    formDate: row.form_date,
    issuedBy: row.issued_by ?? "",
    snapshot,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status ?? "pending",
  };
}

function transferCertificateFromRow(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    certificateNumber: row.certificate_number,
    serialNumber: row.serial_number ?? "",
    srNumber: row.sr_number ?? "",
    penNumber: row.pen_number ?? "",
    academicSessionId: row.academic_session_id ?? "",
    academicSessionName: row.academic_session_name ?? "",
    studentName: row.student_name ?? "",
    admissionNo: row.admission_no ?? "",
    className: row.class_name ?? "",
    section: row.section ?? "",
    fatherGuardianName: row.father_guardian_name ?? "",
    motherName: row.mother_name ?? "",
    dateOfAdmission: row.date_of_admission ?? "",
    admissionClass: row.admission_class ?? "",
    dateOfBirth: row.date_of_birth ?? "",
    dateOfBirthWords: row.date_of_birth_words ?? "",
    lastClassStudied: row.last_class_studied ?? "",
    promotionQualified: row.promotion_qualified ?? "",
    promotedToClass: row.promoted_to_class ?? "",
    duesPaidUpto: row.dues_paid_upto ?? "",
    generalConduct: row.general_conduct ?? "",
    issueDate: row.issue_date ?? "",
    reasonForLeaving: row.reason_for_leaving ?? "",
    nationality: row.nationality ?? "",
    casteCategory: row.caste_category ?? "",
    remarks: row.remarks ?? "",
    status: row.status ?? "Draft",
    issuedBy: row.issued_by ?? "",
    reissuedFromId: row.reissued_from_id ?? "",
    reprintCount: Number(row.reprint_count ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    cancelledAt: row.cancelled_at ?? null,
    cancellationReason: row.cancellation_reason ?? "",
    deletedAt: row.deleted_at,
    syncStatus: row.sync_status ?? "pending",
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

function remoteLicenseStatusFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    licenseId: row.license_id ?? "",
    deviceId: row.device_id ?? "",
    remoteStatus: row.remote_status ?? "Unknown",
    lastOnlineCheckAt: row.last_online_check_at ?? null,
    nextRequiredCheckAt: row.next_required_check_at ?? null,
    graceUntil: row.grace_until ?? null,
    lastError: row.last_error ?? "",
    serverMessage: row.server_message ?? "",
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

function integerAmount(value, fieldName) {
  const number = Number(value ?? 0);
  if (!Number.isInteger(number)) {
    throw new Error(`${fieldName} must be a whole number.`);
  }
  return number;
}

function decimalNumber(value, fieldName, minimum = 0) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < minimum) {
    throw new Error(`${fieldName} must be a number of at least ${minimum}.`);
  }
  return Math.round(number * 100) / 100;
}

function normalizeTime(value, fieldName) {
  const time = requiredText(value, fieldName);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw new Error(`${fieldName} must use HH:MM format.`);
  }
  return time;
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

    CREATE TABLE IF NOT EXISTS communication_gateway_settings (
      id TEXT PRIMARY KEY,
      gateway_url TEXT,
      encrypted_device_token TEXT,
      token_storage TEXT,
      token_prefix TEXT,
      connection_status TEXT DEFAULT 'Not configured',
      provider_mode TEXT DEFAULT 'Unknown',
      whatsapp_status TEXT DEFAULT 'Unknown',
      sms_status TEXT DEFAULT 'Unknown',
      last_success_at TEXT,
      last_error TEXT,
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

    CREATE TABLE IF NOT EXISTS families (
      id TEXT PRIMARY KEY,
      family_code TEXT UNIQUE NOT NULL,
      family_name TEXT,
      primary_contact_name TEXT,
      primary_mobile TEXT,
      secondary_mobile TEXT,
      email TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      postal_code TEXT,
      emergency_contact_name TEXT,
      emergency_contact_mobile TEXT,
      notes TEXT,
      status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS guardians (
      id TEXT PRIMARY KEY,
      family_id TEXT,
      full_name TEXT NOT NULL,
      relation TEXT NOT NULL CHECK (
        relation IN (
          'Father', 'Mother', 'Guardian', 'Grandfather', 'Grandmother',
          'Brother', 'Sister', 'Uncle', 'Aunt', 'Other'
        )
      ),
      mobile TEXT,
      alternate_mobile TEXT,
      email TEXT,
      occupation TEXT,
      qualification TEXT,
      annual_income INTEGER,
      address TEXT,
      is_primary INTEGER DEFAULT 0,
      can_pickup_student INTEGER DEFAULT 1,
      emergency_contact INTEGER DEFAULT 0,
      status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (family_id) REFERENCES families(id)
    );

    CREATE TABLE IF NOT EXISTS student_guardian_links (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      guardian_id TEXT NOT NULL,
      family_id TEXT,
      relation_to_student TEXT,
      is_primary INTEGER DEFAULT 0,
      lives_with_student INTEGER DEFAULT 1,
      financial_responsibility INTEGER DEFAULT 0,
      pickup_authorized INTEGER DEFAULT 1,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (guardian_id) REFERENCES guardians(id),
      FOREIGN KEY (family_id) REFERENCES families(id)
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

    CREATE TABLE IF NOT EXISTS employee_attendance (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      employee_code TEXT,
      employee_name TEXT NOT NULL,
      department TEXT,
      designation TEXT,
      attendance_date TEXT NOT NULL,
      status TEXT NOT NULL CHECK (
        status IN (
          'Present',
          'Absent',
          'Leave',
          'Half Day',
          'Late',
          'Holiday'
        )
      ),
      check_in_time TEXT,
      check_out_time TEXT,
      late_minutes INTEGER DEFAULT 0,
      overtime_minutes INTEGER DEFAULT 0,
      leave_type TEXT,
      remarks TEXT,
      marked_by TEXT,
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

    CREATE TABLE IF NOT EXISTS timetable_weekdays (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      display_order INTEGER,
      is_active INTEGER DEFAULT 1,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS timetable_periods (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      display_order INTEGER,
      is_break INTEGER DEFAULT 0,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS classrooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      capacity INTEGER,
      description TEXT,
      status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS timetable_entries (
      id TEXT PRIMARY KEY,
      class_name TEXT NOT NULL,
      section TEXT,
      weekday_id TEXT NOT NULL,
      weekday_name TEXT NOT NULL,
      period_id TEXT NOT NULL,
      period_name TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      subject_id TEXT,
      subject_name TEXT,
      teacher_id TEXT,
      teacher_name TEXT,
      classroom_id TEXT,
      classroom_name TEXT,
      notes TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (weekday_id) REFERENCES timetable_weekdays(id),
      FOREIGN KEY (period_id) REFERENCES timetable_periods(id),
      FOREIGN KEY (subject_id) REFERENCES subjects(id),
      FOREIGN KEY (teacher_id) REFERENCES employees(id),
      FOREIGN KEY (classroom_id) REFERENCES classrooms(id)
    );

    CREATE TABLE IF NOT EXISTS homework (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      class_name TEXT NOT NULL,
      section TEXT,
      subject_id TEXT,
      subject_name TEXT,
      teacher_id TEXT,
      teacher_name TEXT,
      homework_date TEXT NOT NULL,
      due_date TEXT,
      description TEXT,
      instructions TEXT,
      status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
      created_by TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (subject_id) REFERENCES subjects(id),
      FOREIGN KEY (teacher_id) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS homework_submissions (
      id TEXT PRIMARY KEY,
      homework_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      admission_no TEXT,
      class_name TEXT,
      section TEXT,
      status TEXT DEFAULT 'Pending'
        CHECK (status IN ('Pending', 'Submitted', 'Checked', 'Late', 'Missing')),
      submitted_date TEXT,
      remarks TEXT,
      marks INTEGER,
      created_at TEXT,
      updated_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (homework_id) REFERENCES homework(id),
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS class_tests (
      id TEXT PRIMARY KEY,
      test_name TEXT NOT NULL,
      class_name TEXT NOT NULL,
      section TEXT,
      subject_id TEXT,
      subject_name TEXT,
      teacher_id TEXT,
      teacher_name TEXT,
      test_date TEXT NOT NULL,
      max_marks INTEGER NOT NULL,
      passing_marks INTEGER DEFAULT 0,
      description TEXT,
      status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
      created_by TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (subject_id) REFERENCES subjects(id),
      FOREIGN KEY (teacher_id) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS class_test_marks (
      id TEXT PRIMARY KEY,
      test_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      admission_no TEXT,
      class_name TEXT,
      section TEXT,
      marks_obtained INTEGER DEFAULT 0,
      result_status TEXT DEFAULT 'Pending'
        CHECK (result_status IN ('Pending', 'Pass', 'Fail', 'Absent')),
      remarks TEXT,
      created_at TEXT,
      updated_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (test_id) REFERENCES class_tests(id),
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS subject_chapters (
      id TEXT PRIMARY KEY,
      class_name TEXT NOT NULL,
      subject_id TEXT,
      subject_name TEXT NOT NULL,
      chapter_name TEXT NOT NULL,
      chapter_no TEXT,
      description TEXT,
      status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (subject_id) REFERENCES subjects(id)
    );

    CREATE TABLE IF NOT EXISTS question_bank (
      id TEXT PRIMARY KEY,
      class_name TEXT NOT NULL,
      subject_id TEXT,
      subject_name TEXT NOT NULL,
      chapter_id TEXT,
      chapter_name TEXT,
      question_type TEXT NOT NULL CHECK (
        question_type IN (
          'Objective', 'Short Answer', 'Long Answer',
          'Fill in the Blanks', 'True/False', 'Match the Following'
        )
      ),
      difficulty TEXT DEFAULT 'Medium'
        CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
      question_text TEXT NOT NULL,
      option_a TEXT,
      option_b TEXT,
      option_c TEXT,
      option_d TEXT,
      correct_answer TEXT,
      marks INTEGER DEFAULT 1,
      status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
      created_by TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (subject_id) REFERENCES subjects(id),
      FOREIGN KEY (chapter_id) REFERENCES subject_chapters(id)
    );

    CREATE TABLE IF NOT EXISTS question_papers (
      id TEXT PRIMARY KEY,
      paper_no TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      class_name TEXT NOT NULL,
      section TEXT,
      subject_id TEXT,
      subject_name TEXT NOT NULL,
      exam_name TEXT,
      duration_minutes INTEGER,
      total_marks INTEGER,
      instructions TEXT,
      created_by TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (subject_id) REFERENCES subjects(id)
    );

    CREATE TABLE IF NOT EXISTS question_paper_items (
      id TEXT PRIMARY KEY,
      paper_id TEXT NOT NULL,
      question_id TEXT,
      section_title TEXT,
      display_order INTEGER,
      question_type TEXT,
      question_text TEXT NOT NULL,
      option_a TEXT,
      option_b TEXT,
      option_c TEXT,
      option_d TEXT,
      correct_answer TEXT,
      marks INTEGER DEFAULT 1,
      created_at TEXT,
      updated_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (paper_id) REFERENCES question_papers(id),
      FOREIGN KEY (question_id) REFERENCES question_bank(id)
    );

    CREATE TABLE IF NOT EXISTS behaviour_traits (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS skill_traits (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      domain TEXT NOT NULL CHECK (domain IN ('Affective', 'Psychomotor')),
      description TEXT,
      status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS student_behaviour_ratings (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      admission_no TEXT,
      class_name TEXT,
      section TEXT,
      trait_id TEXT,
      trait_name TEXT NOT NULL,
      rating TEXT CHECK (
        rating IN (
          'Excellent', 'Very Good', 'Good', 'Average', 'Needs Improvement'
        )
      ),
      rating_date TEXT NOT NULL,
      academic_year TEXT,
      remarks TEXT,
      rated_by TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (trait_id) REFERENCES behaviour_traits(id)
    );

    CREATE TABLE IF NOT EXISTS student_skill_ratings (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      admission_no TEXT,
      class_name TEXT,
      section TEXT,
      skill_id TEXT,
      skill_name TEXT NOT NULL,
      domain TEXT NOT NULL CHECK (domain IN ('Affective', 'Psychomotor')),
      rating TEXT CHECK (
        rating IN (
          'Excellent', 'Very Good', 'Good', 'Average', 'Needs Improvement'
        )
      ),
      rating_date TEXT NOT NULL,
      academic_year TEXT,
      remarks TEXT,
      rated_by TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (skill_id) REFERENCES skill_traits(id)
    );

    CREATE TABLE IF NOT EXISTS student_observations (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      student_name TEXT NOT NULL,
      admission_no TEXT,
      class_name TEXT,
      section TEXT,
      observation_date TEXT NOT NULL,
      observation_type TEXT CHECK (
        observation_type IN (
          'Academic', 'Behaviour', 'Discipline', 'Health', 'General'
        )
      ),
      observation_text TEXT NOT NULL,
      action_taken TEXT,
      follow_up_date TEXT,
      status TEXT DEFAULT 'Open'
        CHECK (status IN ('Open', 'Follow Up', 'Closed')),
      created_by TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS academic_sessions (
      id TEXT PRIMARY KEY,
      session_name TEXT UNIQUE NOT NULL,
      start_date TEXT,
      end_date TEXT,
      status TEXT DEFAULT 'Inactive'
        CHECK (status IN ('Active', 'Inactive', 'Closed')),
      is_current INTEGER DEFAULT 0,
      created_at TEXT,
      updated_at TEXT,
      closed_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS student_session_history (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      admission_no TEXT,
      student_name TEXT,
      academic_session_id TEXT,
      academic_session_name TEXT,
      class_name TEXT,
      section TEXT,
      roll_no TEXT,
      status TEXT DEFAULT 'Active' CHECK (
        status IN ('Active', 'Promoted', 'Repeated', 'TC', 'Left', 'Inactive')
      ),
      result_status TEXT CHECK (
        result_status IN ('Pass', 'Fail', 'Repeat', 'TC', 'Left', 'Not Applicable')
      ),
      promoted_to_session_id TEXT,
      promoted_to_session_name TEXT,
      promoted_to_class TEXT,
      promoted_to_section TEXT,
      promotion_date TEXT,
      remarks TEXT,
      created_at TEXT,
      updated_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (academic_session_id) REFERENCES academic_sessions(id),
      FOREIGN KEY (promoted_to_session_id) REFERENCES academic_sessions(id)
    );

    CREATE TABLE IF NOT EXISTS student_promotions (
      id TEXT PRIMARY KEY,
      promotion_no TEXT UNIQUE NOT NULL,
      from_session_id TEXT NOT NULL,
      from_session_name TEXT NOT NULL,
      to_session_id TEXT NOT NULL,
      to_session_name TEXT NOT NULL,
      from_class TEXT,
      from_section TEXT,
      to_class TEXT,
      to_section TEXT,
      promotion_date TEXT NOT NULL,
      total_students INTEGER DEFAULT 0,
      promoted_count INTEGER DEFAULT 0,
      repeated_count INTEGER DEFAULT 0,
      tc_count INTEGER DEFAULT 0,
      left_count INTEGER DEFAULT 0,
      inactive_count INTEGER DEFAULT 0,
      carry_forward_dues INTEGER DEFAULT 0,
      created_by TEXT,
      remarks TEXT,
      created_at TEXT,
      updated_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (from_session_id) REFERENCES academic_sessions(id),
      FOREIGN KEY (to_session_id) REFERENCES academic_sessions(id)
    );

    CREATE TABLE IF NOT EXISTS student_promotion_items (
      id TEXT PRIMARY KEY,
      promotion_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      admission_no TEXT,
      student_name TEXT,
      old_class TEXT,
      old_section TEXT,
      new_class TEXT,
      new_section TEXT,
      action TEXT NOT NULL CHECK (
        action IN ('Promote', 'Repeat', 'TC', 'Left', 'Inactive')
      ),
      old_due_amount INTEGER DEFAULT 0,
      carried_forward_amount INTEGER DEFAULT 0,
      remarks TEXT,
      created_at TEXT,
      updated_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (promotion_id) REFERENCES student_promotions(id),
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS fee_due_carry_forward (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      admission_no TEXT,
      student_name TEXT,
      from_session_id TEXT,
      from_session_name TEXT,
      to_session_id TEXT,
      to_session_name TEXT,
      old_due_amount INTEGER DEFAULT 0,
      carried_amount INTEGER DEFAULT 0,
      status TEXT DEFAULT 'Pending'
        CHECK (status IN ('Pending', 'Paid', 'Waived')),
      promotion_id TEXT,
      created_at TEXT,
      updated_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (from_session_id) REFERENCES academic_sessions(id),
      FOREIGN KEY (to_session_id) REFERENCES academic_sessions(id),
      FOREIGN KEY (promotion_id) REFERENCES student_promotions(id)
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

    CREATE TABLE IF NOT EXISTS discount_types (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      discount_mode TEXT NOT NULL CHECK (
        discount_mode IN ('Fixed', 'Percentage')
      ),
      default_value INTEGER DEFAULT 0,
      description TEXT,
      status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS student_discounts (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      admission_no TEXT,
      student_name TEXT,
      discount_type_id TEXT NOT NULL,
      discount_type_name TEXT NOT NULL,
      discount_mode TEXT NOT NULL CHECK (
        discount_mode IN ('Fixed', 'Percentage')
      ),
      discount_value INTEGER NOT NULL,
      fee_head_id TEXT,
      fee_head_name TEXT,
      academic_session_id TEXT,
      academic_session_name TEXT,
      start_date TEXT,
      end_date TEXT,
      reason TEXT,
      status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
      approved_by TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (discount_type_id) REFERENCES discount_types(id),
      FOREIGN KEY (fee_head_id) REFERENCES fee_heads(id),
      FOREIGN KEY (academic_session_id) REFERENCES academic_sessions(id)
    );

    CREATE TABLE IF NOT EXISTS fee_invoices (
      id TEXT PRIMARY KEY,
      invoice_no TEXT UNIQUE NOT NULL,
      student_id TEXT NOT NULL,
      admission_no TEXT,
      student_name TEXT NOT NULL,
      class_name TEXT,
      section TEXT,
      academic_session_id TEXT,
      academic_session_name TEXT,
      billing_period TEXT,
      invoice_date TEXT NOT NULL,
      due_date TEXT,
      subtotal INTEGER DEFAULT 0,
      discount_amount INTEGER DEFAULT 0,
      previous_due INTEGER DEFAULT 0,
      late_fee INTEGER DEFAULT 0,
      adjustment_amount INTEGER DEFAULT 0,
      grand_total INTEGER NOT NULL,
      paid_amount INTEGER DEFAULT 0,
      balance_amount INTEGER NOT NULL,
      status TEXT DEFAULT 'Unpaid' CHECK (
        status IN (
          'Draft',
          'Unpaid',
          'Partially Paid',
          'Paid',
          'Overdue',
          'Cancelled'
        )
      ),
      notes TEXT,
      generated_by TEXT,
      created_at TEXT,
      updated_at TEXT,
      cancelled_at TEXT,
      cancelled_by TEXT,
      cancellation_reason TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (academic_session_id) REFERENCES academic_sessions(id)
    );

    CREATE TABLE IF NOT EXISTS fee_invoice_items (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      fee_head_id TEXT,
      fee_head_name TEXT NOT NULL,
      description TEXT,
      quantity INTEGER DEFAULT 1,
      unit_amount INTEGER DEFAULT 0,
      gross_amount INTEGER DEFAULT 0,
      discount_amount INTEGER DEFAULT 0,
      net_amount INTEGER NOT NULL,
      display_order INTEGER DEFAULT 0,
      created_at TEXT,
      updated_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (invoice_id) REFERENCES fee_invoices(id),
      FOREIGN KEY (fee_head_id) REFERENCES fee_heads(id)
    );

    CREATE TABLE IF NOT EXISTS fee_invoice_allocations (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      fee_payment_id TEXT NOT NULL,
      receipt_no TEXT,
      allocated_amount INTEGER NOT NULL,
      created_at TEXT,
      reversed_at TEXT,
      reversal_id TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (invoice_id) REFERENCES fee_invoices(id),
      FOREIGN KEY (fee_payment_id) REFERENCES fee_payments(id)
    );

    CREATE TABLE IF NOT EXISTS fee_invoice_account_mappings (
      id TEXT PRIMARY KEY,
      fee_head_id TEXT NOT NULL,
      fee_head_name TEXT NOT NULL,
      account_category_id TEXT NOT NULL,
      account_category_name TEXT NOT NULL,
      status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (fee_head_id) REFERENCES fee_heads(id),
      FOREIGN KEY (account_category_id) REFERENCES account_categories(id)
    );

    CREATE TABLE IF NOT EXISTS fee_payment_reversals (
      id TEXT PRIMARY KEY,
      fee_payment_id TEXT NOT NULL,
      receipt_no TEXT,
      amount INTEGER DEFAULT 0,
      reason TEXT NOT NULL,
      reversed_by TEXT,
      created_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (fee_payment_id) REFERENCES fee_payments(id)
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

    CREATE TABLE IF NOT EXISTS exam_schedules (
      id TEXT PRIMARY KEY,
      academic_session_id TEXT,
      academic_session_name TEXT,
      exam_id TEXT NOT NULL,
      exam_name TEXT NOT NULL,
      title TEXT,
      start_date TEXT,
      end_date TEXT,
      status TEXT NOT NULL DEFAULT 'Draft',
      instructions TEXT,
      created_by TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS exam_schedule_entries (
      id TEXT PRIMARY KEY,
      schedule_id TEXT NOT NULL,
      class_name TEXT NOT NULL,
      section TEXT,
      subject_id TEXT,
      subject_name TEXT NOT NULL,
      exam_date TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      room TEXT,
      maximum_marks REAL,
      passing_marks REAL,
      invigilator_employee_id TEXT,
      invigilator_name TEXT,
      instructions TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (schedule_id) REFERENCES exam_schedules(id)
    );

    CREATE TABLE IF NOT EXISTS grading_schemes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      academic_session_id TEXT,
      academic_session_name TEXT,
      class_name TEXT,
      calculation_mode TEXT DEFAULT 'Percentage' CHECK (
        calculation_mode IN ('Percentage', 'Marks')
      ),
      status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
      is_default INTEGER DEFAULT 0,
      description TEXT,
      created_by TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (academic_session_id) REFERENCES academic_sessions(id)
    );

    CREATE TABLE IF NOT EXISTS grading_ranges (
      id TEXT PRIMARY KEY,
      grading_scheme_id TEXT NOT NULL,
      min_value REAL NOT NULL,
      max_value REAL NOT NULL,
      grade TEXT NOT NULL,
      grade_point REAL,
      result_status TEXT DEFAULT 'Pass' CHECK (result_status IN ('Pass', 'Fail')),
      description TEXT,
      display_order INTEGER DEFAULT 0,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (grading_scheme_id) REFERENCES grading_schemes(id)
    );

    CREATE TABLE IF NOT EXISTS report_card_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      template_type TEXT DEFAULT 'Standard',
      academic_session_id TEXT,
      class_name TEXT,
      show_attendance INTEGER DEFAULT 1,
      show_class_tests INTEGER DEFAULT 0,
      show_behaviour INTEGER DEFAULT 1,
      show_skills INTEGER DEFAULT 1,
      show_teacher_remarks INTEGER DEFAULT 1,
      show_principal_signature INTEGER DEFAULT 1,
      header_text TEXT,
      footer_text TEXT,
      status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (academic_session_id) REFERENCES academic_sessions(id)
    );

    CREATE TABLE IF NOT EXISTS student_report_cards (
      id TEXT PRIMARY KEY,
      report_card_no TEXT UNIQUE NOT NULL,
      student_id TEXT NOT NULL,
      admission_no TEXT,
      student_name TEXT NOT NULL,
      class_name TEXT,
      section TEXT,
      academic_session_id TEXT,
      academic_session_name TEXT,
      exam_id TEXT,
      exam_name TEXT,
      grading_scheme_id TEXT,
      grading_scheme_name TEXT,
      total_max_marks REAL DEFAULT 0,
      total_obtained_marks REAL DEFAULT 0,
      percentage REAL DEFAULT 0,
      overall_grade TEXT,
      result_status TEXT CHECK (
        result_status IN ('Pass', 'Fail', 'Promoted', 'Detained', 'Pending')
      ),
      attendance_working_days INTEGER DEFAULT 0,
      attendance_present_days INTEGER DEFAULT 0,
      attendance_percentage REAL DEFAULT 0,
      class_position INTEGER,
      section_position INTEGER,
      teacher_remarks TEXT,
      principal_remarks TEXT,
      generated_by TEXT,
      generated_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (exam_id) REFERENCES exams(id),
      FOREIGN KEY (grading_scheme_id) REFERENCES grading_schemes(id)
    );

    CREATE TABLE IF NOT EXISTS student_report_card_subjects (
      id TEXT PRIMARY KEY,
      report_card_id TEXT NOT NULL,
      subject_id TEXT,
      subject_name TEXT NOT NULL,
      max_marks REAL DEFAULT 0,
      passing_marks REAL DEFAULT 0,
      obtained_marks REAL DEFAULT 0,
      percentage REAL DEFAULT 0,
      grade TEXT,
      grade_point REAL,
      result_status TEXT,
      remarks TEXT,
      display_order INTEGER DEFAULT 0,
      created_at TEXT,
      updated_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (report_card_id) REFERENCES student_report_cards(id)
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
      account_type TEXT DEFAULT 'Staff',
      must_change_password INTEGER DEFAULT 0,
      password_changed_at TEXT,
      failed_login_count INTEGER DEFAULT 0,
      locked_until TEXT,
      last_login_at TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS user_entity_links (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      entity_type TEXT NOT NULL CHECK (entity_type IN ('Student', 'Employee')),
      entity_id TEXT NOT NULL,
      entity_code TEXT,
      entity_name TEXT,
      is_primary INTEGER DEFAULT 1,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS message_threads (
      id TEXT PRIMARY KEY,
      subject TEXT NOT NULL,
      thread_type TEXT NOT NULL CHECK (
        thread_type IN (
          'Direct',
          'Announcement',
          'Class Notice',
          'Staff Notice',
          'System'
        )
      ),
      created_by_user_id TEXT NOT NULL,
      created_by_name TEXT,
      created_by_role TEXT,
      academic_session_id TEXT,
      class_name TEXT,
      section TEXT,
      status TEXT DEFAULT 'Active' CHECK (
        status IN ('Active', 'Archived', 'Closed')
      ),
      priority TEXT DEFAULT 'Normal' CHECK (
        priority IN ('Low', 'Normal', 'High', 'Urgent')
      ),
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (created_by_user_id) REFERENCES users(id),
      FOREIGN KEY (academic_session_id) REFERENCES academic_sessions(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL,
      sender_user_id TEXT NOT NULL,
      sender_name TEXT,
      sender_role TEXT,
      message_text TEXT NOT NULL,
      message_type TEXT DEFAULT 'Text' CHECK (
        message_type IN ('Text', 'Notice', 'System')
      ),
      reply_to_message_id TEXT,
      edited_at TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (thread_id) REFERENCES message_threads(id),
      FOREIGN KEY (sender_user_id) REFERENCES users(id),
      FOREIGN KEY (reply_to_message_id) REFERENCES messages(id)
    );

    CREATE TABLE IF NOT EXISTS message_recipients (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL,
      recipient_user_id TEXT NOT NULL,
      recipient_role TEXT,
      recipient_entity_type TEXT CHECK (
        recipient_entity_type IN ('Student', 'Employee', 'User')
      ),
      recipient_entity_id TEXT,
      delivery_status TEXT DEFAULT 'Delivered' CHECK (
        delivery_status IN ('Delivered', 'Read', 'Archived')
      ),
      delivered_at TEXT,
      read_at TEXT,
      archived_at TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (thread_id) REFERENCES message_threads(id),
      FOREIGN KEY (recipient_user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      announcement_text TEXT NOT NULL,
      audience_type TEXT NOT NULL CHECK (
        audience_type IN (
          'All Users',
          'All Students',
          'All Employees',
          'Teachers',
          'Accountants',
          'Specific Class',
          'Specific Section',
          'Selected Users'
        )
      ),
      academic_session_id TEXT,
      class_name TEXT,
      section TEXT,
      priority TEXT DEFAULT 'Normal' CHECK (
        priority IN ('Low', 'Normal', 'High', 'Urgent')
      ),
      publish_from TEXT,
      publish_until TEXT,
      status TEXT DEFAULT 'Draft' CHECK (
        status IN ('Draft', 'Published', 'Expired', 'Cancelled')
      ),
      selected_user_ids_json TEXT,
      created_by_user_id TEXT,
      created_by_name TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (academic_session_id) REFERENCES academic_sessions(id),
      FOREIGN KEY (created_by_user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS school_rules (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL CHECK (
        category IN (
          'General', 'Fees', 'Attendance', 'Discipline', 'Examination',
          'Transport', 'Uniform', 'Library', 'Safety', 'Other'
        )
      ),
      rule_text TEXT NOT NULL,
      display_order INTEGER DEFAULT 0,
      status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
      academic_session_id TEXT,
      academic_session_name TEXT,
      effective_from TEXT,
      created_by TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (academic_session_id) REFERENCES academic_sessions(id)
    );

    CREATE TABLE IF NOT EXISTS app_preferences (
      id TEXT PRIMARY KEY,
      preference_scope TEXT NOT NULL CHECK (
        preference_scope IN ('Application', 'User')
      ),
      user_id TEXT,
      theme_mode TEXT DEFAULT 'Light' CHECK (
        theme_mode IN ('Light', 'Dark', 'System')
      ),
      accent_color TEXT DEFAULT 'Blue',
      language TEXT DEFAULT 'English' CHECK (
        language IN ('English', 'Hindi')
      ),
      compact_sidebar INTEGER DEFAULT 0,
      font_scale TEXT DEFAULT 'Normal' CHECK (
        font_scale IN ('Small', 'Normal', 'Large')
      ),
      date_format TEXT DEFAULT 'DD/MM/YYYY',
      time_format TEXT DEFAULT '12 Hour',
      updated_at TEXT,
      created_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS login_history (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      username TEXT,
      role TEXT,
      login_at TEXT,
      logout_at TEXT,
      success INTEGER DEFAULT 1,
      device_name TEXT,
      os TEXT,
      failure_reason TEXT,
      created_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
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

    CREATE TABLE IF NOT EXISTS remote_license_status (
      id TEXT PRIMARY KEY,
      license_id TEXT,
      device_id TEXT,
      remote_status TEXT CHECK (
        remote_status IN ('Active', 'Suspended', 'Expired', 'Revoked', 'Unknown')
      ),
      last_online_check_at TEXT,
      next_required_check_at TEXT,
      grace_until TEXT,
      last_error TEXT,
      server_message TEXT,
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

    CREATE TABLE IF NOT EXISTS document_template_settings (
      id TEXT PRIMARY KEY,
      document_type TEXT UNIQUE NOT NULL CHECK (
        document_type IN ('Admission Form', 'Transfer Certificate', 'Fee Receipt')
      ),
      udise_code TEXT,
      recognition_number TEXT,
      principal_name TEXT,
      principal_signature_path TEXT,
      school_stamp_path TEXT,
      accent_color TEXT DEFAULT '#1f4e79',
      footer_text TEXT,
      fee_receipt_terms TEXT,
      default_paper_size TEXT DEFAULT 'A4',
      show_fields_json TEXT DEFAULT '{}',
      created_at TEXT,
      updated_at TEXT,
      sync_status TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS admission_form_snapshots (
      id TEXT PRIMARY KEY,
      snapshot_no TEXT UNIQUE NOT NULL,
      student_id TEXT,
      admission_no TEXT,
      student_name TEXT,
      form_date TEXT NOT NULL,
      snapshot_json TEXT NOT NULL,
      issued_by TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS saved_report_definitions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      report_domain TEXT NOT NULL,
      selected_columns TEXT NOT NULL,
      filters_json TEXT,
      sort_json TEXT,
      group_json TEXT,
      created_by TEXT,
      visibility TEXT NOT NULL DEFAULT 'Private',
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS live_classes (
      id TEXT PRIMARY KEY,
      academic_session_id TEXT,
      class_name TEXT,
      section TEXT,
      subject_id TEXT,
      subject_name TEXT,
      teacher_employee_id TEXT,
      teacher_name TEXT,
      title TEXT NOT NULL,
      description TEXT,
      provider TEXT,
      meeting_url TEXT NOT NULL,
      meeting_id TEXT,
      start_at TEXT NOT NULL,
      end_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Draft',
      recording_url TEXT,
      notes TEXT,
      created_by TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS live_class_attendance (
      id TEXT PRIMARY KEY,
      live_class_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      student_name TEXT,
      joined_at TEXT,
      left_at TEXT,
      attendance_status TEXT,
      remarks TEXT,
      created_at TEXT,
      updated_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (live_class_id) REFERENCES live_classes(id)
    );

    CREATE TABLE IF NOT EXISTS store_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'Active',
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS store_tax_rates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      rate REAL DEFAULT 0,
      status TEXT DEFAULT 'Active',
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS store_products (
      id TEXT PRIMARY KEY,
      category_id TEXT,
      category_name TEXT,
      tax_rate_id TEXT,
      tax_rate_name TEXT,
      tax_rate REAL DEFAULT 0,
      sku TEXT,
      barcode TEXT,
      name TEXT NOT NULL,
      description TEXT,
      price INTEGER DEFAULT 0,
      cost_price INTEGER DEFAULT 0,
      current_stock INTEGER DEFAULT 0,
      minimum_stock INTEGER DEFAULT 0,
      status TEXT DEFAULT 'Active',
      image_path TEXT,
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS store_product_variants (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      size TEXT,
      colour TEXT,
      variant_sku TEXT,
      barcode TEXT,
      price INTEGER,
      current_stock INTEGER DEFAULT 0,
      status TEXT DEFAULT 'Active',
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (product_id) REFERENCES store_products(id)
    );

    CREATE TABLE IF NOT EXISTS store_inventory_transactions (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      variant_id TEXT,
      transaction_type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_cost INTEGER DEFAULT 0,
      unit_price INTEGER DEFAULT 0,
      stock_before INTEGER DEFAULT 0,
      stock_after INTEGER DEFAULT 0,
      reference_type TEXT,
      reference_id TEXT,
      notes TEXT,
      transaction_date TEXT NOT NULL,
      created_by TEXT,
      created_at TEXT,
      sync_status TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS store_customers (
      id TEXT PRIMARY KEY,
      customer_type TEXT DEFAULT 'Walk-in',
      student_id TEXT,
      admission_no TEXT,
      name TEXT NOT NULL,
      mobile TEXT,
      email TEXT,
      status TEXT DEFAULT 'Active',
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS store_pos_sessions (
      id TEXT PRIMARY KEY,
      session_no TEXT UNIQUE NOT NULL,
      cashier_user_id TEXT,
      username TEXT,
      display_name TEXT,
      cashier_name TEXT,
      opened_at TEXT NOT NULL,
      closed_at TEXT,
      opening_cash INTEGER DEFAULT 0,
      closing_cash INTEGER DEFAULT 0,
      expected_cash INTEGER DEFAULT 0,
      counted_cash INTEGER DEFAULT 0,
      cash_variance INTEGER DEFAULT 0,
      status TEXT DEFAULT 'Open',
      notes TEXT,
      created_at TEXT,
      updated_at TEXT,
      sync_status TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS store_pos_account_mappings (
      id TEXT PRIMARY KEY,
      mapping_key TEXT UNIQUE NOT NULL,
      label TEXT NOT NULL,
      account_category_id TEXT,
      account_category_name TEXT,
      account_type TEXT NOT NULL DEFAULT 'Income'
        CHECK (account_type IN ('Income', 'Expense')),
      status TEXT DEFAULT 'Active',
      created_at TEXT,
      updated_at TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (account_category_id) REFERENCES account_categories(id)
    );

    CREATE TABLE IF NOT EXISTS store_orders (
      id TEXT PRIMARY KEY,
      order_no TEXT UNIQUE NOT NULL,
      pos_session_id TEXT,
      customer_id TEXT,
      student_id TEXT,
      customer_name TEXT,
      order_date TEXT NOT NULL,
      subtotal INTEGER DEFAULT 0,
      discount_amount INTEGER DEFAULT 0,
      tax_amount INTEGER DEFAULT 0,
      grand_total INTEGER DEFAULT 0,
      paid_amount INTEGER DEFAULT 0,
      balance_amount INTEGER DEFAULT 0,
      status TEXT DEFAULT 'Completed',
      reversal_of_order_id TEXT,
      reversed_at TEXT,
      reversed_by TEXT,
      reversal_reason TEXT,
      held_at TEXT,
      cancelled_at TEXT,
      cancelled_by TEXT,
      cancellation_reason TEXT,
      notes TEXT,
      created_by TEXT,
      created_at TEXT,
      updated_at TEXT,
      sync_status TEXT DEFAULT 'pending'
    );

    CREATE TABLE IF NOT EXISTS store_order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      variant_id TEXT,
      sku TEXT,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price INTEGER DEFAULT 0,
      discount_amount INTEGER DEFAULT 0,
      tax_rate REAL DEFAULT 0,
      tax_amount INTEGER DEFAULT 0,
      line_total INTEGER DEFAULT 0,
      created_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (order_id) REFERENCES store_orders(id)
    );

    CREATE TABLE IF NOT EXISTS store_payments (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      payment_mode TEXT NOT NULL,
      amount INTEGER NOT NULL,
      reference_no TEXT,
      payment_date TEXT NOT NULL,
      created_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (order_id) REFERENCES store_orders(id)
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

    CREATE TABLE IF NOT EXISTS transfer_certificates (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      certificate_number TEXT UNIQUE NOT NULL,
      serial_number TEXT UNIQUE,
      sr_number TEXT,
      pen_number TEXT,
      academic_session_id TEXT,
      academic_session_name TEXT,
      student_name TEXT,
      admission_no TEXT,
      class_name TEXT,
      section TEXT,
      father_guardian_name TEXT,
      mother_name TEXT,
      date_of_admission TEXT,
      admission_class TEXT,
      date_of_birth TEXT,
      date_of_birth_words TEXT,
      last_class_studied TEXT,
      promotion_qualified TEXT,
      promoted_to_class TEXT,
      dues_paid_upto TEXT,
      general_conduct TEXT,
      issue_date TEXT,
      reason_for_leaving TEXT,
      nationality TEXT,
      caste_category TEXT,
      remarks TEXT,
      status TEXT DEFAULT 'Draft' CHECK (
        status IN ('Draft', 'Issued', 'Cancelled')
      ),
      issued_by TEXT,
      reissued_from_id TEXT,
      reprint_count INTEGER DEFAULT 0,
      created_at TEXT,
      updated_at TEXT,
      cancelled_at TEXT,
      cancellation_reason TEXT,
      deleted_at TEXT,
      sync_status TEXT DEFAULT 'pending',
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (reissued_from_id) REFERENCES transfer_certificates(id)
    );

    CREATE INDEX IF NOT EXISTS idx_students_active
      ON students(deleted_at, created_at);
    CREATE INDEX IF NOT EXISTS idx_families_active
      ON families(deleted_at, status, family_code, family_name);
    CREATE INDEX IF NOT EXISTS idx_families_contact
      ON families(primary_mobile, email, deleted_at);
    CREATE INDEX IF NOT EXISTS idx_guardians_family
      ON guardians(family_id, deleted_at, status, full_name);
    CREATE INDEX IF NOT EXISTS idx_guardians_contact
      ON guardians(mobile, email, deleted_at);
    CREATE INDEX IF NOT EXISTS idx_student_guardian_links_student
      ON student_guardian_links(student_id, deleted_at, is_primary);
    CREATE INDEX IF NOT EXISTS idx_student_guardian_links_family
      ON student_guardian_links(family_id, deleted_at, student_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_student_guardian_links_active_unique
      ON student_guardian_links(student_id, guardian_id)
      WHERE deleted_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_employees_active
      ON employees(deleted_at, status, department, designation, name);
    CREATE INDEX IF NOT EXISTS idx_fee_payments_date
      ON fee_payments(payment_date);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_attendance_employee_date_active
      ON employee_attendance(employee_id, attendance_date)
      WHERE deleted_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_employee_attendance_date
      ON employee_attendance(attendance_date, deleted_at, department, designation, status);
    CREATE INDEX IF NOT EXISTS idx_employee_attendance_employee
      ON employee_attendance(employee_id, attendance_date, deleted_at);
    CREATE INDEX IF NOT EXISTS idx_discount_types_active
      ON discount_types(deleted_at, status, name);
    CREATE INDEX IF NOT EXISTS idx_student_discounts_student
      ON student_discounts(student_id, deleted_at, status);
    CREATE INDEX IF NOT EXISTS idx_student_discounts_session
      ON student_discounts(academic_session_id, deleted_at, status);
    CREATE INDEX IF NOT EXISTS idx_fee_invoices_student
      ON fee_invoices(student_id, academic_session_id, billing_period, status);
    CREATE INDEX IF NOT EXISTS idx_fee_invoices_filter
      ON fee_invoices(academic_session_id, class_name, section, status, invoice_date);
    CREATE INDEX IF NOT EXISTS idx_fee_invoice_items_invoice
      ON fee_invoice_items(invoice_id, display_order);
    CREATE INDEX IF NOT EXISTS idx_fee_invoice_allocations_invoice
      ON fee_invoice_allocations(invoice_id, reversed_at);
    CREATE INDEX IF NOT EXISTS idx_fee_invoice_allocations_payment
      ON fee_invoice_allocations(fee_payment_id, reversed_at);
    CREATE INDEX IF NOT EXISTS idx_fee_payment_reversals_payment
      ON fee_payment_reversals(fee_payment_id, created_at DESC);
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
    CREATE INDEX IF NOT EXISTS idx_message_threads_filter
      ON message_threads(deleted_at, status, thread_type, priority, updated_at);
    CREATE INDEX IF NOT EXISTS idx_messages_thread
      ON messages(thread_id, created_at, deleted_at);
    CREATE INDEX IF NOT EXISTS idx_message_recipients_user
      ON message_recipients(
        recipient_user_id, deleted_at, delivery_status, thread_id
      );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_message_recipients_active_unique
      ON message_recipients(thread_id, recipient_user_id)
      WHERE deleted_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_announcements_filter
      ON announcements(
        deleted_at, status, audience_type, class_name, section,
        publish_from, publish_until
      );
    CREATE INDEX IF NOT EXISTS idx_school_rules_filter
      ON school_rules(deleted_at, status, category, display_order);
    CREATE INDEX IF NOT EXISTS idx_school_rules_session
      ON school_rules(academic_session_id, deleted_at, display_order);
    CREATE INDEX IF NOT EXISTS idx_login_history_user
      ON login_history(user_id, login_at DESC);
    CREATE INDEX IF NOT EXISTS idx_login_history_login
      ON login_history(login_at DESC, success);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created
      ON audit_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_exam_schedules_exam
      ON exam_schedules(exam_id, status, deleted_at);
    CREATE INDEX IF NOT EXISTS idx_exam_schedule_entries_schedule
      ON exam_schedule_entries(schedule_id, exam_date, deleted_at);
    CREATE INDEX IF NOT EXISTS idx_live_classes_scope
      ON live_classes(class_name, section, start_at, status, deleted_at);
    CREATE INDEX IF NOT EXISTS idx_saved_report_definitions_domain
      ON saved_report_definitions(report_domain, visibility, deleted_at);
    CREATE INDEX IF NOT EXISTS idx_store_products_lookup
      ON store_products(sku, barcode, name, deleted_at);
    CREATE INDEX IF NOT EXISTS idx_store_inventory_product
      ON store_inventory_transactions(product_id, variant_id, transaction_date);
    CREATE INDEX IF NOT EXISTS idx_store_orders_date
      ON store_orders(order_date, status);
    CREATE INDEX IF NOT EXISTS idx_store_order_items_order
      ON store_order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_store_pos_sessions_status
      ON store_pos_sessions(cashier_user_id, status, opened_at);
    CREATE INDEX IF NOT EXISTS idx_store_pos_account_mappings_active
      ON store_pos_account_mappings(mapping_key, status, deleted_at);
    CREATE INDEX IF NOT EXISTS idx_certificate_templates_active
      ON certificate_templates(deleted_at, status, name);
    CREATE INDEX IF NOT EXISTS idx_issued_certificates_student
      ON issued_certificates(student_id, issued_date DESC);
    CREATE INDEX IF NOT EXISTS idx_issued_certificates_date
      ON issued_certificates(issued_date DESC, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_document_template_settings_type
      ON document_template_settings(document_type);
    CREATE INDEX IF NOT EXISTS idx_admission_form_snapshots_student
      ON admission_form_snapshots(student_id, form_date DESC, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_transfer_certificates_student
      ON transfer_certificates(student_id, status, issue_date DESC);
    CREATE INDEX IF NOT EXISTS idx_transfer_certificates_register
      ON transfer_certificates(status, issue_date DESC, created_at DESC);
  `);

  addColumnIfMissing(db, "fee_payments", "admission_no", "TEXT");
  addColumnIfMissing(db, "fee_payments", "section", "TEXT");
  addColumnIfMissing(db, "fee_payments", "guardian_name", "TEXT");
  addColumnIfMissing(db, "fee_payments", "mobile", "TEXT");
  addColumnIfMissing(db, "fee_payments", "cashier_name", "TEXT");
  addColumnIfMissing(db, "fee_payments", "status", "TEXT DEFAULT 'Active'");
  addColumnIfMissing(db, "fee_payments", "reversed_at", "TEXT");
  addColumnIfMissing(db, "fee_payments", "reversed_by", "TEXT");
  addColumnIfMissing(db, "fee_payments", "reversal_reason", "TEXT");
  addColumnIfMissing(
    db,
    "communication_gateway_settings",
    "provider_mode",
    "TEXT DEFAULT 'Unknown'",
  );
  addColumnIfMissing(db, "fee_invoice_allocations", "reversed_at", "TEXT");
  addColumnIfMissing(db, "fee_invoice_allocations", "reversal_id", "TEXT");
  [
    ["udise_code", "TEXT"],
    ["recognition_number", "TEXT"],
    ["principal_name", "TEXT"],
    ["principal_signature_path", "TEXT"],
    ["school_stamp_path", "TEXT"],
    ["accent_color", "TEXT DEFAULT '#1f4e79'"],
    ["footer_text", "TEXT"],
    ["fee_receipt_terms", "TEXT"],
    ["default_paper_size", "TEXT DEFAULT 'A4'"],
    ["show_fields_json", "TEXT DEFAULT '{}'"],
    ["sync_status", "TEXT DEFAULT 'pending'"],
  ].forEach(([columnName, definition]) => {
    addColumnIfMissing(db, "document_template_settings", columnName, definition);
  });
  [
    ["student_id", "TEXT"],
    ["admission_no", "TEXT"],
    ["student_name", "TEXT"],
    ["form_date", "TEXT"],
    ["snapshot_json", "TEXT DEFAULT '{}'"],
    ["issued_by", "TEXT"],
    ["deleted_at", "TEXT"],
    ["sync_status", "TEXT DEFAULT 'pending'"],
  ].forEach(([columnName, definition]) => {
    addColumnIfMissing(db, "admission_form_snapshots", columnName, definition);
  });
  [
    ["serial_number", "TEXT"],
    ["sr_number", "TEXT"],
    ["pen_number", "TEXT"],
    ["academic_session_id", "TEXT"],
    ["academic_session_name", "TEXT"],
    ["student_name", "TEXT"],
    ["admission_no", "TEXT"],
    ["class_name", "TEXT"],
    ["section", "TEXT"],
    ["father_guardian_name", "TEXT"],
    ["mother_name", "TEXT"],
    ["date_of_admission", "TEXT"],
    ["admission_class", "TEXT"],
    ["date_of_birth", "TEXT"],
    ["date_of_birth_words", "TEXT"],
    ["last_class_studied", "TEXT"],
    ["promotion_qualified", "TEXT"],
    ["promoted_to_class", "TEXT"],
    ["dues_paid_upto", "TEXT"],
    ["general_conduct", "TEXT"],
    ["issue_date", "TEXT"],
    ["reason_for_leaving", "TEXT"],
    ["nationality", "TEXT"],
    ["caste_category", "TEXT"],
    ["remarks", "TEXT"],
    ["status", "TEXT DEFAULT 'Draft'"],
    ["issued_by", "TEXT"],
    ["reissued_from_id", "TEXT"],
    ["reprint_count", "INTEGER DEFAULT 0"],
    ["cancelled_at", "TEXT"],
    ["cancellation_reason", "TEXT"],
    ["deleted_at", "TEXT"],
    ["sync_status", "TEXT DEFAULT 'pending'"],
  ].forEach(([columnName, definition]) => {
    addColumnIfMissing(db, "transfer_certificates", columnName, definition);
  });
  db.prepare(`
    UPDATE fee_payments
    SET status = 'Active'
    WHERE status IS NULL OR trim(status) = ''
  `).run();
  addColumnIfMissing(db, "attendance", "admission_no", "TEXT");
  addColumnIfMissing(db, "attendance", "remarks", "TEXT");
  addColumnIfMissing(db, "users", "account_type", "TEXT DEFAULT 'Staff'");
  addColumnIfMissing(db, "users", "must_change_password", "INTEGER DEFAULT 0");
  addColumnIfMissing(db, "users", "password_changed_at", "TEXT");
  addColumnIfMissing(db, "users", "failed_login_count", "INTEGER DEFAULT 0");
  addColumnIfMissing(db, "users", "locked_until", "TEXT");
  addColumnIfMissing(db, "store_inventory_transactions", "stock_before", "INTEGER DEFAULT 0");
  addColumnIfMissing(db, "store_inventory_transactions", "stock_after", "INTEGER DEFAULT 0");
  [
    ["username", "TEXT"],
    ["display_name", "TEXT"],
    ["expected_cash", "INTEGER DEFAULT 0"],
    ["counted_cash", "INTEGER DEFAULT 0"],
    ["cash_variance", "INTEGER DEFAULT 0"],
  ].forEach(([columnName, definition]) => {
    addColumnIfMissing(db, "store_pos_sessions", columnName, definition);
  });
  [
    ["held_at", "TEXT"],
    ["cancelled_at", "TEXT"],
    ["cancelled_by", "TEXT"],
    ["cancellation_reason", "TEXT"],
  ].forEach(([columnName, definition]) => {
    addColumnIfMissing(db, "store_orders", columnName, definition);
  });
  [
    ["user_id", "TEXT"],
    ["entity_type", "TEXT"],
    ["entity_id", "TEXT"],
    ["entity_code", "TEXT"],
    ["entity_name", "TEXT"],
    ["is_primary", "INTEGER DEFAULT 1"],
    ["created_at", "TEXT"],
    ["updated_at", "TEXT"],
    ["deleted_at", "TEXT"],
    ["sync_status", "TEXT DEFAULT 'pending'"],
  ].forEach(([columnName, definition]) => {
    addColumnIfMissing(db, "user_entity_links", columnName, definition);
  });
  [
    ["subject", "TEXT"],
    ["thread_type", "TEXT DEFAULT 'Direct'"],
    ["created_by_user_id", "TEXT"],
    ["created_by_name", "TEXT"],
    ["created_by_role", "TEXT"],
    ["academic_session_id", "TEXT"],
    ["class_name", "TEXT"],
    ["section", "TEXT"],
    ["status", "TEXT DEFAULT 'Active'"],
    ["priority", "TEXT DEFAULT 'Normal'"],
    ["created_at", "TEXT"],
    ["updated_at", "TEXT"],
    ["deleted_at", "TEXT"],
    ["sync_status", "TEXT DEFAULT 'pending'"],
  ].forEach(([columnName, definition]) => {
    addColumnIfMissing(db, "message_threads", columnName, definition);
  });
  [
    ["thread_id", "TEXT"],
    ["sender_user_id", "TEXT"],
    ["sender_name", "TEXT"],
    ["sender_role", "TEXT"],
    ["message_text", "TEXT"],
    ["message_type", "TEXT DEFAULT 'Text'"],
    ["reply_to_message_id", "TEXT"],
    ["edited_at", "TEXT"],
    ["created_at", "TEXT"],
    ["updated_at", "TEXT"],
    ["deleted_at", "TEXT"],
    ["sync_status", "TEXT DEFAULT 'pending'"],
  ].forEach(([columnName, definition]) => {
    addColumnIfMissing(db, "messages", columnName, definition);
  });
  [
    ["thread_id", "TEXT"],
    ["recipient_user_id", "TEXT"],
    ["recipient_role", "TEXT"],
    ["recipient_entity_type", "TEXT"],
    ["recipient_entity_id", "TEXT"],
    ["delivery_status", "TEXT DEFAULT 'Delivered'"],
    ["delivered_at", "TEXT"],
    ["read_at", "TEXT"],
    ["archived_at", "TEXT"],
    ["created_at", "TEXT"],
    ["updated_at", "TEXT"],
    ["deleted_at", "TEXT"],
    ["sync_status", "TEXT DEFAULT 'pending'"],
  ].forEach(([columnName, definition]) => {
    addColumnIfMissing(db, "message_recipients", columnName, definition);
  });
  [
    ["title", "TEXT"],
    ["announcement_text", "TEXT"],
    ["audience_type", "TEXT DEFAULT 'All Users'"],
    ["academic_session_id", "TEXT"],
    ["class_name", "TEXT"],
    ["section", "TEXT"],
    ["priority", "TEXT DEFAULT 'Normal'"],
    ["publish_from", "TEXT"],
    ["publish_until", "TEXT"],
    ["status", "TEXT DEFAULT 'Draft'"],
    ["selected_user_ids_json", "TEXT"],
    ["created_by_user_id", "TEXT"],
    ["created_by_name", "TEXT"],
    ["created_at", "TEXT"],
    ["updated_at", "TEXT"],
    ["deleted_at", "TEXT"],
    ["sync_status", "TEXT DEFAULT 'pending'"],
  ].forEach(([columnName, definition]) => {
    addColumnIfMissing(db, "announcements", columnName, definition);
  });
  [
    ["family_code", "TEXT"],
    ["family_name", "TEXT"],
    ["primary_contact_name", "TEXT"],
    ["primary_mobile", "TEXT"],
    ["secondary_mobile", "TEXT"],
    ["email", "TEXT"],
    ["address", "TEXT"],
    ["city", "TEXT"],
    ["state", "TEXT"],
    ["postal_code", "TEXT"],
    ["emergency_contact_name", "TEXT"],
    ["emergency_contact_mobile", "TEXT"],
    ["notes", "TEXT"],
    ["status", "TEXT DEFAULT 'Active'"],
    ["created_at", "TEXT"],
    ["updated_at", "TEXT"],
    ["deleted_at", "TEXT"],
    ["sync_status", "TEXT DEFAULT 'pending'"],
  ].forEach(([columnName, definition]) => {
    addColumnIfMissing(db, "families", columnName, definition);
  });
  [
    ["family_id", "TEXT"],
    ["full_name", "TEXT"],
    ["relation", "TEXT"],
    ["mobile", "TEXT"],
    ["alternate_mobile", "TEXT"],
    ["email", "TEXT"],
    ["occupation", "TEXT"],
    ["qualification", "TEXT"],
    ["annual_income", "INTEGER"],
    ["address", "TEXT"],
    ["is_primary", "INTEGER DEFAULT 0"],
    ["can_pickup_student", "INTEGER DEFAULT 1"],
    ["emergency_contact", "INTEGER DEFAULT 0"],
    ["status", "TEXT DEFAULT 'Active'"],
    ["created_at", "TEXT"],
    ["updated_at", "TEXT"],
    ["deleted_at", "TEXT"],
    ["sync_status", "TEXT DEFAULT 'pending'"],
  ].forEach(([columnName, definition]) => {
    addColumnIfMissing(db, "guardians", columnName, definition);
  });
  [
    ["student_id", "TEXT"],
    ["guardian_id", "TEXT"],
    ["family_id", "TEXT"],
    ["relation_to_student", "TEXT"],
    ["is_primary", "INTEGER DEFAULT 0"],
    ["lives_with_student", "INTEGER DEFAULT 1"],
    ["financial_responsibility", "INTEGER DEFAULT 0"],
    ["pickup_authorized", "INTEGER DEFAULT 1"],
    ["created_at", "TEXT"],
    ["updated_at", "TEXT"],
    ["deleted_at", "TEXT"],
    ["sync_status", "TEXT DEFAULT 'pending'"],
  ].forEach(([columnName, definition]) => {
    addColumnIfMissing(
      db,
      "student_guardian_links",
      columnName,
      definition,
    );
  });
  [
    ["employee_id", "TEXT"],
    ["employee_code", "TEXT"],
    ["employee_name", "TEXT"],
    ["department", "TEXT"],
    ["designation", "TEXT"],
    ["attendance_date", "TEXT"],
    ["status", "TEXT"],
    ["check_in_time", "TEXT"],
    ["check_out_time", "TEXT"],
    ["late_minutes", "INTEGER DEFAULT 0"],
    ["overtime_minutes", "INTEGER DEFAULT 0"],
    ["leave_type", "TEXT"],
    ["remarks", "TEXT"],
    ["marked_by", "TEXT"],
    ["created_at", "TEXT"],
    ["updated_at", "TEXT"],
    ["deleted_at", "TEXT"],
    ["sync_status", "TEXT DEFAULT 'pending'"],
  ].forEach(([columnName, definition]) => {
    addColumnIfMissing(
      db,
      "employee_attendance",
      columnName,
      definition,
    );
  });
  [
    ["name", "TEXT"],
    ["academic_session_id", "TEXT"],
    ["academic_session_name", "TEXT"],
    ["class_name", "TEXT"],
    ["calculation_mode", "TEXT DEFAULT 'Percentage'"],
    ["status", "TEXT DEFAULT 'Active'"],
    ["is_default", "INTEGER DEFAULT 0"],
    ["description", "TEXT"],
    ["created_by", "TEXT"],
    ["created_at", "TEXT"],
    ["updated_at", "TEXT"],
    ["deleted_at", "TEXT"],
    ["sync_status", "TEXT DEFAULT 'pending'"],
  ].forEach(([columnName, definition]) => {
    addColumnIfMissing(db, "grading_schemes", columnName, definition);
  });
  [
    ["grading_scheme_id", "TEXT"],
    ["min_value", "REAL DEFAULT 0"],
    ["max_value", "REAL DEFAULT 0"],
    ["grade", "TEXT"],
    ["grade_point", "REAL"],
    ["result_status", "TEXT DEFAULT 'Pass'"],
    ["description", "TEXT"],
    ["display_order", "INTEGER DEFAULT 0"],
    ["created_at", "TEXT"],
    ["updated_at", "TEXT"],
    ["deleted_at", "TEXT"],
    ["sync_status", "TEXT DEFAULT 'pending'"],
  ].forEach(([columnName, definition]) => {
    addColumnIfMissing(db, "grading_ranges", columnName, definition);
  });
  [
    ["name", "TEXT"],
    ["template_type", "TEXT DEFAULT 'Standard'"],
    ["academic_session_id", "TEXT"],
    ["class_name", "TEXT"],
    ["show_attendance", "INTEGER DEFAULT 1"],
    ["show_class_tests", "INTEGER DEFAULT 0"],
    ["show_behaviour", "INTEGER DEFAULT 1"],
    ["show_skills", "INTEGER DEFAULT 1"],
    ["show_teacher_remarks", "INTEGER DEFAULT 1"],
    ["show_principal_signature", "INTEGER DEFAULT 1"],
    ["header_text", "TEXT"],
    ["footer_text", "TEXT"],
    ["status", "TEXT DEFAULT 'Active'"],
    ["created_at", "TEXT"],
    ["updated_at", "TEXT"],
    ["deleted_at", "TEXT"],
    ["sync_status", "TEXT DEFAULT 'pending'"],
  ].forEach(([columnName, definition]) => {
    addColumnIfMissing(db, "report_card_templates", columnName, definition);
  });
  [
    ["report_card_no", "TEXT"],
    ["student_id", "TEXT"],
    ["admission_no", "TEXT"],
    ["student_name", "TEXT"],
    ["class_name", "TEXT"],
    ["section", "TEXT"],
    ["academic_session_id", "TEXT"],
    ["academic_session_name", "TEXT"],
    ["exam_id", "TEXT"],
    ["exam_name", "TEXT"],
    ["grading_scheme_id", "TEXT"],
    ["grading_scheme_name", "TEXT"],
    ["total_max_marks", "REAL DEFAULT 0"],
    ["total_obtained_marks", "REAL DEFAULT 0"],
    ["percentage", "REAL DEFAULT 0"],
    ["overall_grade", "TEXT"],
    ["result_status", "TEXT DEFAULT 'Pending'"],
    ["attendance_working_days", "INTEGER DEFAULT 0"],
    ["attendance_present_days", "INTEGER DEFAULT 0"],
    ["attendance_percentage", "REAL DEFAULT 0"],
    ["class_position", "INTEGER"],
    ["section_position", "INTEGER"],
    ["teacher_remarks", "TEXT"],
    ["principal_remarks", "TEXT"],
    ["generated_by", "TEXT"],
    ["generated_at", "TEXT"],
    ["updated_at", "TEXT"],
    ["deleted_at", "TEXT"],
    ["sync_status", "TEXT DEFAULT 'pending'"],
  ].forEach(([columnName, definition]) => {
    addColumnIfMissing(db, "student_report_cards", columnName, definition);
  });
  [
    ["report_card_id", "TEXT"],
    ["subject_id", "TEXT"],
    ["subject_name", "TEXT"],
    ["max_marks", "REAL DEFAULT 0"],
    ["passing_marks", "REAL DEFAULT 0"],
    ["obtained_marks", "REAL DEFAULT 0"],
    ["percentage", "REAL DEFAULT 0"],
    ["grade", "TEXT"],
    ["grade_point", "REAL"],
    ["result_status", "TEXT"],
    ["remarks", "TEXT"],
    ["display_order", "INTEGER DEFAULT 0"],
    ["created_at", "TEXT"],
    ["updated_at", "TEXT"],
    ["sync_status", "TEXT DEFAULT 'pending'"],
  ].forEach(([columnName, definition]) => {
    addColumnIfMissing(
      db,
      "student_report_card_subjects",
      columnName,
      definition,
    );
  });
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_grading_schemes_scope
      ON grading_schemes(
        deleted_at, status, is_default, academic_session_id, class_name
      );
    CREATE INDEX IF NOT EXISTS idx_grading_ranges_scheme
      ON grading_ranges(grading_scheme_id, deleted_at, display_order, min_value);
    CREATE INDEX IF NOT EXISTS idx_report_card_templates_scope
      ON report_card_templates(
        deleted_at, status, academic_session_id, class_name
      );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_report_cards_student_exam_active
      ON student_report_cards(
        student_id, COALESCE(academic_session_id, ''), COALESCE(exam_id, '')
      )
      WHERE deleted_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_report_cards_filter
      ON student_report_cards(
        academic_session_id, class_name, section, exam_id, result_status,
        generated_at, deleted_at
      );
    CREATE INDEX IF NOT EXISTS idx_report_card_subjects_card
      ON student_report_card_subjects(report_card_id, display_order);
  `);
  [
    ["title", "TEXT"],
    ["category", "TEXT DEFAULT 'General'"],
    ["rule_text", "TEXT"],
    ["display_order", "INTEGER DEFAULT 0"],
    ["status", "TEXT DEFAULT 'Active'"],
    ["academic_session_id", "TEXT"],
    ["academic_session_name", "TEXT"],
    ["effective_from", "TEXT"],
    ["created_by", "TEXT"],
    ["created_at", "TEXT"],
    ["updated_at", "TEXT"],
    ["deleted_at", "TEXT"],
    ["sync_status", "TEXT DEFAULT 'pending'"],
  ].forEach(([columnName, definition]) => {
    addColumnIfMissing(db, "school_rules", columnName, definition);
  });
  [
    ["preference_scope", "TEXT DEFAULT 'Application'"],
    ["user_id", "TEXT"],
    ["theme_mode", "TEXT DEFAULT 'Light'"],
    ["accent_color", "TEXT DEFAULT 'Blue'"],
    ["language", "TEXT DEFAULT 'English'"],
    ["compact_sidebar", "INTEGER DEFAULT 0"],
    ["font_scale", "TEXT DEFAULT 'Normal'"],
    ["date_format", "TEXT DEFAULT 'DD/MM/YYYY'"],
    ["time_format", "TEXT DEFAULT '12 Hour'"],
    ["updated_at", "TEXT"],
    ["created_at", "TEXT"],
  ].forEach(([columnName, definition]) => {
    addColumnIfMissing(db, "app_preferences", columnName, definition);
  });
  [
    ["user_id", "TEXT"],
    ["username", "TEXT"],
    ["role", "TEXT"],
    ["login_at", "TEXT"],
    ["logout_at", "TEXT"],
    ["success", "INTEGER DEFAULT 1"],
    ["device_name", "TEXT"],
    ["os", "TEXT"],
    ["failure_reason", "TEXT"],
    ["created_at", "TEXT"],
  ].forEach(([columnName, definition]) => {
    addColumnIfMissing(db, "login_history", columnName, definition);
  });
  db.exec(`
    UPDATE guardians
    SET status = 'Active'
    WHERE status IS NULL OR trim(status) = '';
    UPDATE families
    SET status = 'Active'
    WHERE status IS NULL OR trim(status) = '';
    UPDATE users
    SET account_type = 'Staff'
    WHERE account_type IS NULL OR trim(account_type) = '';
    UPDATE users
    SET must_change_password = 0
    WHERE must_change_password IS NULL;
    UPDATE users
    SET failed_login_count = 0
    WHERE failed_login_count IS NULL;
    UPDATE users
    SET account_type = 'Student'
    WHERE role = 'Student' AND account_type <> 'Student';
    UPDATE message_threads
    SET thread_type = 'Direct'
    WHERE thread_type IS NULL OR trim(thread_type) = '';
    UPDATE message_threads
    SET status = 'Active'
    WHERE status IS NULL OR trim(status) = '';
    UPDATE message_threads
    SET priority = 'Normal'
    WHERE priority IS NULL OR trim(priority) = '';
    UPDATE messages
    SET message_type = 'Text'
    WHERE message_type IS NULL OR trim(message_type) = '';
    UPDATE message_recipients
    SET delivery_status = 'Delivered'
    WHERE delivery_status IS NULL OR trim(delivery_status) = '';
    UPDATE announcements
    SET audience_type = 'All Users'
    WHERE audience_type IS NULL OR trim(audience_type) = '';
    UPDATE announcements
    SET status = 'Draft'
    WHERE status IS NULL OR trim(status) = '';
    UPDATE announcements
    SET priority = 'Normal'
    WHERE priority IS NULL OR trim(priority) = '';
    DELETE FROM message_recipients
    WHERE deleted_at IS NULL
      AND rowid NOT IN (
        SELECT MIN(rowid)
        FROM message_recipients
        WHERE deleted_at IS NULL
        GROUP BY thread_id, recipient_user_id
      );
    DELETE FROM student_guardian_links
    WHERE deleted_at IS NULL
      AND rowid NOT IN (
        SELECT MIN(rowid)
        FROM student_guardian_links
        WHERE deleted_at IS NULL
        GROUP BY student_id, guardian_id
      );
    DELETE FROM user_entity_links
    WHERE deleted_at IS NULL
      AND is_primary = 1
      AND rowid NOT IN (
        SELECT MIN(rowid)
        FROM user_entity_links
        WHERE deleted_at IS NULL AND is_primary = 1
        GROUP BY user_id
      );
    DELETE FROM user_entity_links
    WHERE deleted_at IS NULL
      AND entity_type = 'Student'
      AND is_primary = 1
      AND rowid NOT IN (
        SELECT MIN(rowid)
        FROM user_entity_links
        WHERE deleted_at IS NULL
          AND entity_type = 'Student'
          AND is_primary = 1
        GROUP BY entity_type, entity_id
      );
    DELETE FROM user_entity_links
    WHERE deleted_at IS NULL
      AND entity_type = 'Employee'
      AND is_primary = 1
      AND rowid NOT IN (
        SELECT MIN(rowid)
        FROM user_entity_links
        WHERE deleted_at IS NULL
          AND entity_type = 'Employee'
          AND is_primary = 1
        GROUP BY entity_type, entity_id
      );
    DELETE FROM app_preferences
    WHERE preference_scope = 'Application'
      AND rowid NOT IN (
        SELECT MIN(rowid)
        FROM app_preferences
        WHERE preference_scope = 'Application'
      );
    DELETE FROM app_preferences
    WHERE preference_scope = 'User'
      AND user_id IS NOT NULL
      AND rowid NOT IN (
        SELECT MIN(rowid)
        FROM app_preferences
        WHERE preference_scope = 'User' AND user_id IS NOT NULL
        GROUP BY user_id
      );
  `);
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_account_type
      ON users(account_type, deleted_at, status);
    CREATE INDEX IF NOT EXISTS idx_user_entity_links_user
      ON user_entity_links(user_id, entity_type, deleted_at);
    CREATE INDEX IF NOT EXISTS idx_user_entity_links_entity
      ON user_entity_links(entity_type, entity_id, deleted_at);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_user_entity_links_user_primary
      ON user_entity_links(user_id)
      WHERE deleted_at IS NULL AND is_primary = 1;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_user_entity_links_student_primary
      ON user_entity_links(entity_type, entity_id)
      WHERE deleted_at IS NULL AND entity_type = 'Student' AND is_primary = 1;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_user_entity_links_employee_primary
      ON user_entity_links(entity_type, entity_id)
      WHERE deleted_at IS NULL AND entity_type = 'Employee' AND is_primary = 1;
    CREATE INDEX IF NOT EXISTS idx_message_threads_filter
      ON message_threads(deleted_at, status, thread_type, priority, updated_at);
    CREATE INDEX IF NOT EXISTS idx_messages_thread
      ON messages(thread_id, created_at, deleted_at);
    CREATE INDEX IF NOT EXISTS idx_message_recipients_user
      ON message_recipients(
        recipient_user_id, deleted_at, delivery_status, thread_id
      );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_message_recipients_active_unique
      ON message_recipients(thread_id, recipient_user_id)
      WHERE deleted_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_announcements_filter
      ON announcements(
        deleted_at, status, audience_type, class_name, section,
        publish_from, publish_until
      );
    CREATE INDEX IF NOT EXISTS idx_families_active
      ON families(deleted_at, status, family_code, family_name);
    CREATE INDEX IF NOT EXISTS idx_families_contact
      ON families(primary_mobile, email, deleted_at);
    CREATE INDEX IF NOT EXISTS idx_guardians_family
      ON guardians(family_id, deleted_at, status, full_name);
    CREATE INDEX IF NOT EXISTS idx_guardians_contact
      ON guardians(mobile, email, deleted_at);
    CREATE INDEX IF NOT EXISTS idx_student_guardian_links_student
      ON student_guardian_links(student_id, deleted_at, is_primary);
    CREATE INDEX IF NOT EXISTS idx_student_guardian_links_family
      ON student_guardian_links(family_id, deleted_at, student_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_student_guardian_links_active_unique
      ON student_guardian_links(student_id, guardian_id)
      WHERE deleted_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_school_rules_filter
      ON school_rules(deleted_at, status, category, display_order);
    CREATE INDEX IF NOT EXISTS idx_school_rules_session
      ON school_rules(academic_session_id, deleted_at, display_order);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_app_preferences_application
      ON app_preferences(preference_scope)
      WHERE preference_scope = 'Application';
    CREATE UNIQUE INDEX IF NOT EXISTS idx_app_preferences_user
      ON app_preferences(user_id)
      WHERE preference_scope = 'User' AND user_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_login_history_user
      ON login_history(user_id, login_at DESC);
    CREATE INDEX IF NOT EXISTS idx_login_history_login
      ON login_history(login_at DESC, success);
  `);
  if (
    Number(
      db
        .prepare(`
          SELECT COUNT(*) AS count
          FROM app_preferences
          WHERE preference_scope = 'Application'
        `)
        .get()?.count ?? 0,
    ) === 0
  ) {
    const timestamp = now();
    db.prepare(`
      INSERT INTO app_preferences (
        id, preference_scope, user_id, theme_mode, accent_color, language,
        compact_sidebar, font_scale, date_format, time_format, created_at,
        updated_at
      ) VALUES (
        'application-defaults', 'Application', NULL, 'Light', 'Blue',
        'English', 0, 'Normal', 'DD/MM/YYYY', '12 Hour', @timestamp,
        @timestamp
      )
    `).run({ timestamp });
  }
  if (
    Number(
      db
        .prepare(`
          SELECT COUNT(*) AS count
          FROM grading_schemes
          WHERE deleted_at IS NULL
        `)
        .get()?.count ?? 0,
    ) === 0
  ) {
    const timestamp = now();
    const schemeId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO grading_schemes (
        id, name, calculation_mode, status, is_default, description,
        created_by, created_at, updated_at, deleted_at, sync_status
      ) VALUES (
        @id, 'Default Percentage Scheme', 'Percentage', 'Active', 1,
        'Default school grading scheme', 'System', @timestamp, @timestamp,
        NULL, 'pending'
      )
    `).run({ id: schemeId, timestamp });
    DEFAULT_GRADING_RANGES.forEach((range, index) => {
      db.prepare(`
        INSERT INTO grading_ranges (
          id, grading_scheme_id, min_value, max_value, grade, grade_point,
          result_status, description, display_order, created_at, updated_at,
          deleted_at, sync_status
        ) VALUES (
          @id, @schemeId, @minValue, @maxValue, @grade, @gradePoint,
          @resultStatus, '', @displayOrder, @timestamp, @timestamp, NULL,
          'pending'
        )
      `).run({
        id: crypto.randomUUID(),
        schemeId,
        minValue: range.minValue,
        maxValue: range.maxValue,
        grade: range.grade,
        gradePoint: range.gradePoint,
        resultStatus: range.resultStatus,
        displayOrder: index,
        timestamp,
      });
    });
  }
  if (
    Number(
      db
        .prepare(`
          SELECT COUNT(*) AS count
          FROM report_card_templates
          WHERE deleted_at IS NULL
        `)
        .get()?.count ?? 0,
    ) === 0
  ) {
    const timestamp = now();
    db.prepare(`
      INSERT INTO report_card_templates (
        id, name, template_type, show_attendance, show_class_tests,
        show_behaviour, show_skills, show_teacher_remarks,
        show_principal_signature, header_text, footer_text, status,
        created_at, updated_at, deleted_at, sync_status
      ) VALUES (
        @id, 'Standard Report Card', 'Standard', 1, 0, 1, 1, 1, 1,
        'Academic Report Card', 'This is a system generated report card.',
        'Active', @timestamp, @timestamp, NULL, 'pending'
      )
    `).run({ id: crypto.randomUUID(), timestamp });
  }
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
    CREATE UNIQUE INDEX IF NOT EXISTS idx_fee_invoice_account_mapping_active
      ON fee_invoice_account_mappings(fee_head_id)
      WHERE deleted_at IS NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_account_linked_record_active
      ON account_transactions(linked_module, linked_record_id, type)
      WHERE deleted_at IS NULL
        AND linked_record_id IS NOT NULL
        AND trim(linked_record_id) <> '';
    CREATE INDEX IF NOT EXISTS idx_timetable_weekdays_order
      ON timetable_weekdays(deleted_at, display_order, name);
    CREATE INDEX IF NOT EXISTS idx_timetable_periods_order
      ON timetable_periods(deleted_at, display_order, start_time);
    CREATE INDEX IF NOT EXISTS idx_classrooms_active
      ON classrooms(deleted_at, status, name);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_timetable_class_slot
      ON timetable_entries(
        class_name, COALESCE(section, ''), weekday_id, period_id
      )
      WHERE deleted_at IS NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_timetable_teacher_slot
      ON timetable_entries(teacher_id, weekday_id, period_id)
      WHERE deleted_at IS NULL
        AND teacher_id IS NOT NULL
        AND trim(teacher_id) <> '';
    CREATE UNIQUE INDEX IF NOT EXISTS idx_timetable_classroom_slot
      ON timetable_entries(classroom_id, weekday_id, period_id)
      WHERE deleted_at IS NULL
        AND classroom_id IS NOT NULL
        AND trim(classroom_id) <> '';
    CREATE INDEX IF NOT EXISTS idx_homework_class_date
      ON homework(class_name, section, homework_date, deleted_at);
    CREATE INDEX IF NOT EXISTS idx_homework_due_status
      ON homework(due_date, status, deleted_at);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_homework_submission_student
      ON homework_submissions(homework_id, student_id);
    CREATE INDEX IF NOT EXISTS idx_homework_submission_status
      ON homework_submissions(homework_id, status, student_name);
    CREATE INDEX IF NOT EXISTS idx_class_tests_class_date
      ON class_tests(class_name, section, test_date, deleted_at);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_class_test_mark_student
      ON class_test_marks(test_id, student_id);
    CREATE INDEX IF NOT EXISTS idx_class_test_marks_result
      ON class_test_marks(test_id, result_status, student_name);
    CREATE INDEX IF NOT EXISTS idx_subject_chapters_filter
      ON subject_chapters(class_name, subject_id, status, deleted_at);
    CREATE INDEX IF NOT EXISTS idx_question_bank_filter
      ON question_bank(
        class_name, subject_id, chapter_id, question_type, difficulty,
        status, deleted_at
      );
    CREATE INDEX IF NOT EXISTS idx_question_papers_class
      ON question_papers(class_name, subject_id, created_at, deleted_at);
    CREATE INDEX IF NOT EXISTS idx_question_paper_items_order
      ON question_paper_items(paper_id, display_order);
    CREATE INDEX IF NOT EXISTS idx_behaviour_traits_active
      ON behaviour_traits(status, deleted_at, name);
    CREATE INDEX IF NOT EXISTS idx_skill_traits_domain
      ON skill_traits(domain, status, deleted_at, name);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_behaviour_rating_entry
      ON student_behaviour_ratings(
        student_id, trait_id, rating_date, COALESCE(academic_year, '')
      )
      WHERE deleted_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_behaviour_ratings_report
      ON student_behaviour_ratings(
        class_name, section, rating_date, student_id, deleted_at
      );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_skill_rating_entry
      ON student_skill_ratings(
        student_id, skill_id, rating_date, COALESCE(academic_year, '')
      )
      WHERE deleted_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_skill_ratings_report
      ON student_skill_ratings(
        domain, class_name, section, rating_date, student_id, deleted_at
      );
    CREATE INDEX IF NOT EXISTS idx_student_observations_report
      ON student_observations(
        student_id, observation_date, status, deleted_at
      );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_academic_session_current
      ON academic_sessions(is_current)
      WHERE is_current = 1 AND deleted_at IS NULL;
    CREATE INDEX IF NOT EXISTS idx_academic_sessions_status
      ON academic_sessions(status, is_current, deleted_at, start_date);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_student_session_unique
      ON student_session_history(student_id, academic_session_id);
    CREATE INDEX IF NOT EXISTS idx_student_session_roster
      ON student_session_history(
        academic_session_id, class_name, section, status, student_name
      );
    CREATE INDEX IF NOT EXISTS idx_student_promotions_sessions
      ON student_promotions(
        from_session_id, to_session_id, promotion_date, created_at
      );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_promotion_item_student
      ON student_promotion_items(promotion_id, student_id);
    CREATE INDEX IF NOT EXISTS idx_carry_forward_due_filter
      ON fee_due_carry_forward(
        to_session_id, from_session_id, status, student_name
      );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_carry_forward_promotion_student
      ON fee_due_carry_forward(promotion_id, student_id)
      WHERE promotion_id IS NOT NULL AND trim(promotion_id) <> '';
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

  db.prepare(`
    INSERT OR IGNORE INTO communication_gateway_settings (
      id, gateway_url, encrypted_device_token, token_storage, token_prefix,
      connection_status, provider_mode, whatsapp_status, sms_status, last_success_at,
      last_error, created_at, updated_at
    ) VALUES (
      @id, '', NULL, '', '', 'Not configured', 'Unknown', 'Unknown', 'Unknown',
      NULL, '', @createdAt, @updatedAt
    )
  `).run({
    id: DEFAULT_SETTINGS_ID,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  const insertDocumentTemplateSetting = db.prepare(`
    INSERT OR IGNORE INTO document_template_settings (
      id, document_type, udise_code, recognition_number, principal_name,
      principal_signature_path, school_stamp_path, accent_color, footer_text,
      fee_receipt_terms, default_paper_size, show_fields_json, created_at,
      updated_at, sync_status
    ) VALUES (
      @id, @documentType, '', '', '', '', '', '#1f4e79', @footerText,
      @feeReceiptTerms, @defaultPaperSize, '{}', @createdAt, @updatedAt,
      'pending'
    )
  `);
  [
    {
      id: "document-template-admission-form",
      documentType: "Admission Form",
      footerText:
        "All information must be verified with original documents before admission is finalized.",
      feeReceiptTerms: "",
      defaultPaperSize: "A4",
    },
    {
      id: "document-template-transfer-certificate",
      documentType: "Transfer Certificate",
      footerText:
        "This certificate is issued according to the school admission register.",
      feeReceiptTerms: "",
      defaultPaperSize: "A4",
    },
    {
      id: "document-template-fee-receipt",
      documentType: "Fee Receipt",
      footerText: "Computer-generated receipt.",
      feeReceiptTerms: "Fees once paid are not refundable or transferable.",
      defaultPaperSize: "A5",
    },
  ].forEach((templateSetting) => {
    insertDocumentTemplateSetting.run({
      ...templateSetting,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
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

  const insertDefaultWeekday = db.prepare(`
    INSERT OR IGNORE INTO timetable_weekdays (
      id, name, display_order, is_active, created_at, updated_at,
      deleted_at, sync_status
    ) VALUES (
      @id, @name, @displayOrder, 1, @createdAt, @updatedAt, NULL, 'pending'
    )
  `);
  ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    .forEach((name, index) => {
      insertDefaultWeekday.run({
        id: `default-weekday-${name.toLowerCase()}`,
        name,
        displayOrder: index + 1,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    });

  const insertDefaultBehaviourTrait = db.prepare(`
    INSERT OR IGNORE INTO behaviour_traits (
      id, name, description, status, created_at, updated_at, deleted_at,
      sync_status
    ) VALUES (
      @id, @name, @description, 'Active', @createdAt, @updatedAt, NULL,
      'pending'
    )
  `);
  [
    "Discipline",
    "Punctuality",
    "Cleanliness",
    "Respectfulness",
    "Participation",
    "Responsibility",
  ].forEach((name) => {
    insertDefaultBehaviourTrait.run({
      id: `default-behaviour-${name.toLowerCase().replaceAll(" ", "-")}`,
      name,
      description: `Default ${name.toLowerCase()} behaviour trait`,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });

  const insertDefaultSkillTrait = db.prepare(`
    INSERT OR IGNORE INTO skill_traits (
      id, name, domain, description, status, created_at, updated_at,
      deleted_at, sync_status
    ) VALUES (
      @id, @name, @domain, @description, 'Active', @createdAt, @updatedAt,
      NULL, 'pending'
    )
  `);
  const defaultSkillTraits = {
    Affective: [
      "Attitude",
      "Cooperation",
      "Confidence",
      "Leadership",
      "Emotional Balance",
    ],
    Psychomotor: [
      "Handwriting",
      "Drawing",
      "Sports",
      "Craft Work",
      "Physical Activity",
    ],
  };
  for (const [domain, names] of Object.entries(defaultSkillTraits)) {
    for (const name of names) {
      insertDefaultSkillTrait.run({
        id: `default-skill-${domain.toLowerCase()}-${name
          .toLowerCase()
          .replaceAll(" ", "-")}`,
        name,
        domain,
        description: `Default ${domain.toLowerCase()} skill trait`,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
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
    SELECT
      students.*,
      COALESCE(
        current_history.academic_session_id,
        (
          SELECT history.academic_session_id
          FROM student_session_history AS history
          WHERE history.student_id = students.id
          ORDER BY history.created_at DESC
          LIMIT 1
        )
      ) AS academic_session_id,
      COALESCE(
        current_history.academic_session_name,
        (
          SELECT history.academic_session_name
          FROM student_session_history AS history
          WHERE history.student_id = students.id
          ORDER BY history.created_at DESC
          LIMIT 1
        )
      ) AS academic_session_name,
      CASE
        WHEN current_history.status IN ('TC', 'Left')
          THEN current_history.status
        WHEN students.status = 'Inactive' THEN COALESCE(
          (
            SELECT history.status
            FROM student_session_history AS history
            WHERE history.student_id = students.id
              AND history.status IN ('TC', 'Left')
            ORDER BY history.created_at DESC
            LIMIT 1
          ),
          students.status
        )
        ELSE students.status
      END AS session_status
    FROM students
    LEFT JOIN academic_sessions AS current_session
      ON current_session.is_current = 1
      AND current_session.deleted_at IS NULL
    LEFT JOIN student_session_history AS current_history
      ON current_history.student_id = students.id
      AND current_history.academic_session_id = current_session.id
    WHERE students.deleted_at IS NULL
    ORDER BY students.created_at DESC
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

  function generateAdmissionSnapshotNumber(formDate) {
    const year = normalizeDate(formDate, "Form date").slice(0, 4);
    const stem = `ADM-FORM-${year}-`;
    const sequence = db
      .prepare(`
        SELECT MAX(
          CAST(substr(snapshot_no, length(?) + 1) AS INTEGER)
        ) AS last_sequence
        FROM admission_form_snapshots
        WHERE substr(snapshot_no, 1, length(?)) = ?
      `)
      .get(stem, stem, stem);
    const nextSequence = Number(sequence?.last_sequence ?? 0) + 1;
    return `${stem}${String(nextSequence).padStart(4, "0")}`;
  }

  function generateTransferCertificateNumber(issueDate) {
    const year = normalizeDate(issueDate, "Issue date").slice(0, 4);
    const stem = `TC-${year}-`;
    const sequence = db
      .prepare(`
        SELECT MAX(
          CAST(substr(certificate_number, length(?) + 1) AS INTEGER)
        ) AS last_sequence
        FROM transfer_certificates
        WHERE substr(certificate_number, 1, length(?)) = ?
      `)
      .get(stem, stem, stem);
    const nextSequence = Number(sequence?.last_sequence ?? 0) + 1;
    return `${stem}${String(nextSequence).padStart(4, "0")}`;
  }

  function generateTransferSerialNumber(issueDate) {
    const year = normalizeDate(issueDate, "Issue date").slice(0, 4);
    const stem = `TC-SR-${year}-`;
    const sequence = db
      .prepare(`
        SELECT MAX(
          CAST(substr(serial_number, length(?) + 1) AS INTEGER)
        ) AS last_sequence
        FROM transfer_certificates
        WHERE substr(serial_number, 1, length(?)) = ?
      `)
      .get(stem, stem, stem);
    const nextSequence = Number(sequence?.last_sequence ?? 0) + 1;
    return `${stem}${String(nextSequence).padStart(4, "0")}`;
  }

  const smallNumberWords = [
    "Zero",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tensNumberWords = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function numberUnderThousandToWords(value) {
    const number = Math.floor(Number(value) || 0);
    const parts = [];
    const hundreds = Math.floor(number / 100);
    const remainder = number % 100;
    if (hundreds > 0) {
      parts.push(`${smallNumberWords[hundreds]} Hundred`);
    }
    if (remainder > 0) {
      if (remainder < 20) {
        parts.push(smallNumberWords[remainder]);
      } else {
        const tens = Math.floor(remainder / 10);
        const ones = remainder % 10;
        parts.push(
          ones > 0
            ? `${tensNumberWords[tens]} ${smallNumberWords[ones]}`
            : tensNumberWords[tens],
        );
      }
    }
    return parts.join(" ");
  }

  function numberToIndianWords(value) {
    const number = Math.floor(Math.abs(Number(value) || 0));
    if (number === 0) return "Zero";
    const chunks = [
      { label: "Crore", divisor: 10000000 },
      { label: "Lakh", divisor: 100000 },
      { label: "Thousand", divisor: 1000 },
      { label: "Hundred", divisor: 100 },
    ];
    let remaining = number;
    const parts = [];
    for (const chunk of chunks) {
      const quotient = Math.floor(remaining / chunk.divisor);
      if (quotient > 0) {
        parts.push(
          chunk.label === "Hundred"
            ? `${smallNumberWords[quotient]} Hundred`
            : `${numberUnderThousandToWords(quotient)} ${chunk.label}`,
        );
        remaining %= chunk.divisor;
      }
    }
    if (remaining > 0) parts.push(numberUnderThousandToWords(remaining));
    return parts.join(" ");
  }

  function amountToWords(amount) {
    const rupees = Math.floor(Math.max(0, Number(amount) || 0));
    return `${numberToIndianWords(rupees)} Rupees Only`;
  }

  function dateToWords(value) {
    const text = optionalText(value);
    if (!text) return "";
    let dateText = "";
    try {
      dateText = normalizeDate(text, "Date");
    } catch {
      return "";
    }
    const date = new Date(`${dateText}T00:00:00Z`);
    const day = date.getUTCDate();
    const month = new Intl.DateTimeFormat("en-IN", {
      month: "long",
      timeZone: "UTC",
    }).format(date);
    return `${numberToIndianWords(day)} ${month} ${numberToIndianWords(
      date.getUTCFullYear(),
    )}`;
  }

  function calculateAgeOnDate(dateOfBirth, referenceDate) {
    const birthText = optionalText(dateOfBirth);
    const referenceText = optionalText(referenceDate);
    if (!birthText || !referenceText) {
      return { years: "", months: "", display: "" };
    }
    let birthDate;
    let targetDate;
    try {
      birthDate = new Date(`${normalizeDate(birthText, "Date of birth")}T00:00:00Z`);
      targetDate = new Date(`${normalizeDate(referenceText, "Admission date")}T00:00:00Z`);
    } catch {
      return { years: "", months: "", display: "" };
    }
    if (birthDate > targetDate) {
      return { years: "", months: "", display: "" };
    }
    let years = targetDate.getUTCFullYear() - birthDate.getUTCFullYear();
    let months = targetDate.getUTCMonth() - birthDate.getUTCMonth();
    if (targetDate.getUTCDate() < birthDate.getUTCDate()) months -= 1;
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    return {
      years,
      months,
      display: `${years} year${years === 1 ? "" : "s"} ${months} month${
        months === 1 ? "" : "s"
      }`,
    };
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

  function generateQuestionPaperNumber() {
    const year = new Date().getFullYear();
    const paperStem = `QP-${year}-`;
    const sequence = db
      .prepare(`
        SELECT MAX(
          CAST(substr(paper_no, length(?) + 1) AS INTEGER)
        ) AS last_sequence
        FROM question_papers
        WHERE substr(paper_no, 1, length(?)) = ?
      `)
      .get(paperStem, paperStem, paperStem);
    const nextSequence = Number(sequence?.last_sequence ?? 0) + 1;
    return `${paperStem}${String(nextSequence).padStart(4, "0")}`;
  }

  function generateFamilyCode() {
    const year = new Date().getFullYear();
    const familyStem = `FAM-${year}-`;
    const sequence = db
      .prepare(`
        SELECT MAX(
          CAST(substr(family_code, length(?) + 1) AS INTEGER)
        ) AS last_sequence
        FROM families
        WHERE substr(family_code, 1, length(?)) = ?
      `)
      .get(familyStem, familyStem, familyStem);
    const nextSequence = Number(sequence?.last_sequence ?? 0) + 1;
    return `${familyStem}${String(nextSequence).padStart(4, "0")}`;
  }

  function normalizeGuardianRelation(value, fallback = "Guardian") {
    const relation = optionalText(value) || fallback;
    if (!GUARDIAN_RELATIONS.has(relation)) {
      throw new Error("Guardian relation is invalid.");
    }
    return relation;
  }

  function normalizeDocumentType(value) {
    const documentType = requiredText(value, "Document type");
    if (!DOCUMENT_TEMPLATE_TYPES.has(documentType)) {
      throw new Error("Document type is invalid.");
    }
    return documentType;
  }

  function normalizeDocumentPaperSize(value, fallback = "A4") {
    const paperSize = optionalText(value) || fallback;
    if (!DOCUMENT_PAPER_SIZES.has(paperSize)) {
      throw new Error("Document paper size is invalid.");
    }
    return paperSize;
  }

  function normalizeTransferCertificateStatus(value, fallback = "Draft") {
    const status = optionalText(value) || fallback;
    if (!TRANSFER_CERTIFICATE_STATUSES.has(status)) {
      throw new Error("Transfer certificate status is invalid.");
    }
    return status;
  }

  function getDocumentTemplateSettingsRow(documentType) {
    const normalizedType = normalizeDocumentType(documentType);
    return db
      .prepare(`
        SELECT *
        FROM document_template_settings
        WHERE document_type = ?
      `)
      .get(normalizedType);
  }

  function getDocumentTemplateSettingsOrDefault(documentType) {
    const normalizedType = normalizeDocumentType(documentType);
    const row = getDocumentTemplateSettingsRow(normalizedType);
    if (row) return documentTemplateSettingsFromRow(row);
    const timestamp = now();
    db.prepare(`
      INSERT INTO document_template_settings (
        id, document_type, udise_code, recognition_number, principal_name,
        principal_signature_path, school_stamp_path, accent_color, footer_text,
        fee_receipt_terms, default_paper_size, show_fields_json, created_at,
        updated_at, sync_status
      ) VALUES (
        @id, @documentType, '', '', '', '', '', '#1f4e79', '', '',
        'A4', '{}', @createdAt, @updatedAt, 'pending'
      )
    `).run({
      id: `document-template-${normalizedType.toLowerCase().replaceAll(" ", "-")}`,
      documentType: normalizedType,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    return documentTemplateSettingsFromRow(
      getDocumentTemplateSettingsRow(normalizedType),
    );
  }

  function getStudentGuardianLinksForDocuments(studentId) {
    if (!studentId) return [];
    return db
      .prepare(`
        ${studentGuardianLinkSelect("links.student_id = @studentId AND links.deleted_at IS NULL")}
        ORDER BY links.is_primary DESC,
          guardians.relation COLLATE NOCASE,
          guardians.full_name COLLATE NOCASE
      `)
      .all({ studentId })
      .map(studentGuardianLinkFromRow);
  }

  function buildAdmissionFormData(input = {}) {
    const mode = optionalText(input.mode) === "Blank" ? "Blank" : "Prefilled";
    const formDate =
      mode === "Blank"
        ? optionalText(input.formDate) || now().slice(0, 10)
        : normalizeDate(optionalText(input.formDate) || now().slice(0, 10), "Form date");
    const settings = settingsFromRow(
      db.prepare("SELECT * FROM school_settings WHERE id = ?").get(DEFAULT_SETTINGS_ID),
    );
    const templateSettings = getDocumentTemplateSettingsOrDefault("Admission Form");
    if (mode === "Blank") {
      return {
        mode,
        formDate,
        schoolSettings: settings,
        templateSettings,
        student: null,
        guardians: [],
        primaryGuardian: null,
        father: null,
        mother: null,
        ageAtAdmission: { years: "", months: "", display: "" },
        dateOfBirthWords: "",
      };
    }
    const studentId = requiredText(input.studentId, "Student");
    const studentRow = getStudentStatement.get(studentId);
    if (!studentRow) {
      throw new Error("The selected student was not found.");
    }
    const student = studentFromRow(studentRow);
    const guardians = getStudentGuardianLinksForDocuments(student.id);
    const primaryGuardian = guardians.find((guardian) => guardian.isPrimary) ?? guardians[0] ?? null;
    const father =
      guardians.find((guardian) => guardian.relationToStudent === "Father") ??
      guardians.find((guardian) => guardian.relation === "Father") ??
      null;
    const mother =
      guardians.find((guardian) => guardian.relationToStudent === "Mother") ??
      guardians.find((guardian) => guardian.relation === "Mother") ??
      null;
    return {
      mode,
      formDate,
      schoolSettings: settings,
      templateSettings,
      student,
      guardians,
      primaryGuardian,
      father,
      mother,
      ageAtAdmission: calculateAgeOnDate(
        student.dateOfBirth,
        student.admissionDate || formDate,
      ),
      dateOfBirthWords: dateToWords(student.dateOfBirth),
    };
  }

  function buildTransferCertificateInput(input = {}, existing = null) {
    const studentId =
      input.studentId === undefined
        ? existing?.student_id
        : requiredText(input.studentId, "Student");
    const studentRow = getStudentStatement.get(studentId);
    if (!studentRow) {
      throw new Error("The selected student was not found.");
    }
    const student = studentFromRow(studentRow);
    const guardians = getStudentGuardianLinksForDocuments(student.id);
    const father =
      guardians.find((guardian) => guardian.relationToStudent === "Father") ??
      guardians.find((guardian) => guardian.relation === "Father") ??
      null;
    const primaryGuardian = guardians.find((guardian) => guardian.isPrimary) ?? guardians[0] ?? null;
    const issueDate = normalizeDate(
      input.issueDate === undefined
        ? existing?.issue_date || now().slice(0, 10)
        : input.issueDate,
      "Issue date",
    );
    const certificateNumber =
      input.certificateNumber === undefined
        ? existing?.certificate_number || generateTransferCertificateNumber(issueDate)
        : requiredText(input.certificateNumber, "Certificate number");
    const serialNumber =
      input.serialNumber === undefined
        ? existing?.serial_number || generateTransferSerialNumber(issueDate)
        : optionalText(input.serialNumber) || generateTransferSerialNumber(issueDate);

    return {
      student,
      values: {
        studentId: student.id,
        certificateNumber,
        serialNumber,
        srNumber:
          input.srNumber === undefined
            ? existing?.sr_number ?? student.admissionNo
            : optionalText(input.srNumber),
        penNumber:
          input.penNumber === undefined
            ? existing?.pen_number ?? ""
            : optionalText(input.penNumber),
        academicSessionId:
          input.academicSessionId === undefined
            ? existing?.academic_session_id ?? student.academicSessionId ?? ""
            : optionalText(input.academicSessionId),
        academicSessionName:
          input.academicSessionName === undefined
            ? existing?.academic_session_name ?? student.academicSessionName ?? ""
            : optionalText(input.academicSessionName),
        studentName:
          input.studentName === undefined
            ? existing?.student_name ?? student.name
            : requiredText(input.studentName, "Student name"),
        admissionNo:
          input.admissionNo === undefined
            ? existing?.admission_no ?? student.admissionNo
            : optionalText(input.admissionNo),
        className:
          input.className === undefined
            ? existing?.class_name ?? student.className
            : optionalText(input.className),
        section:
          input.section === undefined
            ? existing?.section ?? student.section
            : optionalText(input.section),
        fatherGuardianName:
          input.fatherGuardianName === undefined
            ? existing?.father_guardian_name ??
              father?.guardianName ??
              father?.guardianFullName ??
              student.fatherName ??
              primaryGuardian?.guardianName ??
              student.guardianName ??
              ""
            : optionalText(input.fatherGuardianName),
        motherName:
          input.motherName === undefined
            ? existing?.mother_name ?? student.motherName ?? ""
            : optionalText(input.motherName),
        dateOfAdmission:
          input.dateOfAdmission === undefined
            ? existing?.date_of_admission ?? student.admissionDate ?? ""
            : optionalText(input.dateOfAdmission)
              ? normalizeDate(input.dateOfAdmission, "Date of admission")
              : "",
        admissionClass:
          input.admissionClass === undefined
            ? existing?.admission_class ?? student.className ?? ""
            : optionalText(input.admissionClass),
        dateOfBirth:
          input.dateOfBirth === undefined
            ? existing?.date_of_birth ?? student.dateOfBirth ?? ""
            : optionalText(input.dateOfBirth)
              ? normalizeDate(input.dateOfBirth, "Date of birth")
              : "",
        dateOfBirthWords:
          input.dateOfBirthWords === undefined
            ? existing?.date_of_birth_words ??
              dateToWords(student.dateOfBirth)
            : optionalText(input.dateOfBirthWords),
        lastClassStudied:
          input.lastClassStudied === undefined
            ? existing?.last_class_studied ?? student.className ?? ""
            : optionalText(input.lastClassStudied),
        promotionQualified:
          input.promotionQualified === undefined
            ? existing?.promotion_qualified ?? ""
            : optionalText(input.promotionQualified),
        promotedToClass:
          input.promotedToClass === undefined
            ? existing?.promoted_to_class ?? ""
            : optionalText(input.promotedToClass),
        duesPaidUpto:
          input.duesPaidUpto === undefined
            ? existing?.dues_paid_upto ?? ""
            : optionalText(input.duesPaidUpto),
        generalConduct:
          input.generalConduct === undefined
            ? existing?.general_conduct ?? "Good"
            : optionalText(input.generalConduct),
        issueDate,
        reasonForLeaving:
          input.reasonForLeaving === undefined
            ? existing?.reason_for_leaving ?? ""
            : optionalText(input.reasonForLeaving),
        nationality:
          input.nationality === undefined
            ? existing?.nationality ?? "Indian"
            : optionalText(input.nationality),
        casteCategory:
          input.casteCategory === undefined
            ? existing?.caste_category ?? ""
            : optionalText(input.casteCategory),
        remarks:
          input.remarks === undefined
            ? existing?.remarks ?? ""
            : optionalText(input.remarks),
        status: normalizeTransferCertificateStatus(
          input.status === undefined ? existing?.status ?? "Draft" : input.status,
        ),
        issuedBy:
          input.issuedBy === undefined
            ? existing?.issued_by ?? ""
            : optionalText(input.issuedBy),
        reissuedFromId:
          input.reissuedFromId === undefined
            ? existing?.reissued_from_id ?? null
            : optionalText(input.reissuedFromId) || null,
      },
    };
  }

  function normalizeGuardianStatus(value, fallback = "Active") {
    return masterStatus(value, fallback);
  }

  function normalizeContact(value) {
    return optionalText(value).replace(/\D/g, "");
  }

  function normalizeEmail(value) {
    return optionalText(value).toLowerCase();
  }

  function getStudentRowRequired(studentId) {
    const student = getStudentStatement.get(
      requiredText(studentId, "Student id"),
    );
    if (!student) throw new Error("Student record was not found.");
    return student;
  }

  function getFamilyRowRequired(familyId) {
    const family = db
      .prepare(`
        SELECT *
        FROM families
        WHERE id = ? AND deleted_at IS NULL
      `)
      .get(requiredText(familyId, "Family id"));
    if (!family) throw new Error("Family record was not found.");
    return family;
  }

  function getGuardianRowRequired(guardianId) {
    const guardian = db
      .prepare(`
        SELECT *
        FROM guardians
        WHERE id = ? AND deleted_at IS NULL
      `)
      .get(requiredText(guardianId, "Guardian id"));
    if (!guardian) throw new Error("Guardian record was not found.");
    return guardian;
  }

  function findDuplicateGuardian(input = {}, excludingId = "") {
    const fullName = optionalText(input.fullName);
    const normalizedMobile = normalizeContact(input.mobile);
    const email = normalizeEmail(input.email);
    if (!fullName || (!normalizedMobile && !email)) return null;
    return db
      .prepare(`
        SELECT *
        FROM guardians
        WHERE deleted_at IS NULL
          AND id <> @excludingId
          AND full_name = @fullName COLLATE NOCASE
          AND (
            (@mobile <> '' AND replace(replace(replace(replace(coalesce(mobile, ''), ' ', ''), '-', ''), '(', ''), ')', '') = @mobile)
            OR (@email <> '' AND lower(coalesce(email, '')) = @email)
          )
        LIMIT 1
      `)
      .get({
        excludingId: optionalText(excludingId),
        fullName,
        mobile: normalizedMobile,
        email,
      });
  }

  function familySelect(whereClause = "families.deleted_at IS NULL") {
    return `
      SELECT
        families.*,
        COUNT(DISTINCT CASE
          WHEN student_guardian_links.deleted_at IS NULL
            AND students.deleted_at IS NULL
          THEN students.id
        END) AS student_count,
        COUNT(DISTINCT CASE
          WHEN guardians.deleted_at IS NULL
          THEN guardians.id
        END) AS guardian_count
      FROM families
      LEFT JOIN guardians
        ON guardians.family_id = families.id
        AND guardians.deleted_at IS NULL
      LEFT JOIN student_guardian_links
        ON student_guardian_links.family_id = families.id
        AND student_guardian_links.deleted_at IS NULL
      LEFT JOIN students
        ON students.id = student_guardian_links.student_id
        AND students.deleted_at IS NULL
      WHERE ${whereClause}
      GROUP BY families.id
    `;
  }

  function buildFamilyWhere(filter = {}) {
    const clauses = ["families.deleted_at IS NULL"];
    const params = {};
    const status = optionalText(filter.status);
    if (status && status !== "All") {
      if (!MASTER_STATUSES.has(status)) throw new Error("Family status is invalid.");
      clauses.push("families.status = @status");
      params.status = status;
    }
    const search = optionalText(filter.search).toLowerCase();
    if (search) {
      clauses.push(`
        (
          lower(families.family_code) LIKE @search OR
          lower(coalesce(families.family_name, '')) LIKE @search OR
          lower(coalesce(families.primary_contact_name, '')) LIKE @search OR
          lower(coalesce(families.primary_mobile, '')) LIKE @search OR
          lower(coalesce(families.email, '')) LIKE @search
        )
      `);
      params.search = `%${search}%`;
    }
    return { where: clauses.join(" AND "), params };
  }

  function buildGuardianWhere(filter = {}) {
    const clauses = ["guardians.deleted_at IS NULL"];
    const params = {};
    const familyId = optionalText(filter.familyId);
    if (familyId) {
      clauses.push("guardians.family_id = @familyId");
      params.familyId = familyId;
    }
    const relation = optionalText(filter.relation);
    if (relation && relation !== "All") {
      clauses.push("guardians.relation = @relation");
      params.relation = normalizeGuardianRelation(relation);
    }
    const status = optionalText(filter.status);
    if (status && status !== "All") {
      clauses.push("guardians.status = @status");
      params.status = normalizeGuardianStatus(status);
    }
    const search = optionalText(filter.search).toLowerCase();
    if (search) {
      clauses.push(`
        (
          lower(guardians.full_name) LIKE @search OR
          lower(coalesce(guardians.mobile, '')) LIKE @search OR
          lower(coalesce(guardians.email, '')) LIKE @search OR
          lower(coalesce(families.family_code, '')) LIKE @search
        )
      `);
      params.search = `%${search}%`;
    }
    return { where: clauses.join(" AND "), params };
  }

  function guardianSelect(whereClause = "guardians.deleted_at IS NULL") {
    return `
      SELECT
        guardians.*,
        families.family_code,
        families.family_name,
        COUNT(DISTINCT CASE
          WHEN student_guardian_links.deleted_at IS NULL
            AND students.deleted_at IS NULL
          THEN students.id
        END) AS linked_student_count
      FROM guardians
      LEFT JOIN families
        ON families.id = guardians.family_id
        AND families.deleted_at IS NULL
      LEFT JOIN student_guardian_links
        ON student_guardian_links.guardian_id = guardians.id
        AND student_guardian_links.deleted_at IS NULL
      LEFT JOIN students
        ON students.id = student_guardian_links.student_id
        AND students.deleted_at IS NULL
      WHERE ${whereClause}
      GROUP BY guardians.id
    `;
  }

  function studentGuardianLinkSelect(whereClause = "links.deleted_at IS NULL") {
    return `
      SELECT
        links.*,
        students.name AS student_name,
        students.admission_no,
        students.class_name,
        students.section,
        guardians.full_name,
        guardians.full_name AS guardian_name,
        guardians.relation,
        guardians.mobile,
        guardians.alternate_mobile,
        guardians.email,
        guardians.occupation,
        guardians.address,
        guardians.can_pickup_student AS guardian_can_pickup_student,
        guardians.emergency_contact AS guardian_emergency_contact,
        families.family_code,
        families.family_name,
        families.emergency_contact_name,
        families.emergency_contact_mobile
      FROM student_guardian_links AS links
      JOIN students
        ON students.id = links.student_id
        AND students.deleted_at IS NULL
      JOIN guardians
        ON guardians.id = links.guardian_id
        AND guardians.deleted_at IS NULL
      LEFT JOIN families
        ON families.id = links.family_id
        AND families.deleted_at IS NULL
      WHERE ${whereClause}
    `;
  }

  function makeLegacyParentInfoRows(student) {
    const guardianName =
      optionalText(student.guardianName) ||
      optionalText(student.fatherName) ||
      optionalText(student.motherName);
    if (!guardianName && !student.mobile && !student.email) {
      return [];
    }
    return [
      {
        studentId: student.id,
        admissionNo: student.admissionNo,
        studentName: student.name,
        className: student.className,
        section: student.section,
        familyId: "",
        familyCode: "",
        familyName: "",
        guardianId: "",
        primaryGuardian: guardianName,
        relation: student.fatherName
          ? "Father"
          : student.motherName
            ? "Mother"
            : "Guardian",
        mobile: student.mobile,
        alternateMobile: "",
        email: student.email,
        occupation: "",
        address: student.address,
        emergencyContact: true,
        emergencyContactName: guardianName,
        emergencyContactMobile: student.mobile,
        pickupAuthorized: true,
        hasLinkedGuardian: false,
        source: "Legacy",
      },
    ];
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
    const mappedCategory = db
      .prepare(`
        SELECT account_categories.*
        FROM fee_invoice_account_mappings
        JOIN account_categories
          ON account_categories.id = fee_invoice_account_mappings.account_category_id
        LEFT JOIN fee_heads
          ON fee_heads.id = fee_invoice_account_mappings.fee_head_id
        WHERE fee_invoice_account_mappings.status = 'Active'
          AND fee_invoice_account_mappings.deleted_at IS NULL
          AND account_categories.type = 'Income'
          AND account_categories.status = 'Active'
          AND account_categories.deleted_at IS NULL
          AND (
            fee_invoice_account_mappings.fee_head_name = ? COLLATE NOCASE
            OR fee_heads.name = ? COLLATE NOCASE
          )
        ORDER BY fee_invoice_account_mappings.updated_at DESC
        LIMIT 1
      `)
      .get(normalizedFeeType, normalizedFeeType);
    if (mappedCategory) return mappedCategory;

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

  function insertAuditLog(user, action, module, details = "") {
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
  }

  function normalizeDiscountMode(value, fieldName = "Discount mode") {
    const mode = requiredText(value, fieldName);
    if (!DISCOUNT_MODES.has(mode)) {
      throw new Error(`${fieldName} must be Fixed or Percentage.`);
    }
    return mode;
  }

  function normalizeBillingPeriod(value) {
    const billingPeriod = requiredText(value, "Billing period");
    if (!BILLING_PERIODS.has(billingPeriod)) {
      throw new Error("Billing period is invalid.");
    }
    return billingPeriod;
  }

  function normalizeInvoiceStatus(value, fallback = "Unpaid") {
    const status = optionalText(value) || fallback;
    if (!FEE_INVOICE_STATUSES.has(status)) {
      throw new Error("Fee invoice status is invalid.");
    }
    return status;
  }

  function normalizeFeePaymentStatus(value, fallback = "Active") {
    const status = optionalText(value) || fallback;
    if (!FEE_PAYMENT_STATUSES.has(status)) {
      throw new Error("Fee payment status is invalid.");
    }
    return status;
  }

  function normalizeOptionalDate(value, fieldName) {
    const text = optionalText(value);
    return text ? normalizeDate(text, fieldName) : "";
  }

  function validateDiscountValue(mode, value, fieldName = "Discount value") {
    const discountValue = wholeNumber(value, fieldName, 0);
    if (mode === "Percentage" && discountValue > 100) {
      throw new Error("Percentage discount must be between 0 and 100.");
    }
    return discountValue;
  }

  function getCurrentAcademicSessionRow() {
    return db
      .prepare(`
        SELECT *
        FROM academic_sessions
        WHERE is_current = 1
          AND deleted_at IS NULL
        LIMIT 1
      `)
      .get();
  }

  function resolveAcademicSession(inputSessionId) {
    const academicSessionId = optionalText(inputSessionId);
    const session = academicSessionId
      ? db
          .prepare(`
            SELECT *
            FROM academic_sessions
            WHERE id = ?
              AND deleted_at IS NULL
          `)
          .get(academicSessionId)
      : getCurrentAcademicSessionRow();
    if (!session) {
      throw new Error("Select an academic session before generating an invoice.");
    }
    return session;
  }

  function generateInvoiceNumber(invoiceDate) {
    const year = normalizeDate(invoiceDate, "Invoice date").slice(0, 4);
    const invoiceStem = `INV-${year}-`;
    const sequence = db
      .prepare(`
        SELECT MAX(
          CAST(substr(invoice_no, length(?) + 1) AS INTEGER)
        ) AS last_sequence
        FROM fee_invoices
        WHERE substr(invoice_no, 1, length(?)) = ?
      `)
      .get(invoiceStem, invoiceStem, invoiceStem);
    const nextSequence = Number(sequence?.last_sequence ?? 0) + 1;
    return `${invoiceStem}${String(nextSequence).padStart(4, "0")}`;
  }

  function generateReportCardNumber(generatedDate) {
    const year = normalizeDate(generatedDate, "Generated date").slice(0, 4);
    const stem = `RC-${year}-`;
    const sequence = db
      .prepare(`
        SELECT MAX(
          CAST(substr(report_card_no, length(?) + 1) AS INTEGER)
        ) AS last_sequence
        FROM student_report_cards
        WHERE substr(report_card_no, 1, length(?)) = ?
      `)
      .get(stem, stem, stem);
    const nextSequence = Number(sequence?.last_sequence ?? 0) + 1;
    return `${stem}${String(nextSequence).padStart(4, "0")}`;
  }

  function getFeeInvoiceItems(invoiceId) {
    return db
      .prepare(`
        SELECT *
        FROM fee_invoice_items
        WHERE invoice_id = ?
        ORDER BY display_order, created_at
      `)
      .all(invoiceId)
      .map(feeInvoiceItemFromRow);
  }

  function getFeeInvoiceAllocations(invoiceId) {
    return db
      .prepare(`
        SELECT *
        FROM fee_invoice_allocations
        WHERE invoice_id = ?
        ORDER BY created_at
      `)
      .all(invoiceId)
      .map(feeInvoiceAllocationFromRow);
  }

  function getFeeInvoiceByIdInternal(invoiceId) {
    const id = requiredText(invoiceId, "Invoice id");
    const row = db.prepare("SELECT * FROM fee_invoices WHERE id = ?").get(id);
    if (!row) return null;
    return feeInvoiceFromRow(
      row,
      getFeeInvoiceItems(id),
      getFeeInvoiceAllocations(id),
    );
  }

  function findPossibleDuplicateInvoices(studentId, academicSessionId, billingPeriod) {
    return db
      .prepare(`
        SELECT *
        FROM fee_invoices
        WHERE student_id = ?
          AND COALESCE(academic_session_id, '') = ?
          AND billing_period = ?
          AND status <> 'Cancelled'
        ORDER BY created_at DESC
      `)
      .all(studentId, academicSessionId ?? "", billingPeriod)
      .map((row) => feeInvoiceFromRow(row));
  }

  function getFeeStructuresForInvoice(student, academicSessionName) {
    const settings = db
      .prepare("SELECT * FROM school_settings WHERE id = ?")
      .get(DEFAULT_SETTINGS_ID);
    const academicYear = optionalText(settings?.academic_year);
    const sessionName = optionalText(academicSessionName);
    const exactRows = db
      .prepare(`
        SELECT fee_structures.*
        FROM fee_structures
        LEFT JOIN fee_heads
          ON fee_heads.id = fee_structures.fee_head_id
        WHERE fee_structures.class_name = ?
          AND fee_structures.status = 'Active'
          AND fee_structures.deleted_at IS NULL
          AND (fee_heads.id IS NULL OR fee_heads.deleted_at IS NULL)
          AND (fee_heads.id IS NULL OR fee_heads.status = 'Active')
          AND (
            COALESCE(fee_structures.academic_year, '') = ''
            OR fee_structures.academic_year = ?
            OR fee_structures.academic_year = ?
          )
        ORDER BY fee_structures.fee_head_name
      `)
      .all(student.class_name, sessionName, academicYear);
    if (exactRows.length > 0) return exactRows;

    return db
      .prepare(`
        SELECT fee_structures.*
        FROM fee_structures
        LEFT JOIN fee_heads
          ON fee_heads.id = fee_structures.fee_head_id
        WHERE fee_structures.class_name = ?
          AND fee_structures.status = 'Active'
          AND fee_structures.deleted_at IS NULL
          AND (fee_heads.id IS NULL OR fee_heads.deleted_at IS NULL)
          AND (fee_heads.id IS NULL OR fee_heads.status = 'Active')
        ORDER BY fee_structures.fee_head_name
      `)
      .all(student.class_name);
  }

  function getPreviousDueForInvoice(studentId, academicSessionId) {
    const academicSession = optionalText(academicSessionId);
    if (academicSession) {
      return Number(
        db
          .prepare(`
            SELECT COALESCE(SUM(carried_amount), 0) AS amount
            FROM fee_due_carry_forward
            WHERE student_id = ?
              AND to_session_id = ?
              AND status = 'Pending'
          `)
          .get(studentId, academicSession)?.amount ?? 0,
      );
    }
    return Number(
      db
        .prepare(`
          SELECT COALESCE(SUM(carried_amount), 0) AS amount
          FROM fee_due_carry_forward
          WHERE student_id = ?
            AND status = 'Pending'
        `)
        .get(studentId)?.amount ?? 0,
    );
  }

  function getEligibleStudentDiscountRows(studentId, academicSessionId, invoiceDate) {
    const date = normalizeDate(invoiceDate, "Invoice date");
    return db
      .prepare(`
        SELECT *
        FROM student_discounts
        WHERE student_id = ?
          AND status = 'Active'
          AND deleted_at IS NULL
          AND (
            COALESCE(academic_session_id, '') = ''
            OR academic_session_id = ?
          )
          AND (
            COALESCE(start_date, '') = ''
            OR date(start_date) <= date(?)
          )
          AND (
            COALESCE(end_date, '') = ''
            OR date(end_date) >= date(?)
          )
        ORDER BY created_at
      `)
      .all(studentId, academicSessionId ?? "", date, date);
  }

  function calculateDiscountedInvoiceItems(baseItems, discountRows) {
    const items = baseItems.map((item) => ({
      ...item,
      discountAmount: 0,
      netAmount: item.grossAmount,
    }));

    for (const discount of discountRows) {
      const mode = normalizeDiscountMode(discount.discount_mode);
      const value = validateDiscountValue(mode, discount.discount_value);
      if (value === 0) continue;

      const restrictedFeeHeadId = optionalText(discount.fee_head_id);
      const restrictedFeeHeadName = optionalText(discount.fee_head_name).toLowerCase();
      const eligibleItems = items.filter((item) => {
        if (restrictedFeeHeadId) return item.feeHeadId === restrictedFeeHeadId;
        if (restrictedFeeHeadName) {
          return item.feeHeadName.toLowerCase() === restrictedFeeHeadName;
        }
        return true;
      });
      if (eligibleItems.length === 0) continue;

      if (mode === "Percentage") {
        for (const item of eligibleItems) {
          const remaining = Math.max(item.grossAmount - item.discountAmount, 0);
          const calculated = Math.floor((item.grossAmount * value) / 100);
          item.discountAmount += Math.min(remaining, calculated);
        }
        continue;
      }

      let remainingDiscount = Math.min(
        value,
        eligibleItems.reduce(
          (total, item) =>
            total + Math.max(item.grossAmount - item.discountAmount, 0),
          0,
        ),
      );
      for (const item of eligibleItems) {
        if (remainingDiscount <= 0) break;
        const remaining = Math.max(item.grossAmount - item.discountAmount, 0);
        const applied = Math.min(remaining, remainingDiscount);
        item.discountAmount += applied;
        remainingDiscount -= applied;
      }
    }

    return items.map((item) => ({
      ...item,
      netAmount: Math.max(item.grossAmount - item.discountAmount, 0),
    }));
  }

  function buildFeeInvoicePreview(input) {
    const studentId = requiredText(input?.studentId, "Student");
    const student = getStudentStatement.get(studentId);
    if (!student) {
      throw new Error("The selected student was not found.");
    }

    const academicSession = resolveAcademicSession(input?.academicSessionId);
    const billingPeriod = normalizeBillingPeriod(input?.billingPeriod);
    const invoiceDate = normalizeDate(
      optionalText(input?.invoiceDate) || now().slice(0, 10),
      "Invoice date",
    );
    const dueDate = normalizeOptionalDate(input?.dueDate, "Due date");
    if (dueDate && dueDate < invoiceDate) {
      throw new Error("Due date cannot be before invoice date.");
    }

    const structures = getFeeStructuresForInvoice(student, academicSession.session_name);
    if (structures.length === 0) {
      throw new Error("Create an active fee structure for this student's class first.");
    }

    const baseItems = structures.map((structure, index) => {
      const grossAmount = wholeNumber(structure.amount, "Fee structure amount", 0);
      return {
        feeHeadId: structure.fee_head_id ?? "",
        feeHeadName: structure.fee_head_name,
        description: `${structure.fee_head_name} - ${billingPeriod}`,
        quantity: 1,
        unitAmount: grossAmount,
        grossAmount,
        discountAmount: 0,
        netAmount: grossAmount,
        displayOrder: index + 1,
      };
    });
    const discountRows = getEligibleStudentDiscountRows(
      student.id,
      academicSession.id,
      invoiceDate,
    );
    const items = calculateDiscountedInvoiceItems(baseItems, discountRows);
    const subtotal = items.reduce((total, item) => total + item.grossAmount, 0);
    const discountAmount = items.reduce(
      (total, item) => total + item.discountAmount,
      0,
    );
    const previousDue = input?.includePreviousDue
      ? getPreviousDueForInvoice(student.id, academicSession.id)
      : 0;
    const lateFee = wholeNumber(input?.lateFee ?? 0, "Late fee", 0);
    const adjustmentAmount = integerAmount(
      input?.adjustmentAmount ?? 0,
      "Adjustment amount",
    );
    const adjustmentReason = optionalText(input?.adjustmentReason);
    if (adjustmentAmount !== 0 && !adjustmentReason) {
      throw new Error("Adjustment reason is required when an adjustment is applied.");
    }

    const grandTotal =
      subtotal - discountAmount + previousDue + lateFee + adjustmentAmount;
    if (grandTotal < 0) {
      throw new Error("Invoice total cannot be negative.");
    }

    const possibleDuplicates = findPossibleDuplicateInvoices(
      student.id,
      academicSession.id,
      billingPeriod,
    );

    return {
      studentId: student.id,
      admissionNo: student.admission_no ?? "",
      studentName: student.name,
      className: student.class_name ?? "",
      section: student.section ?? "",
      academicSessionId: academicSession.id,
      academicSessionName: academicSession.session_name,
      billingPeriod,
      invoiceDate,
      dueDate,
      subtotal,
      discountAmount,
      previousDue,
      lateFee,
      adjustmentAmount,
      adjustmentReason,
      grandTotal,
      balanceAmount: grandTotal,
      items,
      discounts: discountRows.map(studentDiscountFromRow),
      possibleDuplicates,
    };
  }

  function refreshFeeInvoiceStatusInternal(invoiceId) {
    const id = requiredText(invoiceId, "Invoice id");
    const invoice = db.prepare("SELECT * FROM fee_invoices WHERE id = ?").get(id);
    if (!invoice) {
      throw new Error("Fee invoice was not found.");
    }
    if (invoice.status === "Cancelled") {
      return getFeeInvoiceByIdInternal(id);
    }

    const paidAmount = Number(
      db
        .prepare(`
          SELECT COALESCE(SUM(fee_invoice_allocations.allocated_amount), 0) AS amount
          FROM fee_invoice_allocations
          JOIN fee_payments
            ON fee_payments.id = fee_invoice_allocations.fee_payment_id
          WHERE fee_invoice_allocations.invoice_id = ?
            AND fee_invoice_allocations.reversed_at IS NULL
            AND COALESCE(fee_payments.status, 'Active') <> 'Reversed'
        `)
        .get(id)?.amount ?? 0,
    );
    const balanceAmount = Math.max(Number(invoice.grand_total ?? 0) - paidAmount, 0);
    const today = now().slice(0, 10);
    const status =
      balanceAmount === 0
        ? "Paid"
        : paidAmount > 0
          ? "Partially Paid"
          : invoice.due_date && invoice.due_date < today
            ? "Overdue"
            : "Unpaid";

    db.prepare(`
      UPDATE fee_invoices
      SET paid_amount = ?,
          balance_amount = ?,
          status = ?,
          updated_at = ?,
          sync_status = 'pending'
      WHERE id = ?
    `).run(paidAmount, balanceAmount, status, now(), id);
    return getFeeInvoiceByIdInternal(id);
  }

  function applyFeeInvoiceAllocations(payment, requestedAllocations, auditUser) {
    const allocations = Array.isArray(requestedAllocations)
      ? requestedAllocations
      : [];
    const byInvoice = new Map();
    for (const allocation of allocations) {
      const invoiceId = optionalText(allocation?.invoiceId);
      const allocatedAmount = wholeNumber(
        allocation?.allocatedAmount ?? allocation?.amount ?? 0,
        "Allocated amount",
        0,
      );
      if (!invoiceId || allocatedAmount === 0) continue;
      byInvoice.set(invoiceId, (byInvoice.get(invoiceId) ?? 0) + allocatedAmount);
    }

    if (byInvoice.size === 0) return [];

    if (normalizeFeePaymentStatus(payment.status) === "Reversed") {
      throw new Error("A reversed payment cannot be allocated.");
    }

    const existingAllocated = Number(
      db
        .prepare(`
          SELECT COALESCE(SUM(allocated_amount), 0) AS amount
          FROM fee_invoice_allocations
          WHERE fee_payment_id = ?
            AND reversed_at IS NULL
        `)
        .get(payment.id)?.amount ?? 0,
    );
    const requestedTotal = [...byInvoice.values()].reduce(
      (total, allocatedAmount) => total + allocatedAmount,
      0,
    );
    if (requestedTotal > Number(payment.amount ?? 0) - existingAllocated) {
      throw new Error("Invoice allocations exceed the unallocated payment amount.");
    }

    const timestamp = now();
    const createdAllocations = [];
    for (const [invoiceId, allocatedAmount] of byInvoice.entries()) {
      const invoice = refreshFeeInvoiceStatusInternal(invoiceId);
      if (!invoice) {
        throw new Error("Fee invoice was not found.");
      }
      if (invoice.status === "Cancelled") {
        throw new Error(`Cancelled invoice ${invoice.invoiceNo} cannot accept payment.`);
      }
      if (invoice.studentId !== payment.student_id) {
        throw new Error("Payment and invoice must belong to the same student.");
      }
      if (allocatedAmount > invoice.balanceAmount) {
        throw new Error(
          `Allocation exceeds outstanding balance for invoice ${invoice.invoiceNo}.`,
        );
      }

      const id = crypto.randomUUID();
      db.prepare(`
        INSERT INTO fee_invoice_allocations (
          id, invoice_id, fee_payment_id, receipt_no, allocated_amount,
          created_at, reversed_at, reversal_id, sync_status
        ) VALUES (
          @id, @invoiceId, @feePaymentId, @receiptNo, @allocatedAmount,
          @createdAt, NULL, NULL, 'pending'
        )
      `).run({
        id,
        invoiceId,
        feePaymentId: payment.id,
        receiptNo: payment.receipt_no,
        allocatedAmount,
        createdAt: timestamp,
      });
      createdAllocations.push(
        feeInvoiceAllocationFromRow(
          db
            .prepare("SELECT * FROM fee_invoice_allocations WHERE id = ?")
            .get(id),
        ),
      );
      refreshFeeInvoiceStatusInternal(invoiceId);
    }

    insertAuditLog(
      auditUser,
      "Payment allocated",
      "Fees",
      `Allocated ${payment.receipt_no} to ${createdAllocations.length} invoice(s).`,
    );
    return createdAllocations;
  }

  function buildFeeReceiptPrintData(paymentId) {
    const id = requiredText(paymentId, "Fee payment id");
    const paymentRow = db
      .prepare(`${paymentSelect} WHERE fee_payments.id = ?`)
      .get(id);
    if (!paymentRow) {
      throw new Error("Fee receipt was not found.");
    }
    const payment = paymentFromRow(paymentRow);
    const settings = settingsFromRow(
      db.prepare("SELECT * FROM school_settings WHERE id = ?").get(DEFAULT_SETTINGS_ID),
    );
    const templateSettings = getDocumentTemplateSettingsOrDefault("Fee Receipt");
    const student = payment.studentId
      ? (() => {
          const studentRow = getStudentStatement.get(payment.studentId);
          return studentRow ? studentFromRow(studentRow) : null;
        })()
      : null;
    const allocations = db
      .prepare(`
        SELECT
          allocations.*,
          invoices.invoice_no,
          invoices.billing_period,
          invoices.grand_total,
          invoices.balance_amount,
          invoices.previous_due,
          invoices.late_fee,
          invoices.discount_amount,
          invoices.status AS invoice_status
        FROM fee_invoice_allocations AS allocations
        JOIN fee_invoices AS invoices
          ON invoices.id = allocations.invoice_id
        WHERE allocations.fee_payment_id = ?
          AND allocations.reversed_at IS NULL
        ORDER BY allocations.created_at
      `)
      .all(id);

    const rows = [];
    let serial = 1;
    for (const allocation of allocations) {
      const invoice = refreshFeeInvoiceStatusInternal(allocation.invoice_id);
      const items = getFeeInvoiceItems(allocation.invoice_id);
      let remainingAllocation = Number(allocation.allocated_amount ?? 0);
      for (const item of items) {
        if (remainingAllocation <= 0) break;
        const amount = Math.min(Number(item.netAmount ?? 0), remainingAllocation);
        if (amount > 0) {
          rows.push({
            serialNo: serial,
            particulars: item.feeHeadName,
            period: invoice?.billingPeriod || allocation.billing_period || "",
            invoiceNo: invoice?.invoiceNo || allocation.invoice_no || "",
            amount,
          });
          serial += 1;
          remainingAllocation -= amount;
        }
      }
      const extraLines = [
        {
          particulars: "Previous Balance",
          amount: Math.max(Number(allocation.previous_due ?? 0), 0),
        },
        {
          particulars: "Late Fee",
          amount: Math.max(Number(allocation.late_fee ?? 0), 0),
        },
      ];
      for (const line of extraLines) {
        if (remainingAllocation <= 0 || line.amount <= 0) continue;
        const amount = Math.min(line.amount, remainingAllocation);
        rows.push({
          serialNo: serial,
          particulars: line.particulars,
          period: invoice?.billingPeriod || allocation.billing_period || "",
          invoiceNo: invoice?.invoiceNo || allocation.invoice_no || "",
          amount,
        });
        serial += 1;
        remainingAllocation -= amount;
      }
      if (remainingAllocation > 0) {
        rows.push({
          serialNo: serial,
          particulars: `Invoice ${invoice?.invoiceNo || allocation.invoice_no}`,
          period: invoice?.billingPeriod || allocation.billing_period || "",
          invoiceNo: invoice?.invoiceNo || allocation.invoice_no || "",
          amount: remainingAllocation,
        });
        serial += 1;
      }
    }

    if (rows.length === 0) {
      rows.push({
        serialNo: 1,
        particulars: payment.feeType || "Fee Payment",
        period: payment.paymentDate ? payment.paymentDate.slice(0, 7) : "",
        invoiceNo: "",
        amount: Number(payment.amount ?? 0),
      });
    }

    const activeInvoiceRows = payment.studentId
      ? db
          .prepare(`
            SELECT id
            FROM fee_invoices
            WHERE student_id = ?
              AND status <> 'Cancelled'
          `)
          .all(payment.studentId)
      : [];
    const outstandingInvoices = activeInvoiceRows.map((row) =>
      refreshFeeInvoiceStatusInternal(row.id),
    );
    const remainingBalance = outstandingInvoices.reduce(
      (total, invoice) => total + Number(invoice?.balanceAmount ?? 0),
      0,
    );
    const grossAmount = rows.reduce((total, row) => total + Number(row.amount ?? 0), 0);
    const discountAmount = allocations.reduce(
      (total, allocation) => total + Math.max(Number(allocation.discount_amount ?? 0), 0),
      0,
    );
    const lateFee = allocations.reduce(
      (total, allocation) => total + Math.max(Number(allocation.late_fee ?? 0), 0),
      0,
    );
    const previousBalance = allocations.reduce(
      (total, allocation) => total + Math.max(Number(allocation.previous_due ?? 0), 0),
      0,
    );

    return {
      payment,
      student,
      schoolSettings: settings,
      templateSettings,
      rows,
      allocations: allocations.map((allocation) => ({
        id: allocation.id,
        invoiceId: allocation.invoice_id,
        invoiceNo: allocation.invoice_no ?? "",
        billingPeriod: allocation.billing_period ?? "",
        allocatedAmount: Number(allocation.allocated_amount ?? 0),
        invoiceStatus: allocation.invoice_status ?? "",
        createdAt: allocation.created_at,
      })),
      totals: {
        grossAmount,
        discountAmount,
        lateFee,
        previousBalance,
        amountPaid: Number(payment.amount ?? 0),
        totalPaid: Number(payment.amount ?? 0),
        remainingBalance,
      },
      amountInWords: amountToWords(payment.amount),
      isReversed: payment.status === "Reversed",
      reversedLabel:
        payment.status === "Reversed" ? "REVERSED / CANCELLED" : "",
    };
  }

  function reverseFeePaymentInternal(paymentId, reason, actorName, auditUser) {
    const id = requiredText(paymentId, "Fee payment id");
    const reversalReason = requiredText(reason, "Reversal reason");
    const payment = db
      .prepare("SELECT * FROM fee_payments WHERE id = ?")
      .get(id);
    if (!payment) {
      throw new Error("Fee payment was not found.");
    }
    if (normalizeFeePaymentStatus(payment.status) === "Reversed") {
      throw new Error("This payment is already reversed.");
    }

    const timestamp = now();
    const reversalId = crypto.randomUUID();
    const activeAllocations = db
      .prepare(`
        SELECT DISTINCT invoice_id
        FROM fee_invoice_allocations
        WHERE fee_payment_id = ?
          AND reversed_at IS NULL
      `)
      .all(id);

    db.prepare(`
      INSERT INTO fee_payment_reversals (
        id, fee_payment_id, receipt_no, amount, reason, reversed_by,
        created_at, sync_status
      ) VALUES (
        @id, @feePaymentId, @receiptNo, @amount, @reason, @reversedBy,
        @createdAt, 'pending'
      )
    `).run({
      id: reversalId,
      feePaymentId: payment.id,
      receiptNo: payment.receipt_no,
      amount: Number(payment.amount ?? 0),
      reason: reversalReason,
      reversedBy: optionalText(actorName),
      createdAt: timestamp,
    });

    db.prepare(`
      UPDATE fee_payments
      SET status = 'Reversed',
          reversed_at = ?,
          reversed_by = ?,
          reversal_reason = ?,
          updated_at = ?,
          sync_status = 'pending'
      WHERE id = ?
    `).run(timestamp, optionalText(actorName), reversalReason, timestamp, id);

    db.prepare(`
      UPDATE fee_invoice_allocations
      SET reversed_at = ?,
          reversal_id = ?,
          sync_status = 'pending'
      WHERE fee_payment_id = ?
        AND reversed_at IS NULL
    `).run(timestamp, reversalId, id);

    db.prepare(`
      UPDATE account_transactions
      SET deleted_at = ?,
          notes = CASE
            WHEN COALESCE(notes, '') = ''
              THEN ?
            ELSE notes || char(10) || ?
          END,
          updated_at = ?,
          sync_status = 'pending'
      WHERE linked_module = 'Fees'
        AND linked_record_id = ?
        AND deleted_at IS NULL
    `).run(
      timestamp,
      `Reversed: ${reversalReason}`,
      `Reversed: ${reversalReason}`,
      timestamp,
      id,
    );

    const affectedInvoices = activeAllocations.map((allocation) =>
      refreshFeeInvoiceStatusInternal(allocation.invoice_id),
    );
    insertAuditLog(
      auditUser,
      "Payment reversed",
      "Fees",
      `Reversed receipt ${payment.receipt_no}. Reason: ${reversalReason}.`,
    );

    return {
      payment: paymentFromRow(
        db
          .prepare(`${paymentSelect} WHERE fee_payments.id = ?`)
          .get(id),
      ),
      reversal: feePaymentReversalFromRow(
        db
          .prepare("SELECT * FROM fee_payment_reversals WHERE id = ?")
          .get(reversalId),
      ),
      affectedInvoices,
    };
  }

  function queryFeeInvoiceRows(filter = {}) {
    db.prepare(`
      UPDATE fee_invoices
      SET status = 'Overdue',
          updated_at = ?,
          sync_status = 'pending'
      WHERE status = 'Unpaid'
        AND COALESCE(due_date, '') <> ''
        AND date(due_date) < date(?)
    `).run(now(), now().slice(0, 10));

    const clauses = [];
    const params = {};

    const academicSessionId = optionalText(filter?.academicSessionId);
    if (academicSessionId) {
      clauses.push("academic_session_id = @academicSessionId");
      params.academicSessionId = academicSessionId;
    }

    const className = optionalText(filter?.className);
    if (className && className !== "All") {
      clauses.push("class_name = @className");
      params.className = className;
    }

    const section = optionalText(filter?.section);
    if (section && section !== "All") {
      clauses.push("section = @section");
      params.section = section;
    }

    const studentId = optionalText(filter?.studentId);
    if (studentId) {
      clauses.push("student_id = @studentId");
      params.studentId = studentId;
    }

    const statusText = optionalText(filter?.status);
    if (statusText && statusText !== "All") {
      clauses.push("status = @status");
      params.status = normalizeInvoiceStatus(statusText);
    }

    const startDate = optionalText(filter?.startDate);
    if (startDate) {
      clauses.push("date(invoice_date) >= date(@startDate)");
      params.startDate = normalizeDate(startDate, "Start date");
    }

    const endDate = optionalText(filter?.endDate);
    if (endDate) {
      clauses.push("date(invoice_date) <= date(@endDate)");
      params.endDate = normalizeDate(endDate, "End date");
    }

    return db
      .prepare(`
        SELECT *
        FROM fee_invoices
        ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""}
        ORDER BY invoice_date DESC, created_at DESC
      `)
        .all(params);
  }

  function normalizeEmployeeAttendanceStatus(value) {
    const status = requiredText(value, "Employee attendance status");
    if (!EMPLOYEE_ATTENDANCE_STATUSES.has(status)) {
      throw new Error("Employee attendance status is invalid.");
    }
    return status;
  }

  function normalizeOptionalTimeValue(value, fieldName) {
    const text = optionalText(value);
    return text ? normalizeTime(text, fieldName) : "";
  }

  function normalizeEmployeeAttendanceFilter(filter = {}) {
    const month = optionalText(filter?.month);
    let startDate = optionalText(filter?.startDate);
    let endDate = optionalText(filter?.endDate);
    const date = optionalText(filter?.date);

    if (month) {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
        throw new Error("Attendance month must use YYYY-MM format.");
      }
      const [yearText, monthText] = month.split("-");
      const lastDay = new Date(Number(yearText), Number(monthText), 0).getDate();
      startDate = `${month}-01`;
      endDate = `${month}-${String(lastDay).padStart(2, "0")}`;
    }

    if (date) {
      startDate = date;
      endDate = date;
    }

    if (startDate) {
      startDate = normalizeDate(startDate, "Start date");
    }
    if (endDate) {
      endDate = normalizeDate(endDate, "End date");
    }
    if (startDate && endDate && startDate > endDate) {
      throw new Error("Start date must be before or equal to end date.");
    }

    const status = optionalText(filter?.status);
    return {
      date: date ? normalizeDate(date, "Attendance date") : "",
      startDate,
      endDate,
      month,
      employeeId: optionalText(filter?.employeeId),
      department: optionalText(filter?.department),
      designation: optionalText(filter?.designation),
      status:
        status && status !== "All"
          ? normalizeEmployeeAttendanceStatus(status)
          : "",
    };
  }

  function buildEmployeeAttendanceWhere(filter = {}) {
    const normalized = normalizeEmployeeAttendanceFilter(filter);
    const clauses = ["deleted_at IS NULL"];
    const params = {};

    if (normalized.startDate) {
      clauses.push("date(attendance_date) >= date(@startDate)");
      params.startDate = normalized.startDate;
    }
    if (normalized.endDate) {
      clauses.push("date(attendance_date) <= date(@endDate)");
      params.endDate = normalized.endDate;
    }
    if (normalized.employeeId) {
      clauses.push("employee_id = @employeeId");
      params.employeeId = normalized.employeeId;
    }
    if (normalized.department && normalized.department !== "All") {
      clauses.push("department = @department");
      params.department = normalized.department;
    }
    if (normalized.designation && normalized.designation !== "All") {
      clauses.push("designation = @designation");
      params.designation = normalized.designation;
    }
    if (normalized.status) {
      clauses.push("status = @status");
      params.status = normalized.status;
    }

    return {
      normalized,
      params,
      where: `WHERE ${clauses.join(" AND ")}`,
    };
  }

  function queryEmployeeAttendanceRows(filter = {}) {
    const { params, where } = buildEmployeeAttendanceWhere(filter);
    return db
      .prepare(`
        SELECT *
        FROM employee_attendance
        ${where}
        ORDER BY attendance_date DESC, employee_name COLLATE NOCASE
      `)
      .all(params)
      .map(employeeAttendanceFromRow);
  }

  function countActiveEmployeesForAttendance(filter = {}) {
    const normalized = normalizeEmployeeAttendanceFilter(filter);
    const clauses = ["deleted_at IS NULL", "status = 'Active'"];
    const params = {};
    if (normalized.employeeId) {
      clauses.push("id = @employeeId");
      params.employeeId = normalized.employeeId;
    }
    if (normalized.department && normalized.department !== "All") {
      clauses.push("department = @department");
      params.department = normalized.department;
    }
    if (normalized.designation && normalized.designation !== "All") {
      clauses.push("designation = @designation");
      params.designation = normalized.designation;
    }
    return Number(
      db
        .prepare(`
          SELECT COUNT(*) AS count
          FROM employees
          WHERE ${clauses.join(" AND ")}
        `)
        .get(params)?.count ?? 0,
    );
  }

  function summarizeEmployeeAttendanceRows(rows, filter = {}) {
    const present = rows.filter((row) => row.status === "Present").length;
    const absent = rows.filter((row) => row.status === "Absent").length;
    const leave = rows.filter((row) => row.status === "Leave").length;
    const halfDay = rows.filter((row) => row.status === "Half Day").length;
    const late = rows.filter((row) => row.status === "Late").length;
    const holiday = rows.filter((row) => row.status === "Holiday").length;
    const effectivePresent = present + late + halfDay * 0.5;
    const workingMarked = present + absent + leave + halfDay + late;
    return {
      totalEmployees: countActiveEmployeesForAttendance(filter),
      totalMarked: rows.length,
      present,
      absent,
      leave,
      halfDay,
      late,
      holiday,
      overtimeMinutes: rows.reduce(
        (total, row) => total + Number(row.overtimeMinutes ?? 0),
        0,
      ),
      attendancePercentage:
        workingMarked > 0
          ? Math.round((effectivePresent / workingMarked) * 10000) / 100
          : null,
    };
  }

  function getEmployeesForMonthlyAttendance(filter = {}) {
    const normalized = normalizeEmployeeAttendanceFilter(filter);
    const clauses = ["deleted_at IS NULL", "status = 'Active'"];
    const params = {};
    if (normalized.employeeId) {
      clauses.push("id = @employeeId");
      params.employeeId = normalized.employeeId;
    }
    if (normalized.department && normalized.department !== "All") {
      clauses.push("department = @department");
      params.department = normalized.department;
    }
    if (normalized.designation && normalized.designation !== "All") {
      clauses.push("designation = @designation");
      params.designation = normalized.designation;
    }
    return db
      .prepare(`
        SELECT *
        FROM employees
        WHERE ${clauses.join(" AND ")}
        ORDER BY department COLLATE NOCASE,
                 designation COLLATE NOCASE,
                 name COLLATE NOCASE
      `)
      .all(params)
      .map(employeeFromRow);
  }

  function buildEmployeeMonthlyAttendanceRows(filter = {}) {
    const normalized = normalizeEmployeeAttendanceFilter(filter);
    if (!normalized.month) {
      throw new Error("Attendance month is required.");
    }
    const employees = getEmployeesForMonthlyAttendance(filter);
    const rows = queryEmployeeAttendanceRows({
      ...filter,
      startDate: normalized.startDate,
      endDate: normalized.endDate,
      month: "",
    });
    const byEmployee = new Map();
    rows.forEach((row) => {
      byEmployee.set(row.employeeId, [...(byEmployee.get(row.employeeId) ?? []), row]);
    });

    return employees.map((employee) => {
      const records = byEmployee.get(employee.id) ?? [];
      const present = records.filter((row) => row.status === "Present").length;
      const absent = records.filter((row) => row.status === "Absent").length;
      const leave = records.filter((row) => row.status === "Leave").length;
      const halfDays = records.filter((row) => row.status === "Half Day").length;
      const lateDays = records.filter((row) => row.status === "Late").length;
      const holidays = records.filter((row) => row.status === "Holiday").length;
      const workingDays = present + absent + leave + halfDays + lateDays;
      const effectivePresent = present + lateDays + halfDays * 0.5;
      return {
        employeeId: employee.id,
        employeeCode: employee.employeeNo,
        employeeName: employee.name,
        department: employee.department,
        designation: employee.designation,
        month: normalized.month,
        workingDays,
        present,
        absent,
        leave,
        halfDays,
        lateDays,
        holidays,
        overtimeMinutes: records.reduce(
          (total, row) => total + Number(row.overtimeMinutes ?? 0),
          0,
        ),
        attendancePercentage:
          workingDays > 0
            ? Math.round((effectivePresent / workingDays) * 10000) / 100
            : null,
      };
    });
  }

  function normalizeGradingCalculationMode(value, fallback = "Percentage") {
    const mode = optionalText(value) || fallback;
    if (!GRADING_CALCULATION_MODES.has(mode)) {
      throw new Error("Grading calculation mode is invalid.");
    }
    return mode;
  }

  function normalizeGradingResultStatus(value, fallback = "Pass") {
    const status = optionalText(value) || fallback;
    if (!GRADING_RESULT_STATUSES.has(status)) {
      throw new Error("Grading range result status is invalid.");
    }
    return status;
  }

  function normalizeReportCardResultStatus(value, fallback = "Pending") {
    const status = optionalText(value) || fallback;
    if (!REPORT_CARD_RESULT_STATUSES.has(status)) {
      throw new Error("Report card result status is invalid.");
    }
    return status;
  }

  function normalizeReportCardTemplateType(value, fallback = "Standard") {
    const type = optionalText(value) || fallback;
    if (!REPORT_CARD_TEMPLATE_TYPES.has(type)) {
      throw new Error("Report card template type is invalid.");
    }
    return type;
  }

  function booleanFlag(value, fallback = true) {
    if (value === undefined || value === null || value === "") {
      return fallback ? 1 : 0;
    }
    return value === true || value === 1 || value === "1" ? 1 : 0;
  }

  function getGradingRangesForScheme(schemeId, includeDeleted = false) {
    return db
      .prepare(`
        SELECT *
        FROM grading_ranges
        WHERE grading_scheme_id = ?
          ${includeDeleted ? "" : "AND deleted_at IS NULL"}
        ORDER BY display_order, min_value DESC
      `)
      .all(requiredText(schemeId, "Grading scheme id"))
      .map(gradingRangeFromRow);
  }

  function getGradingSchemeByIdInternal(id, includeDeleted = false) {
    const row = db
      .prepare(`
        SELECT *
        FROM grading_schemes
        WHERE id = ?
          ${includeDeleted ? "" : "AND deleted_at IS NULL"}
      `)
      .get(requiredText(id, "Grading scheme id"));
    return row
      ? gradingSchemeFromRow(row, getGradingRangesForScheme(row.id))
      : null;
  }

  function validateGradingRanges(ranges, calculationMode) {
    if (!Array.isArray(ranges) || ranges.length === 0) {
      throw new Error("At least one grading range is required.");
    }
    const normalized = ranges.map((range, index) => {
      const minValue = decimalNumber(range?.minValue, "Minimum value", 0);
      const maxValue = decimalNumber(range?.maxValue, "Maximum value", 0);
      if (minValue > maxValue) {
        throw new Error("Grading range minimum cannot exceed maximum.");
      }
      if (calculationMode === "Percentage" && (minValue > 100 || maxValue > 100)) {
        throw new Error("Percentage grading ranges must stay within 0 to 100.");
      }
      return {
        id: optionalText(range?.id),
        minValue,
        maxValue,
        grade: requiredText(range?.grade, "Grade"),
        gradePoint:
          range?.gradePoint === undefined ||
          range?.gradePoint === null ||
          range?.gradePoint === ""
            ? null
            : decimalNumber(range.gradePoint, "Grade point", 0),
        resultStatus: normalizeGradingResultStatus(range?.resultStatus),
        description: optionalText(range?.description),
        displayOrder:
          range?.displayOrder === undefined
            ? index
            : displayOrder(range.displayOrder, index),
      };
    });
    const sorted = [...normalized].sort((left, right) =>
      left.minValue === right.minValue
        ? left.maxValue - right.maxValue
        : left.minValue - right.minValue,
    );
    for (let index = 1; index < sorted.length; index += 1) {
      if (sorted[index].minValue <= sorted[index - 1].maxValue) {
        throw new Error("Grading ranges cannot overlap.");
      }
    }
    return normalized;
  }

  function resolveSchemeSession(input = {}, existing = null) {
    const sessionId =
      input.academicSessionId === undefined
        ? existing?.academic_session_id ?? ""
        : optionalText(input.academicSessionId);
    if (!sessionId) {
      return { id: "", name: "" };
    }
    const session = getAcademicSessionRow(sessionId);
    if (!session) {
      throw new Error("Academic session was not found.");
    }
    return {
      id: session.id,
      name: session.session_name,
    };
  }

  function unsetOtherDefaultGradingSchemes(scheme) {
    db.prepare(`
      UPDATE grading_schemes
      SET is_default = 0,
          updated_at = @updatedAt,
          sync_status = 'pending'
      WHERE id <> @id
        AND deleted_at IS NULL
        AND COALESCE(academic_session_id, '') = @academicSessionId
        AND COALESCE(class_name, '') = @className
    `).run({
      id: scheme.id,
      academicSessionId: scheme.academicSessionId ?? "",
      className: scheme.className ?? "",
      updatedAt: now(),
    });
  }

  function insertOrReplaceGradingRanges(schemeId, ranges, timestamp) {
    db.prepare(`
      UPDATE grading_ranges
      SET deleted_at = @deletedAt,
          updated_at = @updatedAt,
          sync_status = 'pending'
      WHERE grading_scheme_id = @schemeId
        AND deleted_at IS NULL
    `).run({ schemeId, deletedAt: timestamp, updatedAt: timestamp });
    ranges.forEach((range, index) => {
      db.prepare(`
        INSERT INTO grading_ranges (
          id, grading_scheme_id, min_value, max_value, grade, grade_point,
          result_status, description, display_order, created_at, updated_at,
          deleted_at, sync_status
        ) VALUES (
          @id, @schemeId, @minValue, @maxValue, @grade, @gradePoint,
          @resultStatus, @description, @displayOrder, @createdAt, @updatedAt,
          NULL, 'pending'
        )
      `).run({
        id: crypto.randomUUID(),
        schemeId,
        minValue: range.minValue,
        maxValue: range.maxValue,
        grade: range.grade,
        gradePoint: range.gradePoint,
        resultStatus: range.resultStatus,
        description: range.description,
        displayOrder: range.displayOrder ?? index,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    });
  }

  function resolveApplicableGradingScheme(input = {}) {
    const explicitId = optionalText(input?.gradingSchemeId);
    if (explicitId) {
      const scheme = getGradingSchemeByIdInternal(explicitId);
      if (!scheme || scheme.status !== "Active") {
        throw new Error("Select an active grading scheme.");
      }
      return scheme;
    }
    const academicSessionId = optionalText(input?.academicSessionId);
    const className = optionalText(input?.className);
    const row = db
      .prepare(`
        SELECT *,
          CASE
            WHEN COALESCE(academic_session_id, '') = @academicSessionId
             AND COALESCE(class_name, '') = @className THEN 4
            WHEN COALESCE(academic_session_id, '') = @academicSessionId
             AND COALESCE(class_name, '') = '' THEN 3
            WHEN COALESCE(academic_session_id, '') = ''
             AND COALESCE(class_name, '') = @className THEN 2
            WHEN COALESCE(academic_session_id, '') = ''
             AND COALESCE(class_name, '') = '' THEN 1
            ELSE 0
          END AS scope_score
        FROM grading_schemes
        WHERE deleted_at IS NULL
          AND status = 'Active'
          AND is_default = 1
          AND (
            COALESCE(academic_session_id, '') IN ('', @academicSessionId)
          )
          AND (
            COALESCE(class_name, '') IN ('', @className)
          )
        ORDER BY scope_score DESC, updated_at DESC
        LIMIT 1
      `)
      .get({ academicSessionId, className });
    if (row) return gradingSchemeFromRow(row, getGradingRangesForScheme(row.id));
    const fallback = db
      .prepare(`
        SELECT *
        FROM grading_schemes
        WHERE deleted_at IS NULL
          AND status = 'Active'
        ORDER BY is_default DESC, updated_at DESC
        LIMIT 1
      `)
      .get();
    if (!fallback) {
      throw new Error("Create an active grading scheme first.");
    }
    return gradingSchemeFromRow(
      fallback,
      getGradingRangesForScheme(fallback.id),
    );
  }

  function calculateGradeFromScheme(scheme, value) {
    const normalizedValue = decimalNumber(value, "Grade value", 0);
    const range = [...scheme.ranges]
      .sort((left, right) => right.minValue - left.minValue)
      .find(
        (item) =>
          normalizedValue >= item.minValue &&
          normalizedValue <= item.maxValue,
      );
    return {
      value: normalizedValue,
      grade: range?.grade ?? "",
      gradePoint: range?.gradePoint ?? null,
      resultStatus: range?.resultStatus ?? "Fail",
      range: range ?? null,
    };
  }

  function generateReportCardSubjects({ exam, marks, scheme }) {
    const activeSubjects = db
      .prepare(`
        SELECT *
        FROM subjects
        WHERE class_name = ?
          AND status = 'Active'
          AND deleted_at IS NULL
        ORDER BY name COLLATE NOCASE
      `)
      .all(exam.class_name)
      .map(subjectFromRow);
    const subjectMap = new Map(activeSubjects.map((subject) => [subject.id, subject]));
    marks.forEach((mark) => {
      if (!subjectMap.has(mark.subjectId)) {
        subjectMap.set(mark.subjectId, {
          id: mark.subjectId,
          name: mark.subjectName,
          code: "",
          className: mark.className,
          maxMarks: mark.maxMarks,
          passingMarks: mark.passingMarks,
          status: "Active",
          createdAt: mark.createdAt,
          updatedAt: mark.updatedAt,
          deletedAt: null,
          syncStatus: "pending",
        });
      }
    });
    const marksBySubject = new Map(marks.map((mark) => [mark.subjectId, mark]));
    return [...subjectMap.values()].map((subject, index) => {
      const mark = marksBySubject.get(subject.id);
      const maxMarks = Number(mark?.maxMarks ?? subject.maxMarks ?? 0);
      const passingMarks = Number(mark?.passingMarks ?? subject.passingMarks ?? 0);
      const obtainedMarks = Number(mark?.obtainedMarks ?? 0);
      const percentage =
        maxMarks > 0 ? Math.round((obtainedMarks / maxMarks) * 10000) / 100 : 0;
      const isAbsent = /absent/i.test(mark?.remarks ?? "");
      const resultStatus = !mark
        ? "Pending"
        : isAbsent
          ? "Absent"
          : obtainedMarks >= passingMarks
            ? "Pass"
            : "Fail";
      const gradeBase =
        scheme.calculationMode === "Marks" ? obtainedMarks : percentage;
      const gradeResult =
        resultStatus === "Pending" || resultStatus === "Absent"
          ? { grade: "", gradePoint: null }
          : calculateGradeFromScheme(scheme, gradeBase);
      return {
        id: mark?.id ?? "",
        reportCardId: "",
        subjectId: subject.id,
        subjectName: subject.name,
        maxMarks,
        passingMarks,
        obtainedMarks,
        percentage,
        grade: gradeResult.grade,
        gradePoint: gradeResult.gradePoint,
        resultStatus,
        remarks: mark?.remarks ?? (!mark ? "Marks not entered" : ""),
        displayOrder: index,
        createdAt: mark?.createdAt ?? "",
        updatedAt: mark?.updatedAt ?? "",
        syncStatus: "pending",
      };
    });
  }

  function getStudentAttendanceSnapshot(studentId, session, exam) {
    const examDate = normalizeDate(exam.exam_date, "Exam date");
    const startDate = session?.start_date
      ? normalizeDate(session.start_date, "Session start date")
      : `${examDate.slice(0, 4)}-01-01`;
    const endDate = session?.end_date
      ? normalizeDate(session.end_date, "Session end date")
      : examDate;
    const rows = db
      .prepare(`
        SELECT *
        FROM attendance
        WHERE student_id = ?
          AND attendance_date BETWEEN ? AND ?
      `)
      .all(studentId, startDate, endDate)
      .map(attendanceFromRow);
    const workingDays = rows.length;
    const presentDays = rows.filter((row) => row.status === "Present").length;
    return {
      startDate,
      endDate,
      workingDays,
      presentDays,
      percentage:
        workingDays > 0
          ? Math.round((presentDays / workingDays) * 10000) / 100
          : 0,
      rows,
    };
  }

  function getReportCardTemplateByIdInternal(id) {
    const row = db
      .prepare(`
        SELECT *
        FROM report_card_templates
        WHERE id = ?
          AND deleted_at IS NULL
      `)
      .get(requiredText(id, "Report card template id"));
    return row ? reportCardTemplateFromRow(row) : null;
  }

  function resolveReportCardTemplate(input = {}) {
    const explicitId = optionalText(input?.templateId);
    if (explicitId) {
      const template = getReportCardTemplateByIdInternal(explicitId);
      if (!template || template.status !== "Active") {
        throw new Error("Select an active report card template.");
      }
      return template;
    }
    const academicSessionId = optionalText(input?.academicSessionId);
    const className = optionalText(input?.className);
    const row = db
      .prepare(`
        SELECT *,
          CASE
            WHEN COALESCE(academic_session_id, '') = @academicSessionId
             AND COALESCE(class_name, '') = @className THEN 4
            WHEN COALESCE(academic_session_id, '') = @academicSessionId
             AND COALESCE(class_name, '') = '' THEN 3
            WHEN COALESCE(academic_session_id, '') = ''
             AND COALESCE(class_name, '') = @className THEN 2
            WHEN COALESCE(academic_session_id, '') = ''
             AND COALESCE(class_name, '') = '' THEN 1
            ELSE 0
          END AS scope_score
        FROM report_card_templates
        WHERE deleted_at IS NULL
          AND status = 'Active'
          AND COALESCE(academic_session_id, '') IN ('', @academicSessionId)
          AND COALESCE(class_name, '') IN ('', @className)
        ORDER BY scope_score DESC, updated_at DESC
        LIMIT 1
      `)
      .get({ academicSessionId, className });
    if (!row) {
      throw new Error("Create an active report card template first.");
    }
    return reportCardTemplateFromRow(row);
  }

  function getReportCardSkillSnapshots(student, session, template) {
    if (!template.showBehaviour && !template.showSkills) {
      return { behaviourRatings: [], affectiveSkills: [], psychomotorSkills: [] };
    }
    const dateFilter = session
      ? {
          startDate: session.start_date ?? "",
          endDate: session.end_date ?? "",
        }
      : {};
    return {
      behaviourRatings: template.showBehaviour
        ? db
            .prepare(`
              SELECT *
              FROM student_behaviour_ratings
              WHERE student_id = @studentId
                AND deleted_at IS NULL
                AND (@startDate = '' OR rating_date >= @startDate)
                AND (@endDate = '' OR rating_date <= @endDate)
              ORDER BY rating_date DESC, trait_name COLLATE NOCASE
            `)
            .all({
              studentId: student.id,
              startDate: dateFilter.startDate ?? "",
              endDate: dateFilter.endDate ?? "",
            })
            .map(behaviourRatingFromRow)
        : [],
      affectiveSkills: template.showSkills
        ? db
            .prepare(`
              SELECT *
              FROM student_skill_ratings
              WHERE student_id = @studentId
                AND domain = 'Affective'
                AND deleted_at IS NULL
                AND (@startDate = '' OR rating_date >= @startDate)
                AND (@endDate = '' OR rating_date <= @endDate)
              ORDER BY rating_date DESC, skill_name COLLATE NOCASE
            `)
            .all({
              studentId: student.id,
              startDate: dateFilter.startDate ?? "",
              endDate: dateFilter.endDate ?? "",
            })
            .map(skillRatingFromRow)
        : [],
      psychomotorSkills: template.showSkills
        ? db
            .prepare(`
              SELECT *
              FROM student_skill_ratings
              WHERE student_id = @studentId
                AND domain = 'Psychomotor'
                AND deleted_at IS NULL
                AND (@startDate = '' OR rating_date >= @startDate)
                AND (@endDate = '' OR rating_date <= @endDate)
              ORDER BY rating_date DESC, skill_name COLLATE NOCASE
            `)
            .all({
              studentId: student.id,
              startDate: dateFilter.startDate ?? "",
              endDate: dateFilter.endDate ?? "",
            })
            .map(skillRatingFromRow)
        : [],
    };
  }

  function getReportCardClassTests(student, template) {
    if (!template.showClassTests) return [];
    return db
      .prepare(`
        SELECT
          class_tests.test_name,
          class_tests.subject_name,
          class_tests.test_date,
          class_tests.max_marks,
          class_tests.passing_marks,
          class_test_marks.marks_obtained,
          class_test_marks.result_status,
          class_test_marks.remarks
        FROM class_test_marks
        JOIN class_tests ON class_tests.id = class_test_marks.test_id
        WHERE class_test_marks.student_id = ?
          AND class_tests.deleted_at IS NULL
        ORDER BY class_tests.test_date DESC, class_tests.test_name COLLATE NOCASE
      `)
      .all(student.id)
      .map((row) => ({
        testName: row.test_name,
        subjectName: row.subject_name ?? "",
        testDate: row.test_date,
        maxMarks: Number(row.max_marks ?? 0),
        passingMarks: Number(row.passing_marks ?? 0),
        obtainedMarks: Number(row.marks_obtained ?? 0),
        resultStatus: row.result_status,
        remarks: row.remarks ?? "",
      }));
  }

  function buildReportCardPreview(input = {}) {
    const examId = requiredText(input?.examId, "Exam");
    const studentId = requiredText(input?.studentId, "Student");
    const exam = getActiveExamById.get(examId);
    if (!exam) throw new Error("Exam was not found.");
    const student = getStudentStatement.get(studentId);
    if (!student) throw new Error("Student record was not found.");
    if (student.class_name !== exam.class_name) {
      throw new Error("Student and exam must belong to the same class.");
    }
    if (exam.section && student.section !== exam.section) {
      throw new Error("Student does not belong to the selected exam section.");
    }
    const sessionId = optionalText(input?.academicSessionId);
    const session = sessionId
      ? getAcademicSessionRow(sessionId)
      : getCurrentAcademicSessionRow();
    if (sessionId && !session) {
      throw new Error("Academic session was not found.");
    }
    const className = optionalText(input?.className) || exam.class_name;
    const scheme = resolveApplicableGradingScheme({
      gradingSchemeId: input?.gradingSchemeId,
      academicSessionId: session?.id ?? "",
      className,
    });
    const template = resolveReportCardTemplate({
      templateId: input?.templateId,
      academicSessionId: session?.id ?? "",
      className,
    });
    const marks = db
      .prepare(`
        SELECT *
        FROM marks
        WHERE exam_id = ?
          AND student_id = ?
        ORDER BY subject_name COLLATE NOCASE
      `)
      .all(exam.id, student.id)
      .map(markFromRow);
    const subjects = generateReportCardSubjects({ exam, marks, scheme });
    const totalMaxMarks =
      Math.round(subjects.reduce((total, item) => total + item.maxMarks, 0) * 100) /
      100;
    const totalObtainedMarks =
      Math.round(subjects.reduce((total, item) => total + item.obtainedMarks, 0) * 100) /
      100;
    const percentage =
      totalMaxMarks > 0
        ? Math.round((totalObtainedMarks / totalMaxMarks) * 10000) / 100
        : 0;
    const anyPending = subjects.some((item) =>
      ["Pending", "Absent"].includes(item.resultStatus),
    );
    const anyFail = subjects.some((item) => item.resultStatus === "Fail");
    const resultStatus = anyPending ? "Pending" : anyFail ? "Fail" : "Pass";
    const overallGradeResult =
      resultStatus === "Pending"
        ? { grade: "", gradePoint: null }
        : calculateGradeFromScheme(
            scheme,
            scheme.calculationMode === "Marks" ? totalObtainedMarks : percentage,
          );
    const attendance = getStudentAttendanceSnapshot(student.id, session, exam);
    const sessionHistory = session
      ? db
          .prepare(`
            SELECT *
            FROM student_session_history
            WHERE student_id = ?
              AND academic_session_id = ?
          `)
          .get(student.id, session.id)
      : null;
    const snapshots = getReportCardSkillSnapshots(
      studentFromRow(student),
      session,
      template,
    );
    return {
      student: {
        id: student.id,
        admissionNo: student.admission_no ?? "",
        name: student.name,
        className: student.class_name ?? "",
        section: student.section ?? "",
        guardianName: student.guardian_name ?? "",
        rollNo: sessionHistory?.roll_no ?? "",
      },
      exam: examFromRow(exam),
      academicSession: session ? academicSessionFromRow(session) : null,
      gradingScheme: scheme,
      template,
      subjects,
      totalMaxMarks,
      totalObtainedMarks,
      percentage,
      overallGrade: overallGradeResult.grade,
      overallGradePoint: overallGradeResult.gradePoint,
      resultStatus,
      attendance: {
        workingDays: attendance.workingDays,
        presentDays: attendance.presentDays,
        percentage: attendance.percentage,
        startDate: attendance.startDate,
        endDate: attendance.endDate,
      },
      behaviourRatings: snapshots.behaviourRatings,
      affectiveSkills: snapshots.affectiveSkills,
      psychomotorSkills: snapshots.psychomotorSkills,
      classTests: getReportCardClassTests(studentFromRow(student), template),
      teacherRemarks: optionalText(input?.teacherRemarks),
      principalRemarks: optionalText(input?.principalRemarks),
      rankingMethod: "Dense ranking by percentage, then total marks.",
    };
  }

  function getReportCardSubjects(reportCardId) {
    return db
      .prepare(`
        SELECT *
        FROM student_report_card_subjects
        WHERE report_card_id = ?
        ORDER BY display_order, subject_name COLLATE NOCASE
      `)
      .all(requiredText(reportCardId, "Report card id"))
      .map(reportCardSubjectFromRow);
  }

  function getReportCardByIdInternal(id) {
    const row = db
      .prepare(`
        SELECT *
        FROM student_report_cards
        WHERE id = ?
          AND deleted_at IS NULL
      `)
      .get(requiredText(id, "Report card id"));
    return row ? reportCardFromRow(row, getReportCardSubjects(row.id)) : null;
  }

  function buildReportCardFilterWhere(filter = {}) {
    const clauses = ["deleted_at IS NULL"];
    const params = {};
    const academicSessionId = optionalText(filter?.academicSessionId);
    if (academicSessionId) {
      clauses.push("academic_session_id = @academicSessionId");
      params.academicSessionId = academicSessionId;
    }
    const className = optionalText(filter?.className);
    if (className) {
      clauses.push("class_name = @className");
      params.className = className;
    }
    const section = optionalText(filter?.section);
    if (section) {
      clauses.push("COALESCE(section, '') = @section");
      params.section = section;
    }
    const examId = optionalText(filter?.examId);
    if (examId) {
      clauses.push("exam_id = @examId");
      params.examId = examId;
    }
    const studentId = optionalText(filter?.studentId);
    if (studentId) {
      clauses.push("student_id = @studentId");
      params.studentId = studentId;
    }
    const resultStatus = optionalText(filter?.resultStatus);
    if (resultStatus && resultStatus !== "All") {
      clauses.push("result_status = @resultStatus");
      params.resultStatus = normalizeReportCardResultStatus(resultStatus);
    }
    return {
      where: `WHERE ${clauses.join(" AND ")}`,
      params,
    };
  }

  function queryReportCards(filter = {}) {
    const { where, params } = buildReportCardFilterWhere(filter);
    return db
      .prepare(`
        SELECT *
        FROM student_report_cards
        ${where}
        ORDER BY generated_at DESC, report_card_no DESC
      `)
      .all(params)
      .map((row) => reportCardFromRow(row));
  }

  function updateReportCardPositions(filter = {}) {
    const className = requiredText(filter?.className, "Class");
    const examId = requiredText(filter?.examId, "Exam");
    const academicSessionId = optionalText(filter?.academicSessionId);
    const cards = queryReportCards({
      academicSessionId,
      className,
      examId,
    }).filter((card) => card.resultStatus !== "Pending");
    const updatePosition = db.prepare(`
      UPDATE student_report_cards
      SET class_position = @classPosition,
          section_position = @sectionPosition,
          updated_at = @updatedAt,
          sync_status = 'pending'
      WHERE id = @id
    `);
    const denseRank = (rows) => {
      const sorted = [...rows].sort((left, right) => {
        if (right.percentage !== left.percentage) {
          return right.percentage - left.percentage;
        }
        if (right.totalObtainedMarks !== left.totalObtainedMarks) {
          return right.totalObtainedMarks - left.totalObtainedMarks;
        }
        return left.studentName.localeCompare(right.studentName);
      });
      let rank = 0;
      let previousKey = "";
      return new Map(
        sorted.map((card) => {
          const key = `${card.percentage}:${card.totalObtainedMarks}`;
          if (key !== previousKey) {
            rank += 1;
            previousKey = key;
          }
          return [card.id, rank];
        }),
      );
    };
    const classRanks = denseRank(cards);
    const sectionRanks = new Map();
    [...new Set(cards.map((card) => card.section ?? ""))].forEach((section) => {
      denseRank(cards.filter((card) => (card.section ?? "") === section)).forEach(
        (rank, id) => sectionRanks.set(id, rank),
      );
    });
    const timestamp = now();
    cards.forEach((card) => {
      updatePosition.run({
        id: card.id,
        classPosition: classRanks.get(card.id) ?? null,
        sectionPosition: sectionRanks.get(card.id) ?? null,
        updatedAt: timestamp,
      });
    });
  }

  function insertReportCardFromPreview(preview, input, actor) {
    const generatedDate = normalizeDate(
      input?.generatedDate ?? now().slice(0, 10),
      "Generated date",
    );
    const existing = db
      .prepare(`
        SELECT *
        FROM student_report_cards
        WHERE student_id = @studentId
          AND COALESCE(academic_session_id, '') = @academicSessionId
          AND COALESCE(exam_id, '') = @examId
          AND deleted_at IS NULL
      `)
      .get({
        studentId: preview.student.id,
        academicSessionId: preview.academicSession?.id ?? "",
        examId: preview.exam.id,
      });
    const regenerateId = optionalText(input?.regenerateReportCardId);
    if (existing && !input?.regenerate && existing.id !== regenerateId) {
      throw new Error(
        "A report card already exists for this student, session and exam. Regenerate it explicitly to replace the snapshot.",
      );
    }
    const timestamp = now();
    const id = regenerateId || existing?.id || crypto.randomUUID();
    const isRegenerate = Boolean(existing || regenerateId);
    const reportCardNo =
      existing?.report_card_no ?? generateReportCardNumber(generatedDate);
    if (isRegenerate) {
      db.prepare(`
        UPDATE student_report_cards
        SET admission_no = @admissionNo,
            student_name = @studentName,
            class_name = @className,
            section = @section,
            academic_session_id = @academicSessionId,
            academic_session_name = @academicSessionName,
            exam_id = @examId,
            exam_name = @examName,
            grading_scheme_id = @gradingSchemeId,
            grading_scheme_name = @gradingSchemeName,
            total_max_marks = @totalMaxMarks,
            total_obtained_marks = @totalObtainedMarks,
            percentage = @percentage,
            overall_grade = @overallGrade,
            result_status = @resultStatus,
            attendance_working_days = @attendanceWorkingDays,
            attendance_present_days = @attendancePresentDays,
            attendance_percentage = @attendancePercentage,
            teacher_remarks = @teacherRemarks,
            principal_remarks = @principalRemarks,
            generated_by = @generatedBy,
            generated_at = @generatedAt,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id AND deleted_at IS NULL
      `).run({
        id,
        admissionNo: preview.student.admissionNo,
        studentName: preview.student.name,
        className: preview.student.className,
        section: preview.student.section,
        academicSessionId: preview.academicSession?.id ?? "",
        academicSessionName: preview.academicSession?.sessionName ?? "",
        examId: preview.exam.id,
        examName: preview.exam.name,
        gradingSchemeId: preview.gradingScheme.id,
        gradingSchemeName: preview.gradingScheme.name,
        totalMaxMarks: preview.totalMaxMarks,
        totalObtainedMarks: preview.totalObtainedMarks,
        percentage: preview.percentage,
        overallGrade: preview.overallGrade,
        resultStatus: preview.resultStatus,
        attendanceWorkingDays: preview.attendance.workingDays,
        attendancePresentDays: preview.attendance.presentDays,
        attendancePercentage: preview.attendance.percentage,
        teacherRemarks: optionalText(input?.teacherRemarks),
        principalRemarks: optionalText(input?.principalRemarks),
        generatedBy: actor?.name ?? optionalText(input?.generatedBy),
        generatedAt: `${generatedDate}T00:00:00.000Z`,
        updatedAt: timestamp,
      });
      db.prepare("DELETE FROM student_report_card_subjects WHERE report_card_id = ?")
        .run(id);
    } else {
      db.prepare(`
        INSERT INTO student_report_cards (
          id, report_card_no, student_id, admission_no, student_name,
          class_name, section, academic_session_id, academic_session_name,
          exam_id, exam_name, grading_scheme_id, grading_scheme_name,
          total_max_marks, total_obtained_marks, percentage, overall_grade,
          result_status, attendance_working_days, attendance_present_days,
          attendance_percentage, teacher_remarks, principal_remarks,
          generated_by, generated_at, updated_at, deleted_at, sync_status
        ) VALUES (
          @id, @reportCardNo, @studentId, @admissionNo, @studentName,
          @className, @section, @academicSessionId, @academicSessionName,
          @examId, @examName, @gradingSchemeId, @gradingSchemeName,
          @totalMaxMarks, @totalObtainedMarks, @percentage, @overallGrade,
          @resultStatus, @attendanceWorkingDays, @attendancePresentDays,
          @attendancePercentage, @teacherRemarks, @principalRemarks,
          @generatedBy, @generatedAt, @updatedAt, NULL, 'pending'
        )
      `).run({
        id,
        reportCardNo,
        studentId: preview.student.id,
        admissionNo: preview.student.admissionNo,
        studentName: preview.student.name,
        className: preview.student.className,
        section: preview.student.section,
        academicSessionId: preview.academicSession?.id ?? "",
        academicSessionName: preview.academicSession?.sessionName ?? "",
        examId: preview.exam.id,
        examName: preview.exam.name,
        gradingSchemeId: preview.gradingScheme.id,
        gradingSchemeName: preview.gradingScheme.name,
        totalMaxMarks: preview.totalMaxMarks,
        totalObtainedMarks: preview.totalObtainedMarks,
        percentage: preview.percentage,
        overallGrade: preview.overallGrade,
        resultStatus: preview.resultStatus,
        attendanceWorkingDays: preview.attendance.workingDays,
        attendancePresentDays: preview.attendance.presentDays,
        attendancePercentage: preview.attendance.percentage,
        teacherRemarks: optionalText(input?.teacherRemarks),
        principalRemarks: optionalText(input?.principalRemarks),
        generatedBy: actor?.name ?? optionalText(input?.generatedBy),
        generatedAt: `${generatedDate}T00:00:00.000Z`,
        updatedAt: timestamp,
      });
    }
    preview.subjects.forEach((subject) => {
      db.prepare(`
        INSERT INTO student_report_card_subjects (
          id, report_card_id, subject_id, subject_name, max_marks,
          passing_marks, obtained_marks, percentage, grade, grade_point,
          result_status, remarks, display_order, created_at, updated_at,
          sync_status
        ) VALUES (
          @id, @reportCardId, @subjectId, @subjectName, @maxMarks,
          @passingMarks, @obtainedMarks, @percentage, @grade, @gradePoint,
          @resultStatus, @remarks, @displayOrder, @createdAt, @updatedAt,
          'pending'
        )
      `).run({
        id: crypto.randomUUID(),
        reportCardId: id,
        subjectId: subject.subjectId,
        subjectName: subject.subjectName,
        maxMarks: subject.maxMarks,
        passingMarks: subject.passingMarks,
        obtainedMarks: subject.obtainedMarks,
        percentage: subject.percentage,
        grade: subject.grade,
        gradePoint: subject.gradePoint,
        resultStatus: subject.resultStatus,
        remarks: subject.remarks,
        displayOrder: subject.displayOrder,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    });
    updateReportCardPositions({
      academicSessionId: preview.academicSession?.id ?? "",
      className: preview.student.className,
      examId: preview.exam.id,
    });
    return getReportCardByIdInternal(id);
  }

  function buildClassReportCardStudents(input = {}) {
    const exam = getActiveExamById.get(requiredText(input?.examId, "Exam"));
    if (!exam) throw new Error("Exam was not found.");
    const className = optionalText(input?.className) || exam.class_name;
    if (className !== exam.class_name) {
      throw new Error("Selected class must match the exam class.");
    }
    const section = optionalText(input?.section) || (exam.section ?? "");
    return db
      .prepare(`
        SELECT *
        FROM students
        WHERE status = 'Active'
          AND deleted_at IS NULL
          AND class_name = @className
          AND (@section = '' OR COALESCE(section, '') = @section)
        ORDER BY admission_no COLLATE NOCASE, name COLLATE NOCASE
      `)
      .all({ className, section })
      .map(studentFromRow);
  }

  function buildClassResultSummary(filter = {}) {
    const cards = queryReportCards(filter);
    const completeCards = cards.filter((card) => card.resultStatus !== "Pending");
    const passed = cards.filter((card) => card.resultStatus === "Pass").length;
    const failed = cards.filter((card) => card.resultStatus === "Fail").length;
    const percentages = completeCards.map((card) => card.percentage);
    const subjects = cards.flatMap((card) =>
      getReportCardSubjects(card.id).map((subject) => ({ ...subject, card })),
    );
    const subjectsByName = new Map();
    subjects.forEach((subject) => {
      subjectsByName.set(subject.subjectName, [
        ...(subjectsByName.get(subject.subjectName) ?? []),
        subject,
      ]);
    });
    const subjectSummaries = [...subjectsByName.entries()].map(([subjectName, rows]) => {
      const appeared = rows.filter((row) => row.resultStatus !== "Pending").length;
      const passedRows = rows.filter((row) => row.resultStatus === "Pass");
      const failedRows = rows.filter((row) =>
        ["Fail", "Absent"].includes(row.resultStatus),
      );
      const obtained = rows.map((row) => row.obtainedMarks);
      return {
        subjectName,
        appeared,
        passed: passedRows.length,
        failed: failedRows.length,
        highest: obtained.length ? Math.max(...obtained) : 0,
        lowest: obtained.length ? Math.min(...obtained) : 0,
        average:
          obtained.length > 0
            ? Math.round((obtained.reduce((total, value) => total + value, 0) / obtained.length) * 100) /
              100
            : 0,
        passPercentage:
          appeared > 0
            ? Math.round((passedRows.length / appeared) * 10000) / 100
            : 0,
      };
    });
    const ranked = [...completeCards].sort((left, right) => {
      if (right.percentage !== left.percentage) return right.percentage - left.percentage;
      if (right.totalObtainedMarks !== left.totalObtainedMarks) {
        return right.totalObtainedMarks - left.totalObtainedMarks;
      }
      return left.studentName.localeCompare(right.studentName);
    });
    let rank = 0;
    let previousKey = "";
    const rankings = ranked.map((card) => {
      const key = `${card.percentage}:${card.totalObtainedMarks}`;
      if (key !== previousKey) {
        rank += 1;
        previousKey = key;
      }
      return {
        position: rank,
        reportCardId: card.id,
        studentId: card.studentId,
        studentName: card.studentName,
        admissionNo: card.admissionNo,
        total: card.totalObtainedMarks,
        percentage: card.percentage,
        grade: card.overallGrade,
        resultStatus: card.resultStatus,
      };
    });
    return {
      summary: {
        totalStudents: cards.length,
        resultComplete: completeCards.length,
        passed,
        failed,
        absentOrIncomplete: cards.length - completeCards.length,
        passPercentage:
          completeCards.length > 0
            ? Math.round((passed / completeCards.length) * 10000) / 100
            : 0,
        highestPercentage: percentages.length ? Math.max(...percentages) : 0,
        lowestPercentage: percentages.length ? Math.min(...percentages) : 0,
        classAverage:
          percentages.length > 0
            ? Math.round((percentages.reduce((total, value) => total + value, 0) / percentages.length) * 100) /
              100
            : 0,
      },
      subjectSummaries,
      rankings,
      cards,
      rankingMethod: "Dense ranking by percentage, then total marks.",
    };
  }

  const EXAM_SCHEDULE_STATUSES = new Set([
    "Draft",
    "Published",
    "Completed",
    "Cancelled",
  ]);
  const LIVE_CLASS_STATUSES = new Set([
    "Draft",
    "Scheduled",
    "Live",
    "Completed",
    "Cancelled",
  ]);
  const REPORT_VISIBILITIES = new Set(["Private", "Shared"]);
  const STORE_ORDER_STATUSES = new Set([
    "Draft",
    "Held",
    "Completed",
    "Cancelled",
    "Reversed",
  ]);
  const INVENTORY_TRANSACTION_TYPES = new Set([
    "Opening Stock",
    "Purchase",
    "Stock In",
    "Sale",
    "Return",
    "Adjustment Increase",
    "Adjustment Decrease",
    "Damage",
    "Sale Reversal",
  ]);

  function normalizeNamedStatus(value, allowed, fallback, label) {
    const status = optionalText(value) || fallback;
    if (!allowed.has(status)) {
      throw new Error(`${label} status is invalid.`);
    }
    return status;
  }

  function normalizeOptionalDate(value, fieldName) {
    const text = optionalText(value);
    return text ? normalizeDate(text, fieldName) : "";
  }

  function normalizeOptionalTime(value, fieldName) {
    const text = optionalText(value);
    return text ? normalizeTime(text, fieldName) : "";
  }

  function normalizeDateTime(value, fieldName) {
    const text = requiredText(value, fieldName);
    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`${fieldName} is invalid.`);
    }
    return parsed.toISOString();
  }

  function assertEndAfterStart(start, end, label = "End time") {
    if (start && end && end <= start) {
      throw new Error(`${label} must be after start time.`);
    }
  }

  function normalizeMoney(value, fieldName, minimum = 0) {
    return wholeNumber(value ?? 0, fieldName, minimum);
  }

  function nextNumber(prefix, table, column, date = new Date()) {
    const year = date.getFullYear();
    const stem = `${prefix}-${year}-`;
    const row = db
      .prepare(`
        SELECT ${column} AS value
        FROM ${table}
        WHERE ${column} LIKE ?
        ORDER BY ${column} DESC
        LIMIT 1
      `)
      .get(`${stem}%`);
    const last = Number(row?.value?.slice(stem.length) ?? 0);
    return `${stem}${String(last + 1).padStart(4, "0")}`;
  }

  function getScheduleEntriesInternal(scheduleId) {
    return db
      .prepare(`
        SELECT *
        FROM exam_schedule_entries
        WHERE schedule_id = ?
          AND deleted_at IS NULL
        ORDER BY exam_date, start_time, class_name COLLATE NOCASE,
                 section COLLATE NOCASE, subject_name COLLATE NOCASE
      `)
      .all(requiredText(scheduleId, "Schedule id"))
      .map(examScheduleEntryFromRow);
  }

  function getExamScheduleInternal(id) {
    const row = db
      .prepare(`
        SELECT schedule.*,
               COUNT(entry.id) AS entry_count
        FROM exam_schedules schedule
        LEFT JOIN exam_schedule_entries entry
          ON entry.schedule_id = schedule.id
         AND entry.deleted_at IS NULL
        WHERE schedule.id = ?
          AND schedule.deleted_at IS NULL
        GROUP BY schedule.id
      `)
      .get(requiredText(id, "Schedule id"));
    return row
      ? examScheduleFromRow(row, getScheduleEntriesInternal(row.id))
      : null;
  }

  function resolveExamScheduleInput(input = {}, existing = null) {
    const examId =
      input.examId === undefined
        ? existing?.exam_id
        : requiredText(input.examId, "Exam");
    const exam = getActiveExamById.get(examId);
    if (!exam) throw new Error("Select an active exam.");
    const sessionId =
      input.academicSessionId === undefined
        ? existing?.academic_session_id ?? ""
        : optionalText(input.academicSessionId);
    const session = sessionId ? getAcademicSessionRow(sessionId) : null;
    if (sessionId && !session) throw new Error("Academic session was not found.");
    const startDate =
      input.startDate === undefined
        ? existing?.start_date ?? exam.exam_date
        : normalizeDate(input.startDate, "Start date");
    const endDate =
      input.endDate === undefined
        ? existing?.end_date ?? startDate
        : normalizeDate(input.endDate, "End date");
    if (endDate < startDate) {
      throw new Error("Schedule end date cannot be before start date.");
    }
    return {
      exam,
      session,
      title:
        input.title === undefined
          ? existing?.title ?? exam.name
          : optionalText(input.title) || exam.name,
      startDate,
      endDate,
      status:
        input.status === undefined
          ? existing?.status ?? "Draft"
          : normalizeNamedStatus(
              input.status,
              EXAM_SCHEDULE_STATUSES,
              "Draft",
              "Exam schedule",
            ),
      instructions:
        input.instructions === undefined
          ? existing?.instructions ?? ""
          : optionalText(input.instructions),
    };
  }

  function normalizeScheduleEntry(input, schedule) {
    const className = requiredText(input?.className, "Class");
    const schoolClass = getActiveClassByName.get(className);
    if (!schoolClass || schoolClass.status !== "Active") {
      throw new Error("Select an active class.");
    }
    const section = optionalText(input?.section);
    const subjectId = optionalText(input?.subjectId);
    const subject = subjectId ? getActiveSubjectById.get(subjectId) : null;
    if (subjectId && (!subject || subject.status !== "Active")) {
      throw new Error("Select an active subject.");
    }
    if (subject && subject.class_name !== schoolClass.name) {
      throw new Error("Selected subject must belong to the selected class.");
    }
    const examDate = normalizeDate(input?.examDate, "Paper date");
    if (examDate < schedule.startDate || examDate > schedule.endDate) {
      throw new Error("Paper date must be inside the schedule date range.");
    }
    const startTime = normalizeOptionalTime(input?.startTime, "Start time");
    const endTime = normalizeOptionalTime(input?.endTime, "End time");
    assertEndAfterStart(startTime, endTime);
    const maximumMarks =
      input?.maximumMarks === undefined || input?.maximumMarks === ""
        ? Number(subject?.max_marks ?? 0)
        : decimalNumber(input.maximumMarks, "Maximum marks", 0);
    const passingMarks =
      input?.passingMarks === undefined || input?.passingMarks === ""
        ? Number(subject?.passing_marks ?? 0)
        : decimalNumber(input.passingMarks, "Passing marks", 0);
    if (passingMarks > maximumMarks) {
      throw new Error("Passing marks cannot exceed maximum marks.");
    }
    const invigilatorId = optionalText(input?.invigilatorEmployeeId);
    const invigilator = invigilatorId
      ? db
          .prepare(`
            SELECT *
            FROM employees
            WHERE id = ?
              AND deleted_at IS NULL
          `)
          .get(invigilatorId)
      : null;
    if (invigilatorId && !invigilator) {
      throw new Error("Invigilator employee was not found.");
    }
    return {
      id: optionalText(input?.id) || crypto.randomUUID(),
      className: schoolClass.name,
      section,
      subjectId: subject?.id ?? "",
      subjectName: subject?.name ?? requiredText(input?.subjectName, "Subject"),
      examDate,
      startTime,
      endTime,
      room: optionalText(input?.room),
      maximumMarks,
      passingMarks,
      invigilatorEmployeeId: invigilator?.id ?? "",
      invigilatorName: invigilator?.name ?? optionalText(input?.invigilatorName),
      instructions: optionalText(input?.instructions),
    };
  }

  function timeRangesOverlap(left, right) {
    if (left.examDate !== right.examDate) return false;
    const leftStart = left.startTime || "00:00";
    const leftEnd = left.endTime || "23:59";
    const rightStart = right.startTime || "00:00";
    const rightEnd = right.endTime || "23:59";
    return leftStart < rightEnd && rightStart < leftEnd;
  }

  function detectScheduleConflictsForEntries(entries) {
    const conflicts = [];
    for (let leftIndex = 0; leftIndex < entries.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < entries.length; rightIndex += 1) {
        const left = entries[leftIndex];
        const right = entries[rightIndex];
        if (!timeRangesOverlap(left, right)) continue;
        if (
          left.className === right.className &&
          (left.section || "") === (right.section || "")
        ) {
          conflicts.push(
            `Class ${left.className}${left.section ? `-${left.section}` : ""} has overlapping papers on ${left.examDate}.`,
          );
        }
        if (left.room && right.room && left.room === right.room) {
          conflicts.push(`Room ${left.room} is double-booked on ${left.examDate}.`);
        }
        if (
          left.invigilatorEmployeeId &&
          right.invigilatorEmployeeId &&
          left.invigilatorEmployeeId === right.invigilatorEmployeeId
        ) {
          conflicts.push(
            `${left.invigilatorName || "Invigilator"} is double-booked on ${left.examDate}.`,
          );
        }
      }
    }
    return Array.from(new Set(conflicts));
  }

  function queryResultRows(filter = {}) {
    const examId = requiredText(filter.examId, "Exam");
    const exam = getActiveExamById.get(examId);
    if (!exam) throw new Error("Exam was not found.");
    const className = optionalText(filter.className) || exam.class_name;
    const section =
      filter.section === undefined
        ? exam.section ?? ""
        : optionalText(filter.section);
    const students = db
      .prepare(`
        SELECT *
        FROM students
        WHERE class_name = ?
          AND (? = '' OR section = ?)
          AND status = 'Active'
          AND deleted_at IS NULL
        ORDER BY name COLLATE NOCASE, admission_no COLLATE NOCASE
      `)
      .all(className, section, section)
      .map(studentFromRow);
    const subjects = db
      .prepare(`
        SELECT *
        FROM subjects
        WHERE class_name = ?
          AND status = 'Active'
          AND deleted_at IS NULL
        ORDER BY name COLLATE NOCASE
      `)
      .all(className)
      .map(subjectFromRow);
    const marks = db
      .prepare(`
        SELECT *
        FROM marks
        WHERE exam_id = ?
          AND class_name = ?
          AND (? = '' OR section = ?)
      `)
      .all(exam.id, className, section, section)
      .map(markFromRow);
    const marksByStudent = new Map();
    marks.forEach((mark) => {
      if (!marksByStudent.has(mark.studentId)) {
        marksByStudent.set(mark.studentId, new Map());
      }
      marksByStudent.get(mark.studentId).set(mark.subjectId, mark);
    });
    const scheme = resolveApplicableGradingScheme({
      academicSessionId: optionalText(filter.academicSessionId),
      className,
    });
    const rows = students.map((student) => {
      const markMap = marksByStudent.get(student.id) ?? new Map();
      const subjectMarks = subjects.map((subject) => {
        const mark = markMap.get(subject.id);
        const absent = /absent/i.test(mark?.remarks ?? "");
        const status = !mark
          ? "Pending"
          : absent
            ? "Absent"
            : mark.obtainedMarks >= mark.passingMarks
              ? "Pass"
              : "Fail";
        const percent = mark?.maxMarks
          ? Math.round((mark.obtainedMarks / mark.maxMarks) * 10000) / 100
          : 0;
        const grade =
          status === "Pass" || status === "Fail"
            ? calculateGradeFromScheme(
                scheme,
                scheme.calculationMode === "Marks"
                  ? mark.obtainedMarks
                  : percent,
              ).grade
            : "";
        return {
          subjectId: subject.id,
          subjectName: subject.name,
          maxMarks: Number(mark?.maxMarks ?? subject.maxMarks ?? 0),
          passingMarks: Number(mark?.passingMarks ?? subject.passingMarks ?? 0),
          obtainedMarks: Number(mark?.obtainedMarks ?? 0),
          grade,
          status,
          remarks: mark?.remarks ?? "",
        };
      });
      const totalMaximum = subjectMarks.reduce((total, item) => total + item.maxMarks, 0);
      const totalObtained = subjectMarks.reduce((total, item) => total + item.obtainedMarks, 0);
      const percentage =
        totalMaximum > 0
          ? Math.round((totalObtained / totalMaximum) * 10000) / 100
          : 0;
      const hasAbsent = subjectMarks.some((item) => item.status === "Absent");
      const hasPending = subjectMarks.some((item) => item.status === "Pending");
      const hasFail = subjectMarks.some((item) => item.status === "Fail");
      const result = hasPending ? "Incomplete" : hasAbsent ? "Absent" : hasFail ? "Fail" : "Pass";
      const grade =
        result === "Pass" || result === "Fail"
          ? calculateGradeFromScheme(
              scheme,
              scheme.calculationMode === "Marks" ? totalObtained : percentage,
            ).grade
          : "";
      return {
        student,
        rollNo: "",
        admissionNo: student.admissionNo,
        studentName: student.name,
        className: student.className,
        section: student.section,
        subjectMarks,
        totalObtained,
        totalMaximum,
        percentage,
        grade,
        result,
        position: null,
      };
    });
    const rankable = rows
      .filter((row) => row.result !== "Incomplete" && row.result !== "Absent")
      .sort((left, right) =>
        right.percentage === left.percentage
          ? right.totalObtained === left.totalObtained
            ? left.studentName.localeCompare(right.studentName)
            : right.totalObtained - left.totalObtained
          : right.percentage - left.percentage,
      );
    let lastScore = null;
    let denseRank = 0;
    rankable.forEach((row) => {
      const score = `${row.percentage}:${row.totalObtained}`;
      if (score !== lastScore) {
        denseRank += 1;
        lastScore = score;
      }
      row.position = denseRank;
    });
    const appeared = rows.filter((row) => !["Incomplete", "Absent"].includes(row.result)).length;
    const passed = rows.filter((row) => row.result === "Pass").length;
    const failed = rows.filter((row) => row.result === "Fail").length;
    const absent = rows.filter((row) => row.result === "Absent").length;
    const incomplete = rows.filter((row) => row.result === "Incomplete").length;
    const percentages = rows
      .filter((row) => row.result !== "Incomplete")
      .map((row) => row.percentage);
    return {
      exam: examFromRow(exam),
      className,
      section,
      subjects,
      rows,
      summary: {
        totalStudents: rows.length,
        appeared,
        passed,
        failed,
        absent,
        incomplete,
        highestPercentage: percentages.length ? Math.max(...percentages) : 0,
        lowestPercentage: percentages.length ? Math.min(...percentages) : 0,
        averagePercentage:
          percentages.length
            ? Math.round((percentages.reduce((sum, value) => sum + value, 0) / percentages.length) * 100) / 100
            : 0,
        passPercentage:
          appeared > 0 ? Math.round((passed / appeared) * 10000) / 100 : 0,
      },
      rankingMethod:
        "Dense ranking by percentage, then total marks; ties share the same position.",
    };
  }

  function validateMeetingUrl(value) {
    const url = requiredText(value, "Meeting URL");
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error("Meeting URL is invalid.");
    }
    if (parsed.protocol !== "https:") {
      throw new Error("Meeting URL must be an HTTPS link.");
    }
    return parsed.toString();
  }

  function getStoreOrderInternal(id) {
    const row = db
      .prepare("SELECT * FROM store_orders WHERE id = ?")
      .get(requiredText(id, "Order id"));
    if (!row) return null;
    const items = db
      .prepare("SELECT * FROM store_order_items WHERE order_id = ? ORDER BY created_at")
      .all(row.id)
      .map(storeOrderItemFromRow);
    const payments = db
      .prepare("SELECT * FROM store_payments WHERE order_id = ? ORDER BY created_at")
      .all(row.id)
      .map(storePaymentFromRow);
    return storeOrderFromRow(row, items, payments);
  }

  function paymentsSummaryForOrders(orders = []) {
    const summary = new Map();
    orders.forEach((order) => {
      (order.payments ?? []).forEach((payment) => {
        const paymentMode = payment.paymentMode || "Unknown";
        summary.set(
          paymentMode,
          (summary.get(paymentMode) ?? 0) + Number(payment.amount ?? 0),
        );
      });
    });
    return [...summary.entries()].map(([paymentMode, amount]) => ({
      paymentMode,
      amount,
    }));
  }

  function normalizeStorePaymentMode(value) {
    const paymentMode = optionalText(value) || "Cash";
    if (/upi/i.test(paymentMode)) return "UPI";
    if (/card/i.test(paymentMode)) return "Card";
    if (PAYMENT_MODES.has(paymentMode)) return paymentMode;
    throw new Error("POS payment mode is invalid.");
  }

  function mappingKeyForStorePaymentMode(paymentMode) {
    if (paymentMode === "Cash") return "cash_income";
    if (paymentMode === "UPI") return "upi_income";
    if (paymentMode === "Card") return "card_income";
    return "sales_income";
  }

  function ensureStorePosAccountMappingDefaults() {
    const timestamp = now();
    Object.entries(STORE_POS_ACCOUNT_MAPPINGS).forEach(([mappingKey, config]) => {
      const existing = db
        .prepare("SELECT id FROM store_pos_account_mappings WHERE mapping_key = ?")
        .get(mappingKey);
      if (existing) return;
      const category = getActiveAccountCategory(config.accountType, config.candidates);
      db.prepare(`
        INSERT INTO store_pos_account_mappings (
          id, mapping_key, label, account_category_id, account_category_name,
          account_type, status, created_at, updated_at, deleted_at, sync_status
        ) VALUES (
          @id, @mappingKey, @label, @accountCategoryId, @accountCategoryName,
          @accountType, 'Active', @createdAt, @updatedAt, NULL, 'pending'
        )
      `).run({
        id: crypto.randomUUID(),
        mappingKey,
        label: config.label,
        accountCategoryId: category?.id ?? "",
        accountCategoryName: category?.name ?? "",
        accountType: config.accountType,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    });
  }

  function resolveStorePosAccountCategory(mappingKey) {
    ensureStorePosAccountMappingDefaults();
    const config = STORE_POS_ACCOUNT_MAPPINGS[mappingKey];
    if (!config) throw new Error("Store/POS account mapping is invalid.");
    const mapping = db
      .prepare(`
        SELECT mapping.*, account_categories.name AS resolved_category_name
        FROM store_pos_account_mappings mapping
        LEFT JOIN account_categories
          ON account_categories.id = mapping.account_category_id
         AND account_categories.type = mapping.account_type
         AND account_categories.status = 'Active'
         AND account_categories.deleted_at IS NULL
        WHERE mapping.mapping_key = ?
          AND mapping.status = 'Active'
          AND mapping.deleted_at IS NULL
        LIMIT 1
      `)
      .get(mappingKey);
    if (!mapping?.account_category_id || !mapping.resolved_category_name) {
      throw new Error(`Configure Store/POS account mapping for ${config.label}.`);
    }
    return {
      id: mapping.account_category_id,
      name: mapping.resolved_category_name,
      type: mapping.account_type,
    };
  }

  function validateStorePaymentTotals(status, payments, grandTotal) {
    const normalizedPayments = status === "Completed"
      ? payments.map((payment) => ({
          ...payment,
          paymentMode: normalizeStorePaymentMode(payment.paymentMode),
          amount: normalizeMoney(payment.amount, "Payment amount"),
          paymentDate: normalizeDate(
            payment.paymentDate ?? now().slice(0, 10),
            "Payment date",
          ),
        }))
      : [];
    if (status !== "Completed" && payments.length > 0) {
      throw new Error("Only completed POS sales can store payment records.");
    }
    const paidAmount = normalizedPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    );
    if (status === "Completed" && paidAmount !== grandTotal) {
      throw new Error("Payment totals must equal the order payable amount.");
    }
    return { normalizedPayments, paidAmount };
  }

  function requireOpenStorePosSession(posSessionId, actor = null) {
    const providedSessionId = optionalText(posSessionId);
    const actorId = optionalText(actor?.id);
    const row = providedSessionId
      ? db
          .prepare(`
            SELECT *
            FROM store_pos_sessions
            WHERE id = ? AND status = 'Open'
          `)
          .get(providedSessionId)
      : actorId
        ? db
            .prepare(`
              SELECT *
              FROM store_pos_sessions
              WHERE cashier_user_id = ?
                AND status = 'Open'
              ORDER BY opened_at DESC
              LIMIT 1
            `)
            .get(actorId)
        : null;
    if (!row) {
      throw new Error("Open a cashier session before completing a POS sale.");
    }
    if (
      row.cashier_user_id &&
      actorId &&
      row.cashier_user_id !== actorId &&
      !["Owner", "Admin"].includes(actor?.role)
    ) {
      throw new Error("This cashier session belongs to another user.");
    }
    return storePosSessionFromRow(row);
  }

  function summarizeStorePosSession(sessionId) {
    const session = db
      .prepare("SELECT * FROM store_pos_sessions WHERE id = ?")
      .get(requiredText(sessionId, "Cashier session id"));
    if (!session) throw new Error("Cashier session was not found.");
    const rows = db
      .prepare(`
        SELECT orders.status, payments.payment_mode, SUM(payments.amount) AS amount
        FROM store_payments payments
        JOIN store_orders orders ON orders.id = payments.order_id
        WHERE orders.pos_session_id = ?
          AND orders.status IN ('Completed', 'Reversed')
        GROUP BY orders.status, payments.payment_mode
      `)
      .all(session.id);
    const totalFor = (status, mode) =>
      rows
        .filter((row) => row.status === status && row.payment_mode === mode)
        .reduce((total, row) => total + Number(row.amount ?? 0), 0);
    const cashCollected = totalFor("Completed", "Cash") + totalFor("Reversed", "Cash");
    const cashReversed = totalFor("Reversed", "Cash");
    const upiCollected = totalFor("Completed", "UPI");
    const cardCollected = totalFor("Completed", "Card");
    const otherCollected = rows
      .filter(
        (row) =>
          row.status === "Completed" &&
          !["Cash", "UPI", "Card"].includes(row.payment_mode),
      )
      .reduce((total, row) => total + Number(row.amount ?? 0), 0);
    const totalSales = rows
      .filter((row) => row.status === "Completed")
      .reduce((total, row) => total + Number(row.amount ?? 0), 0);
    const totalReversed = rows
      .filter((row) => row.status === "Reversed")
      .reduce((total, row) => total + Number(row.amount ?? 0), 0);
    const expectedCash = Number(session.opening_cash ?? 0) + cashCollected - cashReversed;
    return {
      session: storePosSessionFromRow(session),
      openingCash: Number(session.opening_cash ?? 0),
      cashCollected,
      cashReversed,
      upiCollected,
      cardCollected,
      otherCollected,
      totalSales,
      totalReversed,
      expectedCash,
    };
  }

  function postStoreOrderAccountingInternal(orderId, actor = null) {
    const order = getStoreOrderInternal(orderId);
    if (!order) throw new Error("Store order was not found.");
    if (order.status !== "Completed") {
      return { postedCount: 0, totalAmount: 0, transactions: [] };
    }
    const transactions = [];
    order.payments.forEach((payment) => {
      const paymentMode = normalizeStorePaymentMode(payment.paymentMode);
      const category = resolveStorePosAccountCategory(
        mappingKeyForStorePaymentMode(paymentMode),
      );
      const transaction = createLinkedAccountTransaction({
        type: "Income",
        category,
        title: `POS Sale ${order.orderNo} - ${paymentMode}`,
        amount: payment.amount,
        paymentMode,
        transactionDate: payment.paymentDate || order.orderDate,
        referenceNo: order.orderNo,
        linkedModule: "POS Sale",
        linkedRecordId: payment.id,
        notes: `Store/POS order ${order.orderNo}`,
        createdBy: actor?.name ?? order.createdBy ?? "",
      });
      transactions.push(transaction);
    });
    return {
      postedCount: transactions.length,
      totalAmount: transactions.reduce((total, row) => total + row.amount, 0),
      transactions,
    };
  }

  function postStoreOrderReversalAccountingInternal(orderId, actor = null) {
    const order = getStoreOrderInternal(orderId);
    if (!order) throw new Error("Store order was not found.");
    if (order.status !== "Reversed") {
      return { postedCount: 0, totalAmount: 0, transactions: [] };
    }
    const category = resolveStorePosAccountCategory("reversal_expense");
    const transactionDate = (order.reversedAt || now()).slice(0, 10);
    const transactions = [];
    order.payments.forEach((payment) => {
      const paymentMode = normalizeStorePaymentMode(payment.paymentMode);
      const transaction = createLinkedAccountTransaction({
        type: "Expense",
        category,
        title: `POS Reversal ${order.orderNo} - ${paymentMode}`,
        amount: payment.amount,
        paymentMode,
        transactionDate,
        referenceNo: order.orderNo,
        linkedModule: "POS Sale Reversal",
        linkedRecordId: payment.id,
        notes: `Reversal for Store/POS order ${order.orderNo}`,
        createdBy: actor?.name ?? order.reversedBy ?? "",
      });
      transactions.push(transaction);
    });
    return {
      postedCount: transactions.length,
      totalAmount: transactions.reduce((total, row) => total + row.amount, 0),
      transactions,
    };
  }

  function applyStockChange(productId, delta, transaction = {}) {
    const product = db
      .prepare(`
        SELECT *
        FROM store_products
        WHERE id = ?
          AND deleted_at IS NULL
      `)
      .get(requiredText(productId, "Product id"));
    if (!product || product.status !== "Active") {
      throw new Error("Select an active store product.");
    }
    const nextStock = Number(product.current_stock ?? 0) + delta;
    if (nextStock < 0) {
      throw new Error(`Insufficient stock for ${product.name}.`);
    }
    const timestamp = now();
    db.prepare(`
      UPDATE store_products
      SET current_stock = ?, updated_at = ?, sync_status = 'pending'
      WHERE id = ?
    `).run(nextStock, timestamp, product.id);
    const transactionType = requiredText(transaction.transactionType, "Inventory transaction type");
    if (!INVENTORY_TRANSACTION_TYPES.has(transactionType)) {
      throw new Error("Inventory transaction type is invalid.");
    }
    db.prepare(`
      INSERT INTO store_inventory_transactions (
        id, product_id, variant_id, transaction_type, quantity, unit_cost,
        unit_price, stock_before, stock_after, reference_type, reference_id,
        notes, transaction_date, created_by, created_at, sync_status
      ) VALUES (
        @id, @productId, @variantId, @transactionType, @quantity, @unitCost,
        @unitPrice, @stockBefore, @stockAfter, @referenceType, @referenceId,
        @notes, @transactionDate, @createdBy, @createdAt, 'pending'
      )
    `).run({
      id: crypto.randomUUID(),
      productId: product.id,
      variantId: optionalText(transaction.variantId),
      transactionType,
      quantity: delta,
      unitCost: Number(product.cost_price ?? 0),
      unitPrice: Number(product.price ?? 0),
      stockBefore: Number(product.current_stock ?? 0),
      stockAfter: nextStock,
      referenceType: optionalText(transaction.referenceType),
      referenceId: optionalText(transaction.referenceId),
      notes: optionalText(transaction.notes),
      transactionDate: normalizeDate(transaction.transactionDate ?? now().slice(0, 10), "Transaction date"),
      createdBy: optionalText(transaction.createdBy),
      createdAt: timestamp,
    });
    return nextStock;
  }

  const CUSTOM_REPORT_DOMAINS = {
    Students: {
      roles: ["Owner", "Admin", "Teacher", "Viewer"],
      base: "students",
      where: "deleted_at IS NULL",
      columns: {
        admissionNo: ["Admission No", "admission_no"],
        name: ["Student Name", "name"],
        className: ["Class", "class_name"],
        section: ["Section", "section"],
        status: ["Status", "status"],
        mobile: ["Mobile", "mobile"],
      },
    },
    "Families and Guardians": {
      roles: ["Owner", "Admin", "Teacher", "Viewer", "Accountant"],
      base: "guardians",
      where: "deleted_at IS NULL",
      columns: {
        fullName: ["Guardian", "full_name"],
        relation: ["Relation", "relation"],
        mobile: ["Mobile", "mobile"],
        email: ["Email", "email"],
        occupation: ["Occupation", "occupation"],
        status: ["Status", "status"],
      },
    },
    Employees: {
      roles: ["Owner", "Admin"],
      base: "employees",
      where: "deleted_at IS NULL",
      columns: {
        employeeNo: ["Employee No", "employee_no"],
        name: ["Employee", "name"],
        department: ["Department", "department"],
        designation: ["Designation", "designation"],
        status: ["Status", "status"],
      },
    },
    "Fee Payments": {
      roles: ["Owner", "Admin", "Accountant"],
      base: "fee_payments",
      where: "status <> 'Reversed'",
      columns: {
        receiptNo: ["Receipt No", "receipt_no"],
        studentName: ["Student", "student_name"],
        className: ["Class", "class_name"],
        paymentDate: ["Payment Date", "payment_date"],
        paymentMode: ["Mode", "payment_mode"],
        amount: ["Amount", "amount"],
      },
    },
    Accounts: {
      roles: ["Owner", "Admin", "Accountant"],
      base: "account_transactions",
      where: "deleted_at IS NULL",
      columns: {
        transactionDate: ["Date", "transaction_date"],
        type: ["Type", "type"],
        categoryName: ["Category", "category_name"],
        amount: ["Amount", "amount"],
        paymentMode: ["Mode", "payment_mode"],
      },
    },
    "Student Attendance": {
      roles: ["Owner", "Admin", "Teacher", "Viewer"],
      base: "attendance",
      where: "1 = 1",
      columns: {
        attendanceDate: ["Date", "attendance_date"],
        studentName: ["Student", "student_name"],
        className: ["Class", "class_name"],
        section: ["Section", "section"],
        status: ["Status", "status"],
      },
    },
    "Employee Attendance": {
      roles: ["Owner", "Admin", "Accountant"],
      base: "employee_attendance",
      where: "deleted_at IS NULL",
      columns: {
        attendanceDate: ["Date", "attendance_date"],
        employeeName: ["Employee", "employee_name"],
        department: ["Department", "department"],
        status: ["Status", "status"],
      },
    },
    "Exams and Results": {
      roles: ["Owner", "Admin", "Teacher", "Viewer"],
      base: "marks",
      where: "1 = 1",
      columns: {
        examName: ["Exam", "exam_name"],
        studentName: ["Student", "student_name"],
        className: ["Class", "class_name"],
        subjectName: ["Subject", "subject_name"],
        obtainedMarks: ["Obtained", "obtained_marks"],
        maxMarks: ["Maximum", "max_marks"],
      },
    },
    "Report Cards": {
      roles: ["Owner", "Admin", "Teacher", "Viewer"],
      base: "student_report_cards",
      where: "deleted_at IS NULL",
      columns: {
        reportCardNo: ["Report Card No", "report_card_no"],
        studentName: ["Student", "student_name"],
        examName: ["Exam", "exam_name"],
        percentage: ["Percentage", "percentage"],
        overallGrade: ["Grade", "overall_grade"],
        resultStatus: ["Result", "result_status"],
      },
    },
    "Salary and Payroll": {
      roles: ["Owner", "Admin", "Accountant"],
      base: "salary_payments",
      where: "deleted_at IS NULL",
      columns: {
        salaryNo: ["Salary No", "salary_no"],
        employeeName: ["Employee", "employee_name"],
        salaryMonth: ["Month", "salary_month"],
        netSalary: ["Net Salary", "net_salary"],
        status: ["Status", "status"],
      },
    },
    "Messages and Announcements": {
      roles: ["Owner", "Admin"],
      base: "announcements",
      where: "deleted_at IS NULL",
      columns: {
        title: ["Title", "title"],
        audienceType: ["Audience", "audience_type"],
        priority: ["Priority", "priority"],
        status: ["Status", "status"],
        createdAt: ["Created", "created_at"],
      },
    },
  };

  function getCustomReportDomain(domainName) {
    const domain = CUSTOM_REPORT_DOMAINS[requiredText(domainName, "Report domain")];
    if (!domain) {
      throw new Error("Report domain is not approved.");
    }
    return domain;
  }

  function previewCustomReportInternal(input = {}, actor = null) {
    const domainName = requiredText(input.reportDomain, "Report domain");
    const domain = getCustomReportDomain(domainName);
    if (actor?.role && !domain.roles.includes(actor.role)) {
      throw new Error("You do not have permission to use this report domain.");
    }
    const selectedColumns = Array.isArray(input.selectedColumns)
      ? input.selectedColumns
      : [];
    if (selectedColumns.length === 0) {
      throw new Error("Select at least one report column.");
    }
    selectedColumns.forEach((column) => {
      if (!domain.columns[column]) {
        throw new Error("A selected report column is not approved.");
      }
    });
    const filters = input.filters && typeof input.filters === "object" ? input.filters : {};
    const params = {};
    const filterSql = Object.entries(filters)
      .filter(([, value]) => optionalText(value))
      .map(([key, value], index) => {
        const column = domain.columns[key];
        if (!column) throw new Error("A selected report filter is not approved.");
        const param = `filter${index}`;
        params[param] = `%${optionalText(value)}%`;
        return `CAST(${column[1]} AS TEXT) LIKE @${param}`;
      });
    const sortItems = Array.isArray(input.sort) ? input.sort : [];
    const orderBy = sortItems
      .map((sort) => {
        const column = domain.columns[sort?.column];
        if (!column) throw new Error("Report sort column is not approved.");
        return `${column[1]} ${String(sort.direction).toUpperCase() === "DESC" ? "DESC" : "ASC"}`;
      })
      .join(", ");
    const sql = `
      SELECT ${selectedColumns.map((key) => `${domain.columns[key][1]} AS "${key}"`).join(", ")}
      FROM ${domain.base}
      WHERE ${domain.where}
        ${filterSql.length ? `AND ${filterSql.join(" AND ")}` : ""}
      ${orderBy ? `ORDER BY ${orderBy}` : ""}
      LIMIT 500
    `;
    const rows = db.prepare(sql).all(params);
    return {
      domain: domainName,
      columns: selectedColumns.map((key) => ({
        key,
        label: domain.columns[key][0],
      })),
      rows,
      generatedAt: now(),
    };
  }

  function normalizeSchoolRuleCategory(value) {
    const category = optionalText(value) || "General";
    if (!SCHOOL_RULE_CATEGORIES.has(category)) {
      throw new Error("Rule category is invalid.");
    }
    return category;
  }

  function resolveSchoolRuleValues(input = {}, existing = null) {
    const academicSessionId =
      input.academicSessionId === undefined && existing
        ? existing.academic_session_id ?? ""
        : optionalText(input.academicSessionId);
    let academicSessionName =
      input.academicSessionName === undefined && existing
        ? existing.academic_session_name ?? ""
        : optionalText(input.academicSessionName);
    if (academicSessionId) {
      const session = getAcademicSessionRow(academicSessionId);
      if (!session) throw new Error("Academic session was not found.");
      academicSessionName = session.session_name;
    }
    const effectiveFromText =
      input.effectiveFrom === undefined && existing
        ? existing.effective_from ?? ""
        : optionalText(input.effectiveFrom);
    return {
      title:
        input.title === undefined && existing
          ? existing.title
          : requiredText(input.title, "Rule title"),
      category:
        input.category === undefined && existing
          ? existing.category
          : normalizeSchoolRuleCategory(input.category),
      ruleText:
        input.ruleText === undefined && existing
          ? existing.rule_text
          : requiredText(input.ruleText, "Rule text"),
      displayOrder:
        input.displayOrder === undefined && existing
          ? Number(existing.display_order ?? 0)
          : wholeNumber(input.displayOrder ?? 0, "Display order", 0),
      status:
        input.status === undefined && existing
          ? existing.status
          : masterStatus(input.status),
      academicSessionId,
      academicSessionName,
      effectiveFrom: effectiveFromText
        ? normalizeDate(effectiveFromText, "Effective date")
        : "",
    };
  }

  function buildSchoolRulesWhere(filter = {}) {
    const clauses = ["deleted_at IS NULL"];
    const params = {};
    const category = optionalText(filter.category);
    if (category && category !== "All") {
      if (!SCHOOL_RULE_CATEGORIES.has(category)) {
        throw new Error("Rule category is invalid.");
      }
      clauses.push("category = @category");
      params.category = category;
    }
    const status = optionalText(filter.status);
    if (status && status !== "All") {
      if (!MASTER_STATUSES.has(status)) {
        throw new Error("Rule status is invalid.");
      }
      clauses.push("status = @status");
      params.status = status;
    }
    const academicSessionId = optionalText(filter.academicSessionId);
    if (academicSessionId) {
      clauses.push("academic_session_id = @academicSessionId");
      params.academicSessionId = academicSessionId;
    }
    const search = optionalText(filter.search).toLowerCase();
    if (search) {
      clauses.push(`
        (
          lower(title) LIKE @search OR
          lower(category) LIKE @search OR
          lower(rule_text) LIKE @search
        )
      `);
      params.search = `%${search}%`;
    }
    return { where: clauses.join(" AND "), params };
  }

  function normalizePreferenceScope(value) {
    const scope = requiredText(value, "Preference scope");
    if (!PREFERENCE_SCOPES.has(scope)) {
      throw new Error("Preference scope is invalid.");
    }
    return scope;
  }

  function normalizeThemeMode(value, fallback = "Light") {
    const mode = optionalText(value) || fallback;
    if (!THEME_MODES.has(mode)) throw new Error("Theme mode is invalid.");
    return mode;
  }

  function normalizeAccentColor(value, fallback = "Blue") {
    const color = optionalText(value) || fallback;
    if (!ACCENT_COLORS.has(color)) throw new Error("Accent color is invalid.");
    return color;
  }

  function normalizePreferenceLanguage(value, fallback = "English") {
    const language = optionalText(value) || fallback;
    if (!PREFERENCE_LANGUAGES.has(language)) {
      throw new Error("Language is invalid.");
    }
    return language;
  }

  function normalizeFontScale(value, fallback = "Normal") {
    const scale = optionalText(value) || fallback;
    if (!FONT_SCALES.has(scale)) throw new Error("Font scale is invalid.");
    return scale;
  }

  function normalizeDateFormat(value, fallback = "DD/MM/YYYY") {
    const format = optionalText(value) || fallback;
    if (!DATE_FORMATS.has(format)) throw new Error("Date format is invalid.");
    return format;
  }

  function normalizeTimeFormat(value, fallback = "12 Hour") {
    const format = optionalText(value) || fallback;
    if (!TIME_FORMATS.has(format)) throw new Error("Time format is invalid.");
    return format;
  }

  function getApplicationPreferenceRow() {
    let row = db
      .prepare(`
        SELECT *
        FROM app_preferences
        WHERE preference_scope = 'Application'
        ORDER BY created_at ASC
        LIMIT 1
      `)
      .get();
    if (!row) {
      const timestamp = now();
      db.prepare(`
        INSERT INTO app_preferences (
          id, preference_scope, user_id, theme_mode, accent_color, language,
          compact_sidebar, font_scale, date_format, time_format, created_at,
          updated_at
        ) VALUES (
          'application-defaults', 'Application', NULL, 'Light', 'Blue',
          'English', 0, 'Normal', 'DD/MM/YYYY', '12 Hour', @timestamp,
          @timestamp
        )
      `).run({ timestamp });
      row = db
        .prepare("SELECT * FROM app_preferences WHERE id = ?")
        .get("application-defaults");
    }
    return row;
  }

  function resolvePreferenceValues(input = {}, existing = null) {
    return {
      themeMode: normalizeThemeMode(input.themeMode, existing?.theme_mode),
      accentColor: normalizeAccentColor(
        input.accentColor,
        existing?.accent_color,
      ),
      language: normalizePreferenceLanguage(input.language, existing?.language),
      compactSidebar: booleanFlag(
        input.compactSidebar,
        Number(existing?.compact_sidebar ?? 0) === 1,
      ),
      fontScale: normalizeFontScale(input.fontScale, existing?.font_scale),
      dateFormat: normalizeDateFormat(input.dateFormat, existing?.date_format),
      timeFormat: normalizeTimeFormat(input.timeFormat, existing?.time_format),
    };
  }

  function buildLoginHistoryWhere(filter = {}, userId = "") {
    const clauses = [];
    const params = {};
    if (userId) {
      clauses.push("user_id = @userId");
      params.userId = userId;
    }
    const startDate = optionalText(filter.startDate);
    if (startDate) {
      clauses.push("date(login_at) >= @startDate");
      params.startDate = normalizeDate(startDate, "Start date");
    }
    const endDate = optionalText(filter.endDate);
    if (endDate) {
      clauses.push("date(login_at) <= @endDate");
      params.endDate = normalizeDate(endDate, "End date");
    }
    const success = filter.success;
    if (success === true || success === false) {
      clauses.push("success = @success");
      params.success = success ? 1 : 0;
    }
    return {
      where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
      params,
    };
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

  const homeworkSelect = `
    SELECT
      homework.*,
      (
        SELECT COUNT(*)
        FROM homework_submissions
        WHERE homework_submissions.homework_id = homework.id
      ) AS submission_count,
      (
        SELECT COUNT(*)
        FROM homework_submissions
        WHERE homework_submissions.homework_id = homework.id
          AND homework_submissions.status IN ('Pending', 'Missing')
      ) AS pending_submission_count
    FROM homework
  `;

  function homeworkWithCountsFromRow(row) {
    return {
      ...homeworkFromRow(row),
      submissionCount: Number(row.submission_count ?? 0),
      pendingSubmissionCount: Number(row.pending_submission_count ?? 0),
    };
  }

  function getHomeworkRow(id) {
    return db
      .prepare(`
        ${homeworkSelect}
        WHERE homework.id = ? AND homework.deleted_at IS NULL
      `)
      .get(requiredText(id, "Homework id"));
  }

  function resolveHomeworkValues(input, existing = null) {
    const className =
      input?.className === undefined && existing
        ? existing.class_name
        : requiredText(input?.className, "Class");
    const schoolClass = getActiveClassByName.get(className);
    if (!schoolClass || schoolClass.status !== "Active") {
      throw new Error("Select an active class.");
    }
    const section =
      input?.section === undefined && existing
        ? existing.section ?? ""
        : optionalText(input?.section);
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
    const subjectId =
      input?.subjectId === undefined && existing
        ? existing.subject_id
        : requiredText(input?.subjectId, "Subject");
    const subject = getActiveSubjectById.get(subjectId);
    if (
      !subject ||
      subject.status !== "Active" ||
      subject.class_name !== schoolClass.name
    ) {
      throw new Error("Select an active subject for the chosen class.");
    }
    const teacherId =
      input?.teacherId === undefined && existing
        ? existing.teacher_id
        : requiredText(input?.teacherId, "Teacher");
    const teacher = db
      .prepare(`
        SELECT *
        FROM employees
        WHERE id = ? AND status = 'Active' AND deleted_at IS NULL
      `)
      .get(teacherId);
    if (!teacher) throw new Error("Select an active teacher.");
    const homeworkDate =
      input?.homeworkDate === undefined && existing
        ? existing.homework_date
        : normalizeDate(input?.homeworkDate, "Homework date");
    const dueDateText =
      input?.dueDate === undefined && existing
        ? existing.due_date ?? ""
        : optionalText(input?.dueDate);
    const dueDate = dueDateText
      ? normalizeDate(dueDateText, "Due date")
      : "";
    if (dueDate && dueDate < homeworkDate) {
      throw new Error("Due date cannot be before the homework date.");
    }
    const status =
      input?.status === undefined && existing
        ? existing.status
        : optionalText(input?.status) || "Active";
    if (!HOMEWORK_STATUSES.has(status)) {
      throw new Error("Homework status is invalid.");
    }
    return {
      title:
        input?.title === undefined && existing
          ? existing.title
          : requiredText(input?.title, "Homework title"),
      className: schoolClass.name,
      section,
      subjectId: subject.id,
      subjectName: subject.name,
      teacherId: teacher.id,
      teacherName: teacher.name,
      homeworkDate,
      dueDate,
      description:
        input?.description === undefined && existing
          ? existing.description ?? ""
          : optionalText(input?.description),
      instructions:
        input?.instructions === undefined && existing
          ? existing.instructions ?? ""
          : optionalText(input?.instructions),
      status,
    };
  }

  function createPendingHomeworkSubmissions(
    homeworkId,
    className,
    section,
    timestamp,
  ) {
    const students = db
      .prepare(`
        SELECT *
        FROM students
        WHERE class_name = ?
          AND (? = '' OR COALESCE(section, '') = ?)
          AND status = 'Active'
          AND deleted_at IS NULL
        ORDER BY admission_no COLLATE NOCASE, name COLLATE NOCASE
      `)
      .all(className, section, section);
    const insertSubmission = db.prepare(`
      INSERT OR IGNORE INTO homework_submissions (
        id, homework_id, student_id, student_name, admission_no, class_name,
        section, status, submitted_date, remarks, marks, created_at,
        updated_at, sync_status
      ) VALUES (
        @id, @homeworkId, @studentId, @studentName, @admissionNo,
        @className, @section, 'Pending', NULL, '', NULL, @createdAt,
        @updatedAt, 'pending'
      )
    `);
    for (const student of students) {
      insertSubmission.run({
        id: crypto.randomUUID(),
        homeworkId,
        studentId: student.id,
        studentName: student.name,
        admissionNo: student.admission_no,
        className: student.class_name,
        section: student.section ?? "",
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
    return students.length;
  }

  function resolveHomeworkSubmissionValues(input, existing) {
    const status =
      input?.status === undefined
        ? existing.status
        : requiredText(input.status, "Submission status");
    if (!HOMEWORK_SUBMISSION_STATUSES.has(status)) {
      throw new Error("Homework submission status is invalid.");
    }
    const submittedDateText =
      input?.submittedDate === undefined
        ? existing.submitted_date ?? ""
        : optionalText(input.submittedDate);
    const marksValue =
      input?.marks === undefined
        ? existing.marks
        : input.marks === null || input.marks === ""
          ? null
          : wholeNumber(input.marks, "Homework marks", 0);
    return {
      status,
      submittedDate: submittedDateText
        ? normalizeDate(submittedDateText, "Submitted date")
        : null,
      remarks:
        input?.remarks === undefined
          ? existing.remarks ?? ""
          : optionalText(input.remarks),
      marks: marksValue == null ? null : Number(marksValue),
    };
  }

  const classTestSelect = `
    SELECT
      class_tests.*,
      (
        SELECT COUNT(*)
        FROM class_test_marks
        WHERE class_test_marks.test_id = class_tests.id
      ) AS mark_count,
      (
        SELECT COUNT(*)
        FROM class_test_marks
        WHERE class_test_marks.test_id = class_tests.id
          AND class_test_marks.result_status = 'Pending'
      ) AS pending_mark_count
    FROM class_tests
  `;

  function getClassTestRow(id) {
    return db
      .prepare(`
        ${classTestSelect}
        WHERE class_tests.id = ? AND class_tests.deleted_at IS NULL
      `)
      .get(requiredText(id, "Class test id"));
  }

  function resolveClassTestValues(input, existing = null) {
    const className =
      input?.className === undefined && existing
        ? existing.class_name
        : requiredText(input?.className, "Class");
    const schoolClass = getActiveClassByName.get(className);
    if (!schoolClass || schoolClass.status !== "Active") {
      throw new Error("Select an active class.");
    }
    const section =
      input?.section === undefined && existing
        ? existing.section ?? ""
        : optionalText(input?.section);
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
    const subjectId =
      input?.subjectId === undefined && existing
        ? existing.subject_id
        : requiredText(input?.subjectId, "Subject");
    const subject = getActiveSubjectById.get(subjectId);
    if (
      !subject ||
      subject.status !== "Active" ||
      subject.class_name !== schoolClass.name
    ) {
      throw new Error("Select an active subject for the chosen class.");
    }
    const teacherId =
      input?.teacherId === undefined && existing
        ? existing.teacher_id
        : requiredText(input?.teacherId, "Teacher");
    const teacher = db
      .prepare(`
        SELECT *
        FROM employees
        WHERE id = ? AND status = 'Active' AND deleted_at IS NULL
      `)
      .get(teacherId);
    if (!teacher) throw new Error("Select an active teacher.");
    const maxMarks =
      input?.maxMarks === undefined && existing
        ? Number(existing.max_marks)
        : wholeNumber(input?.maxMarks, "Maximum marks", 1);
    const passingMarks =
      input?.passingMarks === undefined && existing
        ? Number(existing.passing_marks ?? 0)
        : wholeNumber(input?.passingMarks ?? 0, "Passing marks", 0);
    if (passingMarks > maxMarks) {
      throw new Error("Passing marks cannot exceed maximum marks.");
    }
    const status =
      input?.status === undefined && existing
        ? existing.status
        : optionalText(input?.status) || "Active";
    if (!MASTER_STATUSES.has(status)) {
      throw new Error("Class test status is invalid.");
    }
    return {
      testName:
        input?.testName === undefined && existing
          ? existing.test_name
          : requiredText(input?.testName, "Test name"),
      className: schoolClass.name,
      section,
      subjectId: subject.id,
      subjectName: subject.name,
      teacherId: teacher.id,
      teacherName: teacher.name,
      testDate:
        input?.testDate === undefined && existing
          ? existing.test_date
          : normalizeDate(input?.testDate, "Test date"),
      maxMarks,
      passingMarks,
      description:
        input?.description === undefined && existing
          ? existing.description ?? ""
          : optionalText(input?.description),
      status,
    };
  }

  function createPendingClassTestMarks(
    testId,
    className,
    section,
    timestamp,
  ) {
    const students = db
      .prepare(`
        SELECT *
        FROM students
        WHERE class_name = ?
          AND (? = '' OR COALESCE(section, '') = ?)
          AND status = 'Active'
          AND deleted_at IS NULL
        ORDER BY admission_no COLLATE NOCASE, name COLLATE NOCASE
      `)
      .all(className, section, section);
    const insertMark = db.prepare(`
      INSERT OR IGNORE INTO class_test_marks (
        id, test_id, student_id, student_name, admission_no, class_name,
        section, marks_obtained, result_status, remarks, created_at,
        updated_at, sync_status
      ) VALUES (
        @id, @testId, @studentId, @studentName, @admissionNo, @className,
        @section, 0, 'Pending', '', @createdAt, @updatedAt, 'pending'
      )
    `);
    for (const student of students) {
      insertMark.run({
        id: crypto.randomUUID(),
        testId,
        studentId: student.id,
        studentName: student.name,
        admissionNo: student.admission_no,
        className: student.class_name,
        section: student.section ?? "",
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
    return students.length;
  }

  function resolveClassTestMarkValues(input, existing, test) {
    const marksObtained =
      input?.marksObtained === undefined
        ? Number(existing.marks_obtained ?? 0)
        : wholeNumber(input.marksObtained, "Marks obtained", 0);
    if (marksObtained > Number(test.max_marks)) {
      throw new Error(
        `Marks obtained cannot exceed ${Number(test.max_marks)}.`,
      );
    }
    const requestedStatus =
      input?.resultStatus === undefined
        ? existing.result_status
        : requiredText(input.resultStatus, "Result status");
    if (!CLASS_TEST_RESULT_STATUSES.has(requestedStatus)) {
      throw new Error("Class test result status is invalid.");
    }
    const resultStatus =
      requestedStatus === "Absent"
        ? "Absent"
        : requestedStatus === "Pending"
          ? "Pending"
          : marksObtained >= Number(test.passing_marks ?? 0)
            ? "Pass"
            : "Fail";
    return {
      marksObtained: resultStatus === "Absent" ? 0 : marksObtained,
      resultStatus,
      remarks:
        input?.remarks === undefined
          ? existing.remarks ?? ""
          : optionalText(input.remarks),
    };
  }

  function resolveSubjectChapterValues(input, existing = null) {
    const className =
      input?.className === undefined && existing
        ? existing.class_name
        : requiredText(input?.className, "Class");
    const schoolClass = getActiveClassByName.get(className);
    if (!schoolClass || schoolClass.status !== "Active") {
      throw new Error("Select an active class.");
    }
    const subjectId =
      input?.subjectId === undefined && existing
        ? existing.subject_id
        : requiredText(input?.subjectId, "Subject");
    const subject = getActiveSubjectById.get(subjectId);
    if (
      !subject ||
      subject.status !== "Active" ||
      subject.class_name !== schoolClass.name
    ) {
      throw new Error("Select an active subject for the chosen class.");
    }
    const status =
      input?.status === undefined && existing
        ? existing.status
        : optionalText(input?.status) || "Active";
    if (!MASTER_STATUSES.has(status)) {
      throw new Error("Subject chapter status is invalid.");
    }
    return {
      className: schoolClass.name,
      subjectId: subject.id,
      subjectName: subject.name,
      chapterName:
        input?.chapterName === undefined && existing
          ? existing.chapter_name
          : requiredText(input?.chapterName, "Chapter name"),
      chapterNo:
        input?.chapterNo === undefined && existing
          ? existing.chapter_no ?? ""
          : optionalText(input?.chapterNo),
      description:
        input?.description === undefined && existing
          ? existing.description ?? ""
          : optionalText(input?.description),
      status,
    };
  }

  function resolveQuestionValues(input, existing = null) {
    const className =
      input?.className === undefined && existing
        ? existing.class_name
        : requiredText(input?.className, "Class");
    const schoolClass = getActiveClassByName.get(className);
    if (!schoolClass || schoolClass.status !== "Active") {
      throw new Error("Select an active class.");
    }
    const subjectId =
      input?.subjectId === undefined && existing
        ? existing.subject_id
        : requiredText(input?.subjectId, "Subject");
    const subject = getActiveSubjectById.get(subjectId);
    if (
      !subject ||
      subject.status !== "Active" ||
      subject.class_name !== schoolClass.name
    ) {
      throw new Error("Select an active subject for the chosen class.");
    }
    const chapterId =
      input?.chapterId === undefined && existing
        ? existing.chapter_id ?? ""
        : optionalText(input?.chapterId);
    const chapter = chapterId
      ? db
          .prepare(`
            SELECT *
            FROM subject_chapters
            WHERE id = ? AND status = 'Active' AND deleted_at IS NULL
          `)
          .get(chapterId)
      : null;
    if (
      chapterId &&
      (!chapter ||
        chapter.class_name !== schoolClass.name ||
        chapter.subject_id !== subject.id)
    ) {
      throw new Error("Select an active chapter for the chosen subject.");
    }
    const questionType =
      input?.questionType === undefined && existing
        ? existing.question_type
        : requiredText(input?.questionType, "Question type");
    if (!QUESTION_TYPES.has(questionType)) {
      throw new Error("Question type is invalid.");
    }
    const difficulty =
      input?.difficulty === undefined && existing
        ? existing.difficulty
        : optionalText(input?.difficulty) || "Medium";
    if (!QUESTION_DIFFICULTIES.has(difficulty)) {
      throw new Error("Question difficulty is invalid.");
    }
    const optionA =
      input?.optionA === undefined && existing
        ? existing.option_a ?? ""
        : optionalText(input?.optionA);
    const optionB =
      input?.optionB === undefined && existing
        ? existing.option_b ?? ""
        : optionalText(input?.optionB);
    const optionC =
      input?.optionC === undefined && existing
        ? existing.option_c ?? ""
        : optionalText(input?.optionC);
    const optionD =
      input?.optionD === undefined && existing
        ? existing.option_d ?? ""
        : optionalText(input?.optionD);
    const correctAnswer =
      input?.correctAnswer === undefined && existing
        ? existing.correct_answer ?? ""
        : optionalText(input?.correctAnswer);
    if (questionType === "Objective" && (!optionA || !optionB)) {
      throw new Error("Objective questions require at least options A and B.");
    }
    if (
      ["Objective", "True/False", "Fill in the Blanks"].includes(
        questionType,
      ) &&
      !correctAnswer
    ) {
      throw new Error("Correct answer is required for this question type.");
    }
    const status =
      input?.status === undefined && existing
        ? existing.status
        : optionalText(input?.status) || "Active";
    if (!MASTER_STATUSES.has(status)) {
      throw new Error("Question status is invalid.");
    }
    return {
      className: schoolClass.name,
      subjectId: subject.id,
      subjectName: subject.name,
      chapterId: chapter?.id ?? null,
      chapterName: chapter?.chapter_name ?? "",
      questionType,
      difficulty,
      questionText:
        input?.questionText === undefined && existing
          ? existing.question_text
          : requiredText(input?.questionText, "Question text"),
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      marks:
        input?.marks === undefined && existing
          ? Number(existing.marks ?? 1)
          : wholeNumber(input?.marks ?? 1, "Question marks", 1),
      status,
    };
  }

  const questionPaperSelect = `
    SELECT
      question_papers.*,
      (
        SELECT COUNT(*)
        FROM question_paper_items
        WHERE question_paper_items.paper_id = question_papers.id
      ) AS item_count
    FROM question_papers
  `;

  function getQuestionPaperRow(id) {
    return db
      .prepare(`
        ${questionPaperSelect}
        WHERE question_papers.id = ? AND question_papers.deleted_at IS NULL
      `)
      .get(requiredText(id, "Question paper id"));
  }

  function getQuestionPaperItems(paperId) {
    return db
      .prepare(`
        SELECT *
        FROM question_paper_items
        WHERE paper_id = ?
        ORDER BY display_order, created_at
      `)
      .all(paperId)
      .map(questionPaperItemFromRow);
  }

  function resolveQuestionPaperValues(input, existing = null) {
    const className =
      input?.className === undefined && existing
        ? existing.class_name
        : requiredText(input?.className, "Class");
    const schoolClass = getActiveClassByName.get(className);
    if (!schoolClass || schoolClass.status !== "Active") {
      throw new Error("Select an active class.");
    }
    const section =
      input?.section === undefined && existing
        ? existing.section ?? ""
        : optionalText(input?.section);
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
    const subjectId =
      input?.subjectId === undefined && existing
        ? existing.subject_id
        : requiredText(input?.subjectId, "Subject");
    const subject = getActiveSubjectById.get(subjectId);
    if (
      !subject ||
      subject.status !== "Active" ||
      subject.class_name !== schoolClass.name
    ) {
      throw new Error("Select an active subject for the chosen class.");
    }
    const sourceItems = input?.items;
    if (
      sourceItems === undefined &&
      existing &&
      (schoolClass.name !== existing.class_name ||
        subject.id !== existing.subject_id)
    ) {
      throw new Error(
        "Questions must be selected again when changing the paper class or subject.",
      );
    }
    if (
      sourceItems !== undefined &&
      (!Array.isArray(sourceItems) || sourceItems.length === 0)
    ) {
      throw new Error("Select at least one question for the paper.");
    }
    const seenQuestionIds = new Set();
    const items =
      sourceItems === undefined && existing
        ? getQuestionPaperItems(existing.id).map((item) => ({
            questionId: item.questionId,
            sectionTitle: item.sectionTitle,
            displayOrder: item.displayOrder,
            questionType: item.questionType,
            questionText: item.questionText,
            optionA: item.optionA,
            optionB: item.optionB,
            optionC: item.optionC,
            optionD: item.optionD,
            correctAnswer: item.correctAnswer,
            marks: item.marks,
          }))
        : sourceItems.map((item, index) => {
      const questionId = requiredText(item?.questionId, "Question");
      if (seenQuestionIds.has(questionId)) {
        throw new Error("A question can be added to a paper only once.");
      }
      seenQuestionIds.add(questionId);
      const question = db
        .prepare(`
          SELECT *
          FROM question_bank
          WHERE id = ? AND status = 'Active' AND deleted_at IS NULL
        `)
        .get(questionId);
      if (
        !question ||
        question.class_name !== schoolClass.name ||
        question.subject_id !== subject.id
      ) {
        throw new Error(
          "Every selected question must be active and belong to the paper class and subject.",
        );
      }
      return {
        questionId: question.id,
        sectionTitle:
          optionalText(item?.sectionTitle) || "Section A",
        displayOrder:
          item?.displayOrder === undefined
            ? index + 1
            : wholeNumber(item.displayOrder, "Question display order", 1),
        questionType: question.question_type,
        questionText: question.question_text,
        optionA: question.option_a ?? "",
        optionB: question.option_b ?? "",
        optionC: question.option_c ?? "",
        optionD: question.option_d ?? "",
        correctAnswer: question.correct_answer ?? "",
        marks: Number(question.marks ?? 1),
      };
          });
    if (items.length === 0) {
      throw new Error("Select at least one question for the paper.");
    }
    return {
      title:
        input?.title === undefined && existing
          ? existing.title
          : requiredText(input?.title, "Paper title"),
      className: schoolClass.name,
      section,
      subjectId: subject.id,
      subjectName: subject.name,
      examName:
        input?.examName === undefined && existing
          ? existing.exam_name ?? ""
          : optionalText(input?.examName),
      durationMinutes:
        input?.durationMinutes === undefined && existing
          ? Number(existing.duration_minutes ?? 0)
          : wholeNumber(
              input?.durationMinutes ?? 0,
              "Duration in minutes",
              0,
            ),
      totalMarks: items.reduce((total, item) => total + item.marks, 0),
      instructions:
        input?.instructions === undefined && existing
          ? existing.instructions ?? ""
          : optionalText(input?.instructions),
      items,
    };
  }

  function insertQuestionPaperItems(paperId, items, timestamp) {
    const insertItem = db.prepare(`
      INSERT INTO question_paper_items (
        id, paper_id, question_id, section_title, display_order,
        question_type, question_text, option_a, option_b, option_c, option_d,
        correct_answer, marks, created_at, updated_at, sync_status
      ) VALUES (
        @id, @paperId, @questionId, @sectionTitle, @displayOrder,
        @questionType, @questionText, @optionA, @optionB, @optionC, @optionD,
        @correctAnswer, @marks, @createdAt, @updatedAt, 'pending'
      )
    `);
    for (const item of items) {
      insertItem.run({
        id: crypto.randomUUID(),
        paperId,
        ...item,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
  }

  function normalizeSessionName(value) {
    const sessionName = requiredText(value, "Session name")
      .replace(/[–—/]/g, "-")
      .replace(/\s+/g, "");
    if (!/^\d{4}-\d{2,4}$/.test(sessionName)) {
      throw new Error("Session name must use a format such as 2026-27.");
    }
    return sessionName;
  }

  function getAcademicSessionRow(id) {
    return db
      .prepare(`
        SELECT *
        FROM academic_sessions
        WHERE id = ? AND deleted_at IS NULL
      `)
      .get(requiredText(id, "Academic session id"));
  }

  function validateClassSection(classNameValue, sectionValue) {
    const className = requiredText(classNameValue, "Class");
    const schoolClass = getActiveClassByName.get(className);
    if (!schoolClass || schoolClass.status !== "Active") {
      throw new Error("Select an active class.");
    }
    const section = optionalText(sectionValue);
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
    return { className: schoolClass.name, section };
  }

  function ensureStudentSessionHistory(
    studentId,
    session = null,
    overrides = {},
  ) {
    const student = getStudentStatement.get(
      requiredText(studentId, "Student"),
    );
    if (!student) throw new Error("Student record was not found.");
    const targetSession =
      session ??
      db
        .prepare(`
          SELECT *
          FROM academic_sessions
          WHERE is_current = 1 AND deleted_at IS NULL
        `)
        .get();
    if (!targetSession) return null;
    const existing = db
      .prepare(`
        SELECT *
        FROM student_session_history
        WHERE student_id = ? AND academic_session_id = ?
      `)
      .get(student.id, targetSession.id);
    const timestamp = now();
    const values = {
      studentId: student.id,
      admissionNo: student.admission_no,
      studentName: student.name,
      academicSessionId: targetSession.id,
      academicSessionName: targetSession.session_name,
      className: optionalText(overrides.className) || student.class_name,
      section:
        overrides.section === undefined
          ? student.section ?? ""
          : optionalText(overrides.section),
      rollNo:
        overrides.rollNo === undefined && existing
          ? existing.roll_no ?? ""
          : optionalText(overrides.rollNo),
      status:
        overrides.status === undefined && existing
          ? existing.status
          : optionalText(overrides.status) || "Active",
      resultStatus:
        overrides.resultStatus === undefined && existing
          ? existing.result_status ?? "Not Applicable"
          : optionalText(overrides.resultStatus) || "Not Applicable",
      remarks:
        overrides.remarks === undefined && existing
          ? existing.remarks ?? ""
          : optionalText(overrides.remarks),
    };
    if (!STUDENT_SESSION_STATUSES.has(values.status)) {
      throw new Error("Student session status is invalid.");
    }
    if (!STUDENT_RESULT_STATUSES.has(values.resultStatus)) {
      throw new Error("Student result status is invalid.");
    }
    if (existing) {
      db.prepare(`
        UPDATE student_session_history
        SET admission_no = @admissionNo,
            student_name = @studentName,
            academic_session_name = @academicSessionName,
            class_name = @className,
            section = @section,
            roll_no = @rollNo,
            status = @status,
            result_status = @resultStatus,
            remarks = @remarks,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id
      `).run({
        id: existing.id,
        ...values,
        updatedAt: timestamp,
      });
      return db
        .prepare("SELECT * FROM student_session_history WHERE id = ?")
        .get(existing.id);
    }
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO student_session_history (
        id, student_id, admission_no, student_name, academic_session_id,
        academic_session_name, class_name, section, roll_no, status,
        result_status, promoted_to_session_id, promoted_to_session_name,
        promoted_to_class, promoted_to_section, promotion_date, remarks,
        created_at, updated_at, sync_status
      ) VALUES (
        @id, @studentId, @admissionNo, @studentName, @academicSessionId,
        @academicSessionName, @className, @section, @rollNo, @status,
        @resultStatus, NULL, NULL, NULL, NULL, NULL, @remarks, @createdAt,
        @updatedAt, 'pending'
      )
    `).run({
      id,
      ...values,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    return db
      .prepare("SELECT * FROM student_session_history WHERE id = ?")
      .get(id);
  }

  function calculateStudentDue(studentId, session) {
    const student = getStudentStatement.get(studentId);
    if (!student) throw new Error("Student record was not found.");
    const structures = db
      .prepare(`
        SELECT *
        FROM fee_structures
        WHERE class_name = ?
          AND status = 'Active'
          AND deleted_at IS NULL
      `)
      .all(student.class_name);
    const sessionStartYear = optionalText(session?.session_name).slice(0, 4);
    const matchingStructures = structures.filter(
      (structure) =>
        !optionalText(structure.academic_year) ||
        optionalText(structure.academic_year).slice(0, 4) ===
          sessionStartYear,
    );
    const configured = (
      matchingStructures.length > 0 ? matchingStructures : structures
    ).reduce((total, structure) => total + Number(structure.amount ?? 0), 0);
    const startDate = optionalText(session?.start_date);
    const endDate = optionalText(session?.end_date);
    const paid = Number(
      db
        .prepare(`
          SELECT COALESCE(SUM(amount), 0) AS total
          FROM fee_payments
          WHERE student_id = ?
            AND (? = '' OR payment_date >= ?)
            AND (? = '' OR payment_date <= ?)
        `)
        .get(
          student.id,
          startDate,
          startDate,
          endDate,
          endDate,
        ).total,
    );
    return Math.max(0, configured - paid);
  }

  function generatePromotionNumber(promotionDate) {
    const year = normalizeDate(promotionDate, "Promotion date").slice(0, 4);
    const stem = `PROM-${year}-`;
    const sequence = db
      .prepare(`
        SELECT MAX(
          CAST(substr(promotion_no, length(?) + 1) AS INTEGER)
        ) AS last_sequence
        FROM student_promotions
        WHERE substr(promotion_no, 1, length(?)) = ?
      `)
      .get(stem, stem, stem);
    return `${stem}${String(Number(sequence?.last_sequence ?? 0) + 1).padStart(4, "0")}`;
  }

  function getPromotionItems(promotionId) {
    return db
      .prepare(`
        SELECT *
        FROM student_promotion_items
        WHERE promotion_id = ?
        ORDER BY student_name COLLATE NOCASE
      `)
      .all(promotionId)
      .map(promotionItemFromRow);
  }

  function normalizeMessageThreadType(value, fallback = "Direct") {
    const threadType = optionalText(value) || fallback;
    if (!MESSAGE_THREAD_TYPES.has(threadType)) {
      throw new Error("Message thread type is invalid.");
    }
    return threadType;
  }

  function normalizeMessageThreadStatus(value, fallback = "Active") {
    const status = optionalText(value) || fallback;
    if (!MESSAGE_THREAD_STATUSES.has(status)) {
      throw new Error("Message thread status is invalid.");
    }
    return status;
  }

  function normalizeMessagePriority(value, fallback = "Normal") {
    const priority = optionalText(value) || fallback;
    if (!MESSAGE_PRIORITIES.has(priority)) {
      throw new Error("Message priority is invalid.");
    }
    return priority;
  }

  function normalizeMessageType(value, fallback = "Text") {
    const messageType = optionalText(value) || fallback;
    if (!MESSAGE_TYPES.has(messageType)) {
      throw new Error("Message type is invalid.");
    }
    return messageType;
  }

  function normalizeAnnouncementAudience(value) {
    const audienceType = requiredText(value, "Audience");
    if (!ANNOUNCEMENT_AUDIENCE_TYPES.has(audienceType)) {
      throw new Error("Announcement audience is invalid.");
    }
    return audienceType;
  }

  function normalizeAnnouncementStatus(value, fallback = "Draft") {
    const status = optionalText(value) || fallback;
    if (!ANNOUNCEMENT_STATUSES.has(status)) {
      throw new Error("Announcement status is invalid.");
    }
    return status;
  }

  function messageIsAdmin(user) {
    return user?.role === "Owner" || user?.role === "Admin";
  }

  function getMessageUserContext(user) {
    const userId = requiredText(user?.id, "Current user");
    const row = db
      .prepare(`
        SELECT *
        FROM users
        WHERE id = ?
          AND status = 'Active'
          AND deleted_at IS NULL
      `)
      .get(userId);
    if (!row) throw new Error("Authenticated user is no longer active.");
    const link = db
      .prepare(`
        SELECT
          links.*,
          users.username,
          users.name AS user_name,
          users.role,
          users.account_type,
          users.status AS user_status,
          users.must_change_password,
          users.last_login_at
        FROM user_entity_links AS links
        JOIN users ON users.id = links.user_id AND users.deleted_at IS NULL
        WHERE links.user_id = ?
          AND links.is_primary = 1
          AND links.deleted_at IS NULL
        LIMIT 1
      `)
      .get(userId);
    return {
      id: row.id,
      name: row.name,
      username: row.username,
      role: row.role,
      accountType: row.account_type ?? "Staff",
      status: row.status,
      entityLink: link ? userEntityLinkFromRow(link) : null,
    };
  }

  function getActiveRecipientCandidates() {
    return db
      .prepare(`
        SELECT
          users.id AS user_id,
          users.name AS user_name,
          users.username,
          users.role,
          users.account_type,
          links.entity_type,
          links.entity_id,
          links.entity_code,
          links.entity_name,
          students.admission_no,
          students.name AS student_name,
          students.class_name,
          students.section,
          students.status AS student_status,
          employees.employee_no,
          employees.name AS employee_name,
          employees.department,
          employees.designation,
          employees.status AS employee_status
        FROM users
        LEFT JOIN user_entity_links AS links
          ON links.user_id = users.id
          AND links.is_primary = 1
          AND links.deleted_at IS NULL
        LEFT JOIN students
          ON links.entity_type = 'Student'
          AND students.id = links.entity_id
          AND students.deleted_at IS NULL
        LEFT JOIN employees
          ON links.entity_type = 'Employee'
          AND employees.id = links.entity_id
          AND employees.deleted_at IS NULL
        WHERE users.deleted_at IS NULL
          AND users.status = 'Active'
        ORDER BY users.name COLLATE NOCASE
      `)
      .all()
      .map(messageRecipientCandidateFromRow)
      .filter((candidate) => {
        if (candidate.entityType === "Student") {
          return Boolean(candidate.entityId) && candidate.accountType === "Student";
        }
        if (candidate.entityType === "Employee") {
          return Boolean(candidate.entityId);
        }
        return candidate.accountType !== "Student" && candidate.role !== "Student";
      });
  }

  function getMessageRecipientCandidateByUserId(userId) {
    const normalizedUserId = requiredText(userId, "Recipient user");
    return (
      getActiveRecipientCandidates().find(
        (candidate) => candidate.userId === normalizedUserId,
      ) ?? null
    );
  }

  function getTeacherMessageScopes(user) {
    if (user.role !== "Teacher") return [];
    const employeeId =
      user.entityLink?.entityType === "Employee"
        ? optionalText(user.entityLink.entityId)
        : "";
    if (!employeeId) return [];
    return db
      .prepare(`
        SELECT DISTINCT class_name, COALESCE(section, '') AS section
        FROM timetable_entries
        WHERE teacher_id = ?
          AND deleted_at IS NULL
      `)
      .all(employeeId)
      .map((row) => ({
        className: row.class_name,
        section: row.section ?? "",
      }));
  }

  function teacherCanReachClass(user, className, section = "") {
    const targetClass = requiredText(className, "Class");
    const targetSection = optionalText(section);
    const scopes = getTeacherMessageScopes(user);
    return scopes.some(
      (scope) =>
        scope.className === targetClass &&
        (!targetSection || !scope.section || scope.section === targetSection),
    );
  }

  function teacherCanReachStudent(user, candidate) {
    return (
      candidate.entityType === "Student" &&
      Boolean(candidate.className) &&
      teacherCanReachClass(user, candidate.className, candidate.section)
    );
  }

  function candidateMatchesMessageFilter(candidate, filter = {}) {
    const recipientType = optionalText(filter.recipientType);
    if (recipientType === "Student" && candidate.entityType !== "Student") {
      return false;
    }
    if (recipientType === "Employee" && candidate.entityType !== "Employee") {
      return false;
    }
    if (recipientType === "User" && candidate.entityType !== "User") {
      return false;
    }
    const role = optionalText(filter.role);
    if (role && candidate.role !== role) return false;
    const className = optionalText(filter.className);
    if (className && candidate.className !== className) return false;
    const section = optionalText(filter.section);
    if (section && candidate.section !== section) return false;
    const search = optionalText(filter.search).toLowerCase();
    if (!search) return true;
    return [
      candidate.name,
      candidate.username,
      candidate.role,
      candidate.entityName,
      candidate.entityCode,
      candidate.className,
      candidate.section,
      candidate.department,
      candidate.designation,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(search));
  }

  function getEligibleMessageRecipientCandidates(user, filter = {}) {
    const context = getMessageUserContext(user);
    if (context.role === "Student" || context.role === "Viewer") return [];
    return getActiveRecipientCandidates()
      .filter((candidate) => candidate.userId !== context.id)
      .filter((candidate) => {
        if (messageIsAdmin(context)) return true;
        if (context.role === "Accountant") {
          return candidate.entityType !== "Student" && candidate.role !== "Student";
        }
        if (context.role === "Teacher") {
          if (candidate.entityType === "Student") {
            return teacherCanReachStudent(context, candidate);
          }
          return candidate.role !== "Student";
        }
        return false;
      })
      .filter((candidate) => candidateMatchesMessageFilter(candidate, filter));
  }

  function getMessageThreadRow(threadId) {
    return (
      db
        .prepare(`
          SELECT *
          FROM message_threads
          WHERE id = ?
            AND deleted_at IS NULL
        `)
        .get(requiredText(threadId, "Message thread id")) ?? null
    );
  }

  function isThreadRecipient(threadId, userId) {
    return Boolean(
      db
        .prepare(`
          SELECT id
          FROM message_recipients
          WHERE thread_id = ?
            AND recipient_user_id = ?
            AND deleted_at IS NULL
          LIMIT 1
        `)
        .get(threadId, userId),
    );
  }

  function isThreadSender(threadId, userId) {
    return Boolean(
      db
        .prepare(`
          SELECT id
          FROM messages
          WHERE thread_id = ?
            AND sender_user_id = ?
          LIMIT 1
        `)
        .get(threadId, userId),
    );
  }

  function canReadMessageThreadContent(user, thread) {
    if (isThreadRecipient(thread.id, user.id)) return true;
    if (isThreadSender(thread.id, user.id)) return true;
    if (thread.thread_type !== "Direct" && messageIsAdmin(user)) return true;
    return false;
  }

  function ensureMessageThreadContentAccess(user, threadId) {
    const context = getMessageUserContext(user);
    const thread = getMessageThreadRow(threadId);
    if (!thread) throw new Error("Message thread was not found.");
    if (!canReadMessageThreadContent(context, thread)) {
      throw new Error("You do not have access to this message thread.");
    }
    return { user: context, thread };
  }

  function ensureMessageReportAccess(user, thread) {
    const context = getMessageUserContext(user);
    if (
      messageIsAdmin(context) ||
      thread.created_by_user_id === context.id ||
      isThreadSender(thread.id, context.id) ||
      isThreadRecipient(thread.id, context.id)
    ) {
      return context;
    }
    throw new Error("You do not have access to this message report.");
  }

  function insertMessageRecipient(threadId, candidate, timestamp) {
    if (!candidate?.userId) return null;
    db.prepare(`
      INSERT OR IGNORE INTO message_recipients (
        id, thread_id, recipient_user_id, recipient_role,
        recipient_entity_type, recipient_entity_id, delivery_status,
        delivered_at, read_at, archived_at, created_at, updated_at,
        deleted_at, sync_status
      ) VALUES (
        @id, @threadId, @recipientUserId, @recipientRole,
        @recipientEntityType, @recipientEntityId, 'Delivered',
        @deliveredAt, NULL, NULL, @createdAt, @updatedAt, NULL, 'pending'
      )
    `).run({
      id: crypto.randomUUID(),
      threadId,
      recipientUserId: candidate.userId,
      recipientRole: candidate.role,
      recipientEntityType: candidate.entityType || "User",
      recipientEntityId: candidate.entityId || "",
      deliveredAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    return candidate;
  }

  function getThreadRecipientRows(threadId) {
    return db
      .prepare(`
        SELECT
          recipients.*,
          users.name AS recipient_name,
          users.username AS recipient_username,
          links.entity_code AS recipient_entity_code,
          links.entity_name AS recipient_entity_name,
          students.class_name,
          students.section
        FROM message_recipients AS recipients
        LEFT JOIN users
          ON users.id = recipients.recipient_user_id
        LEFT JOIN user_entity_links AS links
          ON links.user_id = recipients.recipient_user_id
          AND links.is_primary = 1
          AND links.deleted_at IS NULL
        LEFT JOIN students
          ON links.entity_type = 'Student'
          AND students.id = links.entity_id
          AND students.deleted_at IS NULL
        WHERE recipients.thread_id = ?
          AND recipients.deleted_at IS NULL
        ORDER BY users.name COLLATE NOCASE
      `)
      .all(threadId)
      .map(messageRecipientFromRow);
  }

  function createThreadMessage({
    threadId,
    sender,
    messageText,
    messageType = "Text",
    replyToMessageId = "",
    timestamp,
  }) {
    const messageId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO messages (
        id, thread_id, sender_user_id, sender_name, sender_role, message_text,
        message_type, reply_to_message_id, edited_at, created_at, updated_at,
        deleted_at, sync_status
      ) VALUES (
        @id, @threadId, @senderUserId, @senderName, @senderRole, @messageText,
        @messageType, @replyToMessageId, NULL, @createdAt, @updatedAt, NULL,
        'pending'
      )
    `).run({
      id: messageId,
      threadId,
      senderUserId: sender.id,
      senderName: sender.name,
      senderRole: sender.role,
      messageText: requiredText(messageText, "Message"),
      messageType: normalizeMessageType(messageType),
      replyToMessageId: optionalText(replyToMessageId) || null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    db.prepare(`
      UPDATE message_threads
      SET updated_at = ?, sync_status = 'pending'
      WHERE id = ?
    `).run(timestamp, threadId);
    return messageId;
  }

  function queryMessageInbox(user, filter = {}) {
    const context = getMessageUserContext(user);
    const clauses = [
      "recipients.recipient_user_id = @userId",
      "recipients.deleted_at IS NULL",
      "threads.deleted_at IS NULL",
    ];
    const params = {
      userId: context.id,
      today: now().slice(0, 10),
      now: now(),
    };
    const archived = filter.archived === true;
    clauses.push(
      archived
        ? "recipients.delivery_status = 'Archived'"
        : "recipients.delivery_status <> 'Archived'",
    );
    const unreadOnly = filter.unreadOnly === true;
    if (unreadOnly) {
      clauses.push("recipients.read_at IS NULL");
    }
    const type = optionalText(filter.threadType || filter.type);
    if (type && MESSAGE_THREAD_TYPES.has(type)) {
      clauses.push("threads.thread_type = @threadType");
      params.threadType = type;
    }
    const priority = optionalText(filter.priority);
    if (priority && MESSAGE_PRIORITIES.has(priority)) {
      clauses.push("threads.priority = @priority");
      params.priority = priority;
    }
    const search = optionalText(filter.search).toLowerCase();
    const rows = db
      .prepare(`
        SELECT
          threads.*,
          recipients.delivery_status,
          recipients.delivered_at,
          recipients.read_at,
          recipients.archived_at,
          announcements.id AS announcement_id,
          (
            SELECT messages.sender_name
            FROM messages
            WHERE messages.thread_id = threads.id
            ORDER BY messages.created_at DESC
            LIMIT 1
          ) AS sender_name,
          (
            SELECT messages.sender_role
            FROM messages
            WHERE messages.thread_id = threads.id
            ORDER BY messages.created_at DESC
            LIMIT 1
          ) AS sender_role,
          (
            SELECT messages.created_at
            FROM messages
            WHERE messages.thread_id = threads.id
            ORDER BY messages.created_at DESC
            LIMIT 1
          ) AS last_message_at,
          (
            SELECT messages.message_text
            FROM messages
            WHERE messages.thread_id = threads.id
            ORDER BY messages.created_at DESC
            LIMIT 1
          ) AS last_message_preview,
          (
            SELECT messages.deleted_at
            FROM messages
            WHERE messages.thread_id = threads.id
            ORDER BY messages.created_at DESC
            LIMIT 1
          ) AS last_message_deleted_at,
          (
            SELECT COUNT(*)
            FROM messages
            WHERE messages.thread_id = threads.id
              AND messages.sender_user_id <> @userId
              AND messages.deleted_at IS NULL
              AND (
                recipients.read_at IS NULL
                OR messages.created_at > recipients.read_at
              )
          ) AS unread_count
        FROM message_recipients AS recipients
        JOIN message_threads AS threads
          ON threads.id = recipients.thread_id
        LEFT JOIN announcements
          ON announcements.id = threads.id
        WHERE ${clauses.join(" AND ")}
          AND (
            announcements.id IS NULL
            OR (
              announcements.status = 'Published'
              AND (
                announcements.publish_from IS NULL
                OR trim(announcements.publish_from) = ''
                OR announcements.publish_from <= @now
                OR announcements.publish_from <= @today
              )
              AND (
                announcements.publish_until IS NULL
                OR trim(announcements.publish_until) = ''
                OR announcements.publish_until >= @today
              )
            )
          )
        ORDER BY COALESCE(last_message_at, threads.updated_at, threads.created_at) DESC
      `)
      .all(params)
      .map(messageThreadFromRow)
      .filter((thread) => {
        if (!search) return true;
        return [
          thread.subject,
          thread.threadType,
          thread.priority,
          thread.senderName,
          thread.createdByName,
          thread.lastMessagePreview,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));
      });
    const limit = filter.limit
      ? Math.min(200, Math.max(1, wholeNumber(filter.limit, "Message limit", 1)))
      : 200;
    return rows.slice(0, limit);
  }

  function querySentMessages(user, filter = {}) {
    const context = getMessageUserContext(user);
    const clauses = [
      "threads.deleted_at IS NULL",
      `(
        threads.created_by_user_id = @userId
        OR EXISTS (
          SELECT 1
          FROM messages AS sent_messages
          WHERE sent_messages.thread_id = threads.id
            AND sent_messages.sender_user_id = @userId
        )
      )`,
    ];
    const params = { userId: context.id };
    const type = optionalText(filter.threadType || filter.type);
    if (type && MESSAGE_THREAD_TYPES.has(type)) {
      clauses.push("threads.thread_type = @threadType");
      params.threadType = type;
    }
    const priority = optionalText(filter.priority);
    if (priority && MESSAGE_PRIORITIES.has(priority)) {
      clauses.push("threads.priority = @priority");
      params.priority = priority;
    }
    const search = optionalText(filter.search).toLowerCase();
    const rows = db
      .prepare(`
        SELECT
          threads.*,
          (
            SELECT messages.created_at
            FROM messages
            WHERE messages.thread_id = threads.id
            ORDER BY messages.created_at DESC
            LIMIT 1
          ) AS last_message_at,
          (
            SELECT messages.message_text
            FROM messages
            WHERE messages.thread_id = threads.id
            ORDER BY messages.created_at DESC
            LIMIT 1
          ) AS last_message_preview,
          (
            SELECT messages.deleted_at
            FROM messages
            WHERE messages.thread_id = threads.id
            ORDER BY messages.created_at DESC
            LIMIT 1
          ) AS last_message_deleted_at,
          (
            SELECT COUNT(*)
            FROM message_recipients
            WHERE message_recipients.thread_id = threads.id
              AND message_recipients.deleted_at IS NULL
          ) AS recipient_count,
          (
            SELECT COUNT(*)
            FROM message_recipients
            WHERE message_recipients.thread_id = threads.id
              AND message_recipients.deleted_at IS NULL
              AND message_recipients.read_at IS NOT NULL
          ) AS read_count,
          (
            SELECT GROUP_CONCAT(users.name, ', ')
            FROM message_recipients
            LEFT JOIN users ON users.id = message_recipients.recipient_user_id
            WHERE message_recipients.thread_id = threads.id
              AND message_recipients.deleted_at IS NULL
          ) AS recipient_summary
        FROM message_threads AS threads
        WHERE ${clauses.join(" AND ")}
        ORDER BY COALESCE(last_message_at, threads.updated_at, threads.created_at) DESC
      `)
      .all(params)
      .map(messageThreadFromRow)
      .filter((thread) => {
        if (!search) return true;
        return [
          thread.subject,
          thread.threadType,
          thread.priority,
          thread.recipientSummary,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));
      });
    const limit = filter.limit
      ? Math.min(200, Math.max(1, wholeNumber(filter.limit, "Message limit", 1)))
      : 200;
    return rows.slice(0, limit);
  }

  function ensureAnnouncementManageAccess(user, announcement) {
    const context = getMessageUserContext(user);
    if (messageIsAdmin(context)) return context;
    if (
      context.role === "Teacher" &&
      announcement.created_by_user_id === context.id
    ) {
      return context;
    }
    throw new Error("You do not have permission to manage this announcement.");
  }

  function assertCanCreateAnnouncement(user, input = {}) {
    const context = getMessageUserContext(user);
    const audienceType = normalizeAnnouncementAudience(input.audienceType);
    if (messageIsAdmin(context)) return context;
    if (context.role !== "Teacher") {
      throw new Error("You do not have permission to create announcements.");
    }
    if (!["Specific Class", "Specific Section"].includes(audienceType)) {
      throw new Error("Teachers can only create class notices.");
    }
    if (!teacherCanReachClass(
      context,
      input.className,
      audienceType === "Specific Section" ? input.section : "",
    )) {
      throw new Error("This class or section is outside your assigned scope.");
    }
    return context;
  }

  function resolveAnnouncementRecipientCandidates(user, input = {}) {
    const context = assertCanCreateAnnouncement(user, input);
    const audienceType = normalizeAnnouncementAudience(input.audienceType);
    const className = optionalText(input.className);
    const section = optionalText(input.section);
    const selectedUserIds = Array.isArray(input.selectedUserIds)
      ? new Set(input.selectedUserIds.map((id) => optionalText(id)).filter(Boolean))
      : new Set();
    const candidates = getActiveRecipientCandidates();
    return candidates.filter((candidate) => {
      if (audienceType === "All Users") return true;
      if (audienceType === "All Students") return candidate.entityType === "Student";
      if (audienceType === "All Employees") {
        return candidate.entityType === "Employee" || (
          candidate.entityType === "User" && candidate.role !== "Student"
        );
      }
      if (audienceType === "Teachers") return candidate.role === "Teacher";
      if (audienceType === "Accountants") return candidate.role === "Accountant";
      if (audienceType === "Specific Class") {
        return (
          candidate.entityType === "Student" &&
          candidate.className === className
        );
      }
      if (audienceType === "Specific Section") {
        return (
          candidate.entityType === "Student" &&
          candidate.className === className &&
          candidate.section === section
        );
      }
      if (audienceType === "Selected Users") {
        return selectedUserIds.has(candidate.userId);
      }
      return false;
    });
  }

  function threadTypeForAnnouncementAudience(audienceType) {
    if (["All Employees", "Teachers", "Accountants"].includes(audienceType)) {
      return "Staff Notice";
    }
    if (["All Students", "Specific Class", "Specific Section"].includes(audienceType)) {
      return "Class Notice";
    }
    return "Announcement";
  }

  function publishAnnouncementInternal(announcementId, user) {
    const context = getMessageUserContext(user);
    const announcement = db
      .prepare(`
        SELECT *
        FROM announcements
        WHERE id = ?
          AND deleted_at IS NULL
      `)
      .get(requiredText(announcementId, "Announcement id"));
    if (!announcement) throw new Error("Announcement was not found.");
    ensureAnnouncementManageAccess(context, announcement);
    if (announcement.status === "Cancelled") {
      throw new Error("Cancelled announcements cannot be published.");
    }
    const recipients = resolveAnnouncementRecipientCandidates(context, {
      ...announcementFromRow(announcement),
      selectedUserIds: announcementFromRow(announcement).selectedUserIds,
    });
    if (recipients.length === 0) {
      throw new Error("No eligible recipients were found for this announcement.");
    }
    const timestamp = now();
    const threadType = threadTypeForAnnouncementAudience(
      announcement.audience_type,
    );
    db.transaction(() => {
      const existingThread = getMessageThreadRow(announcement.id);
      if (existingThread) {
        db.prepare(`
          UPDATE message_threads
          SET subject = @subject,
              thread_type = @threadType,
              academic_session_id = @academicSessionId,
              class_name = @className,
              section = @section,
              priority = @priority,
              status = 'Active',
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE id = @id
        `).run({
          id: announcement.id,
          subject: announcement.title,
          threadType,
          academicSessionId: announcement.academic_session_id || null,
          className: announcement.class_name ?? "",
          section: announcement.section ?? "",
          priority: announcement.priority ?? "Normal",
          updatedAt: timestamp,
        });
      } else {
        db.prepare(`
          INSERT INTO message_threads (
            id, subject, thread_type, created_by_user_id, created_by_name,
            created_by_role, academic_session_id, class_name, section, status,
            priority, created_at, updated_at, deleted_at, sync_status
          ) VALUES (
            @id, @subject, @threadType, @createdByUserId, @createdByName,
            @createdByRole, @academicSessionId, @className, @section, 'Active',
            @priority, @createdAt, @updatedAt, NULL, 'pending'
          )
        `).run({
          id: announcement.id,
          subject: announcement.title,
          threadType,
          createdByUserId: announcement.created_by_user_id || context.id,
          createdByName: announcement.created_by_name || context.name,
          createdByRole: context.role,
          academicSessionId: announcement.academic_session_id || null,
          className: announcement.class_name ?? "",
          section: announcement.section ?? "",
          priority: announcement.priority ?? "Normal",
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }
      const existingMessage = db
        .prepare(`
          SELECT id
          FROM messages
          WHERE thread_id = ?
            AND message_type = 'Notice'
          ORDER BY created_at ASC
          LIMIT 1
        `)
        .get(announcement.id);
      if (existingMessage) {
        db.prepare(`
          UPDATE messages
          SET message_text = @messageText,
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE id = @id
        `).run({
          id: existingMessage.id,
          messageText: announcement.announcement_text,
          updatedAt: timestamp,
        });
      } else {
        createThreadMessage({
          threadId: announcement.id,
          sender: context,
          messageText: announcement.announcement_text,
          messageType: "Notice",
          timestamp,
        });
      }
      recipients.forEach((recipient) =>
        insertMessageRecipient(announcement.id, recipient, timestamp),
      );
      db.prepare(`
        UPDATE announcements
        SET status = 'Published',
            publish_from = COALESCE(NULLIF(publish_from, ''), @publishFrom),
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id
      `).run({
        id: announcement.id,
        publishFrom: timestamp,
        updatedAt: timestamp,
      });
    })();
    return getAnnouncementByIdInternal(announcement.id);
  }

  function getAnnouncementByIdInternal(id) {
    const announcementId = requiredText(id, "Announcement id");
    const row = db
      .prepare(`
        SELECT
          announcements.*,
          (
            SELECT COUNT(*)
            FROM message_recipients
            WHERE thread_id = announcements.id
              AND deleted_at IS NULL
          ) AS recipient_count,
          (
            SELECT COUNT(*)
            FROM message_recipients
            WHERE thread_id = announcements.id
              AND deleted_at IS NULL
              AND read_at IS NOT NULL
          ) AS read_count,
          announcements.id AS thread_id
        FROM announcements
        WHERE id = ?
          AND deleted_at IS NULL
      `)
      .get(announcementId);
    return row ? announcementFromRow(row) : null;
  }

  function buildMessageThreadDetail(user, threadId) {
    const { user: context, thread } = ensureMessageThreadContentAccess(
      user,
      threadId,
    );
    const messages = db
      .prepare(`
        SELECT *
        FROM messages
        WHERE thread_id = ?
        ORDER BY created_at ASC
      `)
      .all(thread.id)
      .map(messageFromRow);
    return {
      ...messageThreadFromRow(thread),
      messages,
      recipients: getThreadRecipientRows(thread.id),
      canReply:
        thread.status === "Active" &&
        context.role !== "Viewer" &&
        (
          context.role !== "Student" ||
          thread.thread_type === "Direct"
        ),
    };
  }

  return {
    getStudents() {
      return getStudentsStatement.all().map(studentFromRow);
    },

    getStudentById(id) {
      const row = getStudentStatement.get(requiredText(id, "Student id"));
      return row ? studentFromRow(row) : null;
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

      db.transaction(() => {
        insertStudentStatement.run(student);
        ensureStudentSessionHistory(student.id, null, {
          status: status === "Active" ? "Active" : "Inactive",
        });
      })();
      return studentFromRow(getStudentsStatement.all().find(
        (row) => row.id === student.id,
      ));
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

      const updatedStudent = studentFromRow(getStudentStatement.get(studentId));
      db.prepare(`
        UPDATE homework_submissions
        SET student_name = ?,
            admission_no = ?,
            class_name = ?,
            section = ?,
            updated_at = ?,
            sync_status = 'pending'
        WHERE student_id = ?
      `).run(
        updatedStudent.name,
        updatedStudent.admissionNo,
        updatedStudent.className,
        updatedStudent.section,
        now(),
        studentId,
      );
      db.prepare(`
        UPDATE class_test_marks
        SET student_name = ?,
            admission_no = ?,
            class_name = ?,
            section = ?,
            updated_at = ?,
            sync_status = 'pending'
        WHERE student_id = ?
      `).run(
        updatedStudent.name,
        updatedStudent.admissionNo,
        updatedStudent.className,
        updatedStudent.section,
        now(),
        studentId,
      );
      ensureStudentSessionHistory(studentId, null, {
        className: updatedStudent.className,
        section: updatedStudent.section,
        status: updatedStudent.status === "Active" ? "Active" : "Inactive",
      });
      return studentFromRow(
        getStudentsStatement.all().find((row) => row.id === studentId),
      );
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
            ensureStudentSessionHistory(studentValues.id, null, {
              className: studentValues.className,
              section: studentValues.section,
              status:
                studentValues.status === "Active" ? "Active" : "Inactive",
            });
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

    getDocumentTemplateSettings() {
      return db
        .prepare(`
          SELECT *
          FROM document_template_settings
          ORDER BY CASE document_type
            WHEN 'Admission Form' THEN 0
            WHEN 'Transfer Certificate' THEN 1
            WHEN 'Fee Receipt' THEN 2
            ELSE 3
          END
        `)
        .all()
        .map(documentTemplateSettingsFromRow);
    },

    getDocumentTemplateSetting(documentType) {
      return getDocumentTemplateSettingsOrDefault(documentType);
    },

    updateDocumentTemplateSetting(documentType, input = {}) {
      const normalizedType = normalizeDocumentType(documentType);
      const existing = getDocumentTemplateSettingsOrDefault(normalizedType);
      const defaultPaperSize = normalizeDocumentPaperSize(
        input.defaultPaperSize,
        existing.defaultPaperSize,
      );
      const showFields =
        input.showFields && typeof input.showFields === "object" && !Array.isArray(input.showFields)
          ? input.showFields
          : existing.showFields;
      const timestamp = now();
      db.prepare(`
        UPDATE document_template_settings
        SET udise_code = @udiseCode,
            recognition_number = @recognitionNumber,
            principal_name = @principalName,
            principal_signature_path = @principalSignaturePath,
            school_stamp_path = @schoolStampPath,
            accent_color = @accentColor,
            footer_text = @footerText,
            fee_receipt_terms = @feeReceiptTerms,
            default_paper_size = @defaultPaperSize,
            show_fields_json = @showFieldsJson,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE document_type = @documentType
      `).run({
        documentType: normalizedType,
        udiseCode:
          input.udiseCode === undefined
            ? existing.udiseCode
            : optionalText(input.udiseCode),
        recognitionNumber:
          input.recognitionNumber === undefined
            ? existing.recognitionNumber
            : optionalText(input.recognitionNumber),
        principalName:
          input.principalName === undefined
            ? existing.principalName
            : optionalText(input.principalName),
        principalSignaturePath:
          input.principalSignaturePath === undefined
            ? existing.principalSignaturePath
            : optionalText(input.principalSignaturePath),
        schoolStampPath:
          input.schoolStampPath === undefined
            ? existing.schoolStampPath
            : optionalText(input.schoolStampPath),
        accentColor:
          input.accentColor === undefined
            ? existing.accentColor
            : optionalText(input.accentColor) || "#1f4e79",
        footerText:
          input.footerText === undefined
            ? existing.footerText
            : optionalText(input.footerText),
        feeReceiptTerms:
          input.feeReceiptTerms === undefined
            ? existing.feeReceiptTerms
            : optionalText(input.feeReceiptTerms),
        defaultPaperSize,
        showFieldsJson: JSON.stringify(showFields),
        updatedAt: timestamp,
      });
      return getDocumentTemplateSettingsOrDefault(normalizedType);
    },

    getAdmissionFormData(input = {}) {
      return buildAdmissionFormData(input);
    },

    saveAdmissionFormSnapshot(input = {}) {
      const formDate = normalizeDate(
        optionalText(input.formDate) || now().slice(0, 10),
        "Form date",
      );
      const data = buildAdmissionFormData({
        ...input,
        mode: optionalText(input.mode) === "Blank" ? "Blank" : "Prefilled",
        formDate,
      });
      const id = crypto.randomUUID();
      const timestamp = now();
      db.prepare(`
        INSERT INTO admission_form_snapshots (
          id, snapshot_no, student_id, admission_no, student_name, form_date,
          snapshot_json, issued_by, created_at, updated_at, deleted_at,
          sync_status
        ) VALUES (
          @id, @snapshotNo, @studentId, @admissionNo, @studentName, @formDate,
          @snapshotJson, @issuedBy, @createdAt, @updatedAt, NULL, 'pending'
        )
      `).run({
        id,
        snapshotNo: generateAdmissionSnapshotNumber(formDate),
        studentId: data.student?.id ?? null,
        admissionNo: data.student?.admissionNo ?? "",
        studentName: data.student?.name ?? "",
        formDate,
        snapshotJson: JSON.stringify(data),
        issuedBy: optionalText(input.issuedBy),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      return admissionFormSnapshotFromRow(
        db
          .prepare("SELECT * FROM admission_form_snapshots WHERE id = ?")
          .get(id),
      );
    },

    getTransferCertificates(filter = {}) {
      const clauses = ["deleted_at IS NULL"];
      const params = {};
      const search = optionalText(filter.search);
      if (search) {
        clauses.push(`(
          certificate_number LIKE @search
          OR serial_number LIKE @search
          OR sr_number LIKE @search
          OR pen_number LIKE @search
          OR student_name LIKE @search
          OR admission_no LIKE @search
        )`);
        params.search = `%${search}%`;
      }
      const studentId = optionalText(filter.studentId);
      if (studentId) {
        clauses.push("student_id = @studentId");
        params.studentId = studentId;
      }
      const status = optionalText(filter.status);
      if (status && status !== "All") {
        clauses.push("status = @status");
        params.status = normalizeTransferCertificateStatus(status);
      }
      return db
        .prepare(`
          SELECT *
          FROM transfer_certificates
          WHERE ${clauses.join(" AND ")}
          ORDER BY issue_date DESC, created_at DESC
        `)
        .all(params)
        .map(transferCertificateFromRow);
    },

    getTransferCertificate(id) {
      const row = db
        .prepare(`
          SELECT *
          FROM transfer_certificates
          WHERE id = ? AND deleted_at IS NULL
        `)
        .get(requiredText(id, "Transfer certificate id"));
      return row ? transferCertificateFromRow(row) : null;
    },

    getTransferCertificatePreview(input = {}) {
      const { values } = buildTransferCertificateInput(input);
      return {
        ...values,
        dateOfBirthWords:
          values.dateOfBirthWords || dateToWords(values.dateOfBirth),
        schoolSettings: this.getSchoolSettings(),
        templateSettings:
          getDocumentTemplateSettingsOrDefault("Transfer Certificate"),
      };
    },

    createTransferCertificateDraft(input = {}) {
      const { values } = buildTransferCertificateInput({
        ...input,
        status: "Draft",
      });
      const duplicate = db
        .prepare(`
          SELECT id
          FROM transfer_certificates
          WHERE (certificate_number = @certificateNumber
              OR serial_number = @serialNumber)
            AND deleted_at IS NULL
        `)
        .get(values);
      if (duplicate) {
        throw new Error("Certificate number or serial number is already in use.");
      }
      const id = crypto.randomUUID();
      const timestamp = now();
      db.prepare(`
        INSERT INTO transfer_certificates (
          id, student_id, certificate_number, serial_number, sr_number,
          pen_number, academic_session_id, academic_session_name,
          student_name, admission_no, class_name, section,
          father_guardian_name, mother_name, date_of_admission,
          admission_class, date_of_birth, date_of_birth_words,
          last_class_studied, promotion_qualified, promoted_to_class,
          dues_paid_upto, general_conduct, issue_date, reason_for_leaving,
          nationality, caste_category, remarks, status, issued_by,
          reissued_from_id, reprint_count, created_at, updated_at,
          cancelled_at, cancellation_reason, deleted_at, sync_status
        ) VALUES (
          @id, @studentId, @certificateNumber, @serialNumber, @srNumber,
          @penNumber, @academicSessionId, @academicSessionName,
          @studentName, @admissionNo, @className, @section,
          @fatherGuardianName, @motherName, @dateOfAdmission,
          @admissionClass, @dateOfBirth, @dateOfBirthWords,
          @lastClassStudied, @promotionQualified, @promotedToClass,
          @duesPaidUpto, @generalConduct, @issueDate, @reasonForLeaving,
          @nationality, @casteCategory, @remarks, 'Draft', @issuedBy,
          @reissuedFromId, 0, @createdAt, @updatedAt,
          NULL, '', NULL, 'pending'
        )
      `).run({
        id,
        ...values,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      return this.getTransferCertificate(id);
    },

    updateTransferCertificateDraft(id, input = {}) {
      const certificateId = requiredText(id, "Transfer certificate id");
      const existing = db
        .prepare(`
          SELECT *
          FROM transfer_certificates
          WHERE id = ? AND deleted_at IS NULL
        `)
        .get(certificateId);
      if (!existing) throw new Error("Transfer certificate was not found.");
      if (existing.status !== "Draft") {
        throw new Error("Only draft transfer certificates can be edited.");
      }
      const { values } = buildTransferCertificateInput(input, existing);
      const duplicate = db
        .prepare(`
          SELECT id
          FROM transfer_certificates
          WHERE id <> @id
            AND (certificate_number = @certificateNumber
              OR serial_number = @serialNumber)
            AND deleted_at IS NULL
        `)
        .get({ id: certificateId, ...values });
      if (duplicate) {
        throw new Error("Certificate number or serial number is already in use.");
      }
      db.prepare(`
        UPDATE transfer_certificates
        SET student_id = @studentId,
            certificate_number = @certificateNumber,
            serial_number = @serialNumber,
            sr_number = @srNumber,
            pen_number = @penNumber,
            academic_session_id = @academicSessionId,
            academic_session_name = @academicSessionName,
            student_name = @studentName,
            admission_no = @admissionNo,
            class_name = @className,
            section = @section,
            father_guardian_name = @fatherGuardianName,
            mother_name = @motherName,
            date_of_admission = @dateOfAdmission,
            admission_class = @admissionClass,
            date_of_birth = @dateOfBirth,
            date_of_birth_words = @dateOfBirthWords,
            last_class_studied = @lastClassStudied,
            promotion_qualified = @promotionQualified,
            promoted_to_class = @promotedToClass,
            dues_paid_upto = @duesPaidUpto,
            general_conduct = @generalConduct,
            issue_date = @issueDate,
            reason_for_leaving = @reasonForLeaving,
            nationality = @nationality,
            caste_category = @casteCategory,
            remarks = @remarks,
            issued_by = @issuedBy,
            reissued_from_id = @reissuedFromId,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id
      `).run({
        id: certificateId,
        ...values,
        updatedAt: now(),
      });
      return this.getTransferCertificate(certificateId);
    },

    issueTransferCertificate(id, input = {}) {
      const certificateId = requiredText(id, "Transfer certificate id");
      const existing = db
        .prepare(`
          SELECT *
          FROM transfer_certificates
          WHERE id = ? AND deleted_at IS NULL
        `)
        .get(certificateId);
      if (!existing) throw new Error("Transfer certificate was not found.");
      if (existing.status !== "Draft") {
        throw new Error("Only draft transfer certificates can be issued.");
      }
      const issuedBy = optionalText(input.issuedBy) || existing.issued_by || "";
      db.transaction(() => {
        db.prepare(`
          UPDATE transfer_certificates
          SET status = 'Issued',
              issued_by = @issuedBy,
              issue_date = @issueDate,
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE id = @id AND status = 'Draft'
        `).run({
          id: certificateId,
          issuedBy,
          issueDate: normalizeDate(
            optionalText(input.issueDate) || existing.issue_date || now().slice(0, 10),
            "Issue date",
          ),
          updatedAt: now(),
        });
      })();
      return this.getTransferCertificate(certificateId);
    },

    reprintTransferCertificate(id) {
      const certificateId = requiredText(id, "Transfer certificate id");
      const existing = this.getTransferCertificate(certificateId);
      if (!existing) throw new Error("Transfer certificate was not found.");
      if (existing.status === "Draft") {
        throw new Error("Issue the transfer certificate before reprinting it.");
      }
      db.prepare(`
        UPDATE transfer_certificates
        SET reprint_count = COALESCE(reprint_count, 0) + 1,
            updated_at = ?,
            sync_status = 'pending'
        WHERE id = ? AND deleted_at IS NULL
      `).run(now(), certificateId);
      return this.getTransferCertificate(certificateId);
    },

    cancelTransferCertificate(id, reason) {
      const certificateId = requiredText(id, "Transfer certificate id");
      const cancellationReason = requiredText(reason, "Cancellation reason");
      const existing = this.getTransferCertificate(certificateId);
      if (!existing) throw new Error("Transfer certificate was not found.");
      if (existing.status === "Cancelled") {
        throw new Error("This transfer certificate is already cancelled.");
      }
      db.prepare(`
        UPDATE transfer_certificates
        SET status = 'Cancelled',
            cancelled_at = @cancelledAt,
            cancellation_reason = @reason,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id AND deleted_at IS NULL
      `).run({
        id: certificateId,
        reason: cancellationReason,
        cancelledAt: now(),
        updatedAt: now(),
      });
      return this.getTransferCertificate(certificateId);
    },

    markStudentTransferredFromCertificate(id) {
      const certificate = this.getTransferCertificate(id);
      if (!certificate) throw new Error("Transfer certificate was not found.");
      if (certificate.status !== "Issued") {
        throw new Error("Only an issued transfer certificate can mark a student transferred.");
      }
      db.prepare(`
        UPDATE students
        SET status = 'Inactive',
            updated_at = ?,
            sync_status = 'pending'
        WHERE id = ?
          AND deleted_at IS NULL
      `).run(now(), certificate.studentId);
      return studentFromRow(getStudentStatement.get(certificate.studentId));
    },

    getFeeReceiptPrintData(paymentId) {
      return buildFeeReceiptPrintData(paymentId);
    },

    recordFeeReceiptPrint(paymentId) {
      const data = buildFeeReceiptPrintData(paymentId);
      return { success: true, receiptNo: data.payment.receiptNo };
    },

    getSchoolSettings() {
      const row = db
        .prepare("SELECT * FROM school_settings WHERE id = ?")
        .get(DEFAULT_SETTINGS_ID);
      return settingsFromRow(row);
    },

    getCommunicationGatewaySettings() {
      const row = db
        .prepare("SELECT * FROM communication_gateway_settings WHERE id = ?")
        .get(DEFAULT_SETTINGS_ID);
      return communicationGatewayFromRow(row);
    },

    saveCommunicationGatewaySettings(input = {}) {
      const existing = this.getCommunicationGatewaySettings();
      const timestamp = now();
      db.prepare(`
        INSERT INTO communication_gateway_settings (
          id, gateway_url, encrypted_device_token, token_storage, token_prefix,
          connection_status, provider_mode, whatsapp_status, sms_status, last_success_at,
          last_error, created_at, updated_at
        ) VALUES (
          @id, @gatewayUrl, @encryptedDeviceToken, @tokenStorage, @tokenPrefix,
          @connectionStatus, @providerMode, @whatsappStatus, @smsStatus, @lastSuccessAt,
          @lastError, @createdAt, @updatedAt
        )
        ON CONFLICT(id) DO UPDATE SET
          gateway_url = excluded.gateway_url,
          encrypted_device_token = excluded.encrypted_device_token,
          token_storage = excluded.token_storage,
          token_prefix = excluded.token_prefix,
          connection_status = excluded.connection_status,
          provider_mode = excluded.provider_mode,
          last_error = excluded.last_error,
          updated_at = excluded.updated_at
      `).run({
        id: DEFAULT_SETTINGS_ID,
        gatewayUrl:
          input.gatewayUrl === undefined
            ? existing.gatewayUrl
            : optionalText(input.gatewayUrl),
        encryptedDeviceToken:
          input.encryptedDeviceToken === undefined
            ? existing.encryptedDeviceToken || null
            : optionalText(input.encryptedDeviceToken) || null,
        tokenStorage:
          input.tokenStorage === undefined
            ? existing.tokenStorage
            : optionalText(input.tokenStorage),
        tokenPrefix:
          input.tokenPrefix === undefined
            ? existing.tokenPrefix
            : optionalText(input.tokenPrefix),
        connectionStatus:
          input.connectionStatus === undefined
            ? existing.connectionStatus
            : optionalText(input.connectionStatus) || "Not configured",
        providerMode:
          input.providerMode === undefined
            ? existing.providerMode || "Unknown"
            : optionalText(input.providerMode) || "Unknown",
        whatsappStatus: existing.whatsappStatus || "Unknown",
        smsStatus: existing.smsStatus || "Unknown",
        lastSuccessAt: existing.lastSuccessAt ?? null,
        lastError:
          input.lastError === undefined
            ? existing.lastError
            : optionalText(input.lastError),
        createdAt: existing.createdAt || timestamp,
        updatedAt: timestamp,
      });
      return this.getCommunicationGatewaySettings();
    },

    updateCommunicationGatewayStatus(input = {}) {
      const timestamp = now();
      db.prepare(`
        UPDATE communication_gateway_settings
        SET connection_status = @connectionStatus,
            provider_mode = @providerMode,
            whatsapp_status = @whatsappStatus,
            sms_status = @smsStatus,
            last_success_at = @lastSuccessAt,
            last_error = @lastError,
            updated_at = @updatedAt
        WHERE id = @id
      `).run({
        id: DEFAULT_SETTINGS_ID,
        connectionStatus: optionalText(input.connectionStatus) || "Unknown",
        providerMode: optionalText(input.providerMode) || "Unknown",
        whatsappStatus: optionalText(input.whatsappStatus) || "Unknown",
        smsStatus: optionalText(input.smsStatus) || "Unknown",
        lastSuccessAt: input.lastSuccessAt ?? null,
        lastError: optionalText(input.lastError),
        updatedAt: timestamp,
      });
      return this.getCommunicationGatewaySettings();
    },

    removeCommunicationGatewayToken() {
      const timestamp = now();
      db.prepare(`
        UPDATE communication_gateway_settings
        SET encrypted_device_token = NULL,
            token_storage = '',
            token_prefix = '',
            connection_status = 'Not configured',
            provider_mode = 'Unknown',
            whatsapp_status = 'Unknown',
            sms_status = 'Unknown',
            last_error = '',
            updated_at = ?
        WHERE id = ?
      `).run(timestamp, DEFAULT_SETTINGS_ID);
      return this.getCommunicationGatewaySettings();
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
      let receiptNo = "";
      db.transaction(() => {
        receiptNo = generateReceiptNumber(paymentDate);
        const cashierName = optionalText(input?.cashierName);
        db.prepare(`
          INSERT INTO fee_payments (
            id, receipt_no, student_id, student_name, admission_no, class_name,
            section, guardian_name, mobile, fee_type, amount, payment_mode,
            payment_date, notes, cashier_name, created_at, updated_at,
            status, reversed_at, reversed_by, reversal_reason, sync_status
          ) VALUES (
            @id, @receiptNo, @studentId, @studentName, @admissionNo, @className,
            @section, @guardianName, @mobile, @feeType, @amount, @paymentMode,
            @paymentDate, @notes, @cashierName, @createdAt, @updatedAt,
            'Active', NULL, NULL, NULL, 'pending'
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
        applyFeeInvoiceAllocations(
          db.prepare("SELECT * FROM fee_payments WHERE id = ?").get(id),
          input?.invoiceAllocations,
          input?.auditUser,
        );
      })();

      return paymentFromRow(
        db.prepare(`
          ${paymentSelect}
          WHERE fee_payments.id = ?
        `).get(id),
      );
    },

    getDiscountTypes() {
      return db
        .prepare(`
          SELECT *
          FROM discount_types
          WHERE deleted_at IS NULL
          ORDER BY name
        `)
        .all()
        .map(discountTypeFromRow);
    },

    createDiscountType(input) {
      const mode = normalizeDiscountMode(input?.discountMode);
      const defaultValue = validateDiscountValue(
        mode,
        input?.defaultValue ?? 0,
        "Default value",
      );
      const status = masterStatus(input?.status);
      const id = crypto.randomUUID();
      const timestamp = now();
      db.prepare(`
        INSERT INTO discount_types (
          id, name, discount_mode, default_value, description, status,
          created_at, updated_at, deleted_at, sync_status
        ) VALUES (
          @id, @name, @discountMode, @defaultValue, @description, @status,
          @createdAt, @updatedAt, NULL, 'pending'
        )
      `).run({
        id,
        name: requiredText(input?.name, "Discount type name"),
        discountMode: mode,
        defaultValue,
        description: optionalText(input?.description),
        status,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      insertAuditLog(
        input?.auditUser,
        "Discount type created",
        "Fees",
        `Created discount type ${requiredText(input?.name, "Discount type name")}.`,
      );
      return discountTypeFromRow(
        db.prepare("SELECT * FROM discount_types WHERE id = ?").get(id),
      );
    },

    updateDiscountType(id, input) {
      const discountTypeId = requiredText(id, "Discount type id");
      const existing = db
        .prepare("SELECT * FROM discount_types WHERE id = ? AND deleted_at IS NULL")
        .get(discountTypeId);
      if (!existing) {
        throw new Error("Discount type was not found.");
      }
      const mode = input?.discountMode
        ? normalizeDiscountMode(input.discountMode)
        : existing.discount_mode;
      const defaultValue =
        input?.defaultValue === undefined
          ? Number(existing.default_value ?? 0)
          : validateDiscountValue(mode, input.defaultValue, "Default value");
      const timestamp = now();
      db.prepare(`
        UPDATE discount_types
        SET name = @name,
            discount_mode = @discountMode,
            default_value = @defaultValue,
            description = @description,
            status = @status,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id AND deleted_at IS NULL
      `).run({
        id: discountTypeId,
        name:
          input?.name === undefined
            ? existing.name
            : requiredText(input.name, "Discount type name"),
        discountMode: mode,
        defaultValue,
        description:
          input?.description === undefined
            ? existing.description ?? ""
            : optionalText(input.description),
        status:
          input?.status === undefined
            ? existing.status
            : masterStatus(input.status),
        updatedAt: timestamp,
      });
      insertAuditLog(
        input?.auditUser,
        "Discount type updated",
        "Fees",
        `Updated discount type ${discountTypeId}.`,
      );
      return discountTypeFromRow(
        db.prepare("SELECT * FROM discount_types WHERE id = ?").get(discountTypeId),
      );
    },

    deleteDiscountType(id, auditUser) {
      const discountTypeId = requiredText(id, "Discount type id");
      const existing = db
        .prepare("SELECT * FROM discount_types WHERE id = ? AND deleted_at IS NULL")
        .get(discountTypeId);
      if (!existing) return { success: false };
      const timestamp = now();
      db.prepare(`
        UPDATE discount_types
        SET deleted_at = ?,
            updated_at = ?,
            sync_status = 'pending'
        WHERE id = ? AND deleted_at IS NULL
      `).run(timestamp, timestamp, discountTypeId);
      insertAuditLog(
        auditUser,
        "Discount type deleted",
        "Fees",
        `Soft-deleted discount type ${existing.name}.`,
      );
      return { success: true };
    },

    getStudentDiscounts(filter = {}) {
      const clauses = ["deleted_at IS NULL"];
      const params = {};
      const studentId = optionalText(filter?.studentId);
      if (studentId) {
        clauses.push("student_id = @studentId");
        params.studentId = studentId;
      }
      const academicSessionId = optionalText(filter?.academicSessionId);
      if (academicSessionId) {
        clauses.push("COALESCE(academic_session_id, '') = @academicSessionId");
        params.academicSessionId = academicSessionId;
      }
      const status = optionalText(filter?.status);
      if (status && status !== "All") {
        clauses.push("status = @status");
        params.status = masterStatus(status);
      }
      return db
        .prepare(`
          SELECT *
          FROM student_discounts
          WHERE ${clauses.join(" AND ")}
          ORDER BY created_at DESC
        `)
        .all(params)
        .map(studentDiscountFromRow);
    },

    createStudentDiscount(input) {
      const studentId = requiredText(input?.studentId, "Student");
      const student = getStudentStatement.get(studentId);
      if (!student) {
        throw new Error("The selected student was not found.");
      }
      const discountTypeId = requiredText(input?.discountTypeId, "Discount type");
      const discountType = db
        .prepare("SELECT * FROM discount_types WHERE id = ? AND deleted_at IS NULL")
        .get(discountTypeId);
      if (!discountType) {
        throw new Error("Discount type was not found.");
      }
      const mode = input?.discountMode
        ? normalizeDiscountMode(input.discountMode)
        : discountType.discount_mode;
      const discountValue =
        input?.discountValue === undefined
          ? validateDiscountValue(mode, discountType.default_value, "Discount value")
          : validateDiscountValue(mode, input.discountValue, "Discount value");

      let feeHeadId = "";
      let feeHeadName = "";
      const requestedFeeHeadId = optionalText(input?.feeHeadId);
      if (requestedFeeHeadId) {
        const feeHead = getActiveFeeHeadById.get(requestedFeeHeadId);
        if (!feeHead) {
          throw new Error("Select an active fee head for the discount restriction.");
        }
        feeHeadId = feeHead.id;
        feeHeadName = feeHead.name;
      }

      let academicSessionId = "";
      let academicSessionName = "";
      const requestedSessionId = optionalText(input?.academicSessionId);
      if (requestedSessionId) {
        const session = db
          .prepare("SELECT * FROM academic_sessions WHERE id = ? AND deleted_at IS NULL")
          .get(requestedSessionId);
        if (!session) {
          throw new Error("Academic session was not found.");
        }
        academicSessionId = session.id;
        academicSessionName = session.session_name;
      }

      const startDate = normalizeOptionalDate(input?.startDate, "Start date");
      const endDate = normalizeOptionalDate(input?.endDate, "End date");
      if (startDate && endDate && startDate > endDate) {
        throw new Error("Discount start date cannot be after end date.");
      }

      const id = crypto.randomUUID();
      const timestamp = now();
      db.prepare(`
        INSERT INTO student_discounts (
          id, student_id, admission_no, student_name, discount_type_id,
          discount_type_name, discount_mode, discount_value, fee_head_id,
          fee_head_name, academic_session_id, academic_session_name,
          start_date, end_date, reason, status, approved_by, created_at,
          updated_at, deleted_at, sync_status
        ) VALUES (
          @id, @studentId, @admissionNo, @studentName, @discountTypeId,
          @discountTypeName, @discountMode, @discountValue, @feeHeadId,
          @feeHeadName, @academicSessionId, @academicSessionName,
          @startDate, @endDate, @reason, @status, @approvedBy, @createdAt,
          @updatedAt, NULL, 'pending'
        )
      `).run({
        id,
        studentId: student.id,
        admissionNo: student.admission_no ?? "",
        studentName: student.name,
        discountTypeId: discountType.id,
        discountTypeName: discountType.name,
        discountMode: mode,
        discountValue,
        feeHeadId: feeHeadId || null,
        feeHeadName,
        academicSessionId: academicSessionId || null,
        academicSessionName,
        startDate,
        endDate,
        reason: optionalText(input?.reason),
        status: masterStatus(input?.status),
        approvedBy: optionalText(input?.approvedBy),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      insertAuditLog(
        input?.auditUser,
        "Student discount assigned",
        "Fees",
        `Assigned ${discountType.name} to ${student.name}.`,
      );
      return studentDiscountFromRow(
        db.prepare("SELECT * FROM student_discounts WHERE id = ?").get(id),
      );
    },

    updateStudentDiscount(id, input) {
      const studentDiscountId = requiredText(id, "Student discount id");
      const existing = db
        .prepare("SELECT * FROM student_discounts WHERE id = ? AND deleted_at IS NULL")
        .get(studentDiscountId);
      if (!existing) {
        throw new Error("Student discount was not found.");
      }

      const hasOwn = (key) =>
        Object.prototype.hasOwnProperty.call(input ?? {}, key);
      const studentId = hasOwn("studentId")
        ? requiredText(input.studentId, "Student")
        : existing.student_id;
      const student = getStudentStatement.get(studentId);
      if (!student) {
        throw new Error("The selected student was not found.");
      }
      const discountTypeId = hasOwn("discountTypeId")
        ? requiredText(input.discountTypeId, "Discount type")
        : existing.discount_type_id;
      const discountType = db
        .prepare("SELECT * FROM discount_types WHERE id = ? AND deleted_at IS NULL")
        .get(discountTypeId);
      if (!discountType) {
        throw new Error("Discount type was not found.");
      }
      const mode = hasOwn("discountMode")
        ? normalizeDiscountMode(input.discountMode)
        : hasOwn("discountTypeId")
          ? discountType.discount_mode
          : existing.discount_mode;
      const discountValue = hasOwn("discountValue")
        ? validateDiscountValue(mode, input.discountValue, "Discount value")
        : hasOwn("discountTypeId")
          ? validateDiscountValue(mode, discountType.default_value, "Discount value")
          : Number(existing.discount_value ?? 0);

      let feeHeadId = existing.fee_head_id ?? "";
      let feeHeadName = existing.fee_head_name ?? "";
      if (hasOwn("feeHeadId")) {
        const requestedFeeHeadId = optionalText(input.feeHeadId);
        if (requestedFeeHeadId) {
          const feeHead = getActiveFeeHeadById.get(requestedFeeHeadId);
          if (!feeHead) {
            throw new Error("Select an active fee head for the discount restriction.");
          }
          feeHeadId = feeHead.id;
          feeHeadName = feeHead.name;
        } else {
          feeHeadId = "";
          feeHeadName = "";
        }
      }

      let academicSessionId = existing.academic_session_id ?? "";
      let academicSessionName = existing.academic_session_name ?? "";
      if (hasOwn("academicSessionId")) {
        const requestedSessionId = optionalText(input.academicSessionId);
        if (requestedSessionId) {
          const session = db
            .prepare("SELECT * FROM academic_sessions WHERE id = ? AND deleted_at IS NULL")
            .get(requestedSessionId);
          if (!session) {
            throw new Error("Academic session was not found.");
          }
          academicSessionId = session.id;
          academicSessionName = session.session_name;
        } else {
          academicSessionId = "";
          academicSessionName = "";
        }
      }

      const startDate = hasOwn("startDate")
        ? normalizeOptionalDate(input.startDate, "Start date")
        : existing.start_date ?? "";
      const endDate = hasOwn("endDate")
        ? normalizeOptionalDate(input.endDate, "End date")
        : existing.end_date ?? "";
      if (startDate && endDate && startDate > endDate) {
        throw new Error("Discount start date cannot be after end date.");
      }

      const timestamp = now();
      db.prepare(`
        UPDATE student_discounts
        SET student_id = @studentId,
            admission_no = @admissionNo,
            student_name = @studentName,
            discount_type_id = @discountTypeId,
            discount_type_name = @discountTypeName,
            discount_mode = @discountMode,
            discount_value = @discountValue,
            fee_head_id = @feeHeadId,
            fee_head_name = @feeHeadName,
            academic_session_id = @academicSessionId,
            academic_session_name = @academicSessionName,
            start_date = @startDate,
            end_date = @endDate,
            reason = @reason,
            status = @status,
            approved_by = @approvedBy,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id AND deleted_at IS NULL
      `).run({
        id: studentDiscountId,
        studentId: student.id,
        admissionNo: student.admission_no ?? "",
        studentName: student.name,
        discountTypeId: discountType.id,
        discountTypeName: discountType.name,
        discountMode: mode,
        discountValue,
        feeHeadId: feeHeadId || null,
        feeHeadName,
        academicSessionId: academicSessionId || null,
        academicSessionName,
        startDate,
        endDate,
        reason: hasOwn("reason") ? optionalText(input.reason) : existing.reason ?? "",
        status: hasOwn("status") ? masterStatus(input.status) : existing.status,
        approvedBy: hasOwn("approvedBy")
          ? optionalText(input.approvedBy)
          : existing.approved_by ?? "",
        updatedAt: timestamp,
      });
      insertAuditLog(
        input?.auditUser,
        "Student discount updated",
        "Fees",
        `Updated discount assignment for ${student.name}.`,
      );
      return studentDiscountFromRow(
        db.prepare("SELECT * FROM student_discounts WHERE id = ?").get(studentDiscountId),
      );
    },

    deleteStudentDiscount(id, auditUser) {
      const studentDiscountId = requiredText(id, "Student discount id");
      const existing = db
        .prepare("SELECT * FROM student_discounts WHERE id = ? AND deleted_at IS NULL")
        .get(studentDiscountId);
      if (!existing) return { success: false };
      const timestamp = now();
      db.prepare(`
        UPDATE student_discounts
        SET deleted_at = ?,
            updated_at = ?,
            sync_status = 'pending'
        WHERE id = ? AND deleted_at IS NULL
      `).run(timestamp, timestamp, studentDiscountId);
      insertAuditLog(
        auditUser,
        "Student discount deleted",
        "Fees",
        `Soft-deleted discount assignment for ${existing.student_name}.`,
      );
      return { success: true };
    },

    getFeeInvoicePreview(input) {
      return buildFeeInvoicePreview(input);
    },

    createFeeInvoice(input) {
      const preview = buildFeeInvoicePreview(input);
      if (preview.possibleDuplicates.length > 0 && !input?.allowDuplicate) {
        throw new Error(
          "A non-cancelled invoice already exists for this student, session and billing period. Confirm duplicate generation to continue.",
        );
      }

      const id = crypto.randomUUID();
      const timestamp = now();
      db.transaction(() => {
        const duplicates = findPossibleDuplicateInvoices(
          preview.studentId,
          preview.academicSessionId,
          preview.billingPeriod,
        );
        if (duplicates.length > 0 && !input?.allowDuplicate) {
          throw new Error(
            "A non-cancelled invoice already exists for this student, session and billing period.",
          );
        }
        const invoiceNo = generateInvoiceNumber(preview.invoiceDate);
        const notes = [
          optionalText(input?.notes),
          preview.adjustmentAmount !== 0
            ? `Adjustment reason: ${preview.adjustmentReason}`
            : "",
        ]
          .filter(Boolean)
          .join("\n");
        db.prepare(`
          INSERT INTO fee_invoices (
            id, invoice_no, student_id, admission_no, student_name,
            class_name, section, academic_session_id, academic_session_name,
            billing_period, invoice_date, due_date, subtotal, discount_amount,
            previous_due, late_fee, adjustment_amount, grand_total,
            paid_amount, balance_amount, status, notes, generated_by,
            created_at, updated_at, cancelled_at, cancelled_by,
            cancellation_reason, sync_status
          ) VALUES (
            @id, @invoiceNo, @studentId, @admissionNo, @studentName,
            @className, @section, @academicSessionId, @academicSessionName,
            @billingPeriod, @invoiceDate, @dueDate, @subtotal, @discountAmount,
            @previousDue, @lateFee, @adjustmentAmount, @grandTotal,
            0, @balanceAmount, @status, @notes, @generatedBy,
            @createdAt, @updatedAt, NULL, NULL, NULL, 'pending'
          )
        `).run({
          id,
          invoiceNo,
          studentId: preview.studentId,
          admissionNo: preview.admissionNo,
          studentName: preview.studentName,
          className: preview.className,
          section: preview.section,
          academicSessionId: preview.academicSessionId,
          academicSessionName: preview.academicSessionName,
          billingPeriod: preview.billingPeriod,
          invoiceDate: preview.invoiceDate,
          dueDate: preview.dueDate,
          subtotal: preview.subtotal,
          discountAmount: preview.discountAmount,
          previousDue: preview.previousDue,
          lateFee: preview.lateFee,
          adjustmentAmount: preview.adjustmentAmount,
          grandTotal: preview.grandTotal,
          balanceAmount: preview.grandTotal,
          status: preview.grandTotal === 0 ? "Paid" : "Unpaid",
          notes,
          generatedBy: optionalText(input?.generatedBy),
          createdAt: timestamp,
          updatedAt: timestamp,
        });

        for (const item of preview.items) {
          db.prepare(`
            INSERT INTO fee_invoice_items (
              id, invoice_id, fee_head_id, fee_head_name, description,
              quantity, unit_amount, gross_amount, discount_amount,
              net_amount, display_order, created_at, updated_at, sync_status
            ) VALUES (
              @id, @invoiceId, @feeHeadId, @feeHeadName, @description,
              @quantity, @unitAmount, @grossAmount, @discountAmount,
              @netAmount, @displayOrder, @createdAt, @updatedAt, 'pending'
            )
          `).run({
            id: crypto.randomUUID(),
            invoiceId: id,
            feeHeadId: item.feeHeadId,
            feeHeadName: item.feeHeadName,
            description: item.description,
            quantity: item.quantity,
            unitAmount: item.unitAmount,
            grossAmount: item.grossAmount,
            discountAmount: item.discountAmount,
            netAmount: item.netAmount,
            displayOrder: item.displayOrder,
            createdAt: timestamp,
            updatedAt: timestamp,
          });
        }

        insertAuditLog(
          input?.auditUser,
          "Invoice generated",
          "Fees",
          `Generated ${invoiceNo} for ${preview.studentName}. No cash income transaction was created.`,
        );
        if (preview.adjustmentAmount !== 0) {
          insertAuditLog(
            input?.auditUser,
            "Manual adjustment applied",
            "Fees",
            `Applied ${preview.adjustmentAmount} adjustment to ${invoiceNo}. Reason: ${preview.adjustmentReason}.`,
          );
        }
      })();

      return getFeeInvoiceByIdInternal(id);
    },

    getFeeInvoices(filter = {}) {
      return queryFeeInvoiceRows(filter).map((row) => feeInvoiceFromRow(row));
    },

    getFeeInvoiceById(id) {
      return getFeeInvoiceByIdInternal(id);
    },

    cancelFeeInvoice(id, reason, actorName, auditUser) {
      const invoiceId = requiredText(id, "Invoice id");
      const cancellationReason = requiredText(reason, "Cancellation reason");
      db.transaction(() => {
        const invoice = db
          .prepare("SELECT * FROM fee_invoices WHERE id = ?")
          .get(invoiceId);
        if (!invoice) {
          throw new Error("Fee invoice was not found.");
        }
        if (invoice.status === "Cancelled") {
          throw new Error("This invoice is already cancelled.");
        }
        const activeAllocated = Number(
          db
            .prepare(`
              SELECT COALESCE(SUM(fee_invoice_allocations.allocated_amount), 0) AS amount
              FROM fee_invoice_allocations
              JOIN fee_payments
                ON fee_payments.id = fee_invoice_allocations.fee_payment_id
              WHERE fee_invoice_allocations.invoice_id = ?
                AND fee_invoice_allocations.reversed_at IS NULL
                AND COALESCE(fee_payments.status, 'Active') <> 'Reversed'
            `)
            .get(invoiceId)?.amount ?? 0,
        );
        if (activeAllocated > 0) {
          throw new Error(
            "Invoices with allocated payments cannot be cancelled until the payment is safely reversed.",
          );
        }
        const timestamp = now();
        db.prepare(`
          UPDATE fee_invoices
          SET status = 'Cancelled',
              balance_amount = 0,
              cancelled_at = ?,
              cancelled_by = ?,
              cancellation_reason = ?,
              updated_at = ?,
              sync_status = 'pending'
          WHERE id = ?
        `).run(
          timestamp,
          optionalText(actorName),
          cancellationReason,
          timestamp,
          invoiceId,
        );
        insertAuditLog(
          auditUser,
          "Invoice cancelled",
          "Fees",
          `Cancelled ${invoice.invoice_no}. Reason: ${cancellationReason}.`,
        );
      })();
      return getFeeInvoiceByIdInternal(invoiceId);
    },

    refreshFeeInvoiceStatus(id) {
      return refreshFeeInvoiceStatusInternal(id);
    },

    allocateFeePaymentToInvoices(input) {
      const feePaymentId = requiredText(input?.feePaymentId, "Fee payment id");
      let result = null;
      db.transaction(() => {
        const payment = db
          .prepare("SELECT * FROM fee_payments WHERE id = ?")
          .get(feePaymentId);
        if (!payment) {
          throw new Error("Fee payment was not found.");
        }
        const allocations = applyFeeInvoiceAllocations(
          payment,
          input?.allocations,
          input?.auditUser,
        );
        result = {
          allocations,
          invoices: [
            ...new Set(allocations.map((allocation) => allocation.invoiceId)),
          ].map((invoiceId) => getFeeInvoiceByIdInternal(invoiceId)),
        };
      })();
      return result;
    },

    getStudentOutstandingInvoices(studentId) {
      const id = requiredText(studentId, "Student id");
      const invoiceIds = db
        .prepare(`
          SELECT id
          FROM fee_invoices
          WHERE student_id = ?
            AND status <> 'Cancelled'
        `)
        .all(id)
        .map((row) => row.id);
      for (const invoiceId of invoiceIds) {
        refreshFeeInvoiceStatusInternal(invoiceId);
      }
      return db
        .prepare(`
          SELECT *
          FROM fee_invoices
          WHERE student_id = ?
            AND status IN ('Unpaid', 'Partially Paid', 'Overdue')
            AND balance_amount > 0
          ORDER BY due_date, invoice_date, created_at
        `)
        .all(id)
        .map((row) => feeInvoiceFromRow(row));
    },

    getFeeInvoiceSummary(filter = {}) {
      const invoices = queryFeeInvoiceRows(filter).map((row) =>
        feeInvoiceFromRow(row),
      );
      const activeInvoices = invoices.filter(
        (invoice) => invoice.status !== "Cancelled",
      );
      const total = (field) =>
        activeInvoices.reduce((sum, invoice) => sum + invoice[field], 0);
      return {
        invoiceCount: invoices.length,
        activeInvoiceCount: activeInvoices.length,
        cancelledInvoiceCount: invoices.length - activeInvoices.length,
        unpaidInvoiceCount: activeInvoices.filter(
          (invoice) => invoice.status === "Unpaid",
        ).length,
        partiallyPaidInvoiceCount: activeInvoices.filter(
          (invoice) => invoice.status === "Partially Paid",
        ).length,
        paidInvoiceCount: activeInvoices.filter(
          (invoice) => invoice.status === "Paid",
        ).length,
        overdueInvoiceCount: activeInvoices.filter(
          (invoice) => invoice.status === "Overdue",
        ).length,
        subtotal: total("subtotal"),
        discountAmount: total("discountAmount"),
        previousDue: total("previousDue"),
        lateFee: total("lateFee"),
        adjustmentAmount: total("adjustmentAmount"),
        grandTotal: total("grandTotal"),
        paidAmount: total("paidAmount"),
        balanceAmount: total("balanceAmount"),
      };
    },

    getFeeInvoiceAccountsReport(filter = {}) {
      const invoices = queryFeeInvoiceRows(filter)
        .map((row) => getFeeInvoiceByIdInternal(row.id))
        .filter(Boolean)
        .filter((invoice) => invoice.status !== "Cancelled");
      const feeHeadBreakdown = new Map();
      for (const invoice of invoices) {
        const itemNetTotal = invoice.items.reduce(
          (sum, item) => sum + item.netAmount,
          0,
        );
        let remainingCollectedForItems = Math.min(
          invoice.paidAmount,
          itemNetTotal,
        );
        for (const item of invoice.items) {
          const key = item.feeHeadId || item.feeHeadName;
          if (!feeHeadBreakdown.has(key)) {
            feeHeadBreakdown.set(key, {
              feeHeadId: item.feeHeadId,
              feeHeadName: item.feeHeadName,
              invoicedAmount: 0,
              collectedAmount: 0,
              outstandingAmount: 0,
              discountAmount: 0,
            });
          }
          const row = feeHeadBreakdown.get(key);
          const collectedAmount = Math.min(
            item.netAmount,
            remainingCollectedForItems,
          );
          remainingCollectedForItems -= collectedAmount;
          row.invoicedAmount += item.netAmount;
          row.collectedAmount += collectedAmount;
          row.outstandingAmount += Math.max(item.netAmount - collectedAmount, 0);
          row.discountAmount += item.discountAmount;
        }
      }

      const summary = {
        invoicedAmount: invoices.reduce(
          (sum, invoice) => sum + invoice.grandTotal,
          0,
        ),
        collectedAmount: invoices.reduce(
          (sum, invoice) => sum + invoice.paidAmount,
          0,
        ),
        outstandingAmount: invoices.reduce(
          (sum, invoice) => sum + invoice.balanceAmount,
          0,
        ),
        discountAmount: invoices.reduce(
          (sum, invoice) => sum + invoice.discountAmount,
          0,
        ),
        previousDue: invoices.reduce(
          (sum, invoice) => sum + invoice.previousDue,
          0,
        ),
      };

      return {
        summary,
        feeHeads: [...feeHeadBreakdown.values()].sort((left, right) =>
          left.feeHeadName.localeCompare(right.feeHeadName),
        ),
      };
    },

    getStudentFeeLedger(studentId) {
      const id = requiredText(studentId, "Student id");
      const invoices = this.getFeeInvoices({ studentId: id }).map((invoice) =>
        getFeeInvoiceByIdInternal(invoice.id),
      );
      const payments = db
        .prepare(`
          ${paymentSelect}
          WHERE fee_payments.student_id = ?
          ORDER BY fee_payments.payment_date, fee_payments.created_at
        `)
        .all(id)
        .map(paymentFromRow);
      const entries = [
        ...invoices.map((invoice) => ({
          id: invoice.id,
          date: invoice.invoiceDate,
          type: "Invoice",
          referenceNo: invoice.invoiceNo,
          description: `${invoice.billingPeriod} invoice`,
          debit: invoice.status === "Cancelled" ? 0 : invoice.grandTotal,
          credit: 0,
          status: invoice.status,
        })),
        ...payments.map((payment) => ({
          id: payment.id,
          date: payment.paymentDate,
          type: payment.status === "Reversed" ? "Payment Reversed" : "Payment",
          referenceNo: payment.receiptNo,
          description: payment.feeType,
          debit: payment.status === "Reversed" ? payment.amount : 0,
          credit: payment.status === "Reversed" ? 0 : payment.amount,
          status: payment.status,
        })),
      ].sort((left, right) =>
        `${left.date}-${left.referenceNo}`.localeCompare(
          `${right.date}-${right.referenceNo}`,
        ),
      );
      let balance = 0;
      return entries.map((entry) => {
        balance += entry.debit - entry.credit;
        return { ...entry, balance };
      });
    },

    getFeeInvoiceAccountMappings() {
      return db
        .prepare(`
          SELECT *
          FROM fee_invoice_account_mappings
          WHERE deleted_at IS NULL
          ORDER BY fee_head_name
        `)
        .all()
        .map(feeInvoiceAccountMappingFromRow);
    },

    saveFeeInvoiceAccountMapping(input) {
      const feeHeadId = requiredText(input?.feeHeadId, "Fee head");
      const accountCategoryId = requiredText(
        input?.accountCategoryId,
        "Income account category",
      );
      const feeHead = getActiveFeeHeadById.get(feeHeadId);
      if (!feeHead) {
        throw new Error("Select an active fee head.");
      }
      const accountCategory = db
        .prepare(`
          SELECT *
          FROM account_categories
          WHERE id = ?
            AND type = 'Income'
            AND status = 'Active'
            AND deleted_at IS NULL
        `)
        .get(accountCategoryId);
      if (!accountCategory) {
        throw new Error("Select an active income account category.");
      }
      const timestamp = now();
      const existing = db
        .prepare(`
          SELECT *
          FROM fee_invoice_account_mappings
          WHERE fee_head_id = ?
            AND deleted_at IS NULL
        `)
        .get(feeHead.id);
      if (existing) {
        db.prepare(`
          UPDATE fee_invoice_account_mappings
          SET fee_head_name = @feeHeadName,
              account_category_id = @accountCategoryId,
              account_category_name = @accountCategoryName,
              status = @status,
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE id = @id AND deleted_at IS NULL
        `).run({
          id: existing.id,
          feeHeadName: feeHead.name,
          accountCategoryId: accountCategory.id,
          accountCategoryName: accountCategory.name,
          status: masterStatus(input?.status),
          updatedAt: timestamp,
        });
        insertAuditLog(
          input?.auditUser,
          "Fee invoice account mapping updated",
          "Accounts",
          `Mapped ${feeHead.name} to ${accountCategory.name}.`,
        );
        return feeInvoiceAccountMappingFromRow(
          db
            .prepare("SELECT * FROM fee_invoice_account_mappings WHERE id = ?")
            .get(existing.id),
        );
      }

      const id = crypto.randomUUID();
      db.prepare(`
        INSERT INTO fee_invoice_account_mappings (
          id, fee_head_id, fee_head_name, account_category_id,
          account_category_name, status, created_at, updated_at, deleted_at,
          sync_status
        ) VALUES (
          @id, @feeHeadId, @feeHeadName, @accountCategoryId,
          @accountCategoryName, @status, @createdAt, @updatedAt, NULL,
          'pending'
        )
      `).run({
        id,
        feeHeadId: feeHead.id,
        feeHeadName: feeHead.name,
        accountCategoryId: accountCategory.id,
        accountCategoryName: accountCategory.name,
        status: masterStatus(input?.status),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      insertAuditLog(
        input?.auditUser,
        "Fee invoice account mapping created",
        "Accounts",
        `Mapped ${feeHead.name} to ${accountCategory.name}.`,
      );
      return feeInvoiceAccountMappingFromRow(
        db.prepare("SELECT * FROM fee_invoice_account_mappings WHERE id = ?").get(id),
      );
    },

    deleteFeeInvoiceAccountMapping(id, auditUser) {
      const mappingId = requiredText(id, "Account mapping id");
      const existing = db
        .prepare(`
          SELECT *
          FROM fee_invoice_account_mappings
          WHERE id = ? AND deleted_at IS NULL
        `)
        .get(mappingId);
      if (!existing) return { success: false };
      const timestamp = now();
      db.prepare(`
        UPDATE fee_invoice_account_mappings
        SET deleted_at = ?,
            updated_at = ?,
            sync_status = 'pending'
        WHERE id = ? AND deleted_at IS NULL
      `).run(timestamp, timestamp, mappingId);
      insertAuditLog(
        auditUser,
        "Fee invoice account mapping deleted",
        "Accounts",
        `Removed mapping for ${existing.fee_head_name}.`,
      );
      return { success: true };
    },

    reverseFeePayment(id, reason, actorName, auditUser) {
      return db.transaction(() =>
        reverseFeePaymentInternal(id, reason, actorName, auditUser),
      )();
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

    getEmployeeAttendanceByDate(date, filters = {}) {
      const attendanceDate = normalizeDate(date, "Attendance date");
      return queryEmployeeAttendanceRows({
        ...filters,
        date: attendanceDate,
      });
    },

    getEmployeeAttendanceByRange(filter = {}) {
      return queryEmployeeAttendanceRows(filter);
    },

    saveEmployeeAttendanceBulk(records, markedBy = "", auditUser = null) {
      if (!Array.isArray(records)) {
        throw new Error("Employee attendance records must be an array.");
      }
      if (records.length === 0) {
        return [];
      }

      const savedIds = db.transaction(() =>
        records.map((input) => {
          const employeeId = requiredText(input?.employeeId, "Employee");
          const employee = db
            .prepare(`
              SELECT *
              FROM employees
              WHERE id = ?
                AND status = 'Active'
                AND deleted_at IS NULL
            `)
            .get(employeeId);
          if (!employee) {
            throw new Error("A selected active employee was not found.");
          }
          const attendanceDate = normalizeDate(
            input?.attendanceDate,
            "Attendance date",
          );
          const status = normalizeEmployeeAttendanceStatus(input?.status);
          const existing = db
            .prepare(`
              SELECT *
              FROM employee_attendance
              WHERE employee_id = ?
                AND attendance_date = ?
                AND deleted_at IS NULL
            `)
            .get(employeeId, attendanceDate);
          const timestamp = now();
          const id = existing?.id ?? crypto.randomUUID();
          const payload = {
            id,
            employeeId,
            employeeCode: employee.employee_no ?? "",
            employeeName: employee.name,
            department: employee.department ?? "",
            designation: employee.designation ?? "",
            attendanceDate,
            status,
            checkInTime: normalizeOptionalTimeValue(
              input?.checkInTime,
              "Check-in time",
            ),
            checkOutTime: normalizeOptionalTimeValue(
              input?.checkOutTime,
              "Check-out time",
            ),
            lateMinutes: wholeNumber(
              input?.lateMinutes ?? 0,
              "Late minutes",
              0,
            ),
            overtimeMinutes: wholeNumber(
              input?.overtimeMinutes ?? 0,
              "Overtime minutes",
              0,
            ),
            leaveType: optionalText(input?.leaveType),
            remarks: optionalText(input?.remarks),
            markedBy: optionalText(input?.markedBy) || optionalText(markedBy),
            createdAt: existing?.created_at ?? timestamp,
            updatedAt: timestamp,
          };

          if (existing) {
            db.prepare(`
              UPDATE employee_attendance
              SET employee_code = @employeeCode,
                  employee_name = @employeeName,
                  department = @department,
                  designation = @designation,
                  status = @status,
                  check_in_time = @checkInTime,
                  check_out_time = @checkOutTime,
                  late_minutes = @lateMinutes,
                  overtime_minutes = @overtimeMinutes,
                  leave_type = @leaveType,
                  remarks = @remarks,
                  marked_by = @markedBy,
                  updated_at = @updatedAt,
                  sync_status = 'pending'
              WHERE id = @id AND deleted_at IS NULL
            `).run(payload);
          } else {
            db.prepare(`
              INSERT INTO employee_attendance (
                id, employee_id, employee_code, employee_name, department,
                designation, attendance_date, status, check_in_time,
                check_out_time, late_minutes, overtime_minutes, leave_type,
                remarks, marked_by, created_at, updated_at, deleted_at,
                sync_status
              ) VALUES (
                @id, @employeeId, @employeeCode, @employeeName, @department,
                @designation, @attendanceDate, @status, @checkInTime,
                @checkOutTime, @lateMinutes, @overtimeMinutes, @leaveType,
                @remarks, @markedBy, @createdAt, @updatedAt, NULL,
                'pending'
              )
            `).run(payload);
          }
          return id;
        }),
      )();

      insertAuditLog(
        auditUser,
        "Employee attendance bulk saved",
        "Employee Attendance",
        `Saved ${savedIds.length} employee attendance record(s).`,
      );

      return savedIds.map((id) =>
        employeeAttendanceFromRow(
          db.prepare("SELECT * FROM employee_attendance WHERE id = ?").get(id),
        ),
      );
    },

    updateEmployeeAttendance(id, input, markedBy = "", auditUser = null) {
      const attendanceId = requiredText(id, "Employee attendance id");
      const existing = db
        .prepare(`
          SELECT *
          FROM employee_attendance
          WHERE id = ? AND deleted_at IS NULL
        `)
        .get(attendanceId);
      if (!existing) {
        throw new Error("Employee attendance record was not found.");
      }

      const status =
        input?.status === undefined
          ? existing.status
          : normalizeEmployeeAttendanceStatus(input.status);
      const timestamp = now();
      db.prepare(`
        UPDATE employee_attendance
        SET status = @status,
            check_in_time = @checkInTime,
            check_out_time = @checkOutTime,
            late_minutes = @lateMinutes,
            overtime_minutes = @overtimeMinutes,
            leave_type = @leaveType,
            remarks = @remarks,
            marked_by = @markedBy,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id AND deleted_at IS NULL
      `).run({
        id: attendanceId,
        status,
        checkInTime:
          input?.checkInTime === undefined
            ? existing.check_in_time ?? ""
            : normalizeOptionalTimeValue(input.checkInTime, "Check-in time"),
        checkOutTime:
          input?.checkOutTime === undefined
            ? existing.check_out_time ?? ""
            : normalizeOptionalTimeValue(input.checkOutTime, "Check-out time"),
        lateMinutes:
          input?.lateMinutes === undefined
            ? Number(existing.late_minutes ?? 0)
            : wholeNumber(input.lateMinutes, "Late minutes", 0),
        overtimeMinutes:
          input?.overtimeMinutes === undefined
            ? Number(existing.overtime_minutes ?? 0)
            : wholeNumber(input.overtimeMinutes, "Overtime minutes", 0),
        leaveType:
          input?.leaveType === undefined
            ? existing.leave_type ?? ""
            : optionalText(input.leaveType),
        remarks:
          input?.remarks === undefined
            ? existing.remarks ?? ""
            : optionalText(input.remarks),
        markedBy: optionalText(input?.markedBy) || optionalText(markedBy),
        updatedAt: timestamp,
      });
      insertAuditLog(
        auditUser,
        "Employee attendance updated",
        "Employee Attendance",
        `Updated employee attendance ${attendanceId}.`,
      );
      return employeeAttendanceFromRow(
        db
          .prepare("SELECT * FROM employee_attendance WHERE id = ?")
          .get(attendanceId),
      );
    },

    getEmployeeAttendanceSummary(filter = {}) {
      const normalized = normalizeEmployeeAttendanceFilter(filter);
      const rows = queryEmployeeAttendanceRows(filter);
      return {
        startDate: normalized.startDate,
        endDate: normalized.endDate,
        month: normalized.month,
        ...summarizeEmployeeAttendanceRows(rows, filter),
      };
    },

    getEmployeeMonthlyAttendance(employeeId, month) {
      const rows = buildEmployeeMonthlyAttendanceRows({
        employeeId: requiredText(employeeId, "Employee id"),
        month: requiredText(month, "Attendance month"),
      });
      const monthly = rows[0];
      if (!monthly) {
        throw new Error("Employee attendance summary was not found.");
      }
      return {
        ...monthly,
        records: queryEmployeeAttendanceRows({ employeeId, month }),
      };
    },

    getEmployeeAttendanceReport(filter = {}, auditUser = null) {
      const rows = queryEmployeeAttendanceRows(filter);
      const normalized = normalizeEmployeeAttendanceFilter(filter);
      const summary = {
        startDate: normalized.startDate,
        endDate: normalized.endDate,
        month: normalized.month,
        ...summarizeEmployeeAttendanceRows(rows, filter),
      };
      const monthlyRows = normalized.month
        ? buildEmployeeMonthlyAttendanceRows(filter)
        : [];
      insertAuditLog(
        auditUser,
        "Employee attendance report generated",
        "Employee Attendance",
        normalized.month
          ? `Generated employee monthly attendance report for ${normalized.month}.`
          : "Generated employee attendance register.",
      );
      return {
        rows,
        summary,
        monthlyRows,
      };
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
          db.prepare(`
            UPDATE timetable_entries
            SET class_name = ?, updated_at = ?, sync_status = 'pending'
            WHERE class_name = ? AND deleted_at IS NULL
          `).run(name, updatedAt, existing.name);
          db.prepare(`
            UPDATE homework
            SET class_name = ?, updated_at = ?, sync_status = 'pending'
            WHERE class_name = ? AND deleted_at IS NULL
          `).run(name, updatedAt, existing.name);
          db.prepare(`
            UPDATE homework_submissions
            SET class_name = ?, updated_at = ?, sync_status = 'pending'
            WHERE class_name = ?
          `).run(name, updatedAt, existing.name);
          db.prepare(`
            UPDATE class_tests
            SET class_name = ?, updated_at = ?, sync_status = 'pending'
            WHERE class_name = ? AND deleted_at IS NULL
          `).run(name, updatedAt, existing.name);
          db.prepare(`
            UPDATE class_test_marks
            SET class_name = ?, updated_at = ?, sync_status = 'pending'
            WHERE class_name = ?
          `).run(name, updatedAt, existing.name);
          db.prepare(`
            UPDATE subject_chapters
            SET class_name = ?, updated_at = ?, sync_status = 'pending'
            WHERE class_name = ? AND deleted_at IS NULL
          `).run(name, updatedAt, existing.name);
          db.prepare(`
            UPDATE question_bank
            SET class_name = ?, updated_at = ?, sync_status = 'pending'
            WHERE class_name = ? AND deleted_at IS NULL
          `).run(name, updatedAt, existing.name);
          db.prepare(`
            UPDATE question_papers
            SET class_name = ?, updated_at = ?, sync_status = 'pending'
            WHERE class_name = ? AND deleted_at IS NULL
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
        db.prepare(`
          UPDATE timetable_entries
          SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
          WHERE class_name = ? AND deleted_at IS NULL
        `).run(deletedAt, deletedAt, existing.name);
        db.prepare(`
          UPDATE homework
          SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
          WHERE class_name = ? AND deleted_at IS NULL
        `).run(deletedAt, deletedAt, existing.name);
        db.prepare(`
          UPDATE class_tests
          SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
          WHERE class_name = ? AND deleted_at IS NULL
        `).run(deletedAt, deletedAt, existing.name);
        db.prepare(`
          UPDATE subject_chapters
          SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
          WHERE class_name = ? AND deleted_at IS NULL
        `).run(deletedAt, deletedAt, existing.name);
        db.prepare(`
          UPDATE question_bank
          SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
          WHERE class_name = ? AND deleted_at IS NULL
        `).run(deletedAt, deletedAt, existing.name);
        db.prepare(`
          UPDATE question_papers
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
        db.prepare(`
          UPDATE timetable_entries
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
          UPDATE homework
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
          UPDATE homework_submissions
          SET class_name = ?, section = ?, updated_at = ?, sync_status = 'pending'
          WHERE class_name = ? AND section = ?
        `).run(
          schoolClass.name,
          name,
          updatedAt,
          existing.class_name,
          existing.name,
        );
        db.prepare(`
          UPDATE class_tests
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
          UPDATE class_test_marks
          SET class_name = ?, section = ?, updated_at = ?, sync_status = 'pending'
          WHERE class_name = ? AND section = ?
        `).run(
          schoolClass.name,
          name,
          updatedAt,
          existing.class_name,
          existing.name,
        );
        db.prepare(`
          UPDATE question_papers
          SET class_name = ?, section = ?, updated_at = ?, sync_status = 'pending'
          WHERE class_name = ? AND section = ? AND deleted_at IS NULL
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
      const sectionId = requiredText(id, "Section id");
      const existing = db
        .prepare("SELECT * FROM sections WHERE id = ? AND deleted_at IS NULL")
        .get(sectionId);
      if (!existing) return { success: false };
      const timestamp = now();
      let result;
      db.transaction(() => {
        result = db
          .prepare(`
            UPDATE sections
            SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
            WHERE id = ? AND deleted_at IS NULL
          `)
          .run(timestamp, timestamp, sectionId);
        db.prepare(`
          UPDATE timetable_entries
          SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
          WHERE class_name = ? AND section = ? AND deleted_at IS NULL
        `).run(timestamp, timestamp, existing.class_name, existing.name);
        db.prepare(`
          UPDATE homework
          SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
          WHERE class_name = ? AND section = ? AND deleted_at IS NULL
        `).run(timestamp, timestamp, existing.class_name, existing.name);
        db.prepare(`
          UPDATE class_tests
          SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
          WHERE class_name = ? AND section = ? AND deleted_at IS NULL
        `).run(timestamp, timestamp, existing.class_name, existing.name);
        db.prepare(`
          UPDATE question_papers
          SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
          WHERE class_name = ? AND section = ? AND deleted_at IS NULL
        `).run(timestamp, timestamp, existing.class_name, existing.name);
      })();
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

      const updatedAt = now();
      db.transaction(() => {
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
          updatedAt,
        });
        if (schoolClass.name === existing.class_name) {
          db.prepare(`
            UPDATE timetable_entries
            SET subject_name = ?, updated_at = ?, sync_status = 'pending'
            WHERE subject_id = ? AND deleted_at IS NULL
          `).run(name, updatedAt, subjectId);
          db.prepare(`
            UPDATE homework
            SET subject_name = ?, updated_at = ?, sync_status = 'pending'
            WHERE subject_id = ? AND deleted_at IS NULL
          `).run(name, updatedAt, subjectId);
          db.prepare(`
            UPDATE class_tests
            SET subject_name = ?, updated_at = ?, sync_status = 'pending'
            WHERE subject_id = ? AND deleted_at IS NULL
          `).run(name, updatedAt, subjectId);
          db.prepare(`
            UPDATE subject_chapters
            SET subject_name = ?, updated_at = ?, sync_status = 'pending'
            WHERE subject_id = ? AND deleted_at IS NULL
          `).run(name, updatedAt, subjectId);
          db.prepare(`
            UPDATE question_bank
            SET subject_name = ?, updated_at = ?, sync_status = 'pending'
            WHERE subject_id = ? AND deleted_at IS NULL
          `).run(name, updatedAt, subjectId);
          db.prepare(`
            UPDATE question_papers
            SET subject_name = ?, updated_at = ?, sync_status = 'pending'
            WHERE subject_id = ? AND deleted_at IS NULL
          `).run(name, updatedAt, subjectId);
        } else {
          db.prepare(`
            UPDATE timetable_entries
            SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
            WHERE subject_id = ? AND deleted_at IS NULL
          `).run(updatedAt, updatedAt, subjectId);
          db.prepare(`
            UPDATE homework
            SET subject_name = ?,
                status = 'Inactive',
                updated_at = ?,
                sync_status = 'pending'
            WHERE subject_id = ? AND deleted_at IS NULL
          `).run(name, updatedAt, subjectId);
          db.prepare(`
            UPDATE class_tests
            SET subject_name = ?,
                status = 'Inactive',
                updated_at = ?,
                sync_status = 'pending'
            WHERE subject_id = ? AND deleted_at IS NULL
          `).run(name, updatedAt, subjectId);
          db.prepare(`
            UPDATE subject_chapters
            SET subject_name = ?,
                status = 'Inactive',
                updated_at = ?,
                sync_status = 'pending'
            WHERE subject_id = ? AND deleted_at IS NULL
          `).run(name, updatedAt, subjectId);
          db.prepare(`
            UPDATE question_bank
            SET subject_name = ?,
                status = 'Inactive',
                updated_at = ?,
                sync_status = 'pending'
            WHERE subject_id = ? AND deleted_at IS NULL
          `).run(name, updatedAt, subjectId);
        }
      })();

      return subjectFromRow(getActiveSubjectById.get(subjectId));
    },

    deleteSubject(id) {
      const subjectId = requiredText(id, "Subject id");
      const timestamp = now();
      let result;
      db.transaction(() => {
        result = db
          .prepare(`
            UPDATE subjects
            SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
            WHERE id = ? AND deleted_at IS NULL
          `)
          .run(timestamp, timestamp, subjectId);
        if (result.changes === 1) {
          db.prepare(`
            UPDATE timetable_entries
            SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
            WHERE subject_id = ? AND deleted_at IS NULL
          `).run(timestamp, timestamp, subjectId);
        }
      })();
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

    getGradingSchemes() {
      return db
        .prepare(`
          SELECT *
          FROM grading_schemes
          WHERE deleted_at IS NULL
          ORDER BY is_default DESC, name COLLATE NOCASE
        `)
        .all()
        .map((row) =>
          gradingSchemeFromRow(row, getGradingRangesForScheme(row.id)),
        );
    },

    getGradingSchemeById(id) {
      return getGradingSchemeByIdInternal(id);
    },

    createGradingScheme(input = {}) {
      const calculationMode = normalizeGradingCalculationMode(
        input.calculationMode,
      );
      const ranges = validateGradingRanges(input.ranges, calculationMode);
      const session = resolveSchemeSession(input);
      const timestamp = now();
      const id = crypto.randomUUID();
      const schemePayload = {
        id,
        name: requiredText(input.name, "Grading scheme name"),
        academicSessionId: session.id,
        academicSessionName: session.name,
        className: optionalText(input.className),
        calculationMode,
        status: masterStatus(input.status),
        isDefault: input.isDefault ? 1 : 0,
        description: optionalText(input.description),
        createdBy: optionalText(input.createdBy) ||
          optionalText(input.auditUser?.name),
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      db.transaction(() => {
        db.prepare(`
          INSERT INTO grading_schemes (
            id, name, academic_session_id, academic_session_name, class_name,
            calculation_mode, status, is_default, description, created_by,
            created_at, updated_at, deleted_at, sync_status
          ) VALUES (
            @id, @name, @academicSessionId, @academicSessionName, @className,
            @calculationMode, @status, @isDefault, @description, @createdBy,
            @createdAt, @updatedAt, NULL, 'pending'
          )
        `).run(schemePayload);
        insertOrReplaceGradingRanges(id, ranges, timestamp);
        if (schemePayload.isDefault && schemePayload.status === "Active") {
          unsetOtherDefaultGradingSchemes(schemePayload);
        }
      })();
      insertAuditLog(
        input.auditUser,
        "Grading scheme created",
        "Marks Grading",
        `Created ${schemePayload.name}.`,
      );
      return getGradingSchemeByIdInternal(id);
    },

    updateGradingScheme(id, input = {}) {
      const schemeId = requiredText(id, "Grading scheme id");
      const existing = db
        .prepare(`
          SELECT *
          FROM grading_schemes
          WHERE id = ? AND deleted_at IS NULL
        `)
        .get(schemeId);
      if (!existing) throw new Error("Grading scheme was not found.");
      const calculationMode =
        input.calculationMode === undefined
          ? existing.calculation_mode
          : normalizeGradingCalculationMode(input.calculationMode);
      const ranges =
        input.ranges === undefined
          ? getGradingRangesForScheme(schemeId)
          : validateGradingRanges(input.ranges, calculationMode);
      const session = resolveSchemeSession(input, existing);
      const status = masterStatus(input.status, existing.status);
      const isDefault =
        input.isDefault === undefined
          ? Number(existing.is_default ?? 0)
          : input.isDefault
            ? 1
            : 0;
      const timestamp = now();
      const payload = {
        id: schemeId,
        name:
          input.name === undefined
            ? existing.name
            : requiredText(input.name, "Grading scheme name"),
        academicSessionId: session.id,
        academicSessionName: session.name,
        className:
          input.className === undefined
            ? existing.class_name ?? ""
            : optionalText(input.className),
        calculationMode,
        status,
        isDefault,
        description:
          input.description === undefined
            ? existing.description ?? ""
            : optionalText(input.description),
        updatedAt: timestamp,
      };
      db.transaction(() => {
        db.prepare(`
          UPDATE grading_schemes
          SET name = @name,
              academic_session_id = @academicSessionId,
              academic_session_name = @academicSessionName,
              class_name = @className,
              calculation_mode = @calculationMode,
              status = @status,
              is_default = @isDefault,
              description = @description,
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE id = @id AND deleted_at IS NULL
        `).run(payload);
        if (input.ranges !== undefined) {
          insertOrReplaceGradingRanges(schemeId, ranges, timestamp);
        }
        if (payload.isDefault && payload.status === "Active") {
          unsetOtherDefaultGradingSchemes(payload);
        }
      })();
      insertAuditLog(
        input.auditUser,
        "Grading scheme updated",
        "Marks Grading",
        `Updated ${payload.name}.`,
      );
      return getGradingSchemeByIdInternal(schemeId);
    },

    deleteGradingScheme(id, auditUser = null) {
      const schemeId = requiredText(id, "Grading scheme id");
      const timestamp = now();
      const result = db
        .prepare(`
          UPDATE grading_schemes
          SET deleted_at = ?, updated_at = ?, is_default = 0, sync_status = 'pending'
          WHERE id = ? AND deleted_at IS NULL
        `)
        .run(timestamp, timestamp, schemeId);
      db.prepare(`
        UPDATE grading_ranges
        SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
        WHERE grading_scheme_id = ? AND deleted_at IS NULL
      `).run(timestamp, timestamp, schemeId);
      insertAuditLog(
        auditUser,
        "Grading scheme deleted",
        "Marks Grading",
        `Deleted grading scheme ${schemeId}.`,
      );
      return { success: result.changes === 1 };
    },

    setDefaultGradingScheme(id, auditUser = null) {
      const scheme = getGradingSchemeByIdInternal(id);
      if (!scheme || scheme.status !== "Active") {
        throw new Error("Select an active grading scheme.");
      }
      db.transaction(() => {
        db.prepare(`
          UPDATE grading_schemes
          SET is_default = 1,
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE id = @id AND deleted_at IS NULL
        `).run({ id: scheme.id, updatedAt: now() });
        unsetOtherDefaultGradingSchemes(scheme);
      })();
      insertAuditLog(
        auditUser,
        "Default grading scheme changed",
        "Marks Grading",
        `Set ${scheme.name} as default.`,
      );
      return getGradingSchemeByIdInternal(scheme.id);
    },

    calculateGrade(input = {}) {
      const scheme = resolveApplicableGradingScheme(input);
      return {
        scheme,
        ...calculateGradeFromScheme(
          scheme,
          decimalNumber(input.value, "Grade value", 0),
        ),
      };
    },

    getReportCardTemplates() {
      return db
        .prepare(`
          SELECT *
          FROM report_card_templates
          WHERE deleted_at IS NULL
          ORDER BY status, name COLLATE NOCASE
        `)
        .all()
        .map(reportCardTemplateFromRow);
    },

    createReportCardTemplate(input = {}) {
      const timestamp = now();
      const id = crypto.randomUUID();
      db.prepare(`
        INSERT INTO report_card_templates (
          id, name, template_type, academic_session_id, class_name,
          show_attendance, show_class_tests, show_behaviour, show_skills,
          show_teacher_remarks, show_principal_signature, header_text,
          footer_text, status, created_at, updated_at, deleted_at, sync_status
        ) VALUES (
          @id, @name, @templateType, @academicSessionId, @className,
          @showAttendance, @showClassTests, @showBehaviour, @showSkills,
          @showTeacherRemarks, @showPrincipalSignature, @headerText,
          @footerText, @status, @createdAt, @updatedAt, NULL, 'pending'
        )
      `).run({
        id,
        name: requiredText(input.name, "Template name"),
        templateType: normalizeReportCardTemplateType(input.templateType),
        academicSessionId: optionalText(input.academicSessionId),
        className: optionalText(input.className),
        showAttendance: booleanFlag(input.showAttendance, true),
        showClassTests: booleanFlag(input.showClassTests, false),
        showBehaviour: booleanFlag(input.showBehaviour, true),
        showSkills: booleanFlag(input.showSkills, true),
        showTeacherRemarks: booleanFlag(input.showTeacherRemarks, true),
        showPrincipalSignature: booleanFlag(
          input.showPrincipalSignature,
          true,
        ),
        headerText: optionalText(input.headerText),
        footerText: optionalText(input.footerText),
        status: masterStatus(input.status),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      return reportCardTemplateFromRow(
        db.prepare("SELECT * FROM report_card_templates WHERE id = ?").get(id),
      );
    },

    updateReportCardTemplate(id, input = {}) {
      const templateId = requiredText(id, "Report card template id");
      const existing = db
        .prepare(`
          SELECT *
          FROM report_card_templates
          WHERE id = ? AND deleted_at IS NULL
        `)
        .get(templateId);
      if (!existing) throw new Error("Report card template was not found.");
      db.prepare(`
        UPDATE report_card_templates
        SET name = @name,
            template_type = @templateType,
            academic_session_id = @academicSessionId,
            class_name = @className,
            show_attendance = @showAttendance,
            show_class_tests = @showClassTests,
            show_behaviour = @showBehaviour,
            show_skills = @showSkills,
            show_teacher_remarks = @showTeacherRemarks,
            show_principal_signature = @showPrincipalSignature,
            header_text = @headerText,
            footer_text = @footerText,
            status = @status,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id AND deleted_at IS NULL
      `).run({
        id: templateId,
        name:
          input.name === undefined
            ? existing.name
            : requiredText(input.name, "Template name"),
        templateType:
          input.templateType === undefined
            ? existing.template_type
            : normalizeReportCardTemplateType(input.templateType),
        academicSessionId:
          input.academicSessionId === undefined
            ? existing.academic_session_id ?? ""
            : optionalText(input.academicSessionId),
        className:
          input.className === undefined
            ? existing.class_name ?? ""
            : optionalText(input.className),
        showAttendance:
          input.showAttendance === undefined
            ? Number(existing.show_attendance ?? 1)
            : booleanFlag(input.showAttendance, true),
        showClassTests:
          input.showClassTests === undefined
            ? Number(existing.show_class_tests ?? 0)
            : booleanFlag(input.showClassTests, false),
        showBehaviour:
          input.showBehaviour === undefined
            ? Number(existing.show_behaviour ?? 1)
            : booleanFlag(input.showBehaviour, true),
        showSkills:
          input.showSkills === undefined
            ? Number(existing.show_skills ?? 1)
            : booleanFlag(input.showSkills, true),
        showTeacherRemarks:
          input.showTeacherRemarks === undefined
            ? Number(existing.show_teacher_remarks ?? 1)
            : booleanFlag(input.showTeacherRemarks, true),
        showPrincipalSignature:
          input.showPrincipalSignature === undefined
            ? Number(existing.show_principal_signature ?? 1)
            : booleanFlag(input.showPrincipalSignature, true),
        headerText:
          input.headerText === undefined
            ? existing.header_text ?? ""
            : optionalText(input.headerText),
        footerText:
          input.footerText === undefined
            ? existing.footer_text ?? ""
            : optionalText(input.footerText),
        status: masterStatus(input.status, existing.status),
        updatedAt: now(),
      });
      return reportCardTemplateFromRow(
        db
          .prepare("SELECT * FROM report_card_templates WHERE id = ?")
          .get(templateId),
      );
    },

    deleteReportCardTemplate(id) {
      const timestamp = now();
      const result = db
        .prepare(`
          UPDATE report_card_templates
          SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
          WHERE id = ? AND deleted_at IS NULL
        `)
        .run(timestamp, timestamp, requiredText(id, "Report card template id"));
      return { success: result.changes === 1 };
    },

    getReportCardPreview(input = {}) {
      return buildReportCardPreview(input);
    },

    generateStudentReportCard(input = {}) {
      const actor = input.auditUser ?? null;
      const preview = buildReportCardPreview(input);
      const card = db.transaction(() =>
        insertReportCardFromPreview(preview, input, actor),
      )();
      insertAuditLog(
        actor,
        input.regenerate ? "Report card regenerated" : "Report card generated",
        "Report Cards",
        `${card.reportCardNo} for ${card.studentName}.`,
      );
      return card;
    },

    generateClassReportCards(input = {}) {
      const actor = input.auditUser ?? null;
      const students = buildClassReportCardStudents(input);
      const cards = db.transaction(() =>
        students.map((student) => {
          const preview = buildReportCardPreview({
            ...input,
            studentId: student.id,
          });
          return insertReportCardFromPreview(preview, input, actor);
        }),
      )();
      insertAuditLog(
        actor,
        "Class batch report cards generated",
        "Report Cards",
        `Generated ${cards.length} report card(s).`,
      );
      return {
        count: cards.length,
        reportCards: cards,
      };
    },

    getStudentReportCards(filter = {}) {
      return queryReportCards(filter);
    },

    getStudentReportCardById(id) {
      return getReportCardByIdInternal(id);
    },

    updateReportCardRemarks(id, input = {}) {
      const cardId = requiredText(id, "Report card id");
      const existing = getReportCardByIdInternal(cardId);
      if (!existing) throw new Error("Report card was not found.");
      db.prepare(`
        UPDATE student_report_cards
        SET teacher_remarks = @teacherRemarks,
            principal_remarks = @principalRemarks,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id AND deleted_at IS NULL
      `).run({
        id: cardId,
        teacherRemarks:
          input.teacherRemarks === undefined
            ? existing.teacherRemarks
            : optionalText(input.teacherRemarks),
        principalRemarks:
          input.principalRemarks === undefined
            ? existing.principalRemarks
            : optionalText(input.principalRemarks),
        updatedAt: now(),
      });
      insertAuditLog(
        input.auditUser,
        "Report card remarks updated",
        "Report Cards",
        `Updated remarks for ${existing.reportCardNo}.`,
      );
      return getReportCardByIdInternal(cardId);
    },

    deleteReportCard(id, auditUser = null) {
      const cardId = requiredText(id, "Report card id");
      const timestamp = now();
      const result = db
        .prepare(`
          UPDATE student_report_cards
          SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
          WHERE id = ? AND deleted_at IS NULL
        `)
        .run(timestamp, timestamp, cardId);
      insertAuditLog(
        auditUser,
        "Report card deleted",
        "Report Cards",
        `Soft deleted report card ${cardId}.`,
      );
      return { success: result.changes === 1 };
    },

    getClassResultSummary(filter = {}) {
      return buildClassResultSummary(filter);
    },

    getResultPositions(filter = {}) {
      return buildClassResultSummary(filter).rankings;
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
      const name =
        input?.name === undefined
          ? existing.name
          : requiredText(input.name, "Employee name");
      const updatedAt = now();
      const updateValues = {
        id: employeeId,
        employeeNo,
        name,
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
        updatedAt,
      };
      db.transaction(() => {
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
        `).run(updateValues);
        if (name !== existing.name) {
          db.prepare(`
            UPDATE timetable_entries
            SET teacher_name = ?, updated_at = ?, sync_status = 'pending'
            WHERE teacher_id = ? AND deleted_at IS NULL
          `).run(name, updatedAt, employeeId);
          db.prepare(`
            UPDATE homework
            SET teacher_name = ?, updated_at = ?, sync_status = 'pending'
            WHERE teacher_id = ? AND deleted_at IS NULL
          `).run(name, updatedAt, employeeId);
          db.prepare(`
            UPDATE class_tests
            SET teacher_name = ?, updated_at = ?, sync_status = 'pending'
            WHERE teacher_id = ? AND deleted_at IS NULL
          `).run(name, updatedAt, employeeId);
        }
      })();
      return this.getEmployeeById(employeeId);
    },

    deleteEmployee(id) {
      const employeeId = requiredText(id, "Employee id");
      const timestamp = now();
      let result;
      db.transaction(() => {
        result = db
          .prepare(`
            UPDATE employees
            SET deleted_at = ?,
                updated_at = ?,
                sync_status = 'pending'
            WHERE id = ? AND deleted_at IS NULL
          `)
          .run(timestamp, timestamp, employeeId);
        if (result.changes === 1) {
          db.prepare(`
            UPDATE timetable_entries
            SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
            WHERE teacher_id = ? AND deleted_at IS NULL
          `).run(timestamp, timestamp, employeeId);
        }
      })();
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

    getTimetableWeekdays() {
      return db
        .prepare(`
          SELECT *
          FROM timetable_weekdays
          WHERE deleted_at IS NULL
          ORDER BY display_order, name COLLATE NOCASE
        `)
        .all()
        .map(timetableWeekdayFromRow);
    },

    createTimetableWeekday(input) {
      const name = requiredText(input?.name, "Weekday name");
      const duplicate = db
        .prepare(`
          SELECT id
          FROM timetable_weekdays
          WHERE name = ? COLLATE NOCASE AND deleted_at IS NULL
        `)
        .get(name);
      if (duplicate) {
        throw new Error("This timetable weekday already exists.");
      }
      const id = crypto.randomUUID();
      const timestamp = now();
      db.prepare(`
        INSERT INTO timetable_weekdays (
          id, name, display_order, is_active, created_at, updated_at,
          deleted_at, sync_status
        ) VALUES (
          @id, @name, @displayOrder, @isActive, @createdAt, @updatedAt,
          NULL, 'pending'
        )
      `).run({
        id,
        name,
        displayOrder: displayOrder(input?.displayOrder),
        isActive: input?.isActive === false ? 0 : 1,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      return timetableWeekdayFromRow(
        db.prepare("SELECT * FROM timetable_weekdays WHERE id = ?").get(id),
      );
    },

    updateTimetableWeekday(id, input) {
      const weekdayId = requiredText(id, "Weekday id");
      const existing = db
        .prepare(`
          SELECT *
          FROM timetable_weekdays
          WHERE id = ? AND deleted_at IS NULL
        `)
        .get(weekdayId);
      if (!existing) throw new Error("Timetable weekday was not found.");
      const name =
        input?.name === undefined
          ? existing.name
          : requiredText(input.name, "Weekday name");
      const duplicate = db
        .prepare(`
          SELECT id
          FROM timetable_weekdays
          WHERE name = ? COLLATE NOCASE
            AND id <> ?
            AND deleted_at IS NULL
        `)
        .get(name, weekdayId);
      if (duplicate) throw new Error("This timetable weekday already exists.");
      const updatedAt = now();
      const updateValues = {
        id: weekdayId,
        name,
        displayOrder:
          input?.displayOrder === undefined
            ? Number(existing.display_order ?? 0)
            : displayOrder(input.displayOrder),
        isActive:
          input?.isActive === undefined
            ? Number(existing.is_active ?? 1)
            : input.isActive
              ? 1
              : 0,
        updatedAt,
      };
      db.transaction(() => {
        db.prepare(`
          UPDATE timetable_weekdays
          SET name = @name,
              display_order = @displayOrder,
              is_active = @isActive,
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE id = @id AND deleted_at IS NULL
        `).run(updateValues);
        db.prepare(`
          UPDATE timetable_entries
          SET weekday_name = ?, updated_at = ?, sync_status = 'pending'
          WHERE weekday_id = ? AND deleted_at IS NULL
        `).run(name, updatedAt, weekdayId);
      })();
      return timetableWeekdayFromRow(
        db
          .prepare("SELECT * FROM timetable_weekdays WHERE id = ?")
          .get(weekdayId),
      );
    },

    deleteTimetableWeekday(id) {
      const weekdayId = requiredText(id, "Weekday id");
      const timestamp = now();
      let result;
      db.transaction(() => {
        result = db
          .prepare(`
            UPDATE timetable_weekdays
            SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
            WHERE id = ? AND deleted_at IS NULL
          `)
          .run(timestamp, timestamp, weekdayId);
        if (result.changes === 1) {
          db.prepare(`
            UPDATE timetable_entries
            SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
            WHERE weekday_id = ? AND deleted_at IS NULL
          `).run(timestamp, timestamp, weekdayId);
        }
      })();
      return { success: result.changes === 1 };
    },

    getTimetablePeriods() {
      return db
        .prepare(`
          SELECT *
          FROM timetable_periods
          WHERE deleted_at IS NULL
          ORDER BY display_order, start_time, name COLLATE NOCASE
        `)
        .all()
        .map(timetablePeriodFromRow);
    },

    createTimetablePeriod(input) {
      const name = requiredText(input?.name, "Period name");
      const startTime = normalizeTime(input?.startTime, "Start time");
      const endTime = normalizeTime(input?.endTime, "End time");
      if (startTime >= endTime) {
        throw new Error("Period end time must be after start time.");
      }
      const id = crypto.randomUUID();
      const timestamp = now();
      db.prepare(`
        INSERT INTO timetable_periods (
          id, name, start_time, end_time, display_order, is_break,
          created_at, updated_at, deleted_at, sync_status
        ) VALUES (
          @id, @name, @startTime, @endTime, @displayOrder, @isBreak,
          @createdAt, @updatedAt, NULL, 'pending'
        )
      `).run({
        id,
        name,
        startTime,
        endTime,
        displayOrder: displayOrder(input?.displayOrder),
        isBreak: input?.isBreak === true ? 1 : 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      return timetablePeriodFromRow(
        db.prepare("SELECT * FROM timetable_periods WHERE id = ?").get(id),
      );
    },

    updateTimetablePeriod(id, input) {
      const periodId = requiredText(id, "Period id");
      const existing = db
        .prepare(`
          SELECT *
          FROM timetable_periods
          WHERE id = ? AND deleted_at IS NULL
        `)
        .get(periodId);
      if (!existing) throw new Error("Timetable period was not found.");
      const startTime =
        input?.startTime === undefined
          ? existing.start_time
          : normalizeTime(input.startTime, "Start time");
      const endTime =
        input?.endTime === undefined
          ? existing.end_time
          : normalizeTime(input.endTime, "End time");
      if (startTime >= endTime) {
        throw new Error("Period end time must be after start time.");
      }
      const name =
        input?.name === undefined
          ? existing.name
          : requiredText(input.name, "Period name");
      const isBreak =
        input?.isBreak === undefined
          ? Number(existing.is_break ?? 0)
          : input.isBreak
            ? 1
            : 0;
      const updatedAt = now();
      const updateValues = {
        id: periodId,
        name,
        startTime,
        endTime,
        displayOrder:
          input?.displayOrder === undefined
            ? Number(existing.display_order ?? 0)
            : displayOrder(input.displayOrder),
        isBreak,
        updatedAt,
      };
      db.transaction(() => {
        db.prepare(`
          UPDATE timetable_periods
          SET name = @name,
              start_time = @startTime,
              end_time = @endTime,
              display_order = @displayOrder,
              is_break = @isBreak,
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE id = @id AND deleted_at IS NULL
        `).run(updateValues);
        if (isBreak === 1) {
          db.prepare(`
            UPDATE timetable_entries
            SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
            WHERE period_id = ? AND deleted_at IS NULL
          `).run(updatedAt, updatedAt, periodId);
        } else {
          db.prepare(`
            UPDATE timetable_entries
            SET period_name = ?,
                start_time = ?,
                end_time = ?,
                updated_at = ?,
                sync_status = 'pending'
            WHERE period_id = ? AND deleted_at IS NULL
          `).run(name, startTime, endTime, updatedAt, periodId);
        }
      })();
      return timetablePeriodFromRow(
        db
          .prepare("SELECT * FROM timetable_periods WHERE id = ?")
          .get(periodId),
      );
    },

    deleteTimetablePeriod(id) {
      const periodId = requiredText(id, "Period id");
      const timestamp = now();
      let result;
      db.transaction(() => {
        result = db
          .prepare(`
            UPDATE timetable_periods
            SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
            WHERE id = ? AND deleted_at IS NULL
          `)
          .run(timestamp, timestamp, periodId);
        if (result.changes === 1) {
          db.prepare(`
            UPDATE timetable_entries
            SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
            WHERE period_id = ? AND deleted_at IS NULL
          `).run(timestamp, timestamp, periodId);
        }
      })();
      return { success: result.changes === 1 };
    },

    getClassrooms() {
      return db
        .prepare(`
          SELECT *
          FROM classrooms
          WHERE deleted_at IS NULL
          ORDER BY
            CASE status WHEN 'Active' THEN 0 ELSE 1 END,
            name COLLATE NOCASE
        `)
        .all()
        .map(classroomFromRow);
    },

    createClassroom(input) {
      const name = requiredText(input?.name, "Classroom name");
      const duplicate = db
        .prepare(`
          SELECT id
          FROM classrooms
          WHERE name = ? COLLATE NOCASE AND deleted_at IS NULL
        `)
        .get(name);
      if (duplicate) throw new Error("This classroom already exists.");
      const id = crypto.randomUUID();
      const timestamp = now();
      db.prepare(`
        INSERT INTO classrooms (
          id, name, capacity, description, status, created_at, updated_at,
          deleted_at, sync_status
        ) VALUES (
          @id, @name, @capacity, @description, @status, @createdAt,
          @updatedAt, NULL, 'pending'
        )
      `).run({
        id,
        name,
        capacity: wholeNumber(input?.capacity ?? 0, "Classroom capacity", 0),
        description: optionalText(input?.description),
        status: masterStatus(input?.status),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      return classroomFromRow(
        db.prepare("SELECT * FROM classrooms WHERE id = ?").get(id),
      );
    },

    updateClassroom(id, input) {
      const classroomId = requiredText(id, "Classroom id");
      const existing = db
        .prepare(`
          SELECT *
          FROM classrooms
          WHERE id = ? AND deleted_at IS NULL
        `)
        .get(classroomId);
      if (!existing) throw new Error("Classroom was not found.");
      const name =
        input?.name === undefined
          ? existing.name
          : requiredText(input.name, "Classroom name");
      const duplicate = db
        .prepare(`
          SELECT id
          FROM classrooms
          WHERE name = ? COLLATE NOCASE
            AND id <> ?
            AND deleted_at IS NULL
        `)
        .get(name, classroomId);
      if (duplicate) throw new Error("This classroom already exists.");
      const updatedAt = now();
      const updateValues = {
        id: classroomId,
        name,
        capacity:
          input?.capacity === undefined
            ? Number(existing.capacity ?? 0)
            : wholeNumber(input.capacity, "Classroom capacity", 0),
        description:
          input?.description === undefined
            ? existing.description ?? ""
            : optionalText(input.description),
        status: masterStatus(input?.status, existing.status),
        updatedAt,
      };
      db.transaction(() => {
        db.prepare(`
          UPDATE classrooms
          SET name = @name,
              capacity = @capacity,
              description = @description,
              status = @status,
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE id = @id AND deleted_at IS NULL
        `).run(updateValues);
        db.prepare(`
          UPDATE timetable_entries
          SET classroom_name = ?, updated_at = ?, sync_status = 'pending'
          WHERE classroom_id = ? AND deleted_at IS NULL
        `).run(name, updatedAt, classroomId);
      })();
      return classroomFromRow(
        db.prepare("SELECT * FROM classrooms WHERE id = ?").get(classroomId),
      );
    },

    deleteClassroom(id) {
      const timestamp = now();
      const result = db
        .prepare(`
          UPDATE classrooms
          SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
          WHERE id = ? AND deleted_at IS NULL
        `)
        .run(timestamp, timestamp, requiredText(id, "Classroom id"));
      return { success: result.changes === 1 };
    },

    getTimetableEntries() {
      return db
        .prepare(`
          SELECT timetable_entries.*
          FROM timetable_entries
          LEFT JOIN timetable_weekdays
            ON timetable_weekdays.id = timetable_entries.weekday_id
          LEFT JOIN timetable_periods
            ON timetable_periods.id = timetable_entries.period_id
          WHERE timetable_entries.deleted_at IS NULL
          ORDER BY
            timetable_weekdays.display_order,
            timetable_periods.display_order,
            timetable_entries.class_name,
            timetable_entries.section
        `)
        .all()
        .map(timetableEntryFromRow);
    },

    getTimetableByClass(className, section) {
      const normalizedClass = requiredText(className, "Class");
      const sectionValue = optionalText(section);
      const normalizedSection =
        sectionValue.toLowerCase() === "all" ? "" : sectionValue;
      return db
        .prepare(`
          SELECT timetable_entries.*
          FROM timetable_entries
          LEFT JOIN timetable_weekdays
            ON timetable_weekdays.id = timetable_entries.weekday_id
          LEFT JOIN timetable_periods
            ON timetable_periods.id = timetable_entries.period_id
          WHERE timetable_entries.class_name = ?
            AND COALESCE(timetable_entries.section, '') = ?
            AND timetable_entries.deleted_at IS NULL
          ORDER BY
            timetable_weekdays.display_order,
            timetable_periods.display_order
        `)
        .all(normalizedClass, normalizedSection)
        .map(timetableEntryFromRow);
    },

    getTimetableByTeacher(teacherId) {
      return db
        .prepare(`
          SELECT timetable_entries.*
          FROM timetable_entries
          LEFT JOIN timetable_weekdays
            ON timetable_weekdays.id = timetable_entries.weekday_id
          LEFT JOIN timetable_periods
            ON timetable_periods.id = timetable_entries.period_id
          WHERE timetable_entries.teacher_id = ?
            AND timetable_entries.deleted_at IS NULL
          ORDER BY
            timetable_weekdays.display_order,
            timetable_periods.display_order,
            timetable_entries.class_name,
            timetable_entries.section
        `)
        .all(requiredText(teacherId, "Teacher id"))
        .map(timetableEntryFromRow);
    },

    createOrUpdateTimetableEntry(input) {
      const className = requiredText(input?.className, "Class");
      const schoolClass = getActiveClassByName.get(className);
      if (!schoolClass || schoolClass.status !== "Active") {
        throw new Error("Select an active class.");
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
      const weekday = db
        .prepare(`
          SELECT *
          FROM timetable_weekdays
          WHERE id = ? AND is_active = 1 AND deleted_at IS NULL
        `)
        .get(requiredText(input?.weekdayId, "Weekday"));
      if (!weekday) throw new Error("Select an active timetable weekday.");
      const period = db
        .prepare(`
          SELECT *
          FROM timetable_periods
          WHERE id = ? AND deleted_at IS NULL
        `)
        .get(requiredText(input?.periodId, "Period"));
      if (!period) throw new Error("Select an active timetable period.");
      if (Number(period.is_break) === 1) {
        throw new Error("Break periods do not require timetable entries.");
      }
      const subject = getActiveSubjectById.get(
        requiredText(input?.subjectId, "Subject"),
      );
      if (
        !subject ||
        subject.status !== "Active" ||
        subject.class_name !== schoolClass.name
      ) {
        throw new Error("Select an active subject for the chosen class.");
      }
      const teacher = db
        .prepare(`
          SELECT *
          FROM employees
          WHERE id = ? AND status = 'Active' AND deleted_at IS NULL
        `)
        .get(requiredText(input?.teacherId, "Teacher"));
      if (!teacher) throw new Error("Select an active teacher.");
      const classroomId = optionalText(input?.classroomId);
      const classroom = classroomId
        ? db
            .prepare(`
              SELECT *
              FROM classrooms
              WHERE id = ? AND status = 'Active' AND deleted_at IS NULL
            `)
            .get(classroomId)
        : null;
      if (classroomId && !classroom) {
        throw new Error("Select an active classroom.");
      }
      const existing = db
        .prepare(`
          SELECT *
          FROM timetable_entries
          WHERE class_name = ?
            AND COALESCE(section, '') = ?
            AND weekday_id = ?
            AND period_id = ?
            AND deleted_at IS NULL
        `)
        .get(schoolClass.name, section, weekday.id, period.id);
      const existingId = existing?.id ?? "";
      const teacherConflict = db
        .prepare(`
          SELECT class_name, section
          FROM timetable_entries
          WHERE teacher_id = ?
            AND weekday_id = ?
            AND period_id = ?
            AND id <> ?
            AND deleted_at IS NULL
        `)
        .get(teacher.id, weekday.id, period.id, existingId);
      if (teacherConflict) {
        throw new Error(
          `Teacher is already assigned to Class ${teacherConflict.class_name}${teacherConflict.section ? `-${teacherConflict.section}` : ""} for this weekday and period.`,
        );
      }
      if (classroom) {
        const classroomConflict = db
          .prepare(`
            SELECT class_name, section
            FROM timetable_entries
            WHERE classroom_id = ?
              AND weekday_id = ?
              AND period_id = ?
              AND id <> ?
              AND deleted_at IS NULL
          `)
          .get(classroom.id, weekday.id, period.id, existingId);
        if (classroomConflict) {
          throw new Error(
            `Classroom is already assigned to Class ${classroomConflict.class_name}${classroomConflict.section ? `-${classroomConflict.section}` : ""} for this weekday and period.`,
          );
        }
      }

      const timestamp = now();
      const entryId = existing?.id ?? crypto.randomUUID();
      if (existing) {
        db.prepare(`
          UPDATE timetable_entries
          SET weekday_name = @weekdayName,
              period_name = @periodName,
              start_time = @startTime,
              end_time = @endTime,
              subject_id = @subjectId,
              subject_name = @subjectName,
              teacher_id = @teacherId,
              teacher_name = @teacherName,
              classroom_id = @classroomId,
              classroom_name = @classroomName,
              notes = @notes,
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE id = @id AND deleted_at IS NULL
        `).run({
          id: entryId,
          weekdayName: weekday.name,
          periodName: period.name,
          startTime: period.start_time,
          endTime: period.end_time,
          subjectId: subject.id,
          subjectName: subject.name,
          teacherId: teacher.id,
          teacherName: teacher.name,
          classroomId: classroom?.id ?? null,
          classroomName: classroom?.name ?? "",
          notes: optionalText(input?.notes),
          updatedAt: timestamp,
        });
      } else {
        db.prepare(`
          INSERT INTO timetable_entries (
            id, class_name, section, weekday_id, weekday_name, period_id,
            period_name, start_time, end_time, subject_id, subject_name,
            teacher_id, teacher_name, classroom_id, classroom_name, notes,
            created_at, updated_at, deleted_at, sync_status
          ) VALUES (
            @id, @className, @section, @weekdayId, @weekdayName, @periodId,
            @periodName, @startTime, @endTime, @subjectId, @subjectName,
            @teacherId, @teacherName, @classroomId, @classroomName, @notes,
            @createdAt, @updatedAt, NULL, 'pending'
          )
        `).run({
          id: entryId,
          className: schoolClass.name,
          section,
          weekdayId: weekday.id,
          weekdayName: weekday.name,
          periodId: period.id,
          periodName: period.name,
          startTime: period.start_time,
          endTime: period.end_time,
          subjectId: subject.id,
          subjectName: subject.name,
          teacherId: teacher.id,
          teacherName: teacher.name,
          classroomId: classroom?.id ?? null,
          classroomName: classroom?.name ?? "",
          notes: optionalText(input?.notes),
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }
      return timetableEntryFromRow(
        db.prepare("SELECT * FROM timetable_entries WHERE id = ?").get(entryId),
      );
    },

    deleteTimetableEntry(id) {
      const timestamp = now();
      const result = db
        .prepare(`
          UPDATE timetable_entries
          SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
          WHERE id = ? AND deleted_at IS NULL
        `)
        .run(timestamp, timestamp, requiredText(id, "Timetable entry id"));
      return { success: result.changes === 1 };
    },

    getHomework() {
      return db
        .prepare(`
          ${homeworkSelect}
          WHERE homework.deleted_at IS NULL
          ORDER BY homework.homework_date DESC, homework.created_at DESC
        `)
        .all()
        .map(homeworkWithCountsFromRow);
    },

    getHomeworkByClass(className, section) {
      const normalizedClass = requiredText(className, "Class");
      const sectionValue = optionalText(section);
      const normalizedSection =
        sectionValue.toLowerCase() === "all" ? "" : sectionValue;
      return db
        .prepare(`
          ${homeworkSelect}
          WHERE homework.class_name = ?
            AND (
              ? = ''
              OR COALESCE(homework.section, '') = ?
              OR COALESCE(homework.section, '') = ''
            )
            AND homework.deleted_at IS NULL
          ORDER BY homework.homework_date DESC, homework.created_at DESC
        `)
        .all(normalizedClass, normalizedSection, normalizedSection)
        .map(homeworkWithCountsFromRow);
    },

    createHomework(input) {
      const values = resolveHomeworkValues(input);
      const id = crypto.randomUUID();
      const timestamp = now();
      db.transaction(() => {
        db.prepare(`
          INSERT INTO homework (
            id, title, class_name, section, subject_id, subject_name,
            teacher_id, teacher_name, homework_date, due_date, description,
            instructions, status, created_by, created_at, updated_at,
            deleted_at, sync_status
          ) VALUES (
            @id, @title, @className, @section, @subjectId, @subjectName,
            @teacherId, @teacherName, @homeworkDate, @dueDate, @description,
            @instructions, @status, @createdBy, @createdAt, @updatedAt,
            NULL, 'pending'
          )
        `).run({
          id,
          ...values,
          dueDate: values.dueDate || null,
          createdBy: optionalText(input?.createdBy),
          createdAt: timestamp,
          updatedAt: timestamp,
        });
        createPendingHomeworkSubmissions(
          id,
          values.className,
          values.section,
          timestamp,
        );
      })();
      return homeworkWithCountsFromRow(getHomeworkRow(id));
    },

    updateHomework(id, input) {
      const homeworkId = requiredText(id, "Homework id");
      const existing = db
        .prepare(`
          SELECT *
          FROM homework
          WHERE id = ? AND deleted_at IS NULL
        `)
        .get(homeworkId);
      if (!existing) throw new Error("Homework record was not found.");
      const values = resolveHomeworkValues(input, existing);
      const groupChanged =
        values.className !== existing.class_name ||
        values.section !== (existing.section ?? "");
      if (groupChanged) {
        const trackedSubmission = db
          .prepare(`
            SELECT id
            FROM homework_submissions
            WHERE homework_id = ? AND status <> 'Pending'
            LIMIT 1
          `)
          .get(homeworkId);
        if (trackedSubmission) {
          throw new Error(
            "Class or section cannot be changed after submission tracking has started.",
          );
        }
      }
      const timestamp = now();
      db.transaction(() => {
        db.prepare(`
          UPDATE homework
          SET title = @title,
              class_name = @className,
              section = @section,
              subject_id = @subjectId,
              subject_name = @subjectName,
              teacher_id = @teacherId,
              teacher_name = @teacherName,
              homework_date = @homeworkDate,
              due_date = @dueDate,
              description = @description,
              instructions = @instructions,
              status = @status,
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE id = @id AND deleted_at IS NULL
        `).run({
          id: homeworkId,
          ...values,
          dueDate: values.dueDate || null,
          updatedAt: timestamp,
        });
        if (groupChanged) {
          db.prepare(`
            DELETE FROM homework_submissions
            WHERE homework_id = ?
          `).run(homeworkId);
        }
        createPendingHomeworkSubmissions(
          homeworkId,
          values.className,
          values.section,
          timestamp,
        );
      })();
      return homeworkWithCountsFromRow(getHomeworkRow(homeworkId));
    },

    deleteHomework(id) {
      const homeworkId = requiredText(id, "Homework id");
      const timestamp = now();
      const result = db
        .prepare(`
          UPDATE homework
          SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
          WHERE id = ? AND deleted_at IS NULL
        `)
        .run(timestamp, timestamp, homeworkId);
      return { success: result.changes === 1 };
    },

    getHomeworkSubmissions(homeworkId) {
      const normalizedHomeworkId = requiredText(homeworkId, "Homework id");
      const homeworkRecord = getHomeworkRow(normalizedHomeworkId);
      if (!homeworkRecord) return [];
      return db
        .prepare(`
          SELECT *
          FROM homework_submissions
          WHERE homework_id = ?
          ORDER BY admission_no COLLATE NOCASE, student_name COLLATE NOCASE
        `)
        .all(normalizedHomeworkId)
        .map(homeworkSubmissionFromRow);
    },

    saveHomeworkSubmissionsBulk(records) {
      if (!Array.isArray(records) || records.length === 0) {
        throw new Error("At least one homework submission is required.");
      }
      const savedIds = [];
      db.transaction(() => {
        for (const input of records) {
          const homeworkId = requiredText(input?.homeworkId, "Homework id");
          const studentId = requiredText(input?.studentId, "Student id");
          const existing = db
            .prepare(`
              SELECT homework_submissions.*
              FROM homework_submissions
              INNER JOIN homework
                ON homework.id = homework_submissions.homework_id
              WHERE homework_submissions.homework_id = ?
                AND homework_submissions.student_id = ?
                AND homework.deleted_at IS NULL
            `)
            .get(homeworkId, studentId);
          if (!existing) {
            throw new Error(
              "A homework submission record was not found for one of the students.",
            );
          }
          const values = resolveHomeworkSubmissionValues(input, existing);
          db.prepare(`
            UPDATE homework_submissions
            SET status = @status,
                submitted_date = @submittedDate,
                remarks = @remarks,
                marks = @marks,
                updated_at = @updatedAt,
                sync_status = 'pending'
            WHERE id = @id
          `).run({
            id: existing.id,
            ...values,
            updatedAt: now(),
          });
          savedIds.push(existing.id);
        }
      })();
      const getSaved = db.prepare(
        "SELECT * FROM homework_submissions WHERE id = ?",
      );
      return savedIds.map((id) =>
        homeworkSubmissionFromRow(getSaved.get(id)),
      );
    },

    updateHomeworkSubmission(id, input) {
      const submissionId = requiredText(id, "Homework submission id");
      const existing = db
        .prepare(`
          SELECT homework_submissions.*
          FROM homework_submissions
          INNER JOIN homework
            ON homework.id = homework_submissions.homework_id
          WHERE homework_submissions.id = ?
            AND homework.deleted_at IS NULL
        `)
        .get(submissionId);
      if (!existing) {
        throw new Error("Homework submission record was not found.");
      }
      const values = resolveHomeworkSubmissionValues(input, existing);
      db.prepare(`
        UPDATE homework_submissions
        SET status = @status,
            submitted_date = @submittedDate,
            remarks = @remarks,
            marks = @marks,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id
      `).run({
        id: submissionId,
        ...values,
        updatedAt: now(),
      });
      return homeworkSubmissionFromRow(
        db
          .prepare("SELECT * FROM homework_submissions WHERE id = ?")
          .get(submissionId),
      );
    },

    getClassTests() {
      return db
        .prepare(`
          ${classTestSelect}
          WHERE class_tests.deleted_at IS NULL
          ORDER BY class_tests.test_date DESC, class_tests.created_at DESC
        `)
        .all()
        .map(classTestFromRow);
    },

    getClassTestsByClass(className, section) {
      const normalizedClass = requiredText(className, "Class");
      const sectionValue = optionalText(section);
      const normalizedSection =
        sectionValue.toLowerCase() === "all" ? "" : sectionValue;
      return db
        .prepare(`
          ${classTestSelect}
          WHERE class_tests.class_name = ?
            AND (
              ? = ''
              OR COALESCE(class_tests.section, '') = ?
              OR COALESCE(class_tests.section, '') = ''
            )
            AND class_tests.deleted_at IS NULL
          ORDER BY class_tests.test_date DESC, class_tests.created_at DESC
        `)
        .all(normalizedClass, normalizedSection, normalizedSection)
        .map(classTestFromRow);
    },

    createClassTest(input) {
      const values = resolveClassTestValues(input);
      const id = crypto.randomUUID();
      const timestamp = now();
      db.transaction(() => {
        db.prepare(`
          INSERT INTO class_tests (
            id, test_name, class_name, section, subject_id, subject_name,
            teacher_id, teacher_name, test_date, max_marks, passing_marks,
            description, status, created_by, created_at, updated_at,
            deleted_at, sync_status
          ) VALUES (
            @id, @testName, @className, @section, @subjectId, @subjectName,
            @teacherId, @teacherName, @testDate, @maxMarks, @passingMarks,
            @description, @status, @createdBy, @createdAt, @updatedAt,
            NULL, 'pending'
          )
        `).run({
          id,
          ...values,
          createdBy: optionalText(input?.createdBy),
          createdAt: timestamp,
          updatedAt: timestamp,
        });
        createPendingClassTestMarks(
          id,
          values.className,
          values.section,
          timestamp,
        );
      })();
      return classTestFromRow(getClassTestRow(id));
    },

    updateClassTest(id, input) {
      const testId = requiredText(id, "Class test id");
      const existing = db
        .prepare(`
          SELECT *
          FROM class_tests
          WHERE id = ? AND deleted_at IS NULL
        `)
        .get(testId);
      if (!existing) throw new Error("Class test record was not found.");
      const values = resolveClassTestValues(input, existing);
      const groupChanged =
        values.className !== existing.class_name ||
        values.section !== (existing.section ?? "");
      if (groupChanged) {
        const enteredMark = db
          .prepare(`
            SELECT id
            FROM class_test_marks
            WHERE test_id = ? AND result_status <> 'Pending'
            LIMIT 1
          `)
          .get(testId);
        if (enteredMark) {
          throw new Error(
            "Class or section cannot be changed after test marks have been entered.",
          );
        }
      }
      const timestamp = now();
      db.transaction(() => {
        db.prepare(`
          UPDATE class_tests
          SET test_name = @testName,
              class_name = @className,
              section = @section,
              subject_id = @subjectId,
              subject_name = @subjectName,
              teacher_id = @teacherId,
              teacher_name = @teacherName,
              test_date = @testDate,
              max_marks = @maxMarks,
              passing_marks = @passingMarks,
              description = @description,
              status = @status,
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE id = @id AND deleted_at IS NULL
        `).run({
          id: testId,
          ...values,
          updatedAt: timestamp,
        });
        if (groupChanged) {
          db.prepare(`
            DELETE FROM class_test_marks
            WHERE test_id = ?
          `).run(testId);
        } else {
          db.prepare(`
            UPDATE class_test_marks
            SET result_status = CASE
                  WHEN result_status IN ('Pass', 'Fail') THEN
                    CASE WHEN marks_obtained >= ? THEN 'Pass' ELSE 'Fail' END
                  ELSE result_status
                END,
                updated_at = ?,
                sync_status = 'pending'
            WHERE test_id = ?
          `).run(values.passingMarks, timestamp, testId);
        }
        createPendingClassTestMarks(
          testId,
          values.className,
          values.section,
          timestamp,
        );
      })();
      return classTestFromRow(getClassTestRow(testId));
    },

    deleteClassTest(id) {
      const timestamp = now();
      const result = db
        .prepare(`
          UPDATE class_tests
          SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
          WHERE id = ? AND deleted_at IS NULL
        `)
        .run(timestamp, timestamp, requiredText(id, "Class test id"));
      return { success: result.changes === 1 };
    },

    getClassTestMarks(testId) {
      const normalizedTestId = requiredText(testId, "Class test id");
      if (!getClassTestRow(normalizedTestId)) return [];
      return db
        .prepare(`
          SELECT *
          FROM class_test_marks
          WHERE test_id = ?
          ORDER BY admission_no COLLATE NOCASE, student_name COLLATE NOCASE
        `)
        .all(normalizedTestId)
        .map(classTestMarkFromRow);
    },

    saveClassTestMarksBulk(records) {
      if (!Array.isArray(records)) {
        throw new Error("Class test mark records must be an array.");
      }
      if (records.length === 0) return [];
      const savedIds = [];
      db.transaction(() => {
        for (const input of records) {
          const testId = requiredText(input?.testId, "Class test id");
          const studentId = requiredText(input?.studentId, "Student id");
          const test = db
            .prepare(`
              SELECT *
              FROM class_tests
              WHERE id = ? AND deleted_at IS NULL
            `)
            .get(testId);
          if (!test) throw new Error("Class test record was not found.");
          const existing = db
            .prepare(`
              SELECT *
              FROM class_test_marks
              WHERE test_id = ? AND student_id = ?
            `)
            .get(testId, studentId);
          if (!existing) {
            throw new Error(
              "A class test mark row was not found for one of the students.",
            );
          }
          const values = resolveClassTestMarkValues(input, existing, test);
          db.prepare(`
            UPDATE class_test_marks
            SET marks_obtained = @marksObtained,
                result_status = @resultStatus,
                remarks = @remarks,
                updated_at = @updatedAt,
                sync_status = 'pending'
            WHERE id = @id
          `).run({
            id: existing.id,
            ...values,
            updatedAt: now(),
          });
          savedIds.push(existing.id);
        }
      })();
      const getSaved = db.prepare("SELECT * FROM class_test_marks WHERE id = ?");
      return savedIds.map((id) => classTestMarkFromRow(getSaved.get(id)));
    },

    updateClassTestMark(id, input) {
      const markId = requiredText(id, "Class test mark id");
      const existing = db
        .prepare(`
          SELECT *
          FROM class_test_marks
          WHERE id = ?
        `)
        .get(markId);
      if (!existing) throw new Error("Class test mark row was not found.");
      const test = db
        .prepare(`
          SELECT *
          FROM class_tests
          WHERE id = ? AND deleted_at IS NULL
        `)
        .get(existing.test_id);
      if (!test) throw new Error("Class test record was not found.");
      const values = resolveClassTestMarkValues(input, existing, test);
      db.prepare(`
        UPDATE class_test_marks
        SET marks_obtained = @marksObtained,
            result_status = @resultStatus,
            remarks = @remarks,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id
      `).run({
        id: markId,
        ...values,
        updatedAt: now(),
      });
      return classTestMarkFromRow(
        db.prepare("SELECT * FROM class_test_marks WHERE id = ?").get(markId),
      );
    },

    getSubjectChapters() {
      return db
        .prepare(`
          SELECT *
          FROM subject_chapters
          WHERE deleted_at IS NULL
          ORDER BY
            class_name COLLATE NOCASE,
            subject_name COLLATE NOCASE,
            chapter_no COLLATE NOCASE,
            chapter_name COLLATE NOCASE
        `)
        .all()
        .map(subjectChapterFromRow);
    },

    getSubjectChaptersByClassSubject(className, subjectName) {
      return db
        .prepare(`
          SELECT *
          FROM subject_chapters
          WHERE class_name = ?
            AND subject_name = ? COLLATE NOCASE
            AND deleted_at IS NULL
          ORDER BY chapter_no COLLATE NOCASE, chapter_name COLLATE NOCASE
        `)
        .all(
          requiredText(className, "Class"),
          requiredText(subjectName, "Subject"),
        )
        .map(subjectChapterFromRow);
    },

    createSubjectChapter(input) {
      const values = resolveSubjectChapterValues(input);
      const duplicate = db
        .prepare(`
          SELECT id
          FROM subject_chapters
          WHERE class_name = ?
            AND subject_id = ?
            AND chapter_name = ? COLLATE NOCASE
            AND deleted_at IS NULL
        `)
        .get(values.className, values.subjectId, values.chapterName);
      if (duplicate) {
        throw new Error("This chapter already exists for the selected subject.");
      }
      const id = crypto.randomUUID();
      const timestamp = now();
      db.prepare(`
        INSERT INTO subject_chapters (
          id, class_name, subject_id, subject_name, chapter_name, chapter_no,
          description, status, created_at, updated_at, deleted_at, sync_status
        ) VALUES (
          @id, @className, @subjectId, @subjectName, @chapterName, @chapterNo,
          @description, @status, @createdAt, @updatedAt, NULL, 'pending'
        )
      `).run({
        id,
        ...values,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      return subjectChapterFromRow(
        db.prepare("SELECT * FROM subject_chapters WHERE id = ?").get(id),
      );
    },

    updateSubjectChapter(id, input) {
      const chapterId = requiredText(id, "Subject chapter id");
      const existing = db
        .prepare(`
          SELECT *
          FROM subject_chapters
          WHERE id = ? AND deleted_at IS NULL
        `)
        .get(chapterId);
      if (!existing) throw new Error("Subject chapter was not found.");
      const values = resolveSubjectChapterValues(input, existing);
      const duplicate = db
        .prepare(`
          SELECT id
          FROM subject_chapters
          WHERE class_name = ?
            AND subject_id = ?
            AND chapter_name = ? COLLATE NOCASE
            AND id <> ?
            AND deleted_at IS NULL
        `)
        .get(
          values.className,
          values.subjectId,
          values.chapterName,
          chapterId,
        );
      if (duplicate) {
        throw new Error("This chapter already exists for the selected subject.");
      }
      const timestamp = now();
      db.transaction(() => {
        db.prepare(`
          UPDATE subject_chapters
          SET class_name = @className,
              subject_id = @subjectId,
              subject_name = @subjectName,
              chapter_name = @chapterName,
              chapter_no = @chapterNo,
              description = @description,
              status = @status,
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE id = @id AND deleted_at IS NULL
        `).run({ id: chapterId, ...values, updatedAt: timestamp });
        db.prepare(`
          UPDATE question_bank
          SET class_name = @className,
              subject_id = @subjectId,
              subject_name = @subjectName,
              chapter_name = @chapterName,
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE chapter_id = @id AND deleted_at IS NULL
        `).run({ id: chapterId, ...values, updatedAt: timestamp });
      })();
      return subjectChapterFromRow(
        db
          .prepare("SELECT * FROM subject_chapters WHERE id = ?")
          .get(chapterId),
      );
    },

    deleteSubjectChapter(id) {
      const timestamp = now();
      const result = db
        .prepare(`
          UPDATE subject_chapters
          SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
          WHERE id = ? AND deleted_at IS NULL
        `)
        .run(timestamp, timestamp, requiredText(id, "Subject chapter id"));
      return { success: result.changes === 1 };
    },

    getQuestions() {
      return db
        .prepare(`
          SELECT *
          FROM question_bank
          WHERE deleted_at IS NULL
          ORDER BY created_at DESC, question_text COLLATE NOCASE
        `)
        .all()
        .map(questionFromRow);
    },

    getQuestionsByFilter(filter) {
      const className = optionalText(filter?.className);
      const subjectId = optionalText(filter?.subjectId);
      const subjectName = optionalText(filter?.subjectName);
      const chapterId = optionalText(filter?.chapterId);
      const questionType = optionalText(filter?.questionType);
      const difficulty = optionalText(filter?.difficulty);
      if (questionType && !QUESTION_TYPES.has(questionType)) {
        throw new Error("Question type filter is invalid.");
      }
      if (difficulty && !QUESTION_DIFFICULTIES.has(difficulty)) {
        throw new Error("Question difficulty filter is invalid.");
      }
      return db
        .prepare(`
          SELECT *
          FROM question_bank
          WHERE (? = '' OR class_name = ?)
            AND (? = '' OR subject_id = ?)
            AND (? = '' OR subject_name = ? COLLATE NOCASE)
            AND (? = '' OR chapter_id = ?)
            AND (? = '' OR question_type = ?)
            AND (? = '' OR difficulty = ?)
            AND deleted_at IS NULL
          ORDER BY created_at DESC, question_text COLLATE NOCASE
        `)
        .all(
          className,
          className,
          subjectId,
          subjectId,
          subjectName,
          subjectName,
          chapterId,
          chapterId,
          questionType,
          questionType,
          difficulty,
          difficulty,
        )
        .map(questionFromRow);
    },

    createQuestion(input) {
      const values = resolveQuestionValues(input);
      const id = crypto.randomUUID();
      const timestamp = now();
      db.prepare(`
        INSERT INTO question_bank (
          id, class_name, subject_id, subject_name, chapter_id, chapter_name,
          question_type, difficulty, question_text, option_a, option_b,
          option_c, option_d, correct_answer, marks, status, created_by,
          created_at, updated_at, deleted_at, sync_status
        ) VALUES (
          @id, @className, @subjectId, @subjectName, @chapterId, @chapterName,
          @questionType, @difficulty, @questionText, @optionA, @optionB,
          @optionC, @optionD, @correctAnswer, @marks, @status, @createdBy,
          @createdAt, @updatedAt, NULL, 'pending'
        )
      `).run({
        id,
        ...values,
        createdBy: optionalText(input?.createdBy),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      return questionFromRow(
        db.prepare("SELECT * FROM question_bank WHERE id = ?").get(id),
      );
    },

    updateQuestion(id, input) {
      const questionId = requiredText(id, "Question id");
      const existing = db
        .prepare(`
          SELECT *
          FROM question_bank
          WHERE id = ? AND deleted_at IS NULL
        `)
        .get(questionId);
      if (!existing) throw new Error("Question was not found.");
      const values = resolveQuestionValues(input, existing);
      db.prepare(`
        UPDATE question_bank
        SET class_name = @className,
            subject_id = @subjectId,
            subject_name = @subjectName,
            chapter_id = @chapterId,
            chapter_name = @chapterName,
            question_type = @questionType,
            difficulty = @difficulty,
            question_text = @questionText,
            option_a = @optionA,
            option_b = @optionB,
            option_c = @optionC,
            option_d = @optionD,
            correct_answer = @correctAnswer,
            marks = @marks,
            status = @status,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id AND deleted_at IS NULL
      `).run({ id: questionId, ...values, updatedAt: now() });
      return questionFromRow(
        db
          .prepare("SELECT * FROM question_bank WHERE id = ?")
          .get(questionId),
      );
    },

    deleteQuestion(id) {
      const timestamp = now();
      const result = db
        .prepare(`
          UPDATE question_bank
          SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
          WHERE id = ? AND deleted_at IS NULL
        `)
        .run(timestamp, timestamp, requiredText(id, "Question id"));
      return { success: result.changes === 1 };
    },

    getQuestionPapers() {
      return db
        .prepare(`
          ${questionPaperSelect}
          WHERE question_papers.deleted_at IS NULL
          ORDER BY question_papers.created_at DESC
        `)
        .all()
        .map((row) => questionPaperFromRow(row));
    },

    getQuestionPaperById(id) {
      const row = getQuestionPaperRow(id);
      if (!row) return null;
      return questionPaperFromRow(row, getQuestionPaperItems(row.id));
    },

    createQuestionPaper(input) {
      const values = resolveQuestionPaperValues(input);
      const id = crypto.randomUUID();
      const timestamp = now();
      db.transaction(() => {
        db.prepare(`
          INSERT INTO question_papers (
            id, paper_no, title, class_name, section, subject_id, subject_name,
            exam_name, duration_minutes, total_marks, instructions, created_by,
            created_at, updated_at, deleted_at, sync_status
          ) VALUES (
            @id, @paperNo, @title, @className, @section, @subjectId,
            @subjectName, @examName, @durationMinutes, @totalMarks,
            @instructions, @createdBy, @createdAt, @updatedAt, NULL, 'pending'
          )
        `).run({
          id,
          paperNo: generateQuestionPaperNumber(),
          ...values,
          createdBy: optionalText(input?.createdBy),
          createdAt: timestamp,
          updatedAt: timestamp,
        });
        insertQuestionPaperItems(id, values.items, timestamp);
      })();
      return this.getQuestionPaperById(id);
    },

    updateQuestionPaper(id, input) {
      const paperId = requiredText(id, "Question paper id");
      const existing = db
        .prepare(`
          SELECT *
          FROM question_papers
          WHERE id = ? AND deleted_at IS NULL
        `)
        .get(paperId);
      if (!existing) throw new Error("Question paper was not found.");
      const values = resolveQuestionPaperValues(input, existing);
      const timestamp = now();
      db.transaction(() => {
        db.prepare(`
          UPDATE question_papers
          SET title = @title,
              class_name = @className,
              section = @section,
              subject_id = @subjectId,
              subject_name = @subjectName,
              exam_name = @examName,
              duration_minutes = @durationMinutes,
              total_marks = @totalMarks,
              instructions = @instructions,
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE id = @id AND deleted_at IS NULL
        `).run({ id: paperId, ...values, updatedAt: timestamp });
        db.prepare("DELETE FROM question_paper_items WHERE paper_id = ?").run(
          paperId,
        );
        insertQuestionPaperItems(paperId, values.items, timestamp);
      })();
      return this.getQuestionPaperById(paperId);
    },

    deleteQuestionPaper(id) {
      const timestamp = now();
      const result = db
        .prepare(`
          UPDATE question_papers
          SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
          WHERE id = ? AND deleted_at IS NULL
        `)
        .run(timestamp, timestamp, requiredText(id, "Question paper id"));
      return { success: result.changes === 1 };
    },

    getBehaviourTraits() {
      return db
        .prepare(`
          SELECT *
          FROM behaviour_traits
          WHERE deleted_at IS NULL
          ORDER BY
            CASE status WHEN 'Active' THEN 0 ELSE 1 END,
            name COLLATE NOCASE
        `)
        .all()
        .map(behaviourTraitFromRow);
    },

    createBehaviourTrait(input) {
      const name = requiredText(input?.name, "Behaviour trait name");
      const duplicate = db
        .prepare(`
          SELECT id
          FROM behaviour_traits
          WHERE name = ? COLLATE NOCASE AND deleted_at IS NULL
        `)
        .get(name);
      if (duplicate) {
        throw new Error("An active behaviour trait with this name already exists.");
      }
      const id = crypto.randomUUID();
      const timestamp = now();
      db.prepare(`
        INSERT INTO behaviour_traits (
          id, name, description, status, created_at, updated_at, deleted_at,
          sync_status
        ) VALUES (
          @id, @name, @description, @status, @createdAt, @updatedAt, NULL,
          'pending'
        )
      `).run({
        id,
        name,
        description: optionalText(input?.description),
        status: masterStatus(input?.status),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      return behaviourTraitFromRow(
        db.prepare("SELECT * FROM behaviour_traits WHERE id = ?").get(id),
      );
    },

    updateBehaviourTrait(id, input) {
      const traitId = requiredText(id, "Behaviour trait id");
      const existing = db
        .prepare(`
          SELECT *
          FROM behaviour_traits
          WHERE id = ? AND deleted_at IS NULL
        `)
        .get(traitId);
      if (!existing) throw new Error("Behaviour trait was not found.");
      const name =
        input?.name === undefined
          ? existing.name
          : requiredText(input.name, "Behaviour trait name");
      const duplicate = db
        .prepare(`
          SELECT id
          FROM behaviour_traits
          WHERE name = ? COLLATE NOCASE
            AND id <> ?
            AND deleted_at IS NULL
        `)
        .get(name, traitId);
      if (duplicate) {
        throw new Error("An active behaviour trait with this name already exists.");
      }
      db.prepare(`
        UPDATE behaviour_traits
        SET name = @name,
            description = @description,
            status = @status,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id AND deleted_at IS NULL
      `).run({
        id: traitId,
        name,
        description:
          input?.description === undefined
            ? existing.description ?? ""
            : optionalText(input.description),
        status: masterStatus(input?.status, existing.status),
        updatedAt: now(),
      });
      return behaviourTraitFromRow(
        db
          .prepare("SELECT * FROM behaviour_traits WHERE id = ?")
          .get(traitId),
      );
    },

    deleteBehaviourTrait(id) {
      const timestamp = now();
      const result = db
        .prepare(`
          UPDATE behaviour_traits
          SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
          WHERE id = ? AND deleted_at IS NULL
        `)
        .run(timestamp, timestamp, requiredText(id, "Behaviour trait id"));
      return { success: result.changes === 1 };
    },

    getSkillTraits() {
      return db
        .prepare(`
          SELECT *
          FROM skill_traits
          WHERE deleted_at IS NULL
          ORDER BY
            CASE domain WHEN 'Affective' THEN 0 ELSE 1 END,
            CASE status WHEN 'Active' THEN 0 ELSE 1 END,
            name COLLATE NOCASE
        `)
        .all()
        .map(skillTraitFromRow);
    },

    createSkillTrait(input) {
      const name = requiredText(input?.name, "Skill trait name");
      const domain = requiredText(input?.domain, "Skill domain");
      if (!SKILL_DOMAINS.has(domain)) {
        throw new Error("Skill domain is invalid.");
      }
      const duplicate = db
        .prepare(`
          SELECT id
          FROM skill_traits
          WHERE name = ? COLLATE NOCASE
            AND domain = ?
            AND deleted_at IS NULL
        `)
        .get(name, domain);
      if (duplicate) {
        throw new Error("This skill trait already exists in the selected domain.");
      }
      const id = crypto.randomUUID();
      const timestamp = now();
      db.prepare(`
        INSERT INTO skill_traits (
          id, name, domain, description, status, created_at, updated_at,
          deleted_at, sync_status
        ) VALUES (
          @id, @name, @domain, @description, @status, @createdAt, @updatedAt,
          NULL, 'pending'
        )
      `).run({
        id,
        name,
        domain,
        description: optionalText(input?.description),
        status: masterStatus(input?.status),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      return skillTraitFromRow(
        db.prepare("SELECT * FROM skill_traits WHERE id = ?").get(id),
      );
    },

    updateSkillTrait(id, input) {
      const skillId = requiredText(id, "Skill trait id");
      const existing = db
        .prepare(`
          SELECT *
          FROM skill_traits
          WHERE id = ? AND deleted_at IS NULL
        `)
        .get(skillId);
      if (!existing) throw new Error("Skill trait was not found.");
      const name =
        input?.name === undefined
          ? existing.name
          : requiredText(input.name, "Skill trait name");
      const domain =
        input?.domain === undefined
          ? existing.domain
          : requiredText(input.domain, "Skill domain");
      if (!SKILL_DOMAINS.has(domain)) {
        throw new Error("Skill domain is invalid.");
      }
      const duplicate = db
        .prepare(`
          SELECT id
          FROM skill_traits
          WHERE name = ? COLLATE NOCASE
            AND domain = ?
            AND id <> ?
            AND deleted_at IS NULL
        `)
        .get(name, domain, skillId);
      if (duplicate) {
        throw new Error("This skill trait already exists in the selected domain.");
      }
      db.prepare(`
        UPDATE skill_traits
        SET name = @name,
            domain = @domain,
            description = @description,
            status = @status,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id AND deleted_at IS NULL
      `).run({
        id: skillId,
        name,
        domain,
        description:
          input?.description === undefined
            ? existing.description ?? ""
            : optionalText(input.description),
        status: masterStatus(input?.status, existing.status),
        updatedAt: now(),
      });
      return skillTraitFromRow(
        db.prepare("SELECT * FROM skill_traits WHERE id = ?").get(skillId),
      );
    },

    deleteSkillTrait(id) {
      const timestamp = now();
      const result = db
        .prepare(`
          UPDATE skill_traits
          SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
          WHERE id = ? AND deleted_at IS NULL
        `)
        .run(timestamp, timestamp, requiredText(id, "Skill trait id"));
      return { success: result.changes === 1 };
    },

    getBehaviourRatings(filter = {}) {
      const className = optionalText(filter?.className);
      const section = optionalText(filter?.section);
      const studentId = optionalText(filter?.studentId);
      const traitId = optionalText(filter?.traitId);
      const academicYear = optionalText(filter?.academicYear);
      const startDate = optionalText(filter?.startDate);
      const endDate = optionalText(filter?.endDate);
      const normalizedStartDate = startDate
        ? normalizeDate(startDate, "Start date")
        : "";
      const normalizedEndDate = endDate
        ? normalizeDate(endDate, "End date")
        : "";
      if (
        normalizedStartDate &&
        normalizedEndDate &&
        normalizedStartDate > normalizedEndDate
      ) {
        throw new Error("Start date cannot be after end date.");
      }
      return db
        .prepare(`
          SELECT *
          FROM student_behaviour_ratings
          WHERE (? = '' OR class_name = ?)
            AND (? = '' OR COALESCE(section, '') = ?)
            AND (? = '' OR student_id = ?)
            AND (? = '' OR trait_id = ?)
            AND (? = '' OR COALESCE(academic_year, '') = ?)
            AND (? = '' OR rating_date >= ?)
            AND (? = '' OR rating_date <= ?)
            AND deleted_at IS NULL
          ORDER BY rating_date DESC, class_name, section, student_name, trait_name
        `)
        .all(
          className,
          className,
          section,
          section,
          studentId,
          studentId,
          traitId,
          traitId,
          academicYear,
          academicYear,
          normalizedStartDate,
          normalizedStartDate,
          normalizedEndDate,
          normalizedEndDate,
        )
        .map(behaviourRatingFromRow);
    },

    saveBehaviourRatingsBulk(records) {
      if (!Array.isArray(records) || records.length === 0) {
        throw new Error("At least one behaviour rating is required.");
      }
      return db.transaction(() => {
        const saved = [];
        for (const input of records) {
          const studentId = requiredText(input?.studentId, "Student");
          const traitId = requiredText(input?.traitId, "Behaviour trait");
          const student = getStudentStatement.get(studentId);
          if (!student || student.status !== "Active") {
            throw new Error("Select an active student.");
          }
          const trait = db
            .prepare(`
              SELECT *
              FROM behaviour_traits
              WHERE id = ? AND status = 'Active' AND deleted_at IS NULL
            `)
            .get(traitId);
          if (!trait) throw new Error("Select an active behaviour trait.");
          const rating = requiredText(input?.rating, "Rating");
          if (!RATING_VALUES.has(rating)) {
            throw new Error("Behaviour rating is invalid.");
          }
          const ratingDate = normalizeDate(input?.ratingDate, "Rating date");
          const academicYear = optionalText(input?.academicYear);
          const existing = db
            .prepare(`
              SELECT *
              FROM student_behaviour_ratings
              WHERE student_id = ?
                AND trait_id = ?
                AND rating_date = ?
                AND COALESCE(academic_year, '') = ?
                AND deleted_at IS NULL
            `)
            .get(studentId, traitId, ratingDate, academicYear);
          const timestamp = now();
          if (existing) {
            db.prepare(`
              UPDATE student_behaviour_ratings
              SET student_name = @studentName,
                  admission_no = @admissionNo,
                  class_name = @className,
                  section = @section,
                  trait_name = @traitName,
                  rating = @rating,
                  remarks = @remarks,
                  rated_by = @ratedBy,
                  updated_at = @updatedAt,
                  sync_status = 'pending'
              WHERE id = @id AND deleted_at IS NULL
            `).run({
              id: existing.id,
              studentName: student.name,
              admissionNo: student.admission_no,
              className: student.class_name,
              section: student.section ?? "",
              traitName: trait.name,
              rating,
              remarks: optionalText(input?.remarks),
              ratedBy: optionalText(input?.ratedBy),
              updatedAt: timestamp,
            });
            saved.push(
              behaviourRatingFromRow(
                db
                  .prepare("SELECT * FROM student_behaviour_ratings WHERE id = ?")
                  .get(existing.id),
              ),
            );
            continue;
          }
          const id = crypto.randomUUID();
          db.prepare(`
            INSERT INTO student_behaviour_ratings (
              id, student_id, student_name, admission_no, class_name, section,
              trait_id, trait_name, rating, rating_date, academic_year,
              remarks, rated_by, created_at, updated_at, deleted_at, sync_status
            ) VALUES (
              @id, @studentId, @studentName, @admissionNo, @className,
              @section, @traitId, @traitName, @rating, @ratingDate,
              @academicYear, @remarks, @ratedBy, @createdAt, @updatedAt, NULL,
              'pending'
            )
          `).run({
            id,
            studentId,
            studentName: student.name,
            admissionNo: student.admission_no,
            className: student.class_name,
            section: student.section ?? "",
            traitId,
            traitName: trait.name,
            rating,
            ratingDate,
            academicYear,
            remarks: optionalText(input?.remarks),
            ratedBy: optionalText(input?.ratedBy),
            createdAt: timestamp,
            updatedAt: timestamp,
          });
          saved.push(
            behaviourRatingFromRow(
              db
                .prepare("SELECT * FROM student_behaviour_ratings WHERE id = ?")
                .get(id),
            ),
          );
        }
        return saved;
      })();
    },

    getSkillRatings(filter = {}) {
      const className = optionalText(filter?.className);
      const section = optionalText(filter?.section);
      const studentId = optionalText(filter?.studentId);
      const skillId = optionalText(filter?.skillId);
      const domain = optionalText(filter?.domain);
      const academicYear = optionalText(filter?.academicYear);
      if (domain && !SKILL_DOMAINS.has(domain)) {
        throw new Error("Skill domain filter is invalid.");
      }
      const startDate = optionalText(filter?.startDate);
      const endDate = optionalText(filter?.endDate);
      const normalizedStartDate = startDate
        ? normalizeDate(startDate, "Start date")
        : "";
      const normalizedEndDate = endDate
        ? normalizeDate(endDate, "End date")
        : "";
      if (
        normalizedStartDate &&
        normalizedEndDate &&
        normalizedStartDate > normalizedEndDate
      ) {
        throw new Error("Start date cannot be after end date.");
      }
      return db
        .prepare(`
          SELECT *
          FROM student_skill_ratings
          WHERE (? = '' OR class_name = ?)
            AND (? = '' OR COALESCE(section, '') = ?)
            AND (? = '' OR student_id = ?)
            AND (? = '' OR skill_id = ?)
            AND (? = '' OR domain = ?)
            AND (? = '' OR COALESCE(academic_year, '') = ?)
            AND (? = '' OR rating_date >= ?)
            AND (? = '' OR rating_date <= ?)
            AND deleted_at IS NULL
          ORDER BY rating_date DESC, class_name, section, student_name, skill_name
        `)
        .all(
          className,
          className,
          section,
          section,
          studentId,
          studentId,
          skillId,
          skillId,
          domain,
          domain,
          academicYear,
          academicYear,
          normalizedStartDate,
          normalizedStartDate,
          normalizedEndDate,
          normalizedEndDate,
        )
        .map(skillRatingFromRow);
    },

    saveSkillRatingsBulk(records) {
      if (!Array.isArray(records) || records.length === 0) {
        throw new Error("At least one skill rating is required.");
      }
      return db.transaction(() => {
        const saved = [];
        for (const input of records) {
          const studentId = requiredText(input?.studentId, "Student");
          const skillId = requiredText(input?.skillId, "Skill trait");
          const student = getStudentStatement.get(studentId);
          if (!student || student.status !== "Active") {
            throw new Error("Select an active student.");
          }
          const skill = db
            .prepare(`
              SELECT *
              FROM skill_traits
              WHERE id = ? AND status = 'Active' AND deleted_at IS NULL
            `)
            .get(skillId);
          if (!skill) throw new Error("Select an active skill trait.");
          const rating = requiredText(input?.rating, "Rating");
          if (!RATING_VALUES.has(rating)) {
            throw new Error("Skill rating is invalid.");
          }
          const ratingDate = normalizeDate(input?.ratingDate, "Rating date");
          const academicYear = optionalText(input?.academicYear);
          const existing = db
            .prepare(`
              SELECT *
              FROM student_skill_ratings
              WHERE student_id = ?
                AND skill_id = ?
                AND rating_date = ?
                AND COALESCE(academic_year, '') = ?
                AND deleted_at IS NULL
            `)
            .get(studentId, skillId, ratingDate, academicYear);
          const timestamp = now();
          if (existing) {
            db.prepare(`
              UPDATE student_skill_ratings
              SET student_name = @studentName,
                  admission_no = @admissionNo,
                  class_name = @className,
                  section = @section,
                  skill_name = @skillName,
                  domain = @domain,
                  rating = @rating,
                  remarks = @remarks,
                  rated_by = @ratedBy,
                  updated_at = @updatedAt,
                  sync_status = 'pending'
              WHERE id = @id AND deleted_at IS NULL
            `).run({
              id: existing.id,
              studentName: student.name,
              admissionNo: student.admission_no,
              className: student.class_name,
              section: student.section ?? "",
              skillName: skill.name,
              domain: skill.domain,
              rating,
              remarks: optionalText(input?.remarks),
              ratedBy: optionalText(input?.ratedBy),
              updatedAt: timestamp,
            });
            saved.push(
              skillRatingFromRow(
                db
                  .prepare("SELECT * FROM student_skill_ratings WHERE id = ?")
                  .get(existing.id),
              ),
            );
            continue;
          }
          const id = crypto.randomUUID();
          db.prepare(`
            INSERT INTO student_skill_ratings (
              id, student_id, student_name, admission_no, class_name, section,
              skill_id, skill_name, domain, rating, rating_date, academic_year,
              remarks, rated_by, created_at, updated_at, deleted_at, sync_status
            ) VALUES (
              @id, @studentId, @studentName, @admissionNo, @className,
              @section, @skillId, @skillName, @domain, @rating, @ratingDate,
              @academicYear, @remarks, @ratedBy, @createdAt, @updatedAt, NULL,
              'pending'
            )
          `).run({
            id,
            studentId,
            studentName: student.name,
            admissionNo: student.admission_no,
            className: student.class_name,
            section: student.section ?? "",
            skillId,
            skillName: skill.name,
            domain: skill.domain,
            rating,
            ratingDate,
            academicYear,
            remarks: optionalText(input?.remarks),
            ratedBy: optionalText(input?.ratedBy),
            createdAt: timestamp,
            updatedAt: timestamp,
          });
          saved.push(
            skillRatingFromRow(
              db.prepare("SELECT * FROM student_skill_ratings WHERE id = ?").get(id),
            ),
          );
        }
        return saved;
      })();
    },

    getStudentObservations(filter = {}) {
      const className = optionalText(filter?.className);
      const section = optionalText(filter?.section);
      const studentId = optionalText(filter?.studentId);
      const observationType = optionalText(filter?.observationType);
      const status = optionalText(filter?.status);
      if (observationType && !OBSERVATION_TYPES.has(observationType)) {
        throw new Error("Observation type filter is invalid.");
      }
      if (status && !OBSERVATION_STATUSES.has(status)) {
        throw new Error("Observation status filter is invalid.");
      }
      const startDate = optionalText(filter?.startDate);
      const endDate = optionalText(filter?.endDate);
      const normalizedStartDate = startDate
        ? normalizeDate(startDate, "Start date")
        : "";
      const normalizedEndDate = endDate
        ? normalizeDate(endDate, "End date")
        : "";
      if (
        normalizedStartDate &&
        normalizedEndDate &&
        normalizedStartDate > normalizedEndDate
      ) {
        throw new Error("Start date cannot be after end date.");
      }
      return db
        .prepare(`
          SELECT *
          FROM student_observations
          WHERE (? = '' OR class_name = ?)
            AND (? = '' OR COALESCE(section, '') = ?)
            AND (? = '' OR student_id = ?)
            AND (? = '' OR observation_type = ?)
            AND (? = '' OR status = ?)
            AND (? = '' OR observation_date >= ?)
            AND (? = '' OR observation_date <= ?)
            AND deleted_at IS NULL
          ORDER BY observation_date DESC, created_at DESC
        `)
        .all(
          className,
          className,
          section,
          section,
          studentId,
          studentId,
          observationType,
          observationType,
          status,
          status,
          normalizedStartDate,
          normalizedStartDate,
          normalizedEndDate,
          normalizedEndDate,
        )
        .map(studentObservationFromRow);
    },

    createStudentObservation(input) {
      const studentId = requiredText(input?.studentId, "Student");
      const student = getStudentStatement.get(studentId);
      if (!student || student.status !== "Active") {
        throw new Error("Select an active student.");
      }
      const observationDate = normalizeDate(
        input?.observationDate,
        "Observation date",
      );
      const observationType = requiredText(
        input?.observationType,
        "Observation type",
      );
      if (!OBSERVATION_TYPES.has(observationType)) {
        throw new Error("Observation type is invalid.");
      }
      const status = optionalText(input?.status) || "Open";
      if (!OBSERVATION_STATUSES.has(status)) {
        throw new Error("Observation status is invalid.");
      }
      const followUpDateText = optionalText(input?.followUpDate);
      const followUpDate = followUpDateText
        ? normalizeDate(followUpDateText, "Follow-up date")
        : "";
      if (followUpDate && followUpDate < observationDate) {
        throw new Error("Follow-up date cannot be before the observation date.");
      }
      const id = crypto.randomUUID();
      const timestamp = now();
      db.prepare(`
        INSERT INTO student_observations (
          id, student_id, student_name, admission_no, class_name, section,
          observation_date, observation_type, observation_text, action_taken,
          follow_up_date, status, created_by, created_at, updated_at,
          deleted_at, sync_status
        ) VALUES (
          @id, @studentId, @studentName, @admissionNo, @className, @section,
          @observationDate, @observationType, @observationText, @actionTaken,
          @followUpDate, @status, @createdBy, @createdAt, @updatedAt, NULL,
          'pending'
        )
      `).run({
        id,
        studentId,
        studentName: student.name,
        admissionNo: student.admission_no,
        className: student.class_name,
        section: student.section ?? "",
        observationDate,
        observationType,
        observationText: requiredText(
          input?.observationText,
          "Observation",
        ),
        actionTaken: optionalText(input?.actionTaken),
        followUpDate,
        status,
        createdBy: optionalText(input?.createdBy),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      return studentObservationFromRow(
        db.prepare("SELECT * FROM student_observations WHERE id = ?").get(id),
      );
    },

    updateStudentObservation(id, input) {
      const observationId = requiredText(id, "Observation id");
      const existing = db
        .prepare(`
          SELECT *
          FROM student_observations
          WHERE id = ? AND deleted_at IS NULL
        `)
        .get(observationId);
      if (!existing) throw new Error("Student observation was not found.");
      const studentId =
        input?.studentId === undefined
          ? existing.student_id
          : requiredText(input.studentId, "Student");
      const student = getStudentStatement.get(studentId);
      if (!student || student.status !== "Active") {
        throw new Error("Select an active student.");
      }
      const observationDate =
        input?.observationDate === undefined
          ? existing.observation_date
          : normalizeDate(input.observationDate, "Observation date");
      const observationType =
        input?.observationType === undefined
          ? existing.observation_type
          : requiredText(input.observationType, "Observation type");
      if (!OBSERVATION_TYPES.has(observationType)) {
        throw new Error("Observation type is invalid.");
      }
      const status =
        input?.status === undefined
          ? existing.status
          : requiredText(input.status, "Observation status");
      if (!OBSERVATION_STATUSES.has(status)) {
        throw new Error("Observation status is invalid.");
      }
      const followUpDateText =
        input?.followUpDate === undefined
          ? existing.follow_up_date ?? ""
          : optionalText(input.followUpDate);
      const followUpDate = followUpDateText
        ? normalizeDate(followUpDateText, "Follow-up date")
        : "";
      if (followUpDate && followUpDate < observationDate) {
        throw new Error("Follow-up date cannot be before the observation date.");
      }
      db.prepare(`
        UPDATE student_observations
        SET student_id = @studentId,
            student_name = @studentName,
            admission_no = @admissionNo,
            class_name = @className,
            section = @section,
            observation_date = @observationDate,
            observation_type = @observationType,
            observation_text = @observationText,
            action_taken = @actionTaken,
            follow_up_date = @followUpDate,
            status = @status,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id AND deleted_at IS NULL
      `).run({
        id: observationId,
        studentId,
        studentName: student.name,
        admissionNo: student.admission_no,
        className: student.class_name,
        section: student.section ?? "",
        observationDate,
        observationType,
        observationText:
          input?.observationText === undefined
            ? existing.observation_text
            : requiredText(input.observationText, "Observation"),
        actionTaken:
          input?.actionTaken === undefined
            ? existing.action_taken ?? ""
            : optionalText(input.actionTaken),
        followUpDate,
        status,
        updatedAt: now(),
      });
      return studentObservationFromRow(
        db
          .prepare("SELECT * FROM student_observations WHERE id = ?")
          .get(observationId),
      );
    },

    deleteStudentObservation(id) {
      const timestamp = now();
      const result = db
        .prepare(`
          UPDATE student_observations
          SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
          WHERE id = ? AND deleted_at IS NULL
        `)
        .run(timestamp, timestamp, requiredText(id, "Observation id"));
      return { success: result.changes === 1 };
    },

    getAcademicSessions() {
      return db
        .prepare(`
          SELECT *
          FROM academic_sessions
          WHERE deleted_at IS NULL
          ORDER BY
            is_current DESC,
            start_date DESC,
            session_name DESC
        `)
        .all()
        .map(academicSessionFromRow);
    },

    getCurrentAcademicSession() {
      const row = db
        .prepare(`
          SELECT *
          FROM academic_sessions
          WHERE is_current = 1 AND deleted_at IS NULL
        `)
        .get();
      return row ? academicSessionFromRow(row) : null;
    },

    createAcademicSession(input) {
      const sessionName = normalizeSessionName(input?.sessionName);
      const startDateText = optionalText(input?.startDate);
      const endDateText = optionalText(input?.endDate);
      const startDate = startDateText
        ? normalizeDate(startDateText, "Start date")
        : "";
      const endDate = endDateText
        ? normalizeDate(endDateText, "End date")
        : "";
      if (startDate && endDate && startDate > endDate) {
        throw new Error("Session start date cannot be after its end date.");
      }
      const duplicate = db
        .prepare(`
          SELECT id
          FROM academic_sessions
          WHERE session_name = ? COLLATE NOCASE AND deleted_at IS NULL
        `)
        .get(sessionName);
      if (duplicate) {
        throw new Error("An academic session with this name already exists.");
      }
      const id = crypto.randomUUID();
      const timestamp = now();
      db.prepare(`
        INSERT INTO academic_sessions (
          id, session_name, start_date, end_date, status, is_current,
          created_at, updated_at, closed_at, deleted_at, sync_status
        ) VALUES (
          @id, @sessionName, @startDate, @endDate, 'Inactive', 0,
          @createdAt, @updatedAt, NULL, NULL, 'pending'
        )
      `).run({
        id,
        sessionName,
        startDate,
        endDate,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      return academicSessionFromRow(getAcademicSessionRow(id));
    },

    updateAcademicSession(id, input) {
      const sessionId = requiredText(id, "Academic session id");
      const existing = getAcademicSessionRow(sessionId);
      if (!existing) throw new Error("Academic session was not found.");
      if (existing.status === "Closed") {
        throw new Error("A closed academic session cannot be edited.");
      }
      const sessionName =
        input?.sessionName === undefined
          ? existing.session_name
          : normalizeSessionName(input.sessionName);
      const duplicate = db
        .prepare(`
          SELECT id
          FROM academic_sessions
          WHERE session_name = ? COLLATE NOCASE
            AND id <> ?
            AND deleted_at IS NULL
        `)
        .get(sessionName, sessionId);
      if (duplicate) {
        throw new Error("An academic session with this name already exists.");
      }
      const startDateText =
        input?.startDate === undefined
          ? existing.start_date ?? ""
          : optionalText(input.startDate);
      const endDateText =
        input?.endDate === undefined
          ? existing.end_date ?? ""
          : optionalText(input.endDate);
      const startDate = startDateText
        ? normalizeDate(startDateText, "Start date")
        : "";
      const endDate = endDateText
        ? normalizeDate(endDateText, "End date")
        : "";
      if (startDate && endDate && startDate > endDate) {
        throw new Error("Session start date cannot be after its end date.");
      }
      db.transaction(() => {
        db.prepare(`
          UPDATE academic_sessions
          SET session_name = @sessionName,
              start_date = @startDate,
              end_date = @endDate,
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE id = @id AND deleted_at IS NULL
        `).run({
          id: sessionId,
          sessionName,
          startDate,
          endDate,
          updatedAt: now(),
        });
        if (sessionName !== existing.session_name) {
          db.prepare(`
            UPDATE student_session_history
            SET academic_session_name = ?, updated_at = ?, sync_status = 'pending'
            WHERE academic_session_id = ?
          `).run(sessionName, now(), sessionId);
          db.prepare(`
            UPDATE student_session_history
            SET promoted_to_session_name = ?, updated_at = ?,
                sync_status = 'pending'
            WHERE promoted_to_session_id = ?
          `).run(sessionName, now(), sessionId);
          db.prepare(`
            UPDATE student_promotions
            SET from_session_name = CASE
                  WHEN from_session_id = ? THEN ? ELSE from_session_name
                END,
                to_session_name = CASE
                  WHEN to_session_id = ? THEN ? ELSE to_session_name
                END,
                updated_at = ?,
                sync_status = 'pending'
            WHERE from_session_id = ? OR to_session_id = ?
          `).run(
            sessionId,
            sessionName,
            sessionId,
            sessionName,
            now(),
            sessionId,
            sessionId,
          );
          db.prepare(`
            UPDATE fee_due_carry_forward
            SET from_session_name = CASE
                  WHEN from_session_id = ? THEN ? ELSE from_session_name
                END,
                to_session_name = CASE
                  WHEN to_session_id = ? THEN ? ELSE to_session_name
                END,
                updated_at = ?,
                sync_status = 'pending'
            WHERE from_session_id = ? OR to_session_id = ?
          `).run(
            sessionId,
            sessionName,
            sessionId,
            sessionName,
            now(),
            sessionId,
            sessionId,
          );
        }
      })();
      return academicSessionFromRow(getAcademicSessionRow(sessionId));
    },

    setCurrentAcademicSession(id) {
      const sessionId = requiredText(id, "Academic session id");
      const session = getAcademicSessionRow(sessionId);
      if (!session) throw new Error("Academic session was not found.");
      if (session.status === "Closed") {
        throw new Error("A closed session cannot be made current.");
      }
      db.transaction(() => {
        const timestamp = now();
        db.prepare(`
          UPDATE academic_sessions
          SET is_current = 0,
              status = CASE
                WHEN status = 'Active' THEN 'Inactive'
                ELSE status
              END,
              updated_at = ?,
              sync_status = 'pending'
          WHERE is_current = 1 AND deleted_at IS NULL
        `).run(timestamp);
        db.prepare(`
          UPDATE academic_sessions
          SET is_current = 1,
              status = 'Active',
              updated_at = ?,
              sync_status = 'pending'
          WHERE id = ? AND deleted_at IS NULL
        `).run(timestamp, sessionId);
        const currentSession = getAcademicSessionRow(sessionId);
        const students = db
          .prepare(`
            SELECT id
            FROM students
            WHERE status = 'Active' AND deleted_at IS NULL
          `)
          .all();
        for (const student of students) {
          ensureStudentSessionHistory(student.id, currentSession);
        }
      })();
      return academicSessionFromRow(getAcademicSessionRow(sessionId));
    },

    closeAcademicSession(id) {
      const sessionId = requiredText(id, "Academic session id");
      const session = getAcademicSessionRow(sessionId);
      if (!session) throw new Error("Academic session was not found.");
      if (session.status === "Closed") {
        return academicSessionFromRow(session);
      }
      if (Number(session.is_current) === 1) {
        throw new Error(
          "Set the next academic session as current before closing this session.",
        );
      }
      const currentSession = db
        .prepare(`
          SELECT id
          FROM academic_sessions
          WHERE is_current = 1 AND deleted_at IS NULL
        `)
        .get();
      if (!currentSession) {
        throw new Error(
          "Select or create the next current session before closing this session.",
        );
      }
      const timestamp = now();
      db.prepare(`
        UPDATE academic_sessions
        SET status = 'Closed',
            is_current = 0,
            closed_at = ?,
            updated_at = ?,
            sync_status = 'pending'
        WHERE id = ? AND deleted_at IS NULL
      `).run(timestamp, timestamp, sessionId);
      return academicSessionFromRow(getAcademicSessionRow(sessionId));
    },

    deleteAcademicSession(id) {
      const sessionId = requiredText(id, "Academic session id");
      const session = getAcademicSessionRow(sessionId);
      if (!session) return { success: false };
      if (Number(session.is_current) === 1) {
        throw new Error("The current academic session cannot be deleted.");
      }
      const dependencies = Number(
        db
          .prepare(`
            SELECT
              (SELECT COUNT(*) FROM student_session_history
                WHERE academic_session_id = ?) +
              (SELECT COUNT(*) FROM student_promotions
                WHERE from_session_id = ? OR to_session_id = ?) AS count
          `)
          .get(sessionId, sessionId, sessionId).count,
      );
      if (dependencies > 0) {
        throw new Error(
          "This session has student history or promotions and cannot be deleted.",
        );
      }
      const timestamp = now();
      const result = db
        .prepare(`
          UPDATE academic_sessions
          SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
          WHERE id = ? AND deleted_at IS NULL
        `)
        .run(timestamp, timestamp, sessionId);
      return { success: result.changes === 1 };
    },

    getStudentSessionHistory(studentId) {
      return db
        .prepare(`
          SELECT *
          FROM student_session_history
          WHERE student_id = ?
          ORDER BY academic_session_name DESC, created_at DESC
        `)
        .all(requiredText(studentId, "Student"))
        .map(studentSessionHistoryFromRow);
    },

    getSessionStudents(sessionId) {
      const session = getAcademicSessionRow(sessionId);
      if (!session) return [];
      return db
        .prepare(`
          SELECT *
          FROM student_session_history
          WHERE academic_session_id = ?
          ORDER BY class_name, section, student_name COLLATE NOCASE
        `)
        .all(session.id)
        .map(studentSessionHistoryFromRow);
    },

    createOrUpdateStudentSessionHistory(input) {
      const session = getAcademicSessionRow(
        requiredText(input?.academicSessionId, "Academic session"),
      );
      if (!session) throw new Error("Academic session was not found.");
      const studentId = requiredText(input?.studentId, "Student");
      const student = getStudentStatement.get(studentId);
      if (!student) throw new Error("Student record was not found.");
      const classSection = validateClassSection(
        input?.className ?? student.class_name,
        input?.section ?? student.section,
      );
      const row = ensureStudentSessionHistory(studentId, session, {
        className: classSection.className,
        section: classSection.section,
        rollNo: input?.rollNo,
        status: input?.status,
        resultStatus: input?.resultStatus,
        remarks: input?.remarks,
      });
      return studentSessionHistoryFromRow(row);
    },

    getPromotionPreview(input) {
      const fromSession = getAcademicSessionRow(
        requiredText(input?.fromSessionId, "From session"),
      );
      const toSession = getAcademicSessionRow(
        requiredText(input?.toSessionId, "To session"),
      );
      if (!fromSession || !toSession) {
        throw new Error("Select valid academic sessions.");
      }
      if (fromSession.id === toSession.id) {
        throw new Error("From and to sessions must be different.");
      }
      if (toSession.status === "Closed") {
        throw new Error("Students cannot be promoted into a closed session.");
      }
      const className = requiredText(input?.className, "Class");
      const section = optionalText(input?.section);
      const historyRows = db
        .prepare(`
          SELECT *
          FROM student_session_history
          WHERE academic_session_id = ?
            AND class_name = ?
            AND (? = '' OR COALESCE(section, '') = ?)
            AND status = 'Active'
          ORDER BY student_name COLLATE NOCASE
        `)
        .all(fromSession.id, className, section, section);
      const studentsById = new Map();
      for (const history of historyRows) {
        const student = getStudentStatement.get(history.student_id);
        if (student && student.status === "Active") {
          studentsById.set(student.id, { student, history });
        }
      }
      if (Number(fromSession.is_current) === 1) {
        const currentStudents = db
          .prepare(`
            SELECT *
            FROM students
            WHERE class_name = ?
              AND (? = '' OR COALESCE(section, '') = ?)
              AND status = 'Active'
              AND deleted_at IS NULL
            ORDER BY name COLLATE NOCASE
          `)
          .all(className, section, section);
        for (const student of currentStudents) {
          if (!studentsById.has(student.id)) {
            studentsById.set(student.id, { student, history: null });
          }
        }
      }
      const orderedClasses = db
        .prepare(`
          SELECT *
          FROM classes
          WHERE status = 'Active' AND deleted_at IS NULL
          ORDER BY display_order, name COLLATE NOCASE
        `)
        .all();
      const classIndex = orderedClasses.findIndex(
        (item) => item.name === className,
      );
      const suggestedClass =
        orderedClasses[classIndex + 1]?.name ?? className;
      const rows = Array.from(studentsById.values()).map(
        ({ student, history }) => {
          const oldDueAmount = calculateStudentDue(student.id, fromSession);
          return {
            studentId: student.id,
            admissionNo: student.admission_no,
            studentName: student.name,
            currentClass: history?.class_name ?? student.class_name,
            currentSection: history?.section ?? student.section ?? "",
            currentStatus: history?.status ?? "Active",
            oldDueAmount,
            action: "Promote",
            newClass: optionalText(input?.toClass) || suggestedClass,
            newSection:
              input?.toSection === undefined
                ? student.section ?? ""
                : optionalText(input.toSection),
            carryForwardDue: oldDueAmount > 0,
            carryForwardAmount: oldDueAmount,
            remarks: "",
          };
        },
      );
      return {
        fromSession: academicSessionFromRow(fromSession),
        toSession: academicSessionFromRow(toSession),
        rows,
        summary: {
          totalStudents: rows.length,
          promote: rows.length,
          repeat: 0,
          tc: 0,
          left: 0,
          inactive: 0,
          totalDueAmount: rows.reduce(
            (total, row) => total + row.oldDueAmount,
            0,
          ),
          carryForwardAmount: rows.reduce(
            (total, row) => total + row.carryForwardAmount,
            0,
          ),
        },
      };
    },

    promoteStudentsBulk(input) {
      const fromSession = getAcademicSessionRow(
        requiredText(input?.fromSessionId, "From session"),
      );
      const toSession = getAcademicSessionRow(
        requiredText(input?.toSessionId, "To session"),
      );
      if (!fromSession || !toSession) {
        throw new Error("Select valid academic sessions.");
      }
      if (fromSession.id === toSession.id) {
        throw new Error("From and to sessions must be different.");
      }
      if (Number(fromSession.is_current) !== 1) {
        throw new Error("Only the current academic session can be promoted.");
      }
      if (toSession.status === "Closed") {
        throw new Error("Students cannot be promoted into a closed session.");
      }
      if (!Array.isArray(input?.items) || input.items.length === 0) {
        throw new Error("Select at least one student for promotion.");
      }
      const promotionDate = normalizeDate(
        input?.promotionDate,
        "Promotion date",
      );
      const fromClass = requiredText(input?.fromClass, "From class");
      const fromSection = optionalText(input?.fromSection);
      const seenStudents = new Set();
      const preparedItems = input.items.map((item) => {
        const studentId = requiredText(item?.studentId, "Student");
        if (seenStudents.has(studentId)) {
          throw new Error("A student can appear only once in a promotion batch.");
        }
        seenStudents.add(studentId);
        const action = requiredText(item?.action, "Promotion action");
        if (!PROMOTION_ACTIONS.has(action)) {
          throw new Error("Promotion action is invalid.");
        }
        const student = getStudentStatement.get(studentId);
        if (!student || student.status !== "Active") {
          throw new Error("Every promotion item must reference an active student.");
        }
        let sourceHistory = db
          .prepare(`
            SELECT *
            FROM student_session_history
            WHERE student_id = ? AND academic_session_id = ?
          `)
          .get(studentId, fromSession.id);
        if (!sourceHistory) {
          sourceHistory = {
            id: null,
            student_id: student.id,
            admission_no: student.admission_no,
            student_name: student.name,
            academic_session_id: fromSession.id,
            academic_session_name: fromSession.session_name,
            class_name: student.class_name,
            section: student.section ?? "",
            status: "Active",
            result_status: "Not Applicable",
          };
        }
        if (
          sourceHistory.class_name !== fromClass ||
          (fromSection && (sourceHistory.section ?? "") !== fromSection)
        ) {
          throw new Error(
            `${student.name} does not belong to the selected source class and section.`,
          );
        }
        const existingTarget = db
          .prepare(`
            SELECT id
            FROM student_session_history
            WHERE student_id = ? AND academic_session_id = ?
          `)
          .get(studentId, toSession.id);
        if (existingTarget) {
          throw new Error(
            `${student.name} already has history in ${toSession.session_name}.`,
          );
        }
        let newClass = sourceHistory.class_name;
        let newSection = sourceHistory.section ?? "";
        if (action === "Promote") {
          const classSection = validateClassSection(
            item?.newClass,
            item?.newSection,
          );
          newClass = classSection.className;
          newSection = classSection.section;
        }
        const oldDueAmount = wholeNumber(
          item?.oldDueAmount ?? 0,
          "Old due amount",
          0,
        );
        const carriedForwardAmount =
          item?.carryForwardDue === true &&
          (action === "Promote" || action === "Repeat")
            ? wholeNumber(
                item?.carryForwardAmount ?? oldDueAmount,
                "Carry forward amount",
                0,
              )
            : 0;
        return {
          student,
          sourceHistory,
          action,
          newClass,
          newSection,
          oldDueAmount,
          carriedForwardAmount,
          remarks: optionalText(item?.remarks),
        };
      });

      return db.transaction(() => {
        const id = crypto.randomUUID();
        const timestamp = now();
        const promotionNo = generatePromotionNumber(promotionDate);
        const counts = {
          Promote: 0,
          Repeat: 0,
          TC: 0,
          Left: 0,
          Inactive: 0,
        };
        const totalCarry = preparedItems.reduce(
          (total, item) => total + item.carriedForwardAmount,
          0,
        );
        db.prepare(`
          INSERT INTO student_promotions (
            id, promotion_no, from_session_id, from_session_name,
            to_session_id, to_session_name, from_class, from_section,
            to_class, to_section, promotion_date, total_students,
            promoted_count, repeated_count, tc_count, left_count,
            inactive_count, carry_forward_dues, created_by, remarks,
            created_at, updated_at, sync_status
          ) VALUES (
            @id, @promotionNo, @fromSessionId, @fromSessionName,
            @toSessionId, @toSessionName, @fromClass, @fromSection,
            @toClass, @toSection, @promotionDate, @totalStudents,
            0, 0, 0, 0, 0, @carryForwardDues, @createdBy, @remarks,
            @createdAt, @updatedAt, 'pending'
          )
        `).run({
          id,
          promotionNo,
          fromSessionId: fromSession.id,
          fromSessionName: fromSession.session_name,
          toSessionId: toSession.id,
          toSessionName: toSession.session_name,
          fromClass,
          fromSection,
          toClass: optionalText(input?.toClass),
          toSection: optionalText(input?.toSection),
          promotionDate,
          totalStudents: preparedItems.length,
          carryForwardDues: totalCarry,
          createdBy: optionalText(input?.createdBy),
          remarks: optionalText(input?.remarks),
          createdAt: timestamp,
          updatedAt: timestamp,
        });

        const insertItem = db.prepare(`
          INSERT INTO student_promotion_items (
            id, promotion_id, student_id, admission_no, student_name,
            old_class, old_section, new_class, new_section, action,
            old_due_amount, carried_forward_amount, remarks, created_at,
            updated_at, sync_status
          ) VALUES (
            @id, @promotionId, @studentId, @admissionNo, @studentName,
            @oldClass, @oldSection, @newClass, @newSection, @action,
            @oldDueAmount, @carriedForwardAmount, @remarks, @createdAt,
            @updatedAt, 'pending'
          )
        `);
        const insertTargetHistory = db.prepare(`
          INSERT INTO student_session_history (
            id, student_id, admission_no, student_name, academic_session_id,
            academic_session_name, class_name, section, roll_no, status,
            result_status, promoted_to_session_id, promoted_to_session_name,
            promoted_to_class, promoted_to_section, promotion_date, remarks,
            created_at, updated_at, sync_status
          ) VALUES (
            @id, @studentId, @admissionNo, @studentName, @academicSessionId,
            @academicSessionName, @className, @section, '', 'Active',
            'Not Applicable', NULL, NULL, NULL, NULL, NULL, @remarks,
            @createdAt, @updatedAt, 'pending'
          )
        `);
        const insertCarry = db.prepare(`
          INSERT INTO fee_due_carry_forward (
            id, student_id, admission_no, student_name, from_session_id,
            from_session_name, to_session_id, to_session_name,
            old_due_amount, carried_amount, status, promotion_id, created_at,
            updated_at, sync_status
          ) VALUES (
            @id, @studentId, @admissionNo, @studentName, @fromSessionId,
            @fromSessionName, @toSessionId, @toSessionName, @oldDueAmount,
            @carriedAmount, 'Pending', @promotionId, @createdAt, @updatedAt,
            'pending'
          )
        `);

        for (const item of preparedItems) {
          counts[item.action] += 1;
          const sourceHistory =
            item.sourceHistory.id === null
              ? ensureStudentSessionHistory(
                  item.student.id,
                  fromSession,
                )
              : item.sourceHistory;
          const remainsActive =
            item.action === "Promote" || item.action === "Repeat";
          const sourceStatus =
            item.action === "Promote"
              ? "Promoted"
              : item.action === "Repeat"
                ? "Repeated"
                : item.action;
          const resultStatus =
            item.action === "Promote"
              ? "Pass"
              : item.action === "Repeat"
                ? "Repeat"
                : item.action === "TC"
                  ? "TC"
                  : item.action === "Left"
                    ? "Left"
                    : "Not Applicable";
          db.prepare(`
            UPDATE student_session_history
            SET status = @status,
                result_status = @resultStatus,
                promoted_to_session_id = @toSessionId,
                promoted_to_session_name = @toSessionName,
                promoted_to_class = @newClass,
                promoted_to_section = @newSection,
                promotion_date = @promotionDate,
                remarks = @remarks,
                updated_at = @updatedAt,
                sync_status = 'pending'
            WHERE id = @id
          `).run({
            id: sourceHistory.id,
            status: sourceStatus,
            resultStatus,
            toSessionId: toSession.id,
            toSessionName: toSession.session_name,
            newClass: remainsActive ? item.newClass : "",
            newSection: remainsActive ? item.newSection : "",
            promotionDate,
            remarks: item.remarks,
            updatedAt: timestamp,
          });
          db.prepare(`
            UPDATE students
            SET class_name = @className,
                section = @section,
                status = @status,
                updated_at = @updatedAt,
                sync_status = 'pending'
            WHERE id = @id AND deleted_at IS NULL
          `).run({
            id: item.student.id,
            className: remainsActive
              ? item.newClass
              : sourceHistory.class_name,
            section: remainsActive
              ? item.newSection
              : sourceHistory.section ?? "",
            status: remainsActive ? "Active" : "Inactive",
            updatedAt: timestamp,
          });
          if (remainsActive) {
            insertTargetHistory.run({
              id: crypto.randomUUID(),
              studentId: item.student.id,
              admissionNo: item.student.admission_no,
              studentName: item.student.name,
              academicSessionId: toSession.id,
              academicSessionName: toSession.session_name,
              className: item.newClass,
              section: item.newSection,
              remarks: item.remarks,
              createdAt: timestamp,
              updatedAt: timestamp,
            });
          }
          insertItem.run({
            id: crypto.randomUUID(),
            promotionId: id,
            studentId: item.student.id,
            admissionNo: item.student.admission_no,
            studentName: item.student.name,
            oldClass: sourceHistory.class_name,
            oldSection: sourceHistory.section ?? "",
            newClass: remainsActive ? item.newClass : "",
            newSection: remainsActive ? item.newSection : "",
            action: item.action,
            oldDueAmount: item.oldDueAmount,
            carriedForwardAmount: item.carriedForwardAmount,
            remarks: item.remarks,
            createdAt: timestamp,
            updatedAt: timestamp,
          });
          if (item.carriedForwardAmount > 0) {
            insertCarry.run({
              id: crypto.randomUUID(),
              studentId: item.student.id,
              admissionNo: item.student.admission_no,
              studentName: item.student.name,
              fromSessionId: fromSession.id,
              fromSessionName: fromSession.session_name,
              toSessionId: toSession.id,
              toSessionName: toSession.session_name,
              oldDueAmount: item.oldDueAmount,
              carriedAmount: item.carriedForwardAmount,
              promotionId: id,
              createdAt: timestamp,
              updatedAt: timestamp,
            });
          }
        }
        db.prepare(`
          UPDATE student_promotions
          SET promoted_count = @promotedCount,
              repeated_count = @repeatedCount,
              tc_count = @tcCount,
              left_count = @leftCount,
              inactive_count = @inactiveCount,
              updated_at = @updatedAt
          WHERE id = @id
        `).run({
          id,
          promotedCount: counts.Promote,
          repeatedCount: counts.Repeat,
          tcCount: counts.TC,
          leftCount: counts.Left,
          inactiveCount: counts.Inactive,
          updatedAt: timestamp,
        });
        const promotion = db
          .prepare("SELECT * FROM student_promotions WHERE id = ?")
          .get(id);
        return studentPromotionFromRow(promotion, getPromotionItems(id));
      })();
    },

    getStudentPromotions() {
      return db
        .prepare(`
          SELECT *
          FROM student_promotions
          ORDER BY promotion_date DESC, created_at DESC
        `)
        .all()
        .map((row) => studentPromotionFromRow(row));
    },

    getStudentPromotionById(id) {
      const promotion = db
        .prepare("SELECT * FROM student_promotions WHERE id = ?")
        .get(requiredText(id, "Promotion id"));
      return promotion
        ? studentPromotionFromRow(
            promotion,
            getPromotionItems(promotion.id),
          )
        : null;
    },

    getPromotionReport(filter = {}) {
      const session = getAcademicSessionRow(
        requiredText(filter?.sessionId, "Academic session"),
      );
      if (!session) throw new Error("Academic session was not found.");
      const histories = db
        .prepare(`
          SELECT *
          FROM student_session_history
          WHERE academic_session_id = ?
        `)
        .all(session.id);
      const actionCounts = db
        .prepare(`
          SELECT
            SUM(CASE
              WHEN promotions.to_session_id = @sessionId
                AND items.action = 'Promote' THEN 1 ELSE 0 END
            ) AS promoted,
            SUM(CASE
              WHEN promotions.to_session_id = @sessionId
                AND items.action = 'Repeat' THEN 1 ELSE 0 END
            ) AS repeated,
            SUM(CASE
              WHEN promotions.from_session_id = @sessionId
                AND items.action = 'TC' THEN 1 ELSE 0 END
            ) AS tc,
            SUM(CASE
              WHEN promotions.from_session_id = @sessionId
                AND items.action = 'Left' THEN 1 ELSE 0 END
            ) AS left,
            SUM(CASE
              WHEN promotions.from_session_id = @sessionId
                AND items.action = 'Inactive' THEN 1 ELSE 0 END
            ) AS inactive
          FROM student_promotion_items AS items
          INNER JOIN student_promotions AS promotions
            ON promotions.id = items.promotion_id
        `)
        .get({ sessionId: session.id });
      const classCounts = db
        .prepare(`
          SELECT
            class_name,
            section,
            COUNT(*) AS student_count
          FROM student_session_history
          WHERE academic_session_id = ?
            AND status = 'Active'
          GROUP BY class_name, section
          ORDER BY class_name, section
        `)
        .all(session.id)
        .map((row) => ({
          className: row.class_name ?? "",
          section: row.section ?? "",
          studentCount: Number(row.student_count ?? 0),
        }));
      const totalCarriedDues = Number(
        db
          .prepare(`
            SELECT COALESCE(SUM(carried_amount), 0) AS total
            FROM fee_due_carry_forward
            WHERE to_session_id = ?
              AND status IN ('Pending', 'Paid')
          `)
          .get(session.id).total,
      );
      const newAdmissions = histories.filter((history) => {
        const promoted = db
          .prepare(`
            SELECT 1
            FROM student_promotion_items AS items
            INNER JOIN student_promotions AS promotions
              ON promotions.id = items.promotion_id
            WHERE items.student_id = ?
              AND promotions.to_session_id = ?
            LIMIT 1
          `)
          .get(history.student_id, session.id);
        return !promoted;
      }).length;
      return {
        session: academicSessionFromRow(session),
        summary: {
          totalActiveStudents: histories.filter(
            (history) => history.status === "Active",
          ).length,
          newAdmissions,
          promotedStudents: Number(actionCounts.promoted ?? 0),
          repeatedStudents: Number(actionCounts.repeated ?? 0),
          tcStudents: Number(actionCounts.tc ?? 0),
          leftStudents: Number(actionCounts.left ?? 0),
          inactiveStudents: Number(actionCounts.inactive ?? 0),
          totalCarriedDues,
        },
        classCounts,
      };
    },

    getCarryForwardDues(filter = {}) {
      const fromSessionId = optionalText(filter?.fromSessionId);
      const toSessionId = optionalText(filter?.toSessionId);
      const status = optionalText(filter?.status);
      const className = optionalText(filter?.className);
      const section = optionalText(filter?.section);
      if (status && !CARRY_FORWARD_STATUSES.has(status)) {
        throw new Error("Carry-forward due status is invalid.");
      }
      return db
        .prepare(`
          SELECT
            dues.*,
            students.class_name AS current_class_name,
            students.section AS current_section
          FROM fee_due_carry_forward AS dues
          LEFT JOIN students ON students.id = dues.student_id
          WHERE (? = '' OR dues.from_session_id = ?)
            AND (? = '' OR dues.to_session_id = ?)
            AND (? = '' OR dues.status = ?)
            AND (? = '' OR students.class_name = ?)
            AND (? = '' OR COALESCE(students.section, '') = ?)
          ORDER BY dues.created_at DESC, dues.student_name COLLATE NOCASE
        `)
        .all(
          fromSessionId,
          fromSessionId,
          toSessionId,
          toSessionId,
          status,
          status,
          className,
          className,
          section,
          section,
        )
        .map(carryForwardDueFromRow);
    },

    updateCarryForwardDue(id, input) {
      const dueId = requiredText(id, "Carry-forward due id");
      const existing = db
        .prepare("SELECT * FROM fee_due_carry_forward WHERE id = ?")
        .get(dueId);
      if (!existing) throw new Error("Carry-forward due was not found.");
      const status =
        input?.status === undefined
          ? existing.status
          : requiredText(input.status, "Due status");
      if (!CARRY_FORWARD_STATUSES.has(status)) {
        throw new Error("Carry-forward due status is invalid.");
      }
      const carriedAmount =
        input?.carriedAmount === undefined
          ? Number(existing.carried_amount)
          : wholeNumber(input.carriedAmount, "Carried amount", 0);
      db.prepare(`
        UPDATE fee_due_carry_forward
        SET carried_amount = ?,
            status = ?,
            updated_at = ?,
            sync_status = 'pending'
        WHERE id = ?
      `).run(carriedAmount, status, now(), dueId);
      return carryForwardDueFromRow(
        db
          .prepare(`
            SELECT
              dues.*,
              students.class_name AS current_class_name,
              students.section AS current_section
            FROM fee_due_carry_forward AS dues
            LEFT JOIN students ON students.id = dues.student_id
            WHERE dues.id = ?
          `)
          .get(dueId),
      );
    },

    waiveCarryForwardDue(id) {
      return this.updateCarryForwardDue(id, { status: "Waived" });
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

    getRemoteLicenseStatusRecord() {
      return remoteLicenseStatusFromRow(
        db
          .prepare(
            "SELECT * FROM remote_license_status WHERE id = 'active-remote-license'",
          )
          .get(),
      );
    },

    saveRemoteLicenseStatus(input) {
      const existing = db
        .prepare(
          "SELECT created_at FROM remote_license_status WHERE id = 'active-remote-license'",
        )
        .get();
      const timestamp = now();
      const remoteStatus = optionalText(input?.remoteStatus) || "Unknown";
      if (!REMOTE_LICENSE_STATUSES.has(remoteStatus)) {
        throw new Error("Remote license status is invalid.");
      }
      db.prepare(`
        INSERT INTO remote_license_status (
          id, license_id, device_id, remote_status, last_online_check_at,
          next_required_check_at, grace_until, last_error, server_message,
          created_at, updated_at
        ) VALUES (
          'active-remote-license', @licenseId, @deviceId, @remoteStatus,
          @lastOnlineCheckAt, @nextRequiredCheckAt, @graceUntil, @lastError,
          @serverMessage, @createdAt, @updatedAt
        )
        ON CONFLICT(id) DO UPDATE SET
          license_id = excluded.license_id,
          device_id = excluded.device_id,
          remote_status = excluded.remote_status,
          last_online_check_at = excluded.last_online_check_at,
          next_required_check_at = excluded.next_required_check_at,
          grace_until = excluded.grace_until,
          last_error = excluded.last_error,
          server_message = excluded.server_message,
          updated_at = excluded.updated_at
      `).run({
        licenseId: optionalText(input?.licenseId),
        deviceId: optionalText(input?.deviceId),
        remoteStatus,
        lastOnlineCheckAt: optionalText(input?.lastOnlineCheckAt),
        nextRequiredCheckAt: optionalText(input?.nextRequiredCheckAt),
        graceUntil: optionalText(input?.graceUntil),
        lastError: optionalText(input?.lastError),
        serverMessage: optionalText(input?.serverMessage),
        createdAt: existing?.created_at ?? timestamp,
        updatedAt: timestamp,
      });
      return this.getRemoteLicenseStatusRecord();
    },

    clearRemoteLicenseStatus() {
      const result = db
        .prepare(
          "DELETE FROM remote_license_status WHERE id = 'active-remote-license'",
        )
        .run();
      return { success: result.changes === 1 };
    },

    clearRemoteLicenseStatusForLicense(licenseId) {
      const normalizedLicenseId = optionalText(licenseId);
      if (!normalizedLicenseId) return { success: false };
      const result = db
        .prepare(
          "DELETE FROM remote_license_status WHERE id = 'active-remote-license' AND license_id = ?",
        )
        .run(normalizedLicenseId);
      return { success: result.changes === 1 };
    },

    deactivateLicenseActivation() {
      this.clearRemoteLicenseStatus();
      const result = db
        .prepare(
          "DELETE FROM license_activation WHERE id = 'active-license'",
        )
        .run();
      return { success: result.changes === 1 };
    },

    getFamilies(filter = {}) {
      const { where, params } = buildFamilyWhere(filter);
      return db
        .prepare(`
          ${familySelect(where)}
          ORDER BY
            CASE families.status WHEN 'Active' THEN 0 ELSE 1 END,
            families.family_code DESC
        `)
        .all(params)
        .map(familyFromRow);
    },

    getFamilyById(id) {
      const familyId = requiredText(id, "Family id");
      const row = db
        .prepare(`
          ${familySelect("families.id = @familyId AND families.deleted_at IS NULL")}
        `)
        .get({ familyId });
      if (!row) return null;
      return {
        ...familyFromRow(row),
        guardians: this.getGuardians({ familyId }),
        students: this.getFamilyStudents(familyId),
      };
    },

    createFamily(input = {}) {
      const timestamp = now();
      const familyCode = optionalText(input.familyCode) || generateFamilyCode();
      const duplicate = db
        .prepare(`
          SELECT id
          FROM families
          WHERE family_code = ? COLLATE NOCASE
            AND deleted_at IS NULL
        `)
        .get(familyCode);
      if (duplicate) throw new Error("Family code is already in use.");
      const id = crypto.randomUUID();
      db.prepare(`
        INSERT INTO families (
          id, family_code, family_name, primary_contact_name,
          primary_mobile, secondary_mobile, email, address, city, state,
          postal_code, emergency_contact_name, emergency_contact_mobile,
          notes, status, created_at, updated_at, deleted_at, sync_status
        ) VALUES (
          @id, @familyCode, @familyName, @primaryContactName,
          @primaryMobile, @secondaryMobile, @email, @address, @city, @state,
          @postalCode, @emergencyContactName, @emergencyContactMobile,
          @notes, @status, @createdAt, @updatedAt, NULL, 'pending'
        )
      `).run({
        id,
        familyCode,
        familyName: optionalText(input.familyName),
        primaryContactName: optionalText(input.primaryContactName),
        primaryMobile: optionalText(input.primaryMobile),
        secondaryMobile: optionalText(input.secondaryMobile),
        email: optionalText(input.email),
        address: optionalText(input.address),
        city: optionalText(input.city),
        state: optionalText(input.state),
        postalCode: optionalText(input.postalCode),
        emergencyContactName: optionalText(input.emergencyContactName),
        emergencyContactMobile: optionalText(input.emergencyContactMobile),
        notes: optionalText(input.notes),
        status: masterStatus(input.status),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      return this.getFamilyById(id);
    },

    updateFamily(id, input = {}) {
      const familyId = requiredText(id, "Family id");
      const existing = getFamilyRowRequired(familyId);
      const familyCode =
        input.familyCode === undefined
          ? existing.family_code
          : requiredText(input.familyCode, "Family code");
      const duplicate = db
        .prepare(`
          SELECT id
          FROM families
          WHERE family_code = ? COLLATE NOCASE
            AND id <> ?
            AND deleted_at IS NULL
        `)
        .get(familyCode, familyId);
      if (duplicate) throw new Error("Family code is already in use.");
      db.prepare(`
        UPDATE families
        SET family_code = @familyCode,
            family_name = @familyName,
            primary_contact_name = @primaryContactName,
            primary_mobile = @primaryMobile,
            secondary_mobile = @secondaryMobile,
            email = @email,
            address = @address,
            city = @city,
            state = @state,
            postal_code = @postalCode,
            emergency_contact_name = @emergencyContactName,
            emergency_contact_mobile = @emergencyContactMobile,
            notes = @notes,
            status = @status,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id AND deleted_at IS NULL
      `).run({
        id: familyId,
        familyCode,
        familyName:
          input.familyName === undefined
            ? existing.family_name ?? ""
            : optionalText(input.familyName),
        primaryContactName:
          input.primaryContactName === undefined
            ? existing.primary_contact_name ?? ""
            : optionalText(input.primaryContactName),
        primaryMobile:
          input.primaryMobile === undefined
            ? existing.primary_mobile ?? ""
            : optionalText(input.primaryMobile),
        secondaryMobile:
          input.secondaryMobile === undefined
            ? existing.secondary_mobile ?? ""
            : optionalText(input.secondaryMobile),
        email:
          input.email === undefined
            ? existing.email ?? ""
            : optionalText(input.email),
        address:
          input.address === undefined
            ? existing.address ?? ""
            : optionalText(input.address),
        city:
          input.city === undefined
            ? existing.city ?? ""
            : optionalText(input.city),
        state:
          input.state === undefined
            ? existing.state ?? ""
            : optionalText(input.state),
        postalCode:
          input.postalCode === undefined
            ? existing.postal_code ?? ""
            : optionalText(input.postalCode),
        emergencyContactName:
          input.emergencyContactName === undefined
            ? existing.emergency_contact_name ?? ""
            : optionalText(input.emergencyContactName),
        emergencyContactMobile:
          input.emergencyContactMobile === undefined
            ? existing.emergency_contact_mobile ?? ""
            : optionalText(input.emergencyContactMobile),
        notes:
          input.notes === undefined
            ? existing.notes ?? ""
            : optionalText(input.notes),
        status:
          input.status === undefined
            ? existing.status ?? "Active"
            : masterStatus(input.status),
        updatedAt: now(),
      });
      return this.getFamilyById(familyId);
    },

    deleteFamily(id) {
      const familyId = requiredText(id, "Family id");
      const timestamp = now();
      const result = db
        .prepare(`
          UPDATE families
          SET deleted_at = @deletedAt,
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE id = @id AND deleted_at IS NULL
        `)
        .run({ id: familyId, deletedAt: timestamp, updatedAt: timestamp });
      return { success: result.changes === 1 };
    },

    getFamilyStudents(familyId) {
      const normalizedFamilyId = requiredText(familyId, "Family id");
      return db
        .prepare(`
          SELECT DISTINCT students.*
          FROM student_guardian_links AS links
          JOIN students
            ON students.id = links.student_id
            AND students.deleted_at IS NULL
          WHERE links.family_id = ?
            AND links.deleted_at IS NULL
          ORDER BY students.class_name COLLATE NOCASE,
            students.section COLLATE NOCASE,
            students.name COLLATE NOCASE
        `)
        .all(normalizedFamilyId)
        .map(studentFromRow);
    },

    getGuardians(filter = {}) {
      const { where, params } = buildGuardianWhere(filter);
      return db
        .prepare(`
          ${guardianSelect(where)}
          ORDER BY
            CASE guardians.status WHEN 'Active' THEN 0 ELSE 1 END,
            guardians.full_name COLLATE NOCASE
        `)
        .all(params)
        .map(guardianFromRow);
    },

    createGuardian(input = {}) {
      const duplicate = findDuplicateGuardian(input);
      if (duplicate) {
        throw new Error("A guardian with this name and contact already exists.");
      }
      const familyId = optionalText(input.familyId);
      if (familyId) getFamilyRowRequired(familyId);
      const timestamp = now();
      const isPrimary = booleanFlag(input.isPrimary, false);
      const id = crypto.randomUUID();
      db.transaction(() => {
        if (isPrimary && familyId) {
          db.prepare(`
            UPDATE guardians
            SET is_primary = 0,
                updated_at = @updatedAt,
                sync_status = 'pending'
            WHERE family_id = @familyId
              AND deleted_at IS NULL
          `).run({ familyId, updatedAt: timestamp });
        }
        db.prepare(`
          INSERT INTO guardians (
            id, family_id, full_name, relation, mobile, alternate_mobile,
            email, occupation, qualification, annual_income, address,
            is_primary, can_pickup_student, emergency_contact, status,
            created_at, updated_at, deleted_at, sync_status
          ) VALUES (
            @id, @familyId, @fullName, @relation, @mobile, @alternateMobile,
            @email, @occupation, @qualification, @annualIncome, @address,
            @isPrimary, @canPickupStudent, @emergencyContact, @status,
            @createdAt, @updatedAt, NULL, 'pending'
          )
        `).run({
          id,
          familyId: familyId || null,
          fullName: requiredText(input.fullName, "Guardian name"),
          relation: normalizeGuardianRelation(input.relation),
          mobile: optionalText(input.mobile),
          alternateMobile: optionalText(input.alternateMobile),
          email: optionalText(input.email),
          occupation: optionalText(input.occupation),
          qualification: optionalText(input.qualification),
          annualIncome:
            input.annualIncome === undefined ||
            input.annualIncome === null ||
            input.annualIncome === ""
              ? null
              : wholeNumber(input.annualIncome, "Annual income", 0),
          address: optionalText(input.address),
          isPrimary: isPrimary ? 1 : 0,
          canPickupStudent: booleanFlag(input.canPickupStudent, true) ? 1 : 0,
          emergencyContact: booleanFlag(input.emergencyContact, false) ? 1 : 0,
          status: normalizeGuardianStatus(input.status),
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      })();
      return this.getGuardians({}).find((guardian) => guardian.id === id);
    },

    updateGuardian(id, input = {}) {
      const guardianId = requiredText(id, "Guardian id");
      const existing = getGuardianRowRequired(guardianId);
      const nextFamilyId =
        input.familyId === undefined
          ? existing.family_id ?? ""
          : optionalText(input.familyId);
      if (nextFamilyId) getFamilyRowRequired(nextFamilyId);
      const nextFullName =
        input.fullName === undefined
          ? existing.full_name
          : requiredText(input.fullName, "Guardian name");
      const nextMobile =
        input.mobile === undefined
          ? existing.mobile ?? ""
          : optionalText(input.mobile);
      const nextEmail =
        input.email === undefined
          ? existing.email ?? ""
          : optionalText(input.email);
      const duplicate = findDuplicateGuardian(
        { fullName: nextFullName, mobile: nextMobile, email: nextEmail },
        guardianId,
      );
      if (duplicate) {
        throw new Error("A guardian with this name and contact already exists.");
      }
      const timestamp = now();
      const isPrimary =
        input.isPrimary === undefined
          ? Number(existing.is_primary ?? 0) === 1
          : booleanFlag(input.isPrimary, false);
      db.transaction(() => {
        if (isPrimary && nextFamilyId) {
          db.prepare(`
            UPDATE guardians
            SET is_primary = 0,
                updated_at = @updatedAt,
                sync_status = 'pending'
            WHERE family_id = @familyId
              AND id <> @id
              AND deleted_at IS NULL
          `).run({ id: guardianId, familyId: nextFamilyId, updatedAt: timestamp });
        }
        db.prepare(`
          UPDATE guardians
          SET family_id = @familyId,
              full_name = @fullName,
              relation = @relation,
              mobile = @mobile,
              alternate_mobile = @alternateMobile,
              email = @email,
              occupation = @occupation,
              qualification = @qualification,
              annual_income = @annualIncome,
              address = @address,
              is_primary = @isPrimary,
              can_pickup_student = @canPickupStudent,
              emergency_contact = @emergencyContact,
              status = @status,
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE id = @id AND deleted_at IS NULL
        `).run({
          id: guardianId,
          familyId: nextFamilyId || null,
          fullName: nextFullName,
          relation:
            input.relation === undefined
              ? existing.relation
              : normalizeGuardianRelation(input.relation),
          mobile: nextMobile,
          alternateMobile:
            input.alternateMobile === undefined
              ? existing.alternate_mobile ?? ""
              : optionalText(input.alternateMobile),
          email: nextEmail,
          occupation:
            input.occupation === undefined
              ? existing.occupation ?? ""
              : optionalText(input.occupation),
          qualification:
            input.qualification === undefined
              ? existing.qualification ?? ""
              : optionalText(input.qualification),
          annualIncome:
            input.annualIncome === undefined
              ? existing.annual_income
              : input.annualIncome === null || input.annualIncome === ""
                ? null
                : wholeNumber(input.annualIncome, "Annual income", 0),
          address:
            input.address === undefined
              ? existing.address ?? ""
              : optionalText(input.address),
          isPrimary: isPrimary ? 1 : 0,
          canPickupStudent:
            input.canPickupStudent === undefined
              ? Number(existing.can_pickup_student ?? 1)
              : booleanFlag(input.canPickupStudent, true)
                ? 1
                : 0,
          emergencyContact:
            input.emergencyContact === undefined
              ? Number(existing.emergency_contact ?? 0)
              : booleanFlag(input.emergencyContact, false)
                ? 1
                : 0,
          status:
            input.status === undefined
              ? existing.status ?? "Active"
              : normalizeGuardianStatus(input.status),
          updatedAt: timestamp,
        });
        db.prepare(`
          UPDATE student_guardian_links
          SET family_id = @familyId,
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE guardian_id = @id
            AND deleted_at IS NULL
        `).run({
          id: guardianId,
          familyId: nextFamilyId || null,
          updatedAt: timestamp,
        });
      })();
      return this.getGuardians({}).find((guardian) => guardian.id === guardianId);
    },

    deleteGuardian(id) {
      const guardianId = requiredText(id, "Guardian id");
      const timestamp = now();
      let changed = 0;
      db.transaction(() => {
        const result = db
          .prepare(`
            UPDATE guardians
            SET deleted_at = @deletedAt,
                updated_at = @updatedAt,
                sync_status = 'pending'
            WHERE id = @id AND deleted_at IS NULL
          `)
          .run({ id: guardianId, deletedAt: timestamp, updatedAt: timestamp });
        changed = result.changes;
        db.prepare(`
          UPDATE student_guardian_links
          SET deleted_at = @deletedAt,
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE guardian_id = @id
            AND deleted_at IS NULL
        `).run({ id: guardianId, deletedAt: timestamp, updatedAt: timestamp });
      })();
      return { success: changed === 1 };
    },

    getStudentGuardians(studentId) {
      const normalizedStudentId = requiredText(studentId, "Student id");
      return db
        .prepare(`
          ${studentGuardianLinkSelect("links.student_id = @studentId AND links.deleted_at IS NULL")}
          ORDER BY links.is_primary DESC,
            guardians.relation COLLATE NOCASE,
            guardians.full_name COLLATE NOCASE
        `)
        .all({ studentId: normalizedStudentId })
        .map(studentGuardianLinkFromRow);
    },

    linkGuardianToStudent(input = {}) {
      const student = getStudentRowRequired(input.studentId);
      const guardian = getGuardianRowRequired(input.guardianId);
      if (guardian.status !== "Active") {
        throw new Error("Only active guardians can be linked to students.");
      }
      const inputFamilyId = optionalText(input.familyId);
      const familyId = inputFamilyId || guardian.family_id || "";
      if (familyId) getFamilyRowRequired(familyId);
      const timestamp = now();
      const existing = db
        .prepare(`
          SELECT *
          FROM student_guardian_links
          WHERE student_id = @studentId
            AND guardian_id = @guardianId
            AND deleted_at IS NULL
        `)
        .get({ studentId: student.id, guardianId: guardian.id });
      const hasPrimary = db
        .prepare(`
          SELECT id
          FROM student_guardian_links
          WHERE student_id = ?
            AND is_primary = 1
            AND deleted_at IS NULL
          LIMIT 1
        `)
        .get(student.id);
      const shouldBePrimary =
        input.isPrimary === undefined
          ? !hasPrimary
          : booleanFlag(input.isPrimary, false);
      const linkId = existing?.id ?? crypto.randomUUID();
      db.transaction(() => {
        if (familyId && !guardian.family_id) {
          db.prepare(`
            UPDATE guardians
            SET family_id = @familyId,
                updated_at = @updatedAt,
                sync_status = 'pending'
            WHERE id = @guardianId
              AND deleted_at IS NULL
          `).run({ familyId, guardianId: guardian.id, updatedAt: timestamp });
        }
        if (shouldBePrimary) {
          db.prepare(`
            UPDATE student_guardian_links
            SET is_primary = 0,
                updated_at = @updatedAt,
                sync_status = 'pending'
            WHERE student_id = @studentId
              AND deleted_at IS NULL
          `).run({ studentId: student.id, updatedAt: timestamp });
        }
        const values = {
          id: linkId,
          studentId: student.id,
          guardianId: guardian.id,
          familyId: familyId || null,
          relationToStudent:
            optionalText(input.relationToStudent) || guardian.relation,
          isPrimary: shouldBePrimary ? 1 : 0,
          livesWithStudent: booleanFlag(input.livesWithStudent, true) ? 1 : 0,
          financialResponsibility:
            booleanFlag(input.financialResponsibility, false) ? 1 : 0,
          pickupAuthorized:
            booleanFlag(input.pickupAuthorized, true) ? 1 : 0,
          createdAt: existing?.created_at ?? timestamp,
          updatedAt: timestamp,
        };
        if (existing) {
          db.prepare(`
            UPDATE student_guardian_links
            SET family_id = @familyId,
                relation_to_student = @relationToStudent,
                is_primary = @isPrimary,
                lives_with_student = @livesWithStudent,
                financial_responsibility = @financialResponsibility,
                pickup_authorized = @pickupAuthorized,
                updated_at = @updatedAt,
                sync_status = 'pending'
            WHERE id = @id AND deleted_at IS NULL
          `).run(values);
        } else {
          db.prepare(`
            INSERT INTO student_guardian_links (
              id, student_id, guardian_id, family_id, relation_to_student,
              is_primary, lives_with_student, financial_responsibility,
              pickup_authorized, created_at, updated_at, deleted_at,
              sync_status
            ) VALUES (
              @id, @studentId, @guardianId, @familyId, @relationToStudent,
              @isPrimary, @livesWithStudent, @financialResponsibility,
              @pickupAuthorized, @createdAt, @updatedAt, NULL, 'pending'
            )
          `).run(values);
        }
      })();
      return db
        .prepare(`
          ${studentGuardianLinkSelect("links.id = @id AND links.deleted_at IS NULL")}
        `)
        .all({ id: linkId })
        .map(studentGuardianLinkFromRow)[0];
    },

    updateStudentGuardianLink(id, input = {}) {
      const linkId = requiredText(id, "Student guardian link id");
      const existing = db
        .prepare(`
          SELECT *
          FROM student_guardian_links
          WHERE id = ? AND deleted_at IS NULL
        `)
        .get(linkId);
      if (!existing) throw new Error("Student guardian link was not found.");
      const familyId =
        input.familyId === undefined
          ? existing.family_id ?? ""
          : optionalText(input.familyId);
      if (familyId) getFamilyRowRequired(familyId);
      const timestamp = now();
      const isPrimary =
        input.isPrimary === undefined
          ? Number(existing.is_primary ?? 0) === 1
          : booleanFlag(input.isPrimary, false);
      db.transaction(() => {
        if (isPrimary) {
          db.prepare(`
            UPDATE student_guardian_links
            SET is_primary = 0,
                updated_at = @updatedAt,
                sync_status = 'pending'
            WHERE student_id = @studentId
              AND id <> @id
              AND deleted_at IS NULL
          `).run({
            id: linkId,
            studentId: existing.student_id,
            updatedAt: timestamp,
          });
        }
        db.prepare(`
          UPDATE student_guardian_links
          SET family_id = @familyId,
              relation_to_student = @relationToStudent,
              is_primary = @isPrimary,
              lives_with_student = @livesWithStudent,
              financial_responsibility = @financialResponsibility,
              pickup_authorized = @pickupAuthorized,
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE id = @id AND deleted_at IS NULL
        `).run({
          id: linkId,
          familyId: familyId || null,
          relationToStudent:
            input.relationToStudent === undefined
              ? existing.relation_to_student ?? ""
              : optionalText(input.relationToStudent),
          isPrimary: isPrimary ? 1 : 0,
          livesWithStudent:
            input.livesWithStudent === undefined
              ? Number(existing.lives_with_student ?? 1)
              : booleanFlag(input.livesWithStudent, true)
                ? 1
                : 0,
          financialResponsibility:
            input.financialResponsibility === undefined
              ? Number(existing.financial_responsibility ?? 0)
              : booleanFlag(input.financialResponsibility, false)
                ? 1
                : 0,
          pickupAuthorized:
            input.pickupAuthorized === undefined
              ? Number(existing.pickup_authorized ?? 1)
              : booleanFlag(input.pickupAuthorized, true)
                ? 1
                : 0,
          updatedAt: timestamp,
        });
      })();
      return db
        .prepare(`
          ${studentGuardianLinkSelect("links.id = @id AND links.deleted_at IS NULL")}
        `)
        .all({ id: linkId })
        .map(studentGuardianLinkFromRow)[0];
    },

    unlinkGuardianFromStudent(id) {
      const linkId = requiredText(id, "Student guardian link id");
      const timestamp = now();
      const result = db
        .prepare(`
          UPDATE student_guardian_links
          SET deleted_at = @deletedAt,
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE id = @id AND deleted_at IS NULL
        `)
        .run({ id: linkId, deletedAt: timestamp, updatedAt: timestamp });
      return { success: result.changes === 1 };
    },

    createFamilyFromStudentDetails(studentId) {
      const student = studentFromRow(getStudentRowRequired(studentId));
      const existingFamilyId = db
        .prepare(`
          SELECT links.family_id
          FROM student_guardian_links AS links
          JOIN families
            ON families.id = links.family_id
            AND families.deleted_at IS NULL
          WHERE links.student_id = ?
            AND links.deleted_at IS NULL
            AND links.family_id IS NOT NULL
          LIMIT 1
        `)
        .get(student.id)?.family_id;
      if (existingFamilyId) return this.getFamilyById(existingFamilyId);

      const primaryName =
        student.guardianName ||
        student.fatherName ||
        student.motherName ||
        `${student.name} Guardian`;
      const family = this.createFamily({
        familyName: `${student.name} Family`,
        primaryContactName: primaryName,
        primaryMobile: student.mobile,
        email: student.email,
        address: student.address,
        emergencyContactName: primaryName,
        emergencyContactMobile: student.mobile,
        notes: "Created from existing student guardian details.",
      });
      const guardianInputs = [];
      if (student.fatherName) {
        guardianInputs.push({
          fullName: student.fatherName,
          relation: "Father",
          isPrimary: true,
        });
      }
      if (student.motherName) {
        guardianInputs.push({
          fullName: student.motherName,
          relation: "Mother",
          isPrimary: guardianInputs.length === 0,
        });
      }
      if (
        student.guardianName &&
        !guardianInputs.some(
          (item) =>
            item.fullName.toLowerCase() ===
            student.guardianName.toLowerCase(),
        )
      ) {
        guardianInputs.push({
          fullName: student.guardianName,
          relation: "Guardian",
          isPrimary: guardianInputs.length === 0,
        });
      }
      if (guardianInputs.length === 0) {
        guardianInputs.push({
          fullName: primaryName,
          relation: "Guardian",
          isPrimary: true,
        });
      }
      guardianInputs.forEach((guardianInput, index) => {
        const duplicate = findDuplicateGuardian({
          fullName: guardianInput.fullName,
          mobile: student.mobile,
          email: student.email,
        });
        let guardian;
        if (duplicate) {
          guardian = guardianFromRow({
            ...duplicate,
            family_code: family.familyCode,
            family_name: family.familyName,
          });
          if (!duplicate.family_id) {
            guardian = this.updateGuardian(duplicate.id, {
              familyId: family.id,
              isPrimary: guardianInput.isPrimary,
            });
          }
        } else {
          guardian = this.createGuardian({
            familyId: family.id,
            fullName: guardianInput.fullName,
            relation: guardianInput.relation,
            mobile: student.mobile,
            email: student.email,
            address: student.address,
            isPrimary: guardianInput.isPrimary,
            canPickupStudent: true,
            emergencyContact: index === 0,
            status: "Active",
          });
        }
        this.linkGuardianToStudent({
          studentId: student.id,
          guardianId: guardian.id,
          familyId: family.id,
          relationToStudent: guardianInput.relation,
          isPrimary: guardianInput.isPrimary,
          livesWithStudent: true,
          financialResponsibility:
            guardianInput.relation === "Father" ||
            guardianInput.relation === "Guardian",
          pickupAuthorized: true,
        });
      });
      return this.getFamilyById(family.id);
    },

    linkSiblingStudents(input = {}) {
      const studentIds = Array.from(
        new Set(
          Array.isArray(input.studentIds)
            ? input.studentIds.map((id) => optionalText(id)).filter(Boolean)
            : [],
        ),
      );
      if (studentIds.length < 2) {
        throw new Error("Select at least two students for a sibling group.");
      }
      const students = studentIds.map((id) => studentFromRow(getStudentRowRequired(id)));
      let familyId = optionalText(input.familyId);
      if (familyId) {
        getFamilyRowRequired(familyId);
      } else {
        familyId = db
          .prepare(`
            SELECT family_id
            FROM student_guardian_links
            WHERE student_id IN (${studentIds.map(() => "?").join(",")})
              AND family_id IS NOT NULL
              AND deleted_at IS NULL
            ORDER BY is_primary DESC, created_at ASC
            LIMIT 1
          `)
          .get(...studentIds)?.family_id;
      }
      if (!familyId) {
        familyId = this.createFamilyFromStudentDetails(students[0].id).id;
      }
      let familyGuardians = this.getGuardians({ familyId }).filter(
        (guardian) => guardian.status === "Active",
      );
      if (familyGuardians.length === 0) {
        this.createFamilyFromStudentDetails(students[0].id);
        familyGuardians = this.getGuardians({ familyId }).filter(
          (guardian) => guardian.status === "Active",
        );
      }
      const primaryGuardian =
        familyGuardians.find((guardian) => guardian.isPrimary) ||
        familyGuardians[0];
      if (!primaryGuardian) {
        throw new Error("Create at least one active guardian for the family.");
      }
      students.forEach((student) => {
        const existingLinks = this.getStudentGuardians(student.id);
        const shouldBePrimary =
          existingLinks.length === 0 ||
          existingLinks.some(
            (link) =>
              link.guardianId === primaryGuardian.id && link.isPrimary,
          );
        this.linkGuardianToStudent({
          studentId: student.id,
          guardianId: primaryGuardian.id,
          familyId,
          relationToStudent: primaryGuardian.relation,
          isPrimary: shouldBePrimary,
          livesWithStudent: true,
          financialResponsibility: false,
          pickupAuthorized: primaryGuardian.canPickupStudent,
        });
      });
      return this.getFamilyById(familyId);
    },

    getParentsInfoReport(filter = {}) {
      const students = this.getStudents().filter((student) => {
        if (optionalText(filter.studentId) && student.id !== filter.studentId) {
          return false;
        }
        if (optionalText(filter.className) && student.className !== filter.className) {
          return false;
        }
        if (optionalText(filter.section) && student.section !== filter.section) {
          return false;
        }
        const academicSessionId = optionalText(filter.academicSessionId);
        if (academicSessionId) {
          return this
            .getStudentSessionHistory(student.id)
            .some((history) => history.academicSessionId === academicSessionId);
        }
        return true;
      });
      const rows = students.flatMap((student) => {
        const links = this.getStudentGuardians(student.id);
        if (links.length === 0) return makeLegacyParentInfoRows(student);
        return links.map((link) =>
          parentsInfoRowFromRow({
            student_id: student.id,
            admission_no: student.admissionNo,
            student_name: student.name,
            class_name: student.className,
            section: student.section,
            family_id: link.familyId,
            family_code: link.familyCode,
            family_name: link.familyName,
            guardian_id: link.guardianId,
            primary_guardian: link.guardianFullName || link.guardianName,
            relation: link.relationToStudent || link.relation,
            mobile: link.mobile,
            alternate_mobile: link.alternateMobile,
            email: link.email,
            occupation: link.occupation,
            address: link.address,
            emergency_contact:
              link.guardianEmergencyContact || Boolean(link.emergencyContactName)
                ? 1
                : 0,
            emergency_contact_name:
              link.emergencyContactName ||
              (link.guardianEmergencyContact
                ? link.guardianFullName || link.guardianName
                : ""),
            emergency_contact_mobile:
              link.emergencyContactMobile ||
              (link.guardianEmergencyContact ? link.mobile : ""),
            pickup_authorized:
              link.pickupAuthorized || link.guardianCanPickupStudent ? 1 : 0,
            has_linked_guardian: 1,
            source: "Linked",
          }),
        );
      });
      const relation = optionalText(filter.guardianRelation);
      const filteredRows = rows.filter((row) => {
        if (relation && relation !== "All" && row.relation !== relation) {
          return false;
        }
        if (filter.missingMobile === true && row.mobile) return false;
        if (filter.missingEmail === true && row.email) return false;
        if (filter.emergencyContact === true && !row.emergencyContact) {
          return false;
        }
        if (filter.pickupAuthorized === true && !row.pickupAuthorized) {
          return false;
        }
        return true;
      });
      const uniqueFamilies = new Set(
        rows.map((row) => row.familyId).filter(Boolean),
      );
      const uniqueGuardians = new Set(
        rows
          .map((row) => row.guardianId || `${row.studentId}-${row.primaryGuardian}`)
          .filter(Boolean),
      );
      const studentsWithoutLinkedGuardian = students.filter(
        (student) => this.getStudentGuardians(student.id).length === 0,
      ).length;
      return {
        rows: filteredRows,
        summary: {
          totalFamilies: uniqueFamilies.size,
          totalGuardians: uniqueGuardians.size,
          missingMobile: rows.filter((row) => !row.mobile).length,
          missingEmail: rows.filter((row) => !row.email).length,
          studentsWithoutLinkedGuardian,
        },
      };
    },

    getEmergencyContactsReport(filter = {}) {
      const parentReport = this.getParentsInfoReport(filter);
      const rows = parentReport.rows
        .filter(
          (row) =>
            row.emergencyContact ||
            row.emergencyContactName ||
            row.emergencyContactMobile ||
            row.source === "Legacy",
        )
        .map((row) => ({
          studentId: row.studentId,
          admissionNo: row.admissionNo,
          studentName: row.studentName,
          className: row.className,
          section: row.section,
          primaryGuardian: row.primaryGuardian,
          emergencyContactName:
            row.emergencyContactName || row.primaryGuardian,
          emergencyContactMobile: row.emergencyContactMobile || row.mobile,
          pickupAuthorized: row.pickupAuthorized,
          pickupAuthorizedPeople: parentReport.rows
            .filter(
              (item) =>
                item.studentId === row.studentId && item.pickupAuthorized,
            )
            .map((item) => item.primaryGuardian)
            .filter(Boolean)
            .join(", "),
        }));
      return {
        rows,
        summary: {
          totalRows: rows.length,
          missingEmergencyMobile: rows.filter(
            (row) => !row.emergencyContactMobile,
          ).length,
          pickupAuthorized: rows.filter((row) => row.pickupAuthorized).length,
        },
      };
    },

    getSiblingReport(filter = {}) {
      const families = this.getFamilies({
        status: optionalText(filter.status) || "Active",
      });
      const rows = families
        .map((family) => ({
          family,
          students: this.getFamilyStudents(family.id),
          guardians: this.getGuardians({ familyId: family.id }),
        }))
        .map((row) => ({
          ...row,
          students: row.students.filter((student) => {
            if (optionalText(filter.className) && student.className !== filter.className) {
              return false;
            }
            if (optionalText(filter.section) && student.section !== filter.section) {
              return false;
            }
            return true;
          }),
        }))
        .filter((row) => row.students.length > 1)
        .map((row) => ({
          familyId: row.family.id,
          familyCode: row.family.familyCode,
          familyName: row.family.familyName,
          primaryContactName: row.family.primaryContactName,
          primaryMobile: row.family.primaryMobile,
          guardianCount: row.guardians.length,
          studentCount: row.students.length,
          students: row.students,
        }));
      return {
        rows,
        summary: {
          siblingFamilies: rows.length,
          linkedStudents: rows.reduce(
            (total, row) => total + row.studentCount,
            0,
          ),
        },
      };
    },

    getSchoolRules(filter = {}) {
      const { where, params } = buildSchoolRulesWhere(filter);
      return db
        .prepare(`
          SELECT *
          FROM school_rules
          WHERE ${where}
          ORDER BY
            category COLLATE NOCASE,
            display_order ASC,
            title COLLATE NOCASE
        `)
        .all(params)
        .map(schoolRuleFromRow);
    },

    createSchoolRule(input = {}) {
      const timestamp = now();
      const values = resolveSchoolRuleValues(input);
      const id = crypto.randomUUID();
      db.prepare(`
        INSERT INTO school_rules (
          id, title, category, rule_text, display_order, status,
          academic_session_id, academic_session_name, effective_from,
          created_by, created_at, updated_at, deleted_at, sync_status
        ) VALUES (
          @id, @title, @category, @ruleText, @displayOrder, @status,
          @academicSessionId, @academicSessionName, @effectiveFrom,
          @createdBy, @createdAt, @updatedAt, NULL, 'pending'
        )
      `).run({
        id,
        ...values,
        createdBy: optionalText(input.createdBy),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      return schoolRuleFromRow(
        db.prepare("SELECT * FROM school_rules WHERE id = ?").get(id),
      );
    },

    updateSchoolRule(id, input = {}) {
      const ruleId = requiredText(id, "Rule id");
      const existing = db
        .prepare(`
          SELECT *
          FROM school_rules
          WHERE id = ? AND deleted_at IS NULL
        `)
        .get(ruleId);
      if (!existing) throw new Error("Rule was not found.");
      const values = resolveSchoolRuleValues(input, existing);
      db.prepare(`
        UPDATE school_rules
        SET title = @title,
            category = @category,
            rule_text = @ruleText,
            display_order = @displayOrder,
            status = @status,
            academic_session_id = @academicSessionId,
            academic_session_name = @academicSessionName,
            effective_from = @effectiveFrom,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id AND deleted_at IS NULL
      `).run({
        id: ruleId,
        ...values,
        updatedAt: now(),
      });
      return schoolRuleFromRow(
        db.prepare("SELECT * FROM school_rules WHERE id = ?").get(ruleId),
      );
    },

    deleteSchoolRule(id) {
      const ruleId = requiredText(id, "Rule id");
      const timestamp = now();
      const result = db
        .prepare(`
          UPDATE school_rules
          SET deleted_at = @deletedAt,
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE id = @id AND deleted_at IS NULL
        `)
        .run({ id: ruleId, deletedAt: timestamp, updatedAt: timestamp });
      return { success: result.changes === 1 };
    },

    reorderSchoolRules(records = []) {
      if (!Array.isArray(records)) {
        throw new Error("Rule order records must be an array.");
      }
      const timestamp = now();
      const updateOrder = db.prepare(`
        UPDATE school_rules
        SET display_order = @displayOrder,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id AND deleted_at IS NULL
      `);
      db.transaction(() => {
        records.forEach((record, index) => {
          updateOrder.run({
            id: requiredText(record?.id, "Rule id"),
            displayOrder:
              record?.displayOrder === undefined
                ? index
                : wholeNumber(record.displayOrder, "Display order", 0),
            updatedAt: timestamp,
          });
        });
      })();
      return this.getSchoolRules({});
    },

    getAppPreferences() {
      return appPreferenceFromRow(getApplicationPreferenceRow());
    },

    updateAppPreferences(input = {}) {
      const existing = getApplicationPreferenceRow();
      const values = resolvePreferenceValues(input, existing);
      const timestamp = now();
      db.prepare(`
        UPDATE app_preferences
        SET theme_mode = @themeMode,
            accent_color = @accentColor,
            language = @language,
            compact_sidebar = @compactSidebar,
            font_scale = @fontScale,
            date_format = @dateFormat,
            time_format = @timeFormat,
            updated_at = @updatedAt
        WHERE id = @id
      `).run({
        id: existing.id,
        ...values,
        compactSidebar: values.compactSidebar ? 1 : 0,
        updatedAt: timestamp,
      });
      return this.getAppPreferences();
    },

    getUserPreferences(userId) {
      const normalizedUserId = requiredText(userId, "User id");
      const user = this.getUserById(normalizedUserId);
      if (!user) throw new Error("User record was not found.");
      const row = db
        .prepare(`
          SELECT *
          FROM app_preferences
          WHERE preference_scope = 'User' AND user_id = ?
          LIMIT 1
        `)
        .get(normalizedUserId);
      if (row) return appPreferenceFromRow(row);
      const defaults = this.getAppPreferences();
      return {
        ...defaults,
        id: `user-${normalizedUserId}`,
        preferenceScope: "User",
        userId: normalizedUserId,
      };
    },

    updateUserPreferences(userId, input = {}) {
      const normalizedUserId = requiredText(userId, "User id");
      const user = this.getUserById(normalizedUserId);
      if (!user) throw new Error("User record was not found.");
      const existing = db
        .prepare(`
          SELECT *
          FROM app_preferences
          WHERE preference_scope = 'User' AND user_id = ?
          LIMIT 1
        `)
        .get(normalizedUserId);
      const fallback = existing ?? getApplicationPreferenceRow();
      const values = resolvePreferenceValues(input, fallback);
      const timestamp = now();
      if (existing) {
        db.prepare(`
          UPDATE app_preferences
          SET theme_mode = @themeMode,
              accent_color = @accentColor,
              language = @language,
              compact_sidebar = @compactSidebar,
              font_scale = @fontScale,
              date_format = @dateFormat,
              time_format = @timeFormat,
              updated_at = @updatedAt
          WHERE id = @id
        `).run({
          id: existing.id,
          ...values,
          compactSidebar: values.compactSidebar ? 1 : 0,
          updatedAt: timestamp,
        });
      } else {
        db.prepare(`
          INSERT INTO app_preferences (
            id, preference_scope, user_id, theme_mode, accent_color,
            language, compact_sidebar, font_scale, date_format, time_format,
            created_at, updated_at
          ) VALUES (
            @id, 'User', @userId, @themeMode, @accentColor, @language,
            @compactSidebar, @fontScale, @dateFormat, @timeFormat,
            @createdAt, @updatedAt
          )
        `).run({
          id: crypto.randomUUID(),
          userId: normalizedUserId,
          ...values,
          compactSidebar: values.compactSidebar ? 1 : 0,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }
      return this.getUserPreferences(normalizedUserId);
    },

    createLoginHistory(input = {}) {
      const timestamp = now();
      const id = crypto.randomUUID();
      db.prepare(`
        INSERT INTO login_history (
          id, user_id, username, role, login_at, logout_at, success,
          device_name, os, failure_reason, created_at
        ) VALUES (
          @id, @userId, @username, @role, @loginAt, NULL, @success,
          @deviceName, @os, @failureReason, @createdAt
        )
      `).run({
        id,
        userId: optionalText(input.userId) || null,
        username: optionalText(input.username),
        role: optionalText(input.role),
        loginAt: optionalText(input.loginAt) || timestamp,
        success: input.success === false ? 0 : 1,
        deviceName: optionalText(input.deviceName),
        os: optionalText(input.os),
        failureReason: optionalText(input.failureReason),
        createdAt: timestamp,
      });
      return loginHistoryFromRow(
        db.prepare("SELECT * FROM login_history WHERE id = ?").get(id),
      );
    },

    finishLoginHistory(id) {
      const historyId = optionalText(id);
      if (!historyId) return { success: false };
      const result = db
        .prepare(`
          UPDATE login_history
          SET logout_at = ?
          WHERE id = ? AND logout_at IS NULL
        `)
        .run(now(), historyId);
      return { success: result.changes === 1 };
    },

    getLoginHistory(filter = {}, userId = "") {
      const { where, params } = buildLoginHistoryWhere(filter, userId);
      const safeLimit = Math.min(
        500,
        Math.max(1, wholeNumber(filter.limit ?? 100, "History limit", 1)),
      );
      return db
        .prepare(`
          SELECT *
          FROM login_history
          ${where}
          ORDER BY login_at DESC, created_at DESC
          LIMIT @limit
        `)
        .all({ ...params, limit: safeLimit })
        .map(loginHistoryFromRow);
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
      const accountType = optionalText(input?.accountType) || (
        role === "Student" ? "Student" : "Staff"
      );
      if (!USER_ACCOUNT_TYPES.has(accountType)) {
        throw new Error("User account type is invalid.");
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
          status, account_type, must_change_password, password_changed_at,
          failed_login_count, locked_until, last_login_at, created_at,
          updated_at, deleted_at, sync_status
        ) VALUES (
          @id, @name, @email, @username, @passwordHash, @passwordSalt, @role,
          @status, @accountType, @mustChangePassword, @passwordChangedAt,
          0, NULL, NULL, @createdAt, @updatedAt, NULL, 'pending'
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
        accountType,
        mustChangePassword: input?.mustChangePassword ? 1 : 0,
        passwordChangedAt: input?.mustChangePassword ? null : timestamp,
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
      const username =
        input?.username === undefined
          ? existing.username
          : requiredText(input.username, "Username").toLowerCase();
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
      const accountType =
        input?.accountType === undefined
          ? existing.account_type ?? (role === "Student" ? "Student" : "Staff")
          : requiredText(input.accountType, "Account type");
      if (!USER_ACCOUNT_TYPES.has(accountType)) {
        throw new Error("User account type is invalid.");
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
        username !== existing.username &&
        db
          .prepare(`
            SELECT id
            FROM users
            WHERE username = ? COLLATE NOCASE AND id <> ?
          `)
          .get(username, userId)
      ) {
        throw new Error("This username is already in use.");
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
            username = @username,
            email = @email,
            role = @role,
            status = @status,
            account_type = @accountType,
            must_change_password = @mustChangePassword,
            failed_login_count = @failedLoginCount,
            locked_until = @lockedUntil,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id AND deleted_at IS NULL
      `).run({
        id: userId,
        name,
        username,
        email,
        role,
        status,
        accountType,
        mustChangePassword:
          input?.mustChangePassword === undefined
            ? Number(existing.must_change_password ?? 0)
            : input.mustChangePassword
              ? 1
              : 0,
        failedLoginCount:
          input?.failedLoginCount === undefined
            ? Number(existing.failed_login_count ?? 0)
            : wholeNumber(input.failedLoginCount, "Failed login count", 0),
        lockedUntil:
          input?.lockedUntil === undefined
            ? existing.locked_until ?? null
            : optionalText(input.lockedUntil) || null,
        updatedAt: now(),
      });
      return this.getUserById(userId);
    },

    setUserPassword(id, passwordHash, passwordSalt, options = {}) {
      const timestamp = now();
      const mustChangePassword = options.mustChangePassword ? 1 : 0;
      const result = db
        .prepare(`
          UPDATE users
          SET password_hash = ?,
              password_salt = ?,
              must_change_password = ?,
              password_changed_at = ?,
              failed_login_count = 0,
              locked_until = NULL,
              updated_at = ?,
              sync_status = 'pending'
          WHERE id = ? AND deleted_at IS NULL
        `)
        .run(
          requiredText(passwordHash, "Password hash"),
          requiredText(passwordSalt, "Password salt"),
          mustChangePassword,
          mustChangePassword ? null : timestamp,
          timestamp,
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
        SET last_login_at = ?,
            failed_login_count = 0,
            locked_until = NULL,
            updated_at = ?
        WHERE id = ? AND deleted_at IS NULL
      `).run(timestamp, timestamp, requiredText(id, "User id"));
      return this.getUserById(id);
    },

    recordFailedLogin(userId) {
      const normalizedUserId = optionalText(userId);
      if (!normalizedUserId) return null;
      const row = db
        .prepare(`
          SELECT id, failed_login_count, role
          FROM users
          WHERE id = ? AND deleted_at IS NULL
        `)
        .get(normalizedUserId);
      if (!row) return null;
      const failedLoginCount = Number(row.failed_login_count ?? 0) + 1;
      const shouldLock = row.role !== "Owner" && failedLoginCount >= 5;
      const lockedUntil = shouldLock
        ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
        : null;
      db.prepare(`
        UPDATE users
        SET failed_login_count = @failedLoginCount,
            locked_until = @lockedUntil,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id AND deleted_at IS NULL
      `).run({
        id: normalizedUserId,
        failedLoginCount,
        lockedUntil,
        updatedAt: now(),
      });
      return this.getUserById(normalizedUserId);
    },

    clearUserLock(id) {
      const result = db
        .prepare(`
          UPDATE users
          SET failed_login_count = 0,
              locked_until = NULL,
              updated_at = ?,
              sync_status = 'pending'
          WHERE id = ? AND deleted_at IS NULL
        `)
        .run(now(), requiredText(id, "User id"));
      return { success: result.changes === 1 };
    },

    setUserMustChangePassword(id, mustChangePassword) {
      const result = db
        .prepare(`
          UPDATE users
          SET must_change_password = ?,
              updated_at = ?,
              sync_status = 'pending'
          WHERE id = ? AND deleted_at IS NULL
        `)
        .run(mustChangePassword ? 1 : 0, now(), requiredText(id, "User id"));
      if (result.changes !== 1) throw new Error("User record was not found.");
      return this.getUserById(id);
    },

    getPrimaryUserEntityLink(userId) {
      const row = db
        .prepare(`
          SELECT
            links.*,
            users.username,
            users.name AS user_name,
            users.role,
            users.account_type,
            users.status AS user_status,
            users.must_change_password,
            users.last_login_at
          FROM user_entity_links AS links
          JOIN users ON users.id = links.user_id AND users.deleted_at IS NULL
          WHERE links.user_id = ?
            AND links.is_primary = 1
            AND links.deleted_at IS NULL
          LIMIT 1
        `)
        .get(requiredText(userId, "User id"));
      return row ? userEntityLinkFromRow(row) : null;
    },

    getUserEntityLinks(filter = {}) {
      const clauses = ["links.deleted_at IS NULL"];
      const params = {};
      const userId = optionalText(filter.userId);
      if (userId) {
        clauses.push("links.user_id = @userId");
        params.userId = userId;
      }
      const entityType = optionalText(filter.entityType);
      if (entityType) {
        if (!USER_ENTITY_TYPES.has(entityType)) {
          throw new Error("Entity type is invalid.");
        }
        clauses.push("links.entity_type = @entityType");
        params.entityType = entityType;
      }
      const entityId = optionalText(filter.entityId);
      if (entityId) {
        clauses.push("links.entity_id = @entityId");
        params.entityId = entityId;
      }
      return db
        .prepare(`
          SELECT
            links.*,
            users.username,
            users.name AS user_name,
            users.role,
            users.account_type,
            users.status AS user_status,
            users.must_change_password,
            users.last_login_at
          FROM user_entity_links AS links
          JOIN users ON users.id = links.user_id AND users.deleted_at IS NULL
          WHERE ${clauses.join(" AND ")}
          ORDER BY links.created_at DESC
        `)
        .all(params)
        .map(userEntityLinkFromRow);
    },

    createUserEntityLink(input = {}) {
      const user = this.getUserById(requiredText(input.userId, "User id"));
      if (!user) throw new Error("User record was not found.");
      const entityType = requiredText(input.entityType, "Entity type");
      if (!USER_ENTITY_TYPES.has(entityType)) {
        throw new Error("Entity type is invalid.");
      }
      const entityId = requiredText(input.entityId, "Entity id");
      if (entityType === "Student" && !this.getStudentById(entityId)) {
        throw new Error("Student record was not found.");
      }
      if (entityType === "Employee" && !this.getEmployeeById(entityId)) {
        throw new Error("Employee record was not found.");
      }
      const isPrimary = input.isPrimary === false ? 0 : 1;
      const duplicateUser = db
        .prepare(`
          SELECT id
          FROM user_entity_links
          WHERE user_id = ?
            AND is_primary = 1
            AND deleted_at IS NULL
          LIMIT 1
        `)
        .get(user.id);
      if (isPrimary && duplicateUser) {
        throw new Error("This user already has an active primary entity link.");
      }
      const duplicateEntity = db
        .prepare(`
          SELECT id
          FROM user_entity_links
          WHERE entity_type = ?
            AND entity_id = ?
            AND is_primary = 1
            AND deleted_at IS NULL
          LIMIT 1
        `)
        .get(entityType, entityId);
      if (isPrimary && duplicateEntity && !input.allowDuplicateEntity) {
        throw new Error(`${entityType} already has an active login account.`);
      }
      const timestamp = now();
      const id = crypto.randomUUID();
      db.prepare(`
        INSERT INTO user_entity_links (
          id, user_id, entity_type, entity_id, entity_code, entity_name,
          is_primary, created_at, updated_at, deleted_at, sync_status
        ) VALUES (
          @id, @userId, @entityType, @entityId, @entityCode, @entityName,
          @isPrimary, @createdAt, @updatedAt, NULL, 'pending'
        )
      `).run({
        id,
        userId: user.id,
        entityType,
        entityId,
        entityCode: optionalText(input.entityCode),
        entityName: optionalText(input.entityName),
        isPrimary,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      return this.getUserEntityLinks({ userId: user.id }).find(
        (link) => link.id === id,
      );
    },

    updateUserEntityLink(id, input = {}) {
      const linkId = requiredText(id, "Entity link id");
      const existing = db
        .prepare(`
          SELECT *
          FROM user_entity_links
          WHERE id = ? AND deleted_at IS NULL
        `)
        .get(linkId);
      if (!existing) throw new Error("Entity link was not found.");
      db.prepare(`
        UPDATE user_entity_links
        SET entity_code = @entityCode,
            entity_name = @entityName,
            is_primary = @isPrimary,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id AND deleted_at IS NULL
      `).run({
        id: linkId,
        entityCode:
          input.entityCode === undefined
            ? existing.entity_code ?? ""
            : optionalText(input.entityCode),
        entityName:
          input.entityName === undefined
            ? existing.entity_name ?? ""
            : optionalText(input.entityName),
        isPrimary:
          input.isPrimary === undefined
            ? Number(existing.is_primary ?? 1)
            : input.isPrimary
              ? 1
              : 0,
        updatedAt: now(),
      });
      return this.getUserEntityLinks({ userId: existing.user_id }).find(
        (link) => link.id === linkId,
      );
    },

    unlinkUserEntity(id) {
      const linkId = requiredText(id, "Entity link id");
      const timestamp = now();
      const row = db
        .prepare(`
          SELECT *
          FROM user_entity_links
          WHERE id = ? AND deleted_at IS NULL
        `)
        .get(linkId);
      if (!row) return { success: false };
      db.transaction(() => {
        db.prepare(`
          UPDATE user_entity_links
          SET deleted_at = @deletedAt,
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE id = @id AND deleted_at IS NULL
        `).run({ id: linkId, deletedAt: timestamp, updatedAt: timestamp });
        db.prepare(`
          UPDATE users
          SET status = 'Inactive',
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE id = @userId AND deleted_at IS NULL
        `).run({ userId: row.user_id, updatedAt: timestamp });
      })();
      return { success: true };
    },

    getStudentLoginAccounts(filter = {}) {
      const search = optionalText(filter.search).toLowerCase();
      const status = optionalText(filter.status);
      const rows = db
        .prepare(`
          SELECT
            links.id,
            links.user_id,
            links.entity_id AS student_id,
            links.entity_code,
            links.entity_name,
            users.name AS account_name,
            users.username,
            users.email,
            users.role,
            users.status,
            users.account_type,
            users.must_change_password,
            users.last_login_at,
            users.locked_until,
            students.admission_no,
            students.name AS student_name,
            students.class_name,
            students.section
          FROM user_entity_links AS links
          JOIN users
            ON users.id = links.user_id
            AND users.deleted_at IS NULL
          LEFT JOIN students
            ON students.id = links.entity_id
            AND students.deleted_at IS NULL
          WHERE links.entity_type = 'Student'
            AND links.deleted_at IS NULL
          ORDER BY students.class_name COLLATE NOCASE,
            students.section COLLATE NOCASE,
            students.name COLLATE NOCASE
        `)
        .all();
      return rows
        .filter((row) => !status || status === "All" || row.status === status)
        .filter((row) => {
          if (!search) return true;
          return [
            row.admission_no,
            row.student_name,
            row.class_name,
            row.section,
            row.username,
            row.status,
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(search));
        })
        .map((row) => ({
          id: row.id,
          userId: row.user_id,
          studentId: row.student_id,
          admissionNo: row.admission_no ?? row.entity_code ?? "",
          studentName: row.student_name ?? row.entity_name ?? "",
          className: row.class_name ?? "",
          section: row.section ?? "",
          username: row.username,
          email: row.email ?? "",
          role: row.role,
          accountType: row.account_type ?? "Student",
          status: row.status,
          mustChangePassword: Number(row.must_change_password ?? 0) === 1,
          lastLoginAt: row.last_login_at ?? null,
          lockedUntil: row.locked_until ?? null,
        }));
    },

    getEmployeeLoginAccounts(filter = {}) {
      const search = optionalText(filter.search).toLowerCase();
      const status = optionalText(filter.status);
      const rows = db
        .prepare(`
          SELECT
            links.id,
            links.user_id,
            links.entity_id AS employee_id,
            links.entity_code,
            links.entity_name,
            users.name AS account_name,
            users.username,
            users.email,
            users.role,
            users.status,
            users.account_type,
            users.must_change_password,
            users.last_login_at,
            users.locked_until,
            employees.employee_no,
            employees.name AS employee_name,
            employees.department,
            employees.designation
          FROM user_entity_links AS links
          JOIN users
            ON users.id = links.user_id
            AND users.deleted_at IS NULL
          LEFT JOIN employees
            ON employees.id = links.entity_id
            AND employees.deleted_at IS NULL
          WHERE links.entity_type = 'Employee'
            AND links.deleted_at IS NULL
          ORDER BY employees.department COLLATE NOCASE,
            employees.name COLLATE NOCASE
        `)
        .all();
      return rows
        .filter((row) => !status || status === "All" || row.status === status)
        .filter((row) => {
          if (!search) return true;
          return [
            row.employee_no,
            row.employee_name,
            row.department,
            row.designation,
            row.username,
            row.role,
            row.status,
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(search));
        })
        .map((row) => ({
          id: row.id,
          userId: row.user_id,
          employeeId: row.employee_id,
          employeeCode: row.employee_no ?? row.entity_code ?? "",
          employeeName: row.employee_name ?? row.entity_name ?? "",
          department: row.department ?? "",
          designation: row.designation ?? "",
          username: row.username,
          email: row.email ?? "",
          role: row.role,
          accountType: row.account_type ?? "Staff",
          status: row.status,
          mustChangePassword: Number(row.must_change_password ?? 0) === 1,
          lastLoginAt: row.last_login_at ?? null,
          lockedUntil: row.locked_until ?? null,
        }));
    },

    getMessageInbox(currentUser, filter = {}) {
      return queryMessageInbox(currentUser, filter);
    },

    getSentMessages(currentUser, filter = {}) {
      return querySentMessages(currentUser, filter);
    },

    getMessageThread(currentUser, threadId) {
      return buildMessageThreadDetail(currentUser, threadId);
    },

    markMessageThreadRead(currentUser, threadId) {
      const context = getMessageUserContext(currentUser);
      const thread = getMessageThreadRow(threadId);
      if (!thread) throw new Error("Message thread was not found.");
      const timestamp = now();
      const result = db
        .prepare(`
          UPDATE message_recipients
          SET delivery_status = CASE
                WHEN delivery_status = 'Archived' THEN 'Archived'
                ELSE 'Read'
              END,
              read_at = COALESCE(read_at, @readAt),
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE thread_id = @threadId
            AND recipient_user_id = @recipientUserId
            AND deleted_at IS NULL
        `)
        .run({
          threadId: thread.id,
          recipientUserId: context.id,
          readAt: timestamp,
          updatedAt: timestamp,
        });
      if (result.changes !== 1) {
        throw new Error("Only message recipients can mark this thread read.");
      }
      return buildMessageThreadDetail(context, thread.id);
    },

    archiveMessageThread(currentUser, threadId) {
      const context = getMessageUserContext(currentUser);
      const thread = getMessageThreadRow(threadId);
      if (!thread) throw new Error("Message thread was not found.");
      const timestamp = now();
      const result = db
        .prepare(`
          UPDATE message_recipients
          SET delivery_status = 'Archived',
              archived_at = @archivedAt,
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE thread_id = @threadId
            AND recipient_user_id = @recipientUserId
            AND deleted_at IS NULL
        `)
        .run({
          threadId: thread.id,
          recipientUserId: context.id,
          archivedAt: timestamp,
          updatedAt: timestamp,
        });
      if (result.changes !== 1) {
        throw new Error("Only message recipients can archive this thread.");
      }
      return { success: true };
    },

    unarchiveMessageThread(currentUser, threadId) {
      const context = getMessageUserContext(currentUser);
      const thread = getMessageThreadRow(threadId);
      if (!thread) throw new Error("Message thread was not found.");
      const result = db
        .prepare(`
          UPDATE message_recipients
          SET delivery_status = CASE
                WHEN read_at IS NULL THEN 'Delivered'
                ELSE 'Read'
              END,
              archived_at = NULL,
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE thread_id = @threadId
            AND recipient_user_id = @recipientUserId
            AND deleted_at IS NULL
        `)
        .run({
          threadId: thread.id,
          recipientUserId: context.id,
          updatedAt: now(),
        });
      if (result.changes !== 1) {
        throw new Error("Only message recipients can unarchive this thread.");
      }
      return { success: true };
    },

    createDirectMessage(currentUser, input = {}) {
      const context = getMessageUserContext(currentUser);
      if (!["Owner", "Admin", "Accountant", "Teacher"].includes(context.role)) {
        throw new Error("You do not have permission to send direct messages.");
      }
      const recipientUserIds = (
        Array.isArray(input.recipientUserIds)
          ? input.recipientUserIds
          : [input.recipientUserId]
      )
        .map((id) => optionalText(id))
        .filter(Boolean);
      const uniqueRecipientUserIds = [...new Set(recipientUserIds)];
      if (uniqueRecipientUserIds.length === 0) {
        throw new Error("Select at least one message recipient.");
      }
      const eligible = getEligibleMessageRecipientCandidates(context, {
        recipientType: input.recipientType,
      });
      const recipients = uniqueRecipientUserIds.map((userId) => {
        const candidate = eligible.find((item) => item.userId === userId);
        if (!candidate) {
          throw new Error("One or more recipients are not permitted.");
        }
        return candidate;
      });
      const timestamp = now();
      const threadId = crypto.randomUUID();
      db.transaction(() => {
        db.prepare(`
          INSERT INTO message_threads (
            id, subject, thread_type, created_by_user_id, created_by_name,
            created_by_role, academic_session_id, class_name, section, status,
            priority, created_at, updated_at, deleted_at, sync_status
          ) VALUES (
            @id, @subject, 'Direct', @createdByUserId, @createdByName,
            @createdByRole, @academicSessionId, @className, @section, 'Active',
            @priority, @createdAt, @updatedAt, NULL, 'pending'
          )
        `).run({
          id: threadId,
          subject: requiredText(input.subject, "Subject"),
          createdByUserId: context.id,
          createdByName: context.name,
          createdByRole: context.role,
          academicSessionId: optionalText(input.academicSessionId) || null,
          className: optionalText(input.className),
          section: optionalText(input.section),
          priority: normalizeMessagePriority(input.priority),
          createdAt: timestamp,
          updatedAt: timestamp,
        });
        createThreadMessage({
          threadId,
          sender: context,
          messageText: input.messageText,
          messageType: "Text",
          timestamp,
        });
        recipients.forEach((recipient) =>
          insertMessageRecipient(threadId, recipient, timestamp),
        );
      })();
      return buildMessageThreadDetail(context, threadId);
    },

    replyToMessageThread(currentUser, input = {}) {
      const context = getMessageUserContext(currentUser);
      if (context.role === "Viewer") {
        throw new Error("Viewer accounts cannot reply to messages.");
      }
      const thread = getMessageThreadRow(input.threadId);
      if (!thread) throw new Error("Message thread was not found.");
      if (thread.status !== "Active") {
        throw new Error("Closed or archived threads cannot accept replies.");
      }
      if (!canReadMessageThreadContent(context, thread)) {
        throw new Error("You do not have access to this message thread.");
      }
      if (context.role === "Student") {
        const staffOriginated = db
          .prepare(`
            SELECT id
            FROM messages
            WHERE thread_id = ?
              AND sender_role <> 'Student'
            LIMIT 1
          `)
          .get(thread.id);
        if (thread.thread_type !== "Direct" || !staffOriginated) {
          throw new Error("Student accounts can only reply to staff messages.");
        }
      }
      const timestamp = now();
      db.transaction(() => {
        const previousSenders = db
          .prepare(`
            SELECT DISTINCT sender_user_id
            FROM messages
            WHERE thread_id = ?
              AND sender_user_id <> ?
          `)
          .all(thread.id, context.id)
          .map((row) => row.sender_user_id);
        createThreadMessage({
          threadId: thread.id,
          sender: context,
          messageText: input.messageText,
          messageType: "Text",
          replyToMessageId: input.replyToMessageId,
          timestamp,
        });
        previousSenders.forEach((senderUserId) => {
          const candidate = getMessageRecipientCandidateByUserId(senderUserId);
          if (candidate) insertMessageRecipient(thread.id, candidate, timestamp);
        });
      })();
      return buildMessageThreadDetail(context, thread.id);
    },

    editOwnMessage(currentUser, messageId, text) {
      const context = getMessageUserContext(currentUser);
      const message = db
        .prepare(`
          SELECT *
          FROM messages
          WHERE id = ?
            AND deleted_at IS NULL
        `)
        .get(requiredText(messageId, "Message id"));
      if (!message) throw new Error("Message was not found.");
      if (message.sender_user_id !== context.id) {
        throw new Error("You can only edit your own messages.");
      }
      const timestamp = now();
      db.prepare(`
        UPDATE messages
        SET message_text = @messageText,
            edited_at = @editedAt,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id
          AND sender_user_id = @senderUserId
          AND deleted_at IS NULL
      `).run({
        id: message.id,
        senderUserId: context.id,
        messageText: requiredText(text, "Message"),
        editedAt: timestamp,
        updatedAt: timestamp,
      });
      return buildMessageThreadDetail(context, message.thread_id);
    },

    deleteOwnMessage(currentUser, messageId) {
      const context = getMessageUserContext(currentUser);
      const message = db
        .prepare(`
          SELECT *
          FROM messages
          WHERE id = ?
            AND deleted_at IS NULL
        `)
        .get(requiredText(messageId, "Message id"));
      if (!message) throw new Error("Message was not found.");
      if (message.sender_user_id !== context.id) {
        throw new Error("You can only delete your own messages.");
      }
      const timestamp = now();
      const result = db
        .prepare(`
          UPDATE messages
          SET deleted_at = @deletedAt,
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE id = @id
            AND sender_user_id = @senderUserId
            AND deleted_at IS NULL
        `)
        .run({
          id: message.id,
          senderUserId: context.id,
          deletedAt: timestamp,
          updatedAt: timestamp,
        });
      return { success: result.changes === 1 };
    },

    closeMessageThread(currentUser, threadId) {
      const context = getMessageUserContext(currentUser);
      const thread = getMessageThreadRow(threadId);
      if (!thread) throw new Error("Message thread was not found.");
      if (
        thread.created_by_user_id !== context.id &&
        !messageIsAdmin(context)
      ) {
        throw new Error("You do not have permission to close this thread.");
      }
      const result = db
        .prepare(`
          UPDATE message_threads
          SET status = 'Closed',
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE id = @id
            AND deleted_at IS NULL
        `)
        .run({ id: thread.id, updatedAt: now() });
      return { success: result.changes === 1 };
    },

    getAnnouncements(currentUser, filter = {}) {
      const context = getMessageUserContext(currentUser);
      const clauses = ["announcements.deleted_at IS NULL"];
      const params = {
        userId: context.id,
      };
      const status = optionalText(filter.status);
      if (status && status !== "All") {
        clauses.push("announcements.status = @status");
        params.status = status;
      }
      const audienceType = optionalText(filter.audienceType);
      if (audienceType && ANNOUNCEMENT_AUDIENCE_TYPES.has(audienceType)) {
        clauses.push("announcements.audience_type = @audienceType");
        params.audienceType = audienceType;
      }
      const className = optionalText(filter.className);
      if (className) {
        clauses.push("announcements.class_name = @className");
        params.className = className;
      }
      const section = optionalText(filter.section);
      if (section) {
        clauses.push("announcements.section = @section");
        params.section = section;
      }
      if (!messageIsAdmin(context)) {
        clauses.push(`
          (
            announcements.created_by_user_id = @userId
            OR EXISTS (
              SELECT 1
              FROM message_recipients
              WHERE message_recipients.thread_id = announcements.id
                AND message_recipients.recipient_user_id = @userId
                AND message_recipients.deleted_at IS NULL
            )
          )
        `);
      }
      const search = optionalText(filter.search).toLowerCase();
      const rows = db
        .prepare(`
          SELECT
            announcements.*,
            (
              SELECT COUNT(*)
              FROM message_recipients
              WHERE thread_id = announcements.id
                AND deleted_at IS NULL
            ) AS recipient_count,
            (
              SELECT COUNT(*)
              FROM message_recipients
              WHERE thread_id = announcements.id
                AND deleted_at IS NULL
                AND read_at IS NOT NULL
            ) AS read_count,
            announcements.id AS thread_id
          FROM announcements
          WHERE ${clauses.join(" AND ")}
          ORDER BY announcements.updated_at DESC, announcements.created_at DESC
        `)
        .all(params)
        .map(announcementFromRow)
        .filter((announcement) => {
          if (!search) return true;
          return [
            announcement.title,
            announcement.announcementText,
            announcement.audienceType,
            announcement.className,
            announcement.section,
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(search));
        });
      return rows;
    },

    getCurrentUserAnnouncements(currentUser, filter = {}) {
      const limit = filter.limit
        ? Math.min(50, Math.max(1, wholeNumber(filter.limit, "Announcement limit", 1)))
        : 10;
      return queryMessageInbox(currentUser, {
        ...filter,
        archived: false,
        limit: 200,
      })
        .filter((thread) => thread.threadType !== "Direct")
        .slice(0, limit);
    },

    createAnnouncement(currentUser, input = {}) {
      const context = assertCanCreateAnnouncement(currentUser, input);
      const audienceType = normalizeAnnouncementAudience(input.audienceType);
      const priority = normalizeMessagePriority(input.priority);
      const status = normalizeAnnouncementStatus(input.status, "Draft");
      if (status !== "Draft" && status !== "Published") {
        throw new Error("New announcements must be saved as Draft or Published.");
      }
      const selectedUserIds = Array.isArray(input.selectedUserIds)
        ? [...new Set(input.selectedUserIds.map((id) => optionalText(id)).filter(Boolean))]
        : [];
      const timestamp = now();
      const id = crypto.randomUUID();
      db.prepare(`
        INSERT INTO announcements (
          id, title, announcement_text, audience_type, academic_session_id,
          class_name, section, priority, publish_from, publish_until, status,
          selected_user_ids_json, created_by_user_id, created_by_name,
          created_at, updated_at, deleted_at, sync_status
        ) VALUES (
          @id, @title, @announcementText, @audienceType, @academicSessionId,
          @className, @section, @priority, @publishFrom, @publishUntil,
          'Draft', @selectedUserIdsJson, @createdByUserId, @createdByName,
          @createdAt, @updatedAt, NULL, 'pending'
        )
      `).run({
        id,
        title: requiredText(input.title, "Announcement title"),
        announcementText: requiredText(input.announcementText, "Announcement text"),
        audienceType,
        academicSessionId: optionalText(input.academicSessionId) || null,
        className: optionalText(input.className),
        section: optionalText(input.section),
        priority,
        publishFrom: optionalText(input.publishFrom),
        publishUntil: optionalText(input.publishUntil),
        selectedUserIdsJson: JSON.stringify(selectedUserIds),
        createdByUserId: context.id,
        createdByName: context.name,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      if (status === "Published") {
        return publishAnnouncementInternal(id, context);
      }
      return getAnnouncementByIdInternal(id);
    },

    updateAnnouncement(currentUser, id, input = {}) {
      const announcementId = requiredText(id, "Announcement id");
      const existing = db
        .prepare(`
          SELECT *
          FROM announcements
          WHERE id = ?
            AND deleted_at IS NULL
        `)
        .get(announcementId);
      if (!existing) throw new Error("Announcement was not found.");
      const context = ensureAnnouncementManageAccess(currentUser, existing);
      const nextAudienceType =
        input.audienceType === undefined
          ? existing.audience_type
          : normalizeAnnouncementAudience(input.audienceType);
      assertCanCreateAnnouncement(context, {
        ...input,
        audienceType: nextAudienceType,
        className: input.className ?? existing.class_name,
        section: input.section ?? existing.section,
      });
      const selectedUserIds =
        input.selectedUserIds === undefined
          ? announcementFromRow(existing).selectedUserIds
          : [
              ...new Set(
                input.selectedUserIds
                  .map((userId) => optionalText(userId))
                  .filter(Boolean),
              ),
            ];
      db.prepare(`
        UPDATE announcements
        SET title = @title,
            announcement_text = @announcementText,
            audience_type = @audienceType,
            academic_session_id = @academicSessionId,
            class_name = @className,
            section = @section,
            priority = @priority,
            publish_from = @publishFrom,
            publish_until = @publishUntil,
            selected_user_ids_json = @selectedUserIdsJson,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id
          AND deleted_at IS NULL
      `).run({
        id: announcementId,
        title:
          input.title === undefined
            ? existing.title
            : requiredText(input.title, "Announcement title"),
        announcementText:
          input.announcementText === undefined
            ? existing.announcement_text
            : requiredText(input.announcementText, "Announcement text"),
        audienceType: nextAudienceType,
        academicSessionId:
          input.academicSessionId === undefined
            ? existing.academic_session_id || null
            : optionalText(input.academicSessionId) || null,
        className:
          input.className === undefined
            ? existing.class_name ?? ""
            : optionalText(input.className),
        section:
          input.section === undefined
            ? existing.section ?? ""
            : optionalText(input.section),
        priority:
          input.priority === undefined
            ? existing.priority ?? "Normal"
            : normalizeMessagePriority(input.priority),
        publishFrom:
          input.publishFrom === undefined
            ? existing.publish_from ?? ""
            : optionalText(input.publishFrom),
        publishUntil:
          input.publishUntil === undefined
            ? existing.publish_until ?? ""
            : optionalText(input.publishUntil),
        selectedUserIdsJson: JSON.stringify(selectedUserIds),
        updatedAt: now(),
      });
      if (existing.status === "Published") {
        return publishAnnouncementInternal(announcementId, context);
      }
      return getAnnouncementByIdInternal(announcementId);
    },

    publishAnnouncement(currentUser, id) {
      return publishAnnouncementInternal(id, currentUser);
    },

    cancelAnnouncement(currentUser, id) {
      const announcementId = requiredText(id, "Announcement id");
      const existing = db
        .prepare(`
          SELECT *
          FROM announcements
          WHERE id = ?
            AND deleted_at IS NULL
        `)
        .get(announcementId);
      if (!existing) throw new Error("Announcement was not found.");
      ensureAnnouncementManageAccess(currentUser, existing);
      const timestamp = now();
      db.transaction(() => {
        db.prepare(`
          UPDATE announcements
          SET status = 'Cancelled',
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE id = @id
            AND deleted_at IS NULL
        `).run({ id: announcementId, updatedAt: timestamp });
        db.prepare(`
          UPDATE message_threads
          SET status = 'Closed',
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE id = @id
            AND deleted_at IS NULL
        `).run({ id: announcementId, updatedAt: timestamp });
      })();
      return getAnnouncementByIdInternal(announcementId);
    },

    deleteAnnouncement(currentUser, id) {
      const announcementId = requiredText(id, "Announcement id");
      const existing = db
        .prepare(`
          SELECT *
          FROM announcements
          WHERE id = ?
            AND deleted_at IS NULL
        `)
        .get(announcementId);
      if (!existing) return { success: false };
      ensureAnnouncementManageAccess(currentUser, existing);
      const timestamp = now();
      let changes = 0;
      db.transaction(() => {
        const result = db
          .prepare(`
            UPDATE announcements
            SET deleted_at = @deletedAt,
                updated_at = @updatedAt,
                sync_status = 'pending'
            WHERE id = @id
              AND deleted_at IS NULL
          `)
          .run({ id: announcementId, deletedAt: timestamp, updatedAt: timestamp });
        changes = result.changes;
        db.prepare(`
          UPDATE message_threads
          SET deleted_at = @deletedAt,
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE id = @id
            AND deleted_at IS NULL
        `).run({ id: announcementId, deletedAt: timestamp, updatedAt: timestamp });
      })();
      return { success: changes === 1 };
    },

    getEligibleMessageRecipients(currentUser, filter = {}) {
      return getEligibleMessageRecipientCandidates(currentUser, filter);
    },

    resolveAnnouncementRecipients(currentUser, input = {}) {
      return resolveAnnouncementRecipientCandidates(currentUser, input);
    },

    getMessageDeliveryReport(currentUser, threadId) {
      const thread = getMessageThreadRow(threadId);
      if (!thread) throw new Error("Message thread was not found.");
      const context = ensureMessageReportAccess(currentUser, thread);
      const threadSummary = messageThreadFromRow(thread);
      if (!canReadMessageThreadContent(context, thread)) {
        threadSummary.lastMessagePreview = "";
      }
      return {
        thread: threadSummary,
        recipients: getThreadRecipientRows(thread.id),
      };
    },

    getAnnouncementReadReport(currentUser, announcementId) {
      const announcement = getAnnouncementByIdInternal(announcementId);
      if (!announcement) throw new Error("Announcement was not found.");
      ensureAnnouncementManageAccess(currentUser, {
        id: announcement.id,
        created_by_user_id: announcement.createdByUserId,
      });
      return {
        announcement,
        recipients: getThreadRecipientRows(announcement.id),
      };
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

    getExamSchedules(filter = {}) {
      const rows = db
        .prepare(`
          SELECT schedule.*,
                 COUNT(entry.id) AS entry_count
          FROM exam_schedules schedule
          LEFT JOIN exam_schedule_entries entry
            ON entry.schedule_id = schedule.id
           AND entry.deleted_at IS NULL
          WHERE schedule.deleted_at IS NULL
            AND (@examId = '' OR schedule.exam_id = @examId)
            AND (@sessionId = '' OR schedule.academic_session_id = @sessionId)
            AND (@status = '' OR schedule.status = @status)
          GROUP BY schedule.id
          ORDER BY schedule.start_date DESC, schedule.exam_name COLLATE NOCASE
        `)
        .all({
          examId: optionalText(filter.examId),
          sessionId: optionalText(filter.academicSessionId),
          status: optionalText(filter.status),
        });
      return rows.map((row) => examScheduleFromRow(row));
    },

    getExamSchedule(id) {
      return getExamScheduleInternal(id);
    },

    createExamSchedule(input = {}) {
      const values = resolveExamScheduleInput(input);
      const id = crypto.randomUUID();
      const timestamp = now();
      db.prepare(`
        INSERT INTO exam_schedules (
          id, academic_session_id, academic_session_name, exam_id, exam_name,
          title, start_date, end_date, status, instructions, created_by,
          created_at, updated_at, deleted_at, sync_status
        ) VALUES (
          @id, @academicSessionId, @academicSessionName, @examId, @examName,
          @title, @startDate, @endDate, @status, @instructions, @createdBy,
          @createdAt, @updatedAt, NULL, 'pending'
        )
      `).run({
        id,
        academicSessionId: values.session?.id ?? "",
        academicSessionName: values.session?.session_name ?? "",
        examId: values.exam.id,
        examName: values.exam.name,
        title: values.title,
        startDate: values.startDate,
        endDate: values.endDate,
        status: values.status,
        instructions: values.instructions,
        createdBy: optionalText(input.createdBy),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      insertAuditLog(input.auditUser, "Exam schedule created", "Exams", `Created schedule for ${values.exam.name}.`);
      return getExamScheduleInternal(id);
    },

    updateExamSchedule(id, input = {}) {
      const existing = db
        .prepare("SELECT * FROM exam_schedules WHERE id = ? AND deleted_at IS NULL")
        .get(requiredText(id, "Schedule id"));
      if (!existing) throw new Error("Exam schedule was not found.");
      const values = resolveExamScheduleInput(input, existing);
      const timestamp = now();
      db.prepare(`
        UPDATE exam_schedules
        SET academic_session_id = @academicSessionId,
            academic_session_name = @academicSessionName,
            exam_id = @examId,
            exam_name = @examName,
            title = @title,
            start_date = @startDate,
            end_date = @endDate,
            status = @status,
            instructions = @instructions,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id AND deleted_at IS NULL
      `).run({
        id: existing.id,
        academicSessionId: values.session?.id ?? "",
        academicSessionName: values.session?.session_name ?? "",
        examId: values.exam.id,
        examName: values.exam.name,
        title: values.title,
        startDate: values.startDate,
        endDate: values.endDate,
        status: values.status,
        instructions: values.instructions,
        updatedAt: timestamp,
      });
      insertAuditLog(input.auditUser, "Exam schedule updated", "Exams", `Updated schedule ${existing.id}.`);
      return getExamScheduleInternal(existing.id);
    },

    deleteExamSchedule(id, auditUser = null) {
      const timestamp = now();
      const result = db
        .prepare(`
          UPDATE exam_schedules
          SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
          WHERE id = ? AND deleted_at IS NULL
        `)
        .run(timestamp, timestamp, requiredText(id, "Schedule id"));
      insertAuditLog(auditUser, "Exam schedule deleted", "Exams", "Soft-deleted an exam schedule.");
      return { success: result.changes === 1 };
    },

    setExamScheduleStatus(id, status, auditUser = null) {
      const nextStatus = normalizeNamedStatus(status, EXAM_SCHEDULE_STATUSES, "Draft", "Exam schedule");
      const timestamp = now();
      const result = db
        .prepare(`
          UPDATE exam_schedules
          SET status = ?, updated_at = ?, sync_status = 'pending'
          WHERE id = ? AND deleted_at IS NULL
        `)
        .run(nextStatus, timestamp, requiredText(id, "Schedule id"));
      insertAuditLog(auditUser, `Exam schedule ${nextStatus.toLowerCase()}`, "Exams", `Status set to ${nextStatus}.`);
      return getExamScheduleInternal(id) ?? { success: result.changes === 1 };
    },

    publishExamSchedule(id, auditUser = null) {
      return this.setExamScheduleStatus(id, "Published", auditUser);
    },

    cancelExamSchedule(id, auditUser = null) {
      return this.setExamScheduleStatus(id, "Cancelled", auditUser);
    },

    completeExamSchedule(id, auditUser = null) {
      return this.setExamScheduleStatus(id, "Completed", auditUser);
    },

    getExamScheduleEntries(scheduleId) {
      return getScheduleEntriesInternal(scheduleId);
    },

    saveExamScheduleEntries(scheduleId, entries = [], auditUser = null) {
      if (!Array.isArray(entries)) {
        throw new Error("Schedule entries must be an array.");
      }
      const schedule = getExamScheduleInternal(scheduleId);
      if (!schedule) throw new Error("Exam schedule was not found.");
      const normalized = entries.map((entry) => normalizeScheduleEntry(entry, schedule));
      const conflicts = detectScheduleConflictsForEntries(normalized);
      if (conflicts.length > 0) {
        throw new Error(conflicts[0]);
      }
      const timestamp = now();
      db.transaction(() => {
        db.prepare(`
          UPDATE exam_schedule_entries
          SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
          WHERE schedule_id = ? AND deleted_at IS NULL
        `).run(timestamp, timestamp, schedule.id);
        const insert = db.prepare(`
          INSERT INTO exam_schedule_entries (
            id, schedule_id, class_name, section, subject_id, subject_name,
            exam_date, start_time, end_time, room, maximum_marks,
            passing_marks, invigilator_employee_id, invigilator_name,
            instructions, created_at, updated_at, deleted_at, sync_status
          ) VALUES (
            @id, @scheduleId, @className, @section, @subjectId, @subjectName,
            @examDate, @startTime, @endTime, @room, @maximumMarks,
            @passingMarks, @invigilatorEmployeeId, @invigilatorName,
            @instructions, @createdAt, @updatedAt, NULL, 'pending'
          )
        `);
        normalized.forEach((entry) => {
          insert.run({
            ...entry,
            scheduleId: schedule.id,
            createdAt: timestamp,
            updatedAt: timestamp,
          });
        });
      })();
      insertAuditLog(auditUser, "Exam schedule entries saved", "Exams", `Saved ${normalized.length} paper row(s).`);
      return getScheduleEntriesInternal(schedule.id);
    },

    detectExamScheduleConflicts(input = {}) {
      const schedule = input.scheduleId
        ? getExamScheduleInternal(input.scheduleId)
        : resolveExamScheduleInput(input);
      const entries = Array.isArray(input.entries)
        ? input.entries.map((entry) => normalizeScheduleEntry(entry, schedule))
        : getScheduleEntriesInternal(schedule.id);
      return {
        conflicts: detectScheduleConflictsForEntries(entries),
      };
    },

    getDateSheet(filter = {}) {
      const rows = db
        .prepare(`
          SELECT entry.*, schedule.exam_name, schedule.academic_session_name,
                 schedule.title AS schedule_title, schedule.instructions AS schedule_instructions,
                 schedule.status AS schedule_status
          FROM exam_schedule_entries entry
          JOIN exam_schedules schedule ON schedule.id = entry.schedule_id
          WHERE entry.deleted_at IS NULL
            AND schedule.deleted_at IS NULL
            AND schedule.status = 'Published'
            AND (@examId = '' OR schedule.exam_id = @examId)
            AND (@className = '' OR entry.class_name = @className)
            AND (@section = '' OR COALESCE(entry.section, '') = @section)
          ORDER BY entry.exam_date, entry.start_time, entry.class_name, entry.section
        `)
        .all({
          examId: optionalText(filter.examId),
          className: optionalText(filter.className),
          section: optionalText(filter.section),
        });
      const entries = rows.map((row) => ({
        ...examScheduleEntryFromRow(row),
        examName: row.exam_name,
        academicSessionName: row.academic_session_name ?? "",
        scheduleTitle: row.schedule_title ?? "",
        scheduleInstructions: row.schedule_instructions ?? "",
        scheduleStatus: row.schedule_status,
      }));
      return {
        exam: entries[0]?.examName ? { name: entries[0].examName } : null,
        entries,
      };
    },

    getResultSheet(filter = {}) {
      return queryResultRows(filter);
    },

    getBlankAwardList(filter = {}) {
      const examId = requiredText(filter.examId, "Exam");
      const subjectId = requiredText(filter.subjectId, "Subject");
      const exam = getActiveExamById.get(examId);
      const subject = getActiveSubjectById.get(subjectId);
      if (!exam || !subject) throw new Error("Select an active exam and subject.");
      const section = optionalText(filter.section) || exam.section || "";
      const students = db
        .prepare(`
          SELECT *
          FROM students
          WHERE class_name = ?
            AND (? = '' OR section = ?)
            AND status = 'Active'
            AND deleted_at IS NULL
          ORDER BY name COLLATE NOCASE, admission_no COLLATE NOCASE
        `)
        .all(exam.class_name, section, section)
        .map(studentFromRow);
      return {
        exam: examFromRow(exam),
        subject: subjectFromRow(subject),
        className: exam.class_name,
        section,
        rows: students.map((student, index) => ({
          serialNo: index + 1,
          rollNo: "",
          admissionNo: student.admissionNo,
          studentId: student.id,
          studentName: student.name,
          maximumMarks: subject.max_marks,
          remarks: "",
        })),
      };
    },

    getStudentProgressReport(filter = {}) {
      const className = optionalText(filter.className);
      const section = optionalText(filter.section);
      const studentId = optionalText(filter.studentId);
      const examRows = this.getExams().filter((exam) =>
        (!className || exam.className === className) &&
        (!section || !exam.section || exam.section === section),
      );
      if (studentId) {
        const student = studentFromRow(getStudentRowRequired(studentId));
        const examResults = examRows
          .filter((exam) => exam.className === student.className)
          .map((exam) => {
            const result = queryResultRows({
              examId: exam.id,
              className: student.className,
              section: student.section,
              academicSessionId: filter.academicSessionId,
            }).rows.find((row) => row.student.id === student.id);
            return {
              exam,
              percentage: result?.percentage ?? null,
              result: result?.result ?? "No Data",
              grade: result?.grade ?? "",
            };
          });
        const attendanceRows = db
          .prepare("SELECT * FROM attendance WHERE student_id = ? ORDER BY attendance_date")
          .all(student.id)
          .map(attendanceFromRow);
        const present = attendanceRows.filter((row) => row.status === "Present").length;
        const attendancePercentage =
          attendanceRows.length > 0 ? Math.round((present / attendanceRows.length) * 10000) / 100 : null;
        return {
          mode: "individual",
          student,
          examResults,
          attendance: {
            workingDays: attendanceRows.length,
            presentDays: present,
            percentage: attendancePercentage,
          },
          classTests: db
            .prepare(`
              SELECT tests.test_name, tests.subject_name, tests.test_date,
                     marks.marks_obtained, marks.result_status, marks.remarks
              FROM class_test_marks marks
              JOIN class_tests tests ON tests.id = marks.test_id
              WHERE marks.student_id = ?
              ORDER BY tests.test_date DESC
            `)
            .all(student.id),
          reportCards: this.getStudentReportCards({ studentId: student.id }),
          note: "Progress is calculated from saved ERP records only.",
        };
      }
      const students = db
        .prepare(`
          SELECT *
          FROM students
          WHERE (@className = '' OR class_name = @className)
            AND (@section = '' OR section = @section)
            AND status = 'Active'
            AND deleted_at IS NULL
          ORDER BY class_name, section, name COLLATE NOCASE
        `)
        .all({ className, section })
        .map(studentFromRow);
      const sortedExams = [...examRows].sort((left, right) =>
        left.examDate.localeCompare(right.examDate),
      );
      const previousExam = sortedExams.at(-2);
      const currentExam = sortedExams.at(-1);
      const percentageFor = (student, exam) => {
        if (!exam) return null;
        const result = queryResultRows({
          examId: exam.id,
          className: student.className,
          section: student.section,
          academicSessionId: filter.academicSessionId,
        }).rows.find((row) => row.student.id === student.id);
        return result?.percentage ?? null;
      };
      return {
        mode: "class",
        previousExam,
        currentExam,
        rows: students.map((student) => {
          const previous = percentageFor(student, previousExam);
          const current = percentageFor(student, currentExam);
          const change =
            previous === null || current === null ? null : Math.round((current - previous) * 100) / 100;
          const indicator =
            change === null
              ? "No Data"
              : change > 2
                ? "Improving"
                : change < -2
                  ? "Needs Attention"
                  : "Stable";
          return {
            student,
            previousPercentage: previous,
            currentPercentage: current,
            percentageChange: change,
            indicator,
          };
        }),
      };
    },

    getCustomReportDomains() {
      return Object.entries(CUSTOM_REPORT_DOMAINS).map(([name, domain]) => ({
        name,
        columns: Object.entries(domain.columns).map(([key, value]) => ({
          key,
          label: value[0],
        })),
        roles: domain.roles,
      }));
    },

    previewCustomReport(input = {}, actor = null) {
      return previewCustomReportInternal(input, actor);
    },

    getSavedReportDefinitions(actor = null) {
      return db
        .prepare(`
          SELECT *
          FROM saved_report_definitions
          WHERE deleted_at IS NULL
            AND (visibility = 'Shared' OR created_by = @createdBy OR @isAdmin = 1)
          ORDER BY updated_at DESC, name COLLATE NOCASE
        `)
        .all({
          createdBy: actor?.name ?? "",
          isAdmin: ["Owner", "Admin"].includes(actor?.role) ? 1 : 0,
        })
        .map(savedReportDefinitionFromRow);
    },

    saveReportDefinition(input = {}, actor = null) {
      const domain = getCustomReportDomain(input.reportDomain);
      if (actor?.role && !domain.roles.includes(actor.role)) {
        throw new Error("You do not have permission to save this report domain.");
      }
      const visibility = normalizeNamedStatus(
        input.visibility,
        REPORT_VISIBILITIES,
        "Private",
        "Report visibility",
      );
      if (visibility === "Shared" && !["Owner", "Admin"].includes(actor?.role)) {
        throw new Error("Only Owner/Admin can create shared reports.");
      }
      previewCustomReportInternal(input, actor);
      const timestamp = now();
      const id = optionalText(input.id) || crypto.randomUUID();
      db.prepare(`
        INSERT INTO saved_report_definitions (
          id, name, report_domain, selected_columns, filters_json, sort_json,
          group_json, created_by, visibility, created_at, updated_at,
          deleted_at, sync_status
        ) VALUES (
          @id, @name, @reportDomain, @selectedColumns, @filtersJson, @sortJson,
          @groupJson, @createdBy, @visibility, @createdAt, @updatedAt,
          NULL, 'pending'
        )
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          report_domain = excluded.report_domain,
          selected_columns = excluded.selected_columns,
          filters_json = excluded.filters_json,
          sort_json = excluded.sort_json,
          group_json = excluded.group_json,
          visibility = excluded.visibility,
          updated_at = excluded.updated_at,
          sync_status = 'pending'
      `).run({
        id,
        name: requiredText(input.name, "Report name"),
        reportDomain: input.reportDomain,
        selectedColumns: JSON.stringify(input.selectedColumns ?? []),
        filtersJson: JSON.stringify(input.filters ?? {}),
        sortJson: JSON.stringify(input.sort ?? []),
        groupJson: JSON.stringify(input.group ?? []),
        createdBy: actor?.name ?? optionalText(input.createdBy),
        visibility,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      insertAuditLog(actor, "Saved report definition", "Reports", `Saved report "${input.name}".`);
      return savedReportDefinitionFromRow(
        db.prepare("SELECT * FROM saved_report_definitions WHERE id = ?").get(id),
      );
    },

    deleteReportDefinition(id, actor = null) {
      const timestamp = now();
      const result = db
        .prepare(`
          UPDATE saved_report_definitions
          SET deleted_at = ?, updated_at = ?, sync_status = 'pending'
          WHERE id = ? AND deleted_at IS NULL
        `)
        .run(timestamp, timestamp, requiredText(id, "Report definition id"));
      insertAuditLog(actor, "Deleted report definition", "Reports", "Soft-deleted a custom report definition.");
      return { success: result.changes === 1 };
    },

    getLiveClasses(filter = {}) {
      return db
        .prepare(`
          SELECT *
          FROM live_classes
          WHERE deleted_at IS NULL
            AND (@className = '' OR class_name = @className)
            AND (@section = '' OR COALESCE(section, '') = @section)
            AND (@status = '' OR status = @status)
          ORDER BY start_at DESC
        `)
        .all({
          className: optionalText(filter.className),
          section: optionalText(filter.section),
          status: optionalText(filter.status),
        })
        .map(liveClassFromRow);
    },

    getLiveClass(id) {
      const row = db
        .prepare("SELECT * FROM live_classes WHERE id = ? AND deleted_at IS NULL")
        .get(requiredText(id, "Live class id"));
      if (!row) return null;
      const attendance = db
        .prepare("SELECT * FROM live_class_attendance WHERE live_class_id = ? ORDER BY student_name")
        .all(row.id)
        .map(liveClassAttendanceFromRow);
      return liveClassFromRow(row, attendance);
    },

    createLiveClass(input = {}) {
      const startAt = normalizeDateTime(input.startAt, "Start time");
      const endAt = normalizeDateTime(input.endAt, "End time");
      if (endAt <= startAt) throw new Error("End time must be after start time.");
      const teacherId = optionalText(input.teacherEmployeeId);
      const teacher = teacherId
        ? db.prepare("SELECT * FROM employees WHERE id = ? AND deleted_at IS NULL").get(teacherId)
        : null;
      const subjectId = optionalText(input.subjectId);
      const subject = subjectId ? getActiveSubjectById.get(subjectId) : null;
      const timestamp = now();
      const id = crypto.randomUUID();
      db.prepare(`
        INSERT INTO live_classes (
          id, academic_session_id, class_name, section, subject_id, subject_name,
          teacher_employee_id, teacher_name, title, description, provider,
          meeting_url, meeting_id, start_at, end_at, status, recording_url,
          notes, created_by, created_at, updated_at, deleted_at, sync_status
        ) VALUES (
          @id, @academicSessionId, @className, @section, @subjectId, @subjectName,
          @teacherEmployeeId, @teacherName, @title, @description, @provider,
          @meetingUrl, @meetingId, @startAt, @endAt, @status, @recordingUrl,
          @notes, @createdBy, @createdAt, @updatedAt, NULL, 'pending'
        )
      `).run({
        id,
        academicSessionId: optionalText(input.academicSessionId),
        className: optionalText(input.className),
        section: optionalText(input.section),
        subjectId: subject?.id ?? "",
        subjectName: subject?.name ?? optionalText(input.subjectName),
        teacherEmployeeId: teacher?.id ?? "",
        teacherName: teacher?.name ?? optionalText(input.teacherName),
        title: requiredText(input.title, "Live class title"),
        description: optionalText(input.description),
        provider: optionalText(input.provider) || "Other",
        meetingUrl: validateMeetingUrl(input.meetingUrl),
        meetingId: optionalText(input.meetingId),
        startAt,
        endAt,
        status: normalizeNamedStatus(input.status, LIVE_CLASS_STATUSES, "Draft", "Live class"),
        recordingUrl: input.recordingUrl ? validateMeetingUrl(input.recordingUrl) : "",
        notes: optionalText(input.notes),
        createdBy: optionalText(input.createdBy),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      insertAuditLog(input.auditUser, "Live class created", "Live Class", `Created "${input.title}".`);
      return this.getLiveClass(id);
    },

    updateLiveClass(id, input = {}) {
      const existing = db
        .prepare("SELECT * FROM live_classes WHERE id = ? AND deleted_at IS NULL")
        .get(requiredText(id, "Live class id"));
      if (!existing) throw new Error("Live class was not found.");
      const next = {
        ...liveClassFromRow(existing),
        ...input,
      };
      const startAt =
        input.startAt === undefined ? existing.start_at : normalizeDateTime(input.startAt, "Start time");
      const endAt =
        input.endAt === undefined ? existing.end_at : normalizeDateTime(input.endAt, "End time");
      if (endAt <= startAt) throw new Error("End time must be after start time.");
      const timestamp = now();
      db.prepare(`
        UPDATE live_classes
        SET class_name = @className,
            section = @section,
            subject_id = @subjectId,
            subject_name = @subjectName,
            teacher_employee_id = @teacherEmployeeId,
            teacher_name = @teacherName,
            title = @title,
            description = @description,
            provider = @provider,
            meeting_url = @meetingUrl,
            meeting_id = @meetingId,
            start_at = @startAt,
            end_at = @endAt,
            status = @status,
            recording_url = @recordingUrl,
            notes = @notes,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id AND deleted_at IS NULL
      `).run({
        id: existing.id,
        className: optionalText(next.className),
        section: optionalText(next.section),
        subjectId: optionalText(next.subjectId),
        subjectName: optionalText(next.subjectName),
        teacherEmployeeId: optionalText(next.teacherEmployeeId),
        teacherName: optionalText(next.teacherName),
        title: requiredText(next.title, "Live class title"),
        description: optionalText(next.description),
        provider: optionalText(next.provider) || "Other",
        meetingUrl: validateMeetingUrl(next.meetingUrl),
        meetingId: optionalText(next.meetingId),
        startAt,
        endAt,
        status: normalizeNamedStatus(next.status, LIVE_CLASS_STATUSES, existing.status, "Live class"),
        recordingUrl: next.recordingUrl ? validateMeetingUrl(next.recordingUrl) : "",
        notes: optionalText(next.notes),
        updatedAt: timestamp,
      });
      insertAuditLog(input.auditUser, "Live class updated", "Live Class", `Updated "${next.title}".`);
      return this.getLiveClass(existing.id);
    },

    setLiveClassStatus(id, status, auditUser = null) {
      const nextStatus = normalizeNamedStatus(status, LIVE_CLASS_STATUSES, "Draft", "Live class");
      const timestamp = now();
      db.prepare(`
        UPDATE live_classes
        SET status = ?, updated_at = ?, sync_status = 'pending'
        WHERE id = ? AND deleted_at IS NULL
      `).run(nextStatus, timestamp, requiredText(id, "Live class id"));
      insertAuditLog(auditUser, `Live class ${nextStatus.toLowerCase()}`, "Live Class", `Status set to ${nextStatus}.`);
      return this.getLiveClass(id);
    },

    saveLiveClassAttendance(liveClassId, records = [], auditUser = null) {
      if (!Array.isArray(records)) throw new Error("Attendance records must be an array.");
      const liveClass = this.getLiveClass(liveClassId);
      if (!liveClass) throw new Error("Live class was not found.");
      const timestamp = now();
      db.transaction(() => {
        records.forEach((input) => {
          const student = getStudentRowRequired(input.studentId);
          db.prepare(`
            INSERT INTO live_class_attendance (
              id, live_class_id, student_id, student_name, joined_at, left_at,
              attendance_status, remarks, created_at, updated_at, sync_status
            ) VALUES (
              @id, @liveClassId, @studentId, @studentName, @joinedAt, @leftAt,
              @attendanceStatus, @remarks, @createdAt, @updatedAt, 'pending'
            )
            ON CONFLICT(id) DO UPDATE SET
              joined_at = excluded.joined_at,
              left_at = excluded.left_at,
              attendance_status = excluded.attendance_status,
              remarks = excluded.remarks,
              updated_at = excluded.updated_at,
              sync_status = 'pending'
          `).run({
            id: optionalText(input.id) || crypto.randomUUID(),
            liveClassId: liveClass.id,
            studentId: student.id,
            studentName: student.name,
            joinedAt: optionalText(input.joinedAt),
            leftAt: optionalText(input.leftAt),
            attendanceStatus: optionalText(input.attendanceStatus) || "Present",
            remarks: optionalText(input.remarks),
            createdAt: timestamp,
            updatedAt: timestamp,
          });
        });
      })();
      insertAuditLog(auditUser, "Live class attendance updated", "Live Class", `Updated ${records.length} attendance row(s).`);
      return this.getLiveClass(liveClass.id);
    },

    getStoreCategories() {
      return db
        .prepare("SELECT * FROM store_categories WHERE deleted_at IS NULL ORDER BY name COLLATE NOCASE")
        .all()
        .map(storeCategoryFromRow);
    },

    saveStoreCategory(input = {}) {
      const timestamp = now();
      const id = optionalText(input.id) || crypto.randomUUID();
      db.prepare(`
        INSERT INTO store_categories (
          id, name, description, status, created_at, updated_at, deleted_at, sync_status
        ) VALUES (
          @id, @name, @description, @status, @createdAt, @updatedAt, NULL, 'pending'
        )
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          description = excluded.description,
          status = excluded.status,
          updated_at = excluded.updated_at,
          sync_status = 'pending'
      `).run({
        id,
        name: requiredText(input.name, "Category name"),
        description: optionalText(input.description),
        status: masterStatus(input.status),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      return storeCategoryFromRow(db.prepare("SELECT * FROM store_categories WHERE id = ?").get(id));
    },

    getStoreTaxRates() {
      return db
        .prepare("SELECT * FROM store_tax_rates WHERE deleted_at IS NULL ORDER BY name COLLATE NOCASE")
        .all()
        .map(storeTaxRateFromRow);
    },

    saveStoreTaxRate(input = {}) {
      const timestamp = now();
      const id = optionalText(input.id) || crypto.randomUUID();
      db.prepare(`
        INSERT INTO store_tax_rates (
          id, name, rate, status, created_at, updated_at, deleted_at, sync_status
        ) VALUES (
          @id, @name, @rate, @status, @createdAt, @updatedAt, NULL, 'pending'
        )
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          rate = excluded.rate,
          status = excluded.status,
          updated_at = excluded.updated_at,
          sync_status = 'pending'
      `).run({
        id,
        name: requiredText(input.name, "Tax rate name"),
        rate: decimalNumber(input.rate ?? 0, "Tax rate", 0),
        status: masterStatus(input.status),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      return storeTaxRateFromRow(db.prepare("SELECT * FROM store_tax_rates WHERE id = ?").get(id));
    },

    getStoreProducts(filter = {}) {
      const query = `%${optionalText(filter.search)}%`;
      return db
        .prepare(`
          SELECT *
          FROM store_products
          WHERE deleted_at IS NULL
            AND (@search = '%%' OR name LIKE @search OR sku LIKE @search OR barcode LIKE @search)
          ORDER BY name COLLATE NOCASE
        `)
        .all({ search: query })
        .map(storeProductFromRow);
    },

    saveStoreProduct(input = {}) {
      const categoryId = optionalText(input.categoryId);
      const category = categoryId
        ? db.prepare("SELECT * FROM store_categories WHERE id = ? AND deleted_at IS NULL").get(categoryId)
        : null;
      const taxRateId = optionalText(input.taxRateId);
      const taxRate = taxRateId
        ? db.prepare("SELECT * FROM store_tax_rates WHERE id = ? AND deleted_at IS NULL").get(taxRateId)
        : null;
      const timestamp = now();
      const id = optionalText(input.id) || crypto.randomUUID();
      const sku = optionalText(input.sku);
      const barcode = optionalText(input.barcode);
      if (
        sku &&
        db
          .prepare(`
            SELECT id
            FROM store_products
            WHERE sku = ? AND id <> ? AND deleted_at IS NULL
          `)
          .get(sku, id)
      ) {
        throw new Error("Product SKU is already in use.");
      }
      if (
        barcode &&
        db
          .prepare(`
            SELECT id
            FROM store_products
            WHERE barcode = ? AND id <> ? AND deleted_at IS NULL
          `)
          .get(barcode, id)
      ) {
        throw new Error("Product barcode is already in use.");
      }
      db.prepare(`
        INSERT INTO store_products (
          id, category_id, category_name, tax_rate_id, tax_rate_name, tax_rate,
          sku, barcode, name, description, price, cost_price, current_stock,
          minimum_stock, status, image_path, created_at, updated_at,
          deleted_at, sync_status
        ) VALUES (
          @id, @categoryId, @categoryName, @taxRateId, @taxRateName, @taxRate,
          @sku, @barcode, @name, @description, @price, @costPrice, @currentStock,
          @minimumStock, @status, @imagePath, @createdAt, @updatedAt,
          NULL, 'pending'
        )
        ON CONFLICT(id) DO UPDATE SET
          category_id = excluded.category_id,
          category_name = excluded.category_name,
          tax_rate_id = excluded.tax_rate_id,
          tax_rate_name = excluded.tax_rate_name,
          tax_rate = excluded.tax_rate,
          sku = excluded.sku,
          barcode = excluded.barcode,
          name = excluded.name,
          description = excluded.description,
          price = excluded.price,
          cost_price = excluded.cost_price,
          minimum_stock = excluded.minimum_stock,
          status = excluded.status,
          image_path = excluded.image_path,
          updated_at = excluded.updated_at,
          sync_status = 'pending'
      `).run({
        id,
        categoryId: category?.id ?? "",
        categoryName: category?.name ?? optionalText(input.categoryName),
        taxRateId: taxRate?.id ?? "",
        taxRateName: taxRate?.name ?? "",
        taxRate: Number(taxRate?.rate ?? input.taxRate ?? 0),
        sku,
        barcode,
        name: requiredText(input.name, "Product name"),
        description: optionalText(input.description),
        price: normalizeMoney(input.price, "Price"),
        costPrice: normalizeMoney(input.costPrice, "Cost price"),
        currentStock: normalizeMoney(input.currentStock, "Current stock"),
        minimumStock: normalizeMoney(input.minimumStock, "Minimum stock"),
        status: masterStatus(input.status),
        imagePath: optionalText(input.imagePath),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      return storeProductFromRow(db.prepare("SELECT * FROM store_products WHERE id = ?").get(id));
    },

    createStoreInventoryTransaction(input = {}, actor = null) {
      const quantity = wholeNumber(input.quantity, "Quantity", 1);
      const type = requiredText(input.transactionType, "Transaction type");
      if (!INVENTORY_TRANSACTION_TYPES.has(type) || type === "Sale" || type === "Sale Reversal") {
        throw new Error("Use POS sale and reversal workflows for sale stock movements.");
      }
      const sign = ["Adjustment Decrease", "Damage"].includes(type) ? -1 : 1;
      applyStockChange(input.productId, sign * quantity, {
        transactionType: type,
        notes: input.notes,
        transactionDate: input.transactionDate,
        createdBy: actor?.name ?? "",
      });
      insertAuditLog(actor, "Store stock transaction", "Store", `${type} ${quantity} item(s).`);
      return this.getStoreProducts({}).find((product) => product.id === input.productId);
    },

    getStoreInventoryLedger(filter = {}) {
      return db
        .prepare(`
          SELECT tx.*, product.name AS product_name, product.sku
          FROM store_inventory_transactions tx
          JOIN store_products product ON product.id = tx.product_id
          WHERE (@productId = '' OR tx.product_id = @productId)
          ORDER BY tx.transaction_date DESC, tx.created_at DESC
        `)
        .all({ productId: optionalText(filter.productId) })
        .map(storeInventoryTransactionFromRow);
    },

    getStoreOrders(filter = {}) {
      const rows = db
        .prepare(`
          SELECT *
          FROM store_orders
          WHERE (@status = '' OR status = @status)
          ORDER BY order_date DESC, created_at DESC
        `)
        .all({ status: optionalText(filter.status) });
      return rows.map((row) => getStoreOrderInternal(row.id));
    },

    createStoreOrder(input = {}, actor = null) {
      const items = Array.isArray(input.items) ? input.items : [];
      const payments = Array.isArray(input.payments) ? input.payments : [];
      if (items.length === 0) throw new Error("Add at least one product to the sale.");
      const status = normalizeNamedStatus(input.status, STORE_ORDER_STATUSES, "Completed", "Store order");
      const session =
        status === "Completed"
          ? requireOpenStorePosSession(input.posSessionId, actor)
          : null;
      let createdId = "";
      db.transaction(() => {
        const timestamp = now();
        const normalizedItems = items.map((item) => {
          const product = db
            .prepare("SELECT * FROM store_products WHERE id = ? AND deleted_at IS NULL")
            .get(requiredText(item.productId, "Product"));
          if (!product || product.status !== "Active") {
            throw new Error("Select an active product.");
          }
          const quantity = wholeNumber(item.quantity, "Quantity", 1);
          const unitPrice = normalizeMoney(item.unitPrice ?? product.price, "Unit price");
          const discountAmount = normalizeMoney(item.discountAmount ?? 0, "Item discount");
          const gross = quantity * unitPrice;
          if (discountAmount > gross) throw new Error("Item discount cannot exceed line amount.");
          const taxRate = Number(product.tax_rate ?? 0);
          const taxable = gross - discountAmount;
          const taxAmount = Math.round((taxable * taxRate) / 100);
          return {
            product,
            quantity,
            unitPrice,
            discountAmount,
            taxRate,
            taxAmount,
            lineTotal: taxable + taxAmount,
          };
        });
        const subtotal = normalizedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        const itemDiscount = normalizedItems.reduce((sum, item) => sum + item.discountAmount, 0);
        const discountAmount = itemDiscount + normalizeMoney(input.discountAmount ?? 0, "Overall discount");
        const taxAmount = normalizedItems.reduce((sum, item) => sum + item.taxAmount, 0);
        const grandTotal = subtotal - discountAmount + taxAmount;
        if (grandTotal < 0) throw new Error("Order total cannot be negative.");
        const { normalizedPayments, paidAmount } = validateStorePaymentTotals(
          status,
          payments,
          grandTotal,
        );
        const id = crypto.randomUUID();
        createdId = id;
        db.prepare(`
          INSERT INTO store_orders (
            id, order_no, pos_session_id, customer_id, student_id, customer_name,
            order_date, subtotal, discount_amount, tax_amount, grand_total,
            paid_amount, balance_amount, status, notes, created_by, created_at,
            updated_at, held_at, sync_status
          ) VALUES (
            @id, @orderNo, @posSessionId, @customerId, @studentId, @customerName,
            @orderDate, @subtotal, @discountAmount, @taxAmount, @grandTotal,
            @paidAmount, @balanceAmount, @status, @notes, @createdBy, @createdAt,
            @updatedAt, @heldAt, 'pending'
          )
        `).run({
          id,
          orderNo: nextNumber("POS", "store_orders", "order_no"),
          posSessionId: session?.id ?? optionalText(input.posSessionId),
          customerId: optionalText(input.customerId),
          studentId: optionalText(input.studentId),
          customerName: optionalText(input.customerName) || "Walk-in Customer",
          orderDate: normalizeDate(input.orderDate ?? now().slice(0, 10), "Order date"),
          subtotal,
          discountAmount,
          taxAmount,
          grandTotal,
          paidAmount,
          balanceAmount: grandTotal - paidAmount,
          status,
          notes: optionalText(input.notes),
          createdBy: actor?.name ?? "",
          createdAt: timestamp,
          updatedAt: timestamp,
          heldAt: status === "Held" ? timestamp : null,
        });
        const insertItem = db.prepare(`
          INSERT INTO store_order_items (
            id, order_id, product_id, variant_id, sku, product_name, quantity,
            unit_price, discount_amount, tax_rate, tax_amount, line_total,
            created_at, sync_status
          ) VALUES (
            @id, @orderId, @productId, '', @sku, @productName, @quantity,
            @unitPrice, @discountAmount, @taxRate, @taxAmount, @lineTotal,
            @createdAt, 'pending'
          )
        `);
        normalizedItems.forEach((item) => {
          insertItem.run({
            id: crypto.randomUUID(),
            orderId: id,
            productId: item.product.id,
            sku: item.product.sku ?? "",
            productName: item.product.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountAmount: item.discountAmount,
            taxRate: item.taxRate,
            taxAmount: item.taxAmount,
            lineTotal: item.lineTotal,
            createdAt: timestamp,
          });
          if (status === "Completed") {
            applyStockChange(item.product.id, -item.quantity, {
              transactionType: "Sale",
              referenceType: "Store Order",
              referenceId: id,
              transactionDate: input.orderDate ?? now().slice(0, 10),
              createdBy: actor?.name ?? "",
            });
          }
        });
        const insertPayment = db.prepare(`
          INSERT INTO store_payments (
            id, order_id, payment_mode, amount, reference_no, payment_date,
            created_at, sync_status
          ) VALUES (
            @id, @orderId, @paymentMode, @amount, @referenceNo, @paymentDate,
            @createdAt, 'pending'
          )
        `);
        normalizedPayments.forEach((payment) => {
          insertPayment.run({
            id: crypto.randomUUID(),
            orderId: id,
            paymentMode: payment.paymentMode,
            amount: payment.amount,
            referenceNo: optionalText(payment.referenceNo),
            paymentDate: payment.paymentDate,
            createdAt: timestamp,
          });
        });
        if (status === "Completed") {
          const accounting = postStoreOrderAccountingInternal(id, actor);
          insertAuditLog(
            actor,
            "POS accounting entry posted",
            "Store",
            `Posted ${accounting.postedCount} account transaction(s) for sale ${id}.`,
          );
        }
      })();
      insertAuditLog(
        actor,
        status === "Held" ? "Held order created" : "POS sale completed",
        "Store",
        `${status === "Held" ? "Held order" : "Created sale"} ${createdId}.`,
      );
      return getStoreOrderInternal(createdId);
    },

    reverseStoreOrder(id, reason, actor = null) {
      const order = getStoreOrderInternal(id);
      if (!order) throw new Error("Store order was not found.");
      if (order.status !== "Completed") {
        throw new Error("Only completed sales can be reversed.");
      }
      if (order.reversedAt) {
        throw new Error("This sale has already been reversed.");
      }
      const reversalReason = requiredText(reason, "Reversal reason");
      const timestamp = now();
      db.transaction(() => {
        order.items.forEach((item) => {
          applyStockChange(item.productId, item.quantity, {
            transactionType: "Sale Reversal",
            referenceType: "Store Order",
            referenceId: order.id,
            notes: reversalReason,
            transactionDate: timestamp.slice(0, 10),
            createdBy: actor?.name ?? "",
          });
        });
        db.prepare(`
          UPDATE store_orders
          SET status = 'Reversed',
              reversed_at = @reversedAt,
              reversed_by = @reversedBy,
              reversal_reason = @reason,
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE id = @id AND status = 'Completed' AND reversed_at IS NULL
        `).run({
          id: order.id,
          reversedAt: timestamp,
          reversedBy: actor?.name ?? "",
          reason: reversalReason,
            updatedAt: timestamp,
        });
        const accounting = postStoreOrderReversalAccountingInternal(order.id, actor);
        insertAuditLog(
          actor,
          "POS accounting reversal posted",
          "Store",
          `Posted ${accounting.postedCount} reversing account transaction(s) for ${order.orderNo}.`,
        );
      })();
      insertAuditLog(actor, "POS sale reversed", "Store", `Reversed ${order.orderNo}.`);
      return getStoreOrderInternal(order.id);
    },

    getStoreAccountMappings() {
      ensureStorePosAccountMappingDefaults();
      return db
        .prepare(`
          SELECT *
          FROM store_pos_account_mappings
          WHERE deleted_at IS NULL
          ORDER BY
            CASE mapping_key
              WHEN 'sales_income' THEN 1
              WHEN 'cash_income' THEN 2
              WHEN 'upi_income' THEN 3
              WHEN 'card_income' THEN 4
              WHEN 'reversal_expense' THEN 5
              ELSE 99
            END
        `)
        .all()
        .map(storePosAccountMappingFromRow);
    },

    saveStoreAccountMapping(input = {}, actor = null) {
      const mappingKey = requiredText(input.mappingKey, "Mapping");
      const config = STORE_POS_ACCOUNT_MAPPINGS[mappingKey];
      if (!config) throw new Error("Store/POS account mapping is invalid.");
      const categoryId = requiredText(input.accountCategoryId, "Account category");
      const category = db
        .prepare(`
          SELECT *
          FROM account_categories
          WHERE id = ?
            AND type = ?
            AND status = 'Active'
            AND deleted_at IS NULL
        `)
        .get(categoryId, config.accountType);
      if (!category) {
        throw new Error(`Select an active ${config.accountType.toLowerCase()} category.`);
      }
      const timestamp = now();
      const existing = db
        .prepare("SELECT id FROM store_pos_account_mappings WHERE mapping_key = ?")
        .get(mappingKey);
      const id = existing?.id ?? crypto.randomUUID();
      db.prepare(`
        INSERT INTO store_pos_account_mappings (
          id, mapping_key, label, account_category_id, account_category_name,
          account_type, status, created_at, updated_at, deleted_at, sync_status
        ) VALUES (
          @id, @mappingKey, @label, @accountCategoryId, @accountCategoryName,
          @accountType, @status, @createdAt, @updatedAt, NULL, 'pending'
        )
        ON CONFLICT(mapping_key) DO UPDATE SET
          label = excluded.label,
          account_category_id = excluded.account_category_id,
          account_category_name = excluded.account_category_name,
          account_type = excluded.account_type,
          status = excluded.status,
          updated_at = excluded.updated_at,
          deleted_at = NULL,
          sync_status = 'pending'
      `).run({
        id,
        mappingKey,
        label: config.label,
        accountCategoryId: category.id,
        accountCategoryName: category.name,
        accountType: config.accountType,
        status: masterStatus(input.status),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      insertAuditLog(
        actor,
        "POS account mapping changed",
        "Store",
        `Updated ${config.label}.`,
      );
      return this.getStoreAccountMappings().find(
        (mapping) => mapping.mappingKey === mappingKey,
      );
    },

    openStorePosSession(input = {}, actor = null) {
      const actorId = requiredText(actor?.id, "Cashier user");
      const duplicate = db
        .prepare(`
          SELECT id
          FROM store_pos_sessions
          WHERE cashier_user_id = ?
            AND status = 'Open'
          LIMIT 1
        `)
        .get(actorId);
      if (duplicate) {
        throw new Error("This cashier already has an open POS session.");
      }
      const timestamp = now();
      const id = crypto.randomUUID();
      db.prepare(`
        INSERT INTO store_pos_sessions (
          id, session_no, cashier_user_id, username, display_name, cashier_name,
          opened_at, opening_cash, closing_cash, expected_cash, counted_cash,
          cash_variance, status, notes, created_at, updated_at, sync_status
        ) VALUES (
          @id, @sessionNo, @cashierUserId, @username, @displayName, @cashierName,
          @openedAt, @openingCash, 0, 0, 0, 0, 'Open', @notes,
          @createdAt, @updatedAt, 'pending'
        )
      `).run({
        id,
        sessionNo: nextNumber("CS", "store_pos_sessions", "session_no"),
        cashierUserId: actorId,
        username: optionalText(actor?.username),
        displayName: optionalText(actor?.name),
        cashierName: optionalText(actor?.name),
        openedAt: timestamp,
        openingCash: normalizeMoney(input.openingCash ?? 0, "Opening cash"),
        notes: optionalText(input.notes),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      insertAuditLog(actor, "Cashier session opened", "Store", `Opened session ${id}.`);
      return this.getStorePosSessionSummary(id);
    },

    getCurrentStorePosSession(actor = null) {
      const actorId = optionalText(actor?.id);
      if (!actorId) return null;
      const row = db
        .prepare(`
          SELECT *
          FROM store_pos_sessions
          WHERE cashier_user_id = ?
            AND status = 'Open'
          ORDER BY opened_at DESC
          LIMIT 1
        `)
        .get(actorId);
      return row ? this.getStorePosSessionSummary(row.id) : null;
    },

    getStorePosSessions(filter = {}, actor = null) {
      const status = optionalText(filter.status);
      if (status && !["Open", "Closed"].includes(status)) {
        throw new Error("Cashier session status is invalid.");
      }
      const userId =
        !["Owner", "Admin"].includes(actor?.role) && actor?.id
          ? actor.id
          : optionalText(filter.userId);
      return db
        .prepare(`
          SELECT *
          FROM store_pos_sessions
          WHERE (@status = '' OR status = @status)
            AND (@userId = '' OR cashier_user_id = @userId)
          ORDER BY opened_at DESC
        `)
        .all({ status, userId: optionalText(userId) })
        .map((row) => this.getStorePosSessionSummary(row.id));
    },

    getStorePosSessionSummary(id) {
      return summarizeStorePosSession(id);
    },

    closeStorePosSession(id, input = {}, actor = null) {
      const session = db
        .prepare("SELECT * FROM store_pos_sessions WHERE id = ?")
        .get(requiredText(id, "Cashier session id"));
      if (!session) throw new Error("Cashier session was not found.");
      if (session.status !== "Open") {
        throw new Error("Closed cashier sessions cannot be changed.");
      }
      if (
        session.cashier_user_id !== actor?.id &&
        !["Owner", "Admin"].includes(actor?.role)
      ) {
        throw new Error("You can close only your own cashier session.");
      }
      const summary = summarizeStorePosSession(session.id);
      const countedCash = normalizeMoney(input.countedCash ?? 0, "Counted cash");
      const timestamp = now();
      db.prepare(`
        UPDATE store_pos_sessions
        SET closed_at = @closedAt,
            closing_cash = @countedCash,
            expected_cash = @expectedCash,
            counted_cash = @countedCash,
            cash_variance = @cashVariance,
            status = 'Closed',
            notes = @notes,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id AND status = 'Open'
      `).run({
        id: session.id,
        closedAt: timestamp,
        countedCash,
        expectedCash: summary.expectedCash,
        cashVariance: countedCash - summary.expectedCash,
        notes: optionalText(input.notes),
        updatedAt: timestamp,
      });
      insertAuditLog(
        actor,
        "Cashier session closed",
        "Store",
        `Closed session ${session.session_no}.`,
      );
      return this.getStorePosSessionSummary(session.id);
    },

    resumeHeldStoreOrder(id, input = {}, actor = null) {
      const existing = getStoreOrderInternal(id);
      if (!existing) throw new Error("Held order was not found.");
      if (!["Held", "Draft"].includes(existing.status)) {
        throw new Error("Only held POS orders can be resumed.");
      }
      const items = Array.isArray(input.items) && input.items.length > 0
        ? input.items
        : existing.items;
      const payments = Array.isArray(input.payments) ? input.payments : [];
      const session = requireOpenStorePosSession(input.posSessionId, actor);
      let completedOrder = null;
      db.transaction(() => {
        const timestamp = now();
        const normalizedItems = items.map((item) => {
          const product = db
            .prepare("SELECT * FROM store_products WHERE id = ? AND deleted_at IS NULL")
            .get(requiredText(item.productId, "Product"));
          if (!product || product.status !== "Active") {
            throw new Error("Select an active product.");
          }
          const quantity = wholeNumber(item.quantity, "Quantity", 1);
          const unitPrice = normalizeMoney(item.unitPrice ?? product.price, "Unit price");
          const discountAmount = normalizeMoney(item.discountAmount ?? 0, "Item discount");
          const gross = quantity * unitPrice;
          if (discountAmount > gross) throw new Error("Item discount cannot exceed line amount.");
          const taxRate = Number(product.tax_rate ?? 0);
          const taxable = gross - discountAmount;
          const taxAmount = Math.round((taxable * taxRate) / 100);
          return {
            product,
            quantity,
            unitPrice,
            discountAmount,
            taxRate,
            taxAmount,
            lineTotal: taxable + taxAmount,
          };
        });
        const subtotal = normalizedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        const itemDiscount = normalizedItems.reduce((sum, item) => sum + item.discountAmount, 0);
        const previousOverallDiscount = Math.max(
          0,
          Number(existing.discountAmount ?? 0) - itemDiscount,
        );
        const discountAmount =
          itemDiscount +
          normalizeMoney(
            input.discountAmount ?? previousOverallDiscount,
            "Overall discount",
          );
        const taxAmount = normalizedItems.reduce((sum, item) => sum + item.taxAmount, 0);
        const grandTotal = subtotal - discountAmount + taxAmount;
        if (grandTotal < 0) throw new Error("Order total cannot be negative.");
        const { normalizedPayments, paidAmount } = validateStorePaymentTotals(
          "Completed",
          payments,
          grandTotal,
        );
        db.prepare("DELETE FROM store_order_items WHERE order_id = ?").run(existing.id);
        db.prepare("DELETE FROM store_payments WHERE order_id = ?").run(existing.id);
        db.prepare(`
          UPDATE store_orders
          SET pos_session_id = @posSessionId,
              customer_id = @customerId,
              student_id = @studentId,
              customer_name = @customerName,
              order_date = @orderDate,
              subtotal = @subtotal,
              discount_amount = @discountAmount,
              tax_amount = @taxAmount,
              grand_total = @grandTotal,
              paid_amount = @paidAmount,
              balance_amount = @balanceAmount,
              status = 'Completed',
              notes = @notes,
              updated_at = @updatedAt,
              sync_status = 'pending'
          WHERE id = @id AND status IN ('Held', 'Draft')
        `).run({
          id: existing.id,
          posSessionId: session.id,
          customerId: optionalText(input.customerId) || existing.customerId,
          studentId: optionalText(input.studentId) || existing.studentId,
          customerName: optionalText(input.customerName) || existing.customerName || "Walk-in Customer",
          orderDate: normalizeDate(input.orderDate ?? now().slice(0, 10), "Order date"),
          subtotal,
          discountAmount,
          taxAmount,
          grandTotal,
          paidAmount,
          balanceAmount: grandTotal - paidAmount,
          notes: optionalText(input.notes) || existing.notes,
          updatedAt: timestamp,
        });
        const insertItem = db.prepare(`
          INSERT INTO store_order_items (
            id, order_id, product_id, variant_id, sku, product_name, quantity,
            unit_price, discount_amount, tax_rate, tax_amount, line_total,
            created_at, sync_status
          ) VALUES (
            @id, @orderId, @productId, '', @sku, @productName, @quantity,
            @unitPrice, @discountAmount, @taxRate, @taxAmount, @lineTotal,
            @createdAt, 'pending'
          )
        `);
        normalizedItems.forEach((item) => {
          insertItem.run({
            id: crypto.randomUUID(),
            orderId: existing.id,
            productId: item.product.id,
            sku: item.product.sku ?? "",
            productName: item.product.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountAmount: item.discountAmount,
            taxRate: item.taxRate,
            taxAmount: item.taxAmount,
            lineTotal: item.lineTotal,
            createdAt: timestamp,
          });
          applyStockChange(item.product.id, -item.quantity, {
            transactionType: "Sale",
            referenceType: "Store Order",
            referenceId: existing.id,
            transactionDate: input.orderDate ?? now().slice(0, 10),
            createdBy: actor?.name ?? "",
          });
        });
        const insertPayment = db.prepare(`
          INSERT INTO store_payments (
            id, order_id, payment_mode, amount, reference_no, payment_date,
            created_at, sync_status
          ) VALUES (
            @id, @orderId, @paymentMode, @amount, @referenceNo, @paymentDate,
            @createdAt, 'pending'
          )
        `);
        normalizedPayments.forEach((payment) => {
          insertPayment.run({
            id: crypto.randomUUID(),
            orderId: existing.id,
            paymentMode: payment.paymentMode,
            amount: payment.amount,
            referenceNo: optionalText(payment.referenceNo),
            paymentDate: payment.paymentDate,
            createdAt: timestamp,
          });
        });
        completedOrder = getStoreOrderInternal(existing.id);
        const accounting = postStoreOrderAccountingInternal(existing.id, actor);
        insertAuditLog(
          actor,
          "Held order resumed",
          "Store",
          `Resumed held order ${existing.orderNo}.`,
        );
        insertAuditLog(
          actor,
          "POS accounting entry posted",
          "Store",
          `Posted ${accounting.postedCount} account transaction(s) for resumed sale ${existing.orderNo}.`,
        );
      })();
      return completedOrder ?? getStoreOrderInternal(existing.id);
    },

    cancelHeldStoreOrder(id, reason, actor = null) {
      const order = getStoreOrderInternal(id);
      if (!order) throw new Error("Held order was not found.");
      if (!["Held", "Draft"].includes(order.status)) {
        throw new Error("Only held POS orders can be cancelled.");
      }
      const cancellationReason = requiredText(reason, "Cancellation reason");
      const timestamp = now();
      db.prepare(`
        UPDATE store_orders
        SET status = 'Cancelled',
            cancelled_at = @cancelledAt,
            cancelled_by = @cancelledBy,
            cancellation_reason = @reason,
            updated_at = @updatedAt,
            sync_status = 'pending'
        WHERE id = @id AND status IN ('Held', 'Draft')
      `).run({
        id: order.id,
        cancelledAt: timestamp,
        cancelledBy: actor?.name ?? "",
        reason: cancellationReason,
        updatedAt: timestamp,
      });
      insertAuditLog(actor, "Held order cancelled", "Store", `Cancelled ${order.orderNo}.`);
      return getStoreOrderInternal(order.id);
    },

    postStoreOrderAccounting(id, actor = null) {
      const result = postStoreOrderAccountingInternal(id, actor);
      insertAuditLog(
        actor,
        "POS accounting entry posted",
        "Store",
        `Posted ${result.postedCount} account transaction(s) for POS order ${id}.`,
      );
      return result;
    },

    getStoreReports(filter = {}) {
      const startDate = normalizeOptionalDate(filter.startDate, "Start date") || "0000-01-01";
      const endDate = normalizeOptionalDate(filter.endDate, "End date") || "9999-12-31";
      const orders = db
        .prepare(`
          SELECT *
          FROM store_orders
          WHERE order_date BETWEEN ? AND ?
            AND status = 'Completed'
          ORDER BY order_date DESC
        `)
        .all(startDate, endDate)
        .map((row) => getStoreOrderInternal(row.id));
      const productRows = db
        .prepare(`
          SELECT item.product_id, item.product_name,
                 SUM(item.quantity) AS quantity,
                 SUM(item.line_total) AS amount
          FROM store_order_items item
          JOIN store_orders orders ON orders.id = item.order_id
          WHERE orders.order_date BETWEEN ? AND ?
            AND orders.status = 'Completed'
          GROUP BY item.product_id, item.product_name
          ORDER BY amount DESC
        `)
        .all(startDate, endDate);
      const lowStock = this.getStoreProducts({}).filter(
        (product) => product.currentStock <= product.minimumStock,
      );
      return {
        dailySales: orders,
        productSales: productRows.map((row) => ({
          productId: row.product_id,
          productName: row.product_name,
          quantity: Number(row.quantity ?? 0),
          amount: Number(row.amount ?? 0),
        })),
        paymentSummary: paymentsSummaryForOrders(orders),
        lowStock,
        stockValuation: this.getStoreProducts({}).reduce(
          (total, product) => total + product.currentStock * product.costPrice,
          0,
        ),
      };
    },

    createAuditLog(user, action, module, details = "") {
      return insertAuditLog(user, action, module, details);
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

    getDatabaseUserVersion() {
      return Number(db.pragma("user_version", { simple: true }) ?? 0);
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
