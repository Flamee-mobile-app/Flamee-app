import { AuthError, type AuthApi, type AuthAvatarFile, type AuthUser } from "./authApi.ts";

export type AuthSession = { accountId: string; user: AuthUser };
export type AuthCredentialStore = {
  read: () => Promise<string | null>;
  write: (token: string) => Promise<void>;
  clear: () => Promise<void>;
};

export type AuthService = ReturnType<typeof createAuthService>;

export function createAuthService({ api, credentials, onSessionChanged }: {
  api: AuthApi;
  credentials: AuthCredentialStore;
  onSessionChanged?: (session: AuthSession | null) => void;
}) {
  let session: AuthSession | null = null;
  let accessToken: string | null = null;
  let generation = 0;
  let profileRevision = 0;
  let storageQueue: Promise<void> = Promise.resolve();
  const store = (action: () => Promise<void>) => {
    const work = storageQueue.then(action);
    storageQueue = work.catch(() => undefined);
    return work;
  };
  const copy = (value: AuthSession): AuthSession => ({ accountId: value.accountId, user: { ...value.user } });
  const publishSession = (value: AuthSession | null) => {
    session = value;
    onSessionChanged?.(value ? copy(value) : null);
  };
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
    const next = { accountId: result.user.id, user: result.user };
    publishSession(next);
    return copy(next);
  };

  return {
    getAccessToken: (): string | null => accessToken,
    getSessionSnapshot: (): AuthSession | null => session ? copy(session) : null,
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
        const next = { accountId: user.id, user };
        publishSession(next);
        return copy(next);
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
      const revision = profileRevision;
      const user = await api.me(accessToken);
      if (request !== generation) return null;
      if (revision !== profileRevision) return session ? copy(session) : null;
      const next = { accountId: user.id, user };
      publishSession(next);
      return copy(next);
    },
    async signOut() {
      ++generation;
      publishSession(null);
      accessToken = null;
      try { await store(() => credentials.clear()); } catch { throw new AuthError("storage"); }
    },
    async updateProfile(profile: { full_name: string; username: string }): Promise<AuthSession> {
      if (!accessToken || !session) throw new AuthError("credentials");
      const request = generation;
      const accountId = session.accountId;
      const user = await api.updateProfile(accessToken, profile);
      if (request !== generation) throw new AuthError("cancelled");
      if (user.id !== accountId) throw new AuthError("response");
      profileRevision += 1;
      const next = { accountId, user };
      publishSession(next);
      return copy(next);
    },
    async updateAvatar(file: AuthAvatarFile): Promise<AuthSession> {
      if (!accessToken || !session) throw new AuthError("credentials");
      const request = generation;
      const accountId = session.accountId;
      const user = await api.uploadAvatar(accessToken, file);
      if (request !== generation) throw new AuthError("cancelled");
      if (user.id !== accountId) throw new AuthError("response");
      profileRevision += 1;
      const next = { accountId, user };
      publishSession(next);
      return copy(next);
    },
  };
}
