import * as SecureStore from "expo-secure-store";

const REFRESH_CREDENTIAL_KEY = "flamee.refresh-credential";

export const credentialStore = {
  read: (): Promise<string | null> => SecureStore.getItemAsync(REFRESH_CREDENTIAL_KEY),
  write: (credential: string): Promise<void> =>
    SecureStore.setItemAsync(REFRESH_CREDENTIAL_KEY, credential),
  clear: (): Promise<void> => SecureStore.deleteItemAsync(REFRESH_CREDENTIAL_KEY),
};
