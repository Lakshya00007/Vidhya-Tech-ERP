const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("erpApi", {
  getStudents: () => ipcRenderer.invoke("students:get-all"),
  createStudent: (student) => ipcRenderer.invoke("students:create", student),
  updateStudent: (id, student) =>
    ipcRenderer.invoke("students:update", id, student),
  deleteStudent: (id) => ipcRenderer.invoke("students:delete", id),

  getSchoolSettings: () => ipcRenderer.invoke("settings:get"),
  saveSchoolSettings: (settings) =>
    ipcRenderer.invoke("settings:save", settings),

  getFeePayments: () => ipcRenderer.invoke("fees:get-all"),
  createFeePayment: (payment) => ipcRenderer.invoke("fees:create", payment),

  getAttendance: () => ipcRenderer.invoke("attendance:get-all"),
  saveAttendance: (record) => ipcRenderer.invoke("attendance:save", record),
});
