# Vidhya School ERP

Current release: **1.1.0**

Offline-first school administration software built with Electron, React,
TypeScript, Vite, and SQLite.

## Current modules

- Offline license activation
- Dashboard and school settings
- Classes, sections, and subjects
- Students and Excel/CSV import
- Student ID cards, admission letters, and certificates
- Fees, fee structures, collections, and receipts
- Attendance
- Exams, marks entry, and marksheets
- Employees and staff documents
- Salary and payroll
- Accounts
- Timetable
- Homework
- Class tests
- Question paper management
- Reports
- Backup and restore
- Users, roles, permissions, and audit logs

## Development

Install dependencies and start the Electron desktop app with the Vite
development server:

```bash
npm install
npm run desktop
```

Development Electron loads `http://localhost:5173`. Packaged applications load
the local `dist/index.html` file and do not require localhost or internet
access.

## Local database

SQLite data remains in Electron's platform-specific `userData` directory. On
macOS the current database is:

```text
~/Library/Application Support/School ERP Desktop/school-erp.db
```

The database is never packaged into the application and is not stored in the
source tree. Installing a new application version does not replace this file.

## Native SQLite module

`better-sqlite3` is a native Node module and must match Electron's ABI.
`npm install` runs Electron Builder's native dependency installer through the
`postinstall` script. Electron Builder also rebuilds production dependencies
while packaging and unpacks the `better-sqlite3` native files from the ASAR.
Run the command manually after changing Electron or `better-sqlite3` versions:

```bash
npm run native:install
```

## Verification

```bash
npm run build
npm run lint
npm run test:database
```

`test:database` runs under Electron against a temporary SQLite file and verifies
database migrations, authentication, permissions, persistence, receipts,
attendance, exams, backup helpers, and the safe preload bridge.

## Production packaging

Create an unpacked application for local verification:

```bash
npm run pack
```

Create the configured platform installer/package:

```bash
npm run dist
```

Platform-specific commands are also available:

```bash
npm run dist:mac
npm run dist:win
```

Artifacts are written to `release/`. macOS output includes DMG and ZIP targets.
Windows output includes NSIS and portable targets; Windows packaging is best
run on Windows or in a Windows CI job.

The unpacked application uses the production code path and loads
`dist/index.html`. It keeps the same staged restore, authentication, preload,
IPC, and `app.getPath("userData")` database behavior as development.

To create the macOS DMG and ZIP release directly:

```bash
npm run dist:mac
```

Unsigned macOS applications can trigger Gatekeeper. For a local trusted build,
right-click the app and select **Open**. If macOS still blocks a locally built
copy, remove its quarantine attribute only after verifying its source:

```bash
xattr -dr com.apple.quarantine "/Applications/Vidhya School ERP.app"
```

Public distribution still requires a valid Apple Developer ID signing
certificate and notarization.

## Build Windows Installer with GitHub Actions

The `Build Windows` workflow creates the NSIS installer and portable Windows
application on a GitHub-hosted Windows runner.

1. Push the project, including the branded `build/icon.ico`, to GitHub.
2. Open the repository’s **Actions** tab.
3. Select **Build Windows**.
4. Select **Run workflow** and confirm the branch.
5. When the run completes, download the
   `vidhya-school-erp-windows-<run number>` artifact.

The artifact contains the generated Windows `.exe` files from `release/`,
including the installer and portable application. The workflow also runs
automatically when a tag beginning with `v` is pushed, such as `v1.1.0`.
Electron Builder publishing is explicitly disabled for this command: the
workflow uploads build artifacts only and does not create or publish a GitHub
Release.

## Backup and restore

Settings → Backup & Restore can create a validated `.db` copy using the native
save dialog. Restore validates the selected SQLite database, creates a safety
backup of the current database, and stages the replacement. The staged restore
is applied before SQLite opens on the next application restart.

Backups should be stored outside the application folder. Installing or
replacing the application does not delete the database in Electron `userData`.

## Offline license activation

Vidhya School ERP verifies a signed, device-bound license before showing owner
setup or login. License signatures are verified in Electron's main process with
`electron/license-public-key.pem`. The private signing key is never included in
the renderer or packaged application.

Generate the signing keypair once on a secured development machine:

```bash
npm run license:keys
```

This creates the ignored `license-private-key.pem` and the distributable
`electron/license-public-key.pem`. Back up the private key offline. Losing it
prevents issuing renewals compatible with that public key; exposing it allows
unauthorized licenses to be created.

Generate a license for the Device ID shown on the activation screen:

```bash
npm run license:generate -- \
  --schoolName "Vidhya Public School" \
  --deviceId "VSE-ABCD-1234-EF56" \
  --plan "Annual" \
  --expiresAt "2027-07-03" \
  --maintenanceUntil "2027-07-03" \
  --maxUsers 10
```

The command prints a signed `VSE1` license key. License activation and expiry
checks work offline. Expired licenses block ERP access; expired maintenance
shows a warning but does not block an otherwise active license.

## Demo data

Owners can use Settings → Demo Tools to create an idempotent sample dataset.
Demo records use stable identifiers such as `DEMO-001`; running the tool again
creates only missing sample records. The utility never clears or deletes
existing data. Create a backup before using demo tools with production data.

## Application icons

Electron Builder uses the branded files documented in
[`build/README.md`](build/README.md):

- `build/icon.icns`
- `build/icon.ico`
- `build/icon.png`
- `build/source-icon.png`

The source artwork is retained separately from the platform-specific build
assets. A production signing certificate is still required before public
distribution.

## License and support

Vidhya School ERP 1.1.0 is built by Vidhya Tech. See
[`LICENSE.md`](LICENSE.md) for demo release terms. Support placeholder:
support@vidhyatech.in.
