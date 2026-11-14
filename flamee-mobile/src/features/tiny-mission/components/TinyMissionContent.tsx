import { CalendarDays } from "@tamagui/lucide-icons-2/icons/CalendarDays";
import { Gift } from "@tamagui/lucide-icons-2/icons/Gift";
import { Trophy } from "@tamagui/lucide-icons-2/icons/Trophy";
import { useEffect, useState } from "react";
import { useWindowDimensions } from "react-native";
import { XStack, YStack } from "tamagui";
import { AppFilterChip, appToast } from "../../../shared/components";
import { missionTokens as t } from "../../../shared/constants/tokens";
import type { MissionPreview } from "../previewContent";
import { copy, MissionAchievements, MissionDetail, MissionDivider, MissionPreviewNotice, MissionRewards, MissionWallet, TodayMissions } from "./MissionViews";
import { MissionOverlays, type MissionOverlay } from "./MissionOverlays";

const tabs = ["missionToday", "missionAchievements", "missionRewards"] as const;
const tabIcons = [CalendarDays, Trophy, Gift];
const missionUnavailable = () => appToast.info(copy("missionUnavailable"));

/** Shared by the app screen and the isolated visual QA entry; sample data only. */
export function TinyMissionContent({ mission, onDetails, active = true }: { mission: MissionPreview | null; onDetails: (mission: MissionPreview) => void; active?: boolean }) {
  const [tab, setTab] = useState<typeof tabs[number]>("missionToday");
  const [overlay, setOverlay] = useState<MissionOverlay | null>(null);
  useEffect(() => { if (!active) setOverlay(null); }, [active]);
  const { width } = useWindowDimensions();
  return <>
    {mission ? <MissionDetail mission={mission} onComplete={missionUnavailable} onSwap={() => setOverlay({ kind: "swap", mission })} /> : <>
      <XStack borderBottomWidth={1} borderColor={t.line}>
        {tabs.map((key, index) => { const Icon = tabIcons[index]; return <YStack key={key} flex={1} flexBasis={0} minWidth={0}><AppFilterChip fill showCheck={false} presentation="tab" selectionMode="single" selected={tab === key} label={copy(key)} icon={width >= t.compactWidth ? <Icon size={16} color={tab === key ? t.coral : t.muted} /> : undefined} onPress={() => setTab(key)} testID={`tiny-${key}`} /></YStack>; })}
      </XStack>
      {tab === "missionToday" ? <><MissionWallet onRewards={() => setTab("missionRewards")} /><TodayMissions onDetails={onDetails} onSwap={(item) => setOverlay({ kind: "swap", mission: item })} onRules={() => setOverlay({ kind: "rules" })} /></>
        : tab === "missionAchievements" ? <MissionAchievements onHistory={() => setOverlay({ kind: "points" })} />
        : <><MissionWallet rewards onHistory={() => setOverlay({ kind: "gifts" })} /><MissionDivider /><MissionRewards onRedeem={(reward) => setOverlay({ kind: "redeem", reward })} /></>}
      <MissionPreviewNotice />
    </>}
    <MissionOverlays overlay={overlay} close={() => setOverlay(null)} change={setOverlay} />
  </>;
}
