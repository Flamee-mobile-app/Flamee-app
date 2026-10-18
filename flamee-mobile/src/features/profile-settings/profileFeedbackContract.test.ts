import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

test("profile edit reports async failures with toast instead of inline status banners", () => {
  const source = readFileSync(join(process.cwd(), "src/features/profile-settings/pages/ProfileEditScreen.tsx"), "utf8");

  assert.doesNotMatch(source, /StatusBanner/);
  assert.match(source, /appToast\.error\(getMessage\("vi", "settingsLoadError"\)\)/);
  assert.match(source, /appToast\.error\(getMessage\("vi", "profileSaveFailed"\)\)/);
  assert.match(source, /appToast\.error\(getMessage\("vi", "profileAvatarUploadFailed"\)\)/);
});
