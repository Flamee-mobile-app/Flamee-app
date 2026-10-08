import {
  carePreferencesSchema,
  profileSchema,
  relationSchema,
  type ProfileValue,
} from "./schemas.ts";

export type OnboardingStep = "consent" | "profile" | "care" | "relation" | "complete";

export type LocalAccountSnapshot = {
  accountId: string;
  onboardingStep: OnboardingStep;
  consentedAt: string | null;
  consentVersion: string | null;
  profile: ProfileValue & {
    relationType: "long_distance" | "same_city" | null;
    carePreferences: string[];
    careNote: string;
  };
};

export type LocalOnboardingService = {
  getAccountSnapshot: (accountId: string) => Promise<LocalAccountSnapshot>;
  acceptConsent: (accountId: string) => Promise<LocalAccountSnapshot>;
  saveProfile: (accountId: string, profile: unknown) => Promise<LocalAccountSnapshot>;
  saveCarePreferences: (accountId: string, preferences: string[], note: string) => Promise<LocalAccountSnapshot>;
  saveRelationType: (accountId: string, relationType: string) => Promise<LocalAccountSnapshot>;
  clearAccount: (accountId: string) => Promise<void>;
};

export type LocalOnboardingServiceOptions = {
  now?: () => Date;
  timezone?: () => string;
  consentVersion?: string;
};

export function createLocalOnboardingService({
  now = () => new Date(),
  timezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  consentVersion = "1.1",
}: LocalOnboardingServiceOptions = {}): LocalOnboardingService {
  const accounts = new Map<string, LocalAccountSnapshot>();

  const ensure = (accountId: string): LocalAccountSnapshot => {
    const existing = accounts.get(accountId);
    if (existing) return existing;
    const created: LocalAccountSnapshot = {
      accountId,
      onboardingStep: "consent",
      consentedAt: null,
      consentVersion: null,
      profile: {
        displayName: "",
        partnerNickname: "",
        avatarUri: null,
        timezone: timezone(),
        relationType: null,
        carePreferences: [],
        careNote: "",
      },
    };
    accounts.set(accountId, created);
    return created;
  };

  const copy = (snapshot: LocalAccountSnapshot): LocalAccountSnapshot => ({
    ...snapshot,
    profile: { ...snapshot.profile, carePreferences: [...snapshot.profile.carePreferences] },
  });

  return {
    async getAccountSnapshot(accountId) {
      return copy(ensure(accountId));
    },

    async acceptConsent(accountId) {
      const current = ensure(accountId);
      if (!current.consentedAt) {
        current.consentedAt = now().toISOString();
        current.consentVersion = consentVersion;
        current.onboardingStep = "profile";
      }
      return copy(current);
    },

    async saveProfile(accountId, input) {
      const current = ensure(accountId);
      if (!current.consentedAt) throw new Error("Consent is required before saving profile data.");
      const profile = profileSchema.parse(input);
      current.profile = { ...current.profile, ...profile };
      if (current.onboardingStep === "profile") current.onboardingStep = "care";
      return copy(current);
    },

    async saveCarePreferences(accountId, preferences, note) {
      const current = ensure(accountId);
      const parsed = carePreferencesSchema.parse({ preferences, note });
      current.profile = { ...current.profile, carePreferences: [...parsed.preferences], careNote: parsed.note };
      if (current.onboardingStep === "care") current.onboardingStep = "relation";
      return copy(current);
    },

    async saveRelationType(accountId, relationType) {
      const current = ensure(accountId);
      const parsed = relationSchema.parse({ relationType });
      current.profile = { ...current.profile, relationType: parsed.relationType };
      current.onboardingStep = "complete";
      return copy(current);
    },

    async clearAccount(accountId) {
      accounts.delete(accountId);
    },
  };
}

export const localOnboardingService = createLocalOnboardingService();
