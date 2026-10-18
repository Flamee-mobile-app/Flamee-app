import type { AcceptedCouple, ServerInvite } from "./inviteApi.ts";

type Result = { kind: "invite"; invite: ServerInvite } | { kind: "connected"; couple: AcceptedCouple } | { kind: "cancelled" };

// Read only after the user chooses Create. Reuse a valid pending code and
// recheck ownership/focus before making any subsequent request.
export async function openInviteCreation(api: {
  current: () => Promise<ServerInvite | null>;
  create: () => Promise<ServerInvite>;
  connection: () => Promise<AcceptedCouple>;
}, isCurrent: () => boolean, now = Date.now()): Promise<Result> {
  if (!isCurrent()) return { kind: "cancelled" };
  const latest = await api.current();
  if (!isCurrent()) return { kind: "cancelled" };
  if (latest?.status === "accepted") {
    const couple = await api.connection();
    return isCurrent() ? { kind: "connected", couple } : { kind: "cancelled" };
  }
  if (latest?.status === "pending" && Date.parse(latest.expires_at) > now) return { kind: "invite", invite: latest };
  const invite = await api.create();
  return isCurrent() ? { kind: "invite", invite } : { kind: "cancelled" };
}
