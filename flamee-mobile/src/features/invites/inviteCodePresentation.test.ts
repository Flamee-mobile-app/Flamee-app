import assert from "node:assert/strict";
import test from "node:test";
import { getInviteCountdown, splitInviteCode } from "./inviteCodePresentation.ts";

test("splits a normalized six-character invite code into OTP cells", () => {
  assert.deepEqual(splitInviteCode(" ab12cd "), ["A", "B", "1", "2", "C", "D"]);
});

test("formats a live invite countdown as total hours, minutes, and seconds", () => {
  assert.deepEqual(
    getInviteCountdown("2026-10-17T12:00:00.000Z", Date.parse("2026-10-14T10:58:55.000Z")),
    { expired: false, hours: "73", minutes: "01", seconds: "05" },
  );
});

test("clamps an expired invite countdown to zero", () => {
  assert.deepEqual(
    getInviteCountdown("2026-10-14T10:00:00.000Z", Date.parse("2026-10-14T10:00:01.000Z")),
    { expired: true, hours: "00", minutes: "00", seconds: "00" },
  );
});
