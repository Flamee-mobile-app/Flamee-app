/** A visual fallback only; never infers gender or changes the server profile. */
export function resolveProfileAvatar(uri?: string | null, failedUri?: string | null, seed = ""):
  { kind: "remote"; uri: string } | { kind: "default"; variant: "a" | "b" } {
  if (uri?.trim() && uri !== failedUri) return { kind: "remote", uri };
  const parity = Array.from(seed).reduce((sum, char) => (sum + char.codePointAt(0)!) % 2, 0);
  return { kind: "default", variant: parity ? "b" : "a" };
}
