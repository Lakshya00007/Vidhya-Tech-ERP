const path = require("node:path");
const { app, BrowserWindow } = require("electron");
const {
  applyPendingDatabaseRestore,
  createBackupService,
} = require("./backup.cjs");
const { createAuthService } = require("./auth.cjs");
const { createDatabase } = require("./database.cjs");
const { registerIpcHandlers } = require("./ipc.cjs");

app.setName("School ERP Desktop");

let database;
const isDevelopment = !app.isPackaged;

async function createWindow() {
  const win = new BrowserWindow({
    show: false,
    backgroundColor: "#f4f7fb",
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

  win.once("ready-to-show", () => {
    win.show();
  });

  if (isDevelopment) {
    await win.loadURL("http://localhost:5173");
  } else {
    await win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app
  .whenReady()
  .then(async () => {
    const databasePath = path.join(app.getPath("userData"), "school-erp.db");
    try {
      applyPendingDatabaseRestore(databasePath);
    } catch (error) {
      console.error("Pending database restore could not be applied.", error);
    }
    database = createDatabase(databasePath);
    const authService = createAuthService(database);
    const backupService = createBackupService({
      app,
      databasePath,
      getDatabase: () => database,
      closeDatabase: () => database?.close(),
    });
    registerIpcHandlers(database, backupService, authService);
    await createWindow();
  })
  .catch((error) => {
    console.error("School ERP Desktop could not start.", error);
    app.quit();
  });

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void createWindow().catch((error) => {
      console.error("The application window could not be opened.", error);
    });
  }
});

app.on("before-quit", () => {
  database?.close();
});
