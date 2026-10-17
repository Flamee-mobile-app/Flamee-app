import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { AppButton, AsyncStateView, FeatureScreen } from "../../../shared/components";
import { Text, YStack } from "tamagui";
import { getMessage } from "../../../shared/localization/messages";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { localNudgeService } from "../localNudgeService";
import { selectActionableNudges } from "../taskFeed";
import type { Nudge } from "../types";

export function TasksScreen() {
  const router = useRouter();
  const accountId = useSessionStore((state) => state.activeAccountId);
  const [tasks, setTasks] = useState<Nudge[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    if (!accountId) {
      setLoading(false);
      setFailed(true);
      return;
    }
    setLoading(true);
    setFailed(false);
    try {
      setTasks(selectActionableNudges(await localNudgeService.listForAccount(accountId)));
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  return (
    <FeatureScreen title={getMessage("vi", "tasksTitle")}>
      {loading ? <AsyncStateView variant="loading" title="loadingTitle" description="loadingDescription" /> : null}
      {failed ? <AsyncStateView variant="error" title="localNudgeUnavailableTitle" description="localNudgeUnavailableBody" actionLabel="retry" onAction={() => void load()} /> : null}
      {!loading && !failed && tasks.length === 0 ? (
        <AsyncStateView variant="empty" title="tasksEmptyTitle" description="tasksEmptyBody" />
      ) : null}
      {!loading && !failed ? tasks.map((task) => (
        <YStack key={task.id} gap="$md" paddingVertical="$md" borderBottomWidth={1} borderBottomColor="$border">
          <Text fontFamily="$heading" fontSize="$h5" lineHeight="$h5" fontWeight="$semibold" color="$textPrimary">{task.observation}</Text>
          <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textSecondary">{task.reason}</Text>
          <AppButton onPress={() => router.push({ pathname: "/nudge/[nudgeId]", params: { nudgeId: task.id } })}>
            {getMessage("vi", "viewNudge")}
          </AppButton>
        </YStack>
      )) : null}
    </FeatureScreen>
  );
}
