import { HeartHandshake } from "@tamagui/lucide-icons-2/icons/HeartHandshake";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Image, Text, YStack } from "tamagui";
import { AppButton, AsyncStateView, FeatureScreen } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { localCoupleService, type CoupleMembership } from "../localCoupleService";

export function ConnectionScreen() {
  const router = useRouter();
  const accountId = useSessionStore((state) => state.activeAccountId);
  const [snapshot, setSnapshot] = useState<{ accountId: string; membership: CoupleMembership } | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const revision = useRef(0);
  const load = useCallback(async () => {
    const request = ++revision.current;
    setLoading(true); setFailed(false);
    try {
      if (!accountId) throw new Error("Session required");
      const membership = await localCoupleService.getMembership(accountId);
      if (request === revision.current && useSessionStore.getState().activeAccountId === accountId) setSnapshot({ accountId, membership });
    } catch {
      if (request === revision.current) setFailed(true);
    } finally {
      if (request === revision.current) setLoading(false);
    }
  }, [accountId]);
  useFocusEffect(useCallback(() => { void load(); return () => { revision.current += 1; }; }, [load]));
  const membership = snapshot?.accountId === accountId ? snapshot.membership : null;
  const partner = membership?.status === "paired" ? membership.partner : null;
  const name = partner?.nickname || partner?.displayName || getMessage("vi", "partnerGenericName");

  return (
    <FeatureScreen title={getMessage("vi", "connectionTitle")} showBack withBottomNavigation={false}>
      {failed ? <AsyncStateView variant="error" actionLabel="retry" onAction={() => void load()} /> : loading || !membership ? <AsyncStateView variant="loading" /> : (
        <YStack gap="$xl" alignItems="center" paddingVertical="$xl">
          <YStack width={80} height={80} borderRadius="$xl" backgroundColor="$accentSoft" alignItems="center" justifyContent="center" overflow="hidden">
            {partner?.avatarUri ? <Image source={{ uri: partner.avatarUri }} width="100%" height="100%" accessibilityLabel={name} /> : <HeartHandshake size={40} color="$accentText" />}
          </YStack>
          <Text textAlign="center" fontFamily="$heading" fontSize="$h4" lineHeight="$h4" fontWeight="$semibold" color="$textPrimary">{getMessage("vi", membership.status === "paired" ? "connectionPairedTitle" : membership.status === "waiting" ? "connectionWaitingTitle" : "connectionEmptyTitle")}</Text>
          <Text textAlign="center" fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary">{partner ? name : getMessage("vi", membership.status === "waiting" ? "waitingHomeBody" : "connectionEmptyBody")}</Text>
          <YStack width="100%" gap="$md">
            {membership.status === "paired" ? <>
              <AppButton onPress={() => router.navigate("/(main)/timeline")}>{getMessage("vi", "timelineTitle")}</AppButton>
              <AppButton variant="secondary" onPress={() => router.push({ pathname: "/settings", params: { section: "account" } })}>{getMessage("vi", "connectionManage")}</AppButton>
            </> : membership.status === "waiting" ? (
              <AppButton onPress={() => router.push("/(waiting)")}>{getMessage("vi", "viewWaitingInvite")}</AppButton>
            ) : <>
              <AppButton onPress={() => router.push({ pathname: "/(onboarding)", params: { start: "partner" } })}>{getMessage("vi", "pairNow")}</AppButton>
              <AppButton variant="secondary" onPress={() => router.push({ pathname: "/(invite)", params: { mode: "join" } })}>{getMessage("vi", "connectionReceive")}</AppButton>
            </>}
          </YStack>
        </YStack>
      )}
    </FeatureScreen>
  );
}
