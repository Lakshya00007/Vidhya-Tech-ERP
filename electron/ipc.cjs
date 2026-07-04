const { ipcMain } = require("electron");

const channels = [
  "license:get-device-id",
  "license:get-status",
  "license:activate",
  "license:deactivate",
  "license:get-info",
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
  "demo:create-data",
  "students:get-all",
  "students:create",
  "students:update",
  "students:delete",
  "students:import-bulk",
  "students:import-template",
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
  "certificates:templates:get-all",
  "certificates:templates:create",
  "certificates:templates:update",
  "certificates:templates:delete",
  "certificates:issue",
  "certificates:get-issued",
  "certificates:get-issued-by-student",
  "database:create-backup",
  "database:restore-backup",
  "database:get-info",
  "database:open-folder",
  "app:restart",
];

function registerIpcHandlers(
  database,
  backupService,
  authService,
  licenseService,
) {
  const requireValidLicense = () =>
    licenseService?.requireValidLicense();
  const requireAuthenticated = () => authService?.requireAuthenticated();
  const requireRoles = (roles) => authService?.requireRoles(roles);
  const authenticated = (handler) => (event, ...args) => {
    requireValidLicense();
    requireAuthenticated();
    return handler(event, ...args);
  };

  if (licenseService) {
    ipcMain.handle("license:get-device-id", () =>
      licenseService.getDeviceId(),
    );
    ipcMain.handle("license:get-status", () =>
      licenseService.getLicenseStatus(),
    );
    ipcMain.handle("license:activate", (_event, licenseKey) =>
      licenseService.activateLicense(licenseKey),
    );
    ipcMain.handle("license:get-info", () =>
      licenseService.getLicenseInfo(),
    );
    ipcMain.handle("license:deactivate", () => {
      requireValidLicense();
      const actor = requireRoles(["Owner"]);
      authService?.audit(
        "License deactivated",
        "License",
        "The local license activation was removed.",
        actor,
      );
      const result = licenseService.deactivateLicense();
      authService?.logout();
      return result;
    });
  }

  if (authService) {
    ipcMain.handle("auth:has-users", () => {
      requireValidLicense();
      return authService.hasUsers();
    });
    ipcMain.handle("auth:create-first-owner", (_event, input) => {
      requireValidLicense();
      return authService.createFirstOwner(input);
    });
    ipcMain.handle("auth:login", (_event, username, password) => {
      requireValidLicense();
      return authService.login(username, password);
    });
    ipcMain.handle("auth:logout", () => authService.logout());
    ipcMain.handle("auth:get-current-user", () => {
      requireValidLicense();
      return authService.getCurrentUser();
    });
    ipcMain.handle(
      "auth:change-password",
      (_event, userId, oldPassword, newPassword) => {
        requireValidLicense();
        return authService.changePassword(userId, oldPassword, newPassword);
      },
    );

    ipcMain.handle("users:get-all", () => {
      requireValidLicense();
      return authService.getUsers();
    });
    ipcMain.handle("users:create", (_event, input) => {
      requireValidLicense();
      return authService.createUser(input);
    });
    ipcMain.handle("users:update", (_event, id, input) => {
      requireValidLicense();
      return authService.updateUser(id, input);
    });
    ipcMain.handle("users:reset-password", (_event, id, newPassword) => {
      requireValidLicense();
      return authService.resetUserPassword(id, newPassword);
    });
    ipcMain.handle("users:delete", (_event, id) => {
      requireValidLicense();
      return authService.deleteUser(id);
    });
    ipcMain.handle("audit:get", (_event, limit) => {
      requireValidLicense();
      return authService.getAuditLogs(limit);
    });
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
    "students:import-template",
    authenticated(() => {
      requireRoles(["Owner", "Admin"]);
      return database.getStudentImportTemplate();
    }),
  );
  ipcMain.handle(
    "students:import-bulk",
    authenticated((_event, rows, options) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const result = database.importStudentsBulk(rows, options);
      authService?.audit(
        "Students imported",
        "Students",
        `Processed ${result.totalRows} row(s): ${result.inserted} inserted, ${result.updated} updated, ${result.skipped} skipped.`,
        actor,
      );
      return result;
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
    "demo:create-data",
    authenticated(() => {
      const actor = requireRoles(["Owner"]);
      const result = database.createDemoData(actor?.name);
      authService?.audit(
        "Sample demo data created",
        "Settings",
        result.message,
        actor,
      );
      return result;
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

  ipcMain.handle(
    "certificates:templates:get-all",
    authenticated(() => {
      requireRoles(["Owner", "Admin"]);
      return database.getCertificateTemplates();
    }),
  );
  ipcMain.handle(
    "certificates:templates:create",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const created = database.createCertificateTemplate(input);
      authService?.audit(
        "Certificate template created",
        "Certificates",
        `Created template "${created.name}" (${created.type}).`,
        actor,
      );
      return created;
    }),
  );
  ipcMain.handle(
    "certificates:templates:update",
    authenticated((_event, id, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const updated = database.updateCertificateTemplate(id, input);
      authService?.audit(
        "Certificate template updated",
        "Certificates",
        `Updated template "${updated.name}".`,
        actor,
      );
      return updated;
    }),
  );
  ipcMain.handle(
    "certificates:templates:delete",
    authenticated((_event, id) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const result = database.deleteCertificateTemplate(id);
      if (result.success) {
        authService?.audit(
          "Certificate template deleted",
          "Certificates",
          "Soft-deleted a certificate template.",
          actor,
        );
      }
      return result;
    }),
  );
  ipcMain.handle(
    "certificates:issue",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const issued = database.issueCertificate({
        ...input,
        issuedBy: actor?.name ?? "",
      });
      authService?.audit(
        "Certificate issued",
        "Certificates",
        `Issued ${issued.certificateNo} to ${issued.studentName}.`,
        actor,
      );
      return issued;
    }),
  );
  ipcMain.handle(
    "certificates:get-issued",
    authenticated(() => {
      requireRoles(["Owner", "Admin"]);
      return database.getIssuedCertificates();
    }),
  );
  ipcMain.handle(
    "certificates:get-issued-by-student",
    authenticated((_event, studentId) => {
      requireRoles(["Owner", "Admin"]);
      return database.getIssuedCertificatesByStudent(studentId);
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
