import { MoodApiError, type CreateMoodInput } from "./moodApi.ts";

/** Do not POST to a server that can trigger nudges from only one person's mood. */
export function createGatedMoodSubmit<T>(api: { capabilities: (token: string) => Promise<{ dual_mood_nudge: boolean }>; create: (token: string, body: CreateMoodInput, key: string) => Promise<T> }, auth: { withAccessToken: <R>(action: (token: string) => Promise<R>) => Promise<R> }) {
  return (body: CreateMoodInput, key: string) => auth.withAccessToken(async (token) => {
    let supported = false;
    try { supported = (await api.capabilities(token)).dual_mood_nudge; }
    catch (error) {
      if (error instanceof MoodApiError && error.code === "unauthorized") throw error;
      throw new MoodApiError("unavailable");
    }
    if (!supported) throw new MoodApiError("unavailable");
    return api.create(token, body, key);
  });
}
