const path = require("node:path");
const { app, BrowserWindow } = require("electron");
const { createDatabase } = require("./database.cjs");
const { registerIpcHandlers } = require("./ipc.cjs");

app.setName("School ERP Desktop");

let database;

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: "School ERP Desktop",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL("http://localhost:5173");
}

app.whenReady().then(() => {
  const databasePath = path.join(app.getPath("userData"), "school-erp.db");
  database = createDatabase(databasePath);
  registerIpcHandlers(database);
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("before-quit", () => {
  database?.close();
});
