const { ipcMain } = require("electron");

const channels = [
  "license:get-device-id",
  "license:get-status",
  "license:activate",
  "license:update-key",
  "license:deactivate",
  "license:get-info",
  "license:check-remote-now",
  "license:get-remote-status",
  "auth:has-users",
  "auth:create-first-owner",
  "auth:login",
  "auth:logout",
  "auth:get-current-user",
  "auth:change-password",
  "account:get-profile",
  "account:update-profile",
  "account:change-password",
  "account:login-history",
  "messages:inbox",
  "messages:sent",
  "messages:thread:get",
  "messages:thread:read",
  "messages:thread:archive",
  "messages:thread:unarchive",
  "messages:direct:create",
  "messages:reply",
  "messages:edit-own",
  "messages:delete-own",
  "messages:thread:close",
  "announcements:get",
  "announcements:current-user",
  "announcements:create",
  "announcements:update",
  "announcements:publish",
  "announcements:cancel",
  "announcements:delete",
  "messages:recipients:eligible",
  "announcements:recipients:resolve",
  "messages:delivery-report",
  "announcements:read-report",
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
  "families:get",
  "families:get-by-id",
  "families:create",
  "families:update",
  "families:delete",
  "families:students:get",
  "guardians:get",
  "guardians:create",
  "guardians:update",
  "guardians:delete",
  "student-guardians:get",
  "student-guardians:link",
  "student-guardians:update",
  "student-guardians:unlink",
  "student-guardians:link-siblings",
  "student-guardians:create-family-from-student",
  "reports:parents-info",
  "reports:emergency-contacts",
  "reports:siblings",
  "employees:get-all",
  "employees:get-by-id",
  "employees:create",
  "employees:update",
  "employees:delete",
  "salary:get-all",
  "salary:get-by-date-range",
  "salary:get-by-employee",
  "salary:create",
  "salary:update",
  "salary:delete",
  "accounts:categories:get-all",
  "accounts:categories:create",
  "accounts:categories:update",
  "accounts:categories:delete",
  "accounts:transactions:get-all",
  "accounts:transactions:get-by-date-range",
  "accounts:transactions:create",
  "accounts:transactions:update",
  "accounts:transactions:delete",
  "timetable:weekdays:get-all",
  "timetable:weekdays:create",
  "timetable:weekdays:update",
  "timetable:weekdays:delete",
  "timetable:periods:get-all",
  "timetable:periods:create",
  "timetable:periods:update",
  "timetable:periods:delete",
  "timetable:classrooms:get-all",
  "timetable:classrooms:create",
  "timetable:classrooms:update",
  "timetable:classrooms:delete",
  "timetable:entries:get-all",
  "timetable:entries:get-by-class",
  "timetable:entries:get-by-teacher",
  "timetable:entries:save",
  "timetable:entries:delete",
  "homework:get-all",
  "homework:get-by-class",
  "homework:create",
  "homework:update",
  "homework:delete",
  "homework:submissions:get",
  "homework:submissions:save-bulk",
  "homework:submissions:update",
  "class-tests:get-all",
  "class-tests:get-by-class",
  "class-tests:create",
  "class-tests:update",
  "class-tests:delete",
  "class-tests:marks:get",
  "class-tests:marks:save-bulk",
  "class-tests:marks:update",
  "question-paper:chapters:get-all",
  "question-paper:chapters:get-by-class-subject",
  "question-paper:chapters:create",
  "question-paper:chapters:update",
  "question-paper:chapters:delete",
  "question-paper:questions:get-all",
  "question-paper:questions:get-by-filter",
  "question-paper:questions:create",
  "question-paper:questions:update",
  "question-paper:questions:delete",
  "question-paper:papers:get-all",
  "question-paper:papers:get-by-id",
  "question-paper:papers:create",
  "question-paper:papers:update",
  "question-paper:papers:delete",
  "behaviour-skills:behaviour-traits:get-all",
  "behaviour-skills:behaviour-traits:create",
  "behaviour-skills:behaviour-traits:update",
  "behaviour-skills:behaviour-traits:delete",
  "behaviour-skills:skill-traits:get-all",
  "behaviour-skills:skill-traits:create",
  "behaviour-skills:skill-traits:update",
  "behaviour-skills:skill-traits:delete",
  "behaviour-skills:behaviour-ratings:get",
  "behaviour-skills:behaviour-ratings:save-bulk",
  "behaviour-skills:skill-ratings:get",
  "behaviour-skills:skill-ratings:save-bulk",
  "behaviour-skills:observations:get",
  "behaviour-skills:observations:create",
  "behaviour-skills:observations:update",
  "behaviour-skills:observations:delete",
  "academic-sessions:get-all",
  "academic-sessions:get-current",
  "academic-sessions:create",
  "academic-sessions:update",
  "academic-sessions:set-current",
  "academic-sessions:close",
  "academic-sessions:delete",
  "academic-sessions:student-history:get",
  "academic-sessions:students:get",
  "academic-sessions:student-history:save",
  "academic-sessions:promotion:preview",
  "academic-sessions:promotion:run",
  "academic-sessions:promotions:get-all",
  "academic-sessions:promotions:get-by-id",
  "academic-sessions:promotion-report:get",
  "academic-sessions:carry-forward:get",
  "academic-sessions:carry-forward:update",
  "academic-sessions:carry-forward:waive",
  "settings:get",
  "settings:save",
  "school-rules:get",
  "school-rules:create",
  "school-rules:update",
  "school-rules:delete",
  "school-rules:reorder",
  "preferences:app:get",
  "preferences:app:update",
  "preferences:user:get",
  "preferences:user:update",
  "fees:get-all",
  "fees:get-by-date-range",
  "fees:create",
  "fees:reverse-payment",
  "discount-types:get-all",
  "discount-types:create",
  "discount-types:update",
  "discount-types:delete",
  "student-discounts:get",
  "student-discounts:create",
  "student-discounts:update",
  "student-discounts:delete",
  "fee-invoices:preview",
  "fee-invoices:create",
  "fee-invoices:get-all",
  "fee-invoices:get-by-id",
  "fee-invoices:cancel",
  "fee-invoices:refresh-status",
  "fee-invoices:allocate-payment",
  "fee-invoices:outstanding-by-student",
  "fee-invoices:summary",
  "fee-invoices:accounts-report",
  "fee-invoices:student-ledger",
  "fee-invoice-account-mappings:get-all",
  "fee-invoice-account-mappings:save",
  "fee-invoice-account-mappings:delete",
  "attendance:getAll",
  "attendance:getByDate",
  "attendance:getByClassDate",
  "attendance:getByDateRange",
  "attendance:getSummary",
  "attendance:save",
  "attendance:saveBulk",
  "attendance:update",
  "employee-attendance:get-by-date",
  "employee-attendance:get-by-range",
  "employee-attendance:save-bulk",
  "employee-attendance:update",
  "employee-attendance:summary",
  "employee-attendance:monthly",
  "employee-attendance:report",
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
  "exam-schedules:get-all",
  "exam-schedules:get-by-id",
  "exam-schedules:create",
  "exam-schedules:update",
  "exam-schedules:delete",
  "exam-schedules:publish",
  "exam-schedules:cancel",
  "exam-schedules:complete",
  "exam-schedules:entries:get",
  "exam-schedules:entries:save",
  "exam-schedules:conflicts",
  "date-sheet:get",
  "result-sheet:get",
  "blank-award-list:get",
  "grading-schemes:get-all",
  "grading-schemes:get-by-id",
  "grading-schemes:create",
  "grading-schemes:update",
  "grading-schemes:delete",
  "grading-schemes:set-default",
  "grading-schemes:calculate",
  "report-card-templates:get-all",
  "report-card-templates:create",
  "report-card-templates:update",
  "report-card-templates:delete",
  "report-cards:preview",
  "report-cards:generate",
  "report-cards:generate-class",
  "report-cards:get-all",
  "report-cards:get-by-id",
  "report-cards:update-remarks",
  "report-cards:delete",
  "report-cards:class-summary",
  "report-cards:positions",
  "reports:student-progress",
  "reports:custom-domains",
  "reports:custom-preview",
  "reports:saved-definitions:get",
  "reports:saved-definitions:save",
  "reports:saved-definitions:delete",
  "live-classes:get-all",
  "live-classes:get-by-id",
  "live-classes:create",
  "live-classes:update",
  "live-classes:set-status",
  "live-classes:attendance:save",
  "live-classes:notification-preview",
  "live-classes:notify",
  "store:categories:get-all",
  "store:categories:save",
  "store:tax-rates:get-all",
  "store:tax-rates:save",
  "store:products:get-all",
  "store:products:save",
  "store:account-mappings:get",
  "store:account-mappings:save",
  "store:inventory:create-transaction",
  "store:inventory:ledger",
  "store:orders:get-all",
  "store:orders:create",
  "store:orders:resume-held",
  "store:orders:cancel-held",
  "store:orders:reverse",
  "store:sessions:get-current",
  "store:sessions:get-all",
  "store:sessions:open",
  "store:sessions:close",
  "store:reports:get",
  "certificates:templates:get-all",
  "certificates:templates:create",
  "certificates:templates:update",
  "certificates:templates:delete",
  "certificates:issue",
  "certificates:get-issued",
  "certificates:get-issued-by-student",
  "communications:configure-gateway",
  "communications:get-configuration",
  "communications:remove-token",
  "communications:get-status",
  "communications:test-gateway",
  "communications:get-templates",
  "communications:preview-recipients",
  "communications:send",
  "communications:send-batch",
  "communications:get-jobs",
  "communications:get-job",
  "communications:retry-job",
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
  communicationService,
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
  const getCurrentEmployeeForScope = () => {
    const portalData = authService?.getCurrentEmployeePortalData();
    if (!portalData?.employee?.id) {
      throw new Error("A linked employee account is required for this action.");
    }
    return portalData.employee;
  };
  const assertTeacherOwnsLiveClass = (actor, liveClass) => {
    if (actor?.role !== "Teacher") return null;
    const employee = getCurrentEmployeeForScope();
    if (!liveClass || liveClass.teacherEmployeeId !== employee.id) {
      throw new Error("You are not authorized to manage this live class.");
    }
    return employee;
  };
  const buildLiveClassNotificationPayload = (actor, liveClassId, input = {}) => {
    if (!communicationService) {
      throw new Error("Communication gateway is not configured in this desktop build.");
    }
    const liveClass = database.getLiveClass(liveClassId);
    if (!liveClass) throw new Error("Live class was not found.");
    assertTeacherOwnsLiveClass(actor, liveClass);
    if (liveClass.status === "Cancelled") {
      throw new Error("Cancelled live classes cannot be notified.");
    }
    if (!liveClass.className) {
      throw new Error("Select a class before notifying students or parents.");
    }
    const preview = communicationService.getExternalRecipientPreview(actor, {
      audienceType: "Class students",
      className: liveClass.className,
      section: liveClass.section,
      includeAllGuardians: Boolean(input.includeAllGuardians),
    });
    const variables = {
      student_name: "{{student_name}}",
      class_name: liveClass.className || "",
      subject_name: liveClass.subjectName || "",
      teacher_name: liveClass.teacherName || "",
      class_date: liveClass.startAt ? String(liveClass.startAt).slice(0, 10) : "",
      start_time: liveClass.startAt ? String(liveClass.startAt).slice(11, 16) : "",
      end_time: liveClass.endAt ? String(liveClass.endAt).slice(11, 16) : "",
      meeting_url: liveClass.meetingUrl || "",
      school_name: database.getSchoolSettings().schoolName || "",
    };
    return { liveClass, preview, variables };
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
    ipcMain.handle("license:update-key", (_event, licenseKey) =>
      licenseService.updateLicenseKey(licenseKey),
    );
    ipcMain.handle("license:get-info", () =>
      licenseService.getLicenseInfo(),
    );
    ipcMain.handle("license:check-remote-now", () =>
      licenseService.checkRemoteLicenseNow(),
    );
    ipcMain.handle("license:get-remote-status", () =>
      licenseService.getRemoteLicenseStatus(),
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
    ipcMain.handle("auth:change-temporary-password", (_event, input) => {
      requireValidLicense();
      return authService.changeTemporaryPassword(input);
    });
    ipcMain.handle("account:get-profile", () => {
      requireValidLicense();
      return authService.getCurrentAccountProfile();
    });
    ipcMain.handle("account:update-profile", (_event, input) => {
      requireValidLicense();
      return authService.updateCurrentAccountProfile(input);
    });
    ipcMain.handle("account:change-password", (_event, input) => {
      requireValidLicense();
      return authService.changeCurrentPassword(input);
    });
    ipcMain.handle("account:login-history", (_event, filter) => {
      requireValidLicense();
      return authService.getCurrentLoginHistory(filter);
    });
    ipcMain.handle("account:entity-link", () => {
      requireValidLicense();
      return authService.getCurrentUserEntityLink();
    });
    ipcMain.handle("portal:student-data", () => {
      requireValidLicense();
      return authService.getCurrentStudentPortalData();
    });
    ipcMain.handle("portal:employee-data", () => {
      requireValidLicense();
      return authService.getCurrentEmployeePortalData();
    });

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
    ipcMain.handle("student-logins:get", (_event, filter) => {
      requireValidLicense();
      return authService.getStudentLoginAccounts(filter);
    });
    ipcMain.handle("student-logins:create", (_event, input) => {
      requireValidLicense();
      return authService.createStudentLoginAccount(input);
    });
    ipcMain.handle("student-logins:update", (_event, id, input) => {
      requireValidLicense();
      return authService.updateStudentLoginAccount(id, input);
    });
    ipcMain.handle("student-logins:disable", (_event, id, reason) => {
      requireValidLicense();
      return authService.disableStudentLoginAccount(id, reason);
    });
    ipcMain.handle("student-logins:enable", (_event, id) => {
      requireValidLicense();
      return authService.enableStudentLoginAccount(id);
    });
    ipcMain.handle("student-logins:reset-password", (_event, id, input) => {
      requireValidLicense();
      return authService.resetStudentLoginPassword(id, input);
    });
    ipcMain.handle("student-logins:unlink", (_event, id) => {
      requireValidLicense();
      return authService.unlinkStudentLoginAccount(id);
    });
    ipcMain.handle("employee-logins:get", (_event, filter) => {
      requireValidLicense();
      return authService.getEmployeeLoginAccounts(filter);
    });
    ipcMain.handle("employee-logins:create", (_event, input) => {
      requireValidLicense();
      return authService.createEmployeeLoginAccount(input);
    });
    ipcMain.handle("employee-logins:update", (_event, id, input) => {
      requireValidLicense();
      return authService.updateEmployeeLoginAccount(id, input);
    });
    ipcMain.handle("employee-logins:disable", (_event, id, reason) => {
      requireValidLicense();
      return authService.disableEmployeeLoginAccount(id, reason);
    });
    ipcMain.handle("employee-logins:enable", (_event, id) => {
      requireValidLicense();
      return authService.enableEmployeeLoginAccount(id);
    });
    ipcMain.handle("employee-logins:reset-password", (_event, id, input) => {
      requireValidLicense();
      return authService.resetEmployeeLoginPassword(id, input);
    });
    ipcMain.handle("employee-logins:unlink", (_event, id) => {
      requireValidLicense();
      return authService.unlinkEmployeeLoginAccount(id);
    });
    ipcMain.handle("messages:inbox", (_event, filter) => {
      requireValidLicense();
      return authService.getMessageInbox(filter);
    });
    ipcMain.handle("messages:sent", (_event, filter) => {
      requireValidLicense();
      return authService.getSentMessages(filter);
    });
    ipcMain.handle("messages:thread:get", (_event, threadId) => {
      requireValidLicense();
      return authService.getMessageThread(threadId);
    });
    ipcMain.handle("messages:thread:read", (_event, threadId) => {
      requireValidLicense();
      return authService.markMessageThreadRead(threadId);
    });
    ipcMain.handle("messages:thread:archive", (_event, threadId) => {
      requireValidLicense();
      return authService.archiveMessageThread(threadId);
    });
    ipcMain.handle("messages:thread:unarchive", (_event, threadId) => {
      requireValidLicense();
      return authService.unarchiveMessageThread(threadId);
    });
    ipcMain.handle("messages:direct:create", (_event, input) => {
      requireValidLicense();
      return authService.createDirectMessage(input);
    });
    ipcMain.handle("messages:reply", (_event, input) => {
      requireValidLicense();
      return authService.replyToMessageThread(input);
    });
    ipcMain.handle("messages:edit-own", (_event, messageId, text) => {
      requireValidLicense();
      return authService.editOwnMessage(messageId, text);
    });
    ipcMain.handle("messages:delete-own", (_event, messageId) => {
      requireValidLicense();
      return authService.deleteOwnMessage(messageId);
    });
    ipcMain.handle("messages:thread:close", (_event, threadId) => {
      requireValidLicense();
      return authService.closeMessageThread(threadId);
    });
    ipcMain.handle("announcements:get", (_event, filter) => {
      requireValidLicense();
      return authService.getAnnouncements(filter);
    });
    ipcMain.handle("announcements:current-user", () => {
      requireValidLicense();
      return authService.getCurrentUserAnnouncements();
    });
    ipcMain.handle("announcements:create", (_event, input) => {
      requireValidLicense();
      return authService.createAnnouncement(input);
    });
    ipcMain.handle("announcements:update", (_event, id, input) => {
      requireValidLicense();
      return authService.updateAnnouncement(id, input);
    });
    ipcMain.handle("announcements:publish", (_event, id) => {
      requireValidLicense();
      return authService.publishAnnouncement(id);
    });
    ipcMain.handle("announcements:cancel", (_event, id) => {
      requireValidLicense();
      return authService.cancelAnnouncement(id);
    });
    ipcMain.handle("announcements:delete", (_event, id) => {
      requireValidLicense();
      return authService.deleteAnnouncement(id);
    });
    ipcMain.handle("messages:recipients:eligible", (_event, filter) => {
      requireValidLicense();
      return authService.getEligibleMessageRecipients(filter);
    });
    ipcMain.handle("announcements:recipients:resolve", (_event, input) => {
      requireValidLicense();
      return authService.resolveAnnouncementRecipients(input);
    });
    ipcMain.handle("messages:delivery-report", (_event, threadId) => {
      requireValidLicense();
      return authService.getMessageDeliveryReport(threadId);
    });
    ipcMain.handle("announcements:read-report", (_event, announcementId) => {
      requireValidLicense();
      return authService.getAnnouncementReadReport(announcementId);
    });
  }

  ipcMain.handle(
    "students:get-all",
    authenticated(() => {
      requireRoles(["Owner", "Admin", "Accountant", "Teacher", "Viewer"]);
      return database.getStudents();
    }),
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
    "families:get",
    authenticated((_event, filter) => {
      requireRoles(["Owner", "Admin", "Accountant", "Teacher", "Viewer"]);
      return database.getFamilies(filter);
    }),
  );
  ipcMain.handle(
    "families:get-by-id",
    authenticated((_event, id) => {
      requireRoles(["Owner", "Admin", "Accountant", "Teacher", "Viewer"]);
      return database.getFamilyById(id);
    }),
  );
  ipcMain.handle(
    "families:create",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const created = database.createFamily(input);
      authService?.audit(
        "Family created",
        "Families",
        `Created family ${created.familyCode}.`,
        actor,
      );
      return created;
    }),
  );
  ipcMain.handle(
    "families:update",
    authenticated((_event, id, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const updated = database.updateFamily(id, input);
      authService?.audit(
        "Family updated",
        "Families",
        `Updated family ${updated.familyCode}.`,
        actor,
      );
      return updated;
    }),
  );
  ipcMain.handle(
    "families:delete",
    authenticated((_event, id) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const family = database.getFamilyById(id);
      const result = database.deleteFamily(id);
      if (result.success) {
        authService?.audit(
          "Family deleted",
          "Families",
          family
            ? `Soft-deleted family ${family.familyCode}.`
            : "Soft-deleted a family.",
          actor,
        );
      }
      return result;
    }),
  );
  ipcMain.handle(
    "families:students:get",
    authenticated((_event, familyId) => {
      requireRoles(["Owner", "Admin", "Accountant", "Teacher", "Viewer"]);
      return database.getFamilyStudents(familyId);
    }),
  );
  ipcMain.handle(
    "guardians:get",
    authenticated((_event, filter) => {
      requireRoles(["Owner", "Admin", "Accountant", "Teacher", "Viewer"]);
      return database.getGuardians(filter);
    }),
  );
  ipcMain.handle(
    "guardians:create",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const created = database.createGuardian(input);
      authService?.audit(
        "Guardian created",
        "Families",
        `Created guardian "${created.fullName}".`,
        actor,
      );
      return created;
    }),
  );
  ipcMain.handle(
    "guardians:update",
    authenticated((_event, id, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const updated = database.updateGuardian(id, input);
      authService?.audit(
        "Guardian updated",
        "Families",
        `Updated guardian "${updated.fullName}".`,
        actor,
      );
      return updated;
    }),
  );
  ipcMain.handle(
    "guardians:delete",
    authenticated((_event, id) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const guardian = database.getGuardians({}).find((item) => item.id === id);
      const result = database.deleteGuardian(id);
      if (result.success) {
        authService?.audit(
          "Guardian deleted",
          "Families",
          guardian
            ? `Soft-deleted guardian "${guardian.fullName}".`
            : "Soft-deleted a guardian.",
          actor,
        );
      }
      return result;
    }),
  );
  ipcMain.handle(
    "student-guardians:get",
    authenticated((_event, studentId) => {
      requireRoles(["Owner", "Admin", "Accountant", "Teacher", "Viewer"]);
      return database.getStudentGuardians(studentId);
    }),
  );
  ipcMain.handle(
    "student-guardians:link",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const link = database.linkGuardianToStudent(input);
      authService?.audit(
        "Guardian linked",
        "Families",
        `Linked guardian to student ${link.admissionNo}.`,
        actor,
      );
      return link;
    }),
  );
  ipcMain.handle(
    "student-guardians:update",
    authenticated((_event, id, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const link = database.updateStudentGuardianLink(id, input);
      authService?.audit(
        "Guardian link updated",
        "Families",
        `Updated guardian link for student ${link.admissionNo}.`,
        actor,
      );
      return link;
    }),
  );
  ipcMain.handle(
    "student-guardians:unlink",
    authenticated((_event, id) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const result = database.unlinkGuardianFromStudent(id);
      if (result.success) {
        authService?.audit(
          "Guardian unlinked",
          "Families",
          "Unlinked a guardian from a student.",
          actor,
        );
      }
      return result;
    }),
  );
  ipcMain.handle(
    "student-guardians:link-siblings",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const family = database.linkSiblingStudents(input);
      authService?.audit(
        "Siblings linked",
        "Families",
        `Linked sibling group under family ${family.familyCode}.`,
        actor,
      );
      return family;
    }),
  );
  ipcMain.handle(
    "student-guardians:create-family-from-student",
    authenticated((_event, studentId) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const family = database.createFamilyFromStudentDetails(studentId);
      authService?.audit(
        "Family created from legacy student details",
        "Families",
        `Created or reused family ${family.familyCode}.`,
        actor,
      );
      return family;
    }),
  );
  ipcMain.handle(
    "reports:parents-info",
    authenticated((_event, filter) => {
      requireRoles(["Owner", "Admin", "Accountant", "Teacher", "Viewer"]);
      return database.getParentsInfoReport(filter);
    }),
  );
  ipcMain.handle(
    "reports:emergency-contacts",
    authenticated((_event, filter) => {
      requireRoles(["Owner", "Admin", "Accountant", "Teacher", "Viewer"]);
      return database.getEmergencyContactsReport(filter);
    }),
  );
  ipcMain.handle(
    "reports:siblings",
    authenticated((_event, filter) => {
      requireRoles(["Owner", "Admin", "Accountant", "Teacher", "Viewer"]);
      return database.getSiblingReport(filter);
    }),
  );

  ipcMain.handle(
    "employees:get-all",
    authenticated(() => {
      requireRoles(["Owner", "Admin", "Accountant", "Teacher"]);
      return database.getEmployees();
    }),
  );
  ipcMain.handle(
    "employees:get-by-id",
    authenticated((_event, id) => {
      requireRoles(["Owner", "Admin", "Accountant", "Teacher"]);
      return database.getEmployeeById(id);
    }),
  );
  ipcMain.handle(
    "employees:create",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const created = database.createEmployee(input);
      authService?.audit(
        "Employee created",
        "Employees",
        `Created employee "${created.name}" (${created.employeeNo}).`,
        actor,
      );
      return created;
    }),
  );
  ipcMain.handle(
    "employees:update",
    authenticated((_event, id, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const updated = database.updateEmployee(id, input);
      authService?.audit(
        "Employee updated",
        "Employees",
        `Updated employee "${updated.name}" (${updated.employeeNo}).`,
        actor,
      );
      return updated;
    }),
  );
  ipcMain.handle(
    "employees:delete",
    authenticated((_event, id) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const employee = database.getEmployeeById(id);
      const result = database.deleteEmployee(id);
      if (result.success) {
        authService?.audit(
          "Employee deleted",
          "Employees",
          employee
            ? `Soft-deleted employee "${employee.name}" (${employee.employeeNo}).`
            : "Soft-deleted an employee record.",
          actor,
        );
      }
      return result;
    }),
  );

  ipcMain.handle(
    "salary:get-all",
    authenticated(() => {
      requireRoles(["Owner", "Admin", "Accountant"]);
      return database.getSalaryPayments();
    }),
  );
  ipcMain.handle(
    "salary:get-by-date-range",
    authenticated((_event, startDate, endDate) => {
      requireRoles(["Owner", "Admin", "Accountant"]);
      return database.getSalaryPaymentsByDateRange(startDate, endDate);
    }),
  );
  ipcMain.handle(
    "salary:get-by-employee",
    authenticated((_event, employeeId) => {
      requireRoles(["Owner", "Admin", "Accountant"]);
      return database.getSalaryPaymentsByEmployee(employeeId);
    }),
  );
  ipcMain.handle(
    "salary:create",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin", "Accountant"]);
      const created = database.createSalaryPayment({
        ...input,
        paidBy: actor?.name ?? "",
      });
      authService?.audit(
        "Salary payment created",
        "Salary",
        `Created ${created.salaryNo} for ${created.employeeName} (${created.salaryMonth}).`,
        actor,
      );
      const accountTransaction = database.getAccountTransactionByLink(
        "Salary",
        created.id,
      );
      if (accountTransaction) {
        authService?.audit(
          "Automatic salary expense transaction created",
          "Accounts",
          `Created ${accountTransaction.transactionNo} from ${created.salaryNo}.`,
          actor,
        );
      }
      return created;
    }),
  );
  ipcMain.handle(
    "salary:update",
    authenticated((_event, id, input) => {
      const actor = requireRoles(["Owner", "Admin", "Accountant"]);
      const updated = database.updateSalaryPayment(id, {
        ...input,
        paidBy: actor?.name ?? "",
      });
      authService?.audit(
        "Salary payment updated",
        "Salary",
        `Updated ${updated.salaryNo} for ${updated.employeeName}.`,
        actor,
      );
      return updated;
    }),
  );
  ipcMain.handle(
    "salary:delete",
    authenticated((_event, id) => {
      const actor = requireRoles(["Owner", "Admin", "Accountant"]);
      const payment = database
        .getSalaryPayments()
        .find((item) => item.id === id);
      const result = database.deleteSalaryPayment(id);
      if (result.success) {
        authService?.audit(
          "Salary payment deleted",
          "Salary",
          payment
            ? `Soft-deleted ${payment.salaryNo} for ${payment.employeeName}.`
            : "Soft-deleted a salary payment.",
          actor,
        );
      }
      return result;
    }),
  );

  ipcMain.handle(
    "accounts:categories:get-all",
    authenticated(() => {
      requireRoles(["Owner", "Admin", "Accountant"]);
      return database.getAccountCategories();
    }),
  );
  ipcMain.handle(
    "accounts:categories:create",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin", "Accountant"]);
      const created = database.createAccountCategory(input);
      authService?.audit(
        "Account category created",
        "Accounts",
        `Created ${created.type.toLowerCase()} category "${created.name}".`,
        actor,
      );
      return created;
    }),
  );
  ipcMain.handle(
    "accounts:categories:update",
    authenticated((_event, id, input) => {
      const actor = requireRoles(["Owner", "Admin", "Accountant"]);
      const updated = database.updateAccountCategory(id, input);
      authService?.audit(
        "Account category updated",
        "Accounts",
        `Updated ${updated.type.toLowerCase()} category "${updated.name}".`,
        actor,
      );
      return updated;
    }),
  );
  ipcMain.handle(
    "accounts:categories:delete",
    authenticated((_event, id) => {
      const actor = requireRoles(["Owner", "Admin", "Accountant"]);
      const category = database
        .getAccountCategories()
        .find((item) => item.id === id);
      const result = database.deleteAccountCategory(id);
      if (result.success) {
        authService?.audit(
          "Account category deleted",
          "Accounts",
          category
            ? `Soft-deleted category "${category.name}".`
            : "Soft-deleted an account category.",
          actor,
        );
      }
      return result;
    }),
  );
  ipcMain.handle(
    "accounts:transactions:get-all",
    authenticated(() => {
      requireRoles(["Owner", "Admin", "Accountant"]);
      return database.getAccountTransactions();
    }),
  );
  ipcMain.handle(
    "accounts:transactions:get-by-date-range",
    authenticated((_event, startDate, endDate) => {
      requireRoles(["Owner", "Admin", "Accountant"]);
      return database.getAccountTransactionsByDateRange(startDate, endDate);
    }),
  );
  ipcMain.handle(
    "accounts:transactions:create",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin", "Accountant"]);
      const created = database.createAccountTransaction({
        ...input,
        linkedModule: "Manual",
        linkedRecordId: "",
        createdBy: actor?.name ?? "",
      });
      authService?.audit(
        `${created.type} transaction created`,
        "Accounts",
        `Created ${created.transactionNo}: ${created.title}.`,
        actor,
      );
      return created;
    }),
  );
  ipcMain.handle(
    "accounts:transactions:update",
    authenticated((_event, id, input) => {
      const actor = requireRoles(["Owner", "Admin", "Accountant"]);
      const updated = database.updateAccountTransaction(id, {
        ...input,
        createdBy: actor?.name ?? "",
      });
      authService?.audit(
        "Account transaction updated",
        "Accounts",
        `Updated ${updated.transactionNo}: ${updated.title}.`,
        actor,
      );
      return updated;
    }),
  );
  ipcMain.handle(
    "accounts:transactions:delete",
    authenticated((_event, id) => {
      const actor = requireRoles(["Owner", "Admin", "Accountant"]);
      const transaction = database
        .getAccountTransactions()
        .find((item) => item.id === id);
      const result = database.deleteAccountTransaction(id);
      if (result.success) {
        authService?.audit(
          "Account transaction deleted",
          "Accounts",
          transaction
            ? `Soft-deleted ${transaction.transactionNo}: ${transaction.title}.`
            : "Soft-deleted an account transaction.",
          actor,
        );
      }
      return result;
    }),
  );

  ipcMain.handle(
    "timetable:weekdays:get-all",
    authenticated(() => {
      requireRoles(["Owner", "Admin", "Teacher"]);
      return database.getTimetableWeekdays();
    }),
  );
  ipcMain.handle(
    "timetable:weekdays:create",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const created = database.createTimetableWeekday(input);
      authService?.audit(
        "Timetable weekday created",
        "Timetable",
        `Created weekday "${created.name}".`,
        actor,
      );
      return created;
    }),
  );
  ipcMain.handle(
    "timetable:weekdays:update",
    authenticated((_event, id, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const updated = database.updateTimetableWeekday(id, input);
      authService?.audit(
        "Timetable weekday updated",
        "Timetable",
        `Updated weekday "${updated.name}".`,
        actor,
      );
      return updated;
    }),
  );
  ipcMain.handle(
    "timetable:weekdays:delete",
    authenticated((_event, id) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const weekday = database
        .getTimetableWeekdays()
        .find((item) => item.id === id);
      const result = database.deleteTimetableWeekday(id);
      if (result.success) {
        authService?.audit(
          "Timetable weekday deleted",
          "Timetable",
          weekday
            ? `Soft-deleted weekday "${weekday.name}".`
            : "Soft-deleted a weekday.",
          actor,
        );
      }
      return result;
    }),
  );

  ipcMain.handle(
    "timetable:periods:get-all",
    authenticated(() => {
      requireRoles(["Owner", "Admin", "Teacher"]);
      return database.getTimetablePeriods();
    }),
  );
  ipcMain.handle(
    "timetable:periods:create",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const created = database.createTimetablePeriod(input);
      authService?.audit(
        "Timetable period created",
        "Timetable",
        `Created period "${created.name}" (${created.startTime}-${created.endTime}).`,
        actor,
      );
      return created;
    }),
  );
  ipcMain.handle(
    "timetable:periods:update",
    authenticated((_event, id, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const updated = database.updateTimetablePeriod(id, input);
      authService?.audit(
        "Timetable period updated",
        "Timetable",
        `Updated period "${updated.name}".`,
        actor,
      );
      return updated;
    }),
  );
  ipcMain.handle(
    "timetable:periods:delete",
    authenticated((_event, id) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const period = database
        .getTimetablePeriods()
        .find((item) => item.id === id);
      const result = database.deleteTimetablePeriod(id);
      if (result.success) {
        authService?.audit(
          "Timetable period deleted",
          "Timetable",
          period
            ? `Soft-deleted period "${period.name}".`
            : "Soft-deleted a timetable period.",
          actor,
        );
      }
      return result;
    }),
  );

  ipcMain.handle(
    "timetable:classrooms:get-all",
    authenticated(() => {
      requireRoles(["Owner", "Admin", "Teacher"]);
      return database.getClassrooms();
    }),
  );
  ipcMain.handle(
    "timetable:classrooms:create",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const created = database.createClassroom(input);
      authService?.audit(
        "Classroom created",
        "Timetable",
        `Created classroom "${created.name}".`,
        actor,
      );
      return created;
    }),
  );
  ipcMain.handle(
    "timetable:classrooms:update",
    authenticated((_event, id, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const updated = database.updateClassroom(id, input);
      authService?.audit(
        "Classroom updated",
        "Timetable",
        `Updated classroom "${updated.name}".`,
        actor,
      );
      return updated;
    }),
  );
  ipcMain.handle(
    "timetable:classrooms:delete",
    authenticated((_event, id) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const classroom = database
        .getClassrooms()
        .find((item) => item.id === id);
      const result = database.deleteClassroom(id);
      if (result.success) {
        authService?.audit(
          "Classroom deleted",
          "Timetable",
          classroom
            ? `Soft-deleted classroom "${classroom.name}".`
            : "Soft-deleted a classroom.",
          actor,
        );
      }
      return result;
    }),
  );

  ipcMain.handle(
    "timetable:entries:get-all",
    authenticated(() => {
      requireRoles(["Owner", "Admin", "Teacher"]);
      return database.getTimetableEntries();
    }),
  );
  ipcMain.handle(
    "timetable:entries:get-by-class",
    authenticated((_event, className, section) => {
      requireRoles(["Owner", "Admin", "Teacher"]);
      return database.getTimetableByClass(className, section);
    }),
  );
  ipcMain.handle(
    "timetable:entries:get-by-teacher",
    authenticated((_event, teacherId) => {
      requireRoles(["Owner", "Admin", "Teacher"]);
      return database.getTimetableByTeacher(teacherId);
    }),
  );
  ipcMain.handle(
    "timetable:entries:save",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const saved = database.createOrUpdateTimetableEntry(input);
      authService?.audit(
        "Timetable entry saved",
        "Timetable",
        `Saved ${saved.className}${saved.section ? `-${saved.section}` : ""}, ${saved.weekdayName} ${saved.periodName}: ${saved.subjectName} with ${saved.teacherName}.`,
        actor,
      );
      return saved;
    }),
  );
  ipcMain.handle(
    "timetable:entries:delete",
    authenticated((_event, id) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const entry = database
        .getTimetableEntries()
        .find((item) => item.id === id);
      const result = database.deleteTimetableEntry(id);
      if (result.success) {
        authService?.audit(
          "Timetable entry deleted",
          "Timetable",
          entry
            ? `Removed ${entry.className}${entry.section ? `-${entry.section}` : ""}, ${entry.weekdayName} ${entry.periodName}.`
            : "Removed a timetable entry.",
          actor,
        );
      }
      return result;
    }),
  );

  ipcMain.handle(
    "homework:get-all",
    authenticated(() => {
      requireRoles(["Owner", "Admin", "Teacher"]);
      return database.getHomework();
    }),
  );
  ipcMain.handle(
    "homework:get-by-class",
    authenticated((_event, className, section) => {
      requireRoles(["Owner", "Admin", "Teacher"]);
      return database.getHomeworkByClass(className, section);
    }),
  );
  ipcMain.handle(
    "homework:create",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher"]);
      const created = database.createHomework({
        ...input,
        createdBy: actor?.name ?? "",
      });
      authService?.audit(
        "Homework created",
        "Homework",
        `Assigned "${created.title}" to Class ${created.className}${created.section ? `-${created.section}` : " (all sections)"} for ${created.submissionCount} student(s).`,
        actor,
      );
      return created;
    }),
  );
  ipcMain.handle(
    "homework:update",
    authenticated((_event, id, input) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher"]);
      const updated = database.updateHomework(id, input);
      authService?.audit(
        "Homework updated",
        "Homework",
        `Updated "${updated.title}" for Class ${updated.className}${updated.section ? `-${updated.section}` : " (all sections)"}.`,
        actor,
      );
      return updated;
    }),
  );
  ipcMain.handle(
    "homework:delete",
    authenticated((_event, id) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher"]);
      const homework = database
        .getHomework()
        .find((item) => item.id === id);
      const result = database.deleteHomework(id);
      if (result.success) {
        authService?.audit(
          "Homework deleted",
          "Homework",
          homework
            ? `Soft-deleted "${homework.title}" for Class ${homework.className}.`
            : "Soft-deleted a homework record.",
          actor,
        );
      }
      return result;
    }),
  );
  ipcMain.handle(
    "homework:submissions:get",
    authenticated((_event, homeworkId) => {
      requireRoles(["Owner", "Admin", "Teacher"]);
      return database.getHomeworkSubmissions(homeworkId);
    }),
  );
  ipcMain.handle(
    "homework:submissions:save-bulk",
    authenticated((_event, records) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher"]);
      const saved = database.saveHomeworkSubmissionsBulk(records);
      authService?.audit(
        "Homework submissions updated",
        "Homework",
        `Updated ${saved.length} homework submission record(s).`,
        actor,
      );
      return saved;
    }),
  );
  ipcMain.handle(
    "homework:submissions:update",
    authenticated((_event, id, input) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher"]);
      const updated = database.updateHomeworkSubmission(id, input);
      authService?.audit(
        "Homework submission updated",
        "Homework",
        `Updated homework submission for ${updated.studentName}.`,
        actor,
      );
      return updated;
    }),
  );

  ipcMain.handle(
    "class-tests:get-all",
    authenticated(() => {
      requireRoles(["Owner", "Admin", "Teacher"]);
      return database.getClassTests();
    }),
  );
  ipcMain.handle(
    "class-tests:get-by-class",
    authenticated((_event, className, section) => {
      requireRoles(["Owner", "Admin", "Teacher"]);
      return database.getClassTestsByClass(className, section);
    }),
  );
  ipcMain.handle(
    "class-tests:create",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher"]);
      const created = database.createClassTest({
        ...input,
        createdBy: actor?.name ?? "",
      });
      authService?.audit(
        "Class test created",
        "Class Tests",
        `Created "${created.testName}" for Class ${created.className}${created.section ? `-${created.section}` : " (all sections)"} with ${created.markCount} student row(s).`,
        actor,
      );
      return created;
    }),
  );
  ipcMain.handle(
    "class-tests:update",
    authenticated((_event, id, input) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher"]);
      const updated = database.updateClassTest(id, input);
      authService?.audit(
        "Class test updated",
        "Class Tests",
        `Updated "${updated.testName}" for Class ${updated.className}.`,
        actor,
      );
      return updated;
    }),
  );
  ipcMain.handle(
    "class-tests:delete",
    authenticated((_event, id) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher"]);
      const test = database.getClassTests().find((item) => item.id === id);
      const result = database.deleteClassTest(id);
      if (result.success) {
        authService?.audit(
          "Class test deleted",
          "Class Tests",
          test
            ? `Soft-deleted "${test.testName}" for Class ${test.className}.`
            : "Soft-deleted a class test.",
          actor,
        );
      }
      return result;
    }),
  );
  ipcMain.handle(
    "class-tests:marks:get",
    authenticated((_event, testId) => {
      requireRoles(["Owner", "Admin", "Teacher"]);
      return database.getClassTestMarks(testId);
    }),
  );
  ipcMain.handle(
    "class-tests:marks:save-bulk",
    authenticated((_event, records) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher"]);
      const saved = database.saveClassTestMarksBulk(records);
      authService?.audit(
        "Class test marks updated",
        "Class Tests",
        `Updated ${saved.length} class test mark row(s).`,
        actor,
      );
      return saved;
    }),
  );
  ipcMain.handle(
    "class-tests:marks:update",
    authenticated((_event, id, input) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher"]);
      const updated = database.updateClassTestMark(id, input);
      authService?.audit(
        "Class test mark updated",
        "Class Tests",
        `Updated class test marks for ${updated.studentName}.`,
        actor,
      );
      return updated;
    }),
  );

  ipcMain.handle(
    "question-paper:chapters:get-all",
    authenticated(() => {
      requireRoles(["Owner", "Admin", "Teacher"]);
      return database.getSubjectChapters();
    }),
  );
  ipcMain.handle(
    "question-paper:chapters:get-by-class-subject",
    authenticated((_event, className, subjectName) => {
      requireRoles(["Owner", "Admin", "Teacher"]);
      return database.getSubjectChaptersByClassSubject(
        className,
        subjectName,
      );
    }),
  );
  ipcMain.handle(
    "question-paper:chapters:create",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher"]);
      const created = database.createSubjectChapter(input);
      authService?.audit(
        "Subject chapter created",
        "Question Paper",
        `Created chapter "${created.chapterName}" for ${created.subjectName}, Class ${created.className}.`,
        actor,
      );
      return created;
    }),
  );
  ipcMain.handle(
    "question-paper:chapters:update",
    authenticated((_event, id, input) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher"]);
      const updated = database.updateSubjectChapter(id, input);
      authService?.audit(
        "Subject chapter updated",
        "Question Paper",
        `Updated chapter "${updated.chapterName}" for ${updated.subjectName}.`,
        actor,
      );
      return updated;
    }),
  );
  ipcMain.handle(
    "question-paper:chapters:delete",
    authenticated((_event, id) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher"]);
      const chapter = database
        .getSubjectChapters()
        .find((item) => item.id === id);
      const result = database.deleteSubjectChapter(id);
      if (result.success) {
        authService?.audit(
          "Subject chapter deleted",
          "Question Paper",
          chapter
            ? `Soft-deleted chapter "${chapter.chapterName}".`
            : "Soft-deleted a subject chapter.",
          actor,
        );
      }
      return result;
    }),
  );

  ipcMain.handle(
    "question-paper:questions:get-all",
    authenticated(() => {
      requireRoles(["Owner", "Admin", "Teacher"]);
      return database.getQuestions();
    }),
  );
  ipcMain.handle(
    "question-paper:questions:get-by-filter",
    authenticated((_event, filter) => {
      requireRoles(["Owner", "Admin", "Teacher"]);
      return database.getQuestionsByFilter(filter);
    }),
  );
  ipcMain.handle(
    "question-paper:questions:create",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher"]);
      const created = database.createQuestion({
        ...input,
        createdBy: actor?.name ?? "",
      });
      authService?.audit(
        "Question created",
        "Question Paper",
        `Created a ${created.questionType} question for ${created.subjectName}, Class ${created.className}.`,
        actor,
      );
      return created;
    }),
  );
  ipcMain.handle(
    "question-paper:questions:update",
    authenticated((_event, id, input) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher"]);
      const updated = database.updateQuestion(id, input);
      authService?.audit(
        "Question updated",
        "Question Paper",
        `Updated a ${updated.questionType} question for ${updated.subjectName}.`,
        actor,
      );
      return updated;
    }),
  );
  ipcMain.handle(
    "question-paper:questions:delete",
    authenticated((_event, id) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher"]);
      const question = database.getQuestions().find((item) => item.id === id);
      const result = database.deleteQuestion(id);
      if (result.success) {
        authService?.audit(
          "Question deleted",
          "Question Paper",
          question
            ? `Soft-deleted a ${question.questionType} question for ${question.subjectName}.`
            : "Soft-deleted a question bank item.",
          actor,
        );
      }
      return result;
    }),
  );

  ipcMain.handle(
    "question-paper:papers:get-all",
    authenticated(() => {
      requireRoles(["Owner", "Admin", "Teacher"]);
      return database.getQuestionPapers();
    }),
  );
  ipcMain.handle(
    "question-paper:papers:get-by-id",
    authenticated((_event, id) => {
      requireRoles(["Owner", "Admin", "Teacher"]);
      return database.getQuestionPaperById(id);
    }),
  );
  ipcMain.handle(
    "question-paper:papers:create",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher"]);
      const created = database.createQuestionPaper({
        ...input,
        createdBy: actor?.name ?? "",
      });
      authService?.audit(
        "Question paper created",
        "Question Paper",
        `Created ${created.paperNo}, "${created.title}", with ${created.itemCount} question(s).`,
        actor,
      );
      return created;
    }),
  );
  ipcMain.handle(
    "question-paper:papers:update",
    authenticated((_event, id, input) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher"]);
      const updated = database.updateQuestionPaper(id, input);
      authService?.audit(
        "Question paper updated",
        "Question Paper",
        `Updated ${updated.paperNo}, "${updated.title}".`,
        actor,
      );
      return updated;
    }),
  );
  ipcMain.handle(
    "question-paper:papers:delete",
    authenticated((_event, id) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher"]);
      const paper = database.getQuestionPaperById(id);
      const result = database.deleteQuestionPaper(id);
      if (result.success) {
        authService?.audit(
          "Question paper deleted",
          "Question Paper",
          paper
            ? `Soft-deleted ${paper.paperNo}, "${paper.title}".`
            : "Soft-deleted a question paper.",
          actor,
        );
      }
      return result;
    }),
  );

  ipcMain.handle(
    "behaviour-skills:behaviour-traits:get-all",
    authenticated(() => {
      requireRoles(["Owner", "Admin", "Teacher"]);
      return database.getBehaviourTraits();
    }),
  );
  ipcMain.handle(
    "behaviour-skills:behaviour-traits:create",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const created = database.createBehaviourTrait(input);
      authService?.audit(
        "Behaviour trait created",
        "Behaviour & Skills",
        `Created behaviour trait "${created.name}".`,
        actor,
      );
      return created;
    }),
  );
  ipcMain.handle(
    "behaviour-skills:behaviour-traits:update",
    authenticated((_event, id, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const updated = database.updateBehaviourTrait(id, input);
      authService?.audit(
        "Behaviour trait updated",
        "Behaviour & Skills",
        `Updated behaviour trait "${updated.name}".`,
        actor,
      );
      return updated;
    }),
  );
  ipcMain.handle(
    "behaviour-skills:behaviour-traits:delete",
    authenticated((_event, id) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const trait = database
        .getBehaviourTraits()
        .find((item) => item.id === id);
      const result = database.deleteBehaviourTrait(id);
      if (result.success) {
        authService?.audit(
          "Behaviour trait deleted",
          "Behaviour & Skills",
          trait
            ? `Soft-deleted behaviour trait "${trait.name}".`
            : "Soft-deleted a behaviour trait.",
          actor,
        );
      }
      return result;
    }),
  );

  ipcMain.handle(
    "behaviour-skills:skill-traits:get-all",
    authenticated(() => {
      requireRoles(["Owner", "Admin", "Teacher"]);
      return database.getSkillTraits();
    }),
  );
  ipcMain.handle(
    "behaviour-skills:skill-traits:create",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const created = database.createSkillTrait(input);
      authService?.audit(
        "Skill trait created",
        "Behaviour & Skills",
        `Created ${created.domain.toLowerCase()} skill trait "${created.name}".`,
        actor,
      );
      return created;
    }),
  );
  ipcMain.handle(
    "behaviour-skills:skill-traits:update",
    authenticated((_event, id, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const updated = database.updateSkillTrait(id, input);
      authService?.audit(
        "Skill trait updated",
        "Behaviour & Skills",
        `Updated ${updated.domain.toLowerCase()} skill trait "${updated.name}".`,
        actor,
      );
      return updated;
    }),
  );
  ipcMain.handle(
    "behaviour-skills:skill-traits:delete",
    authenticated((_event, id) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const trait = database.getSkillTraits().find((item) => item.id === id);
      const result = database.deleteSkillTrait(id);
      if (result.success) {
        authService?.audit(
          "Skill trait deleted",
          "Behaviour & Skills",
          trait
            ? `Soft-deleted ${trait.domain.toLowerCase()} skill trait "${trait.name}".`
            : "Soft-deleted a skill trait.",
          actor,
        );
      }
      return result;
    }),
  );

  ipcMain.handle(
    "behaviour-skills:behaviour-ratings:get",
    authenticated((_event, filter) => {
      requireRoles(["Owner", "Admin", "Teacher"]);
      return database.getBehaviourRatings(filter);
    }),
  );
  ipcMain.handle(
    "behaviour-skills:behaviour-ratings:save-bulk",
    authenticated((_event, records) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher"]);
      const securedRecords = Array.isArray(records)
        ? records.map((record) => ({
            ...record,
            ratedBy: actor?.name ?? "",
          }))
        : records;
      const saved = database.saveBehaviourRatingsBulk(securedRecords);
      authService?.audit(
        "Behaviour ratings saved",
        "Behaviour & Skills",
        `Saved ${saved.length} student behaviour rating(s).`,
        actor,
      );
      return saved;
    }),
  );

  ipcMain.handle(
    "behaviour-skills:skill-ratings:get",
    authenticated((_event, filter) => {
      requireRoles(["Owner", "Admin", "Teacher"]);
      return database.getSkillRatings(filter);
    }),
  );
  ipcMain.handle(
    "behaviour-skills:skill-ratings:save-bulk",
    authenticated((_event, records) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher"]);
      const securedRecords = Array.isArray(records)
        ? records.map((record) => ({
            ...record,
            ratedBy: actor?.name ?? "",
          }))
        : records;
      const saved = database.saveSkillRatingsBulk(securedRecords);
      authService?.audit(
        "Skill ratings saved",
        "Behaviour & Skills",
        `Saved ${saved.length} student skill rating(s).`,
        actor,
      );
      return saved;
    }),
  );

  ipcMain.handle(
    "behaviour-skills:observations:get",
    authenticated((_event, filter) => {
      requireRoles(["Owner", "Admin", "Teacher"]);
      return database.getStudentObservations(filter);
    }),
  );
  ipcMain.handle(
    "behaviour-skills:observations:create",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher"]);
      const created = database.createStudentObservation({
        ...input,
        createdBy: actor?.name ?? "",
      });
      authService?.audit(
        "Student observation created",
        "Behaviour & Skills",
        `Created ${created.observationType.toLowerCase()} observation for ${created.studentName}.`,
        actor,
      );
      return created;
    }),
  );
  ipcMain.handle(
    "behaviour-skills:observations:update",
    authenticated((_event, id, input) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher"]);
      const updated = database.updateStudentObservation(id, input);
      authService?.audit(
        "Student observation updated",
        "Behaviour & Skills",
        `Updated observation for ${updated.studentName}.`,
        actor,
      );
      return updated;
    }),
  );
  ipcMain.handle(
    "behaviour-skills:observations:delete",
    authenticated((_event, id) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const observation = database
        .getStudentObservations({})
        .find((item) => item.id === id);
      const result = database.deleteStudentObservation(id);
      if (result.success) {
        authService?.audit(
          "Student observation deleted",
          "Behaviour & Skills",
          observation
            ? `Soft-deleted observation for ${observation.studentName}.`
            : "Soft-deleted a student observation.",
          actor,
        );
      }
      return result;
    }),
  );

  ipcMain.handle(
    "academic-sessions:get-all",
    authenticated(() => {
      requireRoles(["Owner", "Admin", "Accountant", "Teacher"]);
      return database.getAcademicSessions();
    }),
  );
  ipcMain.handle(
    "academic-sessions:get-current",
    authenticated(() => {
      requireRoles(["Owner", "Admin", "Accountant", "Teacher"]);
      return database.getCurrentAcademicSession();
    }),
  );
  ipcMain.handle(
    "academic-sessions:create",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const created = database.createAcademicSession(input);
      authService?.audit(
        "Academic session created",
        "Academic Sessions",
        `Created academic session ${created.sessionName}.`,
        actor,
      );
      return created;
    }),
  );
  ipcMain.handle(
    "academic-sessions:update",
    authenticated((_event, id, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const updated = database.updateAcademicSession(id, input);
      authService?.audit(
        "Academic session updated",
        "Academic Sessions",
        `Updated academic session ${updated.sessionName}.`,
        actor,
      );
      return updated;
    }),
  );
  ipcMain.handle(
    "academic-sessions:set-current",
    authenticated((_event, id) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const current = database.setCurrentAcademicSession(id);
      authService?.audit(
        "Academic session set current",
        "Academic Sessions",
        `Set ${current.sessionName} as the current academic session.`,
        actor,
      );
      return current;
    }),
  );
  ipcMain.handle(
    "academic-sessions:close",
    authenticated((_event, id) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const closed = database.closeAcademicSession(id);
      authService?.audit(
        "Academic session closed",
        "Academic Sessions",
        `Closed academic session ${closed.sessionName}.`,
        actor,
      );
      return closed;
    }),
  );
  ipcMain.handle(
    "academic-sessions:delete",
    authenticated((_event, id) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const session = database
        .getAcademicSessions()
        .find((item) => item.id === id);
      const result = database.deleteAcademicSession(id);
      if (result.success) {
        authService?.audit(
          "Academic session deleted",
          "Academic Sessions",
          session
            ? `Soft-deleted academic session ${session.sessionName}.`
            : "Soft-deleted an academic session.",
          actor,
        );
      }
      return result;
    }),
  );
  ipcMain.handle(
    "academic-sessions:student-history:get",
    authenticated((_event, studentId) => {
      requireRoles(["Owner", "Admin", "Accountant", "Teacher"]);
      return database.getStudentSessionHistory(studentId);
    }),
  );
  ipcMain.handle(
    "academic-sessions:students:get",
    authenticated((_event, sessionId) => {
      requireRoles(["Owner", "Admin", "Accountant", "Teacher"]);
      return database.getSessionStudents(sessionId);
    }),
  );
  ipcMain.handle(
    "academic-sessions:student-history:save",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const history = database.createOrUpdateStudentSessionHistory(input);
      authService?.audit(
        "Student session history saved",
        "Academic Sessions",
        `Saved ${history.academicSessionName} history for ${history.studentName}.`,
        actor,
      );
      return history;
    }),
  );
  ipcMain.handle(
    "academic-sessions:promotion:preview",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const preview = database.getPromotionPreview(input);
      authService?.audit(
        "Promotion preview generated",
        "Academic Sessions",
        `Prepared ${preview.rows.length} student(s) from ${preview.fromSession.sessionName} to ${preview.toSession.sessionName}.`,
        actor,
      );
      return preview;
    }),
  );
  ipcMain.handle(
    "academic-sessions:promotion:run",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const promotion = database.promoteStudentsBulk({
        ...input,
        createdBy: actor?.name ?? "",
      });
      authService?.audit(
        "Students promoted",
        "Academic Sessions",
        `Completed ${promotion.promotionNo}: ${promotion.promotedCount} promoted, ${promotion.repeatedCount} repeated, ${promotion.tcCount} TC, ${promotion.leftCount} left.`,
        actor,
      );
      if (promotion.carryForwardDues > 0) {
        authService?.audit(
          "Carry forward dues created",
          "Academic Sessions",
          `Created carried dues totalling ${promotion.carryForwardDues} for ${promotion.promotionNo}.`,
          actor,
        );
      }
      return promotion;
    }),
  );
  ipcMain.handle(
    "academic-sessions:promotions:get-all",
    authenticated(() => {
      requireRoles(["Owner", "Admin", "Accountant", "Teacher"]);
      return database.getStudentPromotions();
    }),
  );
  ipcMain.handle(
    "academic-sessions:promotions:get-by-id",
    authenticated((_event, id) => {
      requireRoles(["Owner", "Admin", "Accountant", "Teacher"]);
      return database.getStudentPromotionById(id);
    }),
  );
  ipcMain.handle(
    "academic-sessions:promotion-report:get",
    authenticated((_event, filter) => {
      requireRoles(["Owner", "Admin", "Accountant", "Teacher"]);
      return database.getPromotionReport(filter);
    }),
  );
  ipcMain.handle(
    "academic-sessions:carry-forward:get",
    authenticated((_event, filter) => {
      requireRoles(["Owner", "Admin", "Accountant"]);
      return database.getCarryForwardDues(filter);
    }),
  );
  ipcMain.handle(
    "academic-sessions:carry-forward:update",
    authenticated((_event, id, input) => {
      const actor = requireRoles(["Owner", "Admin", "Accountant"]);
      const updated = database.updateCarryForwardDue(id, input);
      authService?.audit(
        "Carry forward due updated",
        "Academic Sessions",
        `Marked carried due for ${updated.studentName} as ${updated.status}.`,
        actor,
      );
      return updated;
    }),
  );
  ipcMain.handle(
    "academic-sessions:carry-forward:waive",
    authenticated((_event, id, reason) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const updated = database.waiveCarryForwardDue(id);
      authService?.audit(
        "Carry forward due waived",
        "Academic Sessions",
        `Waived carried due for ${updated.studentName}. Reason: ${String(reason ?? "").trim() || "Not provided"}.`,
        actor,
      );
      return updated;
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
    "school-rules:get",
    authenticated((_event, filter) => database.getSchoolRules(filter)),
  );
  ipcMain.handle(
    "school-rules:create",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const created = database.createSchoolRule({
        ...input,
        createdBy: actor.name,
      });
      authService?.audit(
        "Rule created",
        "Rules & Regulations",
        `Created rule "${created.title}".`,
        actor,
      );
      return created;
    }),
  );
  ipcMain.handle(
    "school-rules:update",
    authenticated((_event, id, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const updated = database.updateSchoolRule(id, input);
      authService?.audit(
        "Rule updated",
        "Rules & Regulations",
        `Updated rule "${updated.title}".`,
        actor,
      );
      return updated;
    }),
  );
  ipcMain.handle(
    "school-rules:delete",
    authenticated((_event, id) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const rule = database.getSchoolRules({}).find((item) => item.id === id);
      const result = database.deleteSchoolRule(id);
      if (result.success) {
        authService?.audit(
          "Rule deleted",
          "Rules & Regulations",
          rule ? `Soft-deleted rule "${rule.title}".` : "Soft-deleted a rule.",
          actor,
        );
      }
      return result;
    }),
  );
  ipcMain.handle(
    "school-rules:reorder",
    authenticated((_event, records) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const rows = database.reorderSchoolRules(records);
      authService?.audit(
        "Rules reordered",
        "Rules & Regulations",
        "Updated school rule display order.",
        actor,
      );
      return rows;
    }),
  );
  ipcMain.handle(
    "preferences:app:get",
    authenticated(() => database.getAppPreferences()),
  );
  ipcMain.handle(
    "preferences:app:update",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const updated = database.updateAppPreferences(input);
      authService?.audit(
        "Application preferences updated",
        "Theme & Language",
        `Updated defaults to ${updated.themeMode}, ${updated.accentColor}, ${updated.language}.`,
        actor,
      );
      return updated;
    }),
  );
  ipcMain.handle(
    "preferences:user:get",
    authenticated(() => {
      const user = requireAuthenticated();
      return database.getUserPreferences(user.id);
    }),
  );
  ipcMain.handle(
    "preferences:user:update",
    authenticated((_event, input) => {
      const user = requireAuthenticated();
      return database.updateUserPreferences(user.id, input);
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
        auditUser: actor,
      });
      authService?.audit(
        "Fee payment created",
        "Fees",
        `Created receipt ${created.receiptNo} for ${created.studentName}.`,
        actor,
      );
      const accountTransaction = database.getAccountTransactionByLink(
        "Fees",
        created.id,
      );
      if (accountTransaction) {
        authService?.audit(
          "Automatic fee income transaction created",
          "Accounts",
          `Created ${accountTransaction.transactionNo} from ${created.receiptNo}.`,
          actor,
        );
      }
      return created;
    }),
  );

  ipcMain.handle(
    "fees:reverse-payment",
    authenticated((_event, id, reason) => {
      const actor = requireRoles(["Owner", "Admin"]);
      return database.reverseFeePayment(
        id,
        reason,
        actor?.name ?? "",
        actor,
      );
    }),
  );

  ipcMain.handle(
    "discount-types:get-all",
    authenticated(() => {
      requireRoles(["Owner", "Admin", "Accountant"]);
      return database.getDiscountTypes();
    }),
  );
  ipcMain.handle(
    "discount-types:create",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      return database.createDiscountType({ ...input, auditUser: actor });
    }),
  );
  ipcMain.handle(
    "discount-types:update",
    authenticated((_event, id, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      return database.updateDiscountType(id, { ...input, auditUser: actor });
    }),
  );
  ipcMain.handle(
    "discount-types:delete",
    authenticated((_event, id) => {
      const actor = requireRoles(["Owner", "Admin"]);
      return database.deleteDiscountType(id, actor);
    }),
  );

  ipcMain.handle(
    "student-discounts:get",
    authenticated((_event, filter) => {
      requireRoles(["Owner", "Admin", "Accountant"]);
      return database.getStudentDiscounts(filter);
    }),
  );
  ipcMain.handle(
    "student-discounts:create",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      return database.createStudentDiscount({ ...input, auditUser: actor });
    }),
  );
  ipcMain.handle(
    "student-discounts:update",
    authenticated((_event, id, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      return database.updateStudentDiscount(id, { ...input, auditUser: actor });
    }),
  );
  ipcMain.handle(
    "student-discounts:delete",
    authenticated((_event, id) => {
      const actor = requireRoles(["Owner", "Admin"]);
      return database.deleteStudentDiscount(id, actor);
    }),
  );

  ipcMain.handle(
    "fee-invoices:preview",
    authenticated((_event, input) => {
      requireRoles(["Owner", "Admin", "Accountant"]);
      return database.getFeeInvoicePreview(input);
    }),
  );
  ipcMain.handle(
    "fee-invoices:create",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin", "Accountant"]);
      return database.createFeeInvoice({
        ...input,
        generatedBy: actor?.name ?? "",
        auditUser: actor,
      });
    }),
  );
  ipcMain.handle(
    "fee-invoices:get-all",
    authenticated((_event, filter) => {
      requireRoles(["Owner", "Admin", "Accountant"]);
      return database.getFeeInvoices(filter);
    }),
  );
  ipcMain.handle(
    "fee-invoices:get-by-id",
    authenticated((_event, id) => {
      requireRoles(["Owner", "Admin", "Accountant"]);
      return database.getFeeInvoiceById(id);
    }),
  );
  ipcMain.handle(
    "fee-invoices:cancel",
    authenticated((_event, id, reason) => {
      const actor = requireRoles(["Owner", "Admin"]);
      return database.cancelFeeInvoice(
        id,
        reason,
        actor?.name ?? "",
        actor,
      );
    }),
  );
  ipcMain.handle(
    "fee-invoices:refresh-status",
    authenticated((_event, id) => {
      requireRoles(["Owner", "Admin", "Accountant"]);
      return database.refreshFeeInvoiceStatus(id);
    }),
  );
  ipcMain.handle(
    "fee-invoices:allocate-payment",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin", "Accountant"]);
      return database.allocateFeePaymentToInvoices({
        ...input,
        auditUser: actor,
      });
    }),
  );
  ipcMain.handle(
    "fee-invoices:outstanding-by-student",
    authenticated((_event, studentId) => {
      requireRoles(["Owner", "Admin", "Accountant"]);
      return database.getStudentOutstandingInvoices(studentId);
    }),
  );
  ipcMain.handle(
    "fee-invoices:summary",
    authenticated((_event, filter) => {
      requireRoles(["Owner", "Admin", "Accountant"]);
      return database.getFeeInvoiceSummary(filter);
    }),
  );
  ipcMain.handle(
    "fee-invoices:accounts-report",
    authenticated((_event, filter) => {
      requireRoles(["Owner", "Admin", "Accountant"]);
      return database.getFeeInvoiceAccountsReport(filter);
    }),
  );
  ipcMain.handle(
    "fee-invoices:student-ledger",
    authenticated((_event, studentId) => {
      requireRoles(["Owner", "Admin", "Accountant"]);
      return database.getStudentFeeLedger(studentId);
    }),
  );

  ipcMain.handle(
    "fee-invoice-account-mappings:get-all",
    authenticated(() => {
      requireRoles(["Owner", "Admin", "Accountant"]);
      return database.getFeeInvoiceAccountMappings();
    }),
  );
  ipcMain.handle(
    "fee-invoice-account-mappings:save",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      return database.saveFeeInvoiceAccountMapping({ ...input, auditUser: actor });
    }),
  );
  ipcMain.handle(
    "fee-invoice-account-mappings:delete",
    authenticated((_event, id) => {
      const actor = requireRoles(["Owner", "Admin"]);
      return database.deleteFeeInvoiceAccountMapping(id, actor);
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
    "employee-attendance:get-by-date",
    authenticated((_event, date, filters) => {
      requireRoles(["Owner", "Admin", "Accountant"]);
      return database.getEmployeeAttendanceByDate(date, filters);
    }),
  );
  ipcMain.handle(
    "employee-attendance:get-by-range",
    authenticated((_event, filter) => {
      requireRoles(["Owner", "Admin", "Accountant"]);
      return database.getEmployeeAttendanceByRange(filter);
    }),
  );
  ipcMain.handle(
    "employee-attendance:save-bulk",
    authenticated((_event, records) => {
      const actor = requireRoles(["Owner", "Admin"]);
      const saved = database.saveEmployeeAttendanceBulk(
        records,
        actor?.name ?? "",
        actor,
      );
      authService?.audit(
        "Employee attendance bulk saved",
        "Employee Attendance",
        `Saved ${saved.length} employee attendance record(s).`,
        actor,
      );
      return saved;
    }),
  );
  ipcMain.handle(
    "employee-attendance:update",
    authenticated((_event, id, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      return database.updateEmployeeAttendance(
        id,
        input,
        actor?.name ?? "",
        actor,
      );
    }),
  );
  ipcMain.handle(
    "employee-attendance:summary",
    authenticated((_event, filter) => {
      requireRoles(["Owner", "Admin", "Accountant"]);
      return database.getEmployeeAttendanceSummary(filter);
    }),
  );
  ipcMain.handle(
    "employee-attendance:monthly",
    authenticated((_event, employeeId, month) => {
      requireRoles(["Owner", "Admin", "Accountant"]);
      return database.getEmployeeMonthlyAttendance(employeeId, month);
    }),
  );
  ipcMain.handle(
    "employee-attendance:report",
    authenticated((_event, filter) => {
      const actor = requireRoles(["Owner", "Admin", "Accountant"]);
      return database.getEmployeeAttendanceReport(filter, actor);
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
    "exam-schedules:get-all",
    authenticated((_event, filter) => {
      requireRoles(["Owner", "Admin", "Teacher", "Viewer"]);
      return database.getExamSchedules(filter);
    }),
  );
  ipcMain.handle(
    "exam-schedules:get-by-id",
    authenticated((_event, id) => {
      requireRoles(["Owner", "Admin", "Teacher", "Viewer"]);
      return database.getExamSchedule(id);
    }),
  );
  ipcMain.handle(
    "exam-schedules:create",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher"]);
      return database.createExamSchedule(input, actor);
    }),
  );
  ipcMain.handle(
    "exam-schedules:update",
    authenticated((_event, id, input) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher"]);
      return database.updateExamSchedule(id, input, actor);
    }),
  );
  ipcMain.handle(
    "exam-schedules:delete",
    authenticated((_event, id) => {
      const actor = requireRoles(["Owner", "Admin"]);
      return database.deleteExamSchedule(id, actor);
    }),
  );
  ipcMain.handle(
    "exam-schedules:publish",
    authenticated((_event, id) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher"]);
      return database.publishExamSchedule(id, actor);
    }),
  );
  ipcMain.handle(
    "exam-schedules:cancel",
    authenticated((_event, id) => {
      const actor = requireRoles(["Owner", "Admin"]);
      return database.cancelExamSchedule(id, actor);
    }),
  );
  ipcMain.handle(
    "exam-schedules:complete",
    authenticated((_event, id) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher"]);
      return database.completeExamSchedule(id, actor);
    }),
  );
  ipcMain.handle(
    "exam-schedules:entries:get",
    authenticated((_event, scheduleId) => {
      requireRoles(["Owner", "Admin", "Teacher", "Viewer"]);
      return database.getExamScheduleEntries(scheduleId);
    }),
  );
  ipcMain.handle(
    "exam-schedules:entries:save",
    authenticated((_event, scheduleId, entries) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher"]);
      return database.saveExamScheduleEntries(scheduleId, entries, actor);
    }),
  );
  ipcMain.handle(
    "exam-schedules:conflicts",
    authenticated((_event, input) => {
      requireRoles(["Owner", "Admin", "Teacher"]);
      return database.detectExamScheduleConflicts(input);
    }),
  );
  ipcMain.handle(
    "date-sheet:get",
    authenticated((_event, filter) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher", "Viewer", "Student"]);
      let scopedFilter = filter;
      if (actor?.role === "Student" || actor?.accountType === "Student") {
        const portalData = authService.getCurrentStudentPortalData();
        scopedFilter = {
          ...filter,
          className: portalData.student.className,
          section: portalData.student.section,
        };
      }
      const result = database.getDateSheet(scopedFilter);
      authService?.audit(
        "Date sheet generated",
        "Exams",
        "Generated a date sheet view.",
      );
      return result;
    }),
  );
  ipcMain.handle(
    "result-sheet:get",
    authenticated((_event, filter) => {
      requireRoles(["Owner", "Admin", "Teacher", "Viewer"]);
      const result = database.getResultSheet(filter);
      authService?.audit(
        "Result sheet generated",
        "Exams",
        "Generated a result sheet view.",
      );
      return result;
    }),
  );
  ipcMain.handle(
    "blank-award-list:get",
    authenticated((_event, filter) => {
      requireRoles(["Owner", "Admin", "Teacher"]);
      const result = database.getBlankAwardList(filter);
      authService?.audit(
        "Blank award list generated",
        "Exams",
        "Generated a blank award list.",
      );
      return result;
    }),
  );

  ipcMain.handle(
    "grading-schemes:get-all",
    authenticated(() => {
      requireRoles(["Owner", "Admin", "Teacher", "Accountant", "Viewer"]);
      return database.getGradingSchemes();
    }),
  );
  ipcMain.handle(
    "grading-schemes:get-by-id",
    authenticated((_event, id) => {
      requireRoles(["Owner", "Admin", "Teacher", "Accountant", "Viewer"]);
      return database.getGradingSchemeById(id);
    }),
  );
  ipcMain.handle(
    "grading-schemes:create",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      return database.createGradingScheme({ ...input, auditUser: actor });
    }),
  );
  ipcMain.handle(
    "grading-schemes:update",
    authenticated((_event, id, input) => {
      const actor = requireRoles(["Owner", "Admin"]);
      return database.updateGradingScheme(id, { ...input, auditUser: actor });
    }),
  );
  ipcMain.handle(
    "grading-schemes:delete",
    authenticated((_event, id) => {
      const actor = requireRoles(["Owner", "Admin"]);
      return database.deleteGradingScheme(id, actor);
    }),
  );
  ipcMain.handle(
    "grading-schemes:set-default",
    authenticated((_event, id) => {
      const actor = requireRoles(["Owner", "Admin"]);
      return database.setDefaultGradingScheme(id, actor);
    }),
  );
  ipcMain.handle(
    "grading-schemes:calculate",
    authenticated((_event, input) => {
      requireRoles(["Owner", "Admin", "Teacher", "Accountant", "Viewer"]);
      return database.calculateGrade(input);
    }),
  );

  ipcMain.handle(
    "report-card-templates:get-all",
    authenticated(() => {
      requireRoles(["Owner", "Admin", "Teacher", "Accountant", "Viewer"]);
      return database.getReportCardTemplates();
    }),
  );
  ipcMain.handle(
    "report-card-templates:create",
    authenticated((_event, input) => {
      requireRoles(["Owner", "Admin"]);
      return database.createReportCardTemplate(input);
    }),
  );
  ipcMain.handle(
    "report-card-templates:update",
    authenticated((_event, id, input) => {
      requireRoles(["Owner", "Admin"]);
      return database.updateReportCardTemplate(id, input);
    }),
  );
  ipcMain.handle(
    "report-card-templates:delete",
    authenticated((_event, id) => {
      requireRoles(["Owner", "Admin"]);
      return database.deleteReportCardTemplate(id);
    }),
  );

  ipcMain.handle(
    "report-cards:preview",
    authenticated((_event, input) => {
      requireRoles(["Owner", "Admin", "Teacher", "Accountant", "Viewer"]);
      return database.getReportCardPreview(input);
    }),
  );
  ipcMain.handle(
    "report-cards:generate",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher"]);
      return database.generateStudentReportCard({ ...input, auditUser: actor });
    }),
  );
  ipcMain.handle(
    "report-cards:generate-class",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher"]);
      return database.generateClassReportCards({ ...input, auditUser: actor });
    }),
  );
  ipcMain.handle(
    "report-cards:get-all",
    authenticated((_event, filter) => {
      requireRoles(["Owner", "Admin", "Teacher", "Accountant", "Viewer"]);
      return database.getStudentReportCards(filter);
    }),
  );
  ipcMain.handle(
    "report-cards:get-by-id",
    authenticated((_event, id) => {
      requireRoles(["Owner", "Admin", "Teacher", "Accountant", "Viewer"]);
      return database.getStudentReportCardById(id);
    }),
  );
  ipcMain.handle(
    "report-cards:update-remarks",
    authenticated((_event, id, input) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher"]);
      return database.updateReportCardRemarks(id, { ...input, auditUser: actor });
    }),
  );
  ipcMain.handle(
    "report-cards:delete",
    authenticated((_event, id) => {
      const actor = requireRoles(["Owner", "Admin"]);
      return database.deleteReportCard(id, actor);
    }),
  );
  ipcMain.handle(
    "report-cards:class-summary",
    authenticated((_event, filter) => {
      requireRoles(["Owner", "Admin", "Teacher", "Accountant", "Viewer"]);
      return database.getClassResultSummary(filter);
    }),
  );
  ipcMain.handle(
    "report-cards:positions",
    authenticated((_event, filter) => {
      requireRoles(["Owner", "Admin", "Teacher", "Accountant", "Viewer"]);
      return database.getResultPositions(filter);
    }),
  );

  ipcMain.handle(
    "reports:student-progress",
    authenticated((_event, filter) => {
      requireRoles(["Owner", "Admin", "Teacher", "Viewer"]);
      const result = database.getStudentProgressReport(filter);
      authService?.audit(
        "Student progress report generated",
        "Reports",
        "Generated a student progress report.",
      );
      return result;
    }),
  );
  ipcMain.handle(
    "reports:custom-domains",
    authenticated(() => {
      requireRoles(["Owner", "Admin", "Accountant", "Teacher", "Viewer"]);
      return database.getCustomReportDomains();
    }),
  );
  ipcMain.handle(
    "reports:custom-preview",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin", "Accountant", "Teacher", "Viewer"]);
      return database.previewCustomReport(input, actor);
    }),
  );
  ipcMain.handle(
    "reports:saved-definitions:get",
    authenticated(() => {
      const actor = requireRoles(["Owner", "Admin", "Accountant", "Teacher", "Viewer"]);
      return database.getSavedReportDefinitions(actor);
    }),
  );
  ipcMain.handle(
    "reports:saved-definitions:save",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin", "Accountant", "Teacher"]);
      return database.saveReportDefinition(input, actor);
    }),
  );
  ipcMain.handle(
    "reports:saved-definitions:delete",
    authenticated((_event, id) => {
      const actor = requireRoles(["Owner", "Admin"]);
      return database.deleteReportDefinition(id, actor);
    }),
  );

  ipcMain.handle(
    "live-classes:get-all",
    authenticated((_event, filter) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher", "Viewer", "Student"]);
      if (actor?.role === "Student" || actor?.accountType === "Student") {
        const portalData = authService.getCurrentStudentPortalData();
        return database
          .getLiveClasses({
            ...filter,
            className: portalData.student.className,
            section: portalData.student.section,
          })
          .filter((item) => item.status !== "Draft");
      }
      const liveClasses = database.getLiveClasses(filter);
      if (actor?.role === "Teacher") {
        const employee = getCurrentEmployeeForScope();
        return liveClasses.filter(
          (item) => item.teacherEmployeeId === employee.id,
        );
      }
      return liveClasses;
    }),
  );
  ipcMain.handle(
    "live-classes:get-by-id",
    authenticated((_event, id) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher", "Viewer", "Student"]);
      const liveClass = database.getLiveClass(id);
      if (
        (actor?.role === "Student" || actor?.accountType === "Student") &&
        liveClass
      ) {
        const portalData = authService.getCurrentStudentPortalData();
        if (
          liveClass.status === "Draft" ||
          liveClass.className !== portalData.student.className ||
          (liveClass.section && liveClass.section !== portalData.student.section)
        ) {
          throw new Error("You are not authorized to view this live class.");
        }
      }
      if (actor?.role === "Teacher") {
        assertTeacherOwnsLiveClass(actor, liveClass);
      }
      return liveClass;
    }),
  );
  ipcMain.handle(
    "live-classes:create",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher"]);
      const scopedInput = { ...input };
      if (actor?.role === "Teacher") {
        const employee = getCurrentEmployeeForScope();
        scopedInput.teacherEmployeeId = employee.id;
        scopedInput.teacherName = employee.name;
      }
      return database.createLiveClass({ ...scopedInput, auditUser: actor, createdBy: actor?.name });
    }),
  );
  ipcMain.handle(
    "live-classes:update",
    authenticated((_event, id, input) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher"]);
      const existing = database.getLiveClass(id);
      const employee = assertTeacherOwnsLiveClass(actor, existing);
      const scopedInput = { ...input };
      if (employee) {
        scopedInput.teacherEmployeeId = employee.id;
        scopedInput.teacherName = employee.name;
      }
      return database.updateLiveClass(id, { ...scopedInput, auditUser: actor });
    }),
  );
  ipcMain.handle(
    "live-classes:set-status",
    authenticated((_event, id, status) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher"]);
      assertTeacherOwnsLiveClass(actor, database.getLiveClass(id));
      return database.setLiveClassStatus(id, status, actor);
    }),
  );
  ipcMain.handle(
    "live-classes:attendance:save",
    authenticated((_event, liveClassId, records) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher"]);
      assertTeacherOwnsLiveClass(actor, database.getLiveClass(liveClassId));
      return database.saveLiveClassAttendance(liveClassId, records, actor);
    }),
  );
  ipcMain.handle(
    "live-classes:notification-preview",
    authenticated((_event, liveClassId, input) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher"]);
      const { liveClass, preview, variables } = buildLiveClassNotificationPayload(
        actor,
        liveClassId,
        input,
      );
      return {
        liveClassId: liveClass.id,
        title: liveClass.title,
        audienceSummary: `${liveClass.className}${liveClass.section ? `-${liveClass.section}` : ""}`,
        recipientCount: preview.validCount,
        skippedCount: preview.missingCount,
        preview,
        variables,
      };
    }),
  );
  ipcMain.handle(
    "live-classes:notify",
    authenticated(async (_event, liveClassId, input = {}) => {
      const actor = requireRoles(["Owner", "Admin", "Teacher"]);
      const { liveClass, preview, variables } = buildLiveClassNotificationPayload(
        actor,
        liveClassId,
        input,
      );
      if (!preview.candidates.length) {
        throw new Error("No valid guardian or student phone numbers were found.");
      }
      const channels = [];
      if (input.whatsapp) {
        channels.push({
          channel: "WhatsApp",
          templateId: input.whatsappTemplateId,
        });
      }
      if (input.sms) {
        channels.push({
          channel: "SMS",
          templateId: input.smsTemplateId,
        });
      }
      if (!channels.length) {
        throw new Error("Select WhatsApp or SMS before notifying recipients.");
      }
      const results = [];
      for (const item of channels) {
        if (!item.templateId) {
          throw new Error(`${item.channel} template is required.`);
        }
        const result = await communicationService.sendExternalBatch(actor, {
          channel: item.channel,
          templateId: item.templateId,
          title: `Live Class: ${liveClass.title}`,
          audienceType: "Live Class",
          recipients: preview.candidates.map((candidate) => ({
            ...candidate,
            variables: {
              ...variables,
              student_name:
                candidate.studentName ||
                candidate.name ||
                "Student",
            },
          })),
          variables,
          idempotencyKey: `${liveClass.id}:${item.channel}:${item.templateId}:${preview.validCount}`,
        });
        results.push({ channel: item.channel, ...result });
      }
      authService?.audit(
        "Live class notification queued",
        "Live Class",
        `Queued ${results.length} channel(s) for ${preview.validCount} recipient(s).`,
        actor,
      );
      return {
        liveClassId: liveClass.id,
        recipientCount: preview.validCount,
        skippedCount: preview.missingCount,
        results,
      };
    }),
  );

  ipcMain.handle(
    "store:categories:get-all",
    authenticated(() => {
      requireRoles(["Owner", "Admin", "Accountant", "Viewer"]);
      return database.getStoreCategories();
    }),
  );
  ipcMain.handle(
    "store:categories:save",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin", "Accountant"]);
      const result = database.saveStoreCategory(input);
      authService?.audit("Store category saved", "Store", "Saved a store category.", actor);
      return result;
    }),
  );
  ipcMain.handle(
    "store:tax-rates:get-all",
    authenticated(() => {
      requireRoles(["Owner", "Admin", "Accountant", "Viewer"]);
      return database.getStoreTaxRates();
    }),
  );
  ipcMain.handle(
    "store:tax-rates:save",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin", "Accountant"]);
      const result = database.saveStoreTaxRate(input);
      authService?.audit("Store tax rate saved", "Store", "Saved a store tax rate.", actor);
      return result;
    }),
  );
  ipcMain.handle(
    "store:products:get-all",
    authenticated((_event, filter) => {
      requireRoles(["Owner", "Admin", "Accountant", "Viewer"]);
      return database.getStoreProducts(filter);
    }),
  );
  ipcMain.handle(
    "store:products:save",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin", "Accountant"]);
      const result = database.saveStoreProduct(input);
      authService?.audit("Store product saved", "Store", "Saved a store product.", actor);
      return result;
    }),
  );
  ipcMain.handle(
    "store:account-mappings:get",
    authenticated(() => {
      requireRoles(["Owner", "Admin", "Accountant", "Viewer"]);
      return database.getStoreAccountMappings();
    }),
  );
  ipcMain.handle(
    "store:account-mappings:save",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin", "Accountant"]);
      return database.saveStoreAccountMapping(input, actor);
    }),
  );
  ipcMain.handle(
    "store:inventory:create-transaction",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin", "Accountant"]);
      return database.createStoreInventoryTransaction(input, actor);
    }),
  );
  ipcMain.handle(
    "store:inventory:ledger",
    authenticated((_event, filter) => {
      requireRoles(["Owner", "Admin", "Accountant", "Viewer"]);
      return database.getStoreInventoryLedger(filter);
    }),
  );
  ipcMain.handle(
    "store:orders:get-all",
    authenticated((_event, filter) => {
      requireRoles(["Owner", "Admin", "Accountant", "Viewer"]);
      return database.getStoreOrders(filter);
    }),
  );
  ipcMain.handle(
    "store:orders:create",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin", "Accountant"]);
      return database.createStoreOrder(input, actor);
    }),
  );
  ipcMain.handle(
    "store:orders:resume-held",
    authenticated((_event, id, input) => {
      const actor = requireRoles(["Owner", "Admin", "Accountant"]);
      return database.resumeHeldStoreOrder(id, input, actor);
    }),
  );
  ipcMain.handle(
    "store:orders:cancel-held",
    authenticated((_event, id, reason) => {
      const actor = requireRoles(["Owner", "Admin", "Accountant"]);
      return database.cancelHeldStoreOrder(id, reason, actor);
    }),
  );
  ipcMain.handle(
    "store:orders:reverse",
    authenticated((_event, id, reason) => {
      const actor = requireRoles(["Owner", "Admin"]);
      return database.reverseStoreOrder(id, reason, actor);
    }),
  );
  ipcMain.handle(
    "store:sessions:get-current",
    authenticated(() => {
      const actor = requireRoles(["Owner", "Admin", "Accountant"]);
      return database.getCurrentStorePosSession(actor);
    }),
  );
  ipcMain.handle(
    "store:sessions:get-all",
    authenticated((_event, filter) => {
      const actor = requireRoles(["Owner", "Admin", "Accountant", "Viewer"]);
      return database.getStorePosSessions(filter, actor);
    }),
  );
  ipcMain.handle(
    "store:sessions:open",
    authenticated((_event, input) => {
      const actor = requireRoles(["Owner", "Admin", "Accountant"]);
      return database.openStorePosSession(input, actor);
    }),
  );
  ipcMain.handle(
    "store:sessions:close",
    authenticated((_event, id, input) => {
      const actor = requireRoles(["Owner", "Admin", "Accountant"]);
      return database.closeStorePosSession(id, input, actor);
    }),
  );
  ipcMain.handle(
    "store:reports:get",
    authenticated((_event, filter) => {
      requireRoles(["Owner", "Admin", "Accountant", "Viewer"]);
      return database.getStoreReports(filter);
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

  if (communicationService) {
    ipcMain.handle(
      "communications:configure-gateway",
      authenticated((_event, input) => {
        const actor = requireRoles(["Owner", "Admin"]);
        const result = communicationService.configureCommunicationGateway(input);
        authService?.audit(
          "Communication gateway configured",
          "External Communications",
          `Gateway URL configured. Token ${input?.deviceToken ? "replaced" : "unchanged"}.`,
          actor,
        );
        return result;
      }),
    );
    ipcMain.handle(
      "communications:get-configuration",
      authenticated(() => {
        requireRoles(["Owner", "Admin"]);
        return communicationService.getCommunicationGatewayConfiguration();
      }),
    );
    ipcMain.handle(
      "communications:remove-token",
      authenticated(() => {
        const actor = requireRoles(["Owner", "Admin"]);
        const result = communicationService.removeCommunicationGatewayToken();
        authService?.audit(
          "Communication token removed",
          "External Communications",
          "Local encrypted communication token was removed.",
          actor,
        );
        return result;
      }),
    );
    ipcMain.handle(
      "communications:get-status",
      authenticated(() => {
        requireRoles(["Owner", "Admin", "Accountant", "Teacher", "Viewer"]);
        return communicationService.getCommunicationIntegrationStatus();
      }),
    );
    ipcMain.handle(
      "communications:test-gateway",
      authenticated(() => {
        requireRoles(["Owner", "Admin"]);
        return communicationService.testCommunicationGateway();
      }),
    );
    ipcMain.handle(
      "communications:get-templates",
      authenticated((_event, channel) => {
        requireRoles(["Owner", "Admin", "Accountant", "Teacher"]);
        return communicationService.getCommunicationTemplates(channel);
      }),
    );
    ipcMain.handle(
      "communications:preview-recipients",
      authenticated((_event, input) => {
        const actor = requireRoles(["Owner", "Admin", "Accountant", "Teacher"]);
        return communicationService.getExternalRecipientPreview(actor, input);
      }),
    );
    ipcMain.handle(
      "communications:send",
      authenticated((_event, input) => {
        const actor = requireRoles(["Owner", "Admin", "Accountant", "Teacher"]);
        return communicationService.sendExternalMessage(actor, input);
      }),
    );
    ipcMain.handle(
      "communications:send-batch",
      authenticated((_event, input) => {
        const actor = requireRoles(["Owner", "Admin", "Accountant", "Teacher"]);
        return communicationService.sendExternalBatch(actor, input);
      }),
    );
    ipcMain.handle(
      "communications:get-jobs",
      authenticated((_event, filter) => {
        requireRoles(["Owner", "Admin", "Accountant", "Teacher", "Viewer"]);
        return communicationService.getCommunicationJobs(filter);
      }),
    );
    ipcMain.handle(
      "communications:get-job",
      authenticated((_event, id) => {
        requireRoles(["Owner", "Admin", "Accountant", "Teacher", "Viewer"]);
        return communicationService.getCommunicationJob(id);
      }),
    );
    ipcMain.handle(
      "communications:retry-job",
      authenticated((_event, id) => {
        const actor = requireRoles(["Owner", "Admin"]);
        return communicationService.retryCommunicationJob(actor, id);
      }),
    );
  }

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
