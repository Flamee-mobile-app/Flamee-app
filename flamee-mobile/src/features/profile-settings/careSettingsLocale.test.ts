import assert from "node:assert/strict";
import test from "node:test";
import { getCareSettingsCopy, resolveCareLocale } from "./careSettingsLocale.ts";

test("care settings use the saved locale and Vietnamese before loading", () => {
  assert.equal(resolveCareLocale("vi"), "vi");
  assert.equal(resolveCareLocale("en"), "en");
  assert.equal(resolveCareLocale(null), "vi");
});

test("care settings provide localized title, fields, statuses and save feedback", () => {
  const vi = getCareSettingsCopy("vi");
  const en = getCareSettingsCopy("en");
  for (const key of Object.keys(vi) as (keyof typeof vi)[]) {
    assert.ok(vi[key].length > 0 && en[key].length > 0, key);
    assert.notEqual(vi[key], en[key], key);
  }
});
