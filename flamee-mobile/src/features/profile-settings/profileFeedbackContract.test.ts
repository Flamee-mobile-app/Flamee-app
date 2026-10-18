import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

test("profile edit reports async failures with toast instead of inline status banners", () => {
  const source = readFileSync(join(process.cwd(), "src/features/profile-settings/pages/ProfileEditScreen.tsx"), "utf8");
  const saveSource = source.slice(source.indexOf("const save = async"), source.indexOf("const pickAvatar"));

  assert.doesNotMatch(source, /StatusBanner/);
  assert.match(saveSource, /appToast\.loading\(getMessage\("vi", "profileSaving"\)\)/);
  assert.match(source, /appToast\.error\(getMessage\("vi", "settingsLoadError"\)\)/);
  assert.match(source, /appToast\.error\(getMessage\("vi", "profileSaveFailed"\)\)/);
  assert.match(source, /appToast\.error\(getMessage\("vi", "profileAvatarUploadFailed"\)/);
  assert.ok(
    saveSource.indexOf('appToast.success(getMessage("vi", "settingsSaved"))')
      < saveSource.indexOf("localMediaAdapter.cleanup(draft.uri)"),
    "success feedback must not wait for temporary-file cleanup",
  );
  assert.match(source, /getMessage\("vi", saving \? "profileSaving" : saved \? "profileSavedAction" : "save"\)/);
});
