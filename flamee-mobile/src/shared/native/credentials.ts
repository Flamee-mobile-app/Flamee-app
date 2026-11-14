import * as SecureStore from "expo-secure-store";

const REFRESH_CREDENTIAL_KEY = "flamee.refresh-credential";
const AUTH_ACCESS_TOKEN_KEY = "flamee.auth.access-token.v1";

export const authCredentialStore = {
  read: (): Promise<string | null> => SecureStore.getItemAsync(AUTH_ACCESS_TOKEN_KEY),
  write: (token: string): Promise<void> => SecureStore.setItemAsync(AUTH_ACCESS_TOKEN_KEY, token, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  }),
  clear: (): Promise<void> => SecureStore.deleteItemAsync(AUTH_ACCESS_TOKEN_KEY),
};

export const credentialStore = {
  read: (): Promise<string | null> => SecureStore.getItemAsync(REFRESH_CREDENTIAL_KEY),
  write: (credential: string): Promise<void> =>
    SecureStore.setItemAsync(REFRESH_CREDENTIAL_KEY, credential),
  clear: (): Promise<void> => SecureStore.deleteItemAsync(REFRESH_CREDENTIAL_KEY),
};
