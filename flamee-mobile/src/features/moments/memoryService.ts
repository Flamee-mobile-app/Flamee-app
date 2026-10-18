import { authService } from "../auth";
import { createMemoryApi } from "./memoryApi";

const api = createMemoryApi({ baseUrl: process.env.EXPO_PUBLIC_API_URL ?? "" });

export const memoryService = {
  list: () => authService.withAccessToken(api.list),
};
