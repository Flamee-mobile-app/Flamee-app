import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const readSource = (...parts: string[]) => readFileSync(join(process.cwd(), "src", "features", ...parts), "utf8");

test("keeps timezone internal instead of rendering it in profile forms and summary", () => {
  const onboarding = readSource("onboarding", "pages", "OnboardingScreen.tsx");
  const settings = readSource("profile-settings", "pages", "SettingsScreen.tsx");
  const profile = readSource("profile-settings", "pages", "ProfileScreen.tsx");

  assert.doesNotMatch(onboarding, /timezoneLabel/);
  assert.doesNotMatch(settings, /timezoneLabel/);
  assert.doesNotMatch(profile, /profile\.timezone/);
});
