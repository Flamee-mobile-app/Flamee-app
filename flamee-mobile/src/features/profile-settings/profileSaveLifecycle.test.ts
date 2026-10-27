import assert from "node:assert/strict";
import test from "node:test";
import * as lifecycleModule from "./profileSaveLifecycle.ts";

test("a retained screen settles a failed save after blur/refocus without deleting its retry draft", () => {
  const lifecycle = lifecycleModule.createProfileSaveLifecycle();
  lifecycle.retain("account-one");
  const operation = lifecycle.begin("account-one")!;
  // Focus/refresh revisions are intentionally independent of screen ownership.
  assert.equal(lifecycle.isSaving(), true);
  assert.equal(lifecycle.canApply(operation, "account-one"), true);
  const settlement = lifecycle.settle(operation, "account-one");
  assert.deepEqual(settlement, { render: true, saving: false, cleanup: false });
  assert.ok(lifecycle.begin("account-one"), "the retained draft can be retried");
});

test("true disposal cleans a pending draft after settlement without updating an unmounted screen", () => {
  const lifecycle = lifecycleModule.createProfileSaveLifecycle();
  lifecycle.retain("account-one");
  const operation = lifecycle.begin("account-one")!;
  lifecycle.release();
  assert.equal(lifecycle.canApply(operation, "account-one"), false);
  assert.deepEqual(lifecycle.settle(operation, "account-one"), { render: false, saving: false, cleanup: true });
});

test("an old account settlement cannot unlock or replace the new account save", () => {
  const lifecycle = lifecycleModule.createProfileSaveLifecycle();
  lifecycle.retain("account-one");
  const old = lifecycle.begin("account-one")!;
  lifecycle.release();
  lifecycle.retain("account-two");
  const current = lifecycle.begin("account-two")!;
  assert.equal(lifecycle.canApply(old, "account-two"), false);
  assert.deepEqual(lifecycle.settle(old, "account-two"), { render: true, saving: true, cleanup: true });
  assert.equal(lifecycle.canApply(current, "account-two"), true);
  assert.deepEqual(lifecycle.settle(current, "account-two"), { render: true, saving: false, cleanup: false });
});

test("Strict Mode effect replay preserves a pending operation for the same owner", () => {
  const lifecycle = lifecycleModule.createProfileSaveLifecycle();
  lifecycle.retain("account-one");
  const operation = lifecycle.begin("account-one")!;
  lifecycle.release();
  lifecycle.retain("account-one");
  assert.equal(lifecycle.canApply(operation, "account-one"), true);
  assert.deepEqual(lifecycle.settle(operation, "account-one"), { render: true, saving: false, cleanup: false });
});

test("returning to an earlier account does not revive its abandoned save token", () => {
  const lifecycle = lifecycleModule.createProfileSaveLifecycle();
  lifecycle.retain("account-one");
  const old = lifecycle.begin("account-one")!;
  lifecycle.retain("account-two");
  lifecycle.retain("account-one");
  assert.equal(lifecycle.canApply(old, "account-one"), false);
  assert.deepEqual(lifecycle.settle(old, "account-one"), { render: true, saving: false, cleanup: true });
});
