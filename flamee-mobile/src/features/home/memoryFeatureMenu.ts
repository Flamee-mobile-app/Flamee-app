import type { MessageKey } from "../../shared/localization/messages.ts";
import type { MemoryFeedView } from "./memoryFeedModel.ts";

const memoryFeatures = [
  { id: "timeline", titleKey: "timelineFeed" },
  { id: "memories", titleKey: "timelineMemories" },
] as const satisfies readonly { id: MemoryFeedView; titleKey: MessageKey }[];

/** The route, visible content, header title and active shortcut share one ID. */
export function getMemoryFeatureMenu(parameter?: string | string[]) {
  const id = Array.isArray(parameter) ? parameter[0] : parameter;
  const active = memoryFeatures.find((feature) => feature.id === id) ?? memoryFeatures[0];
  return { active, items: memoryFeatures.map((feature) => ({ ...feature, selected: feature.id === active.id })) };
}
