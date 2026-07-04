const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const LICENSE_PREFIX = "VSE1";
const projectRoot = path.join(__dirname, "..");

function parseArguments(argumentsList) {
  const values = {};
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (!argument.startsWith("--")) continue;
    const [rawName, inlineValue] = argument.slice(2).split("=", 2);
    const nextValue = argumentsList[index + 1];
    if (inlineValue !== undefined) {
      values[rawName] = inlineValue;
    } else if (nextValue && !nextValue.startsWith("--")) {
      values[rawName] = nextValue;
      index += 1;
    } else {
      values[rawName] = "true";
    }
  }
  return values;
}

function requiredText(value, fieldName) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) throw new Error(`${fieldName} is required.`);
  return text;
}

function normalizeDate(value, fieldName, endOfDay = false) {
  const text = requiredText(value, fieldName);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? new Date(`${text}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`)
    : new Date(text);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} must be a valid ISO date.`);
  }
  return date.toISOString();
}

function createLicenseKey(payload, privateKey) {
  const payloadPart = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.sign(
    null,
    Buffer.from(payloadPart, "utf8"),
    privateKey,
  );
  return `${LICENSE_PREFIX}.${payloadPart}.${signature.toString("base64url")}`;
}

function buildPayload(options) {
  const deviceId = requiredText(options.deviceId, "deviceId").toUpperCase();
  if (!/^VSE-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/.test(deviceId)) {
    throw new Error("deviceId must use the VSE-XXXX-XXXX-XXXX format.");
  }
  const maxUsers = Number(options.maxUsers);
  if (!Number.isInteger(maxUsers) || maxUsers < 1) {
    throw new Error("maxUsers must be a positive whole number.");
  }
  const features = requiredText(options.features || "all", "features")
    .split(",")
    .map((feature) => feature.trim())
    .filter(Boolean);

  return {
    licenseId:
      options.licenseId?.trim() ||
      `LIC-${crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`,
    schoolName: requiredText(options.schoolName, "schoolName"),
    deviceId,
    plan: requiredText(options.plan, "plan"),
    issuedAt: options.issuedAt
      ? normalizeDate(options.issuedAt, "issuedAt")
      : new Date().toISOString(),
    expiresAt: normalizeDate(options.expiresAt, "expiresAt", true),
    maintenanceUntil: normalizeDate(
      options.maintenanceUntil,
      "maintenanceUntil",
      true,
    ),
    maxUsers,
    features,
    ...(options.customerPhone
      ? { customerPhone: options.customerPhone.trim() }
      : {}),
    ...(options.customerEmail
      ? { customerEmail: options.customerEmail.trim() }
      : {}),
  };
}

function printUsage() {
  console.log(`
Generate an offline Vidhya School ERP license:

node scripts/generate-license.cjs \\
  --schoolName "Vidhya Public School" \\
  --deviceId "VSE-ABCD-1234-EF56" \\
  --plan "Annual" \\
  --expiresAt "2027-07-03" \\
  --maintenanceUntil "2027-07-03" \\
  --maxUsers 10

Optional:
  --features "Students,Fees,Attendance,Reports,Exams"
  --licenseId "LIC-CUSTOM-001"
  --issuedAt "2026-07-03T00:00:00.000Z"
  --customerPhone "+91..."
  --customerEmail "school@example.com"
  --privateKey "/secure/path/license-private-key.pem"
`);
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help === "true") {
    printUsage();
    return;
  }
  const privateKeyPath = path.resolve(
    options.privateKey ||
      path.join(projectRoot, "license-private-key.pem"),
  );
  if (!fs.existsSync(privateKeyPath)) {
    throw new Error(
      `Private key not found at ${privateKeyPath}. Run npm run license:keys first.`,
    );
  }
  const payload = buildPayload(options);
  const privateKey = fs.readFileSync(privateKeyPath, "utf8");
  console.log(createLicenseKey(payload, privateKey));
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    printUsage();
    process.exitCode = 1;
  }
}

module.exports = {
  buildPayload,
  createLicenseKey,
  normalizeDate,
  parseArguments,
};
