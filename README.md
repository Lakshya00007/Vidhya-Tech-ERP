# School ERP Desktop

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

## Application icons

Local packaging currently falls back to Electron's default icon. Before a
signed public release, add the branded files documented in
[`build/README.md`](build/README.md):

- `build/icon.icns`
- `build/icon.ico`
- `build/icon.png`
