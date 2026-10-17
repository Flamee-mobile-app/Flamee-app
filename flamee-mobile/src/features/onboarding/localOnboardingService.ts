import {
  carePreferencesSchema,
  profileSchema,
  relationSchema,
  type ProfileValue,
} from "./schemas.ts";

export type OnboardingStep = "profile" | "care" | "relation" | "complete";

export type LocalAccountSnapshot = {
  accountId: string;
  onboardingStep: OnboardingStep;
  setupStatus: "pending" | "completed" | "deferred";
  setupStep: "profile" | "partner" | "relation";
  consentedAt: string | null;
  consentVersion: string | null;
  profile: ProfileValue & {
    relationType: "long_distance" | "same_city" | null;
    carePreferences: string[];
    careNote: string;
  };
};

export type LocalOnboardingService = {
  initializeAuthenticatedAccount: (accountId: string, profile: { displayName: string; avatarUri: string | null }) => Promise<LocalAccountSnapshot>;
  getAccountSnapshot: (accountId: string) => Promise<LocalAccountSnapshot>;
  saveProfile: (accountId: string, profile: unknown) => Promise<LocalAccountSnapshot>;
  saveCarePreferences: (accountId: string, preferences: string[], note: string) => Promise<LocalAccountSnapshot>;
  saveRelationType: (accountId: string, relationType: string) => Promise<LocalAccountSnapshot>;
  advanceSetup: (accountId: string, step: "partner" | "relation") => Promise<LocalAccountSnapshot>;
  finishSetup: (accountId: string, deferred?: boolean) => Promise<LocalAccountSnapshot>;
  clearAccount: (accountId: string) => Promise<void>;
};

export type LocalOnboardingServiceOptions = {
  timezone?: () => string;
};

export function createLocalOnboardingService({
  timezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
}: LocalOnboardingServiceOptions = {}): LocalOnboardingService {
  const accounts = new Map<string, LocalAccountSnapshot>();

  const ensure = (accountId: string): LocalAccountSnapshot => {
    const existing = accounts.get(accountId);
    if (existing) return existing;
    const created: LocalAccountSnapshot = {
      accountId,
      onboardingStep: "profile",
      setupStatus: "pending",
      setupStep: "profile",
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
    async initializeAuthenticatedAccount(accountId, profile) {
      const current = ensure(accountId);
      if (!current.profile.displayName) current.profile.displayName = profile.displayName;
      if (!current.profile.avatarUri) current.profile.avatarUri = profile.avatarUri;
      return copy(current);
    },

    async getAccountSnapshot(accountId) {
      return copy(ensure(accountId));
    },

    async saveProfile(accountId, input) {
      const current = ensure(accountId);
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

    async advanceSetup(accountId, step) {
      const current = ensure(accountId);
      current.setupStep = step;
      return copy(current);
    },

    async finishSetup(accountId, deferred = false) {
      const current = ensure(accountId);
      current.setupStatus = deferred ? "deferred" : "completed";
      return copy(current);
    },

    async clearAccount(accountId) {
      accounts.delete(accountId);
    },
  };
}

export const localOnboardingService = createLocalOnboardingService();
