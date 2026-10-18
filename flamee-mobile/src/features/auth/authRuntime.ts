import { Platform } from "react-native";
import { File } from "expo-file-system";
import { authCredentialStore } from "../../shared/native/credentials.ts";
import { useSessionStore } from "../../shared/state/sessionStore";
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
  api: createAuthApi({
    baseUrl: process.env.EXPO_PUBLIC_API_URL ?? "",
    avatarFileFromUri: (file) => new File(file.uri),
  }),
  credentials,
  onSessionChanged: (session) => {
    const state = useSessionStore.getState();
    if (!session || state.activeAccountId === session.accountId) {
      state.setActiveAvatar(session?.user.avatar_url ?? null);
    }
  },
});
