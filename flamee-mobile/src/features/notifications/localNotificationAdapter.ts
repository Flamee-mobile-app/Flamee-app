import { getMessage } from "../../shared/localization/messages.ts";
import { parseNotificationIntent } from "../../shared/navigation/notificationIntent.ts";
import type { NotificationIntent, NotificationPermission, NotificationSettings, NotificationSettingsResult } from "./types.ts";

export type LocalNotificationNative = {
  getPermission: () => Promise<NotificationPermission>;
  requestPermission: () => Promise<NotificationPermission>;
  scheduleDailyReminder: (time: string) => Promise<void>;
  cancelDailyReminder: () => Promise<void>;
};

export type LocalNotificationAdapter = {
  getPermission: () => Promise<NotificationPermission>;
  requestPermission: () => Promise<NotificationPermission>;
  scheduleDailyReminder: (time: string) => Promise<void>;
  cancelDailyReminder: () => Promise<void>;
  parseTap: (payload: unknown) => NotificationIntent | null;
  getSettings: (accountId: string) => Promise<NotificationSettings>;
  markFirstCheckInCompleted: (accountId: string) => Promise<NotificationSettings>;
  dismissPermissionPrompt: (accountId: string) => Promise<NotificationSettings>;
  requestPermissionAfterFirstCheckIn: (accountId: string) => Promise<{ kind: NotificationPermission; settings: NotificationSettings }>;
  setDailyReminder: (accountId: string, enabled: boolean, time: string) => Promise<NotificationSettingsResult>;
  clearAccount: (accountId: string) => Promise<void>;
};

export type LocalNotificationAdapterOptions = { native?: LocalNotificationNative };

function normalizePermission(permission: { granted: boolean; canAskAgain: boolean }): NotificationPermission {
  if (permission.granted) return "granted";
  return permission.canAskAgain ? "not_requested" : "denied";
}

function createExpoNotificationNative(): LocalNotificationNative {
  let reminderId: string | null = null;
  return {
    async getPermission() {
      try {
        const notifications = await import("expo-notifications");
        return normalizePermission(await notifications.getPermissionsAsync());
      } catch {
        return "unavailable";
      }
    },
    async requestPermission() {
      try {
        const notifications = await import("expo-notifications");
        return normalizePermission(await notifications.requestPermissionsAsync());
      } catch {
        return "unavailable";
      }
    },
    async scheduleDailyReminder(time) {
      const [hour, minute] = time.split(":").map(Number);
      const notifications = await import("expo-notifications");
      await this.cancelDailyReminder();
      reminderId = await notifications.scheduleNotificationAsync({
        content: {
          title: getMessage("vi", "dailyCheckInReminderTitle"),
          body: getMessage("vi", "dailyCheckInReminderBody"),
          data: { type: "checkin_reminder" },
        },
        trigger: { type: notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
      });
    },
    async cancelDailyReminder() {
      if (!reminderId) return;
      const notifications = await import("expo-notifications");
      await notifications.cancelScheduledNotificationAsync(reminderId);
      reminderId = null;
    },
  };
}

const emptySettings = (accountId: string): NotificationSettings => ({
  accountId,
  permission: "not_requested",
  firstCheckInCompleted: false,
  promptDismissed: false,
  reminderEnabled: false,
  reminderTime: "20:00",
});

function validTime(value: string): boolean {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return false;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

export function createLocalNotificationAdapter({ native = createExpoNotificationNative() }: LocalNotificationAdapterOptions = {}): LocalNotificationAdapter {
  const settingsByAccount = new Map<string, NotificationSettings>();
  let reminderOwnerId: string | null = null;
  const getMutable = (accountId: string): NotificationSettings => {
    const normalizedId = accountId.trim();
    if (!normalizedId) throw new Error("Notification preferences require an account ID.");
    const current = settingsByAccount.get(normalizedId) ?? emptySettings(normalizedId);
    settingsByAccount.set(normalizedId, current);
    return current;
  };
  const clone = (settings: NotificationSettings): NotificationSettings => ({ ...settings });
  const updateNativePermission = async (settings: NotificationSettings): Promise<NotificationPermission> => {
    const permission = await native.getPermission().catch(() => "unavailable" as const);
    if (permission !== "unavailable") settings.permission = permission;
    else if (settings.permission === "not_requested") settings.permission = "unavailable";
    return settings.permission;
  };
  const syncReminder = async (settings: NotificationSettings): Promise<void> => {
    if (!settings.reminderEnabled || settings.permission !== "granted") {
      if (reminderOwnerId === settings.accountId) {
        await native.cancelDailyReminder();
        reminderOwnerId = null;
      }
      return;
    }
    await native.cancelDailyReminder();
    await native.scheduleDailyReminder(settings.reminderTime);
    reminderOwnerId = settings.accountId;
  };

  return {
    getPermission: () => native.getPermission(),
    requestPermission: () => native.requestPermission(),
    scheduleDailyReminder: (time) => native.scheduleDailyReminder(time),
    cancelDailyReminder: () => native.cancelDailyReminder(),
    parseTap: (payload) => parseNotificationIntent(payload),

    async getSettings(accountId) {
      const settings = getMutable(accountId);
      await updateNativePermission(settings);
      return clone(settings);
    },

    async markFirstCheckInCompleted(accountId) {
      const settings = getMutable(accountId);
      settings.firstCheckInCompleted = true;
      return clone(settings);
    },

    async dismissPermissionPrompt(accountId) {
      const settings = getMutable(accountId);
      settings.promptDismissed = true;
      return clone(settings);
    },

    async requestPermissionAfterFirstCheckIn(accountId) {
      const settings = getMutable(accountId);
      if (!settings.firstCheckInCompleted) return { kind: "not_requested", settings: clone(settings) };
      let permission = await updateNativePermission(settings);
      if (permission === "not_requested") {
        permission = await native.requestPermission().catch(() => "unavailable" as const);
        settings.permission = permission;
      }
      if (permission === "granted") {
        try {
          await syncReminder(settings);
        } catch {
          return { kind: "unavailable", settings: clone(settings) };
        }
      }
      return { kind: permission, settings: clone(settings) };
    },

    async setDailyReminder(accountId, enabled, time) {
      const settings = getMutable(accountId);
      if (!validTime(time)) return { kind: "invalid_time", settings: clone(settings) };
      settings.reminderEnabled = enabled;
      settings.reminderTime = time;
      if (!enabled) {
        try {
          if (reminderOwnerId === settings.accountId) await native.cancelDailyReminder();
          reminderOwnerId = null;
          return { kind: "updated", settings: clone(settings) };
        } catch {
          return { kind: "unavailable", settings: clone(settings) };
        }
      }
      if (!settings.firstCheckInCompleted) return { kind: "permission_required", settings: clone(settings) };
      const permission = await updateNativePermission(settings);
      if (permission !== "granted") {
        return permission === "unavailable"
          ? { kind: "unavailable", settings: clone(settings) }
          : { kind: "permission_required", settings: clone(settings) };
      }
      try {
        await syncReminder(settings);
        return { kind: "updated", settings: clone(settings) };
      } catch {
        return { kind: "unavailable", settings: clone(settings) };
      }
    },

    async clearAccount(accountId) {
      const normalizedId = accountId.trim();
      settingsByAccount.delete(normalizedId);
      if (reminderOwnerId === normalizedId) {
        await native.cancelDailyReminder().catch(() => undefined);
        reminderOwnerId = null;
      }
    },
  };
}

export const localNotificationAdapter = createLocalNotificationAdapter();
