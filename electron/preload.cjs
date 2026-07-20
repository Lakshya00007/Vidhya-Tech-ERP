const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("erpApi", {
  getDeviceId: () => ipcRenderer.invoke("license:get-device-id"),
  getLicenseStatus: () => ipcRenderer.invoke("license:get-status"),
  activateLicense: (licenseKey) =>
    ipcRenderer.invoke("license:activate", licenseKey),
  updateLicenseKey: (licenseKey) =>
    ipcRenderer.invoke("license:update-key", licenseKey),
  deactivateLicense: () => ipcRenderer.invoke("license:deactivate"),
  getLicenseInfo: () => ipcRenderer.invoke("license:get-info"),
  checkRemoteLicenseNow: () =>
    ipcRenderer.invoke("license:check-remote-now"),
  getRemoteLicenseStatus: () =>
    ipcRenderer.invoke("license:get-remote-status"),

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
  changeTemporaryPassword: (input) =>
    ipcRenderer.invoke("auth:change-temporary-password", input),
  getCurrentAccountProfile: () => ipcRenderer.invoke("account:get-profile"),
  updateCurrentAccountProfile: (input) =>
    ipcRenderer.invoke("account:update-profile", input),
  changeCurrentPassword: (input) =>
    ipcRenderer.invoke("account:change-password", input),
  getCurrentLoginHistory: (filter) =>
    ipcRenderer.invoke("account:login-history", filter),
  getCurrentUserEntityLink: () => ipcRenderer.invoke("account:entity-link"),
  getCurrentStudentPortalData: () => ipcRenderer.invoke("portal:student-data"),
  getCurrentEmployeePortalData: () =>
    ipcRenderer.invoke("portal:employee-data"),

  getUsers: () => ipcRenderer.invoke("users:get-all"),
  createUser: (input) => ipcRenderer.invoke("users:create", input),
  updateUser: (id, input) => ipcRenderer.invoke("users:update", id, input),
  resetUserPassword: (id, newPassword) =>
    ipcRenderer.invoke("users:reset-password", id, newPassword),
  deleteUser: (id) => ipcRenderer.invoke("users:delete", id),
  getAuditLogs: (limit) => ipcRenderer.invoke("audit:get", limit),
  getStudentLoginAccounts: (filter) =>
    ipcRenderer.invoke("student-logins:get", filter),
  createStudentLoginAccount: (input) =>
    ipcRenderer.invoke("student-logins:create", input),
  updateStudentLoginAccount: (id, input) =>
    ipcRenderer.invoke("student-logins:update", id, input),
  disableStudentLoginAccount: (id, reason) =>
    ipcRenderer.invoke("student-logins:disable", id, reason),
  enableStudentLoginAccount: (id) =>
    ipcRenderer.invoke("student-logins:enable", id),
  resetStudentLoginPassword: (id, input) =>
    ipcRenderer.invoke("student-logins:reset-password", id, input),
  unlinkStudentLoginAccount: (id) =>
    ipcRenderer.invoke("student-logins:unlink", id),
  getEmployeeLoginAccounts: (filter) =>
    ipcRenderer.invoke("employee-logins:get", filter),
  createEmployeeLoginAccount: (input) =>
    ipcRenderer.invoke("employee-logins:create", input),
  updateEmployeeLoginAccount: (id, input) =>
    ipcRenderer.invoke("employee-logins:update", id, input),
  disableEmployeeLoginAccount: (id, reason) =>
    ipcRenderer.invoke("employee-logins:disable", id, reason),
  enableEmployeeLoginAccount: (id) =>
    ipcRenderer.invoke("employee-logins:enable", id),
  resetEmployeeLoginPassword: (id, input) =>
    ipcRenderer.invoke("employee-logins:reset-password", id, input),
  unlinkEmployeeLoginAccount: (id) =>
    ipcRenderer.invoke("employee-logins:unlink", id),
  getMessageInbox: (filter) => ipcRenderer.invoke("messages:inbox", filter),
  getSentMessages: (filter) => ipcRenderer.invoke("messages:sent", filter),
  getMessageThread: (threadId) =>
    ipcRenderer.invoke("messages:thread:get", threadId),
  markMessageThreadRead: (threadId) =>
    ipcRenderer.invoke("messages:thread:read", threadId),
  archiveMessageThread: (threadId) =>
    ipcRenderer.invoke("messages:thread:archive", threadId),
  unarchiveMessageThread: (threadId) =>
    ipcRenderer.invoke("messages:thread:unarchive", threadId),
  createDirectMessage: (input) =>
    ipcRenderer.invoke("messages:direct:create", input),
  replyToMessageThread: (input) => ipcRenderer.invoke("messages:reply", input),
  editOwnMessage: (messageId, text) =>
    ipcRenderer.invoke("messages:edit-own", messageId, text),
  deleteOwnMessage: (messageId) =>
    ipcRenderer.invoke("messages:delete-own", messageId),
  closeMessageThread: (threadId) =>
    ipcRenderer.invoke("messages:thread:close", threadId),
  getAnnouncements: (filter) => ipcRenderer.invoke("announcements:get", filter),
  getCurrentUserAnnouncements: () =>
    ipcRenderer.invoke("announcements:current-user"),
  createAnnouncement: (input) =>
    ipcRenderer.invoke("announcements:create", input),
  updateAnnouncement: (id, input) =>
    ipcRenderer.invoke("announcements:update", id, input),
  publishAnnouncement: (id) => ipcRenderer.invoke("announcements:publish", id),
  cancelAnnouncement: (id) => ipcRenderer.invoke("announcements:cancel", id),
  deleteAnnouncement: (id) => ipcRenderer.invoke("announcements:delete", id),
  getEligibleMessageRecipients: (filter) =>
    ipcRenderer.invoke("messages:recipients:eligible", filter),
  resolveAnnouncementRecipients: (input) =>
    ipcRenderer.invoke("announcements:recipients:resolve", input),
  getMessageDeliveryReport: (threadId) =>
    ipcRenderer.invoke("messages:delivery-report", threadId),
  getAnnouncementReadReport: (announcementId) =>
    ipcRenderer.invoke("announcements:read-report", announcementId),
  configureCommunicationGateway: (input) =>
    ipcRenderer.invoke("communications:configure-gateway", input),
  getCommunicationGatewayConfiguration: () =>
    ipcRenderer.invoke("communications:get-configuration"),
  removeCommunicationGatewayToken: () =>
    ipcRenderer.invoke("communications:remove-token"),
  getCommunicationIntegrationStatus: () =>
    ipcRenderer.invoke("communications:get-status"),
  testCommunicationGateway: () =>
    ipcRenderer.invoke("communications:test-gateway"),
  getCommunicationTemplates: (channel) =>
    ipcRenderer.invoke("communications:get-templates", channel),
  getExternalRecipientPreview: (input) =>
    ipcRenderer.invoke("communications:preview-recipients", input),
  sendExternalMessage: (input) =>
    ipcRenderer.invoke("communications:send", input),
  sendExternalBatch: (input) =>
    ipcRenderer.invoke("communications:send-batch", input),
  getCommunicationJobs: (filter) =>
    ipcRenderer.invoke("communications:get-jobs", filter),
  getCommunicationJob: (id) =>
    ipcRenderer.invoke("communications:get-job", id),
  retryCommunicationJob: (id) =>
    ipcRenderer.invoke("communications:retry-job", id),
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
  getFamilies: (filter) => ipcRenderer.invoke("families:get", filter),
  getFamilyById: (id) => ipcRenderer.invoke("families:get-by-id", id),
  createFamily: (input) => ipcRenderer.invoke("families:create", input),
  updateFamily: (id, input) =>
    ipcRenderer.invoke("families:update", id, input),
  deleteFamily: (id) => ipcRenderer.invoke("families:delete", id),
  getFamilyStudents: (familyId) =>
    ipcRenderer.invoke("families:students:get", familyId),
  getGuardians: (filter) => ipcRenderer.invoke("guardians:get", filter),
  createGuardian: (input) => ipcRenderer.invoke("guardians:create", input),
  updateGuardian: (id, input) =>
    ipcRenderer.invoke("guardians:update", id, input),
  deleteGuardian: (id) => ipcRenderer.invoke("guardians:delete", id),
  getStudentGuardians: (studentId) =>
    ipcRenderer.invoke("student-guardians:get", studentId),
  linkGuardianToStudent: (input) =>
    ipcRenderer.invoke("student-guardians:link", input),
  updateStudentGuardianLink: (id, input) =>
    ipcRenderer.invoke("student-guardians:update", id, input),
  unlinkGuardianFromStudent: (id) =>
    ipcRenderer.invoke("student-guardians:unlink", id),
  linkSiblingStudents: (input) =>
    ipcRenderer.invoke("student-guardians:link-siblings", input),
  createFamilyFromStudentDetails: (studentId) =>
    ipcRenderer.invoke(
      "student-guardians:create-family-from-student",
      studentId,
    ),
  getParentsInfoReport: (filter) =>
    ipcRenderer.invoke("reports:parents-info", filter),
  getEmergencyContactsReport: (filter) =>
    ipcRenderer.invoke("reports:emergency-contacts", filter),
  getSiblingReport: (filter) => ipcRenderer.invoke("reports:siblings", filter),

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

  getTimetableWeekdays: () =>
    ipcRenderer.invoke("timetable:weekdays:get-all"),
  createTimetableWeekday: (input) =>
    ipcRenderer.invoke("timetable:weekdays:create", input),
  updateTimetableWeekday: (id, input) =>
    ipcRenderer.invoke("timetable:weekdays:update", id, input),
  deleteTimetableWeekday: (id) =>
    ipcRenderer.invoke("timetable:weekdays:delete", id),

  getTimetablePeriods: () =>
    ipcRenderer.invoke("timetable:periods:get-all"),
  createTimetablePeriod: (input) =>
    ipcRenderer.invoke("timetable:periods:create", input),
  updateTimetablePeriod: (id, input) =>
    ipcRenderer.invoke("timetable:periods:update", id, input),
  deleteTimetablePeriod: (id) =>
    ipcRenderer.invoke("timetable:periods:delete", id),

  getClassrooms: () =>
    ipcRenderer.invoke("timetable:classrooms:get-all"),
  createClassroom: (input) =>
    ipcRenderer.invoke("timetable:classrooms:create", input),
  updateClassroom: (id, input) =>
    ipcRenderer.invoke("timetable:classrooms:update", id, input),
  deleteClassroom: (id) =>
    ipcRenderer.invoke("timetable:classrooms:delete", id),

  getTimetableEntries: () =>
    ipcRenderer.invoke("timetable:entries:get-all"),
  getTimetableByClass: (className, section) =>
    ipcRenderer.invoke(
      "timetable:entries:get-by-class",
      className,
      section,
    ),
  getTimetableByTeacher: (teacherId) =>
    ipcRenderer.invoke("timetable:entries:get-by-teacher", teacherId),
  createOrUpdateTimetableEntry: (input) =>
    ipcRenderer.invoke("timetable:entries:save", input),
  deleteTimetableEntry: (id) =>
    ipcRenderer.invoke("timetable:entries:delete", id),

  getHomework: () => ipcRenderer.invoke("homework:get-all"),
  getHomeworkByClass: (className, section) =>
    ipcRenderer.invoke("homework:get-by-class", className, section),
  createHomework: (input) =>
    ipcRenderer.invoke("homework:create", input),
  updateHomework: (id, input) =>
    ipcRenderer.invoke("homework:update", id, input),
  deleteHomework: (id) => ipcRenderer.invoke("homework:delete", id),
  getHomeworkSubmissions: (homeworkId) =>
    ipcRenderer.invoke("homework:submissions:get", homeworkId),
  saveHomeworkSubmissionsBulk: (records) =>
    ipcRenderer.invoke("homework:submissions:save-bulk", records),
  updateHomeworkSubmission: (id, input) =>
    ipcRenderer.invoke("homework:submissions:update", id, input),

  getClassTests: () => ipcRenderer.invoke("class-tests:get-all"),
  getClassTestsByClass: (className, section) =>
    ipcRenderer.invoke("class-tests:get-by-class", className, section),
  createClassTest: (input) =>
    ipcRenderer.invoke("class-tests:create", input),
  updateClassTest: (id, input) =>
    ipcRenderer.invoke("class-tests:update", id, input),
  deleteClassTest: (id) =>
    ipcRenderer.invoke("class-tests:delete", id),
  getClassTestMarks: (testId) =>
    ipcRenderer.invoke("class-tests:marks:get", testId),
  saveClassTestMarksBulk: (records) =>
    ipcRenderer.invoke("class-tests:marks:save-bulk", records),
  updateClassTestMark: (id, input) =>
    ipcRenderer.invoke("class-tests:marks:update", id, input),

  getSubjectChapters: () =>
    ipcRenderer.invoke("question-paper:chapters:get-all"),
  getSubjectChaptersByClassSubject: (className, subjectName) =>
    ipcRenderer.invoke(
      "question-paper:chapters:get-by-class-subject",
      className,
      subjectName,
    ),
  createSubjectChapter: (input) =>
    ipcRenderer.invoke("question-paper:chapters:create", input),
  updateSubjectChapter: (id, input) =>
    ipcRenderer.invoke("question-paper:chapters:update", id, input),
  deleteSubjectChapter: (id) =>
    ipcRenderer.invoke("question-paper:chapters:delete", id),

  getQuestions: () =>
    ipcRenderer.invoke("question-paper:questions:get-all"),
  getQuestionsByFilter: (filter) =>
    ipcRenderer.invoke("question-paper:questions:get-by-filter", filter),
  createQuestion: (input) =>
    ipcRenderer.invoke("question-paper:questions:create", input),
  updateQuestion: (id, input) =>
    ipcRenderer.invoke("question-paper:questions:update", id, input),
  deleteQuestion: (id) =>
    ipcRenderer.invoke("question-paper:questions:delete", id),

  getQuestionPapers: () =>
    ipcRenderer.invoke("question-paper:papers:get-all"),
  getQuestionPaperById: (id) =>
    ipcRenderer.invoke("question-paper:papers:get-by-id", id),
  createQuestionPaper: (input) =>
    ipcRenderer.invoke("question-paper:papers:create", input),
  updateQuestionPaper: (id, input) =>
    ipcRenderer.invoke("question-paper:papers:update", id, input),
  deleteQuestionPaper: (id) =>
    ipcRenderer.invoke("question-paper:papers:delete", id),

  getBehaviourTraits: () =>
    ipcRenderer.invoke("behaviour-skills:behaviour-traits:get-all"),
  createBehaviourTrait: (input) =>
    ipcRenderer.invoke("behaviour-skills:behaviour-traits:create", input),
  updateBehaviourTrait: (id, input) =>
    ipcRenderer.invoke(
      "behaviour-skills:behaviour-traits:update",
      id,
      input,
    ),
  deleteBehaviourTrait: (id) =>
    ipcRenderer.invoke("behaviour-skills:behaviour-traits:delete", id),

  getSkillTraits: () =>
    ipcRenderer.invoke("behaviour-skills:skill-traits:get-all"),
  createSkillTrait: (input) =>
    ipcRenderer.invoke("behaviour-skills:skill-traits:create", input),
  updateSkillTrait: (id, input) =>
    ipcRenderer.invoke("behaviour-skills:skill-traits:update", id, input),
  deleteSkillTrait: (id) =>
    ipcRenderer.invoke("behaviour-skills:skill-traits:delete", id),

  getBehaviourRatings: (filter) =>
    ipcRenderer.invoke("behaviour-skills:behaviour-ratings:get", filter),
  saveBehaviourRatingsBulk: (records) =>
    ipcRenderer.invoke(
      "behaviour-skills:behaviour-ratings:save-bulk",
      records,
    ),
  getSkillRatings: (filter) =>
    ipcRenderer.invoke("behaviour-skills:skill-ratings:get", filter),
  saveSkillRatingsBulk: (records) =>
    ipcRenderer.invoke(
      "behaviour-skills:skill-ratings:save-bulk",
      records,
    ),

  getStudentObservations: (filter) =>
    ipcRenderer.invoke("behaviour-skills:observations:get", filter),
  createStudentObservation: (input) =>
    ipcRenderer.invoke("behaviour-skills:observations:create", input),
  updateStudentObservation: (id, input) =>
    ipcRenderer.invoke(
      "behaviour-skills:observations:update",
      id,
      input,
    ),
  deleteStudentObservation: (id) =>
    ipcRenderer.invoke("behaviour-skills:observations:delete", id),

  getAcademicSessions: () =>
    ipcRenderer.invoke("academic-sessions:get-all"),
  getCurrentAcademicSession: () =>
    ipcRenderer.invoke("academic-sessions:get-current"),
  createAcademicSession: (input) =>
    ipcRenderer.invoke("academic-sessions:create", input),
  updateAcademicSession: (id, input) =>
    ipcRenderer.invoke("academic-sessions:update", id, input),
  setCurrentAcademicSession: (id) =>
    ipcRenderer.invoke("academic-sessions:set-current", id),
  closeAcademicSession: (id) =>
    ipcRenderer.invoke("academic-sessions:close", id),
  deleteAcademicSession: (id) =>
    ipcRenderer.invoke("academic-sessions:delete", id),
  getStudentSessionHistory: (studentId) =>
    ipcRenderer.invoke(
      "academic-sessions:student-history:get",
      studentId,
    ),
  getSessionStudents: (sessionId) =>
    ipcRenderer.invoke("academic-sessions:students:get", sessionId),
  createOrUpdateStudentSessionHistory: (input) =>
    ipcRenderer.invoke(
      "academic-sessions:student-history:save",
      input,
    ),
  getPromotionPreview: (input) =>
    ipcRenderer.invoke("academic-sessions:promotion:preview", input),
  promoteStudentsBulk: (input) =>
    ipcRenderer.invoke("academic-sessions:promotion:run", input),
  getStudentPromotions: () =>
    ipcRenderer.invoke("academic-sessions:promotions:get-all"),
  getStudentPromotionById: (id) =>
    ipcRenderer.invoke("academic-sessions:promotions:get-by-id", id),
  getPromotionReport: (filter) =>
    ipcRenderer.invoke(
      "academic-sessions:promotion-report:get",
      filter,
    ),
  getCarryForwardDues: (filter) =>
    ipcRenderer.invoke("academic-sessions:carry-forward:get", filter),
  updateCarryForwardDue: (id, input) =>
    ipcRenderer.invoke(
      "academic-sessions:carry-forward:update",
      id,
      input,
    ),
  waiveCarryForwardDue: (id, reason) =>
    ipcRenderer.invoke(
      "academic-sessions:carry-forward:waive",
      id,
      reason,
    ),

  getSchoolSettings: () => ipcRenderer.invoke("settings:get"),
  saveSchoolSettings: (settings) =>
    ipcRenderer.invoke("settings:save", settings),
  getSchoolRules: (filter) => ipcRenderer.invoke("school-rules:get", filter),
  createSchoolRule: (input) =>
    ipcRenderer.invoke("school-rules:create", input),
  updateSchoolRule: (id, input) =>
    ipcRenderer.invoke("school-rules:update", id, input),
  deleteSchoolRule: (id) => ipcRenderer.invoke("school-rules:delete", id),
  reorderSchoolRules: (records) =>
    ipcRenderer.invoke("school-rules:reorder", records),
  getAppPreferences: () => ipcRenderer.invoke("preferences:app:get"),
  updateAppPreferences: (input) =>
    ipcRenderer.invoke("preferences:app:update", input),
  getUserPreferences: () => ipcRenderer.invoke("preferences:user:get"),
  updateUserPreferences: (input) =>
    ipcRenderer.invoke("preferences:user:update", input),

  getFeePayments: () => ipcRenderer.invoke("fees:get-all"),
  getFeePaymentsByDateRange: (startDate, endDate) =>
    ipcRenderer.invoke("fees:get-by-date-range", startDate, endDate),
  createFeePayment: (payment) => ipcRenderer.invoke("fees:create", payment),
  reverseFeePayment: (id, reason) =>
    ipcRenderer.invoke("fees:reverse-payment", id, reason),
  getDiscountTypes: () => ipcRenderer.invoke("discount-types:get-all"),
  createDiscountType: (input) =>
    ipcRenderer.invoke("discount-types:create", input),
  updateDiscountType: (id, input) =>
    ipcRenderer.invoke("discount-types:update", id, input),
  deleteDiscountType: (id) =>
    ipcRenderer.invoke("discount-types:delete", id),
  getStudentDiscounts: (filter) =>
    ipcRenderer.invoke("student-discounts:get", filter),
  createStudentDiscount: (input) =>
    ipcRenderer.invoke("student-discounts:create", input),
  updateStudentDiscount: (id, input) =>
    ipcRenderer.invoke("student-discounts:update", id, input),
  deleteStudentDiscount: (id) =>
    ipcRenderer.invoke("student-discounts:delete", id),
  getFeeInvoicePreview: (input) =>
    ipcRenderer.invoke("fee-invoices:preview", input),
  createFeeInvoice: (input) =>
    ipcRenderer.invoke("fee-invoices:create", input),
  getFeeInvoices: (filter) =>
    ipcRenderer.invoke("fee-invoices:get-all", filter),
  getFeeInvoiceById: (id) =>
    ipcRenderer.invoke("fee-invoices:get-by-id", id),
  cancelFeeInvoice: (id, reason) =>
    ipcRenderer.invoke("fee-invoices:cancel", id, reason),
  refreshFeeInvoiceStatus: (id) =>
    ipcRenderer.invoke("fee-invoices:refresh-status", id),
  allocateFeePaymentToInvoices: (input) =>
    ipcRenderer.invoke("fee-invoices:allocate-payment", input),
  getStudentOutstandingInvoices: (studentId) =>
    ipcRenderer.invoke("fee-invoices:outstanding-by-student", studentId),
  getFeeInvoiceSummary: (filter) =>
    ipcRenderer.invoke("fee-invoices:summary", filter),
  getFeeInvoiceAccountsReport: (filter) =>
    ipcRenderer.invoke("fee-invoices:accounts-report", filter),
  getStudentFeeLedger: (studentId) =>
    ipcRenderer.invoke("fee-invoices:student-ledger", studentId),
  getFeeInvoiceAccountMappings: () =>
    ipcRenderer.invoke("fee-invoice-account-mappings:get-all"),
  saveFeeInvoiceAccountMapping: (input) =>
    ipcRenderer.invoke("fee-invoice-account-mappings:save", input),
  deleteFeeInvoiceAccountMapping: (id) =>
    ipcRenderer.invoke("fee-invoice-account-mappings:delete", id),

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
  getEmployeeAttendanceByDate: (date, filters) =>
    ipcRenderer.invoke("employee-attendance:get-by-date", date, filters),
  getEmployeeAttendanceByRange: (filter) =>
    ipcRenderer.invoke("employee-attendance:get-by-range", filter),
  saveEmployeeAttendanceBulk: (records) =>
    ipcRenderer.invoke("employee-attendance:save-bulk", records),
  updateEmployeeAttendance: (id, input) =>
    ipcRenderer.invoke("employee-attendance:update", id, input),
  getEmployeeAttendanceSummary: (filter) =>
    ipcRenderer.invoke("employee-attendance:summary", filter),
  getEmployeeMonthlyAttendance: (employeeId, month) =>
    ipcRenderer.invoke("employee-attendance:monthly", employeeId, month),
  getEmployeeAttendanceReport: (filter) =>
    ipcRenderer.invoke("employee-attendance:report", filter),

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
  getGradingSchemes: () => ipcRenderer.invoke("grading-schemes:get-all"),
  getGradingSchemeById: (id) =>
    ipcRenderer.invoke("grading-schemes:get-by-id", id),
  createGradingScheme: (input) =>
    ipcRenderer.invoke("grading-schemes:create", input),
  updateGradingScheme: (id, input) =>
    ipcRenderer.invoke("grading-schemes:update", id, input),
  deleteGradingScheme: (id) =>
    ipcRenderer.invoke("grading-schemes:delete", id),
  setDefaultGradingScheme: (id) =>
    ipcRenderer.invoke("grading-schemes:set-default", id),
  calculateGrade: (input) =>
    ipcRenderer.invoke("grading-schemes:calculate", input),
  getReportCardTemplates: () =>
    ipcRenderer.invoke("report-card-templates:get-all"),
  createReportCardTemplate: (input) =>
    ipcRenderer.invoke("report-card-templates:create", input),
  updateReportCardTemplate: (id, input) =>
    ipcRenderer.invoke("report-card-templates:update", id, input),
  deleteReportCardTemplate: (id) =>
    ipcRenderer.invoke("report-card-templates:delete", id),
  getReportCardPreview: (input) =>
    ipcRenderer.invoke("report-cards:preview", input),
  generateStudentReportCard: (input) =>
    ipcRenderer.invoke("report-cards:generate", input),
  generateClassReportCards: (input) =>
    ipcRenderer.invoke("report-cards:generate-class", input),
  getStudentReportCards: (filter) =>
    ipcRenderer.invoke("report-cards:get-all", filter),
  getStudentReportCardById: (id) =>
    ipcRenderer.invoke("report-cards:get-by-id", id),
  updateReportCardRemarks: (id, input) =>
    ipcRenderer.invoke("report-cards:update-remarks", id, input),
  deleteReportCard: (id) =>
    ipcRenderer.invoke("report-cards:delete", id),
  getClassResultSummary: (filter) =>
    ipcRenderer.invoke("report-cards:class-summary", filter),
  getResultPositions: (filter) =>
    ipcRenderer.invoke("report-cards:positions", filter),

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
