import { AuthError, type AuthApi, type AuthUser } from "./authApi.ts";

export type AuthSession = { accountId: string; user: AuthUser };
export type AuthCredentialStore = {
  read: () => Promise<string | null>;
  write: (token: string) => Promise<void>;
  clear: () => Promise<void>;
};

export type AuthService = ReturnType<typeof createAuthService>;

export function createAuthService({ api, credentials }: { api: AuthApi; credentials: AuthCredentialStore }) {
  let session: AuthSession | null = null;
  let accessToken: string | null = null;
  let generation = 0;
  let storageQueue: Promise<void> = Promise.resolve();
  const store = (action: () => Promise<void>) => {
    const work = storageQueue.then(action);
    storageQueue = work.catch(() => undefined);
    return work;
  };
  const copy = (value: AuthSession): AuthSession => ({ accountId: value.accountId, user: { ...value.user } });
  const begin = async (operation: () => ReturnType<AuthApi["login"]>, remember: boolean) => {
    const request = ++generation;
    const result = await operation();
    if (request !== generation) throw new AuthError("cancelled");
    try {
      await store(async () => {
        if (request !== generation) throw new AuthError("cancelled");
        if (remember) await credentials.write(result.access_token);
        else await credentials.clear();
      });
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError("storage");
    }
    if (request !== generation) throw new AuthError("cancelled");
    accessToken = result.access_token;
    session = { accountId: result.user.id, user: result.user };
    return copy(session);
  };

  return {
    getAccessToken: (): string | null => accessToken,
    login: (email: string, password: string, remember = false) => begin(() => api.login(email, password), remember),
    register: (email: string, password: string, fullName: string) => begin(() => api.register(email, password, fullName), false),
    async getCurrentSession(): Promise<AuthSession | null> {
      if (session) return copy(session);
      const request = generation;
      let token: string | null;
      try { token = await credentials.read(); } catch { throw new AuthError("storage"); }
      if (!token || request !== generation) return null;
      try {
        const user = await api.me(token);
        if (request !== generation) return null;
        accessToken = token;
        session = { accountId: user.id, user };
        return copy(session);
      } catch (error) {
        if (error instanceof AuthError && error.code === "credentials") {
          await store(async () => { if (request === generation) await credentials.clear(); });
          return null;
        }
        throw error;
      }
    },
    async refreshCurrentSession(): Promise<AuthSession | null> {
      if (!accessToken) return null;
      const request = generation;
      const user = await api.me(accessToken);
      if (request !== generation) return null;
      session = { accountId: user.id, user };
      return copy(session);
    },
    async signOut() {
      ++generation;
      session = null;
      accessToken = null;
      try { await store(() => credentials.clear()); } catch { throw new AuthError("storage"); }
    },
  };
}
