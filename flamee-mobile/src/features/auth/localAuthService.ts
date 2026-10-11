import { normalizeVietnamesePhone } from "./schemas.ts";
import { isMockLoginEnabled } from "./mockLoginMode.ts";

export type LocalSession = {
  accountId: string;
  createdAt: string;
};

export type LocalAuthService = {
  getCurrentSession: () => Promise<LocalSession | null>;
  continueOnThisDevice: (phone: string) => Promise<LocalSession>;
  continueWithMockSession: () => Promise<LocalSession>;
  signOut: () => Promise<void>;
  deleteAccount: (accountId: string) => Promise<void>;
};

export type LocalAuthServiceOptions = {
  createAccountId?: () => string;
  now?: () => Date;
};

export function createLocalAuthService({
  createAccountId,
  now = () => new Date(),
}: LocalAuthServiceOptions = {}): LocalAuthService {
  const accountIdsByPhone = new Map<string, string>();
  const phonesByAccountId = new Map<string, Set<string>>();
  let activeSession: LocalSession | null = null;
  let mockAccountId: string | null = null;
  let generatedAccountId = 0;

  const makeAccountId = createAccountId ?? (() => `local-account-${Date.now()}-${++generatedAccountId}`);

  return {
    async getCurrentSession() {
      return activeSession ? { ...activeSession } : null;
    },

    async continueOnThisDevice(phone) {
      const normalizedPhone = normalizeVietnamesePhone(phone);
      if (!/^\+84[35789]\d{8}$/.test(normalizedPhone)) {
        throw new Error("Invalid phone number for local session.");
      }

      const accountId = accountIdsByPhone.get(normalizedPhone) ?? makeAccountId();
      accountIdsByPhone.set(normalizedPhone, accountId);
      const accountPhones = phonesByAccountId.get(accountId) ?? new Set<string>();
      accountPhones.add(normalizedPhone);
      phonesByAccountId.set(accountId, accountPhones);
      activeSession = { accountId, createdAt: now().toISOString() };
      return { ...activeSession };
    },

    async signOut() {
      activeSession = null;
    },

    async continueWithMockSession() {
      if (!isMockLoginEnabled()) throw new Error("Mock login is disabled.");
      // No email, password, phone or verified identity is attached to this session.
      // Reuse the same local account after sign-out during the current process.
      mockAccountId ??= `mock-${makeAccountId()}`;
      activeSession = { accountId: mockAccountId, createdAt: now().toISOString() };
      return { ...activeSession };
    },

    async deleteAccount(accountId) {
      if (mockAccountId === accountId) mockAccountId = null;
      for (const phone of phonesByAccountId.get(accountId) ?? []) accountIdsByPhone.delete(phone);
      phonesByAccountId.delete(accountId);
      if (activeSession?.accountId === accountId) activeSession = null;
    },
  };
}

export const localAuthService = createLocalAuthService();
