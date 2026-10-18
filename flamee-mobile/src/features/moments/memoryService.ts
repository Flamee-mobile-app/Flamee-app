import { authService } from "../auth";
import { createMemoryApi, MemoryApiError } from "./memoryApi";

const api = createMemoryApi({ baseUrl: process.env.EXPO_PUBLIC_API_URL ?? "" });

export const memoryService = {
  list: () => {
    const token = authService.getAccessToken();
    if (!token) return Promise.reject(new MemoryApiError("unauthorized"));
    return api.list(token);
  },
};
