import type { LocalNotificationAdapter } from "../notifications/localNotificationAdapter.ts";
import { localNotificationAdapter } from "../notifications/localNotificationAdapter.ts";
import type { LocalOnboardingService } from "../onboarding/localOnboardingService.ts";
import { localOnboardingService } from "../onboarding/localOnboardingService.ts";
import { notificationSettingsSchema, settingsCareSchema, settingsProfileSchema } from "./schemas.ts";

export type LocalSettingsSnapshot = {
  accountId: string;
  onboardingStep: string;
  profile: {
    displayName: string;
    partnerNickname: string;
    avatarUri: string | null;
    timezone: string;
    relationType: "long_distance" | "same_city" | null;
    carePreferences: string[];
    careNote: string;
  };
  consent: { version: string | null; acceptedAt: string | null };
  notifications: Awaited<ReturnType<LocalNotificationAdapter["getSettings"]>>;
};

export type LocalSettingsService = {
  getSettings: (accountId: string) => Promise<LocalSettingsSnapshot>;
  updateProfile: (accountId: string, profile: unknown) => Promise<{ kind: "updated"; settings: LocalSettingsSnapshot } | { kind: "validation" | "unavailable" }>;
  updateCarePreferences: (accountId: string, preferences: string[], note: string) => Promise<{ kind: "updated"; settings: LocalSettingsSnapshot } | { kind: "validation" | "unavailable" }>;
  setDailyReminder: (accountId: string, enabled: boolean, time: string) => ReturnType<LocalNotificationAdapter["setDailyReminder"]>;
};

export type LocalSettingsServiceOptions = {
  onboarding?: LocalOnboardingService;
  notifications?: LocalNotificationAdapter;
};

export function createLocalSettingsService({
  onboarding = localOnboardingService,
  notifications = localNotificationAdapter,
}: LocalSettingsServiceOptions = {}): LocalSettingsService {
  const getSettings = async (accountId: string): Promise<LocalSettingsSnapshot> => {
    const [account, notificationSettings] = await Promise.all([
      onboarding.getAccountSnapshot(accountId),
      notifications.getSettings(accountId),
    ]);
    return {
      accountId,
      onboardingStep: account.onboardingStep,
      profile: { ...account.profile, carePreferences: [...account.profile.carePreferences] },
      consent: { version: account.consentVersion, acceptedAt: account.consentedAt },
      notifications: notificationSettings,
    };
  };

  return {
    getSettings,

    async updateProfile(accountId, input) {
      const parsed = settingsProfileSchema.safeParse(input);
      if (!parsed.success) return { kind: "validation" };
      try {
        const account = await onboarding.getAccountSnapshot(accountId);
        await onboarding.saveProfile(accountId, { ...parsed.data, avatarUri: account.profile.avatarUri });
        return { kind: "updated", settings: await getSettings(accountId) };
      } catch {
        return { kind: "unavailable" };
      }
    },

    async updateCarePreferences(accountId, preferences, note) {
      const parsed = settingsCareSchema.safeParse({ preferences, note });
      if (!parsed.success) return { kind: "validation" };
      try {
        await onboarding.saveCarePreferences(accountId, parsed.data.preferences, parsed.data.note);
        return { kind: "updated", settings: await getSettings(accountId) };
      } catch {
        return { kind: "unavailable" };
      }
    },

    async setDailyReminder(accountId, enabled, time) {
      if (!notificationSettingsSchema.safeParse({ reminderEnabled: enabled, reminderTime: time }).success) {
        const settings = await notifications.getSettings(accountId);
        return { kind: "invalid_time", settings };
      }
      return notifications.setDailyReminder(accountId, enabled, time);
    },
  };
}

export const localSettingsService = createLocalSettingsService();
