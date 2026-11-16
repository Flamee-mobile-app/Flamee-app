import type { MemorySummary } from "../moments/memoryApi.ts";

export function selectFeedPrefetchUrls(feed: readonly MemorySummary[], _first: number, last: number) {
  const next = feed.slice(last + 1, last + 5);
  return [...new Set([
    ...next.map((item) => item.thumbnail_url),
    ...next.slice(0, 2).map((item) => item.cover_image?.url ?? item.thumbnail_url),
  ].filter((uri): uri is string => Boolean(uri)))];
}

/** Small lookahead only; obsolete scroll work must not compete with visible images. */
export function createImagePrefetchQueue(read: (uri: string) => Promise<boolean>) {
  let disposed = false;
  let active = true;
  let pending: string[] = [];
  const inFlight = new Set<string>();
  const attempted = new Set<string>();
  const drain = () => {
    while (!disposed && active && inFlight.size < 2 && pending.length) {
      const uri = pending.shift()!;
      if (attempted.has(uri)) continue;
      attempted.add(uri); inFlight.add(uri);
      while (attempted.size > 64) attempted.delete(attempted.values().next().value!);
      const finish = () => { inFlight.delete(uri); drain(); };
      try { void read(uri).catch(() => false).finally(finish); }
      catch { finish(); }
    }
  };
  return {
    enqueue(uris: readonly string[]) {
      if (disposed || !active) return;
      pending = [...new Set(uris)].filter((uri) => !attempted.has(uri) && !inFlight.has(uri)).slice(0, 6);
      drain();
    },
    setActive(next: boolean) { active = next; if (!active) pending = []; else drain(); },
    dispose() { disposed = true; pending = []; attempted.clear(); },
  };
}
