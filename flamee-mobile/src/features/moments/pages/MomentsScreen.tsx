import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Text, XStack, YStack } from "tamagui";
import { authService } from "../../auth";
import { inviteService, orderConnectedMembers, type ConnectionMember } from "../../invites";
import { AppButton, AppGradientText, AppProfileAvatar, AppScreen, AppSheet, AppThoughtBubble, SectionCard, useAppHeader } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { featureTokens, moodFlowTokens } from "../../../shared/constants/tokens";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { ServerMoodWeek, ServerPartnerMood } from "../../checkins";
import { SmartNudgeCard } from "../../nudges";

function MoodProfileAction({ label, avatarUri, fallbackSeed, note, onPress }: { label: string; avatarUri?: string | null; fallbackSeed?: string | null; note?: string | null; onPress: () => void }) {
  return <YStack flex={1} minWidth={0}>
    <SectionCard fill tone="white" density="compact" emphasis="action" showChevron={false} onPress={onPress} accessibilityLabel={label}>
      <YStack alignItems="center" gap="$sm" paddingVertical="$md">
        <AppThoughtBubble density="compact">
          <Text fontFamily="$body" fontSize="$bodyXS" lineHeight="$bodyXS" color={note?.trim() ? "$textPrimary" : "$textSecondary"} textAlign="center" numberOfLines={2}>{note?.trim() || getMessage("vi", "moodHomeNoteEmpty")}</Text>
        </AppThoughtBubble>
        <AppProfileAvatar uri={avatarUri} fallbackSeed={fallbackSeed} size={moodFlowTokens.dashboardArtworkSize} accessibilityLabel={label} />
        <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight="$semibold" color="$textPrimary" textAlign="center">{label}</Text>
      </YStack>
    </SectionCard>
  </YStack>;
}

export function MomentsScreen(_props: { composerRequest?: string; initialText?: string; initialKind?: "text" | "voice" | "photo" | "signal"; fromNudgeId?: string }) {
  const router = useRouter();
  useAppHeader({ title: getMessage("vi", "moodPreviewTitle") });
  const accountId = useSessionStore((session) => session.activeAccountId);
  const coupleId = useSessionStore((session) => session.activeCoupleId);
  const avatarUrl = useSessionStore((session) => session.activeAvatarUrl);
  const [myName, setMyName] = useState(() => authService.getSessionSnapshot()?.user.full_name.trim() ?? "");
  const [partner, setPartner] = useState<ConnectionMember | null>(null);
  const [partnerOpen, setPartnerOpen] = useState(false);
  const [partnerMounted, setPartnerMounted] = useState(false);
  const myLabel = myName || getMessage("vi", "moodHomeMyAction");
  const partnerLabel = partner?.full_name.trim() || getMessage("vi", "moodHomePartnerAction");
  useFocusEffect(useCallback(() => {
    let active = true;
    const session = authService.getSessionSnapshot();
    setMyName(session?.accountId === accountId ? session.user.full_name.trim() : "");
    setPartner(null);
    if (!accountId || !coupleId) return () => { active = false; };
    void inviteService.connection().then((couple) => {
      if (!active || couple.id !== coupleId) return;
      const members = orderConnectedMembers(couple, accountId);
      if (members) setPartner(members[1]);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [accountId, coupleId]));
  useFocusEffect(useCallback(() => () => { setPartnerOpen(false); setPartnerMounted(false); }, []));
  return <AppScreen contentProps={{ width: "100%", maxWidth: featureTokens.maxWidth, alignSelf: "center", paddingBottom: featureTokens.navigationClearance }}>
    <YStack gap="$xl" paddingTop="$sm">
      <YStack gap={0}>
        <Text fontFamily="$heading" fontSize="$h4" lineHeight="$h4" color="$textPrimary" fontWeight="$regular">{getMessage("vi", "moodHomeQuoteLead")}</Text>
        <AppGradientText size="h3" weight="bold">{getMessage("vi", "moodHomeQuoteHighlight")}</AppGradientText>
      </YStack>
      <ServerMoodWeek onOpen={() => router.push("/mood/history")} />
      <YStack gap="$md">
        <AppGradientText size="h4" weight="bold">{getMessage("vi", "moodHomeActions")}</AppGradientText>
        <XStack gap="$md" alignItems="stretch">
          <MoodProfileAction label={myLabel} avatarUri={avatarUrl} fallbackSeed={accountId} onPress={() => router.push("/mood/check-in")} />
          <MoodProfileAction label={partnerLabel} avatarUri={partner?.avatar_url} fallbackSeed={partner?.id ?? "partner"} onPress={() => { setPartnerMounted(true); setPartnerOpen(true); }} />
        </XStack>
      </YStack>
      <SmartNudgeCard />
    </YStack>
    {partnerMounted ? <AppSheet open={partnerOpen} fitContent disableDrag title={partnerLabel} onOpenChange={setPartnerOpen} onAfterClose={() => setPartnerMounted(false)}
      footer={<AppButton fill variant="ghost" onPress={() => setPartnerOpen(false)}>{getMessage("vi", "close")}</AppButton>}>
      <YStack alignItems="center" gap="$lg">
        <AppProfileAvatar uri={partner?.avatar_url} fallbackSeed={partner?.id ?? "partner"} size={moodFlowTokens.dashboardArtworkSize} accessibilityLabel={partnerLabel} />
        <ServerPartnerMood />
      </YStack>
    </AppSheet> : null}
  </AppScreen>;
}
