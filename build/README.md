# Application icons

Electron Builder uses the branded platform icons stored in this directory:

- `build/icon.icns` for macOS
- `build/icon.ico` for Windows
- `build/icon.png` for Linux and general use
- `build/source-icon.png` as the high-resolution source artwork

The macOS and Windows paths are configured explicitly in `package.json`. Do not
replace or regenerate these assets during normal application builds.
