import { authService } from "../auth";
import { createMoodApi } from "./moodApi";
import { createGatedMoodSubmit } from "./moodServiceCore";
import { useSessionStore } from "../../shared/state/sessionStore";

const api = createMoodApi({ baseUrl: process.env.EXPO_PUBLIC_API_URL ?? "" });
export type ReminderScope = { accountId: string | null; sessionId: number };
export const reminderKey = (scope: ReminderScope) => ["mood-reminders", scope.sessionId, scope.accountId] as const;
export function reminderCurrent(scope: ReminderScope) {
  const state = useSessionStore.getState();
  return Boolean(scope.accountId) && state.activeAccountId === scope.accountId && state.sessionId === scope.sessionId;
}
function reminderRequest<T>(scope: ReminderScope, read: (token: string) => Promise<T>) {
  const check = () => { if (!reminderCurrent(scope)) { const error = new Error("cancelled"); error.name = "AbortError"; throw error; } };
  return authService.withAccessToken(async (token) => { check(); const result = await read(token); check(); return result; });
}
export const moodService = {
  create: createGatedMoodSubmit(api, authService),
  partner: (signal?: AbortSignal) => authService.withAccessToken((token) => api.partner(token, signal)),
  history: (page: { limit: number; offset: number }, signal?: AbortSignal) => authService.withAccessToken((token) => api.history(token, page, signal)),
  capabilities: (scope: ReminderScope) => reminderRequest(scope, (token) => api.capabilities(token)),
  ensureReminder: (scope: ReminderScope, timezone: string) => reminderRequest(scope, (token) => api.ensureReminder(token, timezone)),
  reminders: (scope: ReminderScope, offset = 0, signal?: AbortSignal) => reminderRequest(scope, (token) => api.reminders(token, offset, signal)),
  readReminder: (scope: ReminderScope, id: string) => reminderRequest(scope, (token) => api.readReminder(token, id)),
  readAllReminders: (scope: ReminderScope) => reminderRequest(scope, (token) => api.readAllReminders(token)),
};
