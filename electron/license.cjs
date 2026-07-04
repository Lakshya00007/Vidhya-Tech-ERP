const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");

const LICENSE_PREFIX = "VSE1";
const EXPIRING_SOON_DAYS = 30;
const INSTALLATION_ID_FILENAME = "installation-id";

function optionalText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function readMacHardwareUuid(runCommand) {
  const output = runCommand(
    "/usr/sbin/ioreg",
    ["-rd1", "-c", "IOPlatformExpertDevice"],
    { encoding: "utf8", timeout: 5000 },
  );
  return output.match(/"IOPlatformUUID"\s*=\s*"([^"]+)"/)?.[1] ?? "";
}

function readWindowsMachineGuid(runCommand) {
  const output = runCommand(
    "reg.exe",
    [
      "query",
      "HKLM\\SOFTWARE\\Microsoft\\Cryptography",
      "/v",
      "MachineGuid",
    ],
    { encoding: "utf8", timeout: 5000, windowsHide: true },
  );
  return output.match(/MachineGuid\s+REG_SZ\s+([^\r\n]+)/i)?.[1]?.trim() ?? "";
}

function getOrCreateInstallationId(userDataPath) {
  fs.mkdirSync(userDataPath, { recursive: true });
  const installationIdPath = path.join(
    userDataPath,
    INSTALLATION_ID_FILENAME,
  );
  if (fs.existsSync(installationIdPath)) {
    const existing = fs.readFileSync(installationIdPath, "utf8").trim();
    if (existing) return existing;
  }
  const installationId = crypto.randomUUID();
  fs.writeFileSync(installationIdPath, installationId, { mode: 0o600 });
  return installationId;
}

function formatDeviceId(rawIdentifier) {
  const digest = crypto
    .createHash("sha256")
    .update(`com.vidhyatech.schoolerp:${rawIdentifier}`)
    .digest("hex")
    .slice(0, 12)
    .toUpperCase();
  return `VSE-${digest.slice(0, 4)}-${digest.slice(4, 8)}-${digest.slice(8, 12)}`;
}

function createDeviceIdService({
  userDataPath,
  platform = process.platform,
  runCommand = execFileSync,
}) {
  let cachedDeviceId = "";

  return {
    getDeviceId() {
      if (cachedDeviceId) return cachedDeviceId;
      let rawIdentifier = "";
      try {
        if (platform === "darwin") {
          rawIdentifier = readMacHardwareUuid(runCommand);
        } else if (platform === "win32") {
          rawIdentifier = readWindowsMachineGuid(runCommand);
        }
      } catch {
        rawIdentifier = "";
      }
      if (!rawIdentifier) {
        rawIdentifier = getOrCreateInstallationId(userDataPath);
      }
      cachedDeviceId = formatDeviceId(rawIdentifier);
      return cachedDeviceId;
    },
  };
}

function parseLicenseKey(licenseKey, publicKey) {
  const normalizedKey = optionalText(licenseKey);
  const [prefix, payloadPart, signaturePart, extraPart] =
    normalizedKey.split(".");
  if (
    prefix !== LICENSE_PREFIX ||
    !payloadPart ||
    !signaturePart ||
    extraPart !== undefined
  ) {
    throw new Error("License key format is invalid.");
  }

  let signature;
  let payload;
  try {
    signature = Buffer.from(signaturePart, "base64url");
    payload = JSON.parse(
      Buffer.from(payloadPart, "base64url").toString("utf8"),
    );
  } catch {
    throw new Error("License key content is invalid.");
  }
  const signatureValid = crypto.verify(
    null,
    Buffer.from(payloadPart, "utf8"),
    publicKey,
    signature,
  );
  if (!signatureValid) {
    throw new Error("License signature is invalid.");
  }
  return payload;
}

function requiredPayloadText(payload, fieldName) {
  const value = optionalText(payload?.[fieldName]);
  if (!value) throw new Error(`License ${fieldName} is missing.`);
  return value;
}

function parsePayloadDate(payload, fieldName) {
  const value = requiredPayloadText(payload, fieldName);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`License ${fieldName} is invalid.`);
  }
  return date;
}

function validatePayload(payload, deviceId, currentDate) {
  const licenseId = requiredPayloadText(payload, "licenseId");
  const schoolName = requiredPayloadText(payload, "schoolName");
  const licensedDeviceId = requiredPayloadText(
    payload,
    "deviceId",
  ).toUpperCase();
  const plan = requiredPayloadText(payload, "plan");
  const issuedAtDate = parsePayloadDate(payload, "issuedAt");
  const expiresAtDate = parsePayloadDate(payload, "expiresAt");
  const maintenanceUntilDate = parsePayloadDate(
    payload,
    "maintenanceUntil",
  );
  const maxUsers = Number(payload?.maxUsers);
  if (!Number.isInteger(maxUsers) || maxUsers < 1) {
    throw new Error("License maxUsers is invalid.");
  }
  if (!Array.isArray(payload?.features)) {
    throw new Error("License features are invalid.");
  }
  const features = payload.features
    .map(optionalText)
    .filter(Boolean);
  if (licensedDeviceId !== deviceId) {
    throw new Error("This license key belongs to a different device.");
  }
  if (issuedAtDate.getTime() > currentDate.getTime() + 5 * 60 * 1000) {
    throw new Error("License issue date is in the future.");
  }

  const millisecondsUntilExpiry =
    expiresAtDate.getTime() - currentDate.getTime();
  const daysUntilExpiry = Math.ceil(
    millisecondsUntilExpiry / (24 * 60 * 60 * 1000),
  );
  let status = "active";
  let isValid = true;
  let message = "License is active.";
  if (millisecondsUntilExpiry < 0) {
    status = "expired";
    isValid = false;
    message = "License has expired. Enter a renewed license key to continue.";
  } else if (maintenanceUntilDate.getTime() < currentDate.getTime()) {
    status = "maintenance-expired";
    message =
      "License is active, but the maintenance period has expired.";
  } else if (daysUntilExpiry <= EXPIRING_SOON_DAYS) {
    status = "expiring-soon";
    message = `License expires in ${Math.max(0, daysUntilExpiry)} day(s).`;
  }

  return {
    status,
    isValid,
    message,
    daysUntilExpiry,
    license: {
      licenseId,
      schoolName,
      deviceId: licensedDeviceId,
      plan,
      issuedAt: issuedAtDate.toISOString(),
      expiresAt: expiresAtDate.toISOString(),
      maintenanceUntil: maintenanceUntilDate.toISOString(),
      maxUsers,
      features,
      customerPhone: optionalText(payload.customerPhone),
      customerEmail: optionalText(payload.customerEmail),
    },
  };
}

function createLicenseService({
  database,
  deviceIdService,
  publicKeyPath,
  now = () => new Date(),
}) {
  const publicKey = fs.readFileSync(publicKeyPath, "utf8");

  function missingStatus(message = "License activation is required.") {
    return {
      status: "missing",
      isValid: false,
      message,
      daysUntilExpiry: null,
      deviceId: deviceIdService.getDeviceId(),
      license: null,
      activatedAt: null,
      lastCheckedAt: null,
    };
  }

  function verify(licenseKey) {
    const deviceId = deviceIdService.getDeviceId();
    const payload = parseLicenseKey(licenseKey, publicKey);
    return {
      ...validatePayload(payload, deviceId, now()),
      deviceId,
    };
  }

  return {
    getDeviceId() {
      return deviceIdService.getDeviceId();
    },

    getLicenseStatus() {
      const record = database.getLicenseActivationRecord();
      if (!record?.licenseKey || record.status === "deactivated") {
        return missingStatus();
      }
      try {
        const validation = verify(record.licenseKey);
        database.updateLicenseActivationCheck(validation.status);
        return {
          ...validation,
          activatedAt: record.activatedAt,
          lastCheckedAt: new Date().toISOString(),
        };
      } catch (error) {
        database.updateLicenseActivationCheck("invalid");
        return {
          ...missingStatus(
            error instanceof Error
              ? error.message
              : "Stored license is invalid.",
          ),
          status: "invalid",
        };
      }
    },

    activateLicense(licenseKey) {
      const validation = verify(licenseKey);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }
      const record = database.saveLicenseActivation(
        validation.license,
        optionalText(licenseKey),
        validation.status,
      );
      return {
        ...validation,
        activatedAt: record.activatedAt,
        lastCheckedAt: record.lastCheckedAt,
      };
    },

    deactivateLicense() {
      database.deactivateLicenseActivation();
      return {
        success: true,
        message: "License was deactivated on this device.",
      };
    },

    getLicenseInfo() {
      return this.getLicenseStatus();
    },

    requireValidLicense() {
      const status = this.getLicenseStatus();
      if (!status.isValid) {
        throw new Error(status.message);
      }
      return status;
    },

    verifyLicenseKey(licenseKey) {
      return verify(licenseKey);
    },
  };
}

module.exports = {
  createDeviceIdService,
  createLicenseService,
  formatDeviceId,
  getOrCreateInstallationId,
  parseLicenseKey,
  validatePayload,
};
