import type { AuthService } from "../auth/index.ts";
import type { createOnboardingApi } from "./onboardingApi.ts";

export function createOnboardingService(api: ReturnType<typeof createOnboardingApi>, auth: Pick<AuthService, "withAccessToken">) {
  return {
    read: (signal?: AbortSignal) => auth.withAccessToken((token) => api.read(token, signal)),
    skip: () => auth.withAccessToken((token) => api.skip(token)),
  };
}
