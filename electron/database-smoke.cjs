const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
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
        const subject = await window.erpApi.createSubject({
          name: "Mathematics",
          code: "MATH",
          className: "10",
          maxMarks: 100,
          passingMarks: 33,
          status: "Active"
        });
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
        const auditLogs = await window.erpApi.getAuditLogs(100);

        return {
          authApiAvailable,
          hadUsersBeforeSetup,
          ownerRole: owner.role,
          loggedInOwnerRole: loggedInOwner.role,
          resetPasswordLoginRole: resetPasswordLogin.role,
          safeUsers,
          auditLogCount: auditLogs.length,
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
    assert(database.getStudents().length === 0, "Soft-deleted student is still active.");
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
