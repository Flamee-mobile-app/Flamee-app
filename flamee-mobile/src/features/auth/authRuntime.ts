import { Platform } from "react-native";
import { File } from "expo-file-system";
import { router } from "expo-router";
import { appToast } from "../../shared/components/AppToast";
import { getMessage } from "../../shared/localization/messages";
import { authCredentialStore } from "../../shared/native/credentials.ts";
import { useSessionStore } from "../../shared/state/sessionStore";
import { createAuthApi } from "./authApi.ts";
import { createAuthService, type AuthCredentialStore } from "./authService.ts";
import { synchronizeAuthSession } from "./authSessionSync.ts";

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
  getMembershipRevision: () => useSessionStore.getState().membershipRevision,
  getMembershipSnapshot: () => {
    const state = useSessionStore.getState();
    return { accountId: state.activeAccountId, coupleId: state.activeCoupleId, revision: state.membershipRevision };
  },
  onSessionExpired: () => {
    const state = useSessionStore.getState();
    if (!state.activeAccountId) return;
    state.reset();
    appToast.warning(getMessage("vi", "sessionExpiredTitle"));
    router.replace("/(auth)");
  },
  onSessionChanged: synchronizeAuthSession,
});
