import { useEffect } from "react";
import { AppState } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { moodService, reminderCurrent, reminderKey } from "../features/checkins";
import { useSessionStore } from "../shared/state/sessionStore";
import { appToast } from "../shared/components/AppToast";
import { getMessage } from "../shared/localization/messages";
import { useMoodReminderCapability } from "../features/checkins";

/** Server deduplicates by account and local day. No reminder is manufactured offline. */
export function DailyMoodReminder() {
  const accountId = useSessionStore((state) => state.activeAccountId);
  const sessionId = useSessionStore((state) => state.sessionId);
  const bootstrapped = useSessionStore((state) => state.isBootstrapped);
  const client = useQueryClient();
  const capability = useMoodReminderCapability({ accountId, sessionId });
  useEffect(() => {
    if (!accountId) return;
    const subscription = AppState.addEventListener("change", (state) => { if (state === "active") void capability.refetch(); });
    return () => subscription.remove();
  }, [accountId, sessionId, capability.refetch]);
  useEffect(() => {
    if (!bootstrapped || !accountId || !capability.data?.dual_mood_nudge) return;
    const scope = { accountId, sessionId };
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let promptTimer: ReturnType<typeof setTimeout> | undefined;
    let inFlight = false;
    let pendingPrompt = false;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const show = () => {
      if (pendingPrompt && active && AppState.currentState === "active" && reminderCurrent(scope)) {
        const shown = appToast.infoIfIdle(getMessage("vi", "moodReminderTitle"), { description: getMessage("vi", "moodReminderBody") });
        if (shown !== null) pendingPrompt = false;
        else if (!promptTimer) promptTimer = setTimeout(() => { promptTimer = undefined; show(); }, 500);
      }
    };
    const run = async () => {
      if (!active || inFlight || !reminderCurrent(scope)) return;
      inFlight = true;
      try {
        const result = await moodService.ensureReminder(scope, timezone);
        if (!active || !reminderCurrent(scope)) return;
        void client.invalidateQueries({ queryKey: reminderKey(scope) });
        if (result.show_prompt) pendingPrompt = true;
        show();
      } catch { /* Inbox exposes read errors; startup must not fake a reminder. */ }
      finally { inFlight = false; }
    };
    const schedule = () => {
      const next = new Date(); next.setHours(24, 0, 1, 0);
      timer = setTimeout(() => { if (AppState.currentState === "active") void run(); schedule(); }, Math.max(1000, next.getTime() - Date.now()));
    };
    if (AppState.currentState === "active") void run();
    const subscription = AppState.addEventListener("change", (state) => { if (state === "active") { show(); void run(); } });
    schedule();
    return () => { active = false; if (timer) clearTimeout(timer); if (promptTimer) clearTimeout(promptTimer); subscription.remove(); };
  }, [accountId, sessionId, bootstrapped, client, capability.data?.dual_mood_nudge]);
  return null;
}
