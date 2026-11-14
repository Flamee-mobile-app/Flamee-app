import assert from "node:assert/strict";
import test from "node:test";
import { profileSettingsSections, resolveSettingsSection, settingsSections } from "../profile-settings/settingsSections.ts";

test("settings navigation exposes no terms or privacy page", () => {
  assert.equal(settingsSections.includes("privacy" as never), false);
  assert.deepEqual(settingsSections, ["menu", "password", "profile", "care", "notifications", "data", "support", "account"]);
  assert.deepEqual(profileSettingsSections, ["profile", "care", "notifications", "data", "support", "account"]);
  assert.equal(resolveSettingsSection("password"), "password");
  assert.equal(resolveSettingsSection("privacy"), "menu");
  assert.equal(resolveSettingsSection("terms"), "menu");
});
