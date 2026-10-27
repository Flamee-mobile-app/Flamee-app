/** One foreground refresh at a time; disposal prevents queued ticks from old screens. */
export function createMemorySync(refresh: () => Promise<unknown>, isActive: () => boolean) {
  let disposed = false;
  let pending = false;
  return {
    async tick() {
      if (disposed || pending || !isActive()) return;
      pending = true;
      try { await refresh(); } catch { /* Query state owns read errors and keeps confirmed data. */ }
      finally { pending = false; }
    },
    dispose() { disposed = true; },
  };
}
