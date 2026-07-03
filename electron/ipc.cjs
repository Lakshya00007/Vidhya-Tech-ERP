const { ipcMain } = require("electron");

const channels = [
  "auth:has-users",
  "auth:create-first-owner",
  "auth:login",
  "auth:logout",
  "auth:get-current-user",
  "auth:change-password",
  "users:get-all",
  "users:create",
  "users:update",
  "users:reset-password",
  "users:delete",
  "audit:get",
  "students:get-all",
  "students:create",
  "students:update",
  "students:delete",
  "settings:get",
  "settings:save",
  "fees:get-all",
  "fees:get-by-date-range",
  "fees:create",
  "attendance:getAll",
  "attendance:getByDate",
  "attendance:getByClassDate",
  "attendance:getByDateRange",
  "attendance:getSummary",
  "attendance:save",
  "attendance:saveBulk",
  "attendance:update",
  "classes:get-all",
  "classes:create",
  "classes:update",
  "classes:delete",
  "sections:get-all",
  "sections:create",
  "sections:update",
  "sections:delete",
  "fee-heads:get-all",
  "fee-heads:create",
  "fee-heads:update",
  "fee-heads:delete",
  "fee-structures:get-all",
  "fee-structures:create",
  "fee-structures:update",
  "fee-structures:delete",
  "subjects:get-all",
  "subjects:create",
  "subjects:update",
  "subjects:delete",
  "exams:get-all",
  "exams:create",
  "exams:update",
  "exams:delete",
  "marks:get-all",
  "marks:get-by-exam",
  "marks:get-by-student-exam",
  "marks:save-bulk",
  "marks:update",
  "database:create-backup",
  "database:restore-backup",
  "database:get-info",
  "database:open-folder",
  "app:restart",
];

function registerIpcHandlers(database, backupService, authService) {
  const requireAuthenticated = () => authService?.requireAuthenticated();
  const requireRoles = (roles) => authService?.requireRoles(roles);
  const authenticated = (handler) => (event, ...args) => {
    requireAuthenticated();
    return handler(event, ...args);
  };

  if (authService) {
    ipcMain.handle("auth:has-users", () => authService.hasUsers());
    ipcMain.handle("auth:create-first-owner", (_event, input) =>
      authService.createFirstOwner(input),
    );
    ipcMain.handle("auth:login", (_event, username, password) =>
      authService.login(username, password),
    );
    ipcMain.handle("auth:logout", () => authService.logout());
    ipcMain.handle("auth:get-current-user", () =>
      authService.getCurrentUser(),
    );
    ipcMain.handle(
      "auth:change-password",
      (_event, userId, oldPassword, newPassword) =>
        authService.changePassword(userId, oldPassword, newPassword),
    );

    ipcMain.handle("users:get-all", () => authService.getUsers());
    ipcMain.handle("users:create", (_event, input) =>
      authService.createUser(input),
    );
    ipcMain.handle("users:update", (_event, id, input) =>
      authService.updateUser(id, input),
    );
    ipcMain.handle("users:reset-password", (_event, id, newPassword) =>
      authService.resetUserPassword(id, newPassword),
    );
    ipcMain.handle("users:delete", (_event, id) =>
      authService.deleteUser(id),
    );
    ipcMain.handle("audit:get", (_event, limit) =>
      authService.getAuditLogs(limit),
    );
  }

  ipcMain.handle(
    "students:get-all",
    authenticated(() => database.getStudents()),
  );
  ipcMain.handle(
    "students:create",
    authenticated((_event, student) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const created = database.createStudent(student);
      authService?.audit(
        "Student created",
        "Students",
        `Created student "${created.name}" (${created.admissionNo}).`,
        actor,
      );
      return created;
    }),
  );
  ipcMain.handle(
    "students:update",
    authenticated((_event, id, student) => {
      requireRoles(["Owner", "Admin"]);
      return database.updateStudent(id, student);
    }),
  );
  ipcMain.handle(
    "students:delete",
    authenticated((_event, id) => {
      requireRoles(["Owner", "Admin"]);
      return database.deleteStudent(id);
    }),
  );

  ipcMain.handle(
    "settings:get",
    authenticated(() => database.getSchoolSettings()),
  );
  ipcMain.handle(
    "settings:save",
    authenticated((_event, settings) => {
      requireRoles(["Owner", "Admin"]);
      return database.saveSchoolSettings(settings);
    }),
  );

  ipcMain.handle(
    "fees:get-all",
    authenticated(() => database.getFeePayments()),
  );
  ipcMain.handle(
    "fees:get-by-date-range",
    authenticated((_event, startDate, endDate) =>
      database.getFeePaymentsByDateRange(startDate, endDate),
    ),
  );
  ipcMain.handle(
    "fees:create",
    authenticated((_event, payment) => {
      const actor = requireRoles(["Owner", "Admin", "Accountant"]);
      const created = database.createFeePayment({
        ...payment,
        cashierName: actor?.name ?? "",
      });
      authService?.audit(
        "Fee payment created",
        "Fees",
        `Created receipt ${created.receiptNo} for ${created.studentName}.`,
        actor,
      );
      return created;
    }),
  );

  ipcMain.handle(
    "attendance:getAll",
    authenticated(() => database.getAttendance()),
  );
  ipcMain.handle(
    "attendance:getByDate",
    authenticated((_event, date) => database.getAttendanceByDate(date)),
  );
  ipcMain.handle(
    "attendance:getByClassDate",
    authenticated((_event, className, section, date) =>
      database.getAttendanceByClassDate(className, section, date),
    ),
  );
  ipcMain.handle(
    "attendance:getByDateRange",
    authenticated((_event, startDate, endDate) =>
      database.getAttendanceByDateRange(startDate, endDate),
    ),
  );
  ipcMain.handle(
    "attendance:getSummary",
    authenticated((_event, startDate, endDate) =>
      database.getAttendanceSummary(startDate, endDate),
    ),
  );
  ipcMain.handle(
    "attendance:save",
    authenticated((_event, record) => {
      requireRoles(["Owner", "Admin", "Teacher"]);
      const saved = database.saveAttendance(record);
      authService?.audit(
        "Attendance saved",
        "Attendance",
        `Saved attendance for ${saved.studentName} on ${saved.attendanceDate}.`,
      );
      return saved;
    }),
  );
  ipcMain.handle(
    "attendance:saveBulk",
    authenticated((_event, records) => {
      requireRoles(["Owner", "Admin", "Teacher"]);
      const saved = database.saveAttendanceBulk(records);
      authService?.audit(
        "Attendance saved",
        "Attendance",
        `Saved ${saved.length} attendance record(s).`,
      );
      return saved;
    }),
  );
  ipcMain.handle(
    "attendance:update",
    authenticated((_event, id, input) => {
      requireRoles(["Owner", "Admin", "Teacher"]);
      return database.updateAttendance(id, input);
    }),
  );

  ipcMain.handle(
    "classes:get-all",
    authenticated(() => database.getClasses()),
  );
  ipcMain.handle(
    "classes:create",
    authenticated((_event, input) => {
      requireRoles(["Owner", "Admin"]);
      return database.createClass(input);
    }),
  );
  ipcMain.handle(
    "classes:update",
    authenticated((_event, id, input) => {
      requireRoles(["Owner", "Admin"]);
      return database.updateClass(id, input);
    }),
  );
  ipcMain.handle(
    "classes:delete",
    authenticated((_event, id) => {
      requireRoles(["Owner", "Admin"]);
      return database.deleteClass(id);
    }),
  );

  ipcMain.handle(
    "sections:get-all",
    authenticated(() => database.getSections()),
  );
  ipcMain.handle(
    "sections:create",
    authenticated((_event, input) => {
      requireRoles(["Owner", "Admin"]);
      return database.createSection(input);
    }),
  );
  ipcMain.handle(
    "sections:update",
    authenticated((_event, id, input) => {
      requireRoles(["Owner", "Admin"]);
      return database.updateSection(id, input);
    }),
  );
  ipcMain.handle(
    "sections:delete",
    authenticated((_event, id) => {
      requireRoles(["Owner", "Admin"]);
      return database.deleteSection(id);
    }),
  );

  ipcMain.handle(
    "fee-heads:get-all",
    authenticated(() => database.getFeeHeads()),
  );
  ipcMain.handle(
    "fee-heads:create",
    authenticated((_event, input) => {
      requireRoles(["Owner", "Admin"]);
      return database.createFeeHead(input);
    }),
  );
  ipcMain.handle(
    "fee-heads:update",
    authenticated((_event, id, input) => {
      requireRoles(["Owner", "Admin"]);
      return database.updateFeeHead(id, input);
    }),
  );
  ipcMain.handle(
    "fee-heads:delete",
    authenticated((_event, id) => {
      requireRoles(["Owner", "Admin"]);
      return database.deleteFeeHead(id);
    }),
  );

  ipcMain.handle(
    "fee-structures:get-all",
    authenticated(() => database.getFeeStructures()),
  );
  ipcMain.handle(
    "fee-structures:create",
    authenticated((_event, input) => {
      requireRoles(["Owner", "Admin"]);
      return database.createFeeStructure(input);
    }),
  );
  ipcMain.handle(
    "fee-structures:update",
    authenticated((_event, id, input) => {
      requireRoles(["Owner", "Admin"]);
      return database.updateFeeStructure(id, input);
    }),
  );
  ipcMain.handle(
    "fee-structures:delete",
    authenticated((_event, id) => {
      requireRoles(["Owner", "Admin"]);
      return database.deleteFeeStructure(id);
    }),
  );

  ipcMain.handle(
    "subjects:get-all",
    authenticated(() => database.getSubjects()),
  );
  ipcMain.handle(
    "subjects:create",
    authenticated((_event, input) => {
      requireRoles(["Owner", "Admin", "Teacher"]);
      return database.createSubject(input);
    }),
  );
  ipcMain.handle(
    "subjects:update",
    authenticated((_event, id, input) => {
      requireRoles(["Owner", "Admin", "Teacher"]);
      return database.updateSubject(id, input);
    }),
  );
  ipcMain.handle(
    "subjects:delete",
    authenticated((_event, id) => {
      requireRoles(["Owner", "Admin", "Teacher"]);
      return database.deleteSubject(id);
    }),
  );

  ipcMain.handle(
    "exams:get-all",
    authenticated(() => database.getExams()),
  );
  ipcMain.handle(
    "exams:create",
    authenticated((_event, input) => {
      requireRoles(["Owner", "Admin", "Teacher"]);
      return database.createExam(input);
    }),
  );
  ipcMain.handle(
    "exams:update",
    authenticated((_event, id, input) => {
      requireRoles(["Owner", "Admin", "Teacher"]);
      return database.updateExam(id, input);
    }),
  );
  ipcMain.handle(
    "exams:delete",
    authenticated((_event, id) => {
      requireRoles(["Owner", "Admin", "Teacher"]);
      return database.deleteExam(id);
    }),
  );

  ipcMain.handle(
    "marks:get-all",
    authenticated(() => database.getMarks()),
  );
  ipcMain.handle(
    "marks:get-by-exam",
    authenticated((_event, examId) => database.getMarksByExam(examId)),
  );
  ipcMain.handle(
    "marks:get-by-student-exam",
    authenticated((_event, studentId, examId) =>
      database.getMarksByStudentExam(studentId, examId),
    ),
  );
  ipcMain.handle(
    "marks:save-bulk",
    authenticated((_event, records) => {
      requireRoles(["Owner", "Admin", "Teacher"]);
      const saved = database.saveMarksBulk(records);
      authService?.audit(
        "Marks saved",
        "Exams",
        `Saved ${saved.length} mark record(s).`,
      );
      return saved;
    }),
  );
  ipcMain.handle(
    "marks:update",
    authenticated((_event, id, input) => {
      requireRoles(["Owner", "Admin", "Teacher"]);
      return database.updateMark(id, input);
    }),
  );

  if (backupService) {
    ipcMain.handle("database:create-backup", async (event) => {
      requireRoles(["Owner", "Admin"]);
      const result = await backupService.createDatabaseBackup(event);
      if (result.success) {
        authService?.audit(
          "Database backup created",
          "Backup",
          "A local database backup was created.",
        );
      }
      return result;
    });
    ipcMain.handle("database:restore-backup", async (event) => {
      requireRoles(["Owner"]);
      const result = await backupService.restoreDatabaseBackup(event);
      if (result.success) {
        authService?.audit(
          "Database restore staged",
          "Backup",
          "A database restore was staged and requires restart.",
        );
      }
      return result;
    });
    ipcMain.handle(
      "database:get-info",
      authenticated(() => backupService.getDatabaseInfo()),
    );
    ipcMain.handle(
      "database:open-folder",
      authenticated(() => {
        requireRoles(["Owner", "Admin"]);
        return backupService.openDatabaseFolder();
      }),
    );
    ipcMain.handle(
      "app:restart",
      authenticated(() => {
        requireRoles(["Owner"]);
        return backupService.restartApp();
      }),
    );
  }

  return () => {
    for (const channel of channels) {
      ipcMain.removeHandler(channel);
    }
  };
}

module.exports = { registerIpcHandlers };
