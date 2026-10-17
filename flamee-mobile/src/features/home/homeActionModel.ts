import type { NudgeActionType } from "../nudges/types.ts";
import type { MomentDraft } from "../moments/types.ts";
export { getNudgeRouteIdForAccount } from "../nudges/types.ts";

export type NudgeHomeAction =
  | { kind: "composer"; momentKind: MomentDraft["kind"] }
  | { kind: "detail" };

export function getNudgeHomeAction(actionType: NudgeActionType): NudgeHomeAction {
  if (actionType === "text" || actionType === "voice" || actionType === "photo") {
    return { kind: "composer", momentKind: actionType };
  }
  return { kind: "detail" };
}
