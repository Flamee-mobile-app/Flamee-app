export type InviteFlow = "create" | "join";
export type InviteStep = "choose" | "code" | "waiting" | "enter" | "complete";
export type InviteFlowState = { flow: InviteFlow | null; step: InviteStep };
type Event = { type: "create" | "join" | "wait" | "back" } | { type: "connected"; coupleId: string };

export function initialInviteFlow(mode: "choose" | InviteFlow): InviteFlowState {
  return mode === "choose" ? { flow: null, step: "choose" } : { flow: mode, step: mode === "create" ? "code" : "enter" };
}

export function inviteFlowReducer(state: InviteFlowState, event: Event): InviteFlowState {
  switch (event.type) {
    case "create": return initialInviteFlow("create");
    case "join": return initialInviteFlow("join");
    case "wait": return state.flow === "create" ? { ...state, step: "waiting" } : state;
    case "connected": return event.coupleId ? { ...state, step: "complete" } : state;
    case "back": return state.step === "waiting" ? { ...state, step: "code" } : initialInviteFlow("choose");
  }
}
