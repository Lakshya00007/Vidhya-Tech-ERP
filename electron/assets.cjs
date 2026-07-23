const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { dialog } = require("electron");

const MAX_MANAGED_IMAGE_BYTES = 5 * 1024 * 1024;
const MANAGED_ASSET_ROOT_DIRECTORY = "managed-assets";

const IMAGE_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

const CATEGORY_DIRECTORIES = {
  "school-logo": "school/logo",
  "principal-signature": "school/signatures",
  "school-stamp": "school/stamps",
  "student-photo": "students",
  "guardian-photo": "guardians",
  "document-template-asset": "documents/templates",
  "store-product-image": "store/products",
};

function optionalText(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function normalizeCategory(category) {
  const text = optionalText(category);
  if (!Object.prototype.hasOwnProperty.call(CATEGORY_DIRECTORIES, text)) {
    throw new Error("Managed image category is not supported.");
  }
  return text;
}

function safeOwnerSegment(ownerId) {
  const text = optionalText(ownerId);
  if (!text) return "";
  return text.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
}

function getManagedAssetsRoot(userDataPath) {
  return path.join(userDataPath, MANAGED_ASSET_ROOT_DIRECTORY);
}

function assertInsideRoot(rootDirectory, filePath) {
  const root = path.resolve(rootDirectory);
  const resolved = path.resolve(filePath);
  const relative = path.relative(root, resolved);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Managed asset path is invalid.");
  }
  return resolved;
}

function resolveAssetPath(userDataPath, assetKey) {
  const key = optionalText(assetKey);
  if (!key) throw new Error("Managed image key is required.");
  if (path.isAbsolute(key) || key.includes("\\") || key.split("/").includes("..")) {
    throw new Error("Managed image key is invalid.");
  }
  if (!/^[a-zA-Z0-9._/-]+$/.test(key)) {
    throw new Error("Managed image key contains unsupported characters.");
  }
  const root = getManagedAssetsRoot(userDataPath);
  return assertInsideRoot(root, path.join(root, key));
}

function detectImageType(buffer, extension) {
  if (
    extension === ".png" &&
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    (extension === ".jpg" || extension === ".jpeg") &&
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (
    extension === ".webp" &&
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  return "";
}

function validateSourceImage(sourcePath) {
  const selectedPath = optionalText(sourcePath);
  if (!selectedPath) throw new Error("Select an image file.");
  const stats = fs.statSync(selectedPath);
  if (!stats.isFile()) {
    throw new Error("Select a valid image file.");
  }
  if (stats.size <= 0) {
    throw new Error("Selected image is empty.");
  }
  if (stats.size > MAX_MANAGED_IMAGE_BYTES) {
    throw new Error("Image must be 5 MB or smaller.");
  }
  const extension = path.extname(selectedPath).toLowerCase();
  if (!IMAGE_TYPES[extension]) {
    throw new Error("Only PNG, JPEG and WebP images are supported.");
  }
  const handle = fs.openSync(selectedPath, "r");
  const header = Buffer.alloc(Math.min(32, stats.size));
  try {
    fs.readSync(handle, header, 0, header.length, 0);
  } finally {
    fs.closeSync(handle);
  }
  const mimeType = detectImageType(header, extension);
  if (!mimeType || mimeType !== IMAGE_TYPES[extension]) {
    throw new Error("Selected file does not look like a valid image.");
  }
  return { extension: extension === ".jpeg" ? ".jpg" : extension, mimeType, size: stats.size };
}

function makeAssetKey(category, ownerId, extension) {
  const baseDirectory = CATEGORY_DIRECTORIES[normalizeCategory(category)];
  const ownerSegment = safeOwnerSegment(ownerId);
  const filename = `${crypto.randomUUID()}${extension}`;
  return [baseDirectory, ownerSegment, filename].filter(Boolean).join("/");
}

function copyManagedImage({ userDataPath, sourcePath, category, ownerId }) {
  const normalizedCategory = normalizeCategory(category);
  const metadata = validateSourceImage(sourcePath);
  const assetKey = makeAssetKey(normalizedCategory, ownerId, metadata.extension);
  const root = getManagedAssetsRoot(userDataPath);
  const destination = resolveAssetPath(userDataPath, assetKey);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(sourcePath, destination, fs.constants.COPYFILE_EXCL);
  return {
    assetKey,
    category: normalizedCategory,
    mimeType: metadata.mimeType,
    size: metadata.size,
  };
}

function fileToDataUrl(filePath, mimeType) {
  const data = fs.readFileSync(filePath);
  return `data:${mimeType};base64,${data.toString("base64")}`;
}

function mimeTypeFromAssetKey(assetKey) {
  const extension = path.extname(assetKey).toLowerCase();
  return IMAGE_TYPES[extension] || "application/octet-stream";
}

function createManagedAssetService({ app, database, userDataPath }) {
  const resolvedUserDataPath = userDataPath || app.getPath("userData");

  const service = {
    getManagedAssetsRoot() {
      return getManagedAssetsRoot(resolvedUserDataPath);
    },

    async selectManagedImage(event, input = {}) {
      const category = normalizeCategory(input.category);
      const options = {
        title: "Choose image",
        properties: ["openFile"],
        filters: [
          { name: "Images", extensions: ["png", "jpg", "jpeg", "webp"] },
        ],
      };
      const ownerWindow = event?.sender?.getOwnerBrowserWindow?.() ?? null;
      const result = ownerWindow
        ? await dialog.showOpenDialog(ownerWindow, options)
        : await dialog.showOpenDialog(options);
      if (result.canceled || !result.filePaths?.[0]) {
        return { canceled: true };
      }
      const copied = copyManagedImage({
        userDataPath: resolvedUserDataPath,
        sourcePath: result.filePaths[0],
        category,
        ownerId: input.ownerId,
      });
      return {
        canceled: false,
        ...copied,
        dataUrl: service.getManagedImageUrl(copied.assetKey).dataUrl,
      };
    },

    async replaceManagedImage(event, input = {}) {
      const result = await service.selectManagedImage(event, input);
      if (result.canceled) return result;
      const currentAssetKey = optionalText(input.currentAssetKey);
      if (currentAssetKey) {
        try {
          service.removeManagedImage(currentAssetKey);
        } catch {
          // Current records may still reference the old key until the caller saves.
        }
      }
      return result;
    },

    getManagedImageUrl(assetKey) {
      const key = optionalText(assetKey);
      if (!key) return { assetKey: "", dataUrl: "", missing: true };
      const filePath = resolveAssetPath(resolvedUserDataPath, key);
      if (!fs.existsSync(filePath)) {
        return { assetKey: key, dataUrl: "", missing: true };
      }
      const stats = fs.lstatSync(filePath);
      if (stats.isSymbolicLink() || !stats.isFile()) {
        throw new Error("Managed image is not a readable file.");
      }
      assertInsideRoot(
        fs.realpathSync(getManagedAssetsRoot(resolvedUserDataPath)),
        fs.realpathSync(filePath),
      );
      return {
        assetKey: key,
        dataUrl: fileToDataUrl(filePath, mimeTypeFromAssetKey(key)),
        missing: false,
      };
    },

    removeManagedImage(assetKey) {
      const key = optionalText(assetKey);
      if (!key) return { success: true, removed: false };
      if (database?.isManagedAssetReferenced?.(key)) {
        return { success: true, removed: false, referenced: true };
      }
      const filePath = resolveAssetPath(resolvedUserDataPath, key);
      if (fs.existsSync(filePath)) {
        fs.rmSync(filePath, { force: true });
      }
      return { success: true, removed: true };
    },
  };

  service._test = {
    importManagedImageFromPath(input = {}) {
      const copied = copyManagedImage({
        userDataPath: resolvedUserDataPath,
        sourcePath: input.sourcePath,
        category: input.category,
        ownerId: input.ownerId,
      });
      return {
        ...copied,
        dataUrl: service.getManagedImageUrl(copied.assetKey).dataUrl,
      };
    },
    resolveAssetPath(assetKey) {
      return resolveAssetPath(resolvedUserDataPath, assetKey);
    },
  };

  return service;
}

module.exports = {
  createManagedAssetService,
  _test: {
    MAX_MANAGED_IMAGE_BYTES,
    copyManagedImage,
    detectImageType,
    getManagedAssetsRoot,
    resolveAssetPath,
    validateSourceImage,
  },
};
