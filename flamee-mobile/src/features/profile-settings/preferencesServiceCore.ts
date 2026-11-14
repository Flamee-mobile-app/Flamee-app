import type { AuthService } from "../auth/index.ts";
import type { createPreferencesApi, Preferences } from "./preferencesApi.ts";

export function createPreferencesService(api: ReturnType<typeof createPreferencesApi>, auth: Pick<AuthService, "withAccessToken">) {
  return {
    read: (signal?: AbortSignal) => auth.withAccessToken((token) => api.read(token, signal)),
    save: (input: Preferences, signal?: AbortSignal) => auth.withAccessToken((token) => api.save(token, input, signal)),
  };
}
