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
