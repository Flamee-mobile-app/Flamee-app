import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { SectionCard, AsyncStateView, FeatureScreen } from "../../../shared/components";
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
        <SectionCard key={task.id} title={task.observation} description={task.reason} accessibilityLabel={getMessage("vi", "viewNudge")} onPress={() => router.push({ pathname: "/nudge/[nudgeId]", params: { nudgeId: task.id } })} />
      )) : null}
    </FeatureScreen>
  );
}
