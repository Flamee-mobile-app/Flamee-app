import assert from "node:assert/strict";
import test from "node:test";
import { initialInviteFlow, inviteFlowReducer } from "./inviteFlowState.ts";

test("creating an invite advances to waiting without claiming a connection", () => {
  const code = inviteFlowReducer(initialInviteFlow("choose"), { type: "create" });
  assert.equal(code.step, "code");
  const waiting = inviteFlowReducer(code, { type: "wait" });
  assert.equal(waiting.step, "waiting");
  assert.equal(inviteFlowReducer(waiting, { type: "connected", coupleId: "" }).step, "waiting");
  assert.equal(inviteFlowReducer(waiting, { type: "connected", coupleId: "server-couple" }).step, "complete");
});

test("joining stays at the clean code entry until a server connection is confirmed", () => {
  const enter = initialInviteFlow("join");
  assert.equal(enter.step, "enter");
  assert.equal(inviteFlowReducer(enter, { type: "connected", coupleId: "" }).step, "enter");
  assert.equal(inviteFlowReducer(enter, { type: "back" }).step, "choose");
  assert.equal(inviteFlowReducer(enter, { type: "wait" }).step, "enter");
});

test("switching branches resets the step while choosing is always the first entry", () => {
  const choose = initialInviteFlow("choose");
  assert.equal(choose.flow, null);
  assert.equal(choose.step, "choose");
  assert.deepEqual(inviteFlowReducer(initialInviteFlow("join"), { type: "create" }), { flow: "create", step: "code" });
});
