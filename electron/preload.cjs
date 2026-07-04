const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("erpApi", {
  getDeviceId: () => ipcRenderer.invoke("license:get-device-id"),
  getLicenseStatus: () => ipcRenderer.invoke("license:get-status"),
  activateLicense: (licenseKey) =>
    ipcRenderer.invoke("license:activate", licenseKey),
  deactivateLicense: () => ipcRenderer.invoke("license:deactivate"),
  getLicenseInfo: () => ipcRenderer.invoke("license:get-info"),

  hasUsers: () => ipcRenderer.invoke("auth:has-users"),
  createFirstOwner: (input) =>
    ipcRenderer.invoke("auth:create-first-owner", input),
  login: (username, password) =>
    ipcRenderer.invoke("auth:login", username, password),
  logout: () => ipcRenderer.invoke("auth:logout"),
  getCurrentUser: () => ipcRenderer.invoke("auth:get-current-user"),
  changePassword: (userId, oldPassword, newPassword) =>
    ipcRenderer.invoke(
      "auth:change-password",
      userId,
      oldPassword,
      newPassword,
    ),

  getUsers: () => ipcRenderer.invoke("users:get-all"),
  createUser: (input) => ipcRenderer.invoke("users:create", input),
  updateUser: (id, input) => ipcRenderer.invoke("users:update", id, input),
  resetUserPassword: (id, newPassword) =>
    ipcRenderer.invoke("users:reset-password", id, newPassword),
  deleteUser: (id) => ipcRenderer.invoke("users:delete", id),
  getAuditLogs: (limit) => ipcRenderer.invoke("audit:get", limit),
  createDemoData: () => ipcRenderer.invoke("demo:create-data"),

  getStudents: () => ipcRenderer.invoke("students:get-all"),
  createStudent: (student) => ipcRenderer.invoke("students:create", student),
  updateStudent: (id, student) =>
    ipcRenderer.invoke("students:update", id, student),
  deleteStudent: (id) => ipcRenderer.invoke("students:delete", id),
  importStudentsBulk: (rows, options) =>
    ipcRenderer.invoke("students:import-bulk", rows, options),
  getStudentImportTemplate: () =>
    ipcRenderer.invoke("students:import-template"),

  getEmployees: () => ipcRenderer.invoke("employees:get-all"),
  getEmployeeById: (id) => ipcRenderer.invoke("employees:get-by-id", id),
  createEmployee: (input) => ipcRenderer.invoke("employees:create", input),
  updateEmployee: (id, input) =>
    ipcRenderer.invoke("employees:update", id, input),
  deleteEmployee: (id) => ipcRenderer.invoke("employees:delete", id),

  getSalaryPayments: () => ipcRenderer.invoke("salary:get-all"),
  getSalaryPaymentsByDateRange: (startDate, endDate) =>
    ipcRenderer.invoke("salary:get-by-date-range", startDate, endDate),
  getSalaryPaymentsByEmployee: (employeeId) =>
    ipcRenderer.invoke("salary:get-by-employee", employeeId),
  createSalaryPayment: (input) =>
    ipcRenderer.invoke("salary:create", input),
  updateSalaryPayment: (id, input) =>
    ipcRenderer.invoke("salary:update", id, input),
  deleteSalaryPayment: (id) =>
    ipcRenderer.invoke("salary:delete", id),

  getAccountCategories: () =>
    ipcRenderer.invoke("accounts:categories:get-all"),
  createAccountCategory: (input) =>
    ipcRenderer.invoke("accounts:categories:create", input),
  updateAccountCategory: (id, input) =>
    ipcRenderer.invoke("accounts:categories:update", id, input),
  deleteAccountCategory: (id) =>
    ipcRenderer.invoke("accounts:categories:delete", id),
  getAccountTransactions: () =>
    ipcRenderer.invoke("accounts:transactions:get-all"),
  getAccountTransactionsByDateRange: (startDate, endDate) =>
    ipcRenderer.invoke(
      "accounts:transactions:get-by-date-range",
      startDate,
      endDate,
    ),
  createAccountTransaction: (input) =>
    ipcRenderer.invoke("accounts:transactions:create", input),
  updateAccountTransaction: (id, input) =>
    ipcRenderer.invoke("accounts:transactions:update", id, input),
  deleteAccountTransaction: (id) =>
    ipcRenderer.invoke("accounts:transactions:delete", id),

  getSchoolSettings: () => ipcRenderer.invoke("settings:get"),
  saveSchoolSettings: (settings) =>
    ipcRenderer.invoke("settings:save", settings),

  getFeePayments: () => ipcRenderer.invoke("fees:get-all"),
  getFeePaymentsByDateRange: (startDate, endDate) =>
    ipcRenderer.invoke("fees:get-by-date-range", startDate, endDate),
  createFeePayment: (payment) => ipcRenderer.invoke("fees:create", payment),

  getAttendance: () => ipcRenderer.invoke("attendance:getAll"),
  getAttendanceByDate: (date) =>
    ipcRenderer.invoke("attendance:getByDate", date),
  getAttendanceByClassDate: (className, section, date) =>
    ipcRenderer.invoke(
      "attendance:getByClassDate",
      className,
      section,
      date,
    ),
  getAttendanceByDateRange: (startDate, endDate) =>
    ipcRenderer.invoke("attendance:getByDateRange", startDate, endDate),
  getAttendanceSummary: (startDate, endDate) =>
    ipcRenderer.invoke("attendance:getSummary", startDate, endDate),
  saveAttendance: (record) => ipcRenderer.invoke("attendance:save", record),
  saveAttendanceBulk: (records) =>
    ipcRenderer.invoke("attendance:saveBulk", records),
  updateAttendance: (id, input) =>
    ipcRenderer.invoke("attendance:update", id, input),

  getClasses: () => ipcRenderer.invoke("classes:get-all"),
  createClass: (input) => ipcRenderer.invoke("classes:create", input),
  updateClass: (id, input) => ipcRenderer.invoke("classes:update", id, input),
  deleteClass: (id) => ipcRenderer.invoke("classes:delete", id),

  getSections: () => ipcRenderer.invoke("sections:get-all"),
  createSection: (input) => ipcRenderer.invoke("sections:create", input),
  updateSection: (id, input) =>
    ipcRenderer.invoke("sections:update", id, input),
  deleteSection: (id) => ipcRenderer.invoke("sections:delete", id),

  getFeeHeads: () => ipcRenderer.invoke("fee-heads:get-all"),
  createFeeHead: (input) => ipcRenderer.invoke("fee-heads:create", input),
  updateFeeHead: (id, input) =>
    ipcRenderer.invoke("fee-heads:update", id, input),
  deleteFeeHead: (id) => ipcRenderer.invoke("fee-heads:delete", id),

  getFeeStructures: () => ipcRenderer.invoke("fee-structures:get-all"),
  createFeeStructure: (input) =>
    ipcRenderer.invoke("fee-structures:create", input),
  updateFeeStructure: (id, input) =>
    ipcRenderer.invoke("fee-structures:update", id, input),
  deleteFeeStructure: (id) =>
    ipcRenderer.invoke("fee-structures:delete", id),

  getSubjects: () => ipcRenderer.invoke("subjects:get-all"),
  createSubject: (input) => ipcRenderer.invoke("subjects:create", input),
  updateSubject: (id, input) =>
    ipcRenderer.invoke("subjects:update", id, input),
  deleteSubject: (id) => ipcRenderer.invoke("subjects:delete", id),

  getExams: () => ipcRenderer.invoke("exams:get-all"),
  createExam: (input) => ipcRenderer.invoke("exams:create", input),
  updateExam: (id, input) => ipcRenderer.invoke("exams:update", id, input),
  deleteExam: (id) => ipcRenderer.invoke("exams:delete", id),

  getMarks: () => ipcRenderer.invoke("marks:get-all"),
  getMarksByExam: (examId) =>
    ipcRenderer.invoke("marks:get-by-exam", examId),
  getMarksByStudentExam: (studentId, examId) =>
    ipcRenderer.invoke("marks:get-by-student-exam", studentId, examId),
  saveMarksBulk: (records) =>
    ipcRenderer.invoke("marks:save-bulk", records),
  updateMark: (id, input) => ipcRenderer.invoke("marks:update", id, input),

  getCertificateTemplates: () =>
    ipcRenderer.invoke("certificates:templates:get-all"),
  createCertificateTemplate: (input) =>
    ipcRenderer.invoke("certificates:templates:create", input),
  updateCertificateTemplate: (id, input) =>
    ipcRenderer.invoke("certificates:templates:update", id, input),
  deleteCertificateTemplate: (id) =>
    ipcRenderer.invoke("certificates:templates:delete", id),
  issueCertificate: (input) =>
    ipcRenderer.invoke("certificates:issue", input),
  getIssuedCertificates: () =>
    ipcRenderer.invoke("certificates:get-issued"),
  getIssuedCertificatesByStudent: (studentId) =>
    ipcRenderer.invoke("certificates:get-issued-by-student", studentId),

  createDatabaseBackup: () =>
    ipcRenderer.invoke("database:create-backup"),
  restoreDatabaseBackup: () =>
    ipcRenderer.invoke("database:restore-backup"),
  getDatabaseInfo: () => ipcRenderer.invoke("database:get-info"),
  openDatabaseFolder: () => ipcRenderer.invoke("database:open-folder"),
  restartApp: () => ipcRenderer.invoke("app:restart"),
});
