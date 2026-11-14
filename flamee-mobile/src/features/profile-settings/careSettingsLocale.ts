import { getMessage, type Locale, type MessageKey } from "../../shared/localization/messages.ts";

export function resolveCareLocale(preferred: Locale | null): Locale {
  return preferred ?? "vi";
}

export function getCareSettingsCopy(locale: Locale) {
  const keys = {
    title: "careSettingsTitle", back: "back", loading: "loadingTitle", readTitle: "errorTitle", readError: "carePreferencesReadError", retry: "retry",
    saved: "carePreferencesSaved", body: "careBody", encouragement: "careEncouragement", voice: "careVoice", photo: "carePhoto",
    call: "careCall", space: "careSpace", gift: "careGift", note: "careNoteLabel", notePlaceholder: "careNotePlaceholder",
    nickname: "nicknameLabel", nicknamePlaceholder: "nicknamePlaceholder", relationship: "relationTitle", none: "carePreferencesNone",
    longDistance: "relationLongDistance", sameCity: "relationSameCity", conflict: "carePreferencesConflict", saveError: "carePreferencesSaveError",
    reload: "carePreferencesReload", save: "save",
  } as const satisfies Record<string, MessageKey>;
  return Object.fromEntries(Object.entries(keys).map(([name, key]) => [name, getMessage(locale, key)])) as { [K in keyof typeof keys]: string };
}
