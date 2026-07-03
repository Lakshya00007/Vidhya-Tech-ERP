# Application icons

Electron Builder uses its default Electron icon until production artwork is
provided. Add the final branded icons here before a signed public release:

- `icon.icns` for macOS
- `icon.ico` for Windows
- `icon.png` as the high-resolution source/fallback

The packaging configuration intentionally does not reference missing icon
files, so local unpacked builds and installers continue to work.
