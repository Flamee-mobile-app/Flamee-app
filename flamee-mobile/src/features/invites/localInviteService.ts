import { localCoupleService, type LocalCoupleService, type LocalPartnerSummary } from "../couple/index.ts";
import { localMediaAdapter } from "../media/index.ts";
import { inviteCodeSchema, inviteGiftSchema, inviteMessageSchema } from "./schemas.ts";
import type { InviteAcceptance, InviteGift, InviteValidation, LocalInvite, PairingNotice } from "./types.ts";

export type LocalInviteService = {
  createInvite: (inviterId: string, inviter: LocalPartnerSummary) => Promise<LocalInvite>;
  getOpenInvite: (inviterId: string) => Promise<LocalInvite | null>;
  getLatestInvite: (inviterId: string) => Promise<LocalInvite | null>;
  attachGift: (inviteId: string, gift: unknown, message?: string) => Promise<LocalInvite>;
  validateInvite: (inviteeId: string, code: string) => Promise<InviteValidation>;
  acceptInvite: (inviteeId: string, code: string, invitee: LocalPartnerSummary, greeting?: string) => Promise<InviteAcceptance>;
  getPairingNotice: (accountId: string) => Promise<PairingNotice | null>;
  acknowledgePairingNotice: (accountId: string, inviteId: string) => void;
  subscribeChanges: (listener: () => void) => () => void;
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
  const notices = new Map<string, PairingNotice>();
  const listeners = new Set<() => void>();
  const publish = () => listeners.forEach((listener) => listener());
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
        message: "",
      };
      invitesById.set(id, invite);
      inviteIdByCode.set(code, id);
      currentInviteByInviter.set(inviterId, id);
      publish();
      return clone(invite);
    },

    async getOpenInvite(inviterId) {
      const id = currentInviteByInviter.get(inviterId);
      const invite = id ? invitesById.get(id) : undefined;
      if (!invite || invite.status !== "open") return null;
      if (Date.parse(invite.expiresAt) <= now().getTime()) invite.status = "expired";
      return invite.status === "open" ? clone(invite) : null;
    },

    async getLatestInvite(inviterId) {
      const id = currentInviteByInviter.get(inviterId);
      const invite = id ? invitesById.get(id) : undefined;
      if (!invite) return null;
      if (invite.status === "open" && Date.parse(invite.expiresAt) <= now().getTime()) invite.status = "expired";
      return clone(invite);
    },

    async attachGift(inviteId, gift, message) {
      const invite = invitesById.get(inviteId);
      if (!invite || invite.status !== "open" || Date.parse(invite.expiresAt) <= now().getTime()) {
        throw new Error("Only an open invite can have a gift.");
      }
      const parsed = gift === null ? null : inviteGiftSchema.parse(gift) as InviteGift;
      const parsedMessage = message === undefined ? invite.message : inviteMessageSchema.parse(message);
      invite.gift = parsed;
      invite.message = parsedMessage;
      publish();
      return clone(invite);
    },

    validateInvite: validationFor,

    async acceptInvite(inviteeId, code, invitee, greeting = ""): Promise<InviteAcceptance> {
      const parsed = inviteCodeSchema.parse({ code });
      const replyGreeting = inviteMessageSchema.parse(greeting);
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
        notices.set(invite.inviterId, { inviteId: invite.id, coupleId: pair.coupleId, partnerName: invitee.displayName, greeting: replyGreeting, gift: null });
        notices.set(inviteeId, { inviteId: invite.id, coupleId: pair.coupleId, partnerName: invite.inviter.displayName, greeting: invite.message || (invite.gift?.kind === "text" ? invite.gift.text : ""), gift: invite.gift ? { ...invite.gift } : null });
        publish();
        return { kind: "accepted", invite: clone(invite), coupleId: pair.coupleId, connectedAt: pair.connectedAt, gift: invite.gift ? { ...invite.gift } : null };
      } catch (error) {
        const latest = findByCode(parsed.code);
        if (latest && Date.parse(latest.expiresAt) <= now().getTime()) return { kind: "expired" };
        if (error instanceof Error && /already paired|waiting for another invite/i.test(error.message)) return { kind: "already_paired" };
        throw error;
      } finally {
        acceptingCodes.delete(parsed.code);
      }
    },

    subscribeChanges(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },

    async getPairingNotice(accountId) {
      const membership = await coupleService.getMembership(accountId);
      const notice = notices.get(accountId);
      if (!notice) return null;
      if (membership.status !== "paired" || membership.coupleId !== notice.coupleId) return null;
      return { ...notice, gift: notice.gift ? { ...notice.gift } : null };
    },

    acknowledgePairingNotice(accountId, inviteId) {
      if (notices.get(accountId)?.inviteId === inviteId) { notices.delete(accountId); publish(); }
    },

    async revokeOpenInvite(inviterId) {
      const id = currentInviteByInviter.get(inviterId);
      const invite = id ? invitesById.get(id) : undefined;
      if (!invite || invite.status !== "open") return false;
      invite.status = "revoked";
      currentInviteByInviter.delete(inviterId);
      await coupleService.clearWaiting(inviterId, invite.id);
      publish();
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
        if (invite.gift && "uri" in invite.gift) await localMediaAdapter.cleanup(invite.gift.uri);
        for (const [ownerId, notice] of notices) if (notice.inviteId === id) notices.delete(ownerId);
        invite.status = "revoked";
        inviteIdByCode.delete(invite.code);
        invitesById.delete(id);
        if (currentInviteByInviter.get(invite.inviterId) === id) currentInviteByInviter.delete(invite.inviterId);
      }
      publish();
    },
  };
}

export const localInviteService = createLocalInviteService();
