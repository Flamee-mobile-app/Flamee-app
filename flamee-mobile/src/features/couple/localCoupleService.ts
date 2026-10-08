export type CoupleStatus = "none" | "waiting" | "paired";

export type LocalPartnerSummary = {
  id: string;
  displayName: string;
  nickname: string;
  avatarUri: string | null;
  timezone: string;
};

export type CoupleMembership = {
  status: CoupleStatus;
  coupleId: string | null;
  inviteId: string | null;
  inviteExpiresAt: string | null;
  connectedAt: string | null;
  partner: LocalPartnerSummary | null;
};

export type LocalCoupleService = {
  getMembership: (accountId: string) => Promise<CoupleMembership>;
  beginWaiting: (accountId: string, inviteId: string, expiresAt: string, profile: LocalPartnerSummary) => Promise<CoupleMembership>;
  clearWaiting: (accountId: string, inviteId: string) => Promise<void>;
  acceptInvite: (input: {
    inviteId: string;
    inviterId: string;
    inviteeId: string;
    inviter: LocalPartnerSummary;
    invitee: LocalPartnerSummary;
  }) => Promise<{ coupleId: string; connectedAt: string }>;
  unpair: (accountId: string) => Promise<{ status: "ended"; coupleId: string | null }>;
  clearCouple: (coupleId: string) => Promise<void>;
};

export type LocalCoupleServiceOptions = {
  createId?: () => string;
  now?: () => Date;
};

const emptyMembership = (): CoupleMembership => ({
  status: "none",
  coupleId: null,
  inviteId: null,
  inviteExpiresAt: null,
  connectedAt: null,
  partner: null,
});

export function createLocalCoupleService({
  createId,
  now = () => new Date(),
}: LocalCoupleServiceOptions = {}): LocalCoupleService {
  const memberships = new Map<string, CoupleMembership>();
  let idSequence = 0;
  const makeId = createId ?? (() => `local-couple-${++idSequence}`);

  const clone = (membership: CoupleMembership): CoupleMembership => ({
    ...membership,
    partner: membership.partner ? { ...membership.partner } : null,
  });

  return {
    async getMembership(accountId) {
      return clone(memberships.get(accountId) ?? emptyMembership());
    },

    async beginWaiting(accountId, inviteId, expiresAt, profile) {
      const current = memberships.get(accountId) ?? emptyMembership();
      if (current.status === "paired") throw new Error("Account is already paired.");
      const next: CoupleMembership = {
        status: "waiting",
        coupleId: null,
        inviteId,
        inviteExpiresAt: expiresAt,
        connectedAt: null,
        partner: null,
      };
      memberships.set(accountId, next);
      return clone({ ...next, partner: { ...profile } });
    },

    async clearWaiting(accountId, inviteId) {
      const current = memberships.get(accountId);
      if (current?.status === "waiting" && current.inviteId === inviteId) memberships.delete(accountId);
    },

    async acceptInvite({ inviteId, inviterId, inviteeId, inviter, invitee }) {
      if (inviterId === inviteeId) throw new Error("An account cannot accept its own invite.");
      const inviterMembership = memberships.get(inviterId);
      if (inviterMembership?.status !== "waiting" || inviterMembership.inviteId !== inviteId) {
        throw new Error("Invite is no longer waiting for acceptance.");
      }
      const inviteeMembership = memberships.get(inviteeId) ?? emptyMembership();
      if (inviteeMembership.status === "paired" || inviteeMembership.status === "waiting") {
        throw new Error("Account is already paired or waiting for another invite.");
      }

      const coupleId = makeId();
      const connectedAt = now().toISOString();
      memberships.set(inviterId, {
        status: "paired",
        coupleId,
        inviteId,
        inviteExpiresAt: inviterMembership.inviteExpiresAt,
        connectedAt,
        partner: { ...invitee },
      });
      memberships.set(inviteeId, {
        status: "paired",
        coupleId,
        inviteId,
        inviteExpiresAt: inviterMembership.inviteExpiresAt,
        connectedAt,
        partner: { ...inviter },
      });
      return { coupleId, connectedAt };
    },

    async unpair(accountId) {
      const current = memberships.get(accountId) ?? emptyMembership();
      const coupleId = current.coupleId;
      if (coupleId) {
        for (const [memberId, membership] of memberships) {
          if (membership.coupleId === coupleId) memberships.delete(memberId);
        }
      } else {
        memberships.delete(accountId);
      }
      return { status: "ended", coupleId };
    },

    async clearCouple(coupleId) {
      for (const [accountId, membership] of memberships) {
        if (membership.coupleId === coupleId) memberships.delete(accountId);
      }
    },
  };
}

export const localCoupleService = createLocalCoupleService();
