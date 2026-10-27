export type QuickMenuPresence = { open: boolean; mounted: boolean; revision: number };
export const initialQuickMenuPresence: QuickMenuPresence = { open: false, mounted: false, revision: 0 };
type Action = { type: "open" | "close" | "reset" } | { type: "closed"; revision: number };

export function quickMenuPresenceReducer(state: QuickMenuPresence, action: Action): QuickMenuPresence {
  switch (action.type) {
    case "open": return state.open ? state : { open: true, mounted: true, revision: state.revision + 1 };
    case "close": return !state.open ? state : { ...state, open: false, revision: state.revision + 1 };
    case "reset": return { open: false, mounted: false, revision: state.revision + 1 };
    case "closed": return state.open || action.revision !== state.revision || !state.mounted ? state : { ...state, mounted: false };
  }
}
