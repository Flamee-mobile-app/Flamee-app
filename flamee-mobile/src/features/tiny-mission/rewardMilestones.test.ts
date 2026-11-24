import assert from "node:assert/strict";
import test from "node:test";
import { availableRewardMilestones, rewardMilestone } from "./rewardMilestones.ts";
import type { MissionReward } from "./missionApi.ts";

test("reward progress recalculates from the authoritative balance after a debit", () => {
  assert.deepEqual(rewardMilestone(10, 100), { missing: 90, progress: 10, reached: false });
  assert.deepEqual(rewardMilestone(150, 100), { missing: 0, progress: 100, reached: true });
  assert.deepEqual(rewardMilestone(50, 100), { missing: 50, progress: 50, reached: false });
  assert.deepEqual(rewardMilestone(50, 200), { missing: 150, progress: 25, reached: false });
});

test("only configured active rewards from 100 points appear as milestones; no catalog is fabricated", () => {
  const reward: MissionReward = { id: "a", title_vi: "Quà kiểm thử", title_en: "Test reward", description_vi: "", description_en: "", price_points: 100, stock: 0, active: true, revision: 0, fanpage_url: null };
  const rows = [{ ...reward, id: "high", price_points: 200 }, { ...reward, id: "legacy", price_points: 50 }, reward, { ...reward, id: "inactive", active: false }];
  assert.deepEqual(availableRewardMilestones(rows).map((row) => row.id), ["a", "high"]);
  assert.equal(rows[0].id, "high");
  assert.deepEqual(availableRewardMilestones([]), []);
});
