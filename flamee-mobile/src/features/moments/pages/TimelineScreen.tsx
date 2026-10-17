import { HeartHandshake } from "@tamagui/lucide-icons-2/icons/HeartHandshake";
import { Plus } from "@tamagui/lucide-icons-2/icons/Plus";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { SectionList } from "react-native";
import { ScrollView, Text, XStack, YStack } from "tamagui";
import { AppButton, AppFilterChip, SectionCard, AsyncStateView, FeatureScreen } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { localCoupleService, type CoupleMembership } from "../../couple";
import { localOnboardingService } from "../../onboarding";
import { TimelineMomentRow } from "../components/TimelineMomentRow";
import { localMomentService } from "../localMomentService";
import { groupTimelineMoments, type TimelineView } from "../timelineModel";
import type { Moment } from "../types";

export function TimelineScreen() {
  const router = useRouter();
  const accountId = useSessionStore((state) => state.activeAccountId);
  const [snapshot, setSnapshot] = useState<{ accountId: string; membership: CoupleMembership; timezone: string; moments: Moment[] } | null>(null);
  const [view, setView] = useState<TimelineView>("timeline");
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const revision = useRef(0);
  const load = useCallback(async () => {
    const request = ++revision.current;
    setLoading(true);
    setFailed(false);
    try {
      if (!accountId) throw new Error("Session required");
      const [membership, account] = await Promise.all([
        localCoupleService.getMembership(accountId), localOnboardingService.getAccountSnapshot(accountId),
      ]);
      const moments = membership.status === "paired" && membership.coupleId ? await localMomentService.listForCouple(membership.coupleId) : [];
      if (request === revision.current && useSessionStore.getState().activeAccountId === accountId) setSnapshot({ accountId, membership, timezone: account.profile.timezone, moments });
    } catch {
      if (request === revision.current) setFailed(true);
    } finally {
      if (request === revision.current) setLoading(false);
    }
  }, [accountId]);
  useFocusEffect(useCallback(() => { void load(); return () => { revision.current += 1; }; }, [load]));

  const current = snapshot?.accountId === accountId ? snapshot : null;
  const membership = current?.membership;
  const coupleId = membership?.status === "paired" ? membership.coupleId : null;
  const paired = Boolean(coupleId);
  const sections = coupleId && current ? groupTimelineMoments(current.moments, coupleId, current.timezone, view) : [];
  const partnerName = membership?.partner?.nickname || membership?.partner?.displayName || getMessage("vi", "partnerGenericName");
  const formatDate = (timestamp: string) => new Intl.DateTimeFormat("vi-VN", { day: "numeric", month: "long", year: "numeric", timeZone: current?.timezone }).format(new Date(timestamp));
  const openComposer = () => router.navigate({ pathname: "/(main)/moments", params: { composeRequest: `timeline-${Date.now()}` } });

  return (
    <FeatureScreen title={getMessage("vi", "timelineTitle")} scroll={false}>
      <XStack gap="$sm" flexWrap="wrap" role="group" aria-label={getMessage("vi", "timelineTitle")}>
        <AppFilterChip selectionMode="single" label={getMessage("vi", "timelineFeed")} selected={view === "timeline"} onPress={() => setView("timeline")} />
        <AppFilterChip selectionMode="single" label={getMessage("vi", "timelineMemories")} selected={view === "memories"} onPress={() => setView("memories")} />
      </XStack>
      {failed || loading || !current || !paired ? <ScrollView flex={1} contentContainerStyle={{ flexGrow: 1 }}>
        {failed ? <AsyncStateView variant="error" title="localMomentUnavailableTitle" description="localMomentUnavailableBody" actionLabel="retry" onAction={() => void load()} /> : loading || !current ? <AsyncStateView variant="loading" title="momentsLoadingTitle" description="momentsLoadingBody" /> : (
        <AsyncStateView variant="empty" title="momentsNeedPartnerTitle" description="momentsNeedPartnerBody" actionLabel="fabConnection" onAction={() => router.push("/connection")} />
        )}
      </ScrollView> : (
        <SectionList
          style={{ flex: 1 }}
          sections={sections}
          keyExtractor={(item) => item.id}
          extraData={view}
          stickySectionHeadersEnabled={false}
          refreshing={loading}
          onRefresh={() => void load()}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={view === "memories" && membership?.connectedAt ? (
            <YStack marginBottom="$lg"><SectionCard tone="peach">
              <HeartHandshake size={28} color="$accentText" />
              <Text fontFamily="$heading" fontSize="$h5" fontWeight="$semibold" color="$textPrimary">{getMessage("vi", "memoryConnectedTitle")}</Text>
              <Text fontFamily="$body" fontSize="$bodyM" color="$accentText">{formatDate(membership.connectedAt)}</Text>
            </SectionCard></YStack>
          ) : null}
          ListEmptyComponent={<AsyncStateView variant="empty" title={view === "timeline" ? "timelineEmptyTitle" : "memoriesEmptyTitle"} description={view === "timeline" ? "timelineEmptyBody" : "memoriesEmptyBody"} actionLabel="createMoment" onAction={openComposer} />}
          renderSectionHeader={({ section }) => <Text fontFamily="$heading" fontSize="$bodyL" fontWeight="$semibold" color="$textPrimary" paddingVertical="$md">{formatDate(section.timestamp)}</Text>}
          renderItem={({ item }) => <TimelineMomentRow moment={item} own={item.authorId === accountId} partnerName={partnerName} timezone={current.timezone} onOpen={() => router.push({ pathname: "/moment/[momentId]", params: { momentId: item.id } })} />}
        />
      )}
      {!loading && !failed && paired && sections.length > 0 ? <AppButton icon={<Plus size={18} />} onPress={openComposer}>{getMessage("vi", "createMoment")}</AppButton> : null}
    </FeatureScreen>
  );
}
