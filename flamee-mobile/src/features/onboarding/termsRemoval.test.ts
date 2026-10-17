import assert from "node:assert/strict";
import test from "node:test";
import { profileSettingsSections, settingsSections } from "../profile-settings/settingsSections.ts";

test("settings navigation exposes no terms or privacy page", () => {
  assert.equal(settingsSections.includes("privacy" as never), false);
  assert.deepEqual(settingsSections, ["menu", "profile", "care", "notifications", "data", "support", "account"]);
  assert.deepEqual(profileSettingsSections, ["profile", "care", "notifications", "data", "support", "account"]);
});
