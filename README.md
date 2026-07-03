# Vidhya School ERP

Current release: **1.0.0**

Offline-first school administration software built with Electron, React,
TypeScript, Vite, and SQLite.

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

## Backup and restore

Settings → Backup & Restore can create a validated `.db` copy using the native
save dialog. Restore validates the selected SQLite database, creates a safety
backup of the current database, and stages the replacement. The staged restore
is applied before SQLite opens on the next application restart.

Backups should be stored outside the application folder. Installing or
replacing the application does not delete the database in Electron `userData`.

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

Vidhya School ERP 1.0 is built by Vidhya Tech. See
[`LICENSE.md`](LICENSE.md) for demo release terms. Support placeholder:
support@vidhyatech.in.
