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
  getFeePaymentsByDateRange: (startDate, endDate) =>
    ipcRenderer.invoke("fees:get-by-date-range", startDate, endDate),
  createFeePayment: (payment) => ipcRenderer.invoke("fees:create", payment),

  getAttendance: () => ipcRenderer.invoke("attendance:get-all"),
  saveAttendance: (record) => ipcRenderer.invoke("attendance:save", record),

  getClasses: () => ipcRenderer.invoke("classes:get-all"),
  createClass: (input) => ipcRenderer.invoke("classes:create", input),
  updateClass: (id, input) => ipcRenderer.invoke("classes:update", id, input),
  deleteClass: (id) => ipcRenderer.invoke("classes:delete", id),

  getSections: () => ipcRenderer.invoke("sections:get-all"),
  createSection: (input) => ipcRenderer.invoke("sections:create", input),
  updateSection: (id, input) =>
    ipcRenderer.invoke("sections:update", id, input),
  deleteSection: (id) => ipcRenderer.invoke("sections:delete", id),

  getFeeHeads: () => ipcRenderer.invoke("fee-heads:get-all"),
  createFeeHead: (input) => ipcRenderer.invoke("fee-heads:create", input),
  updateFeeHead: (id, input) =>
    ipcRenderer.invoke("fee-heads:update", id, input),
  deleteFeeHead: (id) => ipcRenderer.invoke("fee-heads:delete", id),

  getFeeStructures: () => ipcRenderer.invoke("fee-structures:get-all"),
  createFeeStructure: (input) =>
    ipcRenderer.invoke("fee-structures:create", input),
  updateFeeStructure: (id, input) =>
    ipcRenderer.invoke("fee-structures:update", id, input),
  deleteFeeStructure: (id) =>
    ipcRenderer.invoke("fee-structures:delete", id),
});
