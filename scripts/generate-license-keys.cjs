const fs = require("node:fs");
const path = require("node:path");
const { generateKeyPairSync } = require("node:crypto");

const projectRoot = path.join(__dirname, "..");
const privateKeyPath = path.join(projectRoot, "license-private-key.pem");
const publicKeyPath = path.join(
  projectRoot,
  "electron",
  "license-public-key.pem",
);
const force = process.argv.includes("--force");

if (
  !force &&
  (fs.existsSync(privateKeyPath) || fs.existsSync(publicKeyPath))
) {
  throw new Error(
    "License key files already exist. Use --force only when intentionally rotating keys.",
  );
}

const { privateKey, publicKey } = generateKeyPairSync("ed25519", {
  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem",
  },
  publicKeyEncoding: {
    type: "spki",
    format: "pem",
  },
});

fs.mkdirSync(path.dirname(publicKeyPath), { recursive: true });
fs.writeFileSync(privateKeyPath, privateKey, { mode: 0o600 });
fs.writeFileSync(publicKeyPath, publicKey);

console.log(`Private key created at ${privateKeyPath}`);
console.log(`Public key created at ${publicKeyPath}`);
console.log(
  "Keep the private key offline and backed up. Never commit or package it.",
);
