export type LocalPhotoSource = "camera" | "library";
export type LocalMediaResult =
  | { kind: "selected"; uri: string; width?: number; height?: number; sizeBytes?: number; durationSeconds?: number }
  | { kind: "denied" | "cancelled" | "unavailable" };

export type LocalPhotoAsset = { uri: string; width: number; height: number };
export type LocalPhotoOptions = { purpose?: "memory" | "avatar"; onPreview?: (asset: LocalPhotoAsset) => void };

export type LocalMediaNative = {
  isAvailable: () => Promise<boolean>;
  requestPhotoPermission: (source: LocalPhotoSource) => Promise<boolean>;
  selectPhoto: (source: LocalPhotoSource) => Promise<LocalPhotoAsset | { kind: "cancelled" }>;
  compressPhoto: (uri: string, maxEdge: number, quality: number, width: number, height: number, purpose?: LocalPhotoOptions["purpose"]) => Promise<LocalPhotoAsset>;
  getFileSize: (uri: string) => Promise<number>;
  requestVoicePermission: () => Promise<boolean>;
  deleteFile: (uri: string) => Promise<void>;
};

export type LocalMediaAdapter = {
  selectPhoto: (source: LocalPhotoSource, options?: LocalPhotoOptions) => Promise<LocalMediaResult>;
  prepareVoiceForReview: (uri: string, durationSeconds: number) => LocalMediaResult;
  requestVoicePermission: () => Promise<{ kind: "granted" | "denied" | "unavailable" }>;
  cleanup: (uri: string | null | undefined) => Promise<void>;
};

const maximumPhotoEdge = 1600;
const maximumPhotoBytes = 2 * 1024 * 1024;
// One 1600 px pass is normally below the upload budget; keep one lower-quality
// fallback instead of repeatedly re-encoding the same full-resolution source.
const compressionQualities = [0.8, 0.55];

export function isLocalMediaUri(uri: string): boolean {
  return /^(file|content):\/\//i.test(uri);
}

type PhotoTransform = { crop: { originX: number; originY: number; width: number; height: number } } | { resize: { width: number } | { height: number } };

export function getPhotoTransforms(width: number, height: number, maxEdge: number, purpose: LocalPhotoOptions["purpose"]): PhotoTransform[] {
  if (purpose === "avatar") {
    const edge = Math.min(width, height);
    return [
      { crop: { originX: Math.floor((width - edge) / 2), originY: Math.floor((height - edge) / 2), width: edge, height: edge } },
      ...(edge > maxEdge ? [{ resize: { width: maxEdge } }] : []),
    ];
  }
  return Math.max(width, height) > maxEdge ? [{ resize: width >= height ? { width: maxEdge } : { height: maxEdge } }] : [];
}

export function createLocalMediaAdapter({ native }: { native: LocalMediaNative }): LocalMediaAdapter {
  const ownedTemporaryFiles = new Set<string>();
  const cleanup = async (uri: string | null | undefined) => {
    if (!uri || !ownedTemporaryFiles.has(uri)) return;
    try {
      await native.deleteFile(uri);
      ownedTemporaryFiles.delete(uri);
    } catch {
      // Preserve ownership so cleanup can be retried.
    }
  };

  return {
    async selectPhoto(source, options) {
      let pendingOutput: string | null = null;
      try {
        if (!(await native.isAvailable())) return { kind: "unavailable" };
        if (!(await native.requestPhotoPermission(source))) return { kind: "denied" };
        const selection = await native.selectPhoto(source);
        if ("kind" in selection) return selection;
        if (!isLocalMediaUri(selection.uri) || selection.width <= 0 || selection.height <= 0) return { kind: "unavailable" };
        options?.onPreview?.(selection);
        const maxEdge = options?.purpose === "avatar" ? 512 : maximumPhotoEdge;

        for (const quality of compressionQualities) {
          const compressed = await native.compressPhoto(selection.uri, maxEdge, quality, selection.width, selection.height, options?.purpose);
          if (compressed.uri !== selection.uri && isLocalMediaUri(compressed.uri)) {
            ownedTemporaryFiles.add(compressed.uri);
            pendingOutput = compressed.uri;
          }
          const sizeBytes = await native.getFileSize(compressed.uri);
          const withinDimensions = Math.max(compressed.width, compressed.height) <= maxEdge;
          if (isLocalMediaUri(compressed.uri) && withinDimensions && sizeBytes <= maximumPhotoBytes) {
            pendingOutput = null;
            return { kind: "selected", uri: compressed.uri, width: compressed.width, height: compressed.height, sizeBytes };
          }
          await cleanup(pendingOutput);
          pendingOutput = null;
        }
        return { kind: "unavailable" };
      } catch {
        await cleanup(pendingOutput);
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

    cleanup,
  };
}

