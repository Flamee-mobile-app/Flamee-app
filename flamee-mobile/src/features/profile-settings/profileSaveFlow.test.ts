import assert from "node:assert/strict";
import test from "node:test";
import { hasProfileTextChanged, saveProfileChanges } from "./profileSaveFlow.ts";
import type { AuthSession } from "../auth";

const baseSession: AuthSession = {
  accountId: "account-a",
  user: {
    id: "account-a",
    email: "an@example.com",
    full_name: "An",
    username: null,
    avatar_url: null,
    couple_id: null,
    created_at: "2026-10-18T00:00:00Z",
  },
};

test("keeps an avatar as a local draft until Save runs profile then avatar updates", async () => {
  const calls: string[] = [];
  const draftUri = "file:///profile-draft.jpg";
  const dependencies = {
    updateProfile: async () => {
      calls.push("profile");
      return { ...baseSession, user: { ...baseSession.user, username: "Mây" } };
    },
    updateAvatar: async (file: { uri: string }) => {
      calls.push(`avatar:${file.uri}`);
      return { ...baseSession, user: { ...baseSession.user, username: "Mây", avatar_url: "https://storage.example/avatar.jpg" } };
    },
  };

  assert.deepEqual(calls, [], "selecting a draft must not upload before Save");
  const result = await saveProfileChanges({ currentSession: baseSession, profileChanged: true, fullName: "An", username: "Mây", avatarUri: draftUri }, dependencies);

  assert.equal(result.kind, "saved");
  assert.deepEqual(calls, ["profile", `avatar:${draftUri}`]);
  if (result.kind === "saved") assert.equal(result.session.user.avatar_url, "https://storage.example/avatar.jpg");
});

test("retains the confirmed text session when avatar upload fails so the draft can be retried", async () => {
  const profileSession = { ...baseSession, user: { ...baseSession.user, full_name: "An mới" } };
  const result = await saveProfileChanges({ currentSession: baseSession, profileChanged: true, fullName: "An mới", username: "", avatarUri: "file:///retry.jpg" }, {
    updateProfile: async () => profileSession,
    updateAvatar: async () => { throw new Error("storage unavailable"); },
  });

  assert.equal(result.kind, "avatar_error");
  if (result.kind === "avatar_error") assert.deepEqual(result.session, profileSession);
});

test("does not report success when the avatar response has no renderable URL", async () => {
  const profileSession = { ...baseSession, user: { ...baseSession.user, full_name: "An mới" } };
  const result = await saveProfileChanges({ currentSession: baseSession, profileChanged: true, fullName: "An mới", username: "", avatarUri: "file:///retry.jpg" }, {
    updateProfile: async () => profileSession,
    updateAvatar: async () => ({ ...profileSession, user: { ...profileSession.user, avatar_url: null } }),
  });

  assert.equal(result.kind, "avatar_error");
  if (result.kind === "avatar_error") assert.deepEqual(result.session, profileSession);
});

test("an avatar-only Save skips the unchanged profile request", async () => {
  const calls: string[] = [];
  const result = await saveProfileChanges({ currentSession: baseSession, profileChanged: false, fullName: "An", username: "", avatarUri: "file:///avatar-only.jpg" }, {
    updateProfile: async () => { calls.push("profile"); return baseSession; },
    updateAvatar: async () => {
      calls.push("avatar");
      return { ...baseSession, user: { ...baseSession.user, avatar_url: "https://storage.example/avatar-only.jpg" } };
    },
  });

  assert.equal(result.kind, "saved");
  assert.deepEqual(calls, ["avatar"]);
});

test("server whitespace normalization does not turn an avatar-only Save into a profile update", () => {
  assert.equal(hasProfileTextChanged({ fullName: "  An  ", username: " Mây " }, {
    fullName: "An",
    username: "Mây",
  }), false);
});
