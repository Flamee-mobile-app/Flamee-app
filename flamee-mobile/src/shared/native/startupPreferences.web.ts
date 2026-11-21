const key = "flamee.brand-introduction-seen.v1";

export const startupPreferences = {
  hasSeen: async (): Promise<boolean> => globalThis.localStorage.getItem(key) === "true",
  markSeen: async (): Promise<void> => { globalThis.localStorage.setItem(key, "true"); },
};
