import { createContext, useContext } from "react";

// Composition owns the reveal signal; feature screens only consume it.
// Standalone screens remain visible without a startup overlay.
export const ScreenRevealContext = createContext(true);

export function useScreenReveal(): boolean {
  return useContext(ScreenRevealContext);
}
