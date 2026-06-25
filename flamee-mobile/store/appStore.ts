import { create } from 'zustand';

type AppState = {
  hydrated: boolean;
  themePreference: 'system' | 'light' | 'dark';
  setHydrated: (hydrated: boolean) => void;
  setThemePreference: (themePreference: AppState['themePreference']) => void;
};

export const useAppStore = create<AppState>((set) => ({
  hydrated: false,
  themePreference: 'system',
  setHydrated: (hydrated) => set({ hydrated }),
  setThemePreference: (themePreference) => set({ themePreference }),
}));
