const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const crypto = require("node:crypto");
const zlib = require("node:zlib");
const Database = require("better-sqlite3");
const { BrowserWindow, dialog, shell } = require("electron");

const LEGACY_DATABASE_FORMAT = "vidhya-school-erp-database-backup";
const FULL_BACKUP_FORMAT = "vidhya-school-erp-full-backup";
const FULL_BACKUP_FORMAT_VERSION = 1;
const CHECKSUM_ALGORITHM = "SHA-256";
const DATABASE_ARCHIVE_PATH = "backup/database/school-erp.db";
const MANIFEST_ARCHIVE_PATH = "backup/manifest.json";
const CHECKSUMS_ARCHIVE_PATH = "backup/checksums.json";

const PENDING_RESTORE_FILENAME = "school-erp-restore-pending.db";
const PENDING_RESTORE_METADATA_FILENAME =
  "school-erp-restore-pending.json";
const PENDING_RESTORE_TEMP_FILENAME =
  "school-erp-restore-pending.tmp.db";
const PENDING_RESTORE_DIRECTORY = "school-erp-restore-pending";

const MAX_ZIP_SIZE_BYTES = 1024 * 1024 * 1024;
const MAX_ZIP_ENTRIES = 20000;
const MAX_ZIP_FILE_BYTES = 1024 * 1024 * 1024;

const MANAGED_FILE_CATEGORIES = [
  { id: "school-logo", directory: "school-logo" },
  { id: "student-photos", directory: "student-photos" },
  { id: "employee-photos", directory: "employee-photos" },
  { id: "documents", directory: "documents" },
  { id: "certificates", directory: "certificates" },
  { id: "homework", directory: "homework" },
  { id: "report-assets", directory: "report-assets" },
  { id: "store-products", directory: "store-products" },
];

function timestampForFilename(date = new Date()) {
  const parts = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0"),
  ];
  return `${parts[0]}-${parts[1]}-${parts[2]}-${parts[3]}-${parts[4]}-${parts[5]}`;
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "Unavailable";
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function sha256File(filePath) {
  const hash = crypto.createHash("sha256");
  const handle = fs.openSync(filePath, "r");
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  try {
    let bytesRead = 0;
    do {
      bytesRead = fs.readSync(handle, buffer, 0, buffer.length, null);
      if (bytesRead > 0) hash.update(buffer.subarray(0, bytesRead));
    } while (bytesRead > 0);
  } finally {
    fs.closeSync(handle);
  }
  return hash.digest("hex");
}

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32Buffer(buffer, seed = 0xffffffff) {
  let crc = seed;
  for (const byte of buffer) {
    crc = CRC32_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return crc >>> 0;
}

function finalizeCrc32(crc) {
  return (crc ^ 0xffffffff) >>> 0;
}

function fileStats(filePath) {
  const stats = fs.statSync(filePath);
  if (!stats.isFile()) {
    throw new Error("Backup can include regular files only.");
  }
  if (stats.size > MAX_ZIP_FILE_BYTES) {
    throw new Error(`File is too large for backup: ${path.basename(filePath)}`);
  }
  return stats;
}

function hashAndCrcFile(filePath) {
  const hash = crypto.createHash("sha256");
  let crc = 0xffffffff;
  const handle = fs.openSync(filePath, "r");
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  let size = 0;
  try {
    let bytesRead = 0;
    do {
      bytesRead = fs.readSync(handle, buffer, 0, buffer.length, null);
      if (bytesRead > 0) {
        const chunk = buffer.subarray(0, bytesRead);
        hash.update(chunk);
        crc = crc32Buffer(chunk, crc);
        size += bytesRead;
      }
    } while (bytesRead > 0);
  } finally {
    fs.closeSync(handle);
  }
  return {
    crc32: finalizeCrc32(crc),
    sha256: hash.digest("hex"),
    size,
  };
}

function normalizeArchivePath(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Archive entry path is required.");
  }
  if (value.includes("\\") || value.includes("\0")) {
    throw new Error("Backup archive contains an unsafe path.");
  }
  if (
    value.startsWith("/") ||
    /^[A-Za-z]:/.test(value) ||
    value.split("/").some((part) => part === "..")
  ) {
    throw new Error("Backup archive contains a path traversal entry.");
  }
  const normalized = path.posix.normalize(value);
  if (
    normalized === "." ||
    normalized.startsWith("../") ||
    normalized.includes("/../")
  ) {
    throw new Error("Backup archive contains a path traversal entry.");
  }
  return normalized;
}

function toDosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const dosDate =
    ((year - 1980) << 9) |
    ((date.getMonth() + 1) << 5) |
    date.getDate();
  const dosTime =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2);
  return { dosDate, dosTime };
}

function assertZip32Size(value, label) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 0xffffffff) {
    throw new Error(`${label} is too large for this backup format.`);
  }
}

function writeAll(fd, buffer) {
  fs.writeSync(fd, buffer, 0, buffer.length);
  return buffer.length;
}

function makeJsonEntry(archivePath, value) {
  return {
    archivePath,
    data: Buffer.from(JSON.stringify(value, null, 2), "utf8"),
  };
}

function writeZipArchive(archivePath, inputEntries, options = {}) {
  const seenPaths = new Set();
  const entries = inputEntries.map((entry) => {
    const archiveEntryPath = options.skipPathValidation
      ? String(entry.archivePath)
      : normalizeArchivePath(entry.archivePath);
    if (seenPaths.has(archiveEntryPath)) {
      throw new Error("Backup archive contains duplicate paths.");
    }
    seenPaths.add(archiveEntryPath);
    if (!entry.filePath && !Buffer.isBuffer(entry.data)) {
      throw new Error("Backup archive entry has no data.");
    }
    return { ...entry, archivePath: archiveEntryPath };
  });

  if (entries.length > MAX_ZIP_ENTRIES) {
    throw new Error("Backup archive contains too many files.");
  }

  fs.mkdirSync(path.dirname(archivePath), { recursive: true });
  const fd = fs.openSync(archivePath, "w");
  const centralEntries = [];
  let offset = 0;

  try {
    for (const entry of entries) {
      const nameBuffer = Buffer.from(entry.archivePath, "utf8");
      const sourceStats = entry.filePath ? fileStats(entry.filePath) : null;
      const dataBuffer = entry.filePath ? null : entry.data;
      const hashes = entry.filePath
        ? hashAndCrcFile(entry.filePath)
        : {
            crc32: finalizeCrc32(crc32Buffer(dataBuffer)),
            sha256: sha256Buffer(dataBuffer),
            size: dataBuffer.length,
          };
      assertZip32Size(hashes.size, "Backup file");
      assertZip32Size(offset, "Backup archive");
      const { dosDate, dosTime } = toDosDateTime(sourceStats?.mtime ?? new Date());
      const localHeader = Buffer.alloc(30 + nameBuffer.length);
      localHeader.writeUInt32LE(0x04034b50, 0);
      localHeader.writeUInt16LE(20, 4);
      localHeader.writeUInt16LE(0x0800, 6);
      localHeader.writeUInt16LE(0, 8);
      localHeader.writeUInt16LE(dosTime, 10);
      localHeader.writeUInt16LE(dosDate, 12);
      localHeader.writeUInt32LE(hashes.crc32, 14);
      localHeader.writeUInt32LE(hashes.size, 18);
      localHeader.writeUInt32LE(hashes.size, 22);
      localHeader.writeUInt16LE(nameBuffer.length, 26);
      localHeader.writeUInt16LE(0, 28);
      nameBuffer.copy(localHeader, 30);

      const localHeaderOffset = offset;
      offset += writeAll(fd, localHeader);
      if (entry.filePath) {
        const handle = fs.openSync(entry.filePath, "r");
        const buffer = Buffer.allocUnsafe(1024 * 1024);
        try {
          let bytesRead = 0;
          do {
            bytesRead = fs.readSync(handle, buffer, 0, buffer.length, null);
            if (bytesRead > 0) {
              offset += writeAll(fd, buffer.subarray(0, bytesRead));
            }
          } while (bytesRead > 0);
        } finally {
          fs.closeSync(handle);
        }
      } else {
        offset += writeAll(fd, dataBuffer);
      }
      centralEntries.push({
        archivePath: entry.archivePath,
        nameBuffer,
        crc32: hashes.crc32,
        size: hashes.size,
        localHeaderOffset,
        dosDate,
        dosTime,
        externalAttributes: Number(entry.externalAttributes ?? 0) >>> 0,
      });
    }

    const centralDirectoryOffset = offset;
    for (const entry of centralEntries) {
      const centralHeader = Buffer.alloc(46 + entry.nameBuffer.length);
      centralHeader.writeUInt32LE(0x02014b50, 0);
      centralHeader.writeUInt16LE(20, 4);
      centralHeader.writeUInt16LE(20, 6);
      centralHeader.writeUInt16LE(0x0800, 8);
      centralHeader.writeUInt16LE(0, 10);
      centralHeader.writeUInt16LE(entry.dosTime, 12);
      centralHeader.writeUInt16LE(entry.dosDate, 14);
      centralHeader.writeUInt32LE(entry.crc32, 16);
      centralHeader.writeUInt32LE(entry.size, 20);
      centralHeader.writeUInt32LE(entry.size, 24);
      centralHeader.writeUInt16LE(entry.nameBuffer.length, 28);
      centralHeader.writeUInt16LE(0, 30);
      centralHeader.writeUInt16LE(0, 32);
      centralHeader.writeUInt16LE(0, 34);
      centralHeader.writeUInt16LE(0, 36);
      centralHeader.writeUInt32LE(entry.externalAttributes, 38);
      centralHeader.writeUInt32LE(entry.localHeaderOffset, 42);
      entry.nameBuffer.copy(centralHeader, 46);
      offset += writeAll(fd, centralHeader);
    }

    const centralDirectorySize = offset - centralDirectoryOffset;
    assertZip32Size(centralDirectoryOffset, "Backup archive");
    assertZip32Size(centralDirectorySize, "Backup archive");
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(0, 4);
    end.writeUInt16LE(0, 6);
    end.writeUInt16LE(centralEntries.length, 8);
    end.writeUInt16LE(centralEntries.length, 10);
    end.writeUInt32LE(centralDirectorySize, 12);
    end.writeUInt32LE(centralDirectoryOffset, 16);
    end.writeUInt16LE(0, 20);
    writeAll(fd, end);
  } finally {
    fs.closeSync(fd);
  }
}

function locateEndOfCentralDirectory(buffer) {
  const minimumOffset = Math.max(0, buffer.length - 65557);
  for (let offset = buffer.length - 22; offset >= minimumOffset; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      return offset;
    }
  }
  throw new Error("Backup ZIP archive is invalid.");
}

function isSymlinkEntry(externalAttributes) {
  const mode = (externalAttributes >>> 16) & 0xffff;
  return (mode & 0o170000) === 0o120000;
}

function readZipArchiveEntries(zipPath) {
  if (!zipPath || !fs.existsSync(zipPath)) {
    throw new Error("The selected backup archive does not exist.");
  }
  const stats = fs.statSync(zipPath);
  if (!stats.isFile()) {
    throw new Error("The selected backup archive is not a file.");
  }
  if (stats.size > MAX_ZIP_SIZE_BYTES) {
    throw new Error("The selected backup archive exceeds the supported size limit.");
  }

  const buffer = fs.readFileSync(zipPath);
  const eocdOffset = locateEndOfCentralDirectory(buffer);
  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  const centralDirectorySize = buffer.readUInt32LE(eocdOffset + 12);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  if (
    entryCount === 0xffff ||
    centralDirectorySize === 0xffffffff ||
    centralDirectoryOffset === 0xffffffff
  ) {
    throw new Error("ZIP64 backups are not supported by this desktop version.");
  }
  if (entryCount > MAX_ZIP_ENTRIES) {
    throw new Error("Backup archive contains too many files.");
  }
  if (centralDirectoryOffset + centralDirectorySize > buffer.length) {
    throw new Error("Backup ZIP archive is invalid.");
  }

  const entries = new Map();
  let offset = centralDirectoryOffset;
  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error("Backup ZIP central directory is invalid.");
    }
    const flags = buffer.readUInt16LE(offset + 8);
    const method = buffer.readUInt16LE(offset + 10);
    const crc32 = buffer.readUInt32LE(offset + 16);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const externalAttributes = buffer.readUInt32LE(offset + 38);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer
      .subarray(offset + 46, offset + 46 + nameLength)
      .toString("utf8");
    offset += 46 + nameLength + extraLength + commentLength;

    const archivePath = normalizeArchivePath(name);
    if (archivePath.endsWith("/")) continue;
    if (entries.has(archivePath)) {
      throw new Error("Backup archive contains duplicate paths.");
    }
    if (isSymlinkEntry(externalAttributes)) {
      throw new Error("Backup archive contains an unsupported symlink.");
    }
    if (flags & 0x0001) {
      throw new Error("Encrypted ZIP backups are not supported.");
    }
    if (![0, 8].includes(method)) {
      throw new Error("Backup archive uses an unsupported compression method.");
    }
    if (uncompressedSize > MAX_ZIP_FILE_BYTES) {
      throw new Error("Backup archive contains a file over the supported size limit.");
    }
    if (
      localHeaderOffset + 30 > buffer.length ||
      buffer.readUInt32LE(localHeaderOffset) !== 0x04034b50
    ) {
      throw new Error("Backup ZIP local file header is invalid.");
    }
    const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength;
    if (dataOffset + compressedSize > buffer.length) {
      throw new Error("Backup ZIP file data is invalid.");
    }
    entries.set(archivePath, {
      archivePath,
      method,
      crc32,
      compressedSize,
      uncompressedSize,
      dataOffset,
      dataEnd: dataOffset + compressedSize,
      buffer,
    });
  }

  return entries;
}

function extractZipEntryData(entry) {
  const compressed = entry.buffer.subarray(entry.dataOffset, entry.dataEnd);
  const data =
    entry.method === 0 ? Buffer.from(compressed) : zlib.inflateRawSync(compressed);
  if (data.length !== entry.uncompressedSize) {
    throw new Error("Backup archive file size validation failed.");
  }
  const actualCrc = finalizeCrc32(crc32Buffer(data));
  if (actualCrc !== entry.crc32) {
    throw new Error("Backup archive CRC validation failed.");
  }
  return data;
}

function getZipEntryText(entries, archivePath) {
  const entry = entries.get(archivePath);
  if (!entry) return null;
  return extractZipEntryData(entry).toString("utf8");
}

function getBackupManifestPath(databaseBackupPath) {
  return `${databaseBackupPath}.manifest.json`;
}

function readBackupManifest(databaseBackupPath) {
  const manifestPath = getBackupManifestPath(databaseBackupPath);
  if (!fs.existsSync(manifestPath)) return null;
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    return manifest && typeof manifest === "object" ? manifest : null;
  } catch {
    throw new Error("Backup manifest could not be read.");
  }
}

function writeBackupManifest({
  backupPath,
  appVersion,
  schoolName,
  schemaVersion,
}) {
  const manifest = {
    format: LEGACY_DATABASE_FORMAT,
    formatVersion: 1,
    appVersion,
    schemaVersion,
    schoolName: schoolName || "",
    databaseFile: path.basename(backupPath),
    databaseSha256: sha256File(backupPath),
    createdAt: new Date().toISOString(),
  };
  fs.writeFileSync(
    getBackupManifestPath(backupPath),
    JSON.stringify(manifest, null, 2),
    "utf8",
  );
  return manifest;
}

function validateBackupManifest(databaseBackupPath) {
  const manifest = readBackupManifest(databaseBackupPath);
  if (!manifest) return null;
  if (manifest.format !== LEGACY_DATABASE_FORMAT) {
    throw new Error("Backup manifest format is not supported.");
  }
  if (
    typeof manifest.databaseSha256 !== "string" ||
    manifest.databaseSha256 !== sha256File(databaseBackupPath)
  ) {
    throw new Error("Backup checksum validation failed.");
  }
  return manifest;
}

function getRestorePaths(databasePath) {
  const databaseDirectory = path.dirname(databasePath);
  const pendingDirectory = path.join(databaseDirectory, PENDING_RESTORE_DIRECTORY);
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
    pendingDirectory,
    pendingDirectoryTemp: `${pendingDirectory}.tmp`,
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

function getAvailableSafetyBackupArchivePath(databaseDirectory, date = new Date()) {
  const stem = `Vidhya-ERP-Auto-Backup-Before-Restore-${timestampForFilename(date)}`;
  let candidate = path.join(databaseDirectory, `${stem}.zip`);
  let suffix = 1;
  while (fs.existsSync(candidate)) {
    candidate = path.join(databaseDirectory, `${stem}-${suffix}.zip`);
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
  validateBackupManifest(filePath);
}

function readDatabaseMetadata(databaseFilePath) {
  let candidate;
  try {
    candidate = new Database(databaseFilePath, {
      readonly: true,
      fileMustExist: true,
    });
    const settings = candidate
      .prepare("SELECT * FROM school_settings WHERE id = ?")
      .get("school-profile");
    return {
      schemaVersion: Number(candidate.pragma("user_version", { simple: true }) ?? 0),
      schoolIdentity: {
        schoolName: settings?.school_name ?? "",
        address: settings?.address ?? "",
        phone: settings?.phone ?? "",
        email: settings?.email ?? "",
        academicYear: settings?.academic_year ?? "",
      },
    };
  } catch {
    return {
      schemaVersion: 0,
      schoolIdentity: {
        schoolName: "",
        address: "",
        phone: "",
        email: "",
        academicYear: "",
      },
    };
  } finally {
    candidate?.close();
  }
}

function asSchoolIdentity(settings = {}) {
  return {
    schoolName: settings.schoolName ?? settings.school_name ?? "",
    address: settings.address ?? "",
    phone: settings.phone ?? "",
    email: settings.email ?? "",
    academicYear: settings.academicYear ?? settings.academic_year ?? "",
  };
}

function walkManagedFiles(category, rootDirectory) {
  const files = [];
  function walk(currentDirectory) {
    const entries = fs.readdirSync(currentDirectory, { withFileTypes: true });
    entries.forEach((entry) => {
      const filePath = path.join(currentDirectory, entry.name);
      const relativePath = path.relative(rootDirectory, filePath);
      if (!relativePath || relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
        throw new Error("Managed asset path could not be resolved safely.");
      }
      if (entry.isSymbolicLink()) {
        throw new Error("Managed asset folders cannot contain symlinks in backups.");
      }
      if (entry.isDirectory()) {
        walk(filePath);
      } else if (entry.isFile()) {
        const stats = fileStats(filePath);
        files.push({
          category,
          filePath,
          size: stats.size,
          archivePath: `backup/files/${category.directory}/${relativePath.split(path.sep).join("/")}`,
        });
      }
    });
  }
  walk(rootDirectory);
  return files;
}

function discoverManagedAssetFiles(userDataPath) {
  const files = [];
  const includedCategories = [];
  MANAGED_FILE_CATEGORIES.forEach((category) => {
    const categoryDirectory = path.join(userDataPath, category.directory);
    if (!fs.existsSync(categoryDirectory)) return;
    const stats = fs.lstatSync(categoryDirectory);
    if (stats.isSymbolicLink()) {
      throw new Error("Managed asset folders cannot be symlinks in backups.");
    }
    if (!stats.isDirectory()) return;
    const categoryFiles = walkManagedFiles(category, categoryDirectory);
    const totalBytes = categoryFiles.reduce((total, file) => total + file.size, 0);
    includedCategories.push({
      id: category.id,
      directory: category.directory,
      archivePath: `backup/files/${category.directory}`,
      fileCount: categoryFiles.length,
      totalBytes,
    });
    files.push(...categoryFiles);
  });
  return { files, includedCategories };
}

function createFullBackupArchive({
  archivePath,
  databaseBackupPath,
  databasePath,
  userDataPath,
  appVersion = "",
  schemaVersion,
  schoolSettings,
  createdAt = new Date().toISOString(),
}) {
  const resolvedArchivePath = path.resolve(archivePath);
  if (path.extname(resolvedArchivePath).toLowerCase() !== ".zip") {
    throw new Error("Full ERP backups must be saved as a .zip archive.");
  }
  validateDatabaseFile(databaseBackupPath);

  const databaseStats = fs.statSync(databaseBackupPath);
  const databaseSha256 = sha256File(databaseBackupPath);
  const metadata =
    schoolSettings || schemaVersion === undefined
      ? readDatabaseMetadata(databaseBackupPath)
      : null;
  const identity = asSchoolIdentity(schoolSettings ?? metadata?.schoolIdentity ?? {});
  const safeSchemaVersion =
    schemaVersion === undefined ? metadata?.schemaVersion ?? 0 : schemaVersion;
  const { files: assetFiles, includedCategories } =
    discoverManagedAssetFiles(userDataPath ?? path.dirname(databasePath));
  const assetChecksums = {};
  assetFiles.forEach((file) => {
    assetChecksums[file.archivePath] = sha256File(file.filePath);
  });

  const manifest = {
    format: FULL_BACKUP_FORMAT,
    formatVersion: FULL_BACKUP_FORMAT_VERSION,
    applicationVersion: appVersion,
    databaseSchemaVersion: safeSchemaVersion,
    schoolIdentity: identity,
    backupId: crypto.randomUUID(),
    createdAt,
    platform: process.platform,
    includedFileCategories: includedCategories,
    database: {
      filename: "school-erp.db",
      archivePath: DATABASE_ARCHIVE_PATH,
      size: databaseStats.size,
      sha256: databaseSha256,
    },
    totalFileCount: assetFiles.length,
    totalAssetSize: assetFiles.reduce((total, file) => total + file.size, 0),
    checksumAlgorithm: CHECKSUM_ALGORITHM,
    notes: [
      "Device-bound licensing is not bypassed by restore.",
      "Communication gateway tokens encrypted with local safeStorage may require reconfiguration on another computer.",
    ],
  };
  const manifestBuffer = Buffer.from(JSON.stringify(manifest, null, 2), "utf8");
  const checksums = {
    algorithm: CHECKSUM_ALGORITHM,
    entries: {
      [DATABASE_ARCHIVE_PATH]: databaseSha256,
      [MANIFEST_ARCHIVE_PATH]: sha256Buffer(manifestBuffer),
      ...assetChecksums,
    },
  };

  const tempArchivePath = `${resolvedArchivePath}.tmp`;
  fs.rmSync(tempArchivePath, { force: true });
  writeZipArchive(tempArchivePath, [
    { archivePath: DATABASE_ARCHIVE_PATH, filePath: databaseBackupPath },
    { archivePath: MANIFEST_ARCHIVE_PATH, data: manifestBuffer },
    makeJsonEntry(CHECKSUMS_ARCHIVE_PATH, checksums),
    ...assetFiles.map((file) => ({
      archivePath: file.archivePath,
      filePath: file.filePath,
    })),
  ]);
  validateFullBackupArchive(tempArchivePath, {
    currentSchoolName: identity.schoolName,
  });
  fs.rmSync(resolvedArchivePath, { force: true });
  fs.renameSync(tempArchivePath, resolvedArchivePath);
  return {
    path: resolvedArchivePath,
    manifest,
    checksums,
    checksum: sha256File(resolvedArchivePath),
  };
}

function parseJsonValue(text, description) {
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object") {
      throw new Error(`${description} is invalid.`);
    }
    return parsed;
  } catch (error) {
    if (error instanceof Error && error.message.endsWith("is invalid.")) {
      throw error;
    }
    throw new Error(`${description} could not be read.`);
  }
}

function validateFullManifest(manifest) {
  if (manifest.format !== FULL_BACKUP_FORMAT) {
    throw new Error("Backup archive format is not supported.");
  }
  if (Number(manifest.formatVersion) > FULL_BACKUP_FORMAT_VERSION) {
    throw new Error("Backup archive was created by a newer unsupported version.");
  }
  if (Number(manifest.formatVersion) !== FULL_BACKUP_FORMAT_VERSION) {
    throw new Error("Backup archive format version is not supported.");
  }
  if (manifest.database?.archivePath !== DATABASE_ARCHIVE_PATH) {
    throw new Error("Backup archive manifest is missing the database entry.");
  }
  if (
    !Array.isArray(manifest.includedFileCategories) ||
    manifest.includedFileCategories.some(
      (category) =>
        typeof category.directory !== "string" ||
        !MANAGED_FILE_CATEGORIES.some((known) => known.directory === category.directory),
    )
  ) {
    throw new Error("Backup archive manifest contains unsupported file categories.");
  }
}

function normalizeChecksums(checksums) {
  if (checksums.algorithm !== CHECKSUM_ALGORITHM) {
    throw new Error("Backup archive checksum algorithm is not supported.");
  }
  if (!checksums.entries || typeof checksums.entries !== "object") {
    throw new Error("Backup archive checksum list is invalid.");
  }
  return checksums.entries;
}

function validateChecksumPath(archivePath) {
  const normalized = normalizeArchivePath(archivePath);
  if (!normalized.startsWith("backup/")) {
    throw new Error("Backup archive contains an unsupported checksum path.");
  }
  return normalized;
}

function validateFullBackupArchive(zipPath, options = {}) {
  const entries = readZipArchiveEntries(zipPath);
  const manifestText = getZipEntryText(entries, MANIFEST_ARCHIVE_PATH);
  const checksumsText = getZipEntryText(entries, CHECKSUMS_ARCHIVE_PATH);
  if (!manifestText) throw new Error("Backup archive is missing manifest.json.");
  if (!checksumsText) throw new Error("Backup archive is missing checksums.json.");
  const manifest = parseJsonValue(manifestText, "Backup manifest");
  validateFullManifest(manifest);
  const checksums = parseJsonValue(checksumsText, "Backup checksums");
  const checksumEntries = normalizeChecksums(checksums);

  if (!checksumEntries[DATABASE_ARCHIVE_PATH]) {
    throw new Error("Backup archive is missing the database checksum.");
  }
  const checkedPaths = new Set();
  Object.entries(checksumEntries).forEach(([archivePath, expectedHash]) => {
    const normalizedPath = validateChecksumPath(archivePath);
    if (checkedPaths.has(normalizedPath)) {
      throw new Error("Backup archive contains duplicate checksum paths.");
    }
    checkedPaths.add(normalizedPath);
    const entry = entries.get(normalizedPath);
    if (!entry) {
      throw new Error("Backup archive is missing a checksummed file.");
    }
    const actualHash = sha256Buffer(extractZipEntryData(entry));
    if (typeof expectedHash !== "string" || actualHash !== expectedHash) {
      throw new Error("Backup archive checksum validation failed.");
    }
  });

  entries.forEach((_entry, archivePath) => {
    if (archivePath === CHECKSUMS_ARCHIVE_PATH) return;
    if (!checkedPaths.has(archivePath)) {
      throw new Error("Backup archive contains an unexpected file.");
    }
  });

  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "vidhya-backup-db-"));
  const tempDatabasePath = path.join(tempDirectory, "school-erp.db");
  try {
    fs.writeFileSync(
      tempDatabasePath,
      extractZipEntryData(entries.get(DATABASE_ARCHIVE_PATH)),
    );
    validateDatabaseFile(tempDatabasePath);
  } finally {
    fs.rmSync(tempDirectory, { recursive: true, force: true });
  }

  const warningMessages = [];
  const currentSchoolName = String(options.currentSchoolName ?? "").trim();
  const backupSchoolName = String(manifest.schoolIdentity?.schoolName ?? "").trim();
  if (
    currentSchoolName &&
    backupSchoolName &&
    currentSchoolName.toLowerCase() !== backupSchoolName.toLowerCase()
  ) {
    warningMessages.push(
      `Backup school "${backupSchoolName}" differs from current school "${currentSchoolName}".`,
    );
  }

  return {
    type: "full-archive",
    manifest,
    checksums,
    warningMessages,
  };
}

function inspectBackupArchive(filePath, options = {}) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === ".zip") {
    return validateFullBackupArchive(filePath, options);
  }
  if (extension === ".db") {
    validateDatabaseFile(filePath);
    const legacyManifest = validateBackupManifest(filePath);
    return {
      type: "legacy-database",
      manifest: legacyManifest,
      checksums: null,
      warningMessages: [],
    };
  }
  throw new Error("Select a valid .zip ERP backup archive or legacy .db backup.");
}

function safeExtractPath(rootDirectory, archivePath) {
  const normalized = normalizeArchivePath(archivePath);
  const targetPath = path.resolve(rootDirectory, normalized);
  const rootPath = path.resolve(rootDirectory);
  if (targetPath !== rootPath && !targetPath.startsWith(`${rootPath}${path.sep}`)) {
    throw new Error("Backup archive attempted to write outside the restore folder.");
  }
  return targetPath;
}

function rejectSymlinksInDirectory(rootDirectory) {
  if (!fs.existsSync(rootDirectory)) return;
  const entries = fs.readdirSync(rootDirectory, { withFileTypes: true });
  entries.forEach((entry) => {
    const entryPath = path.join(rootDirectory, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error("Backup restore folders cannot contain symlinks.");
    }
    if (entry.isDirectory()) rejectSymlinksInDirectory(entryPath);
  });
}

function validateExtractedFullBackupDirectory(rootDirectory, options = {}) {
  rejectSymlinksInDirectory(rootDirectory);
  const manifestPath = path.join(rootDirectory, MANIFEST_ARCHIVE_PATH);
  const checksumsPath = path.join(rootDirectory, CHECKSUMS_ARCHIVE_PATH);
  if (!fs.existsSync(manifestPath)) throw new Error("Backup archive is missing manifest.json.");
  if (!fs.existsSync(checksumsPath)) throw new Error("Backup archive is missing checksums.json.");

  const manifest = parseJsonValue(
    fs.readFileSync(manifestPath, "utf8"),
    "Backup manifest",
  );
  validateFullManifest(manifest);
  const checksums = parseJsonValue(
    fs.readFileSync(checksumsPath, "utf8"),
    "Backup checksums",
  );
  const checksumEntries = normalizeChecksums(checksums);
  Object.entries(checksumEntries).forEach(([archivePath, expectedHash]) => {
    const targetPath = safeExtractPath(rootDirectory, archivePath);
    if (!fs.existsSync(targetPath) || !fs.statSync(targetPath).isFile()) {
      throw new Error("Backup archive is missing a checksummed file.");
    }
    if (typeof expectedHash !== "string" || sha256File(targetPath) !== expectedHash) {
      throw new Error("Backup archive checksum validation failed.");
    }
  });
  const databaseFilePath = safeExtractPath(rootDirectory, DATABASE_ARCHIVE_PATH);
  validateDatabaseFile(databaseFilePath);

  const warningMessages = [];
  const currentSchoolName = String(options.currentSchoolName ?? "").trim();
  const backupSchoolName = String(manifest.schoolIdentity?.schoolName ?? "").trim();
  if (
    currentSchoolName &&
    backupSchoolName &&
    currentSchoolName.toLowerCase() !== backupSchoolName.toLowerCase()
  ) {
    warningMessages.push(
      `Backup school "${backupSchoolName}" differs from current school "${currentSchoolName}".`,
    );
  }
  return { manifest, checksums, warningMessages };
}

function extractFullBackupArchive(zipPath, destinationDirectory) {
  const inspection = validateFullBackupArchive(zipPath);
  fs.rmSync(destinationDirectory, { recursive: true, force: true });
  fs.mkdirSync(destinationDirectory, { recursive: true });
  const entries = readZipArchiveEntries(zipPath);
  entries.forEach((entry, archivePath) => {
    const targetPath = safeExtractPath(destinationDirectory, archivePath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, extractZipEntryData(entry));
  });
  validateExtractedFullBackupDirectory(destinationDirectory);
  return inspection;
}

function copyDirectoryRecursive(sourceDirectory, destinationDirectory) {
  const stats = fs.lstatSync(sourceDirectory);
  if (stats.isSymbolicLink()) {
    throw new Error("Restore cannot copy symlinked asset folders.");
  }
  if (!stats.isDirectory()) {
    throw new Error("Restore asset source must be a directory.");
  }
  fs.mkdirSync(destinationDirectory, { recursive: true });
  fs.readdirSync(sourceDirectory, { withFileTypes: true }).forEach((entry) => {
    const sourcePath = path.join(sourceDirectory, entry.name);
    const destinationPath = path.join(destinationDirectory, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error("Restore cannot copy symlinked asset files.");
    }
    if (entry.isDirectory()) {
      copyDirectoryRecursive(sourcePath, destinationPath);
    } else if (entry.isFile()) {
      fileStats(sourcePath);
      fs.copyFileSync(sourcePath, destinationPath);
    }
  });
}

function replaceManagedAssetDirectories(extractedRoot, databaseDirectory, manifest) {
  const categories = manifest.includedFileCategories ?? [];
  if (categories.length === 0) return;

  const stagingRoot = fs.mkdtempSync(path.join(databaseDirectory, ".restore-assets-new-"));
  const rollbackRoot = fs.mkdtempSync(path.join(databaseDirectory, ".restore-assets-old-"));
  const movedTargets = [];
  try {
    categories.forEach((category) => {
      const known = MANAGED_FILE_CATEGORIES.find(
        (item) => item.directory === category.directory,
      );
      if (!known) {
        throw new Error("Backup archive contains unsupported asset category.");
      }
      const source = path.join(extractedRoot, "backup", "files", known.directory);
      const staged = path.join(stagingRoot, known.directory);
      if (fs.existsSync(source)) {
        copyDirectoryRecursive(source, staged);
      } else {
        fs.mkdirSync(staged, { recursive: true });
      }
    });

    categories.forEach((category) => {
      const known = MANAGED_FILE_CATEGORIES.find(
        (item) => item.directory === category.directory,
      );
      const target = path.join(databaseDirectory, known.directory);
      const rollback = path.join(rollbackRoot, known.directory);
      if (fs.existsSync(target)) {
        fs.renameSync(target, rollback);
        movedTargets.push({ target, rollback });
      }
      const staged = path.join(stagingRoot, known.directory);
      if (fs.existsSync(staged)) {
        fs.renameSync(staged, target);
      }
    });

    fs.rmSync(rollbackRoot, { recursive: true, force: true });
    fs.rmSync(stagingRoot, { recursive: true, force: true });
  } catch (error) {
    movedTargets.reverse().forEach(({ target, rollback }) => {
      fs.rmSync(target, { recursive: true, force: true });
      if (fs.existsSync(rollback)) {
        fs.renameSync(rollback, target);
      }
    });
    fs.rmSync(rollbackRoot, { recursive: true, force: true });
    fs.rmSync(stagingRoot, { recursive: true, force: true });
    throw error;
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

function createStartupFullSafetyBackup(databasePath, safetyBackupPath) {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "vidhya-startup-safety-"));
  const tempDatabasePath = path.join(tempDirectory, "school-erp.db");
  let currentDatabase;
  try {
    currentDatabase = new Database(databasePath, {
      fileMustExist: true,
    });
    const integrity = currentDatabase.pragma("integrity_check", {
      simple: true,
    });
    if (integrity !== "ok") {
      throw new Error(
        "The current database failed validation before restore.",
      );
    }
    currentDatabase.pragma("wal_checkpoint(TRUNCATE)");
    currentDatabase.close();
    currentDatabase = null;
    fs.copyFileSync(databasePath, tempDatabasePath);
    validateDatabaseFile(tempDatabasePath);
    const metadata = readDatabaseMetadata(tempDatabasePath);
    return createFullBackupArchive({
      archivePath: safetyBackupPath,
      databaseBackupPath: tempDatabasePath,
      databasePath,
      userDataPath: path.dirname(databasePath),
      appVersion: "",
      schemaVersion: metadata.schemaVersion,
      schoolSettings: metadata.schoolIdentity,
    });
  } finally {
    currentDatabase?.close();
    fs.rmSync(tempDirectory, { recursive: true, force: true });
  }
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

function applyPendingFullRestore(databasePath, restorePaths) {
  const {
    databaseDirectory,
    pendingDirectory,
    metadataPath,
    restoreTempPath,
    previousDatabasePath,
  } = restorePaths;
  const metadata = readRestoreMetadata(metadataPath);
  const validation = validateExtractedFullBackupDirectory(pendingDirectory);
  let safetyBackupPath = null;
  if (
    typeof metadata?.safetyBackupPath === "string" &&
    fs.existsSync(metadata.safetyBackupPath)
  ) {
    try {
      inspectBackupArchive(metadata.safetyBackupPath);
      safetyBackupPath = metadata.safetyBackupPath;
    } catch {
      safetyBackupPath = null;
    }
  }
  if (fs.existsSync(databasePath) && !safetyBackupPath) {
    safetyBackupPath = getAvailableSafetyBackupArchivePath(databaseDirectory);
    createStartupFullSafetyBackup(databasePath, safetyBackupPath);
  }

  const pendingDatabasePath = path.join(pendingDirectory, DATABASE_ARCHIVE_PATH);
  fs.copyFileSync(pendingDatabasePath, restoreTempPath);
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
    replaceManagedAssetDirectories(
      pendingDirectory,
      databaseDirectory,
      validation.manifest,
    );
    fs.rmSync(previousDatabasePath, { force: true });
    fs.rmSync(pendingDirectory, { recursive: true, force: true });
    fs.rmSync(metadataPath, { force: true });
    return { restored: true, safetyBackupPath, type: "full-archive" };
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

function applyPendingDatabaseRestore(databasePath) {
  const restorePaths = getRestorePaths(databasePath);
  const {
    databaseDirectory,
    pendingPath,
    metadataPath,
    pendingTempPath,
    metadataTempPath,
    pendingDirectory,
    pendingDirectoryTemp,
    restoreTempPath,
    previousDatabasePath,
  } = restorePaths;

  fs.rmSync(pendingTempPath, { force: true });
  fs.rmSync(metadataTempPath, { force: true });
  fs.rmSync(pendingDirectoryTemp, { recursive: true, force: true });
  fs.rmSync(restoreTempPath, { force: true });

  if (fs.existsSync(previousDatabasePath)) {
    if (fs.existsSync(databasePath)) {
      fs.rmSync(previousDatabasePath, { force: true });
    } else {
      fs.renameSync(previousDatabasePath, databasePath);
    }
  }

  if (fs.existsSync(pendingDirectory)) {
    fs.rmSync(pendingPath, { force: true });
    try {
      return applyPendingFullRestore(databasePath, restorePaths);
    } catch (error) {
      fs.rmSync(pendingDirectory, { recursive: true, force: true });
      fs.rmSync(metadataPath, { force: true });
      throw error;
    }
  }

  if (!fs.existsSync(pendingPath)) {
    fs.rmSync(metadataPath, { force: true });
    return { restored: false, safetyBackupPath: null };
  }

  try {
    validateDatabaseFile(pendingPath);
  } catch (error) {
    fs.rmSync(pendingPath, { force: true });
    fs.rmSync(metadataPath, { force: true });
    throw error;
  }
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
    return { restored: true, safetyBackupPath, type: "legacy-database" };
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

  async function showMessageBox(event, options) {
    const parent = parentWindow(event);
    return parent
      ? dialog.showMessageBox(parent, options)
      : dialog.showMessageBox(options);
  }

  function activeSchoolSettings() {
    const activeDatabase = getDatabase();
    return typeof activeDatabase.getSchoolSettings === "function"
      ? activeDatabase.getSchoolSettings()
      : {};
  }

  async function backupActiveDatabaseTo(tempDatabasePath) {
    await getDatabase().backupTo(tempDatabasePath);
    validateDatabaseFile(tempDatabasePath);
  }

  async function createFullSafetyBackup(safetyBackupPath) {
    const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "vidhya-safety-backup-"));
    const tempDatabasePath = path.join(tempDirectory, "school-erp.db");
    try {
      await backupActiveDatabaseTo(tempDatabasePath);
      const activeDatabase = getDatabase();
      return createFullBackupArchive({
        archivePath: safetyBackupPath,
        databaseBackupPath: tempDatabasePath,
        databasePath,
        userDataPath: databaseDirectory,
        appVersion: app.getVersion?.() ?? "",
        schemaVersion:
          typeof activeDatabase.getDatabaseUserVersion === "function"
            ? activeDatabase.getDatabaseUserVersion()
            : readDatabaseMetadata(tempDatabasePath).schemaVersion,
        schoolSettings: activeSchoolSettings(),
      });
    } finally {
      fs.rmSync(tempDirectory, { recursive: true, force: true });
    }
  }

  return {
    async createDatabaseBackup(event) {
      const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "vidhya-backup-"));
      const tempDatabasePath = path.join(tempDirectory, "school-erp.db");
      try {
        const filename = `Vidhya-ERP-Backup-${timestampForFilename()}.zip`;
        const result = await showSaveDialog(event, {
          title: "Create Vidhya ERP Full Backup",
          defaultPath: path.join(app.getPath("documents"), filename),
          buttonLabel: "Save Backup",
          filters: [
            { name: "Vidhya ERP Backup Archive", extensions: ["zip"] },
          ],
        });
        if (result.canceled || !result.filePath) {
          return {
            success: false,
            canceled: true,
            message: "Backup was cancelled.",
          };
        }

        const targetPath =
          path.extname(result.filePath).toLowerCase() === ".zip"
            ? result.filePath
            : `${result.filePath}.zip`;
        if (path.resolve(targetPath) === path.resolve(databasePath)) {
          throw new Error(
            "Choose a backup location different from the active database.",
          );
        }
        await backupActiveDatabaseTo(tempDatabasePath);
        const activeDatabase = getDatabase();
        const archive = createFullBackupArchive({
          archivePath: targetPath,
          databaseBackupPath: tempDatabasePath,
          databasePath,
          userDataPath: databaseDirectory,
          appVersion: app.getVersion?.() ?? "",
          schemaVersion:
            typeof activeDatabase.getDatabaseUserVersion === "function"
              ? activeDatabase.getDatabaseUserVersion()
              : readDatabaseMetadata(tempDatabasePath).schemaVersion,
          schoolSettings: activeSchoolSettings(),
        });
        return {
          success: true,
          message:
            "Full ERP backup archive created and validated successfully.",
          path: archive.path,
          checksum: archive.checksum,
          manifest: archive.manifest,
        };
      } catch (error) {
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Backup could not be created.",
        };
      } finally {
        fs.rmSync(tempDirectory, { recursive: true, force: true });
      }
    },

    async restoreDatabaseBackup(event) {
      let pendingCreated = false;
      try {
        const result = await showOpenDialog(event, {
          title: "Restore Vidhya ERP Backup",
          buttonLabel: "Select Backup",
          properties: ["openFile"],
          filters: [
            { name: "Vidhya ERP Backup Archive", extensions: ["zip"] },
            { name: "Legacy SQLite Database Backup", extensions: ["db"] },
          ],
        });
        if (result.canceled || result.filePaths.length === 0) {
          return {
            success: false,
            canceled: true,
            message: "Restore was cancelled.",
          };
        }

        const selectedPath = result.filePaths[0];
        if (path.resolve(selectedPath) === path.resolve(databasePath)) {
          throw new Error("The selected file is already the active database.");
        }
        const currentSchoolName = activeSchoolSettings()?.schoolName ?? "";
        const inspection = inspectBackupArchive(selectedPath, {
          currentSchoolName,
        });
        if (inspection.warningMessages.length > 0) {
          const confirmation = await showMessageBox(event, {
            type: "warning",
            buttons: ["Continue Restore", "Cancel"],
            defaultId: 1,
            cancelId: 1,
            title: "Backup School Differs",
            message: "The selected backup appears to be for a different school.",
            detail: inspection.warningMessages.join("\n"),
          });
          if (confirmation.response !== 0) {
            return {
              success: false,
              canceled: true,
              message: "Restore was cancelled.",
            };
          }
        }

        if (inspection.type === "full-archive") {
          const safetyBackupPath =
            getAvailableSafetyBackupArchivePath(databaseDirectory);
          const safetyArchive = await createFullSafetyBackup(safetyBackupPath);
          fs.rmSync(restorePaths.pendingDirectoryTemp, {
            recursive: true,
            force: true,
          });
          extractFullBackupArchive(
            selectedPath,
            restorePaths.pendingDirectoryTemp,
          );
          validateExtractedFullBackupDirectory(
            restorePaths.pendingDirectoryTemp,
            { currentSchoolName },
          );
          fs.rmSync(restorePaths.pendingDirectory, {
            recursive: true,
            force: true,
          });
          fs.renameSync(
            restorePaths.pendingDirectoryTemp,
            restorePaths.pendingDirectory,
          );
          fs.writeFileSync(
            restorePaths.metadataTempPath,
            JSON.stringify(
              {
                type: "full-archive",
                safetyBackupPath,
                safetyBackupChecksum: safetyArchive.checksum,
                stagedAt: new Date().toISOString(),
                sourceFilename: path.basename(selectedPath),
                sourceManifest: inspection.manifest,
                warningMessages: inspection.warningMessages,
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
          pendingCreated = true;
          return {
            success: true,
            requiresRestart: true,
            safetyBackupPath,
            message:
              "Restore is ready. Restart the app to load the restored ERP backup.",
            manifest: inspection.manifest,
            warningMessages: inspection.warningMessages,
          };
        }

        const safetyBackupPath =
          getAvailableSafetyBackupPath(databaseDirectory);
        await getDatabase().backupTo(safetyBackupPath);
        validateDatabaseFile(safetyBackupPath);
        const activeDatabase = getDatabase();
        const safetyManifest = writeBackupManifest({
          backupPath: safetyBackupPath,
          appVersion: app.getVersion?.() ?? "",
          schoolName: activeSchoolSettings()?.schoolName ?? "",
          schemaVersion:
            typeof activeDatabase.getDatabaseUserVersion === "function"
              ? activeDatabase.getDatabaseUserVersion()
              : 0,
        });

        fs.copyFileSync(selectedPath, restorePaths.pendingTempPath);
        validateDatabaseFile(restorePaths.pendingTempPath);
        const selectedManifest = validateBackupManifest(selectedPath);
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
              type: "legacy-database",
              safetyBackupPath,
              safetyManifestPath: getBackupManifestPath(safetyBackupPath),
              safetyBackupChecksum: safetyManifest.databaseSha256,
              stagedAt: new Date().toISOString(),
              sourceFilename: path.basename(selectedPath),
              sourceManifest: selectedManifest,
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
        fs.rmSync(restorePaths.pendingDirectoryTemp, {
          recursive: true,
          force: true,
        });
        if (pendingCreated) {
          fs.rmSync(restorePaths.pendingPath, { force: true });
          fs.rmSync(restorePaths.pendingDirectory, {
            recursive: true,
            force: true,
          });
          fs.rmSync(restorePaths.metadataPath, { force: true });
        }
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Restore could not be prepared.",
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
        restorePending:
          fs.existsSync(restorePaths.pendingPath) ||
          fs.existsSync(restorePaths.pendingDirectory),
        recommendation:
          "Create a full ERP backup regularly and before major data changes or software updates.",
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
        message: "Restarting Vidhya School ERP...",
      };
    },
  };
}

module.exports = {
  applyPendingDatabaseRestore,
  createBackupService,
  createFullBackupArchive,
  extractFullBackupArchive,
  getRestorePaths,
  inspectBackupArchive,
  timestampForFilename,
  validateDatabaseFile,
  validateFullBackupArchive,
  _test: {
    writeZipArchive,
  },
};
