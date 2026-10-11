const oneDay = 24 * 60 * 60 * 1000;
type Preference = { snoozedUntil: number; mutedSessionId: number | null };

export function createLocalPairingReminderService(now = () => Date.now()) {
  const preferences = new Map<string, Preference>();
  const get = (accountId: string) => preferences.get(accountId) ?? { snoozedUntil: 0, mutedSessionId: null };
  return {
    shouldShow(accountId: string, sessionId: number) {
      const preference = get(accountId);
      return preference.mutedSessionId !== sessionId && preference.snoozedUntil <= now();
    },
    snooze(accountId: string) { preferences.set(accountId, { ...get(accountId), snoozedUntil: now() + oneDay }); },
    muteSession(accountId: string, sessionId: number) { preferences.set(accountId, { ...get(accountId), mutedSessionId: sessionId }); },
    clearAccount(accountId: string) { preferences.delete(accountId); },
  };
}

export const localPairingReminderService = createLocalPairingReminderService();
