import { AuthError, type AuthApi, type AuthAvatarFile, type AuthUser } from "./authApi.ts";

export type AuthSession = { accountId: string; user: AuthUser };
export type AuthCredentialStore = {
  read: () => Promise<string | null>;
  write: (token: string) => Promise<void>;
  clear: () => Promise<void>;
};

export type AuthService = ReturnType<typeof createAuthService>;

export function createAuthService({ api, credentials, onSessionChanged, onSessionExpired }: {
  api: AuthApi;
  credentials: AuthCredentialStore;
  onSessionChanged?: (session: AuthSession | null) => void;
  onSessionExpired?: () => void;
}) {
  let session: AuthSession | null = null;
  let accessToken: string | null = null;
  let refreshToken: string | null = null;
  let remembered = false;
  let refreshing: Promise<void> | null = null;
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
  const encodedCredential = (access: string, refresh: string | null) => refresh
    ? JSON.stringify({ version: 2, access_token: access, refresh_token: refresh }) : access;
  const unauthorized = (error: unknown) => error instanceof Error && "code" in error
    && (error.code === "credentials" || error.code === "unauthorized");
  const expire = async (request: number) => {
    if (request !== generation) return;
    const clearedGeneration = ++generation;
    accessToken = null;
    refreshToken = null;
    remembered = false;
    publishSession(null);
    onSessionExpired?.();
    await store(async () => { if (clearedGeneration === generation) await credentials.clear(); }).catch(() => undefined);
  };
  const renew = async (request: number) => {
    if (refreshing) return refreshing;
    const work = (async () => {
      if (!refreshToken) { await expire(request); throw new AuthError("credentials"); }
      const owner = session?.accountId;
      const revision = profileRevision;
      try {
        const result = await api.refresh(refreshToken);
        if (request !== generation) throw new AuthError("cancelled");
        if (!result.refresh_token || owner && result.user.id !== owner) throw new AuthError("response");
        if (remembered) {
          try {
            await store(async () => {
              if (request !== generation) throw new AuthError("cancelled");
              await credentials.write(encodedCredential(result.access_token, result.refresh_token!));
            });
          } catch (error) {
            if (error instanceof AuthError) throw error;
            await expire(request);
            throw new AuthError("storage");
          }
        }
        if (request !== generation) throw new AuthError("cancelled");
        accessToken = result.access_token;
        refreshToken = result.refresh_token;
        if (revision === profileRevision) publishSession({ accountId: result.user.id, user: result.user });
        profileRevision += 1;
      } catch (error) {
        if (unauthorized(error)) await expire(request);
        throw error;
      }
    })();
    refreshing = work;
    try { await work; } finally { if (refreshing === work) refreshing = null; }
  };
  const withAccessToken = async <T>(operation: (token: string) => Promise<T>): Promise<T> => {
    const request = generation;
    const token = accessToken;
    if (!token) { await expire(request); throw new AuthError("credentials"); }
    try {
      const result = await operation(token);
      if (request !== generation) throw new AuthError("cancelled");
      return result;
    } catch (error) {
      if (!unauthorized(error)) throw error;
      if (request !== generation) throw new AuthError("cancelled");
      if (token === accessToken) await renew(request);
      if (request !== generation || !accessToken) throw new AuthError("cancelled");
      try {
        const result = await operation(accessToken);
        if (request !== generation) throw new AuthError("cancelled");
        return result;
      } catch (retryError) {
        if (unauthorized(retryError)) await expire(request);
        throw retryError;
      }
    }
  };
  const begin = async (operation: () => ReturnType<AuthApi["login"]>, remember: boolean) => {
    const request = ++generation;
    refreshing = null;
    const result = await operation();
    if (request !== generation) throw new AuthError("cancelled");
    try {
      await store(async () => {
        if (request !== generation) throw new AuthError("cancelled");
        if (remember) await credentials.write(encodedCredential(result.access_token, result.refresh_token ?? null));
        else await credentials.clear();
      });
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError("storage");
    }
    if (request !== generation) throw new AuthError("cancelled");
    accessToken = result.access_token;
    refreshToken = result.refresh_token ?? null;
    remembered = remember;
    const next = { accountId: result.user.id, user: result.user };
    publishSession(next);
    return copy(next);
  };

  return {
    getAccessToken: (): string | null => accessToken,
    withAccessToken,
    getSessionSnapshot: (): AuthSession | null => session ? copy(session) : null,
    login: (email: string, password: string, remember = false) => begin(() => api.login(email, password), remember),
    register: (email: string, password: string, fullName: string) => begin(() => api.register(email, password, fullName), false),
    async getCurrentSession(): Promise<AuthSession | null> {
      if (session) return copy(session);
      const request = generation;
      let token: string | null;
      try { token = await credentials.read(); } catch { throw new AuthError("storage"); }
      if (!token || request !== generation) return null;
      accessToken = token;
      refreshToken = null;
      remembered = true;
      if (token.startsWith("{")) {
        try {
          const saved = JSON.parse(token);
          if (typeof saved.access_token !== "string" || typeof saved.refresh_token !== "string") throw new Error("Invalid saved credentials");
          accessToken = saved.access_token;
          refreshToken = saved.refresh_token;
        } catch { await expire(request); return null; }
      }
      try {
        const user = await withAccessToken(api.me);
        if (request !== generation) return null;
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
      const user = await withAccessToken(api.me);
      if (request !== generation) return null;
      if (revision !== profileRevision) return session ? copy(session) : null;
      const next = { accountId: user.id, user };
      publishSession(next);
      return copy(next);
    },
    async signOut() {
      ++generation;
      refreshing = null;
      publishSession(null);
      accessToken = null;
      refreshToken = null;
      remembered = false;
      try { await store(() => credentials.clear()); } catch { throw new AuthError("storage"); }
    },
    async updateProfile(profile: { full_name: string; username: string }): Promise<AuthSession> {
      if (!accessToken || !session) throw new AuthError("credentials");
      const request = generation;
      const accountId = session.accountId;
      const user = await withAccessToken((token) => api.updateProfile(token, profile));
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
      const user = await withAccessToken((token) => api.uploadAvatar(token, file));
      if (request !== generation) throw new AuthError("cancelled");
      if (user.id !== accountId) throw new AuthError("response");
      profileRevision += 1;
      const next = { accountId, user };
      publishSession(next);
      return copy(next);
    },
  };
}
