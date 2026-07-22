const crypto = require("node:crypto");
const { safeStorage } = require("electron");

const DEFAULT_TIMEOUT_MS = 10000;
const SEND_TIMEOUT_MS = 20000;
const DEFAULT_GATEWAY_ERROR = "Communication gateway request failed.";
const MISSING_GATEWAY_CONFIGURATION_MESSAGE =
  "Gateway URL and device communication token are required.";

function optionalText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeCommunicationErrorMessage(value, fallback = DEFAULT_GATEWAY_ERROR) {
  let message = optionalText(value);
  if (!message || message === "[object Object]") {
    return fallback;
  }

  message = message
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, "Bearer [redacted]")
    .replace(/vse_comm_[A-Za-z0-9._~+/-]+/g, "vse_comm_[redacted]")
    .replace(/\+91[6-9]\d{9}\b/g, "+91******0000")
    .replace(/\b[6-9]\d{9}\b/g, "******0000");

  return message || fallback;
}

function extractSafeErrorMessage(value, fallback = DEFAULT_GATEWAY_ERROR) {
  if (typeof value === "string") {
    return sanitizeCommunicationErrorMessage(value, fallback);
  }

  if (value instanceof Error && value.message) {
    return sanitizeCommunicationErrorMessage(value.message, fallback);
  }

  if (value && typeof value === "object") {
    if (typeof value.message === "string") {
      return sanitizeCommunicationErrorMessage(value.message, fallback);
    }
    if (typeof value.error === "string") {
      return sanitizeCommunicationErrorMessage(value.error, fallback);
    }
    if (value.error && typeof value.error === "object") {
      return extractSafeErrorMessage(value.error, fallback);
    }
    if (typeof value.reason === "string") {
      return sanitizeCommunicationErrorMessage(value.reason, fallback);
    }
  }

  return fallback;
}

function gatewayHttpError(status, body) {
  let message;
  let code = `HTTP_${status}`;

  if (status === 401) {
    message = "Device communication token is invalid or expired.";
    code = "COMMUNICATION_TOKEN_INVALID";
  } else if (status === 403) {
    message = "Communication is not permitted for this device or license.";
    code = "COMMUNICATION_FORBIDDEN";
  } else if (status === 404) {
    message = "Communication gateway endpoint was not found.";
    code = "COMMUNICATION_ENDPOINT_NOT_FOUND";
  } else if (status >= 500) {
    message = extractSafeErrorMessage(
      body,
      "Communication gateway returned an internal server error.",
    );
    code = "COMMUNICATION_GATEWAY_SERVER_ERROR";
  } else {
    message = extractSafeErrorMessage(
      body,
      `Communication gateway returned HTTP ${status}.`,
    );
  }

  const error = new Error(sanitizeCommunicationErrorMessage(message));
  error.code = code;
  error.httpStatus = status;
  return error;
}

async function parseJsonResponse(response) {
  const text = await response.text().catch(() => "");
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function maskPhone(value) {
  const phone = optionalText(value);
  if (!phone) return "";
  const prefix = phone.startsWith("+") ? phone.slice(0, 3) : phone.slice(0, 2);
  return `${prefix}${"*".repeat(Math.max(4, phone.length - prefix.length - 4))}${phone.slice(-4)}`;
}

function normalizeIndianPhone(value) {
  let digits = optionalText(value).replace(/[^\d+]/g, "");
  if (!digits) throw new Error("Recipient phone is required.");
  if (digits.startsWith("+")) {
    digits = `+${digits.slice(1).replace(/\D/g, "")}`;
  } else {
    digits = digits.replace(/\D/g, "");
  }
  if (digits.startsWith("+91")) {
    digits = digits.slice(3);
  } else if (digits.startsWith("91") && digits.length === 12) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0") && digits.length === 11) {
    digits = digits.slice(1);
  }
  if (!/^[6-9]\d{9}$/.test(digits)) {
    throw new Error("Recipient phone must be a valid Indian mobile number.");
  }
  const e164 = `+91${digits}`;
  return { e164, masked: maskPhone(e164) };
}

function tokenPrefix(token) {
  const value = optionalText(token);
  return value
    ? `sha256:${crypto.createHash("sha256").update(value).digest("hex").slice(0, 12)}`
    : "";
}

function localFallbackKey(deviceId) {
  return crypto.createHash("sha256").update(`vidhya-communication:${deviceId}`).digest();
}

function encryptToken(rawToken, deviceId) {
  const token = optionalText(rawToken);
  if (!token) return { encryptedDeviceToken: "", tokenStorage: "", tokenPrefix: "" };

  if (safeStorage?.isEncryptionAvailable?.()) {
    return {
      encryptedDeviceToken: safeStorage.encryptString(token).toString("base64"),
      tokenStorage: "safeStorage",
      tokenPrefix: tokenPrefix(token),
    };
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", localFallbackKey(deviceId), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    encryptedDeviceToken: `v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${encrypted.toString("base64url")}`,
    tokenStorage: "local-fallback",
    tokenPrefix: tokenPrefix(token),
  };
}

function decryptToken(settings, deviceId) {
  if (!settings?.encryptedDeviceToken) {
    throw new Error("Communication device token is not configured.");
  }

  if (settings.tokenStorage === "safeStorage") {
    return safeStorage.decryptString(Buffer.from(settings.encryptedDeviceToken, "base64"));
  }

  const [version, ivText, tagText, encryptedText] = settings.encryptedDeviceToken.split(":");
  if (version !== "v1") {
    throw new Error("Communication token storage is invalid.");
  }
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    localFallbackKey(deviceId),
    Buffer.from(ivText, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedText, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

function normalizeGatewayUrl(value, isDevelopment) {
  const raw = optionalText(value).replace(/\/+$/g, "");
  if (!raw) throw new Error("Gateway URL is required.");
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("Gateway URL is invalid.");
  }
  const localhost = ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
  if (parsed.protocol !== "https:" && !(isDevelopment && parsed.protocol === "http:" && localhost)) {
    throw new Error("Communication gateway must use HTTPS. Localhost HTTP is allowed only during development.");
  }
  return parsed.toString().replace(/\/+$/g, "");
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...(options.headers ?? {}),
      },
    });
    const body = await parseJsonResponse(response);
    if (!response.ok) {
      throw gatewayHttpError(response.status, body);
    }
    return body;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Communication gateway request timed out.");
    }
    if (error instanceof TypeError) {
      throw new Error("Communication gateway could not be reached.");
    }
    if (error?.code === "ECONNREFUSED" || error?.code === "ENOTFOUND") {
      throw new Error("Communication gateway could not be reached.");
    }
    if (error instanceof Error && error.message) {
      const nextError = new Error(extractSafeErrorMessage(error, DEFAULT_GATEWAY_ERROR));
      if (error.code) nextError.code = error.code;
      if (error.httpStatus) nextError.httpStatus = error.httpStatus;
      throw nextError;
    }
    throw new Error(extractSafeErrorMessage(error, DEFAULT_GATEWAY_ERROR));
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeProviderMode(value) {
  const mode = optionalText(value).toLowerCase();
  if (mode === "mock") return "Mock";
  if (mode === "live") return "Live";
  return "Unknown";
}

function createCommunicationService({
  database,
  licenseService,
  isDevelopment = false,
}) {
  function getSafeSettings() {
    const settings = database.getCommunicationGatewaySettings();
    const { encryptedDeviceToken: _encryptedDeviceToken, ...safeSettings } = settings;
    void _encryptedDeviceToken;
    return safeSettings;
  }

  function getGatewayAuth() {
    const settings = database.getCommunicationGatewaySettings();
    if (!settings.gatewayUrl || !settings.hasToken) {
      throw new Error(MISSING_GATEWAY_CONFIGURATION_MESSAGE);
    }
    const gatewayUrl = normalizeGatewayUrl(settings.gatewayUrl, isDevelopment);
    let token;
    try {
      token = decryptToken(settings, licenseService.getDeviceId());
    } catch {
      try {
        database.removeCommunicationGatewayToken();
      } catch {
        // Keep the original user-facing error if local cleanup fails.
      }
      throw new Error(
        "Stored communication token cannot be used on this device. Reconfigure Communication Integrations.",
      );
    }
    return { settings, gatewayUrl, token };
  }

  function headers(token) {
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  async function gatewayGet(path, query = {}) {
    const { gatewayUrl, token } = getGatewayAuth();
    const url = new URL(`${gatewayUrl}${path}`);
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
    return fetchJson(url.toString(), {
      method: "GET",
      headers: headers(token),
    });
  }

  async function gatewayPost(path, body, timeoutMs = SEND_TIMEOUT_MS) {
    const { gatewayUrl, token } = getGatewayAuth();
    return fetchJson(`${gatewayUrl}${path}`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify(body ?? {}),
      timeoutMs,
    });
  }

  function assertSenderAllowed(user) {
    if (!user || user.role === "Student" || user.role === "Viewer") {
      throw new Error("This account cannot send external WhatsApp or SMS messages.");
    }
  }

  function requestedBy(user) {
    return {
      userId: user.id,
      name: user.name,
      role: user.role,
    };
  }

  function guardianRowsForStudent(studentId) {
    return database.getParentsInfoReport({ studentId }).rows;
  }

  function resolveRecipient(input = {}) {
    const type = optionalText(input.type || input.recipientType || input.entityType);
    const entityId = optionalText(input.entityId || input.id);
    const studentId = optionalText(input.studentId);
    const guardianId = optionalText(input.guardianId);

    if (type === "Student") {
      const student = database.getStudentById(entityId);
      if (!student) throw new Error("Student recipient not found.");
      const phone = normalizeIndianPhone(student.mobile);
      return {
        type: "Student",
        entityId: student.id,
        name: student.name,
        phone: phone.e164,
        phoneMasked: phone.masked,
        className: student.className,
        section: student.section,
      };
    }

    if (type === "Employee") {
      const employee = database.getEmployeeById(entityId);
      if (!employee) throw new Error("Employee recipient not found.");
      const phone = normalizeIndianPhone(employee.mobile);
      return {
        type: "Employee",
        entityId: employee.id,
        name: employee.name,
        phone: phone.e164,
        phoneMasked: phone.masked,
        department: employee.department,
        designation: employee.designation,
      };
    }

    if (type === "Guardian") {
      const guardian =
        database.getGuardians({}).find((row) => row.id === guardianId || row.id === entityId) ??
        null;
      if (guardian) {
        const phone = normalizeIndianPhone(guardian.mobile || guardian.alternateMobile);
        return {
          type: "Guardian",
          entityId: guardian.id,
          name: guardian.fullName,
          phone: phone.e164,
          phoneMasked: phone.masked,
          relation: guardian.relation,
        };
      }

      const rows = guardianRowsForStudent(studentId || entityId);
      const row =
        rows.find((item) => item.guardianId === guardianId) ??
        rows.find((item) => item.mobile) ??
        null;
      if (!row) throw new Error("Guardian recipient not found.");
      const phone = normalizeIndianPhone(row.mobile || row.alternateMobile);
      return {
        type: "Guardian",
        entityId: row.guardianId || row.studentId,
        name: row.primaryGuardian,
        phone: phone.e164,
        phoneMasked: phone.masked,
        relation: row.relation,
        studentId: row.studentId,
        studentName: row.studentName,
      };
    }

    throw new Error("Recipient type must be Student, Guardian or Employee.");
  }

  function getStudentGuardianCandidates(student) {
    return guardianRowsForStudent(student.id)
      .map((row) => {
        try {
          const phone = normalizeIndianPhone(row.mobile || row.alternateMobile);
          return {
            type: "Guardian",
            entityId: row.guardianId || row.studentId,
            studentId: row.studentId,
            name: row.primaryGuardian,
            label: `${row.primaryGuardian} · ${row.studentName}`,
            relation: row.relation,
            phoneMasked: phone.masked,
            className: row.className,
            section: row.section,
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  }

  function previewExternalRecipients(input = {}) {
    const audienceType = optionalText(input.audienceType || "Selected");
    const className = optionalText(input.className);
    const section = optionalText(input.section);
    const selectedStudentIds = new Set(Array.isArray(input.studentIds) ? input.studentIds.map(String) : []);
    const selectedEmployeeIds = new Set(Array.isArray(input.employeeIds) ? input.employeeIds.map(String) : []);
    const includeStudents =
      audienceType.includes("student") ||
      audienceType.includes("Class") ||
      audienceType.includes("Section") ||
      selectedStudentIds.size > 0;
    const includeEmployees =
      audienceType.includes("employee") ||
      audienceType.includes("Staff") ||
      selectedEmployeeIds.size > 0;
    const candidates = [];
    const missing = [];
    const seen = new Set();
    let duplicateCount = 0;

    if (includeStudents) {
      const students = database.getStudents().filter((student) => {
        if (selectedStudentIds.size && !selectedStudentIds.has(student.id)) return false;
        if (className && student.className !== className) return false;
        if (section && student.section !== section) return false;
        return student.status === "Active";
      });
      for (const student of students) {
        const guardianCandidates = getStudentGuardianCandidates(student);
        if (!guardianCandidates.length) {
          missing.push({ entityId: student.id, name: student.name, reason: "No valid guardian mobile" });
          continue;
        }
        for (const candidate of guardianCandidates.slice(0, input.includeAllGuardians ? undefined : 1)) {
          const key = `${candidate.type}:${candidate.phoneMasked}`;
          if (seen.has(key)) {
            duplicateCount += 1;
            continue;
          }
          seen.add(key);
          candidates.push(candidate);
        }
      }
    }

    if (includeEmployees) {
      const employees = database.getEmployees().filter((employee) => {
        if (selectedEmployeeIds.size && !selectedEmployeeIds.has(employee.id)) return false;
        return employee.status === "Active";
      });
      for (const employee of employees) {
        try {
          const phone = normalizeIndianPhone(employee.mobile);
          const key = `Employee:${phone.masked}`;
          if (seen.has(key)) {
            duplicateCount += 1;
            continue;
          }
          seen.add(key);
          candidates.push({
            type: "Employee",
            entityId: employee.id,
            name: employee.name,
            label: `${employee.name} · ${employee.department || "Staff"}`,
            department: employee.department,
            designation: employee.designation,
            phoneMasked: phone.masked,
          });
        } catch {
          missing.push({ entityId: employee.id, name: employee.name, reason: "No valid mobile" });
        }
      }
    }

    return {
      totalRecords: candidates.length + missing.length,
      validCount: candidates.length,
      missingCount: missing.length,
      duplicateCount,
      optedOutCount: 0,
      candidates,
      missing,
    };
  }

  return {
    configureCommunicationGateway(input = {}) {
      const gatewayUrl = normalizeGatewayUrl(input.gatewayUrl, isDevelopment);
      const encrypted = optionalText(input.deviceToken)
        ? encryptToken(input.deviceToken, licenseService.getDeviceId())
        : {};
      database.saveCommunicationGatewaySettings({
        gatewayUrl,
        ...encrypted,
        connectionStatus: "Configured",
        lastError: "",
      });
      return getSafeSettings();
    },

    getCommunicationGatewayConfiguration() {
      return getSafeSettings();
    },

    removeCommunicationGatewayToken() {
      database.removeCommunicationGatewayToken();
      return getSafeSettings();
    },

    async getCommunicationIntegrationStatus() {
      const settings = database.getCommunicationGatewaySettings();
      if (!settings.gatewayUrl || !settings.hasToken) {
        database.updateCommunicationGatewayStatus({
          connectionStatus: "Not configured",
          providerMode: "Unknown",
          whatsappStatus: "Unknown",
          smsStatus: "Unknown",
          lastSuccessAt: settings.lastSuccessAt,
          lastError: MISSING_GATEWAY_CONFIGURATION_MESSAGE,
        });
        return getSafeSettings();
      }
      try {
        const status = await gatewayGet("/api/communications/integration-status");
        const integrations = Array.isArray(status.integrations) ? status.integrations : [];
        const whatsapp = integrations.find((item) => item.channel === "WhatsApp");
        const sms = integrations.find((item) => item.channel === "SMS");
        database.updateCommunicationGatewayStatus({
          connectionStatus: "Connected",
          providerMode: normalizeProviderMode(status.mode ?? status.providerMode),
          whatsappStatus: whatsapp?.status || "Disabled",
          smsStatus: sms?.status || "Disabled",
          lastSuccessAt: new Date().toISOString(),
          lastError: "",
        });
        return getSafeSettings();
      } catch (error) {
        database.updateCommunicationGatewayStatus({
          connectionStatus: "Error",
          providerMode: settings.providerMode,
          whatsappStatus: settings.whatsappStatus,
          smsStatus: settings.smsStatus,
          lastSuccessAt: settings.lastSuccessAt,
          lastError: extractSafeErrorMessage(error, "Gateway status check failed."),
        });
        return getSafeSettings();
      }
    },

    async testCommunicationGateway() {
      return this.getCommunicationIntegrationStatus();
    },

    async getCommunicationTemplates(channel) {
      return gatewayGet("/api/communications/templates", { channel });
    },

    async sendExternalMessage(currentUser, input = {}) {
      assertSenderAllowed(currentUser);
      const recipient = resolveRecipient(input.recipient ?? input);
      return gatewayPost("/api/communications/send", {
        channel: input.channel,
        templateId: input.templateId,
        recipient,
        variables: input.variables ?? {},
        mediaUrl: optionalText(input.mediaUrl) || undefined,
        idempotencyKey:
          optionalText(input.idempotencyKey) ||
          crypto
            .createHash("sha256")
            .update(`${input.channel}:${input.templateId}:${recipient.type}:${recipient.entityId}:${JSON.stringify(input.variables ?? {})}`)
            .digest("hex"),
        requestedBy: requestedBy(currentUser),
      });
    },

    async sendExternalBatch(currentUser, input = {}) {
      assertSenderAllowed(currentUser);
      const recipients = (Array.isArray(input.recipients) ? input.recipients : [])
        .map((recipient) => {
          const resolved = resolveRecipient(recipient);
          return {
            ...resolved,
            variables: recipient.variables ?? {},
          };
        });
      return gatewayPost("/api/communications/send-batch", {
        channel: input.channel,
        templateId: input.templateId,
        title: input.title,
        audienceType: input.audienceType,
        recipients,
        variables: input.variables ?? {},
        idempotencyKey:
          optionalText(input.idempotencyKey) ||
          crypto
            .createHash("sha256")
            .update(`${input.channel}:${input.templateId}:${Date.now()}:${recipients.length}`)
            .digest("hex"),
        requestedBy: requestedBy(currentUser),
      });
    },

    getExternalRecipientPreview(currentUser, input = {}) {
      if (currentUser?.role === "Student") {
        throw new Error("Student accounts cannot send external communications.");
      }
      return previewExternalRecipients(input);
    },

    getCommunicationJobs(filter = {}) {
      return gatewayGet("/api/communications/jobs", filter);
    },

    getCommunicationJob(id) {
      return gatewayGet(`/api/communications/jobs/${encodeURIComponent(id)}`);
    },

    retryCommunicationJob(currentUser, id) {
      if (!["Owner", "Admin"].includes(currentUser?.role)) {
        throw new Error("Only Owner/Admin can retry external communication jobs.");
      }
      return gatewayPost(`/api/communications/jobs/${encodeURIComponent(id)}/retry`, {
        requestedByRole: currentUser.role,
      });
    },

    normalizeIndianPhone,
    maskPhone,
    extractSafeErrorMessage,
  };
}

module.exports = {
  createCommunicationService,
  normalizeIndianPhone,
  maskPhone,
  extractSafeErrorMessage,
};
