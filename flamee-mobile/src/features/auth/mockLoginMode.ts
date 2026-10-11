// Temporary workflow access requested for development. Never enabled in release.
export function isMockLoginEnabled(): boolean {
  return typeof __DEV__ !== "undefined" && __DEV__ && process.env.EXPO_PUBLIC_MOCK_LOGIN !== "false";
}
