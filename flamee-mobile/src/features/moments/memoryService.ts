import { File } from "expo-file-system";
import { authService } from "../auth";
import { useSessionStore } from "../../shared/state/sessionStore";
import { isMemoryMutationScopeCurrent, runScopedMemoryMutation } from "./memoryMutationScope";
import type { MemoryScope } from "./memoryQueries";
import { createMemoryApi, type MemoryCreateInput, type MemoryUpdateInput, type MemoryUploadFile } from "./memoryApi";

const api = createMemoryApi({ baseUrl: process.env.EXPO_PUBLIC_API_URL ?? "", fileFromUri: (file) => new File(file.uri) });

function mutate<T>(scope: MemoryScope, operation: (token: string) => Promise<T>) {
  const revision = useSessionStore.getState().membershipRevision;
  return authService.withAccessToken((token) => runScopedMemoryMutation(
    () => isMemoryMutationScopeCurrent(scope, useSessionStore.getState()) && useSessionStore.getState().membershipRevision === revision,
    () => operation(token),
  ));
}

export const memoryService = {
  list: (page?: { limit: number; offset: number }, signal?: AbortSignal) => authService.withAccessToken((token) => api.list(token, page, signal)),
  detail: (id: string, signal?: AbortSignal) => authService.withAccessToken((token) => api.detail(token, id, signal)),
  create: (input: MemoryCreateInput, key: string) => authService.withAccessToken((token) => api.create(token, input, key)),
  update: (scope: MemoryScope, id: string, input: MemoryUpdateInput) => mutate(scope, (token) => api.update(token, id, input)),
  remove: (scope: MemoryScope, id: string) => mutate(scope, (token) => api.remove(token, id)),
  removeImage: (scope: MemoryScope, id: string, imageId: string) => mutate(scope, (token) => api.removeImage(token, id, imageId)),
  upload: (id: string, file: MemoryUploadFile, key: string) => authService.withAccessToken((token) => api.upload(token, id, file, key)),
};
