import assert from "node:assert/strict";
import test from "node:test";
import { createGatedMoodSubmit } from "./moodServiceCore.ts";
import { MoodApiError, type CreateMoodInput } from "./moodApi.ts";

const body: CreateMoodInput = { draft_version: 2, mood: "happy", intensity: 3, mood_score: 4, note: "Hi", reasons: ["work"], custom_emotion_label: null, mascot_sticker_id: null, sleep_hours: null, attachments: [], timezone: "Asia/Ho_Chi_Minh", share_level: "all", is_private: false };
const auth = { withAccessToken: async <T>(fn: (token: string) => Promise<T>) => fn("bearer") };
test("a legacy or unreachable server never receives a check-in that would trigger one-sided nudges", async () => {
  let posts = 0;
  const create = async () => { posts++; return "saved"; };
  for (const capabilities of [async () => ({ dual_mood_nudge: false }), async () => { throw new MoodApiError("server"); }]) {
    await assert.rejects(createGatedMoodSubmit({ capabilities, create }, auth)(body, "key"), (error: MoodApiError) => error.code === "unavailable");
  }
  assert.equal(posts, 0);
  const supported = createGatedMoodSubmit({ capabilities: async () => ({ dual_mood_nudge: true }), create }, auth);
  assert.equal(await supported(body, "key"), "saved");
  assert.equal(posts, 1);
});
test("an expired capability request still reaches the auth refresh mechanism", async () => {
  const submit = createGatedMoodSubmit({ capabilities: async () => { throw new MoodApiError("unauthorized"); }, create: async () => "saved" }, auth);
  await assert.rejects(submit(body, "key"), (error: MoodApiError) => error.code === "unauthorized");
});
