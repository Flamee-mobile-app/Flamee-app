import assert from "node:assert/strict";
import test from "node:test";
import { passwordChangeSchema } from "./passwordChangeSchema.ts";

test("password change validates both secrets and an exact matching confirmation without trimming", () => {
  const valid = { currentPassword: " old secret ", newPassword: " new secret ", confirmPassword: " new secret " };
  assert.deepEqual(passwordChangeSchema.parse(valid), valid);
  assert.equal(passwordChangeSchema.safeParse({ ...valid, currentPassword: "" }).success, false);
  assert.equal(passwordChangeSchema.safeParse({ ...valid, newPassword: "short", confirmPassword: "short" }).success, false);
  assert.equal(passwordChangeSchema.safeParse({ ...valid, confirmPassword: "new secret" }).success, false);
  assert.equal(passwordChangeSchema.safeParse({ ...valid, newPassword: "x".repeat(129), confirmPassword: "x".repeat(129) }).success, false);
});
