import assert from "node:assert/strict";
import test from "node:test";
import { createAppToastHostState } from "./appToastHostState.ts";
import { createAppToastState } from "./appToastState.ts";

test("top native modal owns toast rendering and cleanup hands ownership back without changing the result", () => {
  const hosts = createAppToastHostState();
  const toast = createAppToastState(3000);
  toast.show("success", "Server confirmed");
  const result = toast.getSnapshot();
  const closeDialog = hosts.register("dialog");
  assert.equal(hosts.getSnapshot(), "dialog");
  const closeImage = hosts.register("image");
  assert.equal(hosts.getSnapshot(), "image");
  closeDialog(); closeDialog();
  assert.equal(hosts.getSnapshot(), "image");
  closeImage();
  assert.equal(hosts.getSnapshot(), null);
  assert.equal(toast.getSnapshot(), result, "viewport handoff must not reset a successful result or its id");
  toast.reset();
});
