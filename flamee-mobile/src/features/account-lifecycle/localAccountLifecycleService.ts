import { localAuthService, type LocalAuthService } from "../auth/localAuthService.ts";
import { localCheckInService, type LocalCheckInService } from "../checkins/localCheckInService.ts";
import { localCoupleService, type LocalCoupleService } from "../couple/localCoupleService.ts";
import { localInviteService, type LocalInviteService } from "../invites/localInviteService.ts";
import { localMomentService, type LocalMomentService } from "../moments/localMomentService.ts";
import { localNotificationAdapter, type LocalNotificationAdapter } from "../notifications/localNotificationAdapter.ts";
import { localNudgeService, type LocalNudgeService } from "../nudges/localNudgeService.ts";
import { localOnboardingService, type LocalOnboardingService } from "../onboarding/localOnboardingService.ts";
import { supportRequestSchema } from "./schemas.ts";

export type LocalExportPreview = {
  accountId: string;
  preparedAt: string;
  displayName: string;
  profile: {
    displayName: string;
    partnerNickname: string;
    timezone: string;
    relationType: string | null;
    carePreferences: string[];
    careNote: string;
    avatarAttached: boolean;
  };
  consent: { version: string | null; acceptedAt: string | null };
  couple: { status: "none" | "waiting" | "paired"; partnerName: string | null };
  invite: { status: "open" | null; expiresAt: string | null; hasGift: boolean };
  checkIns: Array<{
    id: string;
    mood: number;
    reasonIds: string[];
    note: string;
    shareScope: string;
    createdAt: string;
    localDate: string;
    storageStatus: string;
  }>;
  nudges: Array<{
    id: string;
    observation: string;
    actionType: string;
    draft: string;
    reason: string;
    tone: string;
    status: string;
    createdAt: string;
    expiresAt: string;
    feedback: unknown;
  }>;
  moments: Array<{
    id: string;
    kind: string;
    text: string | null;
    caption: string | null;
    place: string | null;
    mediaAttached: boolean;
    durationSeconds: number | null;
    createdAt: string;
    status: string;
    reactions: Array<{ userId: string; emoji: string; createdAt: string }>;
  }>;
  notifications: {
    permission: string;
    firstCheckInCompleted: boolean;
    promptDismissed: boolean;
    reminderEnabled: boolean;
    reminderTime: string;
  };
};

export type LocalAccountLifecycleService = {
  prepareLocalExport: (accountId: string) => Promise<{
    kind: "ready";
    delivery: "local_preview_only";
    preparedAt: string;
    preview: LocalExportPreview;
  }>;
  submitLocalSupportRequest: (kind: "contact" | "bug" | "content", message: string) => Promise<
    { kind: "not_sent_local"; requestId: null } | { kind: "validation"; requestId: null }
  >;
  unpair: (accountId: string) => Promise<{ kind: "unpaired"; coupleId: string | null } | { kind: "not_paired" } | { kind: "stale_account" }>;
  signOut: (accountId: string) => Promise<{ kind: "signed_out" | "stale_account" }>;
  deleteLocalAccount: (accountId: string) => Promise<{ kind: "deleted_local" | "stale_account" }>;
};

export type LocalLifecycleSessionPort = {
  getActiveAccountId: () => string | null;
  getActiveCoupleId: () => string | null;
  setActiveCouple: (coupleId: string | null) => void;
  reset: () => void;
};

export type LocalAccountLifecycleServiceOptions = {
  onboarding?: LocalOnboardingService;
  couple?: LocalCoupleService;
  invites?: LocalInviteService;
  checkIns?: LocalCheckInService;
  nudges?: LocalNudgeService;
  moments?: LocalMomentService;
  notifications?: LocalNotificationAdapter;
  auth?: LocalAuthService;
  session?: LocalLifecycleSessionPort;
  now?: () => Date;
  // The local runtime intentionally has no transport; this remains injectable
  // only so callers cannot accidentally mistake a local request for a send.
  sendSupport?: (kind: string, message: string) => Promise<unknown>;
};

export function createLocalAccountLifecycleService({
  onboarding = localOnboardingService,
  couple = localCoupleService,
  invites = localInviteService,
  checkIns = localCheckInService,
  nudges = localNudgeService,
  moments = localMomentService,
  notifications = localNotificationAdapter,
  auth = localAuthService,
  session,
  now = () => new Date(),
}: LocalAccountLifecycleServiceOptions = {}): LocalAccountLifecycleService {
  const isCurrentAccount = (accountId: string): boolean => !session || session.getActiveAccountId() === accountId;

  const clearCoupleScope = async (coupleId: string, accountIds: string[]): Promise<void> => {
    await Promise.all([
      checkIns.clearCouple(coupleId),
      nudges.clearCouple(coupleId),
      moments.clearCouple(coupleId),
      ...accountIds.map((id) => invites.clearAccount(id)),
    ]);
  };

  return {
    async prepareLocalExport(accountId) {
      const preparedAt = now().toISOString();
      const [account, membership, openInvite, accountCheckIns, accountNudges, reminder] = await Promise.all([
        onboarding.getAccountSnapshot(accountId),
        couple.getMembership(accountId),
        invites.getOpenInvite(accountId),
        checkIns.listForAccount(accountId),
        nudges.listForAccount(accountId),
        notifications.getSettings(accountId),
      ]);
      const coupleMoments = membership.coupleId ? await moments.listForCouple(membership.coupleId) : [];
      const preview: LocalExportPreview = {
        accountId,
        preparedAt,
        displayName: account.profile.displayName,
        profile: {
          displayName: account.profile.displayName,
          partnerNickname: account.profile.partnerNickname,
          timezone: account.profile.timezone,
          relationType: account.profile.relationType,
          carePreferences: [...account.profile.carePreferences],
          careNote: account.profile.careNote,
          avatarAttached: Boolean(account.profile.avatarUri),
        },
        consent: { version: account.consentVersion, acceptedAt: account.consentedAt },
        couple: {
          status: membership.status,
          partnerName: membership.partner?.nickname || membership.partner?.displayName || null,
        },
        invite: {
          status: openInvite ? "open" : null,
          expiresAt: openInvite?.expiresAt ?? null,
          hasGift: Boolean(openInvite?.gift),
        },
        checkIns: accountCheckIns.map((item) => ({
          id: item.id,
          mood: item.mood,
          reasonIds: [...item.reasonIds],
          note: item.note,
          shareScope: item.shareScope,
          createdAt: item.createdAt,
          localDate: item.localDate,
          storageStatus: item.storageStatus,
        })),
        nudges: accountNudges.map((item) => ({
          id: item.id,
          observation: item.observation,
          actionType: item.actionType,
          draft: item.draft,
          reason: item.reason,
          tone: item.tone,
          status: item.status,
          createdAt: item.createdAt,
          expiresAt: item.expiresAt,
          feedback: item.feedback ? { ...item.feedback } : null,
        })),
        moments: coupleMoments.map((item) => ({
          id: item.id,
          kind: item.kind,
          text: item.text,
          caption: item.caption,
          place: item.place,
          mediaAttached: Boolean(item.mediaUri),
          durationSeconds: item.durationSeconds,
          createdAt: item.createdAt,
          status: item.status,
          reactions: item.reactions.map((reaction) => ({ ...reaction })),
        })),
        notifications: {
          permission: reminder.permission,
          firstCheckInCompleted: reminder.firstCheckInCompleted,
          promptDismissed: reminder.promptDismissed,
          reminderEnabled: reminder.reminderEnabled,
          reminderTime: reminder.reminderTime,
        },
      };
      return { kind: "ready", delivery: "local_preview_only", preparedAt, preview };
    },

    async submitLocalSupportRequest(kind, message) {
      const parsed = supportRequestSchema.safeParse({ kind, message });
      if (!parsed.success) return { kind: "validation", requestId: null };
      return { kind: "not_sent_local", requestId: null };
    },

    async unpair(accountId) {
      if (!isCurrentAccount(accountId)) return { kind: "stale_account" };
      const membership = await couple.getMembership(accountId);
      if (membership.status !== "paired" || !membership.coupleId) return { kind: "not_paired" };
      const coupleId = membership.coupleId;
      const memberIds = [accountId, membership.partner?.id].filter((id): id is string => Boolean(id));
      await clearCoupleScope(coupleId, memberIds);
      await couple.unpair(accountId);
      session?.setActiveCouple(null);
      return { kind: "unpaired", coupleId };
    },

    async signOut(accountId) {
      if (!isCurrentAccount(accountId)) return { kind: "stale_account" };
      await auth.signOut();
      session?.reset();
      return { kind: "signed_out" };
    },

    async deleteLocalAccount(accountId) {
      if (!isCurrentAccount(accountId)) return { kind: "stale_account" };
      const membership = await couple.getMembership(accountId);
      if (membership.status === "paired" && membership.coupleId) {
        const memberIds = [accountId, membership.partner?.id].filter((id): id is string => Boolean(id));
        await clearCoupleScope(membership.coupleId, memberIds);
        await couple.unpair(accountId);
      } else {
        await invites.clearAccount(accountId);
      }
      await Promise.all([
        checkIns.clearAccount(accountId),
        notifications.clearAccount(accountId),
        onboarding.clearAccount(accountId),
      ]);
      await auth.deleteAccount(accountId);
      session?.reset();
      return { kind: "deleted_local" };
    },
  };
}

export const localAccountLifecycleService = createLocalAccountLifecycleService();
