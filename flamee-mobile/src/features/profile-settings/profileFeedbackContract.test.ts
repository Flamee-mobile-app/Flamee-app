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

test("profile keeps raw avatar preview separate from its prepared upload draft", () => {
  const source = readFileSync(join(process.cwd(), "src/features/profile-settings/pages/ProfileEditScreen.tsx"), "utf8");
  assert.match(source, /purpose: "avatar"/);
  assert.match(source, /onPreview:/);
  assert.match(source, /preparingAvatar\?\.uri \?\? avatarDraft\?\.uri/);
  assert.match(source, /setPreparingAvatar\(null\)/);
});

test("profile name and username fields use the white outlined surface", () => {
  const source = readFileSync(join(process.cwd(), "src/features/profile-settings/pages/ProfileEditScreen.tsx"), "utf8");
  const fields = source.match(/<AppField[^>]*surfaceTone="outlined"[^>]*>/g) ?? [];
  assert.equal(fields.length, 2);
});
