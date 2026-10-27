import type { MessageKey } from "../../shared/localization/messages";

/** Design fixtures only: never a service, account state or persistence source. */
export type MissionPreview = { id: "photo" | "message" | "call" | "plan"; title: MessageKey; description: MessageKey; owner: "Linh" | "Nam" | null; points: number; completedBy: readonly string[] };
export const missionPreviews: readonly MissionPreview[] = [
  { id: "photo", title: "missionPhoto", description: "missionPhotoDescription", owner: "Linh", points: 20, completedBy: ["Linh"] },
  { id: "message", title: "missionMessage", description: "missionMessageDescription", owner: "Nam", points: 20, completedBy: [] },
  { id: "call", title: "missionCall", description: "missionDescription", owner: null, points: 40, completedBy: ["Linh"] },
  { id: "plan", title: "missionPlan", description: "missionPlanDescription", owner: null, points: 40, completedBy: [] },
];
export type RewardPreview = { id: "keychains" | "cards" | "mugs" | "tote"; title: MessageKey; points: number; image: number };
export const rewardPreviews: readonly RewardPreview[] = [
  { id: "keychains", title: "missionKeychains", points: 800, image: require("./assets/keychains.png") },
  { id: "cards", title: "missionCards", points: 500, image: require("./assets/cards.png") },
  { id: "mugs", title: "missionMugs", points: 1500, image: require("./assets/mugs.png") },
  { id: "tote", title: "missionTote", points: 2000, image: require("./assets/tote.png") },
];
export const previewBalance = 1250;
