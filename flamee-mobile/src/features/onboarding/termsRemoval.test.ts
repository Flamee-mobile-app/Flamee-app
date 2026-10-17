import assert from "node:assert/strict";
import test from "node:test";
import { createLocalCheckInService } from "../checkins/localCheckInService.ts";
import { profileSettingsSections, settingsSections } from "../profile-settings/settingsSections.ts";
import { createLocalOnboardingService } from "./localOnboardingService.ts";

test("new accounts start at profile and save setup without recording legal consent", async () => {
  const service = createLocalOnboardingService({ timezone: () => "UTC" });
  const initial = await service.getAccountSnapshot("account-a");
  assert.equal(initial.onboardingStep, "profile");
  assert.equal(initial.consentedAt, null);

  const profile = await service.saveProfile("account-a", {
    displayName: "An",
    partnerNickname: "",
    avatarUri: null,
    timezone: "UTC",
  });
  assert.equal(profile.profile.displayName, "An");
  assert.equal(profile.consentedAt, null);

  const care = await service.saveCarePreferences("account-a", ["voice"], "Nhắc mình nghỉ một chút");
  assert.deepEqual(care.profile.carePreferences, ["voice"]);
  assert.equal(care.consentedAt, null);
});

test("emotion notes no longer require a terms-consent gate", async () => {
  const service = createLocalCheckInService({
    timezoneForAccount: () => "UTC",
    now: () => new Date("2026-10-14T08:00:00.000Z"),
  });
  const result = await service.submit("account-without-consent", {
    emotionId: "calm",
    customEmotionLabel: null,
    note: "Mình đang bình yên.",
    mascotStickerId: null,
  });
  assert.notEqual(result.kind, "error");
});

test("settings navigation exposes no terms or privacy page", () => {
  assert.equal(settingsSections.includes("privacy" as never), false);
  assert.deepEqual(settingsSections, ["menu", "profile", "care", "notifications", "data", "support", "account"]);
  assert.deepEqual(profileSettingsSections, ["profile", "care", "notifications", "data", "support", "account"]);
});
