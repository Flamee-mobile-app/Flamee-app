import { destructiveConfirmationSchema } from "./schemas.ts";

export type DestructiveConfirmationState = { step: 1 | 2; confirmation: string };
export type DestructiveConfirmationEvent = { type: "begin" } | { type: "type"; value: string } | { type: "cancel" };

export function reduceDestructiveConfirmation(
  state: DestructiveConfirmationState,
  event: DestructiveConfirmationEvent,
): DestructiveConfirmationState {
  if (event.type === "begin") return { step: 2, confirmation: "" };
  if (event.type === "cancel") return { step: 1, confirmation: "" };
  return { ...state, confirmation: event.value };
}

export function isDestructiveConfirmationValid(state: DestructiveConfirmationState, phrase: string): boolean {
  return state.step === 2 &&
    destructiveConfirmationSchema.safeParse({ acknowledged: true, confirmation: state.confirmation }).success &&
    state.confirmation.trim().toLocaleUpperCase() === phrase.trim().toLocaleUpperCase();
}

export async function confirmDestructiveAction({
  step,
  confirmation,
  phrase,
  action,
}: DestructiveConfirmationState & { phrase: string; action: () => void | Promise<void> }): Promise<boolean> {
  if (!isDestructiveConfirmationValid({ step, confirmation }, phrase)) return false;
  await action();
  return true;
}
