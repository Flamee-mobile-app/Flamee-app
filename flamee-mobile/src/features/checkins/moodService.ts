import { authService } from "../auth";
import { createMoodApi } from "./moodApi";

const api = createMoodApi({ baseUrl: process.env.EXPO_PUBLIC_API_URL ?? "" });
export const moodService = {
  partner: (signal?: AbortSignal) => authService.withAccessToken((token) => api.partner(token, signal)),
  history: (page: { limit: number; offset: number }, signal?: AbortSignal) => authService.withAccessToken((token) => api.history(token, page, signal)),
};
