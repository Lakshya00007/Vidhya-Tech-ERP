const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");
const { BrowserWindow, dialog, shell } = require("electron");

const PENDING_RESTORE_FILENAME = "school-erp-restore-pending.db";
const PENDING_RESTORE_METADATA_FILENAME =
  "school-erp-restore-pending.json";
const PENDING_RESTORE_TEMP_FILENAME =
  "school-erp-restore-pending.tmp.db";

function timestampForFilename(date = new Date()) {
  const parts = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
  ];
  return `${parts[0]}-${parts[1]}-${parts[2]}-${parts[3]}-${parts[4]}`;
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "Unavailable";
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getRestorePaths(databasePath) {
  const databaseDirectory = path.dirname(databasePath);
  return {
    databaseDirectory,
    pendingPath: path.join(databaseDirectory, PENDING_RESTORE_FILENAME),
    metadataPath: path.join(
      databaseDirectory,
      PENDING_RESTORE_METADATA_FILENAME,
    ),
    pendingTempPath: path.join(
      databaseDirectory,
      PENDING_RESTORE_TEMP_FILENAME,
    ),
    metadataTempPath: path.join(
      databaseDirectory,
      `${PENDING_RESTORE_METADATA_FILENAME}.tmp`,
    ),
    restoreTempPath: `${databasePath}.restore-temp.db`,
    previousDatabasePath: `${databasePath}.before-restore-temp`,
  };
}

function getAvailableSafetyBackupPath(databaseDirectory, date = new Date()) {
  const stem = `school-erp-auto-backup-before-restore-${timestampForFilename(date)}`;
  let candidate = path.join(databaseDirectory, `${stem}.db`);
  let suffix = 1;
  while (fs.existsSync(candidate)) {
    candidate = path.join(databaseDirectory, `${stem}-${suffix}.db`);
    suffix += 1;
  }
  return candidate;
}

function validateDatabaseFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error("The selected database backup does not exist.");
  }
  if (path.extname(filePath).toLowerCase() !== ".db") {
    throw new Error("Select a valid .db database backup file.");
  }
  if (!fs.statSync(filePath).isFile()) {
    throw new Error("The selected database backup is not a file.");
  }

  let candidate;
  try {
    candidate = new Database(filePath, {
      readonly: true,
      fileMustExist: true,
    });
    const integrity = candidate.pragma("integrity_check", { simple: true });
    if (integrity !== "ok") {
      throw new Error("The selected database backup failed validation.");
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("failed validation")) {
      throw error;
    }
    throw new Error("The selected file is not a valid SQLite database.");
  } finally {
    candidate?.close();
  }
}

function createStartupSafetyBackup(databasePath, safetyBackupPath) {
  const currentDatabase = new Database(databasePath, {
    fileMustExist: true,
  });
  try {
    const integrity = currentDatabase.pragma("integrity_check", {
      simple: true,
    });
    if (integrity !== "ok") {
      throw new Error(
        "The current database failed validation before restore.",
      );
    }
    currentDatabase.pragma("wal_checkpoint(TRUNCATE)");
  } finally {
    currentDatabase.close();
  }
  fs.copyFileSync(databasePath, safetyBackupPath);
  validateDatabaseFile(safetyBackupPath);
}

function readRestoreMetadata(metadataPath) {
  if (!fs.existsSync(metadataPath)) return null;
  try {
    const value = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
    return value && typeof value === "object" ? value : null;
  } catch {
    return null;
  }
}

function applyPendingDatabaseRestore(databasePath) {
  const {
    databaseDirectory,
    pendingPath,
    metadataPath,
    pendingTempPath,
    metadataTempPath,
    restoreTempPath,
    previousDatabasePath,
  } = getRestorePaths(databasePath);

  fs.rmSync(pendingTempPath, { force: true });
  fs.rmSync(metadataTempPath, { force: true });
  fs.rmSync(restoreTempPath, { force: true });

  if (fs.existsSync(previousDatabasePath)) {
    if (fs.existsSync(databasePath)) {
      fs.rmSync(previousDatabasePath, { force: true });
    } else {
      fs.renameSync(previousDatabasePath, databasePath);
    }
  }

  if (!fs.existsSync(pendingPath)) {
    fs.rmSync(metadataPath, { force: true });
    return { restored: false, safetyBackupPath: null };
  }

  validateDatabaseFile(pendingPath);
  const metadata = readRestoreMetadata(metadataPath);
  let safetyBackupPath = null;
  if (
    typeof metadata?.safetyBackupPath === "string" &&
    fs.existsSync(metadata.safetyBackupPath)
  ) {
    try {
      validateDatabaseFile(metadata.safetyBackupPath);
      safetyBackupPath = metadata.safetyBackupPath;
    } catch {
      safetyBackupPath = null;
    }
  }
  if (fs.existsSync(databasePath) && !safetyBackupPath) {
    safetyBackupPath = getAvailableSafetyBackupPath(databaseDirectory);
    createStartupSafetyBackup(databasePath, safetyBackupPath);
  }

  fs.copyFileSync(pendingPath, restoreTempPath);
  validateDatabaseFile(restoreTempPath);

  let currentDatabaseMoved = false;
  let restoredDatabaseInstalled = false;
  try {
    if (fs.existsSync(databasePath)) {
      fs.renameSync(databasePath, previousDatabasePath);
      currentDatabaseMoved = true;
    }
    fs.renameSync(restoreTempPath, databasePath);
    restoredDatabaseInstalled = true;
    fs.rmSync(`${databasePath}-wal`, { force: true });
    fs.rmSync(`${databasePath}-shm`, { force: true });
    validateDatabaseFile(databasePath);
    fs.rmSync(previousDatabasePath, { force: true });
    fs.rmSync(pendingPath, { force: true });
    fs.rmSync(metadataPath, { force: true });
    return { restored: true, safetyBackupPath };
  } catch (error) {
    fs.rmSync(restoreTempPath, { force: true });
    if (restoredDatabaseInstalled) {
      fs.rmSync(databasePath, { force: true });
    }
    if (currentDatabaseMoved && fs.existsSync(previousDatabasePath)) {
      fs.renameSync(previousDatabasePath, databasePath);
    }
    throw error;
  }
}

function createBackupService({
  app,
  databasePath,
  getDatabase,
  closeDatabase,
}) {
  const databaseDirectory = path.dirname(databasePath);
  const restorePaths = getRestorePaths(databasePath);

  function parentWindow(event) {
    return event?.sender
      ? BrowserWindow.fromWebContents(event.sender) ?? undefined
      : undefined;
  }

  async function showSaveDialog(event, options) {
    const parent = parentWindow(event);
    return parent
      ? dialog.showSaveDialog(parent, options)
      : dialog.showSaveDialog(options);
  }

  async function showOpenDialog(event, options) {
    const parent = parentWindow(event);
    return parent
      ? dialog.showOpenDialog(parent, options)
      : dialog.showOpenDialog(options);
  }

  return {
    async createDatabaseBackup(event) {
      try {
        const filename = `school-erp-backup-${timestampForFilename()}.db`;
        const result = await showSaveDialog(event, {
          title: "Create School ERP Database Backup",
          defaultPath: path.join(app.getPath("documents"), filename),
          buttonLabel: "Save Backup",
          filters: [{ name: "SQLite Database", extensions: ["db"] }],
        });
        if (result.canceled || !result.filePath) {
          return {
            success: false,
            canceled: true,
            message: "Database backup was cancelled.",
          };
        }

        const targetPath =
          path.extname(result.filePath).toLowerCase() === ".db"
            ? result.filePath
            : `${result.filePath}.db`;
        if (path.resolve(targetPath) === path.resolve(databasePath)) {
          throw new Error(
            "Choose a backup location different from the active database.",
          );
        }
        await getDatabase().backupTo(targetPath);
        try {
          validateDatabaseFile(targetPath);
        } catch (error) {
          fs.rmSync(targetPath, { force: true });
          throw error;
        }
        return {
          success: true,
          message:
            "Database backup created and validated successfully.",
          path: targetPath,
        };
      } catch (error) {
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Database backup could not be created.",
        };
      }
    },

    async restoreDatabaseBackup(event) {
      let pendingCreated = false;
      try {
        const result = await showOpenDialog(event, {
          title: "Restore School ERP Database",
          buttonLabel: "Select Backup",
          properties: ["openFile"],
          filters: [{ name: "SQLite Database", extensions: ["db"] }],
        });
        if (result.canceled || result.filePaths.length === 0) {
          return {
            success: false,
            canceled: true,
            message: "Database restore was cancelled.",
          };
        }

        const selectedPath = result.filePaths[0];
        validateDatabaseFile(selectedPath);
        if (path.resolve(selectedPath) === path.resolve(databasePath)) {
          throw new Error("The selected file is already the active database.");
        }

        const safetyBackupPath =
          getAvailableSafetyBackupPath(databaseDirectory);
        await getDatabase().backupTo(safetyBackupPath);
        validateDatabaseFile(safetyBackupPath);

        fs.copyFileSync(selectedPath, restorePaths.pendingTempPath);
        validateDatabaseFile(restorePaths.pendingTempPath);
        fs.rmSync(restorePaths.pendingPath, { force: true });
        fs.renameSync(
          restorePaths.pendingTempPath,
          restorePaths.pendingPath,
        );
        pendingCreated = true;
        fs.writeFileSync(
          restorePaths.metadataTempPath,
          JSON.stringify(
            {
              safetyBackupPath,
              stagedAt: new Date().toISOString(),
              sourceFilename: path.basename(selectedPath),
            },
            null,
            2,
          ),
          "utf8",
        );
        fs.rmSync(restorePaths.metadataPath, { force: true });
        fs.renameSync(
          restorePaths.metadataTempPath,
          restorePaths.metadataPath,
        );

        return {
          success: true,
          requiresRestart: true,
          safetyBackupPath,
          message:
            "Restore is ready. Restart the app to load the restored database.",
        };
      } catch (error) {
        fs.rmSync(restorePaths.pendingTempPath, { force: true });
        fs.rmSync(restorePaths.metadataTempPath, { force: true });
        if (pendingCreated) {
          fs.rmSync(restorePaths.pendingPath, { force: true });
          fs.rmSync(restorePaths.metadataPath, { force: true });
        }
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Database restore could not be prepared.",
        };
      }
    },

    getDatabaseInfo() {
      const exists = fs.existsSync(databasePath);
      const stats = exists ? fs.statSync(databasePath) : null;
      const fileSizeBytes = stats?.size ?? 0;
      return {
        databasePath,
        databaseDirectory,
        fileSizeBytes,
        fileSizeLabel: formatFileSize(fileSizeBytes),
        lastModified: stats?.mtime.toISOString() ?? "",
        exists,
        restorePending: fs.existsSync(restorePaths.pendingPath),
        recommendation:
          "Create a backup regularly and before major data changes or software updates.",
      };
    },

    async openDatabaseFolder() {
      const result = await shell.openPath(databaseDirectory);
      return result
        ? { success: false, message: result }
        : {
            success: true,
            message: "Database folder opened in Finder.",
            path: databaseDirectory,
          };
    },

    restartApp() {
      setTimeout(() => {
        try {
          closeDatabase();
        } finally {
          app.relaunch();
          app.exit(0);
        }
      }, 150);
      return {
        success: true,
        message: "Restarting School ERP Desktop...",
      };
    },
  };
}

module.exports = {
  applyPendingDatabaseRestore,
  createBackupService,
  getRestorePaths,
  timestampForFilename,
  validateDatabaseFile,
};
