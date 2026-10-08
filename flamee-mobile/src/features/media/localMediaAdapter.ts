export type LocalPhotoSource = "camera" | "library";
export type LocalMediaResult =
  | { kind: "selected"; uri: string; width?: number; height?: number; sizeBytes?: number; durationSeconds?: number }
  | { kind: "denied" | "cancelled" | "unavailable" };

export type LocalPhotoAsset = { uri: string; width: number; height: number };

export type LocalMediaNative = {
  isAvailable: () => Promise<boolean>;
  requestPhotoPermission: (source: LocalPhotoSource) => Promise<boolean>;
  selectPhoto: (source: LocalPhotoSource) => Promise<LocalPhotoAsset | { kind: "cancelled" }>;
  compressPhoto: (uri: string, maxEdge: number, quality: number, width: number, height: number) => Promise<LocalPhotoAsset>;
  getFileSize: (uri: string) => Promise<number>;
  requestVoicePermission: () => Promise<boolean>;
  deleteFile: (uri: string) => Promise<void>;
};

export type LocalMediaAdapter = {
  selectPhoto: (source: LocalPhotoSource) => Promise<LocalMediaResult>;
  prepareVoiceForReview: (uri: string, durationSeconds: number) => LocalMediaResult;
  requestVoicePermission: () => Promise<{ kind: "granted" | "denied" | "unavailable" }>;
  cleanup: (uri: string | null | undefined) => Promise<void>;
};

const maximumPhotoEdge = 1600;
const maximumPhotoBytes = 2 * 1024 * 1024;
const compressionQualities = [0.92, 0.82, 0.68, 0.52, 0.36, 0.2];

export function isLocalMediaUri(uri: string): boolean {
  return /^(file|content):\/\//i.test(uri);
}

function createExpoMediaNative(): LocalMediaNative {
  return {
    async isAvailable() {
      try {
        await Promise.all([import("expo-image-picker"), import("expo-image-manipulator"), import("expo-file-system"), import("expo-audio")]);
        return true;
      } catch {
        return false;
      }
    },
    async requestPhotoPermission(source) {
      const picker = await import("expo-image-picker");
      const permission = source === "camera"
        ? await picker.requestCameraPermissionsAsync()
        : await picker.requestMediaLibraryPermissionsAsync();
      return permission.granted;
    },
    async selectPhoto(source) {
      const picker = await import("expo-image-picker");
      const selection = source === "camera"
        ? await picker.launchCameraAsync({ mediaTypes: ["images"], allowsEditing: true, quality: 1 })
        : await picker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, quality: 1 });
      const asset = selection.assets?.[0];
      if (selection.canceled || !asset) return { kind: "cancelled" };
      return { uri: asset.uri, width: asset.width, height: asset.height };
    },
    async compressPhoto(uri, maxEdge, quality, width, height) {
      const manipulator = await import("expo-image-manipulator");
      const resize = Math.max(width, height) > maxEdge
        ? [{ resize: width >= height ? { width: maxEdge } : { height: maxEdge } }]
        : [];
      const compressed = await manipulator.manipulateAsync(uri, resize, { compress: quality, format: manipulator.SaveFormat.JPEG });
      return { uri: compressed.uri, width: compressed.width, height: compressed.height };
    },
    async getFileSize(uri) {
      const { File } = await import("expo-file-system");
      const file = new File(uri);
      return file.size ?? Number.POSITIVE_INFINITY;
    },
    async requestVoicePermission() {
      const audio = await import("expo-audio");
      const permission = await audio.requestRecordingPermissionsAsync();
      return permission.granted;
    },
    async deleteFile(uri) {
      const { File } = await import("expo-file-system");
      const file = new File(uri);
      if (file.exists) file.delete();
    },
  };
}

export function createLocalMediaAdapter({ native = createExpoMediaNative() }: { native?: LocalMediaNative } = {}): LocalMediaAdapter {
  const ownedTemporaryFiles = new Set<string>();

  return {
    async selectPhoto(source) {
      try {
        if (!(await native.isAvailable())) return { kind: "unavailable" };
        if (!(await native.requestPhotoPermission(source))) return { kind: "denied" };
        const selection = await native.selectPhoto(source);
        if ("kind" in selection) return selection;
        if (!isLocalMediaUri(selection.uri) || selection.width <= 0 || selection.height <= 0) return { kind: "unavailable" };

        for (const quality of compressionQualities) {
          const compressed = await native.compressPhoto(selection.uri, maximumPhotoEdge, quality, selection.width, selection.height);
          const sizeBytes = await native.getFileSize(compressed.uri);
          const withinDimensions = Math.max(compressed.width, compressed.height) <= maximumPhotoEdge;
          if (isLocalMediaUri(compressed.uri) && withinDimensions && sizeBytes <= maximumPhotoBytes) {
            ownedTemporaryFiles.add(compressed.uri);
            return { kind: "selected", uri: compressed.uri, width: compressed.width, height: compressed.height, sizeBytes };
          }
          await native.deleteFile(compressed.uri).catch(() => undefined);
        }
        return { kind: "unavailable" };
      } catch {
        return { kind: "unavailable" };
      }
    },

    prepareVoiceForReview(uri, durationSeconds) {
      if (!isLocalMediaUri(uri) || !Number.isFinite(durationSeconds) || durationSeconds <= 0 || durationSeconds > 30) {
        return { kind: "unavailable" };
      }
      ownedTemporaryFiles.add(uri);
      return { kind: "selected", uri, durationSeconds };
    },

    async requestVoicePermission() {
      try {
        if (!(await native.isAvailable())) return { kind: "unavailable" };
        return await native.requestVoicePermission() ? { kind: "granted" } : { kind: "denied" };
      } catch {
        return { kind: "unavailable" };
      }
    },

    async cleanup(uri) {
      if (!uri || !ownedTemporaryFiles.has(uri)) return;
      try {
        await native.deleteFile(uri);
        ownedTemporaryFiles.delete(uri);
      } catch {
        // Keep ownership recorded so a later cleanup can retry.
      }
    },
  };
}

export const localMediaAdapter = createLocalMediaAdapter();
