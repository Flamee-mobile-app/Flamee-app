import { memoryFeedTokens } from "../../shared/constants/tokens.ts";

export type HeaderScrollState = { offset: number; travel: number; compact: boolean };

export function advanceHeaderScroll(previous: HeaderScrollState, rawOffset: number, maxOffset: number): HeaderScrollState {
  const offset = Math.max(0, Math.min(rawOffset, Math.max(0, maxOffset)));
  if (offset <= memoryFeedTokens.headerTopThreshold) return { offset, travel: 0, compact: false };
  const delta = offset - previous.offset;
  if (Math.abs(delta) < 1) return { ...previous, offset };
  const travel = Math.sign(delta) === Math.sign(previous.travel) ? previous.travel + delta : delta;
  if (!previous.compact && offset >= memoryFeedTokens.headerCollapseOffset && travel >= memoryFeedTokens.headerCollapseTravel) {
    return { offset, travel: 0, compact: true };
  }
  if (previous.compact && travel <= -memoryFeedTokens.headerRevealTravel) return { offset, travel: 0, compact: false };
  return { offset, travel, compact: previous.compact };
}
