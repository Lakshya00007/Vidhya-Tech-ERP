const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { app, BrowserWindow } = require("electron");
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
    let database = createDatabase(databasePath);
    const unregisterIpcHandlers = registerIpcHandlers(database);
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
        const firstPayment = await window.erpApi.createFeePayment({
          studentId: student.id,
          studentName: student.name,
          className: "10-A",
          feeType: "Tuition Fee",
          amount: 12500,
          paymentMode: "Cash"
        });
        const secondPayment = await window.erpApi.createFeePayment({
          studentId: student.id,
          studentName: student.name,
          className: "10-A",
          feeType: "Transport Fee",
          amount: 2500,
          paymentMode: "UPI"
        });
        await window.erpApi.saveAttendance({
          studentId: student.id,
          studentName: student.name,
          className: "10",
          section: "A",
          attendanceDate: "2026-07-03",
          status: "Present"
        });

        return {
          studentId: student.id,
          updatedMobile: updatedStudent.mobile,
          firstReceipt: firstPayment.receiptNo,
          secondReceipt: secondPayment.receiptNo,
          studentCount: (await window.erpApi.getStudents()).length,
          paymentCount: (await window.erpApi.getFeePayments()).length,
          attendanceCount: (await window.erpApi.getAttendance()).length,
          schoolName: (await window.erpApi.getSchoolSettings()).schoolName
        };
      })()
    `);

    assert(bridgeResult.studentCount === 1, "Student IPC operations failed.");
    assert(bridgeResult.updatedMobile === "9888888888", "Student update IPC failed.");
    assert(bridgeResult.paymentCount === 2, "Fee payment IPC operations failed.");
    assert(bridgeResult.firstReceipt === "TEST-RC-1001", "Receipt number was not generated.");
    assert(bridgeResult.secondReceipt === "TEST-RC-1002", "Receipt sequence did not advance.");
    assert(bridgeResult.attendanceCount === 1, "Attendance IPC operation failed.");
    assert(
      bridgeResult.schoolName === "Persistence Test School",
      "Settings IPC operation failed.",
    );

    window.destroy();
    unregisterIpcHandlers();
    database.close();

    database = createDatabase(databasePath);
    assert(database.getStudents().length === 1, "Student did not persist.");
    assert(
      database.getSchoolSettings().schoolName === "Persistence Test School",
      "School settings did not persist.",
    );
    assert(database.getFeePayments().length === 2, "Fee payments did not persist.");
    assert(database.getAttendance().length === 1, "Attendance did not persist.");
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
