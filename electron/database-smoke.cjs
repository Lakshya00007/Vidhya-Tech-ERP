const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const Database = require("better-sqlite3");
const { app, BrowserWindow } = require("electron");
const {
  applyPendingDatabaseRestore,
  createBackupService,
  getRestorePaths,
  validateDatabaseFile,
} = require("./backup.cjs");
const { createAuthService } = require("./auth.cjs");
const { createDatabase } = require("./database.cjs");
const { registerIpcHandlers } = require("./ipc.cjs");
const {
  createDeviceIdService,
  createLicenseService,
} = require("./license.cjs");
const {
  createLicenseKey,
} = require("../scripts/generate-license.cjs");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

app.whenReady().then(async () => {
  const temporaryDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "school-erp-db-smoke-"),
  );
  const databasePath = path.join(temporaryDirectory, "school-erp.db");

  try {
    const legacyDatabase = new Database(databasePath);
    legacyDatabase.exec(`
      CREATE TABLE fee_payments (
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
        sync_status TEXT DEFAULT 'pending'
      );

      CREATE TABLE attendance (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        student_name TEXT NOT NULL,
        class_name TEXT NOT NULL,
        section TEXT,
        attendance_date TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT,
        updated_at TEXT,
        sync_status TEXT DEFAULT 'pending'
      );
    `);
    legacyDatabase.close();

    let database = createDatabase(databasePath);
    const installationDirectory = path.join(
      temporaryDirectory,
      "device-identity",
    );
    const deviceIdService = createDeviceIdService({
      userDataPath: installationDirectory,
      platform: "test",
    });
    const firstDeviceId = deviceIdService.getDeviceId();
    const secondDeviceId = deviceIdService.getDeviceId();
    const restartedDeviceId = createDeviceIdService({
      userDataPath: installationDirectory,
      platform: "test",
    }).getDeviceId();
    assert(
      /^VSE-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/.test(firstDeviceId) &&
        firstDeviceId === secondDeviceId &&
        firstDeviceId === restartedDeviceId,
      "Device ID generation was not stable.",
    );

    const { privateKey: testPrivateKey, publicKey: testPublicKey } =
      crypto.generateKeyPairSync("ed25519");
    const testPublicKeyPath = path.join(
      temporaryDirectory,
      "test-license-public-key.pem",
    );
    fs.writeFileSync(
      testPublicKeyPath,
      testPublicKey.export({ type: "spki", format: "pem" }),
    );
    const testNow = new Date("2026-07-03T12:00:00.000Z");
    const licenseService = createLicenseService({
      database,
      deviceIdService,
      publicKeyPath: testPublicKeyPath,
      now: () => new Date(testNow),
    });
    assert(
      licenseService.getLicenseStatus().status === "missing",
      "Fresh database did not report a missing license.",
    );
    const validLicenseKey = createLicenseKey(
      {
        licenseId: "LIC-SMOKE-001",
        schoolName: "Persistence Test School",
        deviceId: firstDeviceId,
        plan: "Test",
        issuedAt: "2026-07-01T00:00:00.000Z",
        expiresAt: "2027-07-03T23:59:59.999Z",
        maintenanceUntil: "2027-07-03T23:59:59.999Z",
        maxUsers: 10,
        features: ["all"],
      },
      testPrivateKey,
    );
    const expiredLicenseKey = createLicenseKey(
      {
        licenseId: "LIC-SMOKE-EXPIRED",
        schoolName: "Expired Test School",
        deviceId: firstDeviceId,
        plan: "Test",
        issuedAt: "2025-07-01T00:00:00.000Z",
        expiresAt: "2026-07-02T23:59:59.999Z",
        maintenanceUntil: "2026-07-02T23:59:59.999Z",
        maxUsers: 10,
        features: ["all"],
      },
      testPrivateKey,
    );
    const maintenanceExpiredLicenseKey = createLicenseKey(
      {
        licenseId: "LIC-SMOKE-MAINTENANCE",
        schoolName: "Maintenance Test School",
        deviceId: firstDeviceId,
        plan: "Perpetual",
        issuedAt: "2025-07-01T00:00:00.000Z",
        expiresAt: "2027-07-03T23:59:59.999Z",
        maintenanceUntil: "2026-07-02T23:59:59.999Z",
        maxUsers: 10,
        features: ["all"],
      },
      testPrivateKey,
    );
    const maintenanceStatus = licenseService.verifyLicenseKey(
      maintenanceExpiredLicenseKey,
    );
    assert(
      maintenanceStatus.isValid &&
        maintenanceStatus.status === "maintenance-expired",
      "Expired maintenance incorrectly blocked a valid license.",
    );
    const wrongDeviceLicenseKey = createLicenseKey(
      {
        licenseId: "LIC-SMOKE-OTHER-DEVICE",
        schoolName: "Other Device School",
        deviceId: "VSE-0000-0000-0000",
        plan: "Test",
        issuedAt: "2026-07-01T00:00:00.000Z",
        expiresAt: "2027-07-03T23:59:59.999Z",
        maintenanceUntil: "2027-07-03T23:59:59.999Z",
        maxUsers: 10,
        features: ["all"],
      },
      testPrivateKey,
    );
    let wrongDeviceLicenseRejected = false;
    try {
      licenseService.activateLicense(wrongDeviceLicenseKey);
    } catch {
      wrongDeviceLicenseRejected = true;
    }
    assert(
      wrongDeviceLicenseRejected,
      "A license for another device was accepted.",
    );
    let invalidLicenseRejected = false;
    try {
      const licenseParts = validLicenseKey.split(".");
      const signature = licenseParts[2];
      const replacementCharacter = signature.startsWith("A") ? "B" : "A";
      licenseParts[2] = `${replacementCharacter}${signature.slice(1)}`;
      licenseService.activateLicense(
        licenseParts.join("."),
      );
    } catch {
      invalidLicenseRejected = true;
    }
    assert(invalidLicenseRejected, "Invalid license signature was accepted.");
    let expiredLicenseRejected = false;
    try {
      licenseService.activateLicense(expiredLicenseKey);
    } catch {
      expiredLicenseRejected = true;
    }
    assert(expiredLicenseRejected, "Expired license was accepted.");

    const authService = createAuthService(database);
    const backupService = createBackupService({
      app,
      databasePath,
      getDatabase: () => database,
      closeDatabase: () => database?.close(),
    });
    const unregisterIpcHandlers = registerIpcHandlers(
      database,
      backupService,
      authService,
      licenseService,
    );
    const window = new BrowserWindow({
      show: false,
      webPreferences: {
        preload: path.join(__dirname, "preload.cjs"),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    await window.loadURL("data:text/html,<html><body>ERP IPC smoke test</body></html>");
    const bridgeResult = await window.webContents.executeJavaScript(`
      (async () => {
        const attendanceApiAvailable =
          typeof window.erpApi.getAttendanceByClassDate === "function";
        const backupApiAvailable = [
          "createDatabaseBackup",
          "restoreDatabaseBackup",
          "getDatabaseInfo",
          "openDatabaseFolder",
          "restartApp"
        ].every((method) => typeof window.erpApi[method] === "function");
        const authApiAvailable = [
          "hasUsers",
          "createFirstOwner",
          "login",
          "logout",
          "getCurrentUser",
          "changePassword",
          "getUsers",
          "createUser",
          "updateUser",
          "resetUserPassword",
          "deleteUser",
          "getAuditLogs"
        ].every((method) => typeof window.erpApi[method] === "function");
        const demoApiAvailable =
          typeof window.erpApi.createDemoData === "function";
        const studentImportApiAvailable = [
          "importStudentsBulk",
          "getStudentImportTemplate"
        ].every((method) => typeof window.erpApi[method] === "function");
        const certificateApiAvailable = [
          "getCertificateTemplates",
          "createCertificateTemplate",
          "updateCertificateTemplate",
          "deleteCertificateTemplate",
          "issueCertificate",
          "getIssuedCertificates",
          "getIssuedCertificatesByStudent"
        ].every((method) => typeof window.erpApi[method] === "function");
        const employeeApiAvailable = [
          "getEmployees",
          "getEmployeeById",
          "createEmployee",
          "updateEmployee",
          "deleteEmployee"
        ].every((method) => typeof window.erpApi[method] === "function");
        const salaryApiAvailable = [
          "getSalaryPayments",
          "getSalaryPaymentsByDateRange",
          "getSalaryPaymentsByEmployee",
          "createSalaryPayment",
          "updateSalaryPayment",
          "deleteSalaryPayment"
        ].every((method) => typeof window.erpApi[method] === "function");
        const accountsApiAvailable = [
          "getAccountCategories",
          "createAccountCategory",
          "updateAccountCategory",
          "deleteAccountCategory",
          "getAccountTransactions",
          "getAccountTransactionsByDateRange",
          "createAccountTransaction",
          "updateAccountTransaction",
          "deleteAccountTransaction"
        ].every((method) => typeof window.erpApi[method] === "function");
        const timetableApiAvailable = [
          "getTimetableWeekdays",
          "createTimetableWeekday",
          "updateTimetableWeekday",
          "deleteTimetableWeekday",
          "getTimetablePeriods",
          "createTimetablePeriod",
          "updateTimetablePeriod",
          "deleteTimetablePeriod",
          "getClassrooms",
          "createClassroom",
          "updateClassroom",
          "deleteClassroom",
          "getTimetableEntries",
          "getTimetableByClass",
          "getTimetableByTeacher",
          "createOrUpdateTimetableEntry",
          "deleteTimetableEntry"
        ].every((method) => typeof window.erpApi[method] === "function");
        const homeworkApiAvailable = [
          "getHomework",
          "getHomeworkByClass",
          "createHomework",
          "updateHomework",
          "deleteHomework",
          "getHomeworkSubmissions",
          "saveHomeworkSubmissionsBulk",
          "updateHomeworkSubmission"
        ].every((method) => typeof window.erpApi[method] === "function");
        const classTestsApiAvailable = [
          "getClassTests",
          "getClassTestsByClass",
          "createClassTest",
          "updateClassTest",
          "deleteClassTest",
          "getClassTestMarks",
          "saveClassTestMarksBulk",
          "updateClassTestMark"
        ].every((method) => typeof window.erpApi[method] === "function");
        const questionPaperApiAvailable = [
          "getSubjectChapters",
          "getSubjectChaptersByClassSubject",
          "createSubjectChapter",
          "updateSubjectChapter",
          "deleteSubjectChapter",
          "getQuestions",
          "getQuestionsByFilter",
          "createQuestion",
          "updateQuestion",
          "deleteQuestion",
          "getQuestionPapers",
          "getQuestionPaperById",
          "createQuestionPaper",
          "updateQuestionPaper",
          "deleteQuestionPaper"
        ].every((method) => typeof window.erpApi[method] === "function");
        const licenseApiAvailable = [
          "getDeviceId",
          "getLicenseStatus",
          "activateLicense",
          "deactivateLicense",
          "getLicenseInfo"
        ].every((method) => typeof window.erpApi[method] === "function");
        const deviceId = await window.erpApi.getDeviceId();
        const licenseBeforeActivation =
          await window.erpApi.getLicenseStatus();
        const activatedLicense =
          await window.erpApi.activateLicense(${JSON.stringify(validLicenseKey)});
        const readableLicense = await window.erpApi.getLicenseInfo();
        const hadUsersBeforeSetup = await window.erpApi.hasUsers();
        const owner = await window.erpApi.createFirstOwner({
          name: "Smoke Test Owner",
          username: "owner",
          email: "owner@example.com",
          password: "Initial-Owner-Password"
        });
        const loggedInOwner = await window.erpApi.login(
          "owner",
          "Initial-Owner-Password"
        );
        const teacher = await window.erpApi.createUser({
          name: "Smoke Test Teacher",
          username: "teacher",
          email: "teacher@example.com",
          password: "Initial-Teacher-Password",
          role: "Teacher",
          status: "Active"
        });
        await window.erpApi.resetUserPassword(
          teacher.id,
          "Reset-Teacher-Password"
        );
        await window.erpApi.logout();
        const resetPasswordLogin = await window.erpApi.login(
          "teacher",
          "Reset-Teacher-Password"
        );
        await window.erpApi.logout();
        await window.erpApi.login("owner", "Initial-Owner-Password");
        const schoolClass = await window.erpApi.createClass({
          name: "10",
          displayOrder: 10,
          status: "Active"
        });
        await window.erpApi.createSection({
          classId: schoolClass.id,
          name: "A",
          status: "Active"
        });
        const feeHead = await window.erpApi.createFeeHead({
          name: "Tuition Fee",
          description: "Monthly tuition",
          frequency: "Monthly",
          status: "Active"
        });
        await window.erpApi.createFeeStructure({
          className: schoolClass.name,
          feeHeadId: feeHead.id,
          amount: 12500,
          academicYear: "2026–2027",
          status: "Active"
        });
        const student = await window.erpApi.createStudent({
          admissionNo: "SMOKE-001",
          name: "Database Test Student",
          className: "10",
          section: "A",
          guardianName: "Test Guardian",
          mobile: "9999999999"
        });
        const updatedStudent = await window.erpApi.updateStudent(student.id, {
          mobile: "9888888888"
        });
        await window.erpApi.saveSchoolSettings({
          schoolName: "Persistence Test School",
          address: "Local Test Address",
          phone: "1234567890",
          email: "test@example.com",
          academicYear: "2026–2027",
          receiptPrefix: "TEST-RC"
        });
        const defaultAccountCategories =
          await window.erpApi.getAccountCategories();
        const customIncomeCategory =
          await window.erpApi.createAccountCategory({
            name: "Transport Income",
            type: "Income",
            description: "Manual transport collections",
            status: "Active"
          });
        const updatedIncomeCategory =
          await window.erpApi.updateAccountCategory(
            customIncomeCategory.id,
            { description: "Updated transport collections" }
          );
        const customExpenseCategory =
          await window.erpApi.createAccountCategory({
            name: "Travel Expense",
            type: "Expense",
            description: "Official travel expenses",
            status: "Active"
          });
        const manualIncomeTransaction =
          await window.erpApi.createAccountTransaction({
            type: "Income",
            categoryId: customIncomeCategory.id,
            title: "Transport collection",
            amount: 6000,
            paymentMode: "UPI",
            transactionDate: "2026-07-02",
            referenceNo: "UPI-ACC-001",
            notes: "Manual income smoke test"
          });
        const updatedManualIncome =
          await window.erpApi.updateAccountTransaction(
            manualIncomeTransaction.id,
            {
              title: "Updated transport collection",
              amount: 6500
            }
          );
        const manualExpenseTransaction =
          await window.erpApi.createAccountTransaction({
            type: "Expense",
            categoryId: customExpenseCategory.id,
            title: "Official travel",
            amount: 1800,
            paymentMode: "Cash",
            transactionDate: "2026-07-02",
            referenceNo: "TRAVEL-001",
            notes: "Manual expense smoke test"
          });
        const deletedAccountCategory =
          await window.erpApi.deleteAccountCategory(
            customIncomeCategory.id
          );
        const employee = await window.erpApi.createEmployee({
          employeeNo: "EMP-001",
          name: "Smoke Test Employee",
          designation: "Teacher",
          department: "Academics",
          mobile: "9000000001",
          email: "employee@example.com",
          gender: "Female",
          dateOfBirth: "1992-06-15",
          joiningDate: "2024-04-01",
          qualification: "M.Ed.",
          experience: "8 years",
          address: "Employee Test Address",
          salaryAmount: 42000,
          status: "Active"
        });
        const updatedEmployee = await window.erpApi.updateEmployee(
          employee.id,
          {
            designation: "Senior Teacher",
            mobile: "9000000099",
            salaryAmount: 47000
          }
        );
        const fetchedEmployee = await window.erpApi.getEmployeeById(
          employee.id
        );
        const deletedEmployee = await window.erpApi.createEmployee({
          employeeNo: "EMP-DELETE",
          name: "Delete Test Employee",
          designation: "Assistant",
          status: "Active"
        });
        const employeeDeleteResult = await window.erpApi.deleteEmployee(
          deletedEmployee.id
        );
        const employeesAfterDelete = await window.erpApi.getEmployees();
        const salaryPayment = await window.erpApi.createSalaryPayment({
          employeeId: employee.id,
          salaryMonth: "2026-07",
          baseSalary: 47000,
          allowances: 3000,
          deductions: 1000,
          paymentMode: "Bank Transfer",
          paymentDate: "2026-07-31",
          notes: "July payroll"
        });
        const updatedSalaryPayment =
          await window.erpApi.updateSalaryPayment(salaryPayment.id, {
            allowances: 3500,
            paymentMode: "Cheque",
            notes: "Updated July payroll"
          });
        const secondSalaryPayment =
          await window.erpApi.createSalaryPayment({
            employeeId: employee.id,
            salaryMonth: "2026-08",
            baseSalary: 47000,
            allowances: 0,
            deductions: 500,
            paymentMode: "UPI",
            paymentDate: "2026-08-31"
          });
        const deletedSalaryResult =
          await window.erpApi.deleteSalaryPayment(secondSalaryPayment.id);
        const salaryPaymentsByEmployee =
          await window.erpApi.getSalaryPaymentsByEmployee(employee.id);
        const salaryPaymentsInRange =
          await window.erpApi.getSalaryPaymentsByDateRange(
            "2026-07-01",
            "2026-07-31"
          );
        const certificateTemplate =
          await window.erpApi.createCertificateTemplate({
            name: "Smoke Test Admission Certificate",
            type: "Admission",
            bodyTemplate:
              "This certifies {{studentName}} ({{admissionNo}}) of Class {{className}} at {{schoolName}} for {{academicYear}}, issued {{date}}.",
            status: "Active"
          });
        const updatedCertificateTemplate =
          await window.erpApi.updateCertificateTemplate(
            certificateTemplate.id,
            {
              bodyTemplate:
                "This certifies {{studentName}} ({{admissionNo}}), Class {{className}} / {{section}}, at {{schoolName}} for {{academicYear}}, issued {{date}}."
            }
          );
        const issuedCertificate = await window.erpApi.issueCertificate({
          studentId: student.id,
          templateId: certificateTemplate.id,
          issuedDate: "2026-07-04"
        });
        const issuedCertificatesByStudent =
          await window.erpApi.getIssuedCertificatesByStudent(student.id);
        const templateDeleteResult =
          await window.erpApi.deleteCertificateTemplate(
            certificateTemplate.id
          );
        const certificateTemplatesAfterDelete =
          await window.erpApi.getCertificateTemplates();
        const subject = await window.erpApi.createSubject({
          name: "Mathematics",
          code: "MATH",
          className: "10",
          maxMarks: 100,
          passingMarks: 33,
          status: "Active"
        });
        const createdWeekday =
          await window.erpApi.createTimetableWeekday({
            name: "Sunday",
            displayOrder: 8,
            isActive: false
          });
        const updatedWeekday =
          await window.erpApi.updateTimetableWeekday(
            createdWeekday.id,
            { displayOrder: 7, isActive: true }
          );
        const timetablePeriod =
          await window.erpApi.createTimetablePeriod({
            name: "Period 1",
            startTime: "08:00",
            endTime: "08:45",
            displayOrder: 1,
            isBreak: false
          });
        const classroom = await window.erpApi.createClassroom({
          name: "Room 101",
          capacity: 40,
          description: "Main academic block",
          status: "Active"
        });
        const defaultMonday = (
          await window.erpApi.getTimetableWeekdays()
        ).find((weekday) => weekday.name === "Monday");
        if (!defaultMonday) {
          throw new Error("Default Monday weekday was not created.");
        }
        const timetableEntry =
          await window.erpApi.createOrUpdateTimetableEntry({
            className: "10",
            section: "A",
            weekdayId: defaultMonday.id,
            periodId: timetablePeriod.id,
            subjectId: subject.id,
            teacherId: employee.id,
            classroomId: classroom.id,
            notes: "Initial timetable entry"
          });
        const updatedTimetableEntry =
          await window.erpApi.createOrUpdateTimetableEntry({
            className: "10",
            section: "A",
            weekdayId: defaultMonday.id,
            periodId: timetablePeriod.id,
            subjectId: subject.id,
            teacherId: employee.id,
            classroomId: classroom.id,
            notes: "Updated timetable entry"
          });
        const classTimetable =
          await window.erpApi.getTimetableByClass("10", "A");
        const teacherTimetable =
          await window.erpApi.getTimetableByTeacher(employee.id);
        const homework = await window.erpApi.createHomework({
          title: "Algebra Practice",
          className: "10",
          section: "A",
          subjectId: subject.id,
          teacherId: employee.id,
          homeworkDate: "2026-07-05",
          dueDate: "2026-07-07",
          description: "Complete exercise 4.1.",
          instructions: "Show all working.",
          status: "Active"
        });
        const initialHomeworkSubmissions =
          await window.erpApi.getHomeworkSubmissions(homework.id);
        const updatedHomeworkSubmission =
          await window.erpApi.updateHomeworkSubmission(
            initialHomeworkSubmissions[0].id,
            {
              status: "Submitted",
              submittedDate: "2026-07-06",
              marks: 8,
              remarks: "Submitted on time"
            }
          );
        const bulkHomeworkSubmissions =
          await window.erpApi.saveHomeworkSubmissionsBulk([
            {
              homeworkId: homework.id,
              studentId: student.id,
              status: "Checked",
              submittedDate: "2026-07-06",
              marks: 9,
              remarks: "Checked and verified"
            }
          ]);
        const classHomework =
          await window.erpApi.getHomeworkByClass("10", "A");
        const homeworkToDelete = await window.erpApi.createHomework({
          title: "Delete Homework Test",
          className: "10",
          section: "A",
          subjectId: subject.id,
          teacherId: employee.id,
          homeworkDate: "2026-07-05",
          dueDate: "2026-07-08",
          status: "Active"
        });
        const homeworkDeleteResult =
          await window.erpApi.deleteHomework(homeworkToDelete.id);
        const homeworkAfterDelete = await window.erpApi.getHomework();
        const classTest = await window.erpApi.createClassTest({
          testName: "Weekly Algebra Test",
          className: "10",
          section: "A",
          subjectId: subject.id,
          teacherId: employee.id,
          testDate: "2026-07-06",
          maxMarks: 20,
          passingMarks: 7,
          description: "Algebra weekly assessment",
          status: "Active"
        });
        const updatedClassTest = await window.erpApi.updateClassTest(
          classTest.id,
          {
            passingMarks: 8,
            description: "Updated algebra weekly assessment"
          }
        );
        const initialClassTestMarks =
          await window.erpApi.getClassTestMarks(classTest.id);
        const failedClassTestMarks =
          await window.erpApi.saveClassTestMarksBulk([
            {
              testId: classTest.id,
              studentId: student.id,
              marksObtained: 6,
              resultStatus: "Pass",
              remarks: "Below passing marks"
            }
          ]);
        const passedClassTestMark =
          await window.erpApi.updateClassTestMark(
            initialClassTestMarks[0].id,
            {
              marksObtained: 9,
              resultStatus: "Fail",
              remarks: "Improved and verified"
            }
          );
        const classTestsByClass =
          await window.erpApi.getClassTestsByClass("10", "A");
        const classTestMarksForSummary =
          await window.erpApi.getClassTestMarks(classTest.id);
        const appearedClassTestMarks = classTestMarksForSummary.filter(
          (mark) => ["Pass", "Fail"].includes(mark.resultStatus)
        );
        const classTestAverage =
          appearedClassTestMarks.reduce(
            (total, mark) => total + mark.marksObtained,
            0
          ) / appearedClassTestMarks.length;
        const classTestHighest = Math.max(
          ...appearedClassTestMarks.map((mark) => mark.marksObtained)
        );
        const classTestToDelete = await window.erpApi.createClassTest({
          testName: "Delete Class Test",
          className: "10",
          section: "A",
          subjectId: subject.id,
          teacherId: employee.id,
          testDate: "2026-07-07",
          maxMarks: 10,
          passingMarks: 4,
          status: "Active"
        });
        const classTestDeleteResult =
          await window.erpApi.deleteClassTest(classTestToDelete.id);
        const classTestsAfterDelete = await window.erpApi.getClassTests();
        const subjectChapter =
          await window.erpApi.createSubjectChapter({
            className: "10",
            subjectId: subject.id,
            chapterNo: "4",
            chapterName: "Linear Equations",
            description: "One-variable linear equations",
            status: "Active"
          });
        const updatedSubjectChapter =
          await window.erpApi.updateSubjectChapter(
            subjectChapter.id,
            { description: "Updated one-variable linear equations" }
          );
        const question = await window.erpApi.createQuestion({
          className: "10",
          subjectId: subject.id,
          chapterId: subjectChapter.id,
          questionType: "Objective",
          difficulty: "Medium",
          questionText: "What is the value of x if x + 2 = 5?",
          optionA: "1",
          optionB: "2",
          optionC: "3",
          optionD: "4",
          correctAnswer: "C",
          marks: 2,
          status: "Active"
        });
        const filteredQuestions =
          await window.erpApi.getQuestionsByFilter({
            className: "10",
            subjectId: subject.id,
            chapterId: subjectChapter.id,
            questionType: "Objective",
            difficulty: "Medium"
          });
        const questionPaper = await window.erpApi.createQuestionPaper({
          title: "Smoke Test Mathematics Paper",
          className: "10",
          section: "A",
          subjectId: subject.id,
          examName: "Smoke Test Examination",
          durationMinutes: 60,
          instructions: "Answer all questions.",
          items: [
            {
              questionId: question.id,
              sectionTitle: "Section A",
              displayOrder: 1
            }
          ]
        });
        const updatedQuestionPaper =
          await window.erpApi.updateQuestionPaper(
            questionPaper.id,
            { title: "Updated Smoke Test Mathematics Paper" }
          );
        const secondQuestionPaper =
          await window.erpApi.createQuestionPaper({
            title: "Delete Question Paper Test",
            className: "10",
            section: "A",
            subjectId: subject.id,
            durationMinutes: 30,
            items: [
              {
                questionId: question.id,
                sectionTitle: "Section B",
                displayOrder: 1
              }
            ]
          });
        const questionDeleteResult =
          await window.erpApi.deleteQuestion(question.id);
        const paperAfterQuestionDelete =
          await window.erpApi.getQuestionPaperById(questionPaper.id);
        const questionPaperDeleteResult =
          await window.erpApi.deleteQuestionPaper(secondQuestionPaper.id);
        const questionPapersAfterDelete =
          await window.erpApi.getQuestionPapers();
        const chaptersByClassSubject =
          await window.erpApi.getSubjectChaptersByClassSubject(
            "10",
            "Mathematics"
          );
        const exam = await window.erpApi.createExam({
          name: "Unit Test I",
          className: "10",
          section: "A",
          academicYear: "2026–2027",
          examDate: "2026-07-05",
          status: "Active"
        });
        await window.erpApi.saveMarksBulk([
          {
            examId: exam.id,
            studentId: student.id,
            subjectId: subject.id,
            obtainedMarks: 72,
            remarks: "Initial entry"
          }
        ]);
        const upsertedMarks = await window.erpApi.saveMarksBulk([
          {
            examId: exam.id,
            studentId: student.id,
            subjectId: subject.id,
            obtainedMarks: 88,
            remarks: "Updated through bulk save"
          }
        ]);
        const updatedMark = await window.erpApi.updateMark(
          upsertedMarks[0].id,
          {
            obtainedMarks: 91,
            remarks: "Final verified marks"
          }
        );
        const examMarks = await window.erpApi.getMarksByExam(exam.id);
        const studentExamMarks =
          await window.erpApi.getMarksByStudentExam(student.id, exam.id);
        const firstPayment = await window.erpApi.createFeePayment({
          studentId: student.id,
          feeType: "Tuition Fee",
          amount: 12500,
          paymentMode: "Cash",
          paymentDate: "2026-07-03",
          notes: "First receipt"
        });
        const secondPayment = await window.erpApi.createFeePayment({
          studentId: student.id,
          feeType: "Tuition Fee",
          amount: 2500,
          paymentMode: "Cheque",
          paymentDate: "2026-07-04",
          notes: "Cheque 10042"
        });
        await window.erpApi.saveAttendanceBulk([
          {
            studentId: student.id,
            attendanceDate: "2026-07-03",
            status: "Present",
            remarks: "On time"
          }
        ]);
        const upsertedAttendance = await window.erpApi.saveAttendanceBulk([
          {
            studentId: student.id,
            attendanceDate: "2026-07-03",
            status: "Absent",
            remarks: "Updated through bulk save"
          }
        ]);
        const updatedAttendance = await window.erpApi.updateAttendance(
          upsertedAttendance[0].id,
          {
            status: "Leave",
            remarks: "Approved leave"
          }
        );
        const classAttendance =
          await window.erpApi.getAttendanceByClassDate(
            "10",
            "A",
            "2026-07-03"
          );
        const allSectionAttendance =
          await window.erpApi.getAttendanceByClassDate(
            "10",
            "All",
            "2026-07-03"
          );
        const attendanceSummary =
          await window.erpApi.getAttendanceSummary(
            "2026-07-03",
            "2026-07-03"
          );
        const databaseInfo = await window.erpApi.getDatabaseInfo();
        const safeUsers = await window.erpApi.getUsers();
        const accountTransactions =
          await window.erpApi.getAccountTransactions();
        const accountTransactionsInRange =
          await window.erpApi.getAccountTransactionsByDateRange(
            "2026-07-01",
            "2026-07-31"
          );
        const feeAccountTransactions = accountTransactions.filter(
          (transaction) => transaction.linkedModule === "Fees"
        );
        const salaryAccountTransactions = accountTransactions.filter(
          (transaction) => transaction.linkedModule === "Salary"
        );
        const auditLogs = await window.erpApi.getAuditLogs(100);

        return {
          authApiAvailable,
          demoApiAvailable,
          studentImportApiAvailable,
          certificateApiAvailable,
          employeeApiAvailable,
          salaryApiAvailable,
          accountsApiAvailable,
          timetableApiAvailable,
          homeworkApiAvailable,
          classTestsApiAvailable,
          questionPaperApiAvailable,
          licenseApiAvailable,
          deviceId,
          licenseBeforeActivation,
          activatedLicense,
          readableLicense,
          hadUsersBeforeSetup,
          ownerRole: owner.role,
          loggedInOwnerRole: loggedInOwner.role,
          resetPasswordLoginRole: resetPasswordLogin.role,
          safeUsers,
          auditLogCount: auditLogs.length,
          certificateNo: issuedCertificate.certificateNo,
          certificateBody: issuedCertificate.body,
          certificateIssuedBy: issuedCertificate.issuedBy,
          issuedCertificateCount: (
            await window.erpApi.getIssuedCertificates()
          ).length,
          issuedCertificateStudentCount:
            issuedCertificatesByStudent.length,
          certificateTemplateUpdated:
            updatedCertificateTemplate.bodyTemplate.includes("{{section}}"),
          certificateTemplateSoftDeleted:
            templateDeleteResult.success &&
            !certificateTemplatesAfterDelete.some(
              (template) => template.id === certificateTemplate.id
            ),
          defaultCertificateTemplateCount:
            certificateTemplatesAfterDelete.length,
          employeeId: employee.id,
          employeeCount: employeesAfterDelete.length,
          employeeUpdated:
            updatedEmployee.designation === "Senior Teacher" &&
            updatedEmployee.mobile === "9000000099" &&
            updatedEmployee.salaryAmount === 47000,
          employeeFetchedById:
            fetchedEmployee?.id === employee.id,
          employeeSoftDeleted:
            employeeDeleteResult.success &&
            !employeesAfterDelete.some(
              (item) => item.id === deletedEmployee.id
            ),
          timetableWeekdayCount: (
            await window.erpApi.getTimetableWeekdays()
          ).length,
          timetableWeekdayUpdated:
            updatedWeekday.displayOrder === 7 &&
            updatedWeekday.isActive === true,
          timetablePeriodId: timetablePeriod.id,
          classroomId: classroom.id,
          timetableEntryId: timetableEntry.id,
          timetableWeekdayId: defaultMonday.id,
          timetableEntryCount: (
            await window.erpApi.getTimetableEntries()
          ).length,
          timetableEntryUpdated:
            updatedTimetableEntry.id === timetableEntry.id &&
            updatedTimetableEntry.notes === "Updated timetable entry",
          classTimetableCount: classTimetable.length,
          teacherTimetableCount: teacherTimetable.length,
          homeworkId: homework.id,
          homeworkSubmissionId: initialHomeworkSubmissions[0].id,
          homeworkSubmissionCount: initialHomeworkSubmissions.length,
          homeworkPendingCreated:
            initialHomeworkSubmissions[0]?.status === "Pending",
          homeworkSubmissionUpdated:
            updatedHomeworkSubmission.status === "Submitted" &&
            updatedHomeworkSubmission.marks === 8,
          homeworkBulkUpdated:
            bulkHomeworkSubmissions[0]?.status === "Checked" &&
            bulkHomeworkSubmissions[0]?.marks === 9,
          classHomeworkCount: classHomework.length,
          homeworkSoftDeleted:
            homeworkDeleteResult.success &&
            !homeworkAfterDelete.some(
              (item) => item.id === homeworkToDelete.id
            ),
          classTestId: classTest.id,
          classTestMarkId: initialClassTestMarks[0].id,
          classTestMarkCount: initialClassTestMarks.length,
          classTestPendingCreated:
            initialClassTestMarks[0]?.resultStatus === "Pending",
          classTestUpdated:
            updatedClassTest.passingMarks === 8 &&
            updatedClassTest.description ===
              "Updated algebra weekly assessment",
          classTestFailAutoCalculated:
            failedClassTestMarks[0]?.resultStatus === "Fail",
          classTestPassAutoCalculated:
            passedClassTestMark.resultStatus === "Pass" &&
            passedClassTestMark.marksObtained === 9,
          classTestsByClassCount: classTestsByClass.length,
          classTestAverage,
          classTestHighest,
          classTestSoftDeleted:
            classTestDeleteResult.success &&
            !classTestsAfterDelete.some(
              (item) => item.id === classTestToDelete.id
            ),
          subjectChapterId: subjectChapter.id,
          subjectChapterUpdated:
            updatedSubjectChapter.description ===
            "Updated one-variable linear equations",
          chapterFilterCount: chaptersByClassSubject.length,
          questionFilterCount: filteredQuestions.length,
          questionSoftDeleted:
            questionDeleteResult.success &&
            (await window.erpApi.getQuestions()).length === 0,
          questionPaperId: questionPaper.id,
          questionPaperNo: questionPaper.paperNo,
          secondQuestionPaperNo: secondQuestionPaper.paperNo,
          questionPaperUpdated:
            updatedQuestionPaper.title ===
              "Updated Smoke Test Mathematics Paper" &&
            updatedQuestionPaper.itemCount === 1,
          questionPaperSnapshotPreserved:
            paperAfterQuestionDelete?.items.length === 1 &&
            paperAfterQuestionDelete.items[0].questionText.includes(
              "x + 2 = 5"
            ) &&
            paperAfterQuestionDelete.items[0].optionC === "3" &&
            paperAfterQuestionDelete.totalMarks === 2,
          questionPaperSoftDeleted:
            questionPaperDeleteResult.success &&
            !questionPapersAfterDelete.some(
              (item) => item.id === secondQuestionPaper.id
            ),
          salaryPaymentId: salaryPayment.id,
          salaryNo: salaryPayment.salaryNo,
          secondSalaryNo: secondSalaryPayment.salaryNo,
          salaryUpdated:
            updatedSalaryPayment.netSalary === 49500 &&
            updatedSalaryPayment.paymentMode === "Cheque",
          salaryEmployeeCount: salaryPaymentsByEmployee.length,
          salaryRangeCount: salaryPaymentsInRange.length,
          salaryDeleteWorked:
            deletedSalaryResult.success &&
            (await window.erpApi.getSalaryPayments()).length === 1,
          defaultAccountCategoryCount: defaultAccountCategories.length,
          accountCategoryUpdated:
            updatedIncomeCategory.description ===
            "Updated transport collections",
          accountCategorySoftDeleted:
            deletedAccountCategory.success &&
            !(await window.erpApi.getAccountCategories()).some(
              (category) => category.id === customIncomeCategory.id
            ),
          manualIncomeTransactionNo:
            manualIncomeTransaction.transactionNo,
          manualExpenseTransactionNo:
            manualExpenseTransaction.transactionNo,
          manualIncomeUpdated:
            updatedManualIncome.title ===
              "Updated transport collection" &&
            updatedManualIncome.amount === 6500,
          accountTransactionCount: accountTransactions.length,
          accountRangeCount: accountTransactionsInRange.length,
          feeAccountCount: feeAccountTransactions.length,
          feeAccountLinked:
            feeAccountTransactions.every(
              (transaction) =>
                transaction.type === "Income" &&
                transaction.linkedRecordId
            ),
          salaryAccountCount: salaryAccountTransactions.length,
          salaryAccountSynced:
            salaryAccountTransactions[0]?.type === "Expense" &&
            salaryAccountTransactions[0]?.amount === 49500 &&
            salaryAccountTransactions[0]?.paymentMode === "Cheque",
          manualExpenseId: manualExpenseTransaction.id,
          attendanceApiAvailable,
          backupApiAvailable,
          classAttendanceIsArray: Array.isArray(classAttendance),
          allSectionAttendanceCount: allSectionAttendance.length,
          studentId: student.id,
          updatedMobile: updatedStudent.mobile,
          firstReceipt: firstPayment.receiptNo,
          secondReceipt: secondPayment.receiptNo,
          studentCount: (await window.erpApi.getStudents()).length,
          paymentCount: (await window.erpApi.getFeePayments()).length,
          attendanceCount: (await window.erpApi.getAttendance()).length,
          attendanceByDateCount: (
            await window.erpApi.getAttendanceByDate("2026-07-03")
          ).length,
          attendanceRangeCount: (
            await window.erpApi.getAttendanceByDateRange(
              "2026-07-03",
              "2026-07-03"
            )
          ).length,
          classAttendanceCount: classAttendance.length,
          updatedAttendanceStatus: updatedAttendance.status,
          updatedAttendanceRemarks: updatedAttendance.remarks,
          attendanceSummaryTotal: attendanceSummary.totalMarked,
          attendanceSummaryLeave: attendanceSummary.leave,
          subjectId: subject.id,
          examId: exam.id,
          subjectCount: (await window.erpApi.getSubjects()).length,
          examCount: (await window.erpApi.getExams()).length,
          markCount: (await window.erpApi.getMarks()).length,
          examMarkCount: examMarks.length,
          studentExamMarkCount: studentExamMarks.length,
          updatedObtainedMarks: updatedMark.obtainedMarks,
          updatedMarkRemarks: updatedMark.remarks,
          databaseInfo,
          schoolName: (await window.erpApi.getSchoolSettings()).schoolName,
          classCount: (await window.erpApi.getClasses()).length,
          sectionCount: (await window.erpApi.getSections()).length,
          feeHeadCount: (await window.erpApi.getFeeHeads()).length,
          feeStructureCount: (await window.erpApi.getFeeStructures()).length,
          rangeCount: (
            await window.erpApi.getFeePaymentsByDateRange(
              "2026-07-03",
              "2026-07-03"
            )
          ).length,
          receiptAdmissionNo: firstPayment.admissionNo,
          receiptSection: firstPayment.section,
          receiptCashierName: firstPayment.cashierName,
          secondPaymentMode: secondPayment.paymentMode
        };
      })()
    `);

    assert(
      bridgeResult.attendanceApiAvailable,
      "getAttendanceByClassDate was not exposed by the preload bridge.",
    );
    assert(
      bridgeResult.backupApiAvailable,
      "Backup and restore APIs were not exposed by the preload bridge.",
    );
    assert(
      bridgeResult.authApiAvailable,
      "Authentication and user APIs were not exposed by the preload bridge.",
    );
    assert(
      bridgeResult.demoApiAvailable,
      "Demo data API was not exposed by the preload bridge.",
    );
    assert(
      bridgeResult.studentImportApiAvailable,
      "Student import APIs were not exposed by the preload bridge.",
    );
    assert(
      bridgeResult.certificateApiAvailable,
      "Certificate APIs were not exposed by the preload bridge.",
    );
    assert(
      bridgeResult.employeeApiAvailable,
      "Employee APIs were not exposed by the preload bridge.",
    );
    assert(
      bridgeResult.salaryApiAvailable,
      "Salary APIs were not exposed by the preload bridge.",
    );
    assert(
      bridgeResult.accountsApiAvailable,
      "Accounts APIs were not exposed by the preload bridge.",
    );
    assert(
      bridgeResult.timetableApiAvailable,
      "Timetable APIs were not exposed by the preload bridge.",
    );
    assert(
      bridgeResult.homeworkApiAvailable,
      "Homework APIs were not exposed by the preload bridge.",
    );
    assert(
      bridgeResult.classTestsApiAvailable,
      "Class test APIs were not exposed by the preload bridge.",
    );
    assert(
      bridgeResult.questionPaperApiAvailable,
      "Question paper APIs were not exposed by the preload bridge.",
    );
    assert(
      bridgeResult.licenseApiAvailable &&
        bridgeResult.deviceId === firstDeviceId,
      "License APIs or device ID bridge failed.",
    );
    assert(
      bridgeResult.licenseBeforeActivation.status === "missing" &&
        bridgeResult.activatedLicense.isValid &&
        bridgeResult.activatedLicense.status === "active" &&
        bridgeResult.readableLicense.license.licenseId === "LIC-SMOKE-001",
      "Valid license activation or status read failed.",
    );
    assert(
      bridgeResult.hadUsersBeforeSetup === false &&
        bridgeResult.ownerRole === "Owner" &&
        bridgeResult.loggedInOwnerRole === "Owner",
      "First Owner account setup or login failed.",
    );
    let wrongPasswordRejected = false;
    try {
      authService.login("owner", "wrong-password");
    } catch {
      wrongPasswordRejected = true;
    }
    assert(wrongPasswordRejected, "Login accepted an incorrect password.");
    assert(
      bridgeResult.resetPasswordLoginRole === "Teacher",
      "Reset user password could not be used to log in.",
    );
    assert(
      bridgeResult.safeUsers.length === 2 &&
        bridgeResult.safeUsers.every(
          (user) =>
            !Object.prototype.hasOwnProperty.call(user, "passwordHash") &&
            !Object.prototype.hasOwnProperty.call(user, "passwordSalt") &&
            !Object.prototype.hasOwnProperty.call(user, "password_hash") &&
            !Object.prototype.hasOwnProperty.call(user, "password_salt"),
        ),
      "User APIs exposed password credentials.",
    );
    assert(
      bridgeResult.auditLogCount >= 6,
      "Authentication and user audit logs were not recorded.",
    );
    const ownerAuthRecord = database.getUserAuthRecord("owner");
    assert(
      ownerAuthRecord.password_hash !== "Initial-Owner-Password" &&
        ownerAuthRecord.password_salt &&
        ownerAuthRecord.password_hash.length > 64,
      "Owner password was not securely hashed.",
    );
    assert(
      bridgeResult.classAttendanceIsArray,
      "Attendance class/date query did not return an array.",
    );
    assert(bridgeResult.studentCount === 1, "Student IPC operations failed.");
    assert(bridgeResult.updatedMobile === "9888888888", "Student update IPC failed.");
    assert(bridgeResult.paymentCount === 2, "Fee payment IPC operations failed.");
    assert(
      bridgeResult.firstReceipt === "TEST-RC-2026-0001",
      "Yearly receipt number was not generated.",
    );
    assert(
      bridgeResult.secondReceipt === "TEST-RC-2026-0002",
      "Yearly receipt sequence did not advance.",
    );
    assert(bridgeResult.rangeCount === 1, "Date-range fee query failed.");
    assert(
      bridgeResult.receiptAdmissionNo === "SMOKE-001",
      "Receipt student snapshot was not saved.",
    );
    assert(bridgeResult.receiptSection === "A", "Receipt section was not saved.");
    assert(
      bridgeResult.receiptCashierName === "Smoke Test Owner",
      "Logged-in cashier name was not saved on the receipt.",
    );
    assert(bridgeResult.secondPaymentMode === "Cheque", "Cheque mode was not saved.");
    assert(
      bridgeResult.certificateNo === "CERT-2026-0001",
      "Certificate number was not generated with the yearly sequence.",
    );
    assert(
      bridgeResult.certificateBody.includes("Database Test Student") &&
        bridgeResult.certificateBody.includes("Persistence Test School") &&
        !bridgeResult.certificateBody.includes("{{"),
      "Certificate template variables were not rendered.",
    );
    assert(
      bridgeResult.certificateIssuedBy === "Smoke Test Owner" &&
        bridgeResult.issuedCertificateCount === 1 &&
        bridgeResult.issuedCertificateStudentCount === 1,
      "Certificate issue or student history query failed.",
    );
    assert(
      bridgeResult.certificateTemplateUpdated &&
        bridgeResult.certificateTemplateSoftDeleted &&
        bridgeResult.defaultCertificateTemplateCount === 3,
      "Certificate template update, defaults, or soft delete failed.",
    );
    assert(
      bridgeResult.employeeCount === 1 &&
        bridgeResult.employeeUpdated &&
        bridgeResult.employeeFetchedById &&
        bridgeResult.employeeSoftDeleted,
      "Employee create, update, read, or soft delete failed.",
    );
    assert(
      bridgeResult.timetableWeekdayCount === 7 &&
        bridgeResult.timetableWeekdayUpdated &&
        bridgeResult.timetableEntryCount === 1 &&
        bridgeResult.timetableEntryUpdated &&
        bridgeResult.classTimetableCount === 1 &&
        bridgeResult.teacherTimetableCount === 1,
      "Timetable setup, upsert, class query, or teacher query failed.",
    );
    assert(
      bridgeResult.homeworkSubmissionCount === 1 &&
        bridgeResult.homeworkPendingCreated &&
        bridgeResult.homeworkSubmissionUpdated &&
        bridgeResult.homeworkBulkUpdated &&
        bridgeResult.classHomeworkCount === 1 &&
        bridgeResult.homeworkSoftDeleted,
      "Homework creation, pending submissions, updates, class query, or soft delete failed.",
    );
    assert(
      bridgeResult.classTestMarkCount === 1 &&
        bridgeResult.classTestPendingCreated &&
        bridgeResult.classTestUpdated &&
        bridgeResult.classTestFailAutoCalculated &&
        bridgeResult.classTestPassAutoCalculated &&
        bridgeResult.classTestsByClassCount === 1 &&
        bridgeResult.classTestAverage === 9 &&
        bridgeResult.classTestHighest === 9 &&
        bridgeResult.classTestSoftDeleted,
      "Class test creation, mark rows, result calculation, summary, class query, or soft delete failed.",
    );
    assert(
      bridgeResult.subjectChapterUpdated &&
        bridgeResult.chapterFilterCount === 1 &&
        bridgeResult.questionFilterCount === 1 &&
        bridgeResult.questionSoftDeleted &&
        bridgeResult.questionPaperNo === "QP-2026-0001" &&
        bridgeResult.secondQuestionPaperNo === "QP-2026-0002" &&
        bridgeResult.questionPaperUpdated &&
        bridgeResult.questionPaperSnapshotPreserved &&
        bridgeResult.questionPaperSoftDeleted,
      "Question paper chapter, bank filter, numbering, snapshot, update, or soft-delete behavior failed.",
    );
    const smokeClass = database
      .getClasses()
      .find((item) => item.name === "10");
    assert(smokeClass, "Timetable conflict test class was not found.");
    const conflictSection = database.createSection({
      classId: smokeClass.id,
      name: "B",
      status: "Active",
    });
    let teacherConflictRejected = false;
    try {
      database.createOrUpdateTimetableEntry({
        className: "10",
        section: "B",
        weekdayId: bridgeResult.timetableWeekdayId,
        periodId: bridgeResult.timetablePeriodId,
        subjectId: bridgeResult.subjectId,
        teacherId: bridgeResult.employeeId,
        classroomId: bridgeResult.classroomId,
      });
    } catch (error) {
      teacherConflictRejected =
        error instanceof Error &&
        error.message.includes("Teacher is already assigned");
    }
    assert(
      teacherConflictRejected,
      "A teacher was assigned to two classes in the same timetable slot.",
    );
    const conflictTeacher = database.createEmployee({
      employeeNo: "EMP-TIMETABLE-CONFLICT",
      name: "Room Conflict Teacher",
      designation: "Teacher",
      department: "Academics",
      status: "Active",
    });
    let classroomConflictRejected = false;
    try {
      database.createOrUpdateTimetableEntry({
        className: "10",
        section: "B",
        weekdayId: bridgeResult.timetableWeekdayId,
        periodId: bridgeResult.timetablePeriodId,
        subjectId: bridgeResult.subjectId,
        teacherId: conflictTeacher.id,
        classroomId: bridgeResult.classroomId,
      });
    } catch (error) {
      classroomConflictRejected =
        error instanceof Error &&
        error.message.includes("Classroom is already assigned");
    }
    assert(
      classroomConflictRejected &&
        database.getTimetableEntries().length === 1,
      "A classroom was assigned twice in the same slot or a failed conflict wrote data.",
    );
    database.deleteEmployee(conflictTeacher.id);
    database.deleteSection(conflictSection.id);
    assert(
      bridgeResult.salaryNo === "SAL-2026-0001" &&
        bridgeResult.secondSalaryNo === "SAL-2026-0002",
      "Salary number generation did not increment by year.",
    );
    let duplicateSalaryRejected = false;
    let duplicateSalaryMessage = "";
    try {
      database.createSalaryPayment({
        employeeId: bridgeResult.employeeId,
        salaryMonth: "2026-07",
        baseSalary: 47000,
        allowances: 0,
        deductions: 0,
        paymentMode: "Cash",
        paymentDate: "2026-07-31",
      });
    } catch (error) {
      duplicateSalaryRejected = true;
      duplicateSalaryMessage =
        error instanceof Error ? error.message : String(error);
    }
    assert(
      duplicateSalaryRejected &&
        duplicateSalaryMessage ===
          "Salary for this employee and month is already paid.",
      "Duplicate salary for the same employee and month was accepted.",
    );
    assert(
      bridgeResult.salaryUpdated &&
        bridgeResult.salaryEmployeeCount === 1 &&
        bridgeResult.salaryRangeCount === 1 &&
        bridgeResult.salaryDeleteWorked,
      "Salary update, employee/date query, or soft delete failed.",
    );
    assert(
      bridgeResult.defaultAccountCategoryCount === 10 &&
        bridgeResult.accountCategoryUpdated &&
        bridgeResult.accountCategorySoftDeleted,
      "Default account categories or category update/delete failed.",
    );
    assert(
      bridgeResult.manualIncomeTransactionNo === "ACC-2026-0001" &&
        bridgeResult.manualExpenseTransactionNo === "ACC-2026-0002" &&
        bridgeResult.manualIncomeUpdated,
      "Manual account transactions or account numbering failed.",
    );
    assert(
      bridgeResult.accountTransactionCount === 5 &&
        bridgeResult.accountRangeCount === 5 &&
        bridgeResult.feeAccountCount === 2 &&
        bridgeResult.feeAccountLinked &&
        bridgeResult.salaryAccountCount === 1 &&
        bridgeResult.salaryAccountSynced,
      "Account date queries or automatic fee/salary ledger links failed.",
    );
    assert(
      bridgeResult.attendanceCount === 1,
      "Attendance upsert created a duplicate.",
    );
    assert(bridgeResult.attendanceByDateCount === 1, "Attendance date query failed.");
    assert(bridgeResult.attendanceRangeCount === 1, "Attendance range query failed.");
    assert(
      bridgeResult.classAttendanceCount === 1,
      "Attendance class/date query failed.",
    );
    assert(
      bridgeResult.allSectionAttendanceCount === 1,
      "Attendance all-sections query failed.",
    );
    assert(
      bridgeResult.updatedAttendanceStatus === "Leave",
      "Attendance update failed.",
    );
    assert(
      bridgeResult.updatedAttendanceRemarks === "Approved leave",
      "Attendance remarks update failed.",
    );
    assert(
      bridgeResult.attendanceSummaryTotal === 1 &&
        bridgeResult.attendanceSummaryLeave === 1,
      "Attendance summary failed.",
    );
    assert(bridgeResult.subjectCount === 1, "Subject IPC operation failed.");
    assert(bridgeResult.examCount === 1, "Exam IPC operation failed.");
    assert(
      bridgeResult.markCount === 1 &&
        bridgeResult.examMarkCount === 1 &&
        bridgeResult.studentExamMarkCount === 1,
      "Marks upsert created a duplicate or marks queries failed.",
    );
    assert(
      bridgeResult.updatedObtainedMarks === 91 &&
        bridgeResult.updatedMarkRemarks === "Final verified marks",
      "Mark update failed.",
    );
    assert(
      bridgeResult.databaseInfo.databasePath === databasePath &&
        bridgeResult.databaseInfo.databaseDirectory === temporaryDirectory &&
        bridgeResult.databaseInfo.exists === true &&
        bridgeResult.databaseInfo.fileSizeBytes > 0 &&
        typeof bridgeResult.databaseInfo.fileSizeLabel === "string" &&
        bridgeResult.databaseInfo.fileSizeLabel.length > 0 &&
        typeof bridgeResult.databaseInfo.lastModified === "string" &&
        bridgeResult.databaseInfo.restorePending === false,
      "Database information API returned incomplete data.",
    );
    assert(bridgeResult.classCount === 1, "Class IPC operation failed.");
    assert(bridgeResult.sectionCount === 1, "Section IPC operation failed.");
    assert(bridgeResult.feeHeadCount === 1, "Fee head IPC operation failed.");
    assert(
      bridgeResult.feeStructureCount === 1,
      "Fee structure IPC operation failed.",
    );
    assert(
      bridgeResult.schoolName === "Persistence Test School",
      "Settings IPC operation failed.",
    );

    const backupPath = path.join(temporaryDirectory, "smoke-backup.db");
    validateDatabaseFile(databasePath);
    await database.backupTo(backupPath);
    validateDatabaseFile(backupPath);
    assert(fs.existsSync(backupPath), "Database backup was not created.");
    const restorePaths = getRestorePaths(databasePath);
    assert(
      restorePaths.pendingPath ===
        path.join(temporaryDirectory, "school-erp-restore-pending.db"),
      "Backup module did not locate the staged restore path.",
    );
    fs.copyFileSync(
      backupPath,
      restorePaths.pendingPath,
    );
    assert(
      backupService.getDatabaseInfo().restorePending,
      "Database information did not report the staged restore.",
    );

    window.destroy();
    unregisterIpcHandlers();
    database.close();

    const restoreResult = applyPendingDatabaseRestore(databasePath);
    assert(restoreResult.restored, "Pending database restore was not applied.");
    assert(
      restoreResult.safetyBackupPath &&
        fs.existsSync(restoreResult.safetyBackupPath),
      "Startup restore did not preserve a safety backup.",
    );
    validateDatabaseFile(restoreResult.safetyBackupPath);
    assert(
      !fs.existsSync(restorePaths.pendingPath) &&
        !fs.existsSync(restorePaths.metadataPath) &&
        !fs.existsSync(restorePaths.restoreTempPath),
      "Staged restore files were not cleaned after a successful restore.",
    );
    database = createDatabase(databasePath);
    assert(
      database.getLicenseActivationRecord()?.licenseId === "LIC-SMOKE-001",
      "License activation did not persist through backup and restore.",
    );
    assert(database.getStudents().length === 1, "Student did not persist.");
    assert(
      database.getSchoolSettings().schoolName === "Persistence Test School",
      "School settings did not persist.",
    );
    assert(database.getFeePayments().length === 2, "Fee payments did not persist.");
    assert(database.getAttendance().length === 1, "Attendance did not persist.");
    assert(database.getSubjects().length === 1, "Subject did not persist.");
    assert(database.getExams().length === 1, "Exam did not persist.");
    assert(database.getMarks().length === 1, "Marks did not persist.");
    assert(
      database.getTimetableWeekdays().length === 7 &&
        database.getTimetablePeriods().length === 1 &&
        database.getClassrooms().length === 1 &&
        database.getTimetableByClass("10", "A").length === 1 &&
        database.getTimetableByTeacher(bridgeResult.employeeId).length === 1,
      "Timetable setup or entries did not persist.",
    );
    assert(
      database.getHomework().length === 1 &&
        database.getHomework()[0].id === bridgeResult.homeworkId &&
        database.getHomeworkSubmissions(bridgeResult.homeworkId).length ===
          1 &&
        database.getHomeworkSubmissions(bridgeResult.homeworkId)[0].status ===
          "Checked" &&
        database.getHomeworkSubmissions(bridgeResult.homeworkId)[0].marks ===
          9,
      "Homework or submission updates did not persist.",
    );
    assert(
      database.getClassTests().length === 1 &&
        database.getClassTests()[0].id === bridgeResult.classTestId &&
        database.getClassTestMarks(bridgeResult.classTestId).length === 1 &&
        database.getClassTestMarks(bridgeResult.classTestId)[0]
          .resultStatus === "Pass" &&
        database.getClassTestMarks(bridgeResult.classTestId)[0]
          .marksObtained === 9,
      "Class test or mark updates did not persist.",
    );
    const persistedQuestionPaper = database.getQuestionPaperById(
      bridgeResult.questionPaperId,
    );
    assert(
      database.getSubjectChapters().length === 1 &&
        database.getSubjectChapters()[0].id ===
          bridgeResult.subjectChapterId &&
        database.getQuestions().length === 0 &&
        database.getQuestionPapers().length === 1 &&
        persistedQuestionPaper?.paperNo === "QP-2026-0001" &&
        persistedQuestionPaper.items.length === 1 &&
        persistedQuestionPaper.items[0].optionC === "3",
      "Question paper chapters or saved paper snapshots did not persist.",
    );
    assert(
      database.getIssuedCertificates().length === 1 &&
        database.getIssuedCertificates()[0].certificateNo ===
          "CERT-2026-0001",
      "Issued certificate did not persist.",
    );
    assert(
      database.getEmployees().length === 1 &&
        database.getEmployees()[0].id === bridgeResult.employeeId &&
        database.getEmployees()[0].designation === "Senior Teacher",
      "Employee record did not persist.",
    );
    assert(
      database.getSalaryPayments().length === 1 &&
        database.getSalaryPayments()[0].id === bridgeResult.salaryPaymentId &&
        database.getSalaryPayments()[0].netSalary === 49500,
      "Salary payment did not persist.",
    );
    assert(
      database.getAccountTransactions().length === 5 &&
        database
          .getAccountTransactions()
          .some(
            (transaction) =>
              transaction.id === bridgeResult.manualExpenseId &&
              transaction.type === "Expense",
          ) &&
        database
          .getAccountTransactions()
          .filter((transaction) => transaction.linkedModule === "Fees")
          .length === 2,
      "Account transactions did not persist.",
    );
    assert(
      database.getMarksByExam(bridgeResult.examId).length === 1,
      "Marks by exam did not persist.",
    );
    assert(database.getClasses().length === 1, "Class did not persist.");
    assert(database.getSections().length === 1, "Section did not persist.");
    assert(database.getFeeHeads().length === 1, "Fee head did not persist.");
    assert(
      database.getFeeStructures().length === 1,
      "Fee structure did not persist.",
    );
    const importTemplate = database.getStudentImportTemplate();
    assert(
      importTemplate.columns.includes("Admission No") &&
        importTemplate.columns.includes("Student Name") &&
        importTemplate.filename.endsWith(".xlsx"),
      "Student import template metadata is incomplete.",
    );
    const skipImportResult = database.importStudentsBulk(
      [
        {
          rowNumber: 2,
          admissionNo: "IMP-001",
          name: "Imported Student",
          className: "10",
          section: "A",
          guardianName: "Imported Guardian",
          mobile: "0123456789",
          fatherName: "Imported Father",
          motherName: "Imported Mother",
          email: "imported@example.com",
          gender: "Female",
          bloodGroup: "O+",
          aadharNo: "001122334455",
          previousSchool: "Previous Test School",
          notes: "Imported from spreadsheet smoke test",
          status: "Active",
        },
        {
          rowNumber: 3,
          admissionNo: "SMOKE-001",
          name: "Duplicate Student",
          className: "10",
          section: "A",
          guardianName: "Duplicate Guardian",
          mobile: "9999999999",
          status: "Active",
        },
      ],
      { mode: "skip", autoCreateMasters: false },
    );
    assert(
      skipImportResult.imported === 1 &&
        skipImportResult.inserted === 1 &&
        skipImportResult.skipped === 1 &&
        skipImportResult.duplicates === 1,
      "Student import did not insert a valid row and skip a duplicate.",
    );
    assert(
      (() => {
        const importedStudent = database
          .getStudents()
          .find((student) => student.admissionNo === "IMP-001");
        return (
          importedStudent?.mobile === "0123456789" &&
          importedStudent.fatherName === "Imported Father" &&
          importedStudent.motherName === "Imported Mother" &&
          importedStudent.email === "imported@example.com" &&
          importedStudent.aadharNo === "001122334455"
        );
      })(),
      "Imported text or optional student fields were not preserved.",
    );
    const updateImportResult = database.importStudentsBulk(
      [
        {
          rowNumber: 2,
          admissionNo: "SMOKE-001",
          name: "Updated Imported Student",
          className: "10",
          section: "A",
          guardianName: "Updated Guardian",
          mobile: "9777777777",
          status: "Active",
        },
      ],
      { mode: "update", autoCreateMasters: false },
    );
    assert(
      updateImportResult.imported === 1 &&
        updateImportResult.updated === 1 &&
        database.getUserCount() === 2 &&
        database
          .getStudents()
          .find((student) => student.admissionNo === "SMOKE-001")?.name ===
          "Updated Imported Student",
      "Update duplicate import mode failed.",
    );
    const autoCreateImportResult = database.importStudentsBulk(
      [
        {
          rowNumber: 2,
          admissionNo: "IMP-002",
          name: "Auto Master Student",
          className: "Imported Class",
          section: "Z",
          guardianName: "Auto Guardian",
          mobile: "9666666666",
          status: "Active",
        },
      ],
      { mode: "skip", autoCreateMasters: true },
    );
    assert(
      autoCreateImportResult.imported === 1 &&
        autoCreateImportResult.classesCreated === 1 &&
        autoCreateImportResult.sectionsCreated === 1 &&
        database
          .getClasses()
          .some((item) => item.name === "Imported Class") &&
        database
          .getSections()
          .some(
            (item) =>
              item.className === "Imported Class" && item.name === "Z",
          ),
      "Student import did not auto-create the class and section.",
    );
    assert(
      database.deleteSubject(bridgeResult.subjectId).success,
      "Subject soft delete failed.",
    );
    assert(database.getSubjects().length === 0, "Soft-deleted subject is active.");
    assert(
      database.deleteExam(bridgeResult.examId).success,
      "Exam soft delete failed.",
    );
    assert(database.getExams().length === 0, "Soft-deleted exam is active.");
    assert(
      database.deleteStudent(bridgeResult.studentId).success,
      "Student soft delete failed.",
    );
    assert(
      !database
        .getStudents()
        .some((student) => student.id === bridgeResult.studentId),
      "Soft-deleted student is still active.",
    );
    const firstDemoResult = database.createDemoData("Smoke Test Owner");
    assert(
      firstDemoResult.success &&
        firstDemoResult.created.classes === 2 &&
        firstDemoResult.created.sections === 4 &&
        firstDemoResult.created.feeHeads === 2 &&
        firstDemoResult.created.feeStructures === 4 &&
        firstDemoResult.created.students === 5 &&
        firstDemoResult.created.feePayments === 2 &&
        firstDemoResult.created.attendance === 5 &&
        firstDemoResult.created.subjects === 2 &&
        firstDemoResult.created.exams === 1 &&
        firstDemoResult.created.marks === 6,
      "Sample demo data was not created completely.",
    );
    const demoCountsAfterFirstRun = {
      classes: database.getClasses().length,
      sections: database.getSections().length,
      feeHeads: database.getFeeHeads().length,
      feeStructures: database.getFeeStructures().length,
      students: database.getStudents().length,
      payments: database.getFeePayments().length,
      attendance: database.getAttendance().length,
      subjects: database.getSubjects().length,
      exams: database.getExams().length,
      marks: database.getMarks().length,
    };
    const secondDemoResult = database.createDemoData("Smoke Test Owner");
    assert(
      secondDemoResult.success &&
        secondDemoResult.alreadyPresent &&
        Object.values(secondDemoResult.created).every((count) => count === 0),
      "Repeated demo data creation was not idempotent.",
    );
    assert(
      demoCountsAfterFirstRun.classes === database.getClasses().length &&
        demoCountsAfterFirstRun.sections === database.getSections().length &&
        demoCountsAfterFirstRun.feeHeads === database.getFeeHeads().length &&
        demoCountsAfterFirstRun.feeStructures ===
          database.getFeeStructures().length &&
        demoCountsAfterFirstRun.students === database.getStudents().length &&
        demoCountsAfterFirstRun.payments === database.getFeePayments().length &&
        demoCountsAfterFirstRun.attendance === database.getAttendance().length &&
        demoCountsAfterFirstRun.subjects === database.getSubjects().length &&
        demoCountsAfterFirstRun.exams === database.getExams().length &&
        demoCountsAfterFirstRun.marks === database.getMarks().length,
      "Repeated demo data creation changed the sample dataset.",
    );
    assert(
      database.getClasses().some((item) => item.name === "10") &&
        database.getFeeHeads().some((item) => item.name === "Tuition Fee"),
      "Demo data creation removed or replaced existing master data.",
    );
    database.close();

    console.log("Database and IPC smoke test passed.");
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
    app.exit(0);
  } catch (error) {
    console.error(error);
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
    app.exit(1);
  }
});
