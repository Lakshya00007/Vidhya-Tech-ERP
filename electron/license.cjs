const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");

const LICENSE_PREFIX = "VSE1";
const EXPIRING_SOON_DAYS = 30;
const INSTALLATION_ID_FILENAME = "installation-id";
const DEFAULT_REMOTE_GRACE_DAYS = 7;
const DEFAULT_REMOTE_CHECK_INTERVAL_HOURS = 24;
const DEFAULT_REMOTE_RETRY_MINUTES = 60;
const REMOTE_CHECK_TIMEOUT_MS = 5000;
const REMOTE_STATUSES = new Set([
  "Active",
  "Suspended",
  "Expired",
  "Revoked",
  "Unknown",
]);
const REMOTE_BLOCKING_STATUSES = new Set([
  "Suspended",
  "Expired",
  "Revoked",
]);

function optionalText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function positiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function addMilliseconds(date, milliseconds) {
  return new Date(date.getTime() + milliseconds).toISOString();
}

function normalizeRemoteStatus(value) {
  const status = optionalText(value);
  return REMOTE_STATUSES.has(status) ? status : "Unknown";
}

function normalizeLicenseServerUrl(value) {
  const url = optionalText(value);
  return url.replace(/\/+$/g, "");
}

function remoteStatusMessage(remoteStatus) {
  if (remoteStatus === "Suspended") {
    return "Your Vidhya School ERP license has been suspended. Please contact Vidhya Tech.";
  }
  if (remoteStatus === "Revoked") {
    return "This license has been revoked. Contact Vidhya Tech.";
  }
  if (remoteStatus === "Expired") {
    return "Your Vidhya School ERP license has expired. Please renew your license to continue.";
  }
  return "Online license verification is required before Vidhya School ERP can continue.";
}

function licenseUpdateErrorMessage(error) {
  const message = error instanceof Error ? error.message : "";
  if (/signature/i.test(message)) {
    return "Invalid license signature";
  }
  if (/different device/i.test(message)) {
    return "Wrong device";
  }
  if (/expired/i.test(message)) {
    return "Expired license";
  }
  if (
    /format|content|missing|invalid|future|maxUsers|features/i.test(message)
  ) {
    return "Malformed license";
  }
  return message || "Malformed license";
}

function remoteUpdateErrorMessage(remoteStatus) {
  if (remoteStatus?.remoteStatus === "Suspended") {
    return "Remote license suspended";
  }
  if (remoteStatus?.remoteStatus === "Revoked") {
    return "Remote license revoked";
  }
  if (remoteStatus?.remoteStatus === "Expired") {
    return "Expired license";
  }
  if (remoteStatus?.remoteStatus !== "Active") {
    return "License server unavailable";
  }
  return "";
}

function createRemoteStatusView(record, license, currentDate = new Date()) {
  const remoteStatus = normalizeRemoteStatus(record?.remoteStatus);
  const graceUntil = record?.graceUntil ?? null;
  const graceExpired = Boolean(
    remoteStatus === "Unknown" &&
      graceUntil &&
      new Date(graceUntil).getTime() <= currentDate.getTime(),
  );
  const blocksUsage =
    REMOTE_BLOCKING_STATUSES.has(remoteStatus) || graceExpired;
  let displayStatus = "Check Required";
  let message = record?.serverMessage || "";

  if (remoteStatus === "Active") {
    displayStatus = "Online Verified";
    message = message || "License verified online.";
  } else if (remoteStatus === "Unknown" && graceUntil && !graceExpired) {
    displayStatus = "Offline Grace";
    message =
      message ||
      `License server could not be reached. Please connect to internet before ${new Date(
        graceUntil,
      ).toLocaleDateString("en-IN")}.`;
  } else if (REMOTE_BLOCKING_STATUSES.has(remoteStatus)) {
    displayStatus = remoteStatus;
    message = message || remoteStatusMessage(remoteStatus);
  } else if (graceExpired) {
    message =
      message ||
      "The offline grace period has expired. Connect to internet and check the license status to continue.";
  } else {
    message = message || "Online license status has not been checked yet.";
  }

  return {
    licenseId: record?.licenseId || license?.licenseId || "",
    deviceId: record?.deviceId || license?.deviceId || "",
    remoteStatus,
    displayStatus,
    blocksUsage,
    canUseGrace:
      remoteStatus === "Unknown" && Boolean(graceUntil) && !graceExpired,
    checkRequired: displayStatus === "Check Required",
    lastOnlineCheckAt: record?.lastOnlineCheckAt ?? null,
    nextRequiredCheckAt: record?.nextRequiredCheckAt ?? null,
    graceUntil,
    lastError: record?.lastError ?? "",
    serverMessage: record?.serverMessage ?? "",
    message,
  };
}

async function defaultRemoteLicenseCheck({
  licenseServerUrl,
  licenseId,
  deviceId,
  appVersion,
  os,
}) {
  const normalizedServerUrl = normalizeLicenseServerUrl(licenseServerUrl);
  if (!normalizedServerUrl) {
    throw new Error("License server URL is not configured.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REMOTE_CHECK_TIMEOUT_MS);

  try {
    const response = await fetch(`${normalizedServerUrl}/api/licenses/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseId, deviceId, appVersion, os }),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(
        optionalText(body?.message) ||
          optionalText(body?.error) ||
          `License server returned HTTP ${response.status}.`,
      );
    }
    return body;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("License server check timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
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
  licenseServerUrl = process.env.VIDHYA_LICENSE_SERVER_URL,
  remoteGraceDays = process.env.VIDHYA_LICENSE_GRACE_DAYS,
  remoteCheck = defaultRemoteLicenseCheck,
  appVersion = "",
  os = `${process.platform}`,
  remoteCheckIntervalHours = DEFAULT_REMOTE_CHECK_INTERVAL_HOURS,
  remoteRetryMinutes = DEFAULT_REMOTE_RETRY_MINUTES,
}) {
  const publicKey = fs.readFileSync(publicKeyPath, "utf8");
  const graceDays = positiveNumber(
    remoteGraceDays,
    DEFAULT_REMOTE_GRACE_DAYS,
  );
  const checkIntervalHours = positiveNumber(
    remoteCheckIntervalHours,
    DEFAULT_REMOTE_CHECK_INTERVAL_HOURS,
  );
  const retryMinutes = positiveNumber(
    remoteRetryMinutes,
    DEFAULT_REMOTE_RETRY_MINUTES,
  );

  function auditRemote(action, details = "") {
    if (typeof database.createAuditLog !== "function") return null;
    return database.createAuditLog(null, action, "License", details);
  }

  function getRemoteStatusForLicense(license) {
    const record = database.getRemoteLicenseStatusRecord?.();
    const matchingRecord =
      record &&
      license &&
      record.licenseId === license.licenseId &&
      record.deviceId === license.deviceId
        ? record
        : null;
    return createRemoteStatusView(
      matchingRecord,
      license,
      now(),
    );
  }

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
      remote: null,
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

  function saveActivatedLicense(validation, licenseKey) {
    const previousRemoteStatus = database.getRemoteLicenseStatusRecord?.();
    const record = database.saveLicenseActivation(
      validation.license,
      optionalText(licenseKey),
      validation.status,
    );
    if (
      previousRemoteStatus?.licenseId &&
      previousRemoteStatus.licenseId !== validation.license.licenseId
    ) {
      if (typeof database.clearRemoteLicenseStatusForLicense === "function") {
        database.clearRemoteLicenseStatusForLicense(
          previousRemoteStatus.licenseId,
        );
      } else {
        database.clearRemoteLicenseStatus?.();
      }
    }
    database.saveRemoteLicenseStatus?.({
      licenseId: validation.license.licenseId,
      deviceId: validation.license.deviceId,
      remoteStatus: "Unknown",
      lastOnlineCheckAt: "",
      nextRequiredCheckAt: new Date().toISOString(),
      graceUntil: "",
      lastError: "",
      serverMessage: "",
    });
    return record;
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
          remote: getRemoteStatusForLicense(validation.license),
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
      const record = saveActivatedLicense(validation, licenseKey);
      return {
        ...validation,
        activatedAt: record.activatedAt,
        lastCheckedAt: record.lastCheckedAt,
        remote: getRemoteStatusForLicense(validation.license),
      };
    },

    async updateLicenseKey(licenseKey) {
      try {
        this.activateLicense(licenseKey);
      } catch (error) {
        throw new Error(licenseUpdateErrorMessage(error));
      }

      const remoteStatus = await this.checkRemoteLicenseNow({
        allowGraceOnFailure: false,
      });
      const updateError = remoteUpdateErrorMessage(remoteStatus);
      if (updateError) {
        throw new Error(updateError);
      }
      return this.getLicenseStatus();
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

    getRemoteLicenseStatus() {
      const status = this.getLicenseStatus();
      if (!status.isValid || !status.license) {
        return createRemoteStatusView(null, null, now());
      }
      return getRemoteStatusForLicense(status.license);
    },

    async checkRemoteLicenseNow(options = {}) {
      const allowGraceOnFailure = options?.allowGraceOnFailure !== false;
      const localStatus = this.getLicenseStatus();
      if (!localStatus.isValid || !localStatus.license) {
        throw new Error(localStatus.message);
      }

      const license = localStatus.license;
      const checkedAt = now();
      const previousRecord = database.getRemoteLicenseStatusRecord?.();
      const previous =
        previousRecord &&
        previousRecord.licenseId === license.licenseId &&
        previousRecord.deviceId === license.deviceId
          ? previousRecord
          : null;
      auditRemote(
        "Remote license checked",
        `Checking ${license.licenseId} for device ${license.deviceId}.`,
      );

      try {
        const response = await remoteCheck({
          licenseServerUrl,
          licenseId: license.licenseId,
          deviceId: license.deviceId,
          appVersion,
          os,
        });
        let remoteStatus = normalizeRemoteStatus(response?.status);
        if (response?.valid === false && remoteStatus === "Active") {
          remoteStatus = "Unknown";
        }
        const serverMessage = optionalText(response?.message);
        const serverReportedInvalid =
          response?.valid === false && remoteStatus === "Unknown";
        const saved = database.saveRemoteLicenseStatus({
          licenseId: license.licenseId,
          deviceId: license.deviceId,
          remoteStatus,
          lastOnlineCheckAt: checkedAt.toISOString(),
          nextRequiredCheckAt: addMilliseconds(
            checkedAt,
            checkIntervalHours * 60 * 60 * 1000,
          ),
          graceUntil:
            remoteStatus === "Active"
              ? addMilliseconds(checkedAt, graceDays * 24 * 60 * 60 * 1000)
              : serverReportedInvalid
                ? checkedAt.toISOString()
                : previous?.graceUntil ?? "",
          lastError: serverReportedInvalid
            ? serverMessage || "License server did not return an active status."
            : "",
          serverMessage:
            serverMessage ||
            (remoteStatus === "Active"
              ? "License active"
              : remoteStatusMessage(remoteStatus)),
        });

        if (remoteStatus === "Active") {
          auditRemote(
            "Remote license active",
            `License ${license.licenseId} is active online.`,
          );
        } else if (remoteStatus === "Suspended") {
          auditRemote(
            "Remote license suspended",
            `License ${license.licenseId} was blocked by the license server.`,
          );
        } else if (remoteStatus === "Revoked") {
          auditRemote(
            "Remote license revoked",
            `License ${license.licenseId} was revoked by the license server.`,
          );
        } else if (remoteStatus === "Expired") {
          auditRemote(
            "Remote license expired",
            `License ${license.licenseId} was reported expired by the license server.`,
          );
        } else {
          auditRemote(
            "Remote license check failed",
            serverMessage ||
              `License server returned an unknown status for ${license.licenseId}.`,
          );
        }

        return createRemoteStatusView(saved, license, checkedAt);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "License server could not be reached.";
        const previousRemoteStatus = normalizeRemoteStatus(
          previous?.remoteStatus,
        );
        if (!allowGraceOnFailure) {
          const saved = database.saveRemoteLicenseStatus({
            licenseId: license.licenseId,
            deviceId: license.deviceId,
            remoteStatus: "Unknown",
            lastOnlineCheckAt: previous?.lastOnlineCheckAt ?? "",
            nextRequiredCheckAt: addMilliseconds(
              checkedAt,
              retryMinutes * 60 * 1000,
            ),
            graceUntil: checkedAt.toISOString(),
            lastError: message,
            serverMessage: "License server unavailable",
          });
          auditRemote(
            "Remote license check failed",
            `${license.licenseId}: ${message}`,
          );
          return createRemoteStatusView(saved, license, checkedAt);
        }
        if (REMOTE_BLOCKING_STATUSES.has(previousRemoteStatus)) {
          const saved = database.saveRemoteLicenseStatus({
            licenseId: license.licenseId,
            deviceId: license.deviceId,
            remoteStatus: previousRemoteStatus,
            lastOnlineCheckAt: previous?.lastOnlineCheckAt ?? "",
            nextRequiredCheckAt: addMilliseconds(
              checkedAt,
              retryMinutes * 60 * 1000,
            ),
            graceUntil: previous?.graceUntil ?? "",
            lastError: message,
            serverMessage:
              previous?.serverMessage ||
              remoteStatusMessage(previousRemoteStatus),
          });
          auditRemote(
            "Remote license check failed",
            `${license.licenseId}: ${message}`,
          );
          return createRemoteStatusView(saved, license, checkedAt);
        }
        const fallbackGraceUntil =
          previous?.graceUntil ||
          addMilliseconds(checkedAt, graceDays * 24 * 60 * 60 * 1000);
        const graceExpired =
          new Date(fallbackGraceUntil).getTime() <= checkedAt.getTime();
        const saved = database.saveRemoteLicenseStatus({
          licenseId: license.licenseId,
          deviceId: license.deviceId,
          remoteStatus: "Unknown",
          lastOnlineCheckAt: previous?.lastOnlineCheckAt ?? "",
          nextRequiredCheckAt: addMilliseconds(
            checkedAt,
            retryMinutes * 60 * 1000,
          ),
          graceUntil: fallbackGraceUntil,
          lastError: message,
          serverMessage: graceExpired
            ? "The offline grace period has expired. Connect to internet and check the license status to continue."
            : `License server could not be reached. Please connect to internet before ${new Date(
                fallbackGraceUntil,
              ).toLocaleDateString("en-IN")}.`,
        });

        auditRemote(
          "Remote license check failed",
          `${license.licenseId}: ${message}`,
        );
        if (!previous?.graceUntil && !graceExpired) {
          auditRemote(
            "Grace period started",
            `Offline grace is available until ${fallbackGraceUntil}.`,
          );
        }
        if (graceExpired) {
          auditRemote(
            "Grace period expired",
            `Offline grace expired at ${fallbackGraceUntil}.`,
          );
        }

        return createRemoteStatusView(saved, license, checkedAt);
      }
    },

    requireValidLicense() {
      const status = this.getLicenseStatus();
      if (!status.isValid) {
        throw new Error(status.message);
      }
      if (status.remote?.blocksUsage) {
        throw new Error(status.remote.message);
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
