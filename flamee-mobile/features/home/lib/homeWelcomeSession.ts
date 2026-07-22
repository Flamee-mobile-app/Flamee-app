let hasConsumedHomeWelcome = false;

export function consumeHomeWelcomeSession() {
  const shouldAnimate = !hasConsumedHomeWelcome;
  hasConsumedHomeWelcome = true;

  return shouldAnimate;
}

export function resetHomeWelcomeSessionForTests() {
  hasConsumedHomeWelcome = false;
}
