import { localCoupleService, type LocalCoupleService, type LocalPartnerSummary } from "../couple/index.ts";
import { localMediaAdapter } from "../media/localMediaAdapter.ts";
import { inviteCodeSchema, inviteGiftSchema } from "./schemas.ts";
import type { InviteAcceptance, InviteGift, InviteValidation, LocalInvite } from "./types.ts";

export type LocalInviteService = {
  createInvite: (inviterId: string, inviter: LocalPartnerSummary) => Promise<LocalInvite>;
  getOpenInvite: (inviterId: string) => Promise<LocalInvite | null>;
  attachGift: (inviteId: string, gift: unknown) => Promise<LocalInvite>;
  validateInvite: (inviteeId: string, code: string) => Promise<InviteValidation>;
  acceptInvite: (inviteeId: string, code: string, invitee: LocalPartnerSummary) => Promise<InviteAcceptance>;
  revokeOpenInvite: (inviterId: string) => Promise<boolean>;
  clearAccount: (accountId: string) => Promise<void>;
};

export type LocalInviteServiceOptions = {
  coupleService?: LocalCoupleService;
  createId?: () => string;
  createCode?: () => string;
  now?: () => Date;
};

const codeCharacters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function createLocalCode(): string {
  let code = "";
  for (let index = 0; index < 6; index += 1) {
    code += codeCharacters[Math.floor(Math.random() * codeCharacters.length)];
  }
  return code;
}

export function createLocalInviteService({
  coupleService = localCoupleService,
  createId,
  createCode = createLocalCode,
  now = () => new Date(),
}: LocalInviteServiceOptions = {}): LocalInviteService {
  const invitesById = new Map<string, LocalInvite>();
  const inviteIdByCode = new Map<string, string>();
  const currentInviteByInviter = new Map<string, string>();
  const acceptingCodes = new Set<string>();
  let idSequence = 0;
  const makeId = createId ?? (() => `local-invite-${++idSequence}`);

  const clone = (invite: LocalInvite): LocalInvite => ({
    ...invite,
    inviter: { ...invite.inviter },
    gift: invite.gift ? { ...invite.gift } : null,
  });

  const findByCode = (code: string): LocalInvite | null => {
    const id = inviteIdByCode.get(code);
    return id ? invitesById.get(id) ?? null : null;
  };

  const validationFor = async (inviteeId: string, code: string): Promise<InviteValidation> => {
    const parsed = inviteCodeSchema.parse({ code });
    const invite = findByCode(parsed.code);
    if (invite?.inviterId === inviteeId && invite.status === "open" && Date.parse(invite.expiresAt) > now().getTime()) {
      return { kind: "self_invite" };
    }
    const membership = await coupleService.getMembership(inviteeId);
    if (membership.status === "paired" || membership.status === "waiting") return { kind: "already_paired" };
    if (!invite) return { kind: "not_found" };
    if (invite.status === "revoked") return { kind: "revoked" };
    if (invite.status === "accepted") return { kind: "used" };
    if (invite.status === "expired" || Date.parse(invite.expiresAt) <= now().getTime()) {
      invite.status = "expired";
      return { kind: "expired" };
    }
    return { kind: "valid", invite: clone(invite) };
  };

  return {
    async createInvite(inviterId, inviter) {
      const membership = await coupleService.getMembership(inviterId);
      if (membership.status === "paired") throw new Error("Account is already paired.");
      if (inviter.id !== inviterId) throw new Error("Invite profile does not match its owner.");
      let code = "";
      let attempts = 0;
      do {
        code = inviteCodeSchema.parse({ code: createCode() }).code;
        attempts += 1;
        if (attempts > 20) throw new Error("Unable to create a unique local invite code.");
      } while (inviteIdByCode.has(code));

      const id = makeId();
      const expiresAt = new Date(now().getTime() + 72 * 60 * 60 * 1000).toISOString();
      await coupleService.beginWaiting(inviterId, id, expiresAt, inviter);
      const previousId = currentInviteByInviter.get(inviterId);
      if (previousId) {
        const previous = invitesById.get(previousId);
        if (previous?.status === "open") {
          previous.status = "revoked";
          await coupleService.clearWaiting(inviterId, previous.id);
          await coupleService.beginWaiting(inviterId, id, expiresAt, inviter);
        }
      }
      const invite: LocalInvite = {
        id,
        code,
        status: "open",
        expiresAt,
        inviterId,
        inviter: { ...inviter },
        acceptedById: null,
        acceptedAt: null,
        gift: null,
      };
      invitesById.set(id, invite);
      inviteIdByCode.set(code, id);
      currentInviteByInviter.set(inviterId, id);
      return clone(invite);
    },

    async getOpenInvite(inviterId) {
      const id = currentInviteByInviter.get(inviterId);
      const invite = id ? invitesById.get(id) : undefined;
      if (!invite || invite.status !== "open") return null;
      if (Date.parse(invite.expiresAt) <= now().getTime()) invite.status = "expired";
      return invite.status === "open" ? clone(invite) : null;
    },

    async attachGift(inviteId, gift) {
      const invite = invitesById.get(inviteId);
      if (!invite || invite.status !== "open" || Date.parse(invite.expiresAt) <= now().getTime()) {
        throw new Error("Only an open invite can have a gift.");
      }
      const parsed = inviteGiftSchema.parse(gift) as InviteGift;
      invite.gift = parsed;
      return clone(invite);
    },

    validateInvite: validationFor,

    async acceptInvite(inviteeId, code, invitee): Promise<InviteAcceptance> {
      const parsed = inviteCodeSchema.parse({ code });
      if (acceptingCodes.has(parsed.code)) return { kind: "used" };
      acceptingCodes.add(parsed.code);
      try {
        const validation = await validationFor(inviteeId, parsed.code);
        if (validation.kind !== "valid") return validation;
        const invite = invitesById.get(validation.invite.id);
        if (!invite || invitee.id !== inviteeId) return { kind: "not_found" };

        const pair = await coupleService.acceptInvite({
          inviteId: invite.id,
          inviterId: invite.inviterId,
          inviteeId,
          inviter: invite.inviter,
          invitee,
        });
        invite.status = "accepted";
        invite.acceptedById = inviteeId;
        invite.acceptedAt = now().toISOString();
        return { kind: "accepted", invite: clone(invite), coupleId: pair.coupleId, connectedAt: pair.connectedAt, gift: invite.gift ? { ...invite.gift } : null };
      } catch (error) {
        if (error instanceof Error && /already paired|waiting for another invite/i.test(error.message)) return { kind: "already_paired" };
        throw error;
      } finally {
        acceptingCodes.delete(parsed.code);
      }
    },

    async revokeOpenInvite(inviterId) {
      const id = currentInviteByInviter.get(inviterId);
      const invite = id ? invitesById.get(id) : undefined;
      if (!invite || invite.status !== "open") return false;
      invite.status = "revoked";
      currentInviteByInviter.delete(inviterId);
      await coupleService.clearWaiting(inviterId, invite.id);
      return true;
    },

    async clearAccount(accountId) {
      const idsToClear = [...invitesById.values()]
        .filter((invite) => invite.inviterId === accountId || invite.acceptedById === accountId)
        .map((invite) => invite.id);
      for (const id of idsToClear) {
        const invite = invitesById.get(id);
        if (!invite) continue;
        if (invite.status === "open") await coupleService.clearWaiting(invite.inviterId, invite.id);
        if (invite.gift && invite.gift.kind !== "text") await localMediaAdapter.cleanup(invite.gift.uri);
        invite.status = "revoked";
        inviteIdByCode.delete(invite.code);
        invitesById.delete(id);
        if (currentInviteByInviter.get(invite.inviterId) === id) currentInviteByInviter.delete(invite.inviterId);
      }
    },
  };
}

export const localInviteService = createLocalInviteService();
