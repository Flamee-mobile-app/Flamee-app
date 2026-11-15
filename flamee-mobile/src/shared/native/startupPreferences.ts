import { SQLiteStorage } from "expo-sqlite/kv-store";

// Only a UI preference; never store session or account data in this database.
const storage = new SQLiteStorage("flamee-startup-preferences.db");
const key = "brand-introduction-seen.v1";

export const startupPreferences = {
  hasSeen: async (): Promise<boolean> => (await storage.getItemAsync(key)) === "true",
  markSeen: (): Promise<void> => storage.setItemAsync(key, "true"),
};
