import { Platform } from "react-native";
import { authCredentialStore } from "../../shared/native/credentials.ts";
import { createAuthApi } from "./authApi.ts";
import { createAuthService, type AuthCredentialStore } from "./authService.ts";

// Import Platform by name: dynamic import of RN enumerates lazy native exports.
// The domain service is isolated in authService.ts and does not import RN.
// Web intentionally keeps auth in memory instead of persisting bearer tokens.
// Keep the native adapter in the main Metro dependency graph, not an async chunk.
const nativeStore = Platform.OS === "web" ? null : authCredentialStore;

const credentials: AuthCredentialStore = {
  read: async () => nativeStore?.read() ?? null,
  write: async (token) => { await nativeStore?.write(token); },
  clear: async () => { await nativeStore?.clear(); },
};

export const authService = createAuthService({
  api: createAuthApi({ baseUrl: process.env.EXPO_PUBLIC_API_URL ?? "" }),
  credentials,
});
