import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const source = readFileSync(join(process.cwd(), "src", "features", "auth", "pages", "AuthScreen.tsx"), "utf8");

test("places account registration after the final login action", () => {
  const signupPosition = source.lastIndexOf('getMessage("vi", "loginNoAccount")');
  const googlePosition = source.lastIndexOf('getMessage("vi", "signInGoogle")');

  assert.ok(googlePosition >= 0, "Google action should remain in the login form");
  assert.ok(signupPosition > googlePosition, "Registration prompt should be the last login-form section");
});

test("does not expose the mock-login implementation notice", () => {
  assert.doesNotMatch(source, /loginMockNotice/);
});

test("anchors the login surface independently from form content height", async () => {
  const model = await import("./loginLayoutModel.ts").catch(() => null);

  assert.ok(model, "login layout model should exist");
  assert.equal(model.resolveLoginHeroHeight(0), 260);
  assert.equal(model.resolveLoginHeroHeight(47), 307);
});

test("keeps the login surface compact and independent from viewport height", async () => {
  const model = await import("./loginLayoutModel.ts");

  assert.deepEqual(model.resolveLoginLayout({
    topInset: 47,
    bottomInset: 34,
  }), {
    heroHeight: 307,
    surfacePaddingBottom: 34,
    titleGap: 16,
    footerTopGap: 16,
  });
});
