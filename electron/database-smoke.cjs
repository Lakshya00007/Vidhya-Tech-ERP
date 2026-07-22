const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const Database = require("better-sqlite3");
const { app, BrowserWindow } = require("electron");
const {
  applyPendingDatabaseRestore,
  createBackupService,
  createFullBackupArchive,
  extractFullBackupArchive,
  getRestorePaths,
  inspectBackupArchive,
  validateDatabaseFile,
  validateFullBackupArchive,
  _test: backupTestHelpers,
} = require("./backup.cjs");
const { createAuthService } = require("./auth.cjs");
const {
  createCommunicationService,
  extractSafeErrorMessage,
} = require("./communications.cjs");
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
    let currentNow = new Date(testNow);
    const remoteRequests = [];
    let remoteFailure = null;
    let remoteResponse = {
      valid: true,
      status: "Active",
      message: "License active",
      expiresAt: "2027-07-03T23:59:59.999Z",
      maintenanceUntil: "2027-07-03T23:59:59.999Z",
      serverTime: testNow.toISOString(),
    };
    const remoteCheck = async (input) => {
      remoteRequests.push(input);
      if (remoteFailure) {
        throw new Error(remoteFailure);
      }
      return remoteResponse;
    };
    const licenseService = createLicenseService({
      database,
      deviceIdService,
      publicKeyPath: testPublicKeyPath,
      now: () => new Date(currentNow),
      licenseServerUrl: "https://license-smoke.test",
      remoteCheck,
      appVersion: "1.1.0-smoke",
      os: "smoke-os",
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
    const unavailableReplacementLicenseKey = createLicenseKey(
      {
        licenseId: "LIC-SMOKE-WONDER-OFFLINE",
        schoolName: "Wonder Child School",
        deviceId: firstDeviceId,
        plan: "Annual",
        issuedAt: "2026-07-03T00:00:00.000Z",
        expiresAt: "2027-07-03T23:59:59.999Z",
        maintenanceUntil: "2027-07-03T23:59:59.999Z",
        maxUsers: 15,
        features: ["all"],
      },
      testPrivateKey,
    );
    const replacementLicenseKey = createLicenseKey(
      {
        licenseId: "LIC-SMOKE-WONDER-001",
        schoolName: "Wonder Child School",
        deviceId: firstDeviceId,
        plan: "Annual",
        issuedAt: "2026-07-03T00:00:00.000Z",
        expiresAt: "2027-07-03T23:59:59.999Z",
        maintenanceUntil: "2027-07-03T23:59:59.999Z",
        maxUsers: 15,
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
    const invalidSignatureLicenseParts = validLicenseKey.split(".");
    const signature = invalidSignatureLicenseParts[2];
    const replacementCharacter = signature.startsWith("A") ? "B" : "A";
    invalidSignatureLicenseParts[2] =
      `${replacementCharacter}${signature.slice(1)}`;
    const invalidSignatureLicenseKey = invalidSignatureLicenseParts.join(".");
    try {
      licenseService.activateLicense(invalidSignatureLicenseKey);
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

    let updateWrongDeviceMessage = "";
    try {
      await licenseService.updateLicenseKey(wrongDeviceLicenseKey);
    } catch (error) {
      updateWrongDeviceMessage =
        error instanceof Error ? error.message : "";
    }
    assert(
      updateWrongDeviceMessage === "Wrong device",
      "License update did not show a clear wrong-device error.",
    );

    let updateInvalidSignatureMessage = "";
    try {
      await licenseService.updateLicenseKey(invalidSignatureLicenseKey);
    } catch (error) {
      updateInvalidSignatureMessage =
        error instanceof Error ? error.message : "";
    }
    assert(
      updateInvalidSignatureMessage === "Invalid license signature",
      "License update did not show a clear signature error.",
    );

    let updateExpiredMessage = "";
    try {
      await licenseService.updateLicenseKey(expiredLicenseKey);
    } catch (error) {
      updateExpiredMessage =
        error instanceof Error ? error.message : "";
    }
    assert(
      updateExpiredMessage === "Expired license",
      "License update did not show a clear expired-license error.",
    );

    const authService = createAuthService(database);
    const communicationService = createCommunicationService({
      database,
      licenseService,
      isDevelopment: true,
    });
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
      communicationService,
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
        const employeeAttendanceApiAvailable = [
          "getEmployeeAttendanceByDate",
          "getEmployeeAttendanceByRange",
          "saveEmployeeAttendanceBulk",
          "updateEmployeeAttendance",
          "getEmployeeAttendanceSummary",
          "getEmployeeMonthlyAttendance",
          "getEmployeeAttendanceReport"
        ].every((method) => typeof window.erpApi[method] === "function");
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
          "getCurrentAccountProfile",
          "updateCurrentAccountProfile",
          "changeCurrentPassword",
          "changeTemporaryPassword",
          "getCurrentLoginHistory",
          "getCurrentUserEntityLink",
          "getCurrentStudentPortalData",
          "getCurrentEmployeePortalData",
          "getUsers",
          "createUser",
          "updateUser",
          "resetUserPassword",
          "deleteUser",
          "getAuditLogs",
          "getStudentLoginAccounts",
          "createStudentLoginAccount",
          "updateStudentLoginAccount",
          "disableStudentLoginAccount",
          "enableStudentLoginAccount",
          "resetStudentLoginPassword",
          "unlinkStudentLoginAccount",
          "getEmployeeLoginAccounts",
          "createEmployeeLoginAccount",
          "updateEmployeeLoginAccount",
          "disableEmployeeLoginAccount",
          "enableEmployeeLoginAccount",
          "resetEmployeeLoginPassword",
          "unlinkEmployeeLoginAccount"
        ].every((method) => typeof window.erpApi[method] === "function");
        const messageApiAvailable = [
          "getMessageInbox",
          "getSentMessages",
          "getMessageThread",
          "markMessageThreadRead",
          "archiveMessageThread",
          "unarchiveMessageThread",
          "createDirectMessage",
          "replyToMessageThread",
          "editOwnMessage",
          "deleteOwnMessage",
          "closeMessageThread",
          "getAnnouncements",
          "getCurrentUserAnnouncements",
          "createAnnouncement",
          "updateAnnouncement",
          "publishAnnouncement",
          "cancelAnnouncement",
          "deleteAnnouncement",
          "getEligibleMessageRecipients",
          "resolveAnnouncementRecipients",
          "getMessageDeliveryReport",
          "getAnnouncementReadReport"
        ].every((method) => typeof window.erpApi[method] === "function");
        const communicationApiAvailable = [
          "configureCommunicationGateway",
          "getCommunicationGatewayConfiguration",
          "removeCommunicationGatewayToken",
          "getCommunicationIntegrationStatus",
          "testCommunicationGateway",
          "getCommunicationTemplates",
          "getExternalRecipientPreview",
          "sendExternalMessage",
          "sendExternalBatch",
          "getCommunicationJobs",
          "getCommunicationJob",
          "retryCommunicationJob"
        ].every((method) => typeof window.erpApi[method] === "function");
        const demoApiAvailable =
          typeof window.erpApi.createDemoData === "function";
        const settingsPreferencesApiAvailable = [
          "getSchoolRules",
          "createSchoolRule",
          "updateSchoolRule",
          "deleteSchoolRule",
          "reorderSchoolRules",
          "getAppPreferences",
          "updateAppPreferences",
          "getUserPreferences",
          "updateUserPreferences"
        ].every((method) => typeof window.erpApi[method] === "function");
        const studentImportApiAvailable = [
          "importStudentsBulk",
          "getStudentImportTemplate"
        ].every((method) => typeof window.erpApi[method] === "function");
        const studentAdmissionApiAvailable = [
          "getStudentAdmissionProfile",
          "getNextStudentAdmissionNumbers",
          "saveStudentAdmission",
          "getAdmissionFormSnapshots"
        ].every((method) => typeof window.erpApi[method] === "function");
        const familyApiAvailable = [
          "getFamilies",
          "getFamilyById",
          "createFamily",
          "updateFamily",
          "deleteFamily",
          "getFamilyStudents",
          "getGuardians",
          "createGuardian",
          "updateGuardian",
          "deleteGuardian",
          "getStudentGuardians",
          "linkGuardianToStudent",
          "updateStudentGuardianLink",
          "unlinkGuardianFromStudent",
          "linkSiblingStudents",
          "createFamilyFromStudentDetails",
          "getParentsInfoReport",
          "getEmergencyContactsReport",
          "getSiblingReport"
        ].every((method) => typeof window.erpApi[method] === "function");
        const certificateApiAvailable = [
          "getCertificateTemplates",
          "createCertificateTemplate",
          "updateCertificateTemplate",
          "deleteCertificateTemplate",
          "issueCertificate",
          "getIssuedCertificates",
          "getIssuedCertificatesByStudent",
          "getDocumentTemplateSettings",
          "updateDocumentTemplateSetting",
          "getAdmissionFormData",
          "saveAdmissionFormSnapshot",
          "getAdmissionFormSnapshots",
          "getTransferCertificates",
          "getTransferCertificate",
          "getTransferCertificatePreview",
          "createTransferCertificateDraft",
          "updateTransferCertificateDraft",
          "issueTransferCertificate",
          "reprintTransferCertificate",
          "cancelTransferCertificate",
          "markStudentTransferredFromCertificate",
          "getFeeReceiptPrintData",
          "recordFeeReceiptPrint"
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
        const behaviourSkillsApiAvailable = [
          "getBehaviourTraits",
          "createBehaviourTrait",
          "updateBehaviourTrait",
          "deleteBehaviourTrait",
          "getSkillTraits",
          "createSkillTrait",
          "updateSkillTrait",
          "deleteSkillTrait",
          "getBehaviourRatings",
          "saveBehaviourRatingsBulk",
          "getSkillRatings",
          "saveSkillRatingsBulk",
          "getStudentObservations",
          "createStudentObservation",
          "updateStudentObservation",
          "deleteStudentObservation"
        ].every((method) => typeof window.erpApi[method] === "function");
        const academicSessionsApiAvailable = [
          "getAcademicSessions",
          "getCurrentAcademicSession",
          "createAcademicSession",
          "updateAcademicSession",
          "setCurrentAcademicSession",
          "closeAcademicSession",
          "deleteAcademicSession",
          "getStudentSessionHistory",
          "getSessionStudents",
          "createOrUpdateStudentSessionHistory",
          "getPromotionPreview",
          "promoteStudentsBulk",
          "getStudentPromotions",
          "getStudentPromotionById",
          "getPromotionReport",
          "getCarryForwardDues",
          "updateCarryForwardDue",
          "waiveCarryForwardDue"
        ].every((method) => typeof window.erpApi[method] === "function");
        const feeInvoiceApiAvailable = [
          "getDiscountTypes",
          "createDiscountType",
          "updateDiscountType",
          "deleteDiscountType",
          "getStudentDiscounts",
          "createStudentDiscount",
          "updateStudentDiscount",
          "deleteStudentDiscount",
          "getFeeInvoicePreview",
          "createFeeInvoice",
          "getFeeInvoices",
          "getFeeInvoiceById",
          "cancelFeeInvoice",
          "refreshFeeInvoiceStatus",
          "allocateFeePaymentToInvoices",
          "getStudentOutstandingInvoices",
          "getFeeInvoiceSummary",
          "getFeeInvoiceAccountsReport",
          "getStudentFeeLedger",
          "getFeeInvoiceAccountMappings",
          "saveFeeInvoiceAccountMapping",
          "deleteFeeInvoiceAccountMapping",
          "reverseFeePayment"
        ].every((method) => typeof window.erpApi[method] === "function");
        const reportCardApiAvailable = [
          "getGradingSchemes",
          "getGradingSchemeById",
          "createGradingScheme",
          "updateGradingScheme",
          "deleteGradingScheme",
          "setDefaultGradingScheme",
          "calculateGrade",
          "getReportCardTemplates",
          "createReportCardTemplate",
          "updateReportCardTemplate",
          "deleteReportCardTemplate",
          "getReportCardPreview",
          "generateStudentReportCard",
          "generateClassReportCards",
          "getStudentReportCards",
          "getStudentReportCardById",
          "updateReportCardRemarks",
          "deleteReportCard",
          "getClassResultSummary",
          "getResultPositions"
        ].every((method) => typeof window.erpApi[method] === "function");
        const releaseModuleApiAvailable = [
          "getExamSchedules",
          "getExamSchedule",
          "createExamSchedule",
          "updateExamSchedule",
          "deleteExamSchedule",
          "publishExamSchedule",
          "cancelExamSchedule",
          "completeExamSchedule",
          "getExamScheduleEntries",
          "saveExamScheduleEntries",
          "detectExamScheduleConflicts",
          "getDateSheet",
          "getResultSheet",
          "getBlankAwardList",
          "getStudentProgressReport",
          "getCustomReportDomains",
          "previewCustomReport",
          "getSavedReportDefinitions",
          "saveReportDefinition",
          "deleteReportDefinition",
          "getLiveClasses",
          "getLiveClass",
          "createLiveClass",
          "updateLiveClass",
          "setLiveClassStatus",
          "saveLiveClassAttendance",
          "previewLiveClassNotification",
          "notifyLiveClassRecipients",
          "getStoreCategories",
          "saveStoreCategory",
          "getStoreTaxRates",
          "saveStoreTaxRate",
          "getStoreProducts",
          "saveStoreProduct",
          "getStoreAccountMappings",
          "saveStoreAccountMapping",
          "createStoreInventoryTransaction",
          "getStoreInventoryLedger",
          "getStoreOrders",
          "createStoreOrder",
          "resumeHeldStoreOrder",
          "cancelHeldStoreOrder",
          "reverseStoreOrder",
          "getCurrentStorePosSession",
          "getStorePosSessions",
          "openStorePosSession",
          "closeStorePosSession",
          "getStoreReports"
        ].every((method) => typeof window.erpApi[method] === "function");
        const licenseApiAvailable = [
          "getDeviceId",
          "getLicenseStatus",
          "activateLicense",
          "updateLicenseKey",
          "deactivateLicense",
          "getLicenseInfo",
          "checkRemoteLicenseNow",
          "getRemoteLicenseStatus"
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
        const admin = await window.erpApi.createUser({
          name: "Smoke Test Admin",
          username: "admin",
          email: "admin@example.com",
          password: "Admin-Password",
          role: "Admin",
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
        const accountProfile = await window.erpApi.getCurrentAccountProfile();
        const accountProfileSafe = [
          "passwordHash",
          "passwordSalt",
          "password_hash",
          "password_salt"
        ].every(
          (field) =>
            !Object.prototype.hasOwnProperty.call(accountProfile, field)
        );
        let accountDuplicateUsernameRejected = false;
        try {
          await window.erpApi.updateCurrentAccountProfile({
            name: "Smoke Test Owner",
            username: "teacher",
            email: "owner@example.com"
          });
        } catch {
          accountDuplicateUsernameRejected = true;
        }
        const attemptedProtectedProfileUpdate =
          await window.erpApi.updateCurrentAccountProfile({
            name: "Smoke Test Owner Updated",
            username: "owner",
            email: "owner-updated@example.com",
            role: "Viewer",
            status: "Inactive"
          });
        const accountRoleProtected =
          attemptedProtectedProfileUpdate.role === "Owner" &&
          attemptedProtectedProfileUpdate.status === "Active";
        const restoredAccountProfile =
          await window.erpApi.updateCurrentAccountProfile({
            name: "Smoke Test Owner",
            username: "owner",
            email: "owner@example.com"
          });
        let wrongCurrentPasswordRejected = false;
        try {
          await window.erpApi.changeCurrentPassword({
            currentPassword: "wrong-current-password",
            newPassword: "Updated-Owner-Password"
          });
        } catch {
          wrongCurrentPasswordRejected = true;
        }
        const currentPasswordChange =
          await window.erpApi.changeCurrentPassword({
            currentPassword: "Initial-Owner-Password",
            newPassword: "Updated-Owner-Password"
          });
        await window.erpApi.logout();
        let oldPasswordRejectedAfterChange = false;
        try {
          await window.erpApi.login("owner", "Initial-Owner-Password");
        } catch {
          oldPasswordRejectedAfterChange = true;
        }
        const reloggedOwnerAfterPasswordChange =
          await window.erpApi.login("owner", "Updated-Owner-Password");
        const loginHistory = await window.erpApi.getCurrentLoginHistory({
          limit: 50
        });
        const loginHistoryRecorded =
          loginHistory.some(
            (entry) => entry.username === "owner" && entry.success
          ) &&
          loginHistory.some(
            (entry) =>
              entry.username === "owner" &&
              !entry.success &&
              entry.failureReason.includes("Invalid username or password")
          );
        const appPreferences =
          await window.erpApi.updateAppPreferences({
            themeMode: "System",
            accentColor: "Indigo",
            language: "English",
            compactSidebar: true,
            fontScale: "Large",
            dateFormat: "DD MMM YYYY",
            timeFormat: "24 Hour"
          });
        const userPreferences =
          await window.erpApi.updateUserPreferences({
            themeMode: "Dark",
            accentColor: "Green",
            language: "Hindi",
            compactSidebar: true,
            fontScale: "Large",
            dateFormat: "YYYY-MM-DD",
            timeFormat: "24 Hour"
          });
        const reloadedUserPreferences =
          await window.erpApi.getUserPreferences();
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
        const nextSchoolClass = await window.erpApi.createClass({
          name: "11",
          displayOrder: 11,
          status: "Active"
        });
        await window.erpApi.createSection({
          classId: nextSchoolClass.id,
          name: "A",
          status: "Active"
        });
        const fromAcademicSession =
          await window.erpApi.createAcademicSession({
            sessionName: "2025-26",
            startDate: "2025-04-01",
            endDate: "2026-03-31"
          });
        await window.erpApi.setCurrentAcademicSession(
          fromAcademicSession.id
        );
        const toAcademicSession =
          await window.erpApi.createAcademicSession({
            sessionName: "2026-27",
            startDate: "2026-04-01",
            endDate: "2027-03-31"
          });
        const attendanceRule = await window.erpApi.createSchoolRule({
          title: "Attendance Requirement",
          category: "Attendance",
          ruleText: "Students must maintain regular attendance.",
          displayOrder: 2,
          status: "Active",
          academicSessionId: fromAcademicSession.id,
          academicSessionName: fromAcademicSession.sessionName,
          effectiveFrom: "2025-04-01"
        });
        const feesRule = await window.erpApi.createSchoolRule({
          title: "Fee Due Date",
          category: "Fees",
          ruleText: "Fees are payable before the due date.",
          displayOrder: 1,
          status: "Active",
          academicSessionId: fromAcademicSession.id,
          academicSessionName: fromAcademicSession.sessionName,
          effectiveFrom: "2025-04-01"
        });
        const updatedAttendanceRule =
          await window.erpApi.updateSchoolRule(attendanceRule.id, {
            ruleText:
              "Students must maintain regular attendance and notify absences.",
            displayOrder: 3
          });
        const attendanceRules = await window.erpApi.getSchoolRules({
          category: "Attendance"
        });
        const reorderedRules = await window.erpApi.reorderSchoolRules([
          { id: updatedAttendanceRule.id, displayOrder: 1 },
          { id: feesRule.id, displayOrder: 2 }
        ]);
        const deletedFeesRule =
          await window.erpApi.deleteSchoolRule(feesRule.id);
        const rulesAfterDelete = await window.erpApi.getSchoolRules({});
        const feeHead = await window.erpApi.createFeeHead({
          name: "Tuition Fee",
          description: "Monthly tuition",
          frequency: "Monthly",
          status: "Active"
        });
        const tuitionFeeStructure = await window.erpApi.createFeeStructure({
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
        const initialStudentSessionHistory =
          await window.erpApi.createOrUpdateStudentSessionHistory({
            studentId: student.id,
            academicSessionId: fromAcademicSession.id,
            className: "10",
            section: "A",
            rollNo: "10",
            status: "Active",
            resultStatus: "Not Applicable"
          });
        const updatedStudent = await window.erpApi.updateStudent(student.id, {
          mobile: "9888888888"
        });
        const smokeFamily = await window.erpApi.createFamily({
          familyName: "Database Test Family",
          primaryContactName: "Smoke Test Father",
          primaryMobile: "9888888888",
          email: "family@example.com",
          address: "Family Test Address",
          city: "Test City",
          state: "Test State",
          emergencyContactName: "Smoke Test Mother",
          emergencyContactMobile: "9777777700",
          notes: "Family smoke test",
          status: "Active"
        });
        const fatherGuardian = await window.erpApi.createGuardian({
          familyId: smokeFamily.id,
          fullName: "Smoke Test Father",
          relation: "Father",
          mobile: "9888888888",
          email: "father@example.com",
          occupation: "Engineer",
          isPrimary: true,
          canPickupStudent: true,
          emergencyContact: false,
          status: "Active"
        });
        const motherGuardian = await window.erpApi.createGuardian({
          familyId: smokeFamily.id,
          fullName: "Smoke Test Mother",
          relation: "Mother",
          mobile: "9777777700",
          email: "mother@example.com",
          occupation: "Doctor",
          isPrimary: false,
          canPickupStudent: true,
          emergencyContact: true,
          status: "Active"
        });
        const fatherStudentLink =
          await window.erpApi.linkGuardianToStudent({
            studentId: student.id,
            guardianId: fatherGuardian.id,
            familyId: smokeFamily.id,
            relationToStudent: "Father",
            isPrimary: true,
            livesWithStudent: true,
            financialResponsibility: true,
            pickupAuthorized: true
          });
        await window.erpApi.linkGuardianToStudent({
          studentId: student.id,
          guardianId: motherGuardian.id,
          familyId: smokeFamily.id,
          relationToStudent: "Mother",
          isPrimary: true,
          livesWithStudent: true,
          financialResponsibility: false,
          pickupAuthorized: true
        });
        const studentLinksAfterPrimary =
          await window.erpApi.getStudentGuardians(student.id);
        const admissionNumbers = await window.erpApi.getNextStudentAdmissionNumbers();
        const admissionStudentInput = {
          admissionNo: admissionNumbers.admissionNo,
          name: "Admission Workflow Student",
          className: schoolClass.name,
          section: "A",
          guardianName: "Admission Smoke Father",
          mobile: "9666666600",
          fatherName: "Admission Smoke Father",
          motherName: "Admission Smoke Mother",
          email: "admission.workflow@example.com",
          gender: "Female",
          bloodGroup: "B+",
          aadharNo: "123456789012",
          previousSchool: "Little Scholars Academy",
          notes: "Admission workflow smoke test",
          status: "Draft",
          address: "12 Admission Street",
          dateOfBirth: "2020-04-15",
          admissionDate: "2026-04-10"
        };
        const admissionDetailsInput = {
          applicationNo: admissionNumbers.applicationNo,
          academicSessionId: fromAcademicSession.id,
          academicSessionName: fromAcademicSession.sessionName,
          admissionRequiredFor: schoolClass.name,
          rollNo: "21",
          admissionType: "New Admission",
          feeStructureId: tuitionFeeStructure.id,
          feeStructureName: "Tuition Fee · 2026–2027",
          transportRequired: true,
          pickupPoint: "North Gate",
          routeName: "Route A",
          childPhotoPath: "student-photos/admission-workflow.jpg",
          fatherPhotoPath: "parent-photos/admission-father.jpg",
          motherPhotoPath: "parent-photos/admission-mother.jpg",
          firstName: "Admission",
          middleName: "Workflow",
          lastName: "Student",
          penNo: "PEN1234567",
          srNo: admissionNumbers.admissionNo,
          caste: "General",
          category: "General",
          nationality: "Indian",
          religion: "Not specified",
          motherTongue: "Hindi",
          identificationMarks: "Small mark on left hand",
          medicalNotes: "No allergies recorded",
          previousClass: "UKG",
          previousBoard: "State Board",
          previousSchoolAddress: "Old School Road",
          previousTcNumber: "TC-OLD-001",
          previousTcDate: "2026-03-31",
          previousResultStatus: "Promoted",
          reasonForLeavingPreviousSchool: "Family relocation",
          locality: "Admission Locality",
          city: "Test City",
          district: "Test District",
          state: "Test State",
          pinCode: "110001",
          distanceFromSchool: "3 km",
          emergencyContactNumber: "9666666601",
          preferredSmsNumber: "9666666600",
          preferredWhatsappNumber: "9666666602",
          sameAsGuardianAddress: true,
          guardianDifferentFromParents: false,
          primaryGuardianRole: "Father",
          feeContactRole: "Father",
          smsContactRole: "Father",
          emergencyContactRole: "Mother",
          pickupAuthorizedRole: "Father",
          declarationAccepted: false,
          schoolRulesAccepted: false,
          communicationConsent: false,
          emergencyConsent: false,
          photoConsent: false
        };
        const admissionFatherInput = {
          fullName: "Admission Smoke Father",
          relation: "Father",
          mobile: "9666666600",
          whatsappNumber: "9666666602",
          email: "admission.father@example.com",
          occupation: "Engineer",
          employerOrganization: "Smoke Engineering Works",
          qualification: "B.Tech",
          annualIncome: 900000,
          address: "12 Admission Street",
          isPrimary: true,
          financialResponsibility: true,
          smsContact: true,
          emergencyContact: false,
          pickupAuthorized: true,
          livesWithStudent: true
        };
        const admissionMotherInput = {
          fullName: "Admission Smoke Mother",
          relation: "Mother",
          mobile: "9666666601",
          whatsappNumber: "9666666601",
          email: "admission.mother@example.com",
          occupation: "Doctor",
          employerOrganization: "Smoke Clinic",
          qualification: "MBBS",
          annualIncome: 1000000,
          address: "12 Admission Street",
          isPrimary: false,
          financialResponsibility: false,
          smsContact: false,
          emergencyContact: true,
          pickupAuthorized: true,
          livesWithStudent: true
        };
        const admissionDocumentsInput = [
          {
            documentType: "Birth certificate",
            requirementStatus: "Required",
            receivedStatus: "Received",
            notes: "Verified at admission desk",
            receivedAt: "2026-04-10",
            verifiedBy: "Smoke Test Owner"
          },
          {
            documentType: "Previous report card",
            requirementStatus: "Optional",
            receivedStatus: "Pending",
            notes: "Parent will submit later"
          }
        ];
        const admissionDraft = await window.erpApi.saveStudentAdmission({
          mode: "Draft",
          student: admissionStudentInput,
          admissionDetails: admissionDetailsInput,
          family: {
            createNew: true,
            familyName: "Admission Workflow Family"
          },
          guardians: {
            father: admissionFatherInput,
            mother: admissionMotherInput
          },
          documents: admissionDocumentsInput,
          officeUse: {}
        });
        const draftProfile = await window.erpApi.getStudentAdmissionProfile(
          admissionDraft.student.id
        );
        const admissionDraftProfileCorrect =
          draftProfile.student.status === "Draft" &&
          draftProfile.admissionDetails.applicationNo ===
            admissionNumbers.applicationNo &&
          draftProfile.documents.length === 2 &&
          draftProfile.guardians.length === 2;
        const admittedProfile = await window.erpApi.saveStudentAdmission({
          studentId: admissionDraft.student.id,
          mode: "Admit",
          student: {
            ...admissionStudentInput,
            status: "Active"
          },
          admissionDetails: {
            ...admissionDetailsInput,
            declarationAccepted: true,
            declarationAcceptedDate: "2026-04-10",
            declarationAcceptedBy: "Admission Smoke Father",
            schoolRulesAccepted: true,
            communicationConsent: true,
            emergencyConsent: true,
            photoConsent: true
          },
          family: {
            familyId: draftProfile.family.id
          },
          guardians: {
            father: admissionFatherInput,
            mother: admissionMotherInput
          },
          documents: admissionDocumentsInput,
          officeUse: {
            approvedBy: "Smoke Test Owner",
            approvalDate: "2026-04-10",
            admissionOfficer: "Office Desk",
            principalApproval: "Approved",
            remarks: "Admitted from smoke test"
          }
        });
        const admissionGuardiansAfterRepeat =
          await window.erpApi.getStudentGuardians(admittedProfile.student.id);
        const admissionPrefilledForm =
          await window.erpApi.getAdmissionFormData({
            mode: "Prefilled",
            studentId: admittedProfile.student.id,
            formDate: "2026-04-10"
          });
        const admissionSnapshotBeforeEdit =
          await window.erpApi.saveAdmissionFormSnapshot({
            mode: "Prefilled",
            studentId: admittedProfile.student.id,
            formDate: "2026-04-10"
          });
        await window.erpApi.saveStudentAdmission({
          studentId: admittedProfile.student.id,
          mode: "Update",
          student: {
            ...admissionStudentInput,
            admissionNo: admittedProfile.student.admissionNo,
            name: "Admission Workflow Student Updated",
            status: "Active"
          },
          admissionDetails: {
            ...admissionDetailsInput,
            applicationNo: admittedProfile.admissionDetails.applicationNo,
            rollNo: "22"
          },
          family: {
            familyId: admittedProfile.family.id
          },
          guardians: {
            father: admissionFatherInput,
            mother: admissionMotherInput
          },
          documents: admissionDocumentsInput,
          officeUse: admittedProfile.officeUse
        });
        const admissionProfileAfterEdit =
          await window.erpApi.getStudentAdmissionProfile(
            admittedProfile.student.id
          );
        const admissionSnapshotHistory =
          await window.erpApi.getAdmissionFormSnapshots({
            studentId: admittedProfile.student.id
          });
        const legacyStudentAdmissionProfile =
          await window.erpApi.getStudentAdmissionProfile(student.id);
        const blankAdmissionProfileForm =
          await window.erpApi.getAdmissionFormData({
            mode: "Blank",
            formDate: "2026-04-10"
          });
        const studentCountBeforePrintPreview =
          (await window.erpApi.getStudents()).length;
        await window.erpApi.getAdmissionFormData({
          mode: "Prefilled",
          studentId: admittedProfile.student.id,
          formDate: "2026-04-10"
        });
        const studentCountAfterPrintPreview =
          (await window.erpApi.getStudents()).length;
        let duplicateAdmissionNumberRejected = false;
        try {
          await window.erpApi.saveStudentAdmission({
            mode: "Admit",
            student: {
              ...admissionStudentInput,
              name: "Duplicate Admission Number",
              mobile: "9555555500"
            },
            admissionDetails: {
              ...admissionDetailsInput,
              applicationNo: "APP-DUPLICATE-SMOKE"
            }
          });
        } catch (error) {
          duplicateAdmissionNumberRejected = true;
        }
        let duplicateApplicationNumberRejected = false;
        try {
          await window.erpApi.saveStudentAdmission({
            mode: "Admit",
            student: {
              ...admissionStudentInput,
              admissionNo: "SMOKE-ADM-UNIQUE",
              name: "Duplicate Application Number",
              mobile: "9444444400"
            },
            admissionDetails: {
              ...admissionDetailsInput,
              applicationNo: admissionNumbers.applicationNo
            }
          });
        } catch (error) {
          duplicateApplicationNumberRejected = true;
        }
        await window.erpApi.login("teacher", "Reset-Teacher-Password");
        let admissionUnauthorizedSaveRejected = false;
        try {
          await window.erpApi.saveStudentAdmission({
            mode: "Draft",
            student: {
              admissionNo: "SMOKE-TEACHER-DRAFT",
              name: "Teacher Blocked Admission",
              className: schoolClass.name,
              section: "A",
              status: "Draft"
            },
            admissionDetails: {
              applicationNo: "APP-TEACHER-BLOCKED"
            }
          });
        } catch (error) {
          admissionUnauthorizedSaveRejected = true;
        }
        await window.erpApi.login("owner", "Updated-Owner-Password");
        await window.erpApi.saveSchoolSettings({
          schoolName: "Persistence Test School",
          address: "Local Test Address",
          phone: "1234567890",
          email: "test@example.com",
          academicYear: "2026–2027",
          receiptPrefix: "TEST-RC"
        });
        const initialAccountCategories =
          await window.erpApi.getAccountCategories();
        const tuitionIncomeCategory = initialAccountCategories.find(
          (category) => category.name === "Tuition Fee Income"
        );
        if (!tuitionIncomeCategory) {
          throw new Error("Default tuition income category was not created.");
        }
        const feeInvoiceAccountMapping =
          await window.erpApi.saveFeeInvoiceAccountMapping({
            feeHeadId: feeHead.id,
            accountCategoryId: tuitionIncomeCategory.id,
            status: "Active"
          });
        const discountType = await window.erpApi.createDiscountType({
          name: "Sibling Discount",
          discountMode: "Percentage",
          defaultValue: 10,
          description: "Sibling concession smoke test",
          status: "Active"
        });
        const studentDiscount =
          await window.erpApi.createStudentDiscount({
            studentId: student.id,
            discountTypeId: discountType.id,
            academicSessionId: fromAcademicSession.id,
            reason: "Smoke test concession",
            approvedBy: "Smoke Test Owner",
            status: "Active"
          });
        const invoicePreview =
          await window.erpApi.getFeeInvoicePreview({
            studentId: student.id,
            academicSessionId: fromAcademicSession.id,
            billingPeriod: "Monthly",
            invoiceDate: "2026-07-03",
            dueDate: "2026-07-20",
            includePreviousDue: false,
            lateFee: 0,
            adjustmentAmount: 0
          });
        const feeInvoice = await window.erpApi.createFeeInvoice({
          studentId: student.id,
          academicSessionId: fromAcademicSession.id,
          billingPeriod: "Monthly",
          invoiceDate: "2026-07-03",
          dueDate: "2026-07-20",
          includePreviousDue: false,
          lateFee: 0,
          adjustmentAmount: 0,
          notes: "Smoke test invoice"
        });
        let duplicateInvoiceRejected = false;
        try {
          await window.erpApi.createFeeInvoice({
            studentId: student.id,
            academicSessionId: fromAcademicSession.id,
            billingPeriod: "Monthly",
            invoiceDate: "2026-07-03",
            dueDate: "2026-07-20",
            includePreviousDue: false,
            lateFee: 0,
            adjustmentAmount: 0
          });
        } catch {
          duplicateInvoiceRejected = true;
        }
        const unpaidInvoiceForCancellation =
          await window.erpApi.createFeeInvoice({
            studentId: student.id,
            academicSessionId: fromAcademicSession.id,
            billingPeriod: "Quarterly",
            invoiceDate: "2026-07-03",
            dueDate: "2026-07-20",
            includePreviousDue: false,
            lateFee: 0,
            adjustmentAmount: 0
          });
        const cancelledUnpaidInvoice =
          await window.erpApi.cancelFeeInvoice(
            unpaidInvoiceForCancellation.id,
            "Unpaid invoice cancellation smoke test"
          );
        const defaultBehaviourTraits =
          await window.erpApi.getBehaviourTraits();
        const defaultSkillTraits = await window.erpApi.getSkillTraits();
        const behaviourTrait =
          await window.erpApi.createBehaviourTrait({
            name: "Teamwork",
            description: "Works constructively with peers",
            status: "Active"
          });
        const updatedBehaviourTrait =
          await window.erpApi.updateBehaviourTrait(
            behaviourTrait.id,
            { description: "Updated teamwork description" }
          );
        const affectiveTrait = await window.erpApi.createSkillTrait({
          name: "Curiosity",
          domain: "Affective",
          description: "Shows interest in learning",
          status: "Active"
        });
        const psychomotorTrait = await window.erpApi.createSkillTrait({
          name: "Coordination",
          domain: "Psychomotor",
          description: "Demonstrates coordinated movement",
          status: "Active"
        });
        const behaviourRatings =
          await window.erpApi.saveBehaviourRatingsBulk([
            {
              studentId: student.id,
              traitId: behaviourTrait.id,
              rating: "Very Good",
              ratingDate: "2026-07-05",
              academicYear: "2026–2027",
              remarks: "Collaborates well"
            }
          ]);
        const updatedBehaviourRatings =
          await window.erpApi.saveBehaviourRatingsBulk([
            {
              studentId: student.id,
              traitId: behaviourTrait.id,
              rating: "Excellent",
              ratingDate: "2026-07-05",
              academicYear: "2026–2027",
              remarks: "Updated rating"
            }
          ]);
        await window.erpApi.saveSkillRatingsBulk([
          {
            studentId: student.id,
            skillId: affectiveTrait.id,
            rating: "Good",
            ratingDate: "2026-07-05",
            academicYear: "2026–2027",
            remarks: "Asks relevant questions"
          },
          {
            studentId: student.id,
            skillId: psychomotorTrait.id,
            rating: "Very Good",
            ratingDate: "2026-07-05",
            academicYear: "2026–2027",
            remarks: "Good coordination"
          }
        ]);
        const affectiveRatings = await window.erpApi.getSkillRatings({
          className: "10",
          section: "A",
          domain: "Affective",
          startDate: "2026-07-01",
          endDate: "2026-07-31"
        });
        const psychomotorRatings = await window.erpApi.getSkillRatings({
          className: "10",
          section: "A",
          domain: "Psychomotor",
          startDate: "2026-07-01",
          endDate: "2026-07-31"
        });
        const observation = await window.erpApi.createStudentObservation({
          studentId: student.id,
          observationDate: "2026-07-05",
          observationType: "Academic",
          observationText: "Participated actively in the mathematics lesson.",
          actionTaken: "Encouraged continued participation.",
          followUpDate: "2026-07-12",
          status: "Follow Up"
        });
        const updatedObservation =
          await window.erpApi.updateStudentObservation(
            observation.id,
            {
              actionTaken: "Participation acknowledged by class teacher.",
              status: "Closed"
            }
          );
        const observationToDelete =
          await window.erpApi.createStudentObservation({
            studentId: student.id,
            observationDate: "2026-07-06",
            observationType: "General",
            observationText: "Temporary observation for soft-delete test.",
            status: "Open"
          });
        const observationDeleteResult =
          await window.erpApi.deleteStudentObservation(
            observationToDelete.id
          );
        const observationsAfterDelete =
          await window.erpApi.getStudentObservations({
            studentId: student.id
          });
        const filteredBehaviourRatings =
          await window.erpApi.getBehaviourRatings({
            studentId: student.id,
            traitId: behaviourTrait.id,
            startDate: "2026-07-05",
            endDate: "2026-07-05"
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
        const employeeAttendancePresent =
          await window.erpApi.saveEmployeeAttendanceBulk([
            {
              employeeId: employee.id,
              attendanceDate: "2026-07-08",
              status: "Present",
              checkInTime: "08:55",
              checkOutTime: "16:00",
              remarks: "On time"
            }
          ]);
        const employeeAttendanceLate =
          await window.erpApi.updateEmployeeAttendance(
            employeeAttendancePresent[0].id,
            {
              status: "Late",
              checkInTime: "09:15",
              checkOutTime: "16:10",
              lateMinutes: 15,
              overtimeMinutes: 10,
              remarks: "Late but completed shift"
            }
          );
        const employeeAttendanceDuplicateUpsert =
          await window.erpApi.saveEmployeeAttendanceBulk([
            {
              employeeId: employee.id,
              attendanceDate: "2026-07-08",
              status: "Late",
              checkInTime: "09:20",
              checkOutTime: "16:10",
              lateMinutes: 20,
              overtimeMinutes: 10,
              remarks: "Duplicate date upsert"
            }
          ]);
        const duplicateEmployeeAttendanceRows =
          await window.erpApi.getEmployeeAttendanceByDate(
            "2026-07-08",
            { employeeId: employee.id }
          );
        const employeeAttendanceBulk =
          await window.erpApi.saveEmployeeAttendanceBulk([
            {
              employeeId: employee.id,
              attendanceDate: "2026-07-09",
              status: "Present",
              checkInTime: "08:50",
              checkOutTime: "16:00"
            },
            {
              employeeId: deletedEmployee.id,
              attendanceDate: "2026-07-09",
              status: "Leave",
              leaveType: "Casual Leave",
              remarks: "History preservation row"
            }
          ]);
        const employeeAttendanceDailySummary =
          await window.erpApi.getEmployeeAttendanceSummary({
            date: "2026-07-08",
            department: "Academics"
          });
        const employeeAttendanceMonthlySummary =
          await window.erpApi.getEmployeeMonthlyAttendance(
            employee.id,
            "2026-07"
          );
        const employeeAttendanceReport =
          await window.erpApi.getEmployeeAttendanceReport({
            month: "2026-07",
            department: "Academics"
          });
        const employeeAttendanceRegister =
          await window.erpApi.getEmployeeAttendanceReport({
            startDate: "2026-07-08",
            endDate: "2026-07-09",
            employeeId: employee.id
          });
        const employeeDeleteResult = await window.erpApi.deleteEmployee(
          deletedEmployee.id
        );
        const deletedEmployeeAttendanceHistory =
          await window.erpApi.getEmployeeAttendanceByRange({
            employeeId: deletedEmployee.id,
            startDate: "2026-07-09",
            endDate: "2026-07-09"
          });
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
        const documentTemplateSettings =
          await window.erpApi.getDocumentTemplateSettings();
        const updatedReceiptTemplate =
          await window.erpApi.updateDocumentTemplateSetting("Fee Receipt", {
            feeReceiptTerms: "Smoke-test receipt terms",
            defaultPaperSize: "A5"
          });
        const blankAdmissionForm =
          await window.erpApi.getAdmissionFormData({
            mode: "Blank",
            formDate: "2026-07-07"
          });
        const prefilledAdmissionForm =
          await window.erpApi.getAdmissionFormData({
            mode: "Prefilled",
            studentId: student.id,
            formDate: "2026-07-07"
          });
        const admissionSnapshot =
          await window.erpApi.saveAdmissionFormSnapshot({
            mode: "Prefilled",
            studentId: student.id,
            formDate: "2026-07-07"
          });
        const transferPreview =
          await window.erpApi.getTransferCertificatePreview({
            studentId: student.id,
            issueDate: "2026-07-08",
            reasonForLeaving: "Parent request",
            duesPaidUpto: "July 2026"
          });
        const transferDraft =
          await window.erpApi.createTransferCertificateDraft({
            studentId: student.id,
            issueDate: "2026-07-08",
            reasonForLeaving: "Parent request",
            duesPaidUpto: "July 2026",
            promotionQualified: "Yes",
            promotedToClass: "11"
          });
        const transferDraftUpdated =
          await window.erpApi.updateTransferCertificateDraft(
            transferDraft.id,
            { generalConduct: "Very Good" }
          );
        const transferIssued =
          await window.erpApi.issueTransferCertificate(
            transferDraft.id,
            { issueDate: "2026-07-08" }
          );
        let issuedTransferOverwriteRejected = false;
        try {
          await window.erpApi.updateTransferCertificateDraft(
            transferIssued.id,
            { generalConduct: "Overwritten" }
          );
        } catch {
          issuedTransferOverwriteRejected = true;
        }
        const transferReprinted =
          await window.erpApi.reprintTransferCertificate(transferIssued.id);
        const transferCancelled =
          await window.erpApi.cancelTransferCertificate(
            transferIssued.id,
            "Smoke test cancellation"
          );
        let cancelledTransferNumberRejected = false;
        try {
          await window.erpApi.createTransferCertificateDraft({
            studentId: student.id,
            certificateNumber: transferCancelled.certificateNumber,
            serialNumber: "SMOKE-TC-NEW-SERIAL",
            issueDate: "2026-07-09"
          });
        } catch {
          cancelledTransferNumberRejected = true;
        }
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
        let ownerRoleAssignmentRejected = false;
        try {
          await window.erpApi.createEmployeeLoginAccount({
            employeeId: employee.id,
            username: "smoke_employee_owner",
            password: "Employee-Owner-Password",
            role: "Owner",
            mustChangePassword: false,
            status: "Active"
          });
        } catch {
          ownerRoleAssignmentRejected = true;
        }
        const employeeLoginAccount =
          await window.erpApi.createEmployeeLoginAccount({
            employeeId: employee.id,
            username: "smoke_employee_login",
            password: "Employee-Temp-Password",
            role: "Teacher",
            mustChangePassword: false,
            status: "Active"
          });
        let duplicateEmployeeLinkRejected = false;
        try {
          await window.erpApi.createEmployeeLoginAccount({
            employeeId: employee.id,
            username: "smoke_employee_duplicate",
            password: "Employee-Other-Password",
            role: "Teacher",
            mustChangePassword: false,
            status: "Active"
          });
        } catch {
          duplicateEmployeeLinkRejected = true;
        }
        await window.erpApi.logout();
        const employeeLogin = await window.erpApi.login(
          "smoke_employee_login",
          "Employee-Temp-Password"
        );
        const employeeEntityLink =
          await window.erpApi.getCurrentUserEntityLink();
        const employeePortalData =
          await window.erpApi.getCurrentEmployeePortalData();
        let employeeOtherSalaryRejected = false;
        try {
          await window.erpApi.getSalaryPaymentsByEmployee(deletedEmployee.id);
        } catch {
          employeeOtherSalaryRejected = true;
        }
        await window.erpApi.logout();
        await window.erpApi.login("owner", "Updated-Owner-Password");
        await window.erpApi.resetEmployeeLoginPassword(
          employeeLoginAccount.id,
          {
            password: "Employee-New-Password",
            mustChangePassword: false
          }
        );
        await window.erpApi.logout();
        let oldEmployeePasswordRejected = false;
        try {
          await window.erpApi.login(
            "smoke_employee_login",
            "Employee-Temp-Password"
          );
        } catch {
          oldEmployeePasswordRejected = true;
        }
        const employeeRelogin = await window.erpApi.login(
          "smoke_employee_login",
          "Employee-New-Password"
        );
        await window.erpApi.logout();
        await window.erpApi.login("owner", "Updated-Owner-Password");
        await window.erpApi.disableEmployeeLoginAccount(
          employeeLoginAccount.id,
          "Smoke disabled employee account"
        );
        await window.erpApi.logout();
        let disabledEmployeeLoginRejected = false;
        try {
          await window.erpApi.login(
            "smoke_employee_login",
            "Employee-New-Password"
          );
        } catch {
          disabledEmployeeLoginRejected = true;
        }
        await window.erpApi.login("owner", "Updated-Owner-Password");
        const reenabledEmployeeLogin =
          await window.erpApi.enableEmployeeLoginAccount(
            employeeLoginAccount.id
          );
        await window.erpApi.logout();
        const reenabledEmployeeRelogin = await window.erpApi.login(
          "smoke_employee_login",
          "Employee-New-Password"
        );
        await window.erpApi.logout();
        await window.erpApi.login("owner", "Updated-Owner-Password");
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
        const originalStudentClassTestMark =
          initialClassTestMarks.find((mark) => mark.studentId === student.id) ??
          initialClassTestMarks[0];
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
            originalStudentClassTestMark.id,
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
        const admissionFeeReceipt = await window.erpApi.createFeePayment({
          studentId: admittedProfile.student.id,
          feeType: "Tuition Fee",
          amount: 1000,
          paymentMode: "Cash",
          paymentDate: "2026-04-10",
          notes: "Admission office-use receipt"
        });
        const admissionOfficeUseWithReceipt =
          await window.erpApi.saveStudentAdmission({
            studentId: admittedProfile.student.id,
            mode: "Update",
            student: {
              ...admissionStudentInput,
              admissionNo: admittedProfile.student.admissionNo,
              name: admissionProfileAfterEdit.student.name,
              status: "Active"
            },
            admissionDetails: {
              ...admissionDetailsInput,
              applicationNo: admittedProfile.admissionDetails.applicationNo,
              rollNo: admissionProfileAfterEdit.admissionDetails.rollNo
            },
            family: {
              familyId: admittedProfile.family.id
            },
            guardians: {
              father: admissionFatherInput,
              mother: admissionMotherInput
            },
            documents: admissionDocumentsInput,
            officeUse: {
              ...admissionProfileAfterEdit.officeUse,
              feePaymentId: admissionFeeReceipt.id,
              feeReceiptNo: admissionFeeReceipt.receiptNo
            }
          });
        let wrongStudentReceiptRejected = false;
        try {
          await window.erpApi.saveStudentAdmission({
            studentId: admittedProfile.student.id,
            mode: "Update",
            student: {
              ...admissionStudentInput,
              admissionNo: admittedProfile.student.admissionNo,
              name: admissionProfileAfterEdit.student.name,
              status: "Active"
            },
            admissionDetails: {
              ...admissionDetailsInput,
              applicationNo: admittedProfile.admissionDetails.applicationNo
            },
            family: {
              familyId: admittedProfile.family.id
            },
            guardians: {
              father: admissionFatherInput,
              mother: admissionMotherInput
            },
            documents: admissionDocumentsInput,
            officeUse: {
              feePaymentId: firstPayment.id,
              feeReceiptNo: firstPayment.receiptNo
            }
          });
        } catch (error) {
          wrongStudentReceiptRejected = true;
        }
        const invoicePartialPayment =
          await window.erpApi.createFeePayment({
            studentId: student.id,
            feeType: "Tuition Fee",
            amount: 5000,
            paymentMode: "UPI",
            paymentDate: "2026-07-05",
            notes: "Invoice partial payment",
            invoiceAllocations: [
              {
                invoiceId: feeInvoice.id,
                allocatedAmount: 5000
              }
            ]
          });
        const partiallyPaidInvoice =
          await window.erpApi.getFeeInvoiceById(feeInvoice.id);
        const invoiceFinalPayment =
          await window.erpApi.createFeePayment({
            studentId: student.id,
            feeType: "Tuition Fee",
            amount: 6250,
            paymentMode: "Bank Transfer",
            paymentDate: "2026-07-06",
            notes: "Invoice final payment",
            invoiceAllocations: [
              {
                invoiceId: feeInvoice.id,
                allocatedAmount: 6250
              }
            ]
          });
        const paidInvoice =
          await window.erpApi.getFeeInvoiceById(feeInvoice.id);
        let paidInvoiceCancellationRejected = false;
        try {
          await window.erpApi.cancelFeeInvoice(
            feeInvoice.id,
            "Unsafe paid invoice cancellation smoke test"
          );
        } catch {
          paidInvoiceCancellationRejected = true;
        }
        const accountsAfterInvoicePayments =
          await window.erpApi.getAccountTransactions();
        const invoicePaymentAccountCount =
          accountsAfterInvoicePayments.filter(
            (transaction) =>
              transaction.linkedModule === "Fees" &&
              [
                invoicePartialPayment.id,
                invoiceFinalPayment.id
              ].includes(transaction.linkedRecordId)
          ).length;
        const invoiceGenerationCreatedAccount =
          accountsAfterInvoicePayments.some(
            (transaction) => transaction.linkedRecordId === feeInvoice.id
          );
        const paymentForReversal =
          await window.erpApi.createFeePayment({
            studentId: student.id,
            feeType: "Tuition Fee",
            amount: 100,
            paymentMode: "Cash",
            paymentDate: "2026-07-07",
            notes: "Reversal smoke test"
          });
        const accountsBeforeReversal =
          await window.erpApi.getAccountTransactions();
        const reversalResult = await window.erpApi.reverseFeePayment(
          paymentForReversal.id,
          "Smoke reversal"
        );
        const accountsAfterReversal =
          await window.erpApi.getAccountTransactions();
        const reversalRemovedActiveAccount =
          accountsAfterReversal.length ===
            accountsBeforeReversal.length - 1 &&
          !accountsAfterReversal.some(
            (transaction) =>
              transaction.linkedModule === "Fees" &&
              transaction.linkedRecordId === paymentForReversal.id
          );
        const partialReceiptPrintData =
          await window.erpApi.getFeeReceiptPrintData(invoicePartialPayment.id);
        const fullReceiptPrintData =
          await window.erpApi.getFeeReceiptPrintData(invoiceFinalPayment.id);
        const reversedReceiptPrintData =
          await window.erpApi.getFeeReceiptPrintData(paymentForReversal.id);
        const receiptPrintRecord =
          await window.erpApi.recordFeeReceiptPrint(invoicePartialPayment.id);
        const paymentsAfterReceiptPrint = await window.erpApi.getFeePayments();
        const accountsAfterReceiptPrint =
          await window.erpApi.getAccountTransactions();
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
        const gradingRanges = [
          {
            minValue: 90,
            maxValue: 100,
            grade: "A+",
            gradePoint: 10,
            resultStatus: "Pass",
            displayOrder: 1
          },
          {
            minValue: 80,
            maxValue: 89.99,
            grade: "A",
            gradePoint: 9,
            resultStatus: "Pass",
            displayOrder: 2
          },
          {
            minValue: 70,
            maxValue: 79.99,
            grade: "B+",
            gradePoint: 8,
            resultStatus: "Pass",
            displayOrder: 3
          },
          {
            minValue: 60,
            maxValue: 69.99,
            grade: "B",
            gradePoint: 7,
            resultStatus: "Pass",
            displayOrder: 4
          },
          {
            minValue: 50,
            maxValue: 59.99,
            grade: "C",
            gradePoint: 6,
            resultStatus: "Pass",
            displayOrder: 5
          },
          {
            minValue: 33,
            maxValue: 49.99,
            grade: "D",
            gradePoint: 5,
            resultStatus: "Pass",
            displayOrder: 6
          },
          {
            minValue: 0,
            maxValue: 32.99,
            grade: "F",
            gradePoint: 0,
            resultStatus: "Fail",
            displayOrder: 7
          }
        ];
        const gradingScheme = await window.erpApi.createGradingScheme({
          name: "Smoke Percentage Scheme",
          academicSessionId: toAcademicSession.id,
          className: "10",
          calculationMode: "Percentage",
          isDefault: true,
          description: "Smoke-test grading configuration",
          ranges: gradingRanges
        });
        const defaultGradingScheme =
          await window.erpApi.setDefaultGradingScheme(gradingScheme.id);
        let overlappingGradingRangeRejected = false;
        try {
          await window.erpApi.createGradingScheme({
            name: "Smoke Overlap Scheme",
            calculationMode: "Percentage",
            ranges: [
              {
                minValue: 0,
                maxValue: 50,
                grade: "D",
                resultStatus: "Pass"
              },
              {
                minValue: 40,
                maxValue: 100,
                grade: "A",
                resultStatus: "Pass"
              }
            ]
          });
        } catch {
          overlappingGradingRangeRejected = true;
        }
        const calculatedAPlus = await window.erpApi.calculateGrade({
          gradingSchemeId: gradingScheme.id,
          value: 91
        });
        const calculatedFail = await window.erpApi.calculateGrade({
          gradingSchemeId: gradingScheme.id,
          value: 20
        });
        const reportCardTemplate =
          await window.erpApi.createReportCardTemplate({
            name: "Smoke Standard Report Card",
            academicSessionId: toAcademicSession.id,
            className: "10",
            showAttendance: true,
            showClassTests: true,
            showBehaviour: true,
            showSkills: true,
            showTeacherRemarks: true,
            showPrincipalSignature: true,
            headerText: "Smoke test report card",
            footerText: "Generated by database smoke test",
            status: "Active"
          });
        const reportCardInput = {
          studentId: student.id,
          academicSessionId: toAcademicSession.id,
          className: "10",
          section: "A",
          examId: exam.id,
          gradingSchemeId: gradingScheme.id,
          templateId: reportCardTemplate.id,
          teacherRemarks: "Consistent academic performance.",
          principalRemarks: "Promoted subject to final approval."
        };
        const reportCardPreview =
          await window.erpApi.getReportCardPreview(reportCardInput);
        const generatedReportCard =
          await window.erpApi.generateStudentReportCard(reportCardInput);
        let duplicateReportCardRejected = false;
        try {
          await window.erpApi.generateStudentReportCard(reportCardInput);
        } catch {
          duplicateReportCardRejected = true;
        }
        const updatedReportCardRemarks =
          await window.erpApi.updateReportCardRemarks(
            generatedReportCard.id,
            {
              teacherRemarks: "Updated teacher remark.",
              principalRemarks: "Updated principal remark."
            }
          );
        await window.erpApi.updateMark(updatedMark.id, {
          obtainedMarks: 20,
          remarks: "Failing source mark update"
        });
        const savedReportCardAfterSourceChange =
          await window.erpApi.getStudentReportCardById(
            generatedReportCard.id
          );
        const failingReportPreview =
          await window.erpApi.getReportCardPreview(reportCardInput);
        const classReportBatch =
          await window.erpApi.generateClassReportCards({
            ...reportCardInput,
            studentId: undefined,
            regenerate: true
          });
        const classSummary =
          await window.erpApi.getClassResultSummary({
            academicSessionId: toAcademicSession.id,
            className: "10",
            section: "A",
            examId: exam.id
          });
        const resultPositions = await window.erpApi.getResultPositions({
          academicSessionId: toAcademicSession.id,
          className: "10",
          section: "A",
          examId: exam.id
        });
        const reportCardDeleteResult =
          await window.erpApi.deleteReportCard(generatedReportCard.id);
        const activeReportCardsAfterDelete =
          await window.erpApi.getStudentReportCards({
            academicSessionId: toAcademicSession.id,
            examId: exam.id,
            studentId: student.id
          });
        const regeneratedReportCardAfterDelete =
          await window.erpApi.generateStudentReportCard({
            ...reportCardInput,
            teacherRemarks: "Final generated report card.",
            principalRemarks: "Final principal remark."
          });
        const finalStudentReportCard =
          await window.erpApi.getStudentReportCardById(
            regeneratedReportCardAfterDelete.id
          );
        const activeReportCardsFinal =
          await window.erpApi.getStudentReportCards({
            academicSessionId: toAcademicSession.id,
            examId: exam.id,
            studentId: student.id
          });
        const marksAfterReportCardSourceChange =
          await window.erpApi.getMarksByStudentExam(student.id, exam.id);
        const repeatStudent = await window.erpApi.createStudent({
          admissionNo: "SMOKE-REPEAT",
          name: "Repeat Test Student",
          className: "10",
          section: "A",
          guardianName: "Repeat Legacy Guardian",
          mobile: "9666666600",
          email: "repeat-parent@example.com",
          address: "Repeat Legacy Address"
        });
        const tcStudent = await window.erpApi.createStudent({
          admissionNo: "SMOKE-TC",
          name: "TC Test Student",
          className: "10",
          section: "A"
        });
        const leftStudent = await window.erpApi.createStudent({
          admissionNo: "SMOKE-LEFT",
          name: "Left Test Student",
          className: "10",
          section: "A"
        });
        const studentLoginAccount =
          await window.erpApi.createStudentLoginAccount({
            studentId: student.id,
            username: "smoke_student_login",
            password: "Student-Temp-Password",
            mustChangePassword: true,
            status: "Active"
          });
        let duplicateStudentUsernameRejected = false;
        try {
          await window.erpApi.createStudentLoginAccount({
            studentId: repeatStudent.id,
            username: "smoke_student_login",
            password: "Student-Other-Password",
            mustChangePassword: true,
            status: "Active"
          });
        } catch {
          duplicateStudentUsernameRejected = true;
        }
        let duplicateStudentLinkRejected = false;
        try {
          await window.erpApi.createStudentLoginAccount({
            studentId: student.id,
            username: "smoke_student_duplicate",
            password: "Student-Other-Password",
            mustChangePassword: true,
            status: "Active"
          });
        } catch {
          duplicateStudentLinkRejected = true;
        }
        await window.erpApi.logout();
        const studentLogin = await window.erpApi.login(
          "smoke_student_login",
          "Student-Temp-Password"
        );
        const studentEntityLink =
          await window.erpApi.getCurrentUserEntityLink();
        const studentPasswordChanged =
          await window.erpApi.changeTemporaryPassword({
            currentPassword: "Student-Temp-Password",
            newPassword: "Student-New-Password"
          });
        await window.erpApi.logout();
        let oldStudentPasswordRejected = false;
        try {
          await window.erpApi.login(
            "smoke_student_login",
            "Student-Temp-Password"
          );
        } catch {
          oldStudentPasswordRejected = true;
        }
        const studentRelogin = await window.erpApi.login(
          "smoke_student_login",
          "Student-New-Password"
        );
        const studentPortalData =
          await window.erpApi.getCurrentStudentPortalData();
        let studentListAccessRejected = false;
        try {
          await window.erpApi.getStudents();
        } catch {
          studentListAccessRejected = true;
        }
        let studentMutationRejected = false;
        try {
          await window.erpApi.createFeeHead({
            name: "Blocked Student Fee Head",
            description: "Student role must not create this.",
            frequency: "Monthly",
            status: "Active"
          });
        } catch {
          studentMutationRejected = true;
        }
        let studentExternalSendRejected = false;
        try {
          await window.erpApi.sendExternalMessage({
            channel: "SMS",
            templateId: "blocked",
            recipient: {
              type: "Student",
              entityId: student.id,
              name: student.name,
              phoneMasked: "+91******9999"
            }
          });
        } catch {
          studentExternalSendRejected = true;
        }
        await window.erpApi.logout();
        await window.erpApi.login("owner", "Updated-Owner-Password");
        await window.erpApi.disableStudentLoginAccount(
          studentLoginAccount.id,
          "Smoke disabled student account"
        );
        await window.erpApi.logout();
        let disabledStudentLoginRejected = false;
        try {
          await window.erpApi.login(
            "smoke_student_login",
            "Student-New-Password"
          );
        } catch {
          disabledStudentLoginRejected = true;
        }
        await window.erpApi.login("owner", "Updated-Owner-Password");
        const reenabledStudentLogin =
          await window.erpApi.enableStudentLoginAccount(
            studentLoginAccount.id
          );
        await window.erpApi.logout();
        const reenabledStudentRelogin = await window.erpApi.login(
          "smoke_student_login",
          "Student-New-Password"
        );
        await window.erpApi.logout();
        await window.erpApi.login("owner", "Updated-Owner-Password");
        const repeatStudentLoginAccount =
          await window.erpApi.createStudentLoginAccount({
            studentId: repeatStudent.id,
            username: "smoke_repeat_student_login",
            password: "Repeat-Student-Password",
            mustChangePassword: false,
            status: "Active"
          });
        const disabledStudentLoginAccount =
          await window.erpApi.createStudentLoginAccount({
            studentId: tcStudent.id,
            username: "smoke_disabled_student_login",
            password: "Disabled-Student-Password",
            mustChangePassword: false,
            status: "Active"
          });
        await window.erpApi.disableStudentLoginAccount(
          disabledStudentLoginAccount.id,
          "Exclude disabled account from local message delivery"
        );
        await window.erpApi.logout();
        await window.erpApi.login("admin", "Admin-Password");
        const adminDirectThread =
          await window.erpApi.createDirectMessage({
            recipientType: "Student",
            recipientUserId: studentLoginAccount.userId,
            subject: "Local Admin Message",
            priority: "High",
            messageText: "This is a local ERP inbox message."
          });
        const adminDirectDeliveryReport =
          await window.erpApi.getMessageDeliveryReport(
            adminDirectThread.id
          );
        await window.erpApi.logout();
        await window.erpApi.login(
          "smoke_student_login",
          "Student-New-Password"
        );
        const studentMessageInbox = await window.erpApi.getMessageInbox({});
        const studentMessageThread =
          await window.erpApi.getMessageThread(adminDirectThread.id);
        const firstReadThread =
          await window.erpApi.markMessageThreadRead(adminDirectThread.id);
        const firstReadAt = firstReadThread.recipients.find(
          (recipient) =>
            recipient.recipientUserId === studentLoginAccount.userId
        )?.readAt;
        const secondReadThread =
          await window.erpApi.markMessageThreadRead(adminDirectThread.id);
        const secondReadAt = secondReadThread.recipients.find(
          (recipient) =>
            recipient.recipientUserId === studentLoginAccount.userId
        )?.readAt;
        const studentReplyThread =
          await window.erpApi.replyToMessageThread({
            threadId: adminDirectThread.id,
            messageText: "Student reply saved locally."
          });
        const studentReplyMessage = studentReplyThread.messages.find(
          (item) => item.senderUserId === studentLoginAccount.userId
        );
        await window.erpApi.deleteOwnMessage(studentReplyMessage.id);
        const threadAfterStudentDelete =
          await window.erpApi.getMessageThread(adminDirectThread.id);
        await window.erpApi.archiveMessageThread(adminDirectThread.id);
        const archivedStudentThreads =
          await window.erpApi.getMessageInbox({ archived: true });
        await window.erpApi.unarchiveMessageThread(adminDirectThread.id);
        await window.erpApi.logout();
        await window.erpApi.login(
          "smoke_repeat_student_login",
          "Repeat-Student-Password"
        );
        const otherStudentInbox = await window.erpApi.getMessageInbox({});
        let otherStudentThreadRejected = false;
        try {
          await window.erpApi.getMessageThread(adminDirectThread.id);
        } catch {
          otherStudentThreadRejected = true;
        }
        await window.erpApi.logout();
        await window.erpApi.login("owner", "Updated-Owner-Password");
        const allStudentsAnnouncement =
          await window.erpApi.createAnnouncement({
            title: "All Students Local Notice",
            announcementText: "All active student accounts should receive this.",
            audienceType: "All Students",
            priority: "Normal",
            status: "Published"
          });
        const allStudentsReadReport =
          await window.erpApi.getAnnouncementReadReport(
            allStudentsAnnouncement.id
          );
        const classAnnouncement =
          await window.erpApi.createAnnouncement({
            title: "Class 10A Local Notice",
            announcementText: "Only Class 10 A active student accounts should receive this.",
            audienceType: "Specific Section",
            className: "10",
            section: "A",
            priority: "High",
            status: "Published"
          });
        const classAnnouncementReadReport =
          await window.erpApi.getAnnouncementReadReport(
            classAnnouncement.id
          );
        await window.erpApi.logout();
        await window.erpApi.login(
          "smoke_student_login",
          "Student-New-Password"
        );
        const studentAnnouncements =
          await window.erpApi.getCurrentUserAnnouncements();
        await window.erpApi.logout();
        await window.erpApi.login(
          "smoke_employee_login",
          "Employee-New-Password"
        );
        let teacherBroadcastRejected = false;
        try {
          await window.erpApi.createAnnouncement({
            title: "Invalid Teacher Broadcast",
            announcementText: "Teachers must not broadcast to all employees.",
            audienceType: "All Employees",
            priority: "Normal",
            status: "Published"
          });
        } catch {
          teacherBroadcastRejected = true;
        }
        const teacherClassNotice =
          await window.erpApi.createAnnouncement({
            title: "Teacher Class Notice",
            announcementText: "Teacher notice for assigned Class 10 A.",
            audienceType: "Specific Section",
            className: "10",
            section: "A",
            priority: "Normal",
            status: "Published"
          });
        const teacherClassNoticeReport =
          await window.erpApi.getAnnouncementReadReport(
            teacherClassNotice.id
          );
        await window.erpApi.logout();
        await window.erpApi.login("owner", "Updated-Owner-Password");
        const parentsReportBeforeSibling =
          await window.erpApi.getParentsInfoReport({
            className: "10",
            section: "A"
          });
        const siblingFamilyProfile =
          await window.erpApi.linkSiblingStudents({
            studentIds: [student.id, repeatStudent.id],
            familyId: smokeFamily.id
          });
        const fetchedFamilyProfile =
          await window.erpApi.getFamilyById(smokeFamily.id);
        const familyStudents =
          await window.erpApi.getFamilyStudents(smokeFamily.id);
        const parentsInfoReport =
          await window.erpApi.getParentsInfoReport({
            className: "10",
            section: "A"
          });
        const emergencyContactsReport =
          await window.erpApi.getEmergencyContactsReport({
            className: "10",
            section: "A"
          });
        const siblingReport = await window.erpApi.getSiblingReport({
          className: "10",
          section: "A"
        });
        const fatherUnlinkResult =
          await window.erpApi.unlinkGuardianFromStudent(
            fatherStudentLink.id
          );
        const guardiansAfterFatherUnlink =
          await window.erpApi.getGuardians({
            familyId: smokeFamily.id
          });
        const studentLinksAfterFatherUnlink =
          await window.erpApi.getStudentGuardians(student.id);
        const familyDeleteResult =
          await window.erpApi.deleteFamily(smokeFamily.id);
        const familiesAfterDelete = await window.erpApi.getFamilies({});
        const studentsAfterFamilyDelete = await window.erpApi.getStudents();
        const promotionPreview =
          await window.erpApi.getPromotionPreview({
            fromSessionId: fromAcademicSession.id,
            toSessionId: toAcademicSession.id,
            className: "10",
            section: "A"
          });
        const promotion = await window.erpApi.promoteStudentsBulk({
          fromSessionId: fromAcademicSession.id,
          toSessionId: toAcademicSession.id,
          fromClass: "10",
          fromSection: "A",
          promotionDate: "2026-04-01",
          remarks: "Academic session promotion smoke test",
          items: [
            {
              studentId: student.id,
              action: "Promote",
              newClass: "11",
              newSection: "A",
              oldDueAmount: 500,
              carryForwardDue: true,
              carryForwardAmount: 500,
              remarks: "Promoted to Class 11"
            },
            {
              studentId: repeatStudent.id,
              action: "Repeat",
              oldDueAmount: 250,
              carryForwardDue: true,
              carryForwardAmount: 250,
              remarks: "Repeat Class 10"
            },
            {
              studentId: tcStudent.id,
              action: "TC",
              oldDueAmount: 0,
              carryForwardDue: false
            },
            {
              studentId: leftStudent.id,
              action: "Left",
              oldDueAmount: 0,
              carryForwardDue: false
            }
          ]
        });
        const promotionWithItems =
          await window.erpApi.getStudentPromotionById(promotion.id);
        const promotedHistory =
          await window.erpApi.getStudentSessionHistory(student.id);
        const repeatHistory =
          await window.erpApi.getStudentSessionHistory(repeatStudent.id);
        const carryForwardDues =
          await window.erpApi.getCarryForwardDues({
            toSessionId: toAcademicSession.id,
            status: "Pending"
          });
        const carryForwardInvoicePreview =
          await window.erpApi.getFeeInvoicePreview({
            studentId: repeatStudent.id,
            academicSessionId: toAcademicSession.id,
            billingPeriod: "Annual",
            invoiceDate: "2026-04-02",
            dueDate: "2026-04-30",
            includePreviousDue: true,
            lateFee: 0,
            adjustmentAmount: 0
          });
        const paidCarryForwardDue =
          await window.erpApi.updateCarryForwardDue(
            carryForwardDues.find(
              (due) => due.studentId === student.id
            ).id,
            { status: "Paid" }
          );
        const waivedCarryForwardDue =
          await window.erpApi.waiveCarryForwardDue(
            carryForwardDues.find(
              (due) => due.studentId === repeatStudent.id
            ).id,
            "Approved in smoke test"
          );
        const carryForwardDuesAfterUpdate =
          await window.erpApi.getCarryForwardDues({
            toSessionId: toAcademicSession.id
          });
        const rollbackStudent = await window.erpApi.createStudent({
          admissionNo: "SMOKE-ROLLBACK",
          name: "Rollback Test Student",
          className: "10",
          section: "A"
        });
        const promotionCountBeforeRollback = (
          await window.erpApi.getStudentPromotions()
        ).length;
        let invalidPromotionRolledBack = false;
        try {
          await window.erpApi.promoteStudentsBulk({
            fromSessionId: fromAcademicSession.id,
            toSessionId: toAcademicSession.id,
            fromClass: "10",
            fromSection: "A",
            promotionDate: "2026-04-02",
            items: [
              {
                studentId: rollbackStudent.id,
                action: "Promote",
                newClass: "11",
                newSection: "A"
              },
              {
                studentId: "missing-student",
                action: "Promote",
                newClass: "11",
                newSection: "A"
              }
            ]
          });
        } catch {
          const rollbackStudentAfterFailure = (
            await window.erpApi.getStudents()
          ).find((item) => item.id === rollbackStudent.id);
          invalidPromotionRolledBack =
            rollbackStudentAfterFailure?.className === "10" &&
            (await window.erpApi.getStudentPromotions()).length ===
              promotionCountBeforeRollback;
        }
        let currentCloseRejected = false;
        try {
          await window.erpApi.closeAcademicSession(
            fromAcademicSession.id
          );
        } catch {
          currentCloseRejected = true;
        }
        await window.erpApi.setCurrentAcademicSession(
          toAcademicSession.id
        );
        const closedFromSession =
          await window.erpApi.closeAcademicSession(
            fromAcademicSession.id
          );
        const sessionReport =
          await window.erpApi.getPromotionReport({
            sessionId: toAcademicSession.id
          });
        const studentsAfterPromotion = await window.erpApi.getStudents();
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
          studentAdmissionApiAvailable,
          certificateApiAvailable,
          employeeApiAvailable,
          salaryApiAvailable,
          accountsApiAvailable,
          timetableApiAvailable,
          homeworkApiAvailable,
          classTestsApiAvailable,
          questionPaperApiAvailable,
          behaviourSkillsApiAvailable,
          academicSessionsApiAvailable,
          feeInvoiceApiAvailable,
          reportCardApiAvailable,
          releaseModuleApiAvailable,
          messageApiAvailable,
          communicationApiAvailable,
          settingsPreferencesApiAvailable,
          licenseApiAvailable,
          deviceId,
          licenseBeforeActivation,
          activatedLicense,
          readableLicense,
          hadUsersBeforeSetup,
          ownerId: owner.id,
          ownerRole: owner.role,
          loggedInOwnerRole: loggedInOwner.role,
          resetPasswordLoginRole: resetPasswordLogin.role,
          familyApiAvailable,
          familyId: smokeFamily.id,
          deletedFamilyId: smokeFamily.id,
          fatherGuardianId: fatherGuardian.id,
          motherGuardianId: motherGuardian.id,
          familyCreated:
            smokeFamily.familyCode.startsWith("FAM-") &&
            smokeFamily.primaryContactName === "Smoke Test Father",
          admissionWorkflowCorrect:
            admissionDraftProfileCorrect &&
            admittedProfile.student.status === "Active" &&
            admittedProfile.student.admissionNo ===
              admissionNumbers.admissionNo &&
            admittedProfile.admissionDetails.applicationNo ===
              admissionNumbers.applicationNo &&
            admittedProfile.admissionDetails.feeStructureId ===
              tuitionFeeStructure.id &&
            admittedProfile.admissionDetails.childPhotoPath.includes(
              "admission-workflow"
            ) &&
            admissionPrefilledForm.student.id === admittedProfile.student.id &&
            admissionPrefilledForm.ageAtAdmission.years === 5 &&
            admissionPrefilledForm.ageAtAdmission.months === 11 &&
            admissionPrefilledForm.father?.qualification === "B.Tech" &&
            admissionPrefilledForm.father?.employerOrganization ===
              "Smoke Engineering Works" &&
            admissionPrefilledForm.admissionDocuments.some(
              (document) =>
                document.documentType === "Birth certificate" &&
                document.receivedStatus === "Received"
            ) &&
            admissionGuardiansAfterRepeat.length === 2 &&
            new Set(
              admissionGuardiansAfterRepeat.map((link) => link.guardianId)
            ).size === 2,
          admissionOfficeUseCorrect:
            admissionOfficeUseWithReceipt.officeUse.feeReceiptNo ===
              admissionFeeReceipt.receiptNo &&
            wrongStudentReceiptRejected,
          admissionSafeguardsDebug: {
            duplicateAdmissionNumberRejected,
            duplicateApplicationNumberRejected,
            admissionUnauthorizedSaveRejected,
            printPreviewNoMutation:
              studentCountBeforePrintPreview === studentCountAfterPrintPreview,
            legacyStudentOpens:
              legacyStudentAdmissionProfile.student.id === student.id,
            legacyAdmissionFallback:
              legacyStudentAdmissionProfile.admissionDetails?.applicationNo ===
                "" &&
              legacyStudentAdmissionProfile.admissionDetails?.srNo ===
                student.admissionNo,
            blankAdmissionFormWorks:
              blankAdmissionProfileForm.mode === "Blank",
            editPreservedAdmissionNumber:
              admissionProfileAfterEdit.student.admissionNo ===
              admissionNumbers.admissionNo,
            snapshotHistoryContainsIssuedSnapshot:
              admissionSnapshotHistory.some(
                (snapshot) => snapshot.id === admissionSnapshotBeforeEdit.id
              ),
          },
          admissionSafeguardsCorrect:
            duplicateAdmissionNumberRejected &&
            duplicateApplicationNumberRejected &&
            admissionUnauthorizedSaveRejected &&
            studentCountBeforePrintPreview === studentCountAfterPrintPreview &&
            legacyStudentAdmissionProfile.student.id === student.id &&
            legacyStudentAdmissionProfile.admissionDetails?.applicationNo ===
              "" &&
            legacyStudentAdmissionProfile.admissionDetails?.srNo ===
              student.admissionNo &&
            blankAdmissionProfileForm.mode === "Blank" &&
            admissionProfileAfterEdit.student.admissionNo ===
              admissionNumbers.admissionNo &&
            admissionSnapshotHistory.some(
              (snapshot) => snapshot.id === admissionSnapshotBeforeEdit.id
            ),
          guardiansCreated:
            fatherGuardian.relation === "Father" &&
            motherGuardian.relation === "Mother",
          guardianPrimaryEnforced:
            studentLinksAfterPrimary.length === 2 &&
            studentLinksAfterPrimary.filter((link) => link.isPrimary)
              .length === 1 &&
            studentLinksAfterPrimary.find((link) => link.isPrimary)
              ?.guardianId === motherGuardian.id,
          legacyParentFallbackWorked:
            parentsReportBeforeSibling.rows.some(
              (row) =>
                row.studentId === repeatStudent.id &&
                row.source === "Legacy" &&
                row.primaryGuardian === "Repeat Legacy Guardian"
            ),
          siblingLinkWorked:
            siblingFamilyProfile?.students.length === 2 &&
            siblingFamilyProfile.students.some(
              (item) => item.id === student.id
            ) &&
            siblingFamilyProfile.students.some(
              (item) => item.id === repeatStudent.id
            ),
          familyProfileCorrect:
            fetchedFamilyProfile?.familyCode === smokeFamily.familyCode &&
            fetchedFamilyProfile.guardians.length === 2 &&
            familyStudents.length === 2,
          parentsInfoReportCorrect:
            parentsInfoReport.summary.totalGuardians >= 2 &&
            parentsInfoReport.rows.some(
              (row) =>
                row.studentId === student.id &&
                row.guardianId === motherGuardian.id &&
                row.pickupAuthorized
            ),
          emergencyReportCorrect:
            emergencyContactsReport.rows.some(
              (row) =>
                row.studentId === student.id &&
                row.emergencyContactName === "Smoke Test Mother"
            ),
          siblingReportCorrect:
            siblingReport.rows.some(
              (row) =>
                row.familyId === smokeFamily.id &&
                row.studentCount === 2
            ),
          guardianUnlinkedWithoutDelete:
            fatherUnlinkResult.success &&
            guardiansAfterFatherUnlink.some(
              (guardian) => guardian.id === fatherGuardian.id
            ) &&
            !studentLinksAfterFatherUnlink.some(
              (link) => link.guardianId === fatherGuardian.id
            ),
          familySoftDeletedStudentSafe:
            familyDeleteResult.success &&
            !familiesAfterDelete.some(
              (family) => family.id === smokeFamily.id
            ) &&
            studentsAfterFamilyDelete.some((item) => item.id === student.id) &&
            studentsAfterFamilyDelete.some(
              (item) => item.id === repeatStudent.id
            ),
          accountProfileSafe,
          accountDuplicateUsernameRejected,
          accountRoleProtected,
          accountProfileRestored:
            restoredAccountProfile.name === "Smoke Test Owner" &&
            restoredAccountProfile.email === "owner@example.com",
          wrongCurrentPasswordRejected,
          passwordChanged:
            currentPasswordChange.success &&
            oldPasswordRejectedAfterChange &&
            reloggedOwnerAfterPasswordChange.role === "Owner",
          loginHistoryRecorded,
          appPreferencesSaved:
            appPreferences.preferenceScope === "Application" &&
            appPreferences.themeMode === "System" &&
            appPreferences.accentColor === "Indigo" &&
            appPreferences.compactSidebar === true &&
            appPreferences.fontScale === "Large" &&
            appPreferences.dateFormat === "DD MMM YYYY" &&
            appPreferences.timeFormat === "24 Hour",
          userPreferencesSaved:
            userPreferences.preferenceScope === "User" &&
            userPreferences.language === "Hindi" &&
            userPreferences.themeMode === "Dark" &&
            reloadedUserPreferences.language === "Hindi" &&
            reloadedUserPreferences.accentColor === "Green",
          schoolRuleId: updatedAttendanceRule.id,
          deletedSchoolRuleId: feesRule.id,
          schoolRuleCreatedUpdated:
            updatedAttendanceRule.ruleText.includes("notify absences") &&
            updatedAttendanceRule.displayOrder === 3,
          schoolRuleFiltered:
            attendanceRules.length === 1 &&
            attendanceRules[0].id === updatedAttendanceRule.id,
          schoolRulesReordered:
            reorderedRules.find((rule) => rule.id === updatedAttendanceRule.id)
              ?.displayOrder === 1 &&
            reorderedRules.find((rule) => rule.id === feesRule.id)
              ?.displayOrder === 2,
          schoolRuleSoftDeleted:
            deletedFeesRule.success &&
            !rulesAfterDelete.some((rule) => rule.id === feesRule.id),
          safeUsers,
          studentLoginManagementCorrect:
            studentLoginAccount.username === "smoke_student_login" &&
            studentLoginAccount.role === "Student" &&
            studentLoginAccount.accountType === "Student" &&
            duplicateStudentUsernameRejected &&
            duplicateStudentLinkRejected &&
            studentLogin.role === "Student" &&
            studentLogin.mustChangePassword === true &&
            studentEntityLink?.entityType === "Student" &&
            studentEntityLink?.entityId === student.id &&
            studentPasswordChanged.mustChangePassword === false &&
            oldStudentPasswordRejected &&
            studentRelogin.role === "Student" &&
            studentRelogin.accountType === "Student" &&
            studentListAccessRejected &&
            studentMutationRejected &&
            studentExternalSendRejected &&
            disabledStudentLoginRejected &&
            reenabledStudentLogin.status === "Active" &&
            reenabledStudentRelogin.role === "Student",
          studentPortalFiltered:
            studentPortalData.student.id === student.id &&
            studentPortalData.student.admissionNo === "SMOKE-001" &&
            studentPortalData.guardians.every(
              (guardian) => guardian.studentId === student.id
            ) &&
            studentPortalData.attendance.every(
              (record) => record.studentId === student.id
            ) &&
            studentPortalData.marks.every(
              (mark) => mark.studentId === student.id
            ) &&
            studentPortalData.feePayments.every(
              (payment) => payment.studentId === student.id
            ),
          messageCenterDirectCorrect:
            adminDirectDeliveryReport.recipients.length === 1 &&
            adminDirectDeliveryReport.recipients[0].recipientUserId ===
              studentLoginAccount.userId &&
            studentMessageInbox.some(
              (thread) => thread.id === adminDirectThread.id
            ) &&
            studentMessageThread.messages.some(
              (item) =>
                item.messageText === "This is a local ERP inbox message."
            ) &&
            firstReadAt &&
            secondReadAt === firstReadAt &&
            studentReplyThread.messages.some(
              (item) =>
                item.senderUserId === studentLoginAccount.userId &&
                item.messageText === "Student reply saved locally."
            ) &&
            threadAfterStudentDelete.messages.some(
              (item) =>
                item.id === studentReplyMessage.id &&
                item.isDeleted &&
                item.messageText === "This message was removed."
            ) &&
            archivedStudentThreads.some(
              (thread) => thread.id === adminDirectThread.id
            ) &&
            otherStudentInbox.every(
              (thread) => thread.id !== adminDirectThread.id
            ) &&
            otherStudentThreadRejected,
          messageAnnouncementCorrect:
            allStudentsAnnouncement.status === "Published" &&
            allStudentsReadReport.recipients.some(
              (recipient) =>
                recipient.recipientUserId === studentLoginAccount.userId
            ) &&
            allStudentsReadReport.recipients.some(
              (recipient) =>
                recipient.recipientUserId === repeatStudentLoginAccount.userId
            ) &&
            !allStudentsReadReport.recipients.some(
              (recipient) =>
                recipient.recipientUserId === disabledStudentLoginAccount.userId
            ) &&
            classAnnouncement.status === "Published" &&
            classAnnouncementReadReport.recipients.some(
              (recipient) =>
                recipient.recipientUserId === studentLoginAccount.userId
            ) &&
            classAnnouncementReadReport.recipients.some(
              (recipient) =>
                recipient.recipientUserId === repeatStudentLoginAccount.userId
            ) &&
            !classAnnouncementReadReport.recipients.some(
              (recipient) =>
                recipient.recipientUserId === disabledStudentLoginAccount.userId
            ) &&
            studentAnnouncements.some(
              (thread) => thread.id === allStudentsAnnouncement.id
            ) &&
            studentAnnouncements.some(
              (thread) => thread.id === classAnnouncement.id
            ),
          teacherMessagingCorrect:
            teacherBroadcastRejected &&
            teacherClassNotice.status === "Published" &&
            teacherClassNoticeReport.recipients.some(
              (recipient) =>
                recipient.recipientUserId === studentLoginAccount.userId
            ),
          messageThreadId: adminDirectThread.id,
          allStudentsAnnouncementId: allStudentsAnnouncement.id,
          classAnnouncementId: classAnnouncement.id,
          teacherClassNoticeId: teacherClassNotice.id,
          employeeLoginManagementCorrect:
            ownerRoleAssignmentRejected &&
            employeeLoginAccount.username === "smoke_employee_login" &&
            employeeLoginAccount.role === "Teacher" &&
            employeeLoginAccount.accountType === "Staff" &&
            duplicateEmployeeLinkRejected &&
            employeeLogin.role === "Teacher" &&
            employeeEntityLink?.entityType === "Employee" &&
            employeeEntityLink?.entityId === employee.id &&
            employeeOtherSalaryRejected &&
            oldEmployeePasswordRejected &&
            employeeRelogin.role === "Teacher" &&
            disabledEmployeeLoginRejected &&
            reenabledEmployeeLogin.status === "Active" &&
            reenabledEmployeeRelogin.role === "Teacher",
          employeePortalFiltered:
            employeePortalData.employee.id === employee.id &&
            employeePortalData.attendance.every(
              (record) => record.employeeId === employee.id
            ) &&
            employeePortalData.salaryPayments.every(
              (payment) => payment.employeeId === employee.id
            ) &&
            employeePortalData.timetable.every(
              (entry) => entry.teacherId === employee.id
            ),
          auditLogCount: auditLogs.length,
          behaviourTraitId: behaviourTrait.id,
          skillTraitId: affectiveTrait.id,
          observationId: observation.id,
          defaultBehaviourTraitCount: defaultBehaviourTraits.length,
          defaultSkillTraitCount: defaultSkillTraits.length,
          behaviourTraitUpdated:
            updatedBehaviourTrait.description ===
            "Updated teamwork description",
          behaviourRatingUpserted:
            behaviourRatings[0].id === updatedBehaviourRatings[0].id &&
            filteredBehaviourRatings.length === 1 &&
            filteredBehaviourRatings[0].rating === "Excellent" &&
            filteredBehaviourRatings[0].ratedBy === "Smoke Test Owner",
          affectiveReportCount: affectiveRatings.length,
          psychomotorReportCount: psychomotorRatings.length,
          observationUpdated:
            updatedObservation.status === "Closed" &&
            updatedObservation.actionTaken ===
              "Participation acknowledged by class teacher.",
          observationSoftDeleted:
            observationDeleteResult.success &&
            observationsAfterDelete.length === 1 &&
            !observationsAfterDelete.some(
              (item) => item.id === observationToDelete.id
            ),
          fromAcademicSessionId: fromAcademicSession.id,
          toAcademicSessionId: toAcademicSession.id,
          promotionId: promotion.id,
          repeatStudentId: repeatStudent.id,
          tcStudentId: tcStudent.id,
          leftStudentId: leftStudent.id,
          rollbackStudentId: rollbackStudent.id,
          promotionPreviewCount: promotionPreview.rows.length,
          initialSessionHistoryCreated:
            initialStudentSessionHistory.academicSessionId ===
              fromAcademicSession.id &&
            initialStudentSessionHistory.rollNo === "10",
          promotionNo: promotion.promotionNo,
          promotionCountsCorrect:
            promotion.totalStudents === 4 &&
            promotion.promotedCount === 1 &&
            promotion.repeatedCount === 1 &&
            promotion.tcCount === 1 &&
            promotion.leftCount === 1,
          promotionItemsCreated:
            promotionWithItems?.items.length === 4,
          promotedHistoryPreserved:
            promotedHistory.length === 2 &&
            promotedHistory.some(
              (item) =>
                item.academicSessionId === fromAcademicSession.id &&
                item.status === "Promoted"
            ) &&
            promotedHistory.some(
              (item) =>
                item.academicSessionId === toAcademicSession.id &&
                item.className === "11"
            ),
          repeatHistoryPreserved:
            repeatHistory.length === 2 &&
            repeatHistory.some(
              (item) =>
                item.academicSessionId === fromAcademicSession.id &&
                item.status === "Repeated"
            ) &&
            repeatHistory.some(
              (item) =>
                item.academicSessionId === toAcademicSession.id &&
                item.className === "10"
            ),
          carryForwardCreated:
            carryForwardDues.length === 2 &&
            carryForwardDues.some(
              (due) =>
                due.carriedAmount === 500 &&
                due.studentId === student.id
            ) &&
            carryForwardDues.some(
              (due) =>
                due.carriedAmount === 250 &&
                due.studentId === repeatStudent.id
            ),
          carryForwardInvoicePreviousDue:
            carryForwardInvoicePreview.previousDue,
          carryForwardStatusesUpdated:
            paidCarryForwardDue.status === "Paid" &&
            waivedCarryForwardDue.status === "Waived" &&
            carryForwardDuesAfterUpdate.some(
              (due) =>
                due.studentId === student.id && due.status === "Paid"
            ) &&
            carryForwardDuesAfterUpdate.some(
              (due) =>
                due.studentId === repeatStudent.id &&
                due.status === "Waived"
            ),
          invalidPromotionRolledBack,
          currentCloseRejected,
          oldSessionClosed: closedFromSession.status === "Closed",
          sessionReportCorrect:
            sessionReport.summary.promotedStudents === 1 &&
            sessionReport.summary.repeatedStudents === 1 &&
            sessionReport.summary.totalCarriedDues === 500,
          promotedStudentUpdated:
            studentsAfterPromotion.find(
              (item) => item.id === student.id
            )?.className === "11",
          repeatedStudentUnchanged:
            studentsAfterPromotion.find(
              (item) => item.id === repeatStudent.id
            )?.className === "10",
          tcStudentInactive:
            studentsAfterPromotion.find(
              (item) => item.id === tcStudent.id
            )?.status === "Inactive" &&
            studentsAfterPromotion.find(
              (item) => item.id === tcStudent.id
            )?.sessionStatus === "TC",
          leftStudentInactive:
            studentsAfterPromotion.find(
              (item) => item.id === leftStudent.id
            )?.status === "Inactive" &&
            studentsAfterPromotion.find(
              (item) => item.id === leftStudent.id
            )?.sessionStatus === "Left",
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
          documentTemplateSettingsCorrect:
            documentTemplateSettings.length === 3 &&
            updatedReceiptTemplate.feeReceiptTerms ===
              "Smoke-test receipt terms",
          admissionFormDataCorrect:
            blankAdmissionForm.mode === "Blank" &&
            blankAdmissionForm.student === null &&
            prefilledAdmissionForm.student?.id === student.id &&
            prefilledAdmissionForm.ageAtAdmission.display === "" &&
            admissionSnapshot.studentId === student.id,
          transferCertificateLifecycleCorrect:
            transferPreview.studentName === student.name &&
            transferDraft.status === "Draft" &&
            transferDraftUpdated.generalConduct === "Very Good" &&
            transferIssued.status === "Issued" &&
            issuedTransferOverwriteRejected &&
            transferReprinted.reprintCount === 1 &&
            transferCancelled.status === "Cancelled" &&
            cancelledTransferNumberRejected,
          employeeId: employee.id,
          deletedEmployeeId: deletedEmployee.id,
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
          employeeAttendanceApiAvailable,
          employeeAttendancePresentSaved:
            employeeAttendancePresent[0]?.status === "Present",
          employeeAttendanceUpdatedLate:
            employeeAttendanceLate.status === "Late" &&
            employeeAttendanceLate.lateMinutes === 15,
          employeeAttendanceDuplicatePrevented:
            duplicateEmployeeAttendanceRows.length === 1 &&
            employeeAttendanceDuplicateUpsert[0]?.id ===
              employeeAttendancePresent[0]?.id &&
            employeeAttendanceDuplicateUpsert[0]?.lateMinutes === 20,
          employeeAttendanceBulkSaved:
            employeeAttendanceBulk.length === 2,
          employeeAttendanceDailySummaryCorrect:
            employeeAttendanceDailySummary.totalMarked === 1 &&
            employeeAttendanceDailySummary.late === 1 &&
            employeeAttendanceDailySummary.totalEmployees === 1,
          employeeAttendanceMonthlySummaryCorrect:
            employeeAttendanceMonthlySummary.employeeId === employee.id &&
            employeeAttendanceMonthlySummary.present === 1 &&
            employeeAttendanceMonthlySummary.lateDays === 1 &&
            employeeAttendanceMonthlySummary.workingDays === 2,
          employeeAttendanceReportCorrect:
            employeeAttendanceReport.monthlyRows.some(
              (row) =>
                row.employeeId === employee.id &&
                row.present === 1 &&
                row.lateDays === 1 &&
                row.workingDays === 2
            ),
          employeeAttendanceRegisterCount:
            employeeAttendanceRegister.rows.length,
          deletedEmployeeAttendancePreserved:
            deletedEmployeeAttendanceHistory.length === 1 &&
            deletedEmployeeAttendanceHistory[0].employeeId ===
              deletedEmployee.id,
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
          classTestMarkId: originalStudentClassTestMark.id,
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
          feeReceiptPrintDataCorrect:
            partialReceiptPrintData.payment.id === invoicePartialPayment.id &&
            partialReceiptPrintData.rows.length > 0 &&
            partialReceiptPrintData.totals.amountPaid === 5000 &&
            partialReceiptPrintData.amountInWords.includes("Five Thousand") &&
            fullReceiptPrintData.totals.remainingBalance === 0,
          feeReceiptReversalVisible:
            reversedReceiptPrintData.isReversed &&
            reversedReceiptPrintData.reversedLabel === "REVERSED / CANCELLED",
          feeReceiptPrintNoMutation:
            receiptPrintRecord.success &&
            paymentsAfterReceiptPrint.length ===
              (await window.erpApi.getFeePayments()).length &&
            accountsAfterReceiptPrint.length ===
              (await window.erpApi.getAccountTransactions()).length,
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
          gradingSchemeId: gradingScheme.id,
          reportCardTemplateId: reportCardTemplate.id,
          reportCardId: regeneratedReportCardAfterDelete.id,
          gradingSchemeCreated:
            gradingScheme.name === "Smoke Percentage Scheme" &&
            gradingScheme.ranges.length === 7 &&
            defaultGradingScheme?.id === gradingScheme.id &&
            defaultGradingScheme.isDefault === true,
          overlappingGradingRangeRejected,
          gradeCalculationCorrect:
            calculatedAPlus.grade === "A+" &&
            calculatedAPlus.resultStatus === "Pass" &&
            calculatedFail.grade === "F" &&
            calculatedFail.resultStatus === "Fail",
          reportCardPreviewCorrect:
            reportCardPreview.totalMaxMarks === 100 &&
            reportCardPreview.totalObtainedMarks === 91 &&
            reportCardPreview.overallGrade === "A+" &&
            reportCardPreview.resultStatus === "Pass" &&
            reportCardPreview.attendance.workingDays === 1 &&
            reportCardPreview.attendance.presentDays === 0 &&
            reportCardPreview.behaviourRatings.length === 1 &&
            reportCardPreview.affectiveSkills.length === 1 &&
            reportCardPreview.psychomotorSkills.length === 1 &&
            reportCardPreview.classTests.length === 1,
          reportCardGenerated:
            generatedReportCard.reportCardNo === "RC-2026-0001" &&
            generatedReportCard.resultStatus === "Pass" &&
            generatedReportCard.subjects[0]?.obtainedMarks === 91,
          duplicateReportCardRejected,
          reportCardRemarksUpdated:
            updatedReportCardRemarks.teacherRemarks ===
              "Updated teacher remark." &&
            updatedReportCardRemarks.principalRemarks ===
              "Updated principal remark.",
          reportCardSnapshotPreserved:
            savedReportCardAfterSourceChange?.subjects[0]
              ?.obtainedMarks === 91 &&
            marksAfterReportCardSourceChange[0]?.obtainedMarks === 20,
          reportCardFailRuleCorrect:
            failingReportPreview.resultStatus === "Fail" &&
            failingReportPreview.subjects[0]?.resultStatus === "Fail" &&
            failingReportPreview.overallGrade === "F",
          reportCardBatchDebug: {
            batchCount: classReportBatch.count,
            batchStatuses: classReportBatch.reportCards.map(
              (card) => card.resultStatus
            ),
            totalStudents: classSummary.summary.totalStudents,
            resultComplete: classSummary.summary.resultComplete,
            failed: classSummary.summary.failed,
            rankingCount: classSummary.rankings.length,
            positionCount: resultPositions.length,
            firstPosition: resultPositions[0]?.position,
            firstResultStatus: resultPositions[0]?.resultStatus,
            finalReportCardIdMatches:
              finalStudentReportCard?.id === regeneratedReportCardAfterDelete.id,
            finalReportCardNo: finalStudentReportCard?.reportCardNo,
            finalActiveReportCardsForStudent: activeReportCardsFinal.length,
          },
          reportCardClassBatchCorrect:
            classReportBatch.count === 2 &&
            classReportBatch.reportCards.some(
              (card) => card.resultStatus === "Fail"
            ) &&
            classReportBatch.reportCards.some(
              (card) => card.resultStatus === "Pending"
            ),
          reportCardSummaryCorrect:
            classSummary.summary.totalStudents === 2 &&
            classSummary.summary.resultComplete === 1 &&
            classSummary.summary.failed === 1 &&
            classSummary.rankings[0]?.position === 1 &&
            classSummary.subjectSummaries[0]?.failed === 1,
          reportCardPositionsCorrect:
            resultPositions.length === 1 &&
            resultPositions[0].position === 1 &&
            resultPositions[0].resultStatus === "Fail",
          reportCardSoftDeleted:
            reportCardDeleteResult.success &&
            activeReportCardsAfterDelete.length === 0,
          finalReportCardPersisted:
            finalStudentReportCard?.id === regeneratedReportCardAfterDelete.id &&
            /^RC-2026-[0-9]{4}$/.test(finalStudentReportCard.reportCardNo) &&
            activeReportCardsFinal.length === 1,
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
          secondPaymentMode: secondPayment.paymentMode,
          discountTypeCreated:
            discountType.name === "Sibling Discount" &&
            discountType.discountMode === "Percentage",
          studentDiscountAssigned:
            studentDiscount.studentId === student.id &&
            studentDiscount.discountTypeId === discountType.id,
          feeInvoiceAccountMappingSaved:
            feeInvoiceAccountMapping.feeHeadId === feeHead.id &&
            feeInvoiceAccountMapping.accountCategoryId ===
              tuitionIncomeCategory.id,
          invoicePreviewDiscount:
            invoicePreview.subtotal === 12500 &&
            invoicePreview.discountAmount === 1250 &&
            invoicePreview.grandTotal === 11250,
          invoiceNo: feeInvoice.invoiceNo,
          duplicateInvoiceRejected,
          cancelledUnpaidInvoiceStatus: cancelledUnpaidInvoice.status,
          partialInvoiceStatus:
            partiallyPaidInvoice?.status === "Partially Paid" &&
            partiallyPaidInvoice.paidAmount === 5000 &&
            partiallyPaidInvoice.balanceAmount === 6250,
          paidInvoiceStatus:
            paidInvoice?.status === "Paid" &&
            paidInvoice.paidAmount === 11250 &&
            paidInvoice.balanceAmount === 0,
          paidInvoiceCancellationRejected,
          invoicePaymentAccountCount,
          invoiceGenerationCreatedAccount,
          reversalWorked:
            reversalResult.payment.status === "Reversed" &&
            reversalRemovedActiveAccount
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
      bridgeResult.studentAdmissionApiAvailable,
      "Student admission workflow APIs were not exposed by the preload bridge.",
    );
    assert(
      bridgeResult.familyApiAvailable,
      "Family, guardian, and parent report APIs were not exposed by the preload bridge.",
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
      bridgeResult.employeeAttendanceApiAvailable,
      "Employee attendance APIs were not exposed by the preload bridge.",
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
      bridgeResult.behaviourSkillsApiAvailable,
      "Behaviour and skills APIs were not exposed by the preload bridge.",
    );
    assert(
      bridgeResult.academicSessionsApiAvailable,
      "Academic session and promotion APIs were not exposed by the preload bridge.",
    );
    assert(
      bridgeResult.feeInvoiceApiAvailable,
      "Fee invoice and discount APIs were not exposed by the preload bridge.",
    );
    assert(
      bridgeResult.reportCardApiAvailable,
      "Marks grading and report card APIs were not exposed by the preload bridge.",
    );
    assert(
      bridgeResult.releaseModuleApiAvailable,
      "Release module APIs were not exposed by the preload bridge.",
    );
    assert(
      bridgeResult.messageApiAvailable,
      "Message Center APIs were not exposed by the preload bridge.",
    );
    assert(
      bridgeResult.communicationApiAvailable,
      "External communication APIs were not exposed by the preload bridge.",
    );
    assert(
      bridgeResult.settingsPreferencesApiAvailable,
      "Rules, preferences, and account settings APIs were not exposed by the preload bridge.",
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
    const communicationSecret = "vse_comm_smoke_token_should_not_leak";
    const safeCommunicationConfig =
      communicationService.configureCommunicationGateway({
        gatewayUrl: "http://localhost:3000",
        deviceToken: communicationSecret,
      });
    const storedCommunicationConfig =
      database.getCommunicationGatewaySettings();
    assert(
      safeCommunicationConfig.hasToken &&
        safeCommunicationConfig.tokenPrefix.startsWith("sha256:") &&
        !safeCommunicationConfig.tokenPrefix.includes(communicationSecret) &&
        !Object.prototype.hasOwnProperty.call(
          safeCommunicationConfig,
          "encryptedDeviceToken",
        ) &&
        storedCommunicationConfig.encryptedDeviceToken &&
        !storedCommunicationConfig.encryptedDeviceToken.includes(
          communicationSecret,
        ),
      "Communication token was not safely encrypted or was exposed through the safe API.",
    );
    assert(
      extractSafeErrorMessage("String gateway failure") ===
        "String gateway failure" &&
        extractSafeErrorMessage(new Error("Error instance failure")) ===
          "Error instance failure" &&
        extractSafeErrorMessage({
          error: { message: "Nested JSON gateway failure" },
        }) === "Nested JSON gateway failure" &&
        extractSafeErrorMessage({
          code: "IPC_ERROR",
          message: "IPC structured rejection failure",
        }) === "IPC structured rejection failure",
      "Communication error normalization did not handle string, Error, nested JSON, or IPC-shaped errors.",
    );
    let gatewayReply = {
      status: 200,
      body: {
        mode: "mock",
        integrations: [
          { channel: "WhatsApp", status: "Disabled" },
          { channel: "SMS", status: "Disabled" },
        ],
      },
    };
    const gatewayServer = http.createServer((_request, response) => {
      response.writeHead(gatewayReply.status, {
        "Content-Type": "application/json",
      });
      response.end(JSON.stringify(gatewayReply.body));
    });
    await new Promise((resolve) => gatewayServer.listen(0, "127.0.0.1", resolve));
    const gatewayAddress = gatewayServer.address();
    const gatewayUrl = `http://127.0.0.1:${gatewayAddress.port}`;
    communicationService.configureCommunicationGateway({
      gatewayUrl,
      deviceToken: communicationSecret,
    });
    const connectedDisabledProviders =
      await communicationService.testCommunicationGateway();
    assert(
      connectedDisabledProviders.connectionStatus === "Connected" &&
        connectedDisabledProviders.providerMode === "Mock" &&
        connectedDisabledProviders.whatsappStatus === "Disabled" &&
        connectedDisabledProviders.smsStatus === "Disabled" &&
        !connectedDisabledProviders.lastError,
      "Gateway authentication, provider mode, or Disabled provider status was not represented accurately.",
    );
    gatewayReply = {
      status: 401,
      body: { error: { message: `Rejected ${communicationSecret}` } },
    };
    const unauthorizedGateway = await communicationService.testCommunicationGateway();
    assert(
      unauthorizedGateway.connectionStatus === "Error" &&
        unauthorizedGateway.lastError ===
          "Device communication token is invalid or expired.",
      "HTTP 401 gateway response did not produce the safe token error message.",
    );
    gatewayReply = {
      status: 403,
      body: { error: "Device license is blocked" },
    };
    const forbiddenGateway = await communicationService.testCommunicationGateway();
    assert(
      forbiddenGateway.connectionStatus === "Error" &&
        forbiddenGateway.lastError ===
          "Communication is not permitted for this device or license.",
      "HTTP 403 gateway response did not produce the safe permission error message.",
    );
    gatewayReply = {
      status: 400,
      body: { error: { message: "WhatsApp integration is not active." } },
    };
    const missingProviderGateway =
      await communicationService.testCommunicationGateway();
    assert(
      missingProviderGateway.connectionStatus === "Error" &&
        missingProviderGateway.lastError === "WhatsApp integration is not active.",
      "Nested gateway JSON error was not normalized to a readable provider error.",
    );
    gatewayReply = {
      status: 500,
      body: {
        error: {
          message: `Gateway failed for ${communicationSecret} and +919876543210`,
        },
      },
    };
    const serverErrorGateway = await communicationService.testCommunicationGateway();
    assert(
      serverErrorGateway.connectionStatus === "Error" &&
        serverErrorGateway.lastError.includes("Gateway failed") &&
        !serverErrorGateway.lastError.includes(communicationSecret) &&
        !serverErrorGateway.lastError.includes("+919876543210") &&
        !serverErrorGateway.lastError.includes("[object Object]"),
      "HTTP 500 gateway error was not safely normalized or leaked secret values.",
    );
    await new Promise((resolve) => gatewayServer.close(resolve));
    const networkFailureGateway =
      await communicationService.testCommunicationGateway();
    assert(
      networkFailureGateway.connectionStatus === "Error" &&
        networkFailureGateway.lastError ===
          "Communication gateway could not be reached.",
      "Network failure did not produce a readable communication gateway message.",
    );
    communicationService.removeCommunicationGatewayToken();
    const missingGatewayConfiguration =
      await communicationService.testCommunicationGateway();
    assert(
      missingGatewayConfiguration.connectionStatus === "Not configured" &&
        missingGatewayConfiguration.lastError ===
          "Gateway URL and device communication token are required.",
      "Missing communication gateway configuration did not show the required safe message.",
    );
    const remoteActive = await licenseService.checkRemoteLicenseNow();
    assert(
      remoteActive.remoteStatus === "Active" &&
        remoteActive.displayStatus === "Online Verified" &&
        remoteActive.blocksUsage === false &&
        remoteRequests[0].licenseId === "LIC-SMOKE-001" &&
        remoteRequests[0].deviceId === firstDeviceId &&
        remoteRequests[0].appVersion === "1.1.0-smoke",
      "Remote Active status did not allow a valid local license.",
    );
    assert(
      licenseService.requireValidLicense().isValid,
      "Valid local license was blocked after remote Active.",
    );
    remoteResponse = {
      ...remoteResponse,
      valid: false,
      status: "Suspended",
      message:
        "Your Vidhya School ERP license has been suspended. Please contact Vidhya Tech.",
    };
    const remoteSuspended = await licenseService.checkRemoteLicenseNow();
    let suspendedLicenseBlocked = false;
    try {
      licenseService.requireValidLicense();
    } catch (error) {
      suspendedLicenseBlocked =
        error instanceof Error &&
        error.message.includes("license has been suspended");
    }
    assert(
      remoteSuspended.blocksUsage && suspendedLicenseBlocked,
      "Remote Suspended status did not block ERP access.",
    );
    remoteResponse = {
      ...remoteResponse,
      valid: true,
      status: "Active",
      message: "License active",
    };
    const remoteReactivated = await licenseService.checkRemoteLicenseNow();
    assert(
      remoteReactivated.remoteStatus === "Active" &&
        !remoteReactivated.blocksUsage,
      "Remote Active status did not reactivate access.",
    );
    remoteFailure = "Simulated network outage";
    const remoteGrace = await licenseService.checkRemoteLicenseNow();
    assert(
      remoteGrace.displayStatus === "Offline Grace" &&
        remoteGrace.canUseGrace &&
        !remoteGrace.blocksUsage,
      "Remote check failure did not enter offline grace.",
    );
    currentNow = new Date("2026-07-11T12:00:00.000Z");
    const remoteGraceExpired = await licenseService.checkRemoteLicenseNow();
    let expiredGraceBlocked = false;
    try {
      licenseService.requireValidLicense();
    } catch (error) {
      expiredGraceBlocked =
        error instanceof Error &&
        error.message.includes("grace period has expired");
    }
    assert(
      remoteGraceExpired.displayStatus === "Check Required" &&
        remoteGraceExpired.blocksUsage &&
        expiredGraceBlocked,
      "Expired remote grace did not block ERP access.",
    );
    remoteFailure = null;
    remoteResponse = {
      ...remoteResponse,
      valid: true,
      status: "Active",
      message: "License active",
    };
    const remoteRecovered = await licenseService.checkRemoteLicenseNow();
    currentNow = new Date(testNow);
    assert(
      remoteRecovered.remoteStatus === "Active" &&
        !remoteRecovered.blocksUsage,
      "Remote Active status did not recover from expired grace.",
    );
    const remoteAuditActions = database
      .getAuditLogs(100)
      .map((entry) => entry.action);
    assert(
      remoteAuditActions.includes("Remote license checked") &&
        remoteAuditActions.includes("Remote license active") &&
        remoteAuditActions.includes("Remote license suspended") &&
        remoteAuditActions.includes("Remote license check failed") &&
        remoteAuditActions.includes("Grace period expired"),
      "Remote license audit logs were not recorded.",
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
      bridgeResult.safeUsers.length >= 4 &&
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
      bridgeResult.studentLoginManagementCorrect &&
        bridgeResult.studentPortalFiltered,
      "Student login management, password reset/change, role restriction, or portal filtering failed.",
    );
    assert(
      bridgeResult.messageCenterDirectCorrect &&
        bridgeResult.messageAnnouncementCorrect &&
        bridgeResult.teacherMessagingCorrect,
      "Local Message Center direct delivery, read receipts, announcements, or role restrictions failed.",
    );
    assert(
      bridgeResult.employeeLoginManagementCorrect &&
        bridgeResult.employeePortalFiltered,
      "Employee login management, role restriction, reset/enable-disable, or portal filtering failed.",
    );
    assert(
      bridgeResult.accountProfileSafe &&
        bridgeResult.accountDuplicateUsernameRejected &&
        bridgeResult.accountRoleProtected &&
        bridgeResult.accountProfileRestored &&
        bridgeResult.wrongCurrentPasswordRejected &&
        bridgeResult.passwordChanged &&
        bridgeResult.loginHistoryRecorded,
      "Account profile, password change, login history, or privilege-protection behavior failed.",
    );
    assert(
      bridgeResult.appPreferencesSaved &&
        bridgeResult.userPreferencesSaved,
      "Application or user preferences did not save through IPC.",
    );
    assert(
      bridgeResult.schoolRuleCreatedUpdated &&
        bridgeResult.schoolRuleFiltered &&
        bridgeResult.schoolRulesReordered &&
        bridgeResult.schoolRuleSoftDeleted,
      "School rules create, update, filter, reorder, or soft delete failed.",
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
    const studentAuthRecord = database.getUserAuthRecord(
      "smoke_student_login",
    );
    const employeeAuthRecord = database.getUserAuthRecord(
      "smoke_employee_login",
    );
    assert(
      studentAuthRecord.password_hash !== "Student-New-Password" &&
        employeeAuthRecord.password_hash !== "Employee-New-Password" &&
        studentAuthRecord.password_salt &&
        employeeAuthRecord.password_salt,
      "Linked student or employee password was not securely hashed.",
    );
    assert(
      bridgeResult.classAttendanceIsArray,
      "Attendance class/date query did not return an array.",
    );
    assert(bridgeResult.studentCount === 6, "Student IPC operations failed.");
    assert(bridgeResult.updatedMobile === "9888888888", "Student update IPC failed.");
    const familyAdmissionDebug = {
      familyCreated: bridgeResult.familyCreated,
      guardiansCreated: bridgeResult.guardiansCreated,
      guardianPrimaryEnforced: bridgeResult.guardianPrimaryEnforced,
      legacyParentFallbackWorked: bridgeResult.legacyParentFallbackWorked,
      siblingLinkWorked: bridgeResult.siblingLinkWorked,
      familyProfileCorrect: bridgeResult.familyProfileCorrect,
      parentsInfoReportCorrect: bridgeResult.parentsInfoReportCorrect,
      emergencyReportCorrect: bridgeResult.emergencyReportCorrect,
      siblingReportCorrect: bridgeResult.siblingReportCorrect,
      guardianUnlinkedWithoutDelete: bridgeResult.guardianUnlinkedWithoutDelete,
      familySoftDeletedStudentSafe: bridgeResult.familySoftDeletedStudentSafe,
      admissionWorkflowCorrect: bridgeResult.admissionWorkflowCorrect,
      admissionOfficeUseCorrect: bridgeResult.admissionOfficeUseCorrect,
      admissionSafeguardsCorrect: bridgeResult.admissionSafeguardsCorrect,
      admissionSafeguardsDebug: bridgeResult.admissionSafeguardsDebug,
    };
    assert(
      Object.values(familyAdmissionDebug).every(Boolean),
      `Family, guardian, admission, sibling, legacy fallback, report, unlink, or soft-delete behavior failed: ${JSON.stringify(familyAdmissionDebug)}`,
    );
    assert(bridgeResult.paymentCount === 6, "Fee payment IPC operations failed.");
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
      bridgeResult.feeReceiptPrintDataCorrect &&
        bridgeResult.feeReceiptReversalVisible &&
        bridgeResult.feeReceiptPrintNoMutation,
      "Fee receipt print data, reversal visibility, or no-mutation rule failed.",
    );
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
      bridgeResult.documentTemplateSettingsCorrect &&
        bridgeResult.admissionFormDataCorrect &&
        bridgeResult.transferCertificateLifecycleCorrect,
      "Document template, admission form, or transfer certificate lifecycle failed.",
    );
    assert(
      bridgeResult.employeeCount === 1 &&
        bridgeResult.employeeUpdated &&
        bridgeResult.employeeFetchedById &&
        bridgeResult.employeeSoftDeleted,
      "Employee create, update, read, or soft delete failed.",
    );
    assert(
      bridgeResult.employeeAttendancePresentSaved &&
        bridgeResult.employeeAttendanceUpdatedLate &&
        bridgeResult.employeeAttendanceDuplicatePrevented &&
        bridgeResult.employeeAttendanceBulkSaved &&
        bridgeResult.employeeAttendanceDailySummaryCorrect &&
        bridgeResult.employeeAttendanceMonthlySummaryCorrect &&
        bridgeResult.employeeAttendanceReportCorrect &&
        bridgeResult.employeeAttendanceRegisterCount === 2 &&
        bridgeResult.deletedEmployeeAttendancePreserved,
      "Employee attendance save, update, duplicate guard, reports, or history preservation failed.",
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
      bridgeResult.homeworkSubmissionCount === 2 &&
        bridgeResult.homeworkPendingCreated &&
        bridgeResult.homeworkSubmissionUpdated &&
        bridgeResult.homeworkBulkUpdated &&
        bridgeResult.classHomeworkCount === 1 &&
        bridgeResult.homeworkSoftDeleted,
      "Homework creation, pending submissions, updates, class query, or soft delete failed.",
    );
    assert(
      bridgeResult.classTestMarkCount === 2 &&
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
    assert(
      bridgeResult.defaultBehaviourTraitCount === 6 &&
        bridgeResult.defaultSkillTraitCount === 10 &&
        bridgeResult.behaviourTraitUpdated &&
        bridgeResult.behaviourRatingUpserted &&
        bridgeResult.affectiveReportCount === 1 &&
        bridgeResult.psychomotorReportCount === 1 &&
        bridgeResult.observationUpdated &&
        bridgeResult.observationSoftDeleted,
      "Behaviour traits, skill ratings, domain reports, observation updates, or soft-delete behavior failed.",
    );
    assert(
      bridgeResult.promotionPreviewCount === 5 &&
        bridgeResult.initialSessionHistoryCreated &&
        bridgeResult.promotionNo === "PROM-2026-0001" &&
        bridgeResult.promotionCountsCorrect &&
        bridgeResult.promotionItemsCreated &&
        bridgeResult.promotedHistoryPreserved &&
        bridgeResult.repeatHistoryPreserved &&
        bridgeResult.carryForwardCreated &&
        bridgeResult.carryForwardInvoicePreviousDue === 250 &&
        bridgeResult.carryForwardStatusesUpdated &&
        bridgeResult.invalidPromotionRolledBack &&
        bridgeResult.currentCloseRejected &&
        bridgeResult.oldSessionClosed &&
        bridgeResult.sessionReportCorrect &&
        bridgeResult.promotedStudentUpdated &&
        bridgeResult.repeatedStudentUnchanged &&
        bridgeResult.tcStudentInactive &&
        bridgeResult.leftStudentInactive,
      "Academic session promotion, history, carry-forward, closure, status, report, or rollback behavior failed.",
    );
    const smokeActor = {
      id: "smoke-owner",
      username: "smoke_owner",
      name: "Smoke Test Owner",
      role: "Owner",
    };
    const releaseEmployee = database.createEmployee({
      employeeNo: "EMP-RELEASE-SMOKE",
      name: "Release Smoke Teacher",
      designation: "Teacher",
      department: "Academics",
      status: "Active",
    });
    const schedule = database.createExamSchedule(
      {
        examId: bridgeResult.examId,
        title: "Smoke Exam Schedule",
        startDate: "2026-07-20",
        endDate: "2026-07-22",
      },
      smokeActor,
    );
    const savedScheduleEntries = database.saveExamScheduleEntries(
      schedule.id,
      [
        {
          className: "10",
          section: "A",
          subjectId: bridgeResult.subjectId,
          examDate: "2026-07-20",
          startTime: "09:00",
          endTime: "10:00",
          room: "101",
          maximumMarks: 100,
          passingMarks: 33,
          invigilatorEmployeeId: releaseEmployee.id,
        },
      ],
      smokeActor,
    );
    const scheduleConflict = database.detectExamScheduleConflicts({
      scheduleId: schedule.id,
      entries: [
        savedScheduleEntries[0],
        {
          className: "10",
          section: "A",
          subjectId: bridgeResult.subjectId,
          examDate: "2026-07-20",
          startTime: "09:30",
          endTime: "10:30",
          room: "101",
          maximumMarks: 100,
          passingMarks: 33,
          invigilatorEmployeeId: releaseEmployee.id,
        },
      ],
    });
    database.publishExamSchedule(schedule.id, smokeActor);
    const dateSheet = database.getDateSheet({
      examId: bridgeResult.examId,
      className: "10",
      section: "A",
    });
    const resultSheet = database.getResultSheet({
      examId: bridgeResult.examId,
      className: "10",
      section: "A",
    });
    const awardList = database.getBlankAwardList({
      examId: bridgeResult.examId,
      className: "10",
      section: "A",
      subjectId: bridgeResult.subjectId,
    });
    const progressReport = database.getStudentProgressReport({
      className: "10",
      section: "A",
    });
    const customReportPreview = database.previewCustomReport(
      {
        reportDomain: "Students",
        selectedColumns: ["admissionNo", "name", "className"],
        filters: { className: "10" },
      },
      smokeActor,
    );
    let invalidLiveClassUrlRejected = false;
    try {
      database.createLiveClass({
        title: "Invalid Live Class",
        meetingUrl: "http://example.test/meeting",
        startAt: "2026-07-20T09:00:00.000Z",
        endAt: "2026-07-20T10:00:00.000Z",
      });
    } catch {
      invalidLiveClassUrlRejected = true;
    }
    const liveClass = database.createLiveClass({
      title: "Smoke Live Class",
      className: "10",
      section: "A",
      subjectId: bridgeResult.subjectId,
      teacherEmployeeId: releaseEmployee.id,
      provider: "Google Meet",
      meetingUrl: "https://meet.google.com/smoke-test",
      startAt: "2026-07-20T09:00:00.000Z",
      endAt: "2026-07-20T10:00:00.000Z",
      status: "Scheduled",
      auditUser: smokeActor,
    });
    const liveClassWithAttendance = database.saveLiveClassAttendance(
      liveClass.id,
      [
        {
          studentId: bridgeResult.studentId,
          attendanceStatus: "Present",
          remarks: "Joined",
        },
      ],
      smokeActor,
    );
    database.createStudent({
      admissionNo: "LIVE-DUP-001",
      name: "Live Duplicate Phone One",
      className: "10",
      section: "A",
      guardianName: "Live Guardian",
      mobile: "9000001001",
      status: "Active",
      admissionDate: "2026-07-01",
    });
    database.createStudent({
      admissionNo: "LIVE-DUP-002",
      name: "Live Duplicate Phone Two",
      className: "10",
      section: "A",
      guardianName: "Live Guardian",
      mobile: "9000001001",
      status: "Active",
      admissionDate: "2026-07-01",
    });
    database.createStudent({
      admissionNo: "LIVE-MISSING-001",
      name: "Live Missing Phone",
      className: "10",
      section: "A",
      guardianName: "Missing Phone Guardian",
      mobile: "",
      status: "Active",
      admissionDate: "2026-07-01",
    });
    const liveNotificationRequests = [];
    const liveNotificationServer = http.createServer((request, response) => {
      let body = "";
      request.on("data", (chunk) => {
        body += chunk.toString("utf8");
      });
      request.on("end", () => {
        const parsed = body ? JSON.parse(body) : {};
        liveNotificationRequests.push({
          url: request.url,
          body: parsed,
        });
        response.writeHead(200, { "content-type": "application/json" });
        response.end(
          JSON.stringify({
            batchId: `mock-live-${liveNotificationRequests.length}`,
            totalRecipients: parsed.recipients?.length ?? 0,
            queuedCount: parsed.recipients?.length ?? 0,
            excluded: [],
          }),
        );
      });
    });
    await new Promise((resolve) =>
      liveNotificationServer.listen(0, "127.0.0.1", resolve),
    );
    const liveNotificationAddress = liveNotificationServer.address();
    communicationService.configureCommunicationGateway({
      gatewayUrl: `http://127.0.0.1:${liveNotificationAddress.port}`,
      deviceToken: "live-class-notification-secret",
    });
    const liveRecipientPreview =
      communicationService.getExternalRecipientPreview(smokeActor, {
        audienceType: "Class students",
        className: "10",
        section: "A",
      });
    const whatsappLiveNotification =
      await communicationService.sendExternalBatch(smokeActor, {
        channel: "WhatsApp",
        templateId: "mock-whatsapp-live-class",
        title: "Live Class: Smoke Live Class",
        audienceType: "Live Class",
        recipients: liveRecipientPreview.candidates,
        variables: {
          class_name: "10",
          subject_name: "Smoke Subject",
          meeting_url: liveClass.meetingUrl,
        },
      });
    const smsLiveNotification =
      await communicationService.sendExternalBatch(smokeActor, {
        channel: "SMS",
        templateId: "mock-sms-live-class",
        title: "Live Class: Smoke Live Class",
        audienceType: "Live Class",
        recipients: liveRecipientPreview.candidates,
        variables: {
          class_name: "10",
          subject_name: "Smoke Subject",
          meeting_url: liveClass.meetingUrl,
        },
      });
    await new Promise((resolve) => liveNotificationServer.close(resolve));
    const storeCategory = database.saveStoreCategory({
      name: "Smoke Store Category",
      status: "Active",
    });
    const storeProduct = database.saveStoreProduct({
      categoryId: storeCategory.id,
      sku: "SMOKE-POS-001",
      name: "Smoke Product",
      price: 100,
      costPrice: 60,
      minimumStock: 1,
      status: "Active",
    });
    database.createStoreInventoryTransaction(
      {
        productId: storeProduct.id,
        transactionType: "Opening Stock",
        quantity: 5,
        transactionDate: "2026-07-20",
      },
      smokeActor,
    );
    const accountMappings = database.getStoreAccountMappings();
    const mappingReady = ["sales_income", "cash_income", "upi_income", "card_income", "reversal_expense"].every(
      (key) => accountMappings.some((mapping) => mapping.mappingKey === key && mapping.accountCategoryId),
    );
    let completedSaleRequiresSession = false;
    try {
      database.createStoreOrder(
        {
          customerName: "No Session Customer",
          orderDate: "2026-07-20",
          status: "Completed",
          items: [{ productId: storeProduct.id, quantity: 1, unitPrice: 100 }],
          payments: [{ paymentMode: "Cash", amount: 100, paymentDate: "2026-07-20" }],
        },
        { id: "cashier-without-session", name: "No Session", role: "Accountant" },
      );
    } catch {
      completedSaleRequiresSession = true;
    }
    const posSession = database.openStorePosSession(
      { openingCash: 100, notes: "Smoke opening cash" },
      smokeActor,
    );
    let duplicateSessionRejected = false;
    try {
      database.openStorePosSession({ openingCash: 0 }, smokeActor);
    } catch {
      duplicateSessionRejected = true;
    }
    const storeOrder = database.createStoreOrder(
      {
        customerName: "Smoke Customer",
        posSessionId: posSession.session.id,
        orderDate: "2026-07-20",
        status: "Completed",
        items: [
          {
            productId: storeProduct.id,
            quantity: 2,
            unitPrice: 100,
            discountAmount: 0,
          },
        ],
        payments: [
          {
            paymentMode: "Cash",
            amount: 200,
            paymentDate: "2026-07-20",
          },
        ],
      },
      smokeActor,
    );
    const stockAfterSale = database
      .getStoreProducts({})
      .find((item) => item.id === storeProduct.id)?.currentStock;
    const accountTransactionsAfterSale = database.getAccountTransactions();
    const saleAccountCount = accountTransactionsAfterSale.filter(
      (transaction) =>
        transaction.linkedModule === "POS Sale" &&
        transaction.referenceNo === storeOrder.orderNo,
    ).length;
    database.postStoreOrderAccounting(storeOrder.id, smokeActor);
    const saleAccountCountAfterRetry = database.getAccountTransactions().filter(
      (transaction) =>
        transaction.linkedModule === "POS Sale" &&
        transaction.referenceNo === storeOrder.orderNo,
    ).length;
    let negativeStockRejected = false;
    try {
      database.createStoreOrder(
        {
          customerName: "Smoke Customer",
          posSessionId: posSession.session.id,
          orderDate: "2026-07-20",
          status: "Completed",
          items: [
            {
              productId: storeProduct.id,
              quantity: 99,
              unitPrice: 100,
            },
          ],
          payments: [
            {
              paymentMode: "Cash",
              amount: 9900,
              paymentDate: "2026-07-20",
            },
          ],
        },
        smokeActor,
      );
    } catch {
      negativeStockRejected = true;
    }
    const heldOrder = database.createStoreOrder(
      {
        customerName: "Held Smoke Customer",
        orderDate: "2026-07-20",
        status: "Held",
        items: [{ productId: storeProduct.id, quantity: 1, unitPrice: 100 }],
        payments: [],
      },
      smokeActor,
    );
    const stockAfterHold = database
      .getStoreProducts({})
      .find((item) => item.id === storeProduct.id)?.currentStock;
    const accountCountAfterHold = database.getAccountTransactions().filter(
      (transaction) => transaction.linkedModule === "POS Sale",
    ).length;
    const resumedOrder = database.resumeHeldStoreOrder(
      heldOrder.id,
      {
        customerName: "Held Smoke Customer",
        posSessionId: posSession.session.id,
        orderDate: "2026-07-20",
        items: heldOrder.items,
        payments: [{ paymentMode: "Cash", amount: 100, paymentDate: "2026-07-20" }],
      },
      smokeActor,
    );
    let completedOrderResumeRejected = false;
    try {
      database.resumeHeldStoreOrder(
        resumedOrder.id,
        {
          posSessionId: posSession.session.id,
          items: resumedOrder.items,
          payments: [{ paymentMode: "Cash", amount: 100, paymentDate: "2026-07-20" }],
        },
        smokeActor,
      );
    } catch {
      completedOrderResumeRejected = true;
    }
    const heldToCancel = database.createStoreOrder(
      {
        customerName: "Cancel Held",
        orderDate: "2026-07-20",
        status: "Held",
        items: [{ productId: storeProduct.id, quantity: 1, unitPrice: 100 }],
        payments: [],
      },
      smokeActor,
    );
    database.cancelHeldStoreOrder(heldToCancel.id, "Smoke held cancel", smokeActor);
    const stockAfterCancelHeld = database
      .getStoreProducts({})
      .find((item) => item.id === storeProduct.id)?.currentStock;
    const upiOrder = database.createStoreOrder(
      {
        customerName: "UPI Customer",
        posSessionId: posSession.session.id,
        orderDate: "2026-07-20",
        status: "Completed",
        items: [{ productId: storeProduct.id, quantity: 1, unitPrice: 100 }],
        payments: [{ paymentMode: "Manual UPI", amount: 100, paymentDate: "2026-07-20" }],
      },
      smokeActor,
    );
    const splitOrder = database.createStoreOrder(
      {
        customerName: "Split Customer",
        posSessionId: posSession.session.id,
        orderDate: "2026-07-20",
        status: "Completed",
        items: [{ productId: storeProduct.id, quantity: 1, unitPrice: 100 }],
        payments: [
          { paymentMode: "Cash", amount: 40, paymentDate: "2026-07-20" },
          { paymentMode: "Manual UPI", amount: 60, paymentDate: "2026-07-20" },
        ],
      },
      smokeActor,
    );
    const upiAccountPosted = database.getAccountTransactions().some(
      (transaction) =>
        transaction.linkedModule === "POS Sale" &&
        transaction.referenceNo === upiOrder.orderNo &&
        transaction.paymentMode === "UPI" &&
        transaction.amount === 100,
    );
    const splitAccountTotal = database
      .getAccountTransactions()
      .filter(
        (transaction) =>
          transaction.linkedModule === "POS Sale" &&
          transaction.referenceNo === splitOrder.orderNo,
      )
      .reduce((total, transaction) => total + transaction.amount, 0);
    database.reverseStoreOrder(storeOrder.id, "Smoke reversal", smokeActor);
    const stockAfterReversal = database
      .getStoreProducts({})
      .find((item) => item.id === storeProduct.id)?.currentStock;
    const reversalAccountCount = database.getAccountTransactions().filter(
      (transaction) =>
        transaction.linkedModule === "POS Sale Reversal" &&
        transaction.referenceNo === storeOrder.orderNo,
    ).length;
    let repeatedReversalRejected = false;
    try {
      database.reverseStoreOrder(
        storeOrder.id,
        "Repeat smoke reversal",
        smokeActor,
      );
    } catch {
      repeatedReversalRejected = true;
    }
    const posAccountNet = database
      .getAccountTransactions()
      .filter((transaction) =>
        ["POS Sale", "POS Sale Reversal"].includes(transaction.linkedModule),
      )
      .reduce(
        (total, transaction) =>
          total +
          (transaction.type === "Income" ? transaction.amount : -transaction.amount),
        0,
      );
    const closedSession = database.closeStorePosSession(
      posSession.session.id,
      { countedCash: 240, notes: "Smoke counted cash" },
      smokeActor,
    );
    let closedSessionSaleRejected = false;
    try {
      database.createStoreOrder(
        {
          customerName: "Closed Session Customer",
          posSessionId: closedSession.session.id,
          orderDate: "2026-07-20",
          status: "Completed",
          items: [{ productId: storeProduct.id, quantity: 1, unitPrice: 100 }],
          payments: [{ paymentMode: "Cash", amount: 100, paymentDate: "2026-07-20" }],
        },
        smokeActor,
      );
    } catch {
      closedSessionSaleRejected = true;
    }
    assert(
      savedScheduleEntries.length === 1 &&
        scheduleConflict.conflicts.length >= 1 &&
        dateSheet.entries.length === 1 &&
        resultSheet.rows.length >= 1 &&
        awardList.rows.length >= 1 &&
        progressReport.rows.length >= 1 &&
        customReportPreview.rows.length >= 1,
      "Exam schedule, date sheet, result sheet, award list, progress or custom report regression failed.",
    );
    assert(
      invalidLiveClassUrlRejected &&
        liveClass.status === "Scheduled" &&
        liveClassWithAttendance.attendance.length === 1 &&
        liveRecipientPreview.validCount >= 1 &&
        liveRecipientPreview.duplicateCount >= 1 &&
        liveRecipientPreview.missingCount >= 1 &&
        liveNotificationRequests.length === 2 &&
        whatsappLiveNotification.queuedCount === liveRecipientPreview.validCount &&
        smsLiveNotification.queuedCount === liveRecipientPreview.validCount,
      "Live class URL validation, creation, attendance, notification recipient or mock queue regression failed.",
    );
    assert(
      storeOrder.orderNo.startsWith("POS-") &&
        mappingReady &&
        completedSaleRequiresSession &&
        duplicateSessionRejected &&
        stockAfterSale === 3 &&
        saleAccountCount === 1 &&
        saleAccountCountAfterRetry === 1 &&
        negativeStockRejected &&
        stockAfterHold === 3 &&
        accountCountAfterHold === saleAccountCountAfterRetry &&
        resumedOrder.status === "Completed" &&
        completedOrderResumeRejected &&
        stockAfterCancelHeld === 2 &&
        upiAccountPosted &&
        splitAccountTotal === 100 &&
        stockAfterReversal === 2 &&
        reversalAccountCount === 1 &&
        repeatedReversalRejected &&
        posAccountNet === 300 &&
        closedSession.session.expectedCash === 240 &&
        closedSession.session.cashVariance === 0 &&
        closedSessionSaleRejected,
      "Store/POS accounting, hold/resume, session, stock or reversal regression failed.",
    );
    database.deleteEmployee(releaseEmployee.id);
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
    const accountDebug = {
      accountTransactionCount: bridgeResult.accountTransactionCount,
      accountRangeCount: bridgeResult.accountRangeCount,
      feeAccountCount: bridgeResult.feeAccountCount,
      feeAccountLinked: bridgeResult.feeAccountLinked,
      salaryAccountCount: bridgeResult.salaryAccountCount,
      salaryAccountSynced: bridgeResult.salaryAccountSynced,
    };
    assert(
      bridgeResult.accountTransactionCount === 8 &&
        bridgeResult.accountRangeCount === 7 &&
        bridgeResult.feeAccountCount === 5 &&
        bridgeResult.feeAccountLinked &&
        bridgeResult.salaryAccountCount === 1 &&
        bridgeResult.salaryAccountSynced,
      `Account date queries or automatic fee/salary ledger links failed: ${JSON.stringify(accountDebug)}`,
    );
    assert(
      bridgeResult.discountTypeCreated &&
        bridgeResult.studentDiscountAssigned &&
        bridgeResult.feeInvoiceAccountMappingSaved,
      "Discount type, student discount or fee account mapping failed.",
    );
    assert(
      bridgeResult.invoicePreviewDiscount &&
        bridgeResult.invoiceNo === "INV-2026-0001" &&
        bridgeResult.duplicateInvoiceRejected,
      "Fee invoice preview, numbering or duplicate protection failed.",
    );
    assert(
      bridgeResult.partialInvoiceStatus &&
        bridgeResult.paidInvoiceStatus &&
        bridgeResult.invoicePaymentAccountCount === 2 &&
        !bridgeResult.invoiceGenerationCreatedAccount,
      "Invoice payment allocation or account non-duplication failed.",
    );
    assert(
      bridgeResult.cancelledUnpaidInvoiceStatus === "Cancelled" &&
        bridgeResult.paidInvoiceCancellationRejected &&
        bridgeResult.reversalWorked,
      "Invoice cancellation or payment reversal safety failed.",
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
      bridgeResult.gradingSchemeCreated &&
        bridgeResult.overlappingGradingRangeRejected &&
        bridgeResult.gradeCalculationCorrect,
      "Grading scheme creation, overlap validation, or grade calculation failed.",
    );
    assert(
      bridgeResult.reportCardPreviewCorrect &&
        bridgeResult.reportCardGenerated &&
        bridgeResult.duplicateReportCardRejected &&
        bridgeResult.reportCardRemarksUpdated &&
        bridgeResult.reportCardSnapshotPreserved &&
        bridgeResult.reportCardFailRuleCorrect,
      "Report-card preview, generation, duplicate guard, remarks, snapshot, or fail rule failed.",
    );
    const reportCardBatchDebug = {
      reportCardClassBatchCorrect: bridgeResult.reportCardClassBatchCorrect,
      reportCardSummaryCorrect: bridgeResult.reportCardSummaryCorrect,
      reportCardPositionsCorrect: bridgeResult.reportCardPositionsCorrect,
      reportCardSoftDeleted: bridgeResult.reportCardSoftDeleted,
      finalReportCardPersisted: bridgeResult.finalReportCardPersisted,
      details: bridgeResult.reportCardBatchDebug,
    };
    assert(
      bridgeResult.reportCardClassBatchCorrect &&
        bridgeResult.reportCardSummaryCorrect &&
        bridgeResult.reportCardPositionsCorrect &&
        bridgeResult.reportCardSoftDeleted &&
        bridgeResult.finalReportCardPersisted,
      `Report-card batch generation, summary, ranking, soft delete, or final persistence setup failed: ${JSON.stringify(reportCardBatchDebug)}`,
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
    assert(bridgeResult.classCount === 2, "Class IPC operation failed.");
    assert(bridgeResult.sectionCount === 2, "Section IPC operation failed.");
    assert(bridgeResult.feeHeadCount === 1, "Fee head IPC operation failed.");
    assert(
      bridgeResult.feeStructureCount === 1,
      "Fee structure IPC operation failed.",
    );
    assert(
      bridgeResult.schoolName === "Persistence Test School",
      "Settings IPC operation failed.",
    );

    const studentCountBeforeLicenseUpdate = database.getStudents().length;
    const feePaymentCountBeforeLicenseUpdate =
      database.getFeePayments().length;
    const attendanceCountBeforeLicenseUpdate =
      database.getAttendance().length;
    const employeeAttendanceCountBeforeLicenseUpdate =
      database.getEmployeeAttendanceByRange({}).length;
    const schoolNameBeforeLicenseUpdate =
      database.getSchoolSettings().schoolName;

    remoteFailure = "Simulated license server outage during update";
    const remoteRequestCountBeforeUnavailableUpdate =
      remoteRequests.length;
    let unavailableUpdateMessage = "";
    try {
      await licenseService.updateLicenseKey(
        unavailableReplacementLicenseKey,
      );
    } catch (error) {
      unavailableUpdateMessage =
        error instanceof Error ? error.message : "";
    }
    const unavailableUpdateStatus = licenseService.getLicenseStatus();
    const unavailableUpdateRequest =
      remoteRequests[remoteRequestCountBeforeUnavailableUpdate];
    assert(
      unavailableUpdateMessage === "License server unavailable" &&
        unavailableUpdateStatus.license?.licenseId ===
          "LIC-SMOKE-WONDER-OFFLINE" &&
        unavailableUpdateStatus.remote?.blocksUsage &&
        unavailableUpdateRequest?.licenseId ===
          "LIC-SMOKE-WONDER-OFFLINE" &&
        unavailableUpdateRequest?.deviceId === firstDeviceId,
      "Unavailable license server did not keep the replacement locked.",
    );
    assert(
      database.getStudents().length === studentCountBeforeLicenseUpdate &&
        database.getFeePayments().length ===
          feePaymentCountBeforeLicenseUpdate &&
        database.getAttendance().length ===
          attendanceCountBeforeLicenseUpdate &&
        database.getEmployeeAttendanceByRange({}).length ===
          employeeAttendanceCountBeforeLicenseUpdate &&
        database.getSchoolSettings().schoolName ===
          schoolNameBeforeLicenseUpdate,
      "License update modified ERP school data.",
    );

    remoteFailure = null;
    remoteResponse = {
      ...remoteResponse,
      valid: true,
      status: "Active",
      message: "License active",
    };
    const remoteRequestCountBeforeReplacementUpdate =
      remoteRequests.length;
    const updatedLicenseStatus = await licenseService.updateLicenseKey(
      replacementLicenseKey,
    );
    const replacementUpdateRequest =
      remoteRequests[remoteRequestCountBeforeReplacementUpdate];
    assert(
      updatedLicenseStatus.isValid &&
        updatedLicenseStatus.license?.licenseId ===
          "LIC-SMOKE-WONDER-001" &&
        updatedLicenseStatus.license?.schoolName ===
          "Wonder Child School" &&
        updatedLicenseStatus.remote?.remoteStatus === "Active" &&
        updatedLicenseStatus.remote?.blocksUsage === false &&
        replacementUpdateRequest?.licenseId ===
          "LIC-SMOKE-WONDER-001" &&
        replacementUpdateRequest?.deviceId === firstDeviceId,
      "Wonder Child license update did not activate remotely.",
    );
    assert(
      database.getLicenseActivationRecord()?.licenseId ===
        "LIC-SMOKE-WONDER-001" &&
        database.getRemoteLicenseStatusRecord()?.licenseId ===
          "LIC-SMOKE-WONDER-001",
      "Previous remote license status was not replaced.",
    );
    assert(
      database.getStudents().length === studentCountBeforeLicenseUpdate &&
        database.getFeePayments().length ===
          feePaymentCountBeforeLicenseUpdate &&
        database.getAttendance().length ===
          attendanceCountBeforeLicenseUpdate &&
        database.getEmployeeAttendanceByRange({}).length ===
          employeeAttendanceCountBeforeLicenseUpdate &&
        database.getSchoolSettings().schoolName ===
          schoolNameBeforeLicenseUpdate,
      "Successful license update modified ERP school data.",
    );

    const managedStoreAssetDirectory = path.join(
      temporaryDirectory,
      "store-products",
    );
    fs.mkdirSync(managedStoreAssetDirectory, { recursive: true });
    const managedStoreAssetPath = path.join(
      managedStoreAssetDirectory,
      "smoke-product.txt",
    );
    fs.writeFileSync(managedStoreAssetPath, "original store image", "utf8");

    const backupPath = path.join(temporaryDirectory, "smoke-backup.db");
    validateDatabaseFile(databasePath);
    await database.backupTo(backupPath);
    validateDatabaseFile(backupPath);
    assert(fs.existsSync(backupPath), "Database backup was not created.");
    const legacyInspection = inspectBackupArchive(backupPath);
    assert(
      legacyInspection.type === "legacy-database",
      "Legacy database backup compatibility inspection failed.",
    );
    const reportUtilsSource = fs.readFileSync(
      path.join(__dirname, "../src/lib/reportUtils.ts"),
      "utf8",
    );
    assert(
      reportUtilsSource.includes("/^[=+\\-@]/"),
      "CSV export formula-injection neutralization is missing.",
    );

    const fullBackupPath = path.join(temporaryDirectory, "smoke-full-backup.zip");
    const fullBackupArchive = createFullBackupArchive({
      archivePath: fullBackupPath,
      databaseBackupPath: backupPath,
      databasePath,
      userDataPath: temporaryDirectory,
      appVersion: "smoke-test",
      schemaVersion: database.getDatabaseUserVersion(),
      schoolSettings: database.getSchoolSettings(),
    });
    assert(
      fs.existsSync(fullBackupPath) &&
        fullBackupArchive.manifest.totalFileCount === 1 &&
        fullBackupArchive.manifest.includedFileCategories.some(
          (category) => category.directory === "store-products",
        ),
      "Full backup archive did not include managed asset metadata.",
    );
    const fullInspection = inspectBackupArchive(fullBackupPath, {
      currentSchoolName: "Different Smoke School",
    });
    assert(
      fullInspection.type === "full-archive" &&
        fullInspection.warningMessages.length === 1,
      "Full backup archive inspection did not report the wrong-school warning.",
    );
    const extractedBackupDirectory = path.join(
      temporaryDirectory,
      "full-backup-extract",
    );
    extractFullBackupArchive(fullBackupPath, extractedBackupDirectory);
    assert(
      fs.existsSync(
        path.join(extractedBackupDirectory, "backup", "database", "school-erp.db"),
      ) &&
        fs.readFileSync(
          path.join(
            extractedBackupDirectory,
            "backup",
            "files",
            "store-products",
            "smoke-product.txt",
          ),
          "utf8",
        ) === "original store image",
      "Full backup archive extraction did not preserve database and assets.",
    );

    const expectBackupFailure = (callback, expectedText, label) => {
      let message = "";
      try {
        callback();
      } catch (error) {
        message = error instanceof Error ? error.message : String(error);
      }
      assert(
        message.includes(expectedText),
        `${label}: expected "${expectedText}", got "${message}".`,
      );
    };
    const invalidZipPath = path.join(temporaryDirectory, "invalid.zip");
    fs.writeFileSync(invalidZipPath, "not a zip archive", "utf8");
    expectBackupFailure(
      () => validateFullBackupArchive(invalidZipPath),
      "invalid",
      "Invalid ZIP was not rejected",
    );
    const missingManifestZip = path.join(
      temporaryDirectory,
      "missing-manifest.zip",
    );
    backupTestHelpers.writeZipArchive(missingManifestZip, [
      { archivePath: "backup/database/school-erp.db", filePath: backupPath },
    ]);
    expectBackupFailure(
      () => validateFullBackupArchive(missingManifestZip),
      "manifest",
      "Missing manifest archive was not rejected",
    );
    const minimalManifest = {
      format: "vidhya-school-erp-full-backup",
      formatVersion: 1,
      schoolIdentity: { schoolName: "Persistence Test School" },
      includedFileCategories: [],
      database: {
        filename: "school-erp.db",
        archivePath: "backup/database/school-erp.db",
      },
    };
    const minimalManifestBuffer = Buffer.from(
      JSON.stringify(minimalManifest),
      "utf8",
    );
    const minimalManifestHash = crypto
      .createHash("sha256")
      .update(minimalManifestBuffer)
      .digest("hex");
    const missingDatabaseZip = path.join(
      temporaryDirectory,
      "missing-database.zip",
    );
    backupTestHelpers.writeZipArchive(missingDatabaseZip, [
      { archivePath: "backup/manifest.json", data: minimalManifestBuffer },
      {
        archivePath: "backup/checksums.json",
        data: Buffer.from(
          JSON.stringify({
            algorithm: "SHA-256",
            entries: {
              "backup/database/school-erp.db": "missing",
              "backup/manifest.json": minimalManifestHash,
            },
          }),
          "utf8",
        ),
      },
    ]);
    expectBackupFailure(
      () => validateFullBackupArchive(missingDatabaseZip),
      "missing a checksummed file",
      "Missing database archive was not rejected",
    );
    const checksumMismatchZip = path.join(
      temporaryDirectory,
      "checksum-mismatch.zip",
    );
    backupTestHelpers.writeZipArchive(checksumMismatchZip, [
      { archivePath: "backup/database/school-erp.db", filePath: backupPath },
      { archivePath: "backup/manifest.json", data: minimalManifestBuffer },
      {
        archivePath: "backup/checksums.json",
        data: Buffer.from(
          JSON.stringify({
            algorithm: "SHA-256",
            entries: {
              "backup/database/school-erp.db": "wrong",
              "backup/manifest.json": minimalManifestHash,
            },
          }),
          "utf8",
        ),
      },
    ]);
    expectBackupFailure(
      () => validateFullBackupArchive(checksumMismatchZip),
      "checksum validation failed",
      "Checksum mismatch archive was not rejected",
    );
    const assetMismatchManifest = {
      ...minimalManifest,
      includedFileCategories: [
        {
          id: "store-products",
          directory: "store-products",
          archivePath: "backup/files/store-products",
          fileCount: 1,
          totalBytes: 5,
        },
      ],
    };
    const assetMismatchManifestBuffer = Buffer.from(
      JSON.stringify(assetMismatchManifest),
      "utf8",
    );
    const assetMismatchZip = path.join(
      temporaryDirectory,
      "asset-checksum-mismatch.zip",
    );
    backupTestHelpers.writeZipArchive(assetMismatchZip, [
      { archivePath: "backup/database/school-erp.db", filePath: backupPath },
      { archivePath: "backup/manifest.json", data: assetMismatchManifestBuffer },
      {
        archivePath: "backup/files/store-products/bad.txt",
        data: Buffer.from("asset", "utf8"),
      },
      {
        archivePath: "backup/checksums.json",
        data: Buffer.from(
          JSON.stringify({
            algorithm: "SHA-256",
            entries: {
              "backup/database/school-erp.db": crypto
                .createHash("sha256")
                .update(fs.readFileSync(backupPath))
                .digest("hex"),
              "backup/manifest.json": crypto
                .createHash("sha256")
                .update(assetMismatchManifestBuffer)
                .digest("hex"),
              "backup/files/store-products/bad.txt": "wrong",
            },
          }),
          "utf8",
        ),
      },
    ]);
    expectBackupFailure(
      () => validateFullBackupArchive(assetMismatchZip),
      "checksum validation failed",
      "Asset checksum mismatch archive was not rejected",
    );
    const corruptDatabaseBuffer = Buffer.from("not sqlite", "utf8");
    const corruptDatabaseZip = path.join(
      temporaryDirectory,
      "corrupt-database.zip",
    );
    backupTestHelpers.writeZipArchive(corruptDatabaseZip, [
      {
        archivePath: "backup/database/school-erp.db",
        data: corruptDatabaseBuffer,
      },
      { archivePath: "backup/manifest.json", data: minimalManifestBuffer },
      {
        archivePath: "backup/checksums.json",
        data: Buffer.from(
          JSON.stringify({
            algorithm: "SHA-256",
            entries: {
              "backup/database/school-erp.db": crypto
                .createHash("sha256")
                .update(corruptDatabaseBuffer)
                .digest("hex"),
              "backup/manifest.json": minimalManifestHash,
            },
          }),
          "utf8",
        ),
      },
    ]);
    expectBackupFailure(
      () => validateFullBackupArchive(corruptDatabaseZip),
      "valid SQLite database",
      "Corrupt SQLite archive was not rejected",
    );
    const traversalZip = path.join(temporaryDirectory, "traversal.zip");
    backupTestHelpers.writeZipArchive(
      traversalZip,
      [{ archivePath: "../evil.txt", data: Buffer.from("x") }],
      { skipPathValidation: true },
    );
    expectBackupFailure(
      () => validateFullBackupArchive(traversalZip),
      "path traversal",
      "Path traversal archive was not rejected",
    );
    const absolutePathZip = path.join(temporaryDirectory, "absolute-path.zip");
    backupTestHelpers.writeZipArchive(
      absolutePathZip,
      [{ archivePath: "/tmp/evil.txt", data: Buffer.from("x") }],
      { skipPathValidation: true },
    );
    expectBackupFailure(
      () => validateFullBackupArchive(absolutePathZip),
      "path traversal",
      "Absolute archive path was not rejected",
    );
    const symlinkZip = path.join(temporaryDirectory, "symlink.zip");
    backupTestHelpers.writeZipArchive(symlinkZip, [
      {
        archivePath: "backup/files/store-products/link",
        data: Buffer.from("target"),
        externalAttributes: 0o120777 * 0x10000,
      },
    ]);
    expectBackupFailure(
      () => validateFullBackupArchive(symlinkZip),
      "symlink",
      "Symlink archive was not rejected",
    );
    const futureManifestBuffer = Buffer.from(
      JSON.stringify({ ...minimalManifest, formatVersion: 99 }),
      "utf8",
    );
    const futureZip = path.join(temporaryDirectory, "future-version.zip");
    backupTestHelpers.writeZipArchive(futureZip, [
      { archivePath: "backup/manifest.json", data: futureManifestBuffer },
      {
        archivePath: "backup/checksums.json",
        data: Buffer.from(
          JSON.stringify({
            algorithm: "SHA-256",
            entries: {
              "backup/manifest.json": crypto
                .createHash("sha256")
                .update(futureManifestBuffer)
                .digest("hex"),
            },
          }),
          "utf8",
        ),
      },
    ]);
    expectBackupFailure(
      () => validateFullBackupArchive(futureZip),
      "newer unsupported version",
      "Future backup version was not rejected",
    );

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
      database.getLicenseActivationRecord()?.licenseId ===
        "LIC-SMOKE-WONDER-001",
      "License activation did not persist through backup and restore.",
    );
    const restoredStudents = database.getStudents();
    assert(
      restoredStudents.length >= 5 &&
        restoredStudents.some((student) => student.id === bridgeResult.studentId) &&
        restoredStudents.some((student) => student.admissionNo === "LIVE-DUP-001"),
      "Students did not persist.",
    );
    assert(
      database.getSchoolSettings().schoolName === "Persistence Test School",
      "School settings did not persist.",
    );
    fs.writeFileSync(
      managedStoreAssetPath,
      "current asset before failed restore",
      "utf8",
    );
    extractFullBackupArchive(fullBackupPath, restorePaths.pendingDirectory);
    fs.writeFileSync(
      path.join(
        restorePaths.pendingDirectory,
        "backup",
        "database",
        "school-erp.db",
      ),
      "corrupt staged database",
      "utf8",
    );
    database.close();
    let failedRestoreMessage = "";
    try {
      applyPendingDatabaseRestore(databasePath);
    } catch (error) {
      failedRestoreMessage =
        error instanceof Error ? error.message : String(error);
    }
    assert(
      (failedRestoreMessage.includes("valid SQLite database") ||
        failedRestoreMessage.includes("checksum validation failed")) &&
        fs.readFileSync(managedStoreAssetPath, "utf8") ===
          "current asset before failed restore" &&
        !fs.existsSync(restorePaths.pendingDirectory),
      "Failed restore did not preserve current data and clear the bad staged restore.",
    );
    database = createDatabase(databasePath);
    assert(
      database.getSchoolSettings().schoolName === "Persistence Test School",
      "Failed restore modified the current database.",
    );
    fs.writeFileSync(managedStoreAssetPath, "mutated store image", "utf8");
    extractFullBackupArchive(fullBackupPath, restorePaths.pendingDirectory);
    assert(
      backupService.getDatabaseInfo().restorePending,
      "Database information did not report the staged full archive restore.",
    );
    database.close();
    const fullRestoreResult = applyPendingDatabaseRestore(databasePath);
    assert(
      fullRestoreResult.restored &&
        fullRestoreResult.type === "full-archive" &&
        fullRestoreResult.safetyBackupPath &&
        fs.existsSync(fullRestoreResult.safetyBackupPath),
      "Pending full archive restore was not applied with a safety backup.",
    );
    inspectBackupArchive(fullRestoreResult.safetyBackupPath);
    assert(
      !fs.existsSync(restorePaths.pendingDirectory) &&
        !fs.existsSync(restorePaths.metadataPath) &&
        !fs.existsSync(restorePaths.restoreTempPath),
      "Full archive staged restore files were not cleaned after restore.",
    );
    assert(
      fs.readFileSync(managedStoreAssetPath, "utf8") ===
        "original store image",
      "Full archive restore did not roll managed assets back to the backup state.",
    );
    database = createDatabase(databasePath);
    const restoredOwnerUser = database.getUserById(bridgeResult.ownerId);
    const restoredDirectMessageReport = database.getMessageDeliveryReport(
      restoredOwnerUser,
      bridgeResult.messageThreadId,
    );
    const restoredAnnouncementReport = database.getAnnouncementReadReport(
      restoredOwnerUser,
      bridgeResult.allStudentsAnnouncementId,
    );
    assert(
      restoredDirectMessageReport.recipients.length >= 1 &&
        restoredDirectMessageReport.recipients.some(
          (recipient) => recipient.readAt,
        ) &&
        restoredAnnouncementReport.announcement.status === "Published" &&
        restoredAnnouncementReport.recipients.length >= 2,
      "Message threads, recipients, read receipts, or announcements did not persist through backup and restore.",
    );
    assert(
      !database
        .getFamilies({})
        .some((family) => family.id === bridgeResult.deletedFamilyId) &&
        database
          .getGuardians({ familyId: bridgeResult.deletedFamilyId })
          .some((guardian) => guardian.id === bridgeResult.fatherGuardianId) &&
        database
          .getGuardians({ familyId: bridgeResult.deletedFamilyId })
          .some((guardian) => guardian.id === bridgeResult.motherGuardianId) &&
        database
          .getStudentGuardians(bridgeResult.studentId)
          .some((link) => link.guardianId === bridgeResult.motherGuardianId) &&
        !database
          .getStudentGuardians(bridgeResult.studentId)
          .some((link) => link.guardianId === bridgeResult.fatherGuardianId) &&
        database
          .getStudents()
          .some((student) => student.id === bridgeResult.studentId) &&
        database
          .getStudents()
          .some((student) => student.id === bridgeResult.repeatStudentId),
      "Family soft delete, guardians, links, or student records did not persist safely.",
    );
    assert(
      database
        .getSchoolRules({})
        .some(
          (rule) =>
            rule.id === bridgeResult.schoolRuleId &&
            rule.ruleText.includes("notify absences") &&
            rule.displayOrder === 1,
        ) &&
        !database
          .getSchoolRules({})
          .some((rule) => rule.id === bridgeResult.deletedSchoolRuleId),
      "School rules did not persist or soft-deleted rules were returned.",
    );
    assert(
      database.getAppPreferences().themeMode === "System" &&
        database.getAppPreferences().accentColor === "Indigo" &&
        database.getAppPreferences().compactSidebar === true &&
        database.getUserPreferences(bridgeResult.ownerId).language ===
          "Hindi" &&
        database.getUserPreferences(bridgeResult.ownerId).themeMode ===
          "Dark",
      "Application or user preferences did not persist.",
    );
    assert(
      database
        .getLoginHistory({ limit: 50 }, bridgeResult.ownerId)
        .some((entry) => entry.username === "owner" && entry.success) &&
        database
          .getLoginHistory({ limit: 50 }, bridgeResult.ownerId)
          .some(
            (entry) =>
              entry.username === "owner" &&
              !entry.success &&
              entry.failureReason.includes("Invalid username or password"),
          ),
      "Login history did not persist.",
    );
    assert(database.getFeePayments().length === 6, "Fee payments did not persist.");
    assert(database.getAttendance().length === 1, "Attendance did not persist.");
    assert(
      database.getEmployeeAttendanceByRange({ month: "2026-07" }).length ===
        3 &&
        database
          .getEmployeeAttendanceByRange({
            employeeId: bridgeResult.employeeId,
            month: "2026-07",
          })
          .some(
            (record) =>
              record.status === "Late" && record.lateMinutes === 20,
          ) &&
        database
          .getEmployeeAttendanceByRange({
            employeeId: bridgeResult.deletedEmployeeId,
            month: "2026-07",
          })
          .length === 1,
      "Employee attendance did not persist or employee deletion destroyed history.",
    );
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
    const persistedHomeworkSubmissions = database.getHomeworkSubmissions(
      bridgeResult.homeworkId,
    );
    assert(
      database.getHomework().length === 1 &&
        database.getHomework()[0].id === bridgeResult.homeworkId &&
        persistedHomeworkSubmissions.length === 2 &&
        persistedHomeworkSubmissions.some(
          (submission) =>
            submission.studentId === bridgeResult.studentId &&
            submission.status === "Checked" &&
            submission.marks === 9,
        ),
      "Homework or submission updates did not persist.",
    );
    const persistedClassTestMarks = database.getClassTestMarks(
      bridgeResult.classTestId,
    );
    assert(
      database.getClassTests().length === 1 &&
        database.getClassTests()[0].id === bridgeResult.classTestId &&
        persistedClassTestMarks.length === 2 &&
        persistedClassTestMarks.some(
          (mark) =>
            mark.studentId === bridgeResult.studentId &&
            mark.resultStatus === "Pass" &&
            mark.marksObtained === 9,
        ),
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
      database
        .getBehaviourTraits()
        .some((trait) => trait.id === bridgeResult.behaviourTraitId) &&
        database
          .getSkillTraits()
          .some((trait) => trait.id === bridgeResult.skillTraitId) &&
        database.getBehaviourRatings({
          studentId: bridgeResult.studentId,
        }).length === 1 &&
        database.getSkillRatings({
          studentId: bridgeResult.studentId,
          domain: "Affective",
        }).length === 1 &&
        database.getSkillRatings({
          studentId: bridgeResult.studentId,
          domain: "Psychomotor",
        }).length === 1 &&
        database.getStudentObservations({
          studentId: bridgeResult.studentId,
        }).length === 1 &&
        database.getStudentObservations({
          studentId: bridgeResult.studentId,
        })[0].id === bridgeResult.observationId,
      "Behaviour ratings, skill ratings, or observations did not persist.",
    );
    const persistedPromotion = database.getStudentPromotionById(
      bridgeResult.promotionId,
    );
    const persistedStudents = database.getStudents();
    const persistedCarryForwardDues = database.getCarryForwardDues({
      toSessionId: bridgeResult.toAcademicSessionId,
    });
    assert(
      database.getAcademicSessions().length === 2 &&
        database.getCurrentAcademicSession()?.id ===
          bridgeResult.toAcademicSessionId &&
        database
          .getAcademicSessions()
          .find(
            (session) =>
              session.id === bridgeResult.fromAcademicSessionId,
          )?.status === "Closed" &&
        persistedPromotion?.promotionNo === "PROM-2026-0001" &&
        persistedPromotion.items.length === 4 &&
        database.getStudentSessionHistory(bridgeResult.studentId).length ===
          2 &&
        database.getStudentSessionHistory(bridgeResult.repeatStudentId)
          .length === 2 &&
        persistedCarryForwardDues.length === 2 &&
        persistedCarryForwardDues.some(
          (due) =>
            due.studentId === bridgeResult.studentId &&
            due.status === "Paid",
        ) &&
        persistedCarryForwardDues.some(
          (due) =>
            due.studentId === bridgeResult.repeatStudentId &&
            due.status === "Waived",
        ) &&
        persistedStudents.find(
          (student) => student.id === bridgeResult.studentId,
        )?.className === "11" &&
        persistedStudents.find(
          (student) => student.id === bridgeResult.repeatStudentId,
        )?.className === "10" &&
        persistedStudents.find(
          (student) => student.id === bridgeResult.tcStudentId,
        )?.sessionStatus === "TC" &&
        persistedStudents.find(
          (student) => student.id === bridgeResult.leftStudentId,
        )?.sessionStatus === "Left",
      "Academic sessions, promotion history, effective statuses, or carry-forward dues did not persist.",
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
    const restoredAccountTransactions = database.getAccountTransactions();
    const restoredPosAccountNet = restoredAccountTransactions
      .filter((transaction) =>
        ["POS Sale", "POS Sale Reversal"].includes(transaction.linkedModule),
      )
      .reduce(
        (total, transaction) =>
          total +
          (transaction.type === "Income" ? transaction.amount : -transaction.amount),
        0,
      );
    assert(
      restoredAccountTransactions.length >= 8 &&
        restoredAccountTransactions.some(
          (transaction) =>
            transaction.id === bridgeResult.manualExpenseId &&
            transaction.type === "Expense",
        ) &&
        restoredAccountTransactions.filter(
          (transaction) => transaction.linkedModule === "Fees",
        ).length === 5 &&
        restoredPosAccountNet === 300,
      "Account transactions did not persist.",
    );
    assert(
      database.getMarksByExam(bridgeResult.examId).length === 1,
      "Marks by exam did not persist.",
    );
    const persistedReportCard = database.getStudentReportCardById(
      bridgeResult.reportCardId,
    );
    assert(
      database.getGradingSchemeById(bridgeResult.gradingSchemeId)?.ranges
        .length === 7 &&
        database
          .getReportCardTemplates()
          .some((template) => template.id === bridgeResult.reportCardTemplateId) &&
        database
          .getStudentReportCards({
            academicSessionId: bridgeResult.toAcademicSessionId,
            examId: bridgeResult.examId,
            studentId: bridgeResult.studentId,
          })
          .length === 1 &&
        /^RC-2026-[0-9]{4}$/.test(persistedReportCard?.reportCardNo || "") &&
        persistedReportCard.subjects[0]?.obtainedMarks === 20 &&
        persistedReportCard.resultStatus === "Fail",
      "Grading scheme, template, report card, or subject snapshots did not persist.",
    );
    assert(database.getClasses().length === 2, "Classes did not persist.");
    assert(database.getSections().length === 2, "Sections did not persist.");
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
        database.getUserCount() === bridgeResult.safeUsers.length &&
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
