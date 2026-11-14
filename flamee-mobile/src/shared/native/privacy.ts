const ALLOWED_DIAGNOSTIC_EVENTS = new Set([
  "api.request_failed",
  "session.restore_failed",
  "sqlite.open_failed",
]);

/** Emit only approved event names; never pass user content, tokens, or errors here. */
export function privacyEvent(event: string): { event: string } | null {
  if (!ALLOWED_DIAGNOSTIC_EVENTS.has(event)) return null;
  return { event };
}
