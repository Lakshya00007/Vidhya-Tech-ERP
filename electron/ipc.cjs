const { ipcMain } = require("electron");

const channels = [
  "students:get-all",
  "students:create",
  "students:update",
  "students:delete",
  "settings:get",
  "settings:save",
  "fees:get-all",
  "fees:get-by-date-range",
  "fees:create",
  "attendance:get-all",
  "attendance:save",
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
  ipcMain.handle("fees:get-by-date-range", (_event, startDate, endDate) =>
    database.getFeePaymentsByDateRange(startDate, endDate),
  );
  ipcMain.handle("fees:create", (_event, payment) =>
    database.createFeePayment(payment),
  );

  ipcMain.handle("attendance:get-all", () => database.getAttendance());
  ipcMain.handle("attendance:save", (_event, record) =>
    database.saveAttendance(record),
  );

  ipcMain.handle("classes:get-all", () => database.getClasses());
  ipcMain.handle("classes:create", (_event, input) =>
    database.createClass(input),
  );
  ipcMain.handle("classes:update", (_event, id, input) =>
    database.updateClass(id, input),
  );
  ipcMain.handle("classes:delete", (_event, id) => database.deleteClass(id));

  ipcMain.handle("sections:get-all", () => database.getSections());
  ipcMain.handle("sections:create", (_event, input) =>
    database.createSection(input),
  );
  ipcMain.handle("sections:update", (_event, id, input) =>
    database.updateSection(id, input),
  );
  ipcMain.handle("sections:delete", (_event, id) =>
    database.deleteSection(id),
  );

  ipcMain.handle("fee-heads:get-all", () => database.getFeeHeads());
  ipcMain.handle("fee-heads:create", (_event, input) =>
    database.createFeeHead(input),
  );
  ipcMain.handle("fee-heads:update", (_event, id, input) =>
    database.updateFeeHead(id, input),
  );
  ipcMain.handle("fee-heads:delete", (_event, id) =>
    database.deleteFeeHead(id),
  );

  ipcMain.handle("fee-structures:get-all", () =>
    database.getFeeStructures(),
  );
  ipcMain.handle("fee-structures:create", (_event, input) =>
    database.createFeeStructure(input),
  );
  ipcMain.handle("fee-structures:update", (_event, id, input) =>
    database.updateFeeStructure(id, input),
  );
  ipcMain.handle("fee-structures:delete", (_event, id) =>
    database.deleteFeeStructure(id),
  );

  return () => {
    for (const channel of channels) {
      ipcMain.removeHandler(channel);
    }
  };
}

module.exports = { registerIpcHandlers };
