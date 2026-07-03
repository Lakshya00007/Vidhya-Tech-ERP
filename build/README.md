# Application icons

Electron Builder uses its default Electron icon until production artwork is
provided. Add the final branded icons here before a signed public release:

- `build/icon.icns` for macOS
- `build/icon.ico` for Windows
- `build/icon.png` for Linux and as a high-resolution general source

These are Electron Builder's standard icon locations. Builder discovers them
when they exist. The packaging configuration intentionally does not reference
missing files, so local unpacked builds and installers continue to work with
the default Electron icon.
