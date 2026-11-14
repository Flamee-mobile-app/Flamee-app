export type HomeOverlaySelection = { kind: "create" | "notifications" } | { kind: "details"; id: string } | { kind: "day"; day: string };
type OverlayState = { selection: HomeOverlaySelection | null; open: boolean; revision: number };
type OverlayAction = { type: "show"; selection: HomeOverlaySelection } | { type: "close" | "reset" } | { type: "exited"; revision: number };
export const initialHomeOverlay: OverlayState = { selection: null, open: false, revision: 0 };
export function homeOverlayReducer(state: OverlayState, action: OverlayAction): OverlayState {
  switch (action.type) {
    case "show": return { selection: action.selection, open: true, revision: state.revision + 1 };
    case "close": return { ...state, open: false };
    case "reset": return { selection: null, open: false, revision: state.revision + 1 };
    case "exited": return !state.open && state.revision === action.revision ? { ...state, selection: null } : state;
  }
}
