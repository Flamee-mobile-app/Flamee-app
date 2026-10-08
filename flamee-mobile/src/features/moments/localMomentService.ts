import type { InviteAcceptance } from "../invites/index.ts";
import { localMediaAdapter } from "../media/localMediaAdapter.ts";
import { momentDraftSchema, reactionSchema } from "./schemas.ts";
import type { Moment, MomentDraft, MomentReaction, MomentStatus } from "./types.ts";

export type LocalMomentResult =
  | { kind: "created"; moment: Moment }
  | { kind: "not_found" | "forbidden" | "validation" | "invalid_transition" };

export type LocalMomentService = {
  listForCouple(coupleId: string): Promise<Moment[]>;
  create(authorId: string, coupleId: string, draft: MomentDraft, linkage?: { nudgeId?: string }): Promise<LocalMomentResult>;
  retry(momentId: string): Promise<LocalMomentResult>;
  reply(momentId: string, authorId: string, draft: MomentDraft): Promise<LocalMomentResult>;
  react(momentId: string, userId: string, emoji: string): Promise<{ kind: "updated"; moment: Moment } | { kind: "not_found" | "validation" }>;
  delete(momentId: string, authorId: string): Promise<boolean>;
  clearCouple(coupleId: string): Promise<void>;
  deliverAcceptedInviteGift(acceptance: InviteAcceptance): Promise<Moment | null>;
};

export type LocalMomentServiceOptions = {
  createId?: () => string;
  now?: () => Date;
  persist?: (moment: Moment) => Promise<Exclude<MomentStatus, "failed">>;
  cleanupMedia?: (uri: string) => Promise<void>;
};

export function createLocalMomentService({
  createId,
  now = () => new Date(),
  persist = async () => "saved_local",
  cleanupMedia = (uri) => localMediaAdapter.cleanup(uri),
}: LocalMomentServiceOptions = {}): LocalMomentService {
  const moments = new Map<string, Moment>();
  const inviteGiftMomentIds = new Map<string, string>();
  let sequence = 0;
  const makeId = createId ?? (() => `local-moment-${now().getTime()}-${++sequence}`);
  const clone = (moment: Moment): Moment => ({ ...moment, reactions: moment.reactions.map((reaction) => ({ ...reaction })) });

  const save = async (moment: Moment): Promise<Moment> => {
    try {
      moment.status = await persist(clone(moment));
    } catch {
      moment.status = "failed";
    }
    moments.set(moment.id, moment);
    return clone(moment);
  };

  const createRecord = async (
    authorId: string,
    coupleId: string,
    draftInput: MomentDraft,
    linkage: { nudgeId?: string } = {},
    parentMomentId: string | null = null,
  ): Promise<LocalMomentResult> => {
    if (!authorId.trim() || !coupleId.trim()) return { kind: "validation" };
    const parsed = momentDraftSchema.safeParse(draftInput);
    if (!parsed.success) return { kind: "validation" };
    const draft = parsed.data;
    const record: Moment = {
      id: makeId(),
      coupleId,
      authorId,
      kind: draft.kind,
      text: draft.kind === "text" || draft.kind === "signal" ? draft.text.trim() : null,
      caption: draft.kind === "photo" || draft.kind === "voice" ? draft.caption.trim() : null,
      place: draft.kind === "photo" || draft.kind === "voice" ? draft.place.trim() : null,
      mediaUri: draft.kind === "photo" || draft.kind === "voice" ? draft.mediaUri : null,
      durationSeconds: draft.kind === "voice" ? draft.durationSeconds : null,
      createdAt: now().toISOString(),
      status: "saved_local",
      parentMomentId,
      fromNudgeId: linkage.nudgeId?.trim() || null,
      reactions: [],
    };
    return { kind: "created", moment: await save(record) };
  };

  return {
    async listForCouple(coupleId) {
      return [...moments.values()]
        .filter((moment) => moment.coupleId === coupleId)
        .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
        .map(clone);
    },

    async create(authorId, coupleId, draft, linkage) {
      return createRecord(authorId, coupleId, draft, linkage);
    },

    async retry(momentId) {
      const moment = moments.get(momentId);
      if (!moment) return { kind: "not_found" };
      if (moment.status !== "failed") return { kind: "invalid_transition" };
      return { kind: "created", moment: await save(moment) };
    },

    async reply(momentId, authorId, draft) {
      const parent = moments.get(momentId);
      if (!parent) return { kind: "not_found" };
      return createRecord(authorId, parent.coupleId, draft, {}, parent.id);
    },

    async react(momentId, userId, emoji) {
      const moment = moments.get(momentId);
      if (!moment) return { kind: "not_found" };
      const parsed = reactionSchema.safeParse(emoji);
      if (!userId.trim() || !parsed.success) return { kind: "validation" };
      const existing = moment.reactions.find((reaction) => reaction.userId === userId);
      if (existing) {
        existing.emoji = parsed.data as MomentReaction;
        existing.createdAt = now().toISOString();
      } else {
        moment.reactions.push({ userId, emoji: parsed.data as MomentReaction, createdAt: now().toISOString() });
      }
      return { kind: "updated", moment: clone(moment) };
    },

    async delete(momentId, authorId) {
      const target = moments.get(momentId);
      if (!target || target.authorId !== authorId) return false;
      const toDelete = [...moments.values()].filter((moment) => moment.id === momentId || moment.parentMomentId === momentId);
      for (const moment of toDelete) {
        moments.delete(moment.id);
        if (moment.mediaUri) await cleanupMedia(moment.mediaUri).catch(() => undefined);
      }
      for (const [inviteId, deliveredMomentId] of inviteGiftMomentIds) {
        if (deliveredMomentId === momentId) inviteGiftMomentIds.delete(inviteId);
      }
      return true;
    },

    async clearCouple(coupleId) {
      const ids = new Set([...moments.values()].filter((moment) => moment.coupleId === coupleId).map((moment) => moment.id));
      for (const [id, moment] of moments) {
        if (ids.has(id)) {
          moments.delete(id);
          if (moment.mediaUri) await cleanupMedia(moment.mediaUri).catch(() => undefined);
        }
      }
      for (const [inviteId, momentId] of inviteGiftMomentIds) {
        if (ids.has(momentId)) inviteGiftMomentIds.delete(inviteId);
      }
    },

    async deliverAcceptedInviteGift(acceptance) {
      if (acceptance.kind !== "accepted" || !acceptance.gift) return null;
      const inviteId = acceptance.invite.id;
      const alreadyDeliveredId = inviteGiftMomentIds.get(inviteId);
      if (alreadyDeliveredId) return moments.has(alreadyDeliveredId) ? clone(moments.get(alreadyDeliveredId)!) : null;
      const gift = acceptance.gift;
      const draft: MomentDraft = gift.kind === "text"
        ? { kind: "text", text: gift.text }
        : gift.kind === "photo"
          ? { kind: "photo", mediaUri: gift.uri, caption: gift.caption, place: "" }
          : { kind: "voice", mediaUri: gift.uri, durationSeconds: gift.durationSeconds, caption: "", place: "" };
      const result = await createRecord(acceptance.invite.inviterId, acceptance.coupleId, draft);
      if (result.kind !== "created" || result.moment.status === "failed") return null;
      inviteGiftMomentIds.set(inviteId, result.moment.id);
      return result.moment;
    },
  };
}

export const localMomentService = createLocalMomentService();
