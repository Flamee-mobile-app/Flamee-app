import type { LocalPartnerSummary } from "../couple/index.ts";

export type InviteStatus = "open" | "accepted" | "expired" | "revoked";

export type InviteGift =
  | { kind: "text"; text: string }
  | { kind: "photo"; uri: string; caption: string }
  | { kind: "voice"; uri: string; durationSeconds: number };

export type LocalInvite = {
  id: string;
  code: string;
  status: InviteStatus;
  expiresAt: string;
  inviterId: string;
  inviter: LocalPartnerSummary;
  acceptedById: string | null;
  acceptedAt: string | null;
  gift: InviteGift | null;
};

export type InviteValidation =
  | { kind: "valid"; invite: LocalInvite }
  | { kind: "not_found" | "expired" | "revoked" | "used" | "already_paired" | "self_invite" };

export type InviteAcceptance =
  | { kind: "accepted"; invite: LocalInvite; coupleId: string; connectedAt: string; gift: InviteGift | null }
  | { kind: "not_found" | "expired" | "revoked" | "used" | "already_paired" | "self_invite" };
