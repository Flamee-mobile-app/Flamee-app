import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { YStack } from "tamagui";
import { AppButton, AsyncStateView, FeatureScreen, SectionCard } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { authService, type AuthSession } from "../../auth";

export function ConnectionScreen() {
  const router = useRouter();
  const accountId = useSessionStore((state) => state.activeAccountId);
  const [snapshot, setSnapshot] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const revision = useRef(0);
  const load = useCallback(async () => {
    const request = ++revision.current;
    setLoading(true); setFailed(false); setSnapshot(null);
    try {
      const session = await authService.refreshCurrentSession();
      if (request !== revision.current || useSessionStore.getState().activeAccountId !== accountId) return;
      if (!session || session.accountId !== accountId) throw new Error("Session unavailable");
      setSnapshot(session);
      useSessionStore.getState().setActiveCouple(session.user.couple_id ?? null);
    } catch { if (request === revision.current) setFailed(true); }
    finally { if (request === revision.current) setLoading(false); }
  }, [accountId]);
  useFocusEffect(useCallback(() => { void load(); return () => { revision.current += 1; }; }, [load]));
  return <FeatureScreen title={getMessage("vi", "connectionTitle")} showBack withBottomNavigation={false}>
    {loading ? <AsyncStateView variant="loading" /> : failed || snapshot?.accountId !== accountId ? <AsyncStateView variant="error" actionLabel="retry" onAction={() => void load()} /> : <YStack gap="$lg">
      <SectionCard title={getMessage("vi", snapshot.user.couple_id ? "connectionPairedTitle" : "connectionEmptyTitle")}>
        {snapshot.user.couple_id ? <AppButton variant="secondary" onPress={() => router.push({ pathname: "/settings", params: { section: "account" } })}>{getMessage("vi", "connectionManage")}</AppButton> : <>
          <AppButton onPress={() => router.push("/(invite)")}>{getMessage("vi", "pairNow")}</AppButton>
          <AppButton variant="secondary" onPress={() => router.push({ pathname: "/(invite)", params: { mode: "join" } })}>{getMessage("vi", "connectionReceive")}</AppButton>
          <AppButton variant="ghost" onPress={() => router.push("/(waiting)")}>{getMessage("vi", "viewWaitingInvite")}</AppButton>
        </>}
      </SectionCard>
    </YStack>}
  </FeatureScreen>;
}
