import { useState } from "react";
import { buttonTokens } from "../constants/tokens";

// Track contact so web and native both use a quick press and a slower release.
// A transition nested inside pressStyle is not applied by the web CSS driver.
export function useButtonInteraction(disabled: boolean) {
  const [pressed, setPressed] = useState(false);
  const transition: ["200ms", { duration: number }] = [
    "200ms",
    { duration: pressed && !disabled ? buttonTokens.pressDuration : buttonTokens.interactionDuration },
  ];

  return {
    transition,
    // Use Tamagui's runtime press state; touch browsers may never expose :active.
    disableClassName: true,
    onPressIn: () => { if (!disabled) setPressed(true); },
    onPressOut: () => setPressed(false),
  };
}
