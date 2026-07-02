# School ERP Desktop

Offline-first school administration software built with Electron, React,
TypeScript, Vite, and SQLite.

## Development

Install dependencies and start the Electron desktop app:

```bash
npm install
npm run desktop
```

The SQLite database is created automatically as `school-erp.db` in Electron's
platform-specific `userData` directory. It is not stored in the source tree.

## Native SQLite module

`better-sqlite3` is a native Node module and must match Electron's ABI.
`npm install` runs the rebuild automatically through the `postinstall` script.
Run the rebuild manually after changing Electron or `better-sqlite3` versions:

```bash
npm run rebuild:native
```

## Verification

```bash
npm run build
npm run lint
npm run test:database
```

`test:database` runs under Electron against a temporary SQLite file and verifies
student persistence, soft deletion, settings, fee receipts, and attendance.
