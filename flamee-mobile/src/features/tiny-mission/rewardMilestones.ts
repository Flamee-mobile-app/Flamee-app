import type { MissionReward } from "./missionApi.ts";

export const MINIMUM_REWARD_POINTS = 100;
export function rewardMilestone(balance: number, price: number) {
  return { missing: Math.max(0, price - balance), progress: Math.min(100, Math.max(0, balance / price * 100)), reached: balance >= price };
}
export function availableRewardMilestones(rewards: readonly MissionReward[]) {
  return rewards.filter((reward) => reward.active && reward.price_points >= MINIMUM_REWARD_POINTS).sort((a, b) => a.price_points - b.price_points || a.id.localeCompare(b.id));
}
