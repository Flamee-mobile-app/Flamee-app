/** A deadline exposes retry UI; it never turns a still-pending restore into logout. */
export function observeStartupSession<T>(
  operation: Promise<T>,
  timeoutMs: number,
  callbacks: { onSuccess: (result: T) => void; onFailure: () => void; onDeadline: () => void },
): () => void {
  let active = true;
  const timer = setTimeout(() => { if (active) callbacks.onDeadline(); }, timeoutMs);
  void operation.then((result) => {
    clearTimeout(timer);
    if (active) callbacks.onSuccess(result);
  }, () => {
    clearTimeout(timer);
    if (active) callbacks.onFailure();
  });
  return () => { active = false; clearTimeout(timer); };
}
