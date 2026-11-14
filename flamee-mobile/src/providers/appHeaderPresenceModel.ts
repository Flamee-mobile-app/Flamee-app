import type { AppHeaderEntry } from "../shared/navigation/appHeaderContext.tsx";

export type AppHeaderPresence = { active: AppHeaderEntry | null; retained: AppHeaderEntry | null };
export type AppHeaderPresenceAction = { type: "publish"; entry: AppHeaderEntry } | { type: "release"; owner: string };
export const initialAppHeaderPresence: AppHeaderPresence = { active: null, retained: null };

/** Keep the renderer mounted while fullscreen routes temporarily hide it. */
export function reduceAppHeaderPresence(state: AppHeaderPresence, action: AppHeaderPresenceAction): AppHeaderPresence {
  if (action.type === "publish") return { active: action.entry, retained: action.entry };
  return state.active?.owner === action.owner ? { ...state, active: null } : state;
}
