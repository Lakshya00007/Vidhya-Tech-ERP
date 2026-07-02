const { ipcMain } = require("electron");

const channels = [
  "students:get-all",
  "students:create",
  "students:update",
  "students:delete",
  "settings:get",
  "settings:save",
  "fees:get-all",
  "fees:create",
  "attendance:get-all",
  "attendance:save",
];

function registerIpcHandlers(database) {
  ipcMain.handle("students:get-all", () => database.getStudents());
  ipcMain.handle("students:create", (_event, student) =>
    database.createStudent(student),
  );
  ipcMain.handle("students:update", (_event, id, student) =>
    database.updateStudent(id, student),
  );
  ipcMain.handle("students:delete", (_event, id) =>
    database.deleteStudent(id),
  );

  ipcMain.handle("settings:get", () => database.getSchoolSettings());
  ipcMain.handle("settings:save", (_event, settings) =>
    database.saveSchoolSettings(settings),
  );

  ipcMain.handle("fees:get-all", () => database.getFeePayments());
  ipcMain.handle("fees:create", (_event, payment) =>
    database.createFeePayment(payment),
  );

  ipcMain.handle("attendance:get-all", () => database.getAttendance());
  ipcMain.handle("attendance:save", (_event, record) =>
    database.saveAttendance(record),
  );

  return () => {
    for (const channel of channels) {
      ipcMain.removeHandler(channel);
    }
  };
}

module.exports = { registerIpcHandlers };
