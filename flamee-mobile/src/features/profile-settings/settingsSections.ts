export const profileSettingsSections = ["profile", "care", "notifications", "data", "support", "account"] as const;
export const settingsSections = ["menu", ...profileSettingsSections] as const;

export type SettingsSection = (typeof settingsSections)[number];

export function resolveSettingsSection(value: string): SettingsSection {
  return settingsSections.includes(value as SettingsSection) ? value as SettingsSection : "menu";
}
