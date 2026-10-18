import { z } from "zod";

export type AuthErrorCode = "configuration" | "network" | "timeout" | "credentials" | "duplicateEmail" | "validation" | "server" | "response" | "storage" | "cancelled";

export class AuthError extends Error {
  readonly code: AuthErrorCode;
  constructor(code: AuthErrorCode) {
    super(code);
    this.name = "AuthError";
    this.code = code;
  }
}

const userSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  full_name: z.string(),
  username: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  couple_id: z.string().nullable().optional(),
  created_at: z.string(),
});

const avatarUserSchema = userSchema.extend({
  avatar_url: z.string().regex(/^https?:\/\//i),
});

export type AuthUser = z.infer<typeof userSchema>;
export type AuthApi = ReturnType<typeof createAuthApi>;
export type AuthAvatarFile = Blob | { uri: string; name: string; type: string };

export function createAuthApi({
  baseUrl,
  fetcher = fetch,
  timeoutMs = 12000,
  avatarFileFromUri,
}: {
  baseUrl: string;
  fetcher?: typeof fetch;
  timeoutMs?: number;
  avatarFileFromUri?: (file: { uri: string; name: string; type: string }) => Blob;
}) {
  const request = async (path: string, options: { body?: unknown; formData?: FormData; token?: string; method?: "PUT" }) => {
    const root = baseUrl.trim().replace(/\/+$/, "");
    if (!/^https?:\/\//.test(root)) throw new AuthError("configuration");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetcher(`${root}${path}`, {
        method: options.method ?? (options.body === undefined && !options.formData ? "GET" : "POST"),
        headers: {
          "Accept": "application/json",
          ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
          ...(options.token ? { "Authorization": `Bearer ${options.token}` } : {}),
        },
        body: options.formData ?? (options.body === undefined ? undefined : JSON.stringify(options.body)),
        signal: controller.signal,
      });
      if (!response.ok) {
        if (response.status === 401) throw new AuthError("credentials");
        if (response.status === 409) throw new AuthError("duplicateEmail");
        if (response.status === 400 || response.status === 422) throw new AuthError("validation");
        throw new AuthError("server");
      }
      let result: unknown;
      try { result = await response.json(); } catch { throw new AuthError("response"); }
      const envelope = z.object({ success: z.literal(true), data: z.unknown() }).safeParse(result);
      if (!envelope.success) throw new AuthError("response");
      return envelope.data.data;
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(controller.signal.aborted ? "timeout" : "network");
    } finally {
      clearTimeout(timer);
    }
  };

  const authenticate = async (path: string, body: unknown) => {
    const parsed = z.object({ user: userSchema, access_token: z.string().min(1) }).safeParse(await request(path, { body }));
    if (!parsed.success) throw new AuthError("response");
    return parsed.data;
  };

  return {
    login: (email: string, password: string) => authenticate("/auth/login", { email, password }),
    register: (email: string, password: string, fullName: string) => authenticate("/auth/register", { email, password, full_name: fullName }),
    async me(token: string): Promise<AuthUser> {
      const parsed = userSchema.safeParse(await request("/auth/me", { token }));
      if (!parsed.success) throw new AuthError("response");
      return parsed.data;
    },
    async updateProfile(token: string, profile: { full_name: string; username: string }): Promise<AuthUser> {
      const parsed = userSchema.safeParse(await request("/auth/me", { token, body: profile, method: "PUT" }));
      if (!parsed.success) throw new AuthError("response");
      return parsed.data;
    },
    async uploadAvatar(token: string, file: AuthAvatarFile): Promise<AuthUser> {
      const formData = new FormData();
      if ("uri" in file) {
        // Expo's default fetch encodes Blob/File bytes, not RN URI descriptors.
        if (!avatarFileFromUri) throw new AuthError("configuration");
        formData.append("file", avatarFileFromUri(file), file.name);
      } else {
        formData.append("file", file, "avatar.jpg");
      }
      const parsed = avatarUserSchema.safeParse(await request("/auth/me/avatar", { token, formData }));
      if (!parsed.success) throw new AuthError("response");
      return parsed.data;
    },
  };
}
