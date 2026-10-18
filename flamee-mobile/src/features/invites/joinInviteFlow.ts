import { InviteApiError, type AcceptedCouple, type InvitePreview } from "./inviteApi.ts";

export function orderConnectedMembers(couple: AcceptedCouple, accountId: string) {
  const { partner1, partner2 } = couple;
  if (partner1.id === partner2.id) return null;
  if (partner1.id === accountId) return [partner1, partner2] as const;
  if (partner2.id === accountId) return [partner2, partner1] as const;
  return null;
}

export async function joinInviteByCode(code: string, accountId: string, current: () => boolean, service: {
  preview: (code: string) => Promise<InvitePreview>;
  accept: (code: string) => Promise<AcceptedCouple>;
}): Promise<{ kind: "connected"; couple: AcceptedCouple } | { kind: "cancelled" }> {
  const preview = await service.preview(code);
  if (!current()) return { kind: "cancelled" };
  if (preview.code !== code) throw new InviteApiError("response");
  const couple = await service.accept(preview.code);
  if (!current()) return { kind: "cancelled" };
  const members = orderConnectedMembers(couple, accountId);
  if (!members || members[1].id !== preview.inviter.id) throw new InviteApiError("response");
  return { kind: "connected", couple };
}
