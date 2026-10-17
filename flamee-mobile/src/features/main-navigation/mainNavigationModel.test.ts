import assert from "node:assert/strict";
import test from "node:test";
import { getFabIntent } from "./mainNavigationModel.ts";

test("FAB tap opens the timeline without creating a moment or check-in request", () => {
  assert.deepEqual(getFabIntent("timeline", "tap-1"), { pathname: "/(main)/timeline" });
});

test("radial actions open the four product flows with fresh composer intents", () => {
  assert.deepEqual(getFabIntent("emotion", "emotion-1"), { pathname: "/(main)", params: { checkInRequest: "emotion-1" } });
  assert.deepEqual(getFabIntent("moment", "moment-1"), { pathname: "/(main)/moments", params: { composeRequest: "moment-1" } });
  assert.deepEqual(getFabIntent("nudge", "nudge-1"), { pathname: "/(main)/tasks" });
  assert.deepEqual(getFabIntent("connection", "connect-1"), { pathname: "/connection" });
});
