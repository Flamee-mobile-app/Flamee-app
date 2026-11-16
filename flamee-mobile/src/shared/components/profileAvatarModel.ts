/** A visual fallback only; never infers gender or changes the server profile. */
export function resolveProfileAvatar(uri?: string | null, failedUri?: string | null, seed = "", loaded?: { uri: string; seed: string } | null):
  { kind: "remote"; uri: string } | { kind: "default"; variant: "a" | "b" } {
  if (uri?.trim() && loaded?.seed === seed && avatarObjectKey(uri) === avatarObjectKey(loaded.uri)) return { kind: "remote", uri: loaded.uri };
  if (uri?.trim() && uri !== failedUri) return { kind: "remote", uri };
  const parity = Array.from(seed).reduce((sum, char) => (sum + char.codePointAt(0)!) % 2, 0);
  return { kind: "default", variant: parity ? "b" : "a" };
}

/** Identity for presentation only. Signed tokens never authorize application actions here. */
export function avatarObjectKey(uri: string) {
  try {
    const url = new URL(uri);
    if (url.pathname.includes("/storage/v1/object/sign/") && url.searchParams.has("token")) url.searchParams.delete("token");
    return url.toString();
  } catch { return uri; }
}

export function retainSignedAvatarUrl(previous: string | null | undefined, next: string | null | undefined) {
  if (!previous || !next || avatarObjectKey(previous) !== avatarObjectKey(next)) return next;
  if (previous === next) return previous;
  try {
    const encoded = new URL(previous).searchParams.get("token")?.split(".")[1];
    if (!encoded) return next;
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const payload: unknown = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")));
    const expiry = (payload as { exp?: unknown })?.exp;
    return typeof expiry === "number" && expiry * 1000 > Date.now() + 30_000 ? previous : next;
  } catch { return next; }
}
