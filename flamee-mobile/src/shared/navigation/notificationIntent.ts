export type NotificationIntent =
  | { kind: "nudge"; id: string }
  | { kind: "moment"; id: string };

export function parseNotificationIntent(payload: unknown): NotificationIntent | null {
  if (!payload || typeof payload !== "object") return null;
  const candidate = payload as { type?: unknown; id?: unknown };
  if ((candidate.type !== "nudge" && candidate.type !== "moment") || typeof candidate.id !== "string" || !candidate.id.trim()) return null;
  return { kind: candidate.type, id: candidate.id };
}
