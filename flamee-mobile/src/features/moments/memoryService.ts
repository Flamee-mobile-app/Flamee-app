import { File } from "expo-file-system";
import { authService } from "../auth";
import { createMemoryApi, type MemoryCreateInput, type MemoryUploadFile } from "./memoryApi";

const api = createMemoryApi({ baseUrl: process.env.EXPO_PUBLIC_API_URL ?? "", fileFromUri: (file) => new File(file.uri) });

export const memoryService = {
  list: (page?: { limit: number; offset: number }, signal?: AbortSignal) => authService.withAccessToken((token) => api.list(token, page, signal)),
  detail: (id: string, signal?: AbortSignal) => authService.withAccessToken((token) => api.detail(token, id, signal)),
  create: (input: MemoryCreateInput, key: string) => authService.withAccessToken((token) => api.create(token, input, key)),
  upload: (id: string, file: MemoryUploadFile, key: string) => authService.withAccessToken((token) => api.upload(token, id, file, key)),
};
