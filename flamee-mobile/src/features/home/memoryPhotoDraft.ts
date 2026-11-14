import type { LocalMediaAdapter, LocalMediaResult, LocalPhotoAsset } from "../media";

/** Owns only temporary picker output while a single composer is mounted. No records or persistence. */
export function createMemoryPhotoDraft(media: Pick<LocalMediaAdapter, "selectPhoto" | "cleanup">) {
  let active = true;
  let picking = false;
  let uri: string | null = null;
  let revision = 0;
  const remove = async () => {
    revision += 1;
    const selected = uri;
    uri = null;
    if (selected) await media.cleanup(selected);
  };
  return {
    async select(onPreview?: (asset: LocalPhotoAsset) => void): Promise<LocalMediaResult | null> {
      if (!active || picking) return null;
      picking = true;
      const request = revision;
      try {
        const result = await media.selectPhoto("library", { purpose: "memory", onPreview: (asset) => {
          if (active && request === revision) onPreview?.(asset);
        } });
        if (!active || request !== revision) {
          if (result.kind === "selected") await media.cleanup(result.uri);
          return null;
        }
        if (result.kind === "selected") {
          const previous = uri;
          uri = result.uri;
          if (previous && previous !== uri) void media.cleanup(previous).catch(() => undefined);
        }
        return active && request === revision ? result : null;
      } catch { return active && request === revision ? { kind: "unavailable" } : null; }
      finally { picking = false; }
    },
    remove,
    async dispose() {
      active = false;
      await remove();
    },
  };
}
