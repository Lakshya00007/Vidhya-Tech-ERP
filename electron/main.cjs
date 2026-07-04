const path = require("node:path");
const { app, BrowserWindow } = require("electron");
const {
  applyPendingDatabaseRestore,
  createBackupService,
} = require("./backup.cjs");
const { createAuthService } = require("./auth.cjs");
const { createDatabase } = require("./database.cjs");
const { registerIpcHandlers } = require("./ipc.cjs");
const {
  createDeviceIdService,
  createLicenseService,
} = require("./license.cjs");

const existingUserDataPath = path.join(
  app.getPath("appData"),
  "School ERP Desktop",
);
app.setName("Vidhya School ERP");
app.setPath("userData", existingUserDataPath);

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
    title: "Vidhya School ERP",
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
    const deviceIdService = createDeviceIdService({
      userDataPath: app.getPath("userData"),
    });
    const licenseService = createLicenseService({
      database,
      deviceIdService,
      publicKeyPath: path.join(__dirname, "license-public-key.pem"),
    });
    const authService = createAuthService(database);
    const backupService = createBackupService({
      app,
      databasePath,
      getDatabase: () => database,
      closeDatabase: () => database?.close(),
    });
    registerIpcHandlers(
      database,
      backupService,
      authService,
      licenseService,
    );
    await createWindow();
  })
  .catch((error) => {
    console.error("Vidhya School ERP could not start.", error);
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
