import { Bell } from "@tamagui/lucide-icons-2/icons/Bell";
import { ChevronRight } from "@tamagui/lucide-icons-2/icons/ChevronRight";
import { Database } from "@tamagui/lucide-icons-2/icons/Database";
import { HeartHandshake } from "@tamagui/lucide-icons-2/icons/HeartHandshake";
import { HelpCircle } from "@tamagui/lucide-icons-2/icons/HelpCircle";
import { Settings } from "@tamagui/lucide-icons-2/icons/Settings";
import { UserRound } from "@tamagui/lucide-icons-2/icons/UserRound";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, XStack, YStack } from "tamagui";
import { useSessionStore } from "../../../shared/state/sessionStore";
import { AppButton, AppHeader, AppScreen, SectionCard, StatusBanner } from "../../../shared/components";
import { formatMessage, getMessage, type MessageKey } from "../../../shared/localization/messages";
import { localCoupleService } from "../../couple";
import { localOnboardingService, type LocalAccountSnapshot } from "../../onboarding";
import { profileSettingsSections } from "../settingsSections";

const rowDetails: Record<(typeof profileSettingsSections)[number], { key: MessageKey; icon: typeof UserRound }> = {
  profile: { key: "profileEditTitle", icon: UserRound },
  care: { key: "careSettingsTitle", icon: HeartHandshake },
  notifications: { key: "notificationSettingsTitle", icon: Bell },
  data: { key: "dataSettingsTitle", icon: Database },
  support: { key: "supportSettingsTitle", icon: HelpCircle },
  account: { key: "accountSettingsTitle", icon: Settings },
};

export function ProfileScreen() {
  const router = useRouter();
  const accountId = useSessionStore((session) => session.activeAccountId);
  const [account, setAccount] = useState<LocalAccountSnapshot | null>(null);
  const [coupleStatus, setCoupleStatus] = useState<{ status: "none" | "waiting" | "paired"; partnerName: string | null }>({ status: "none", partnerName: null });
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const load = async () => {
    if (!accountId) { setLoading(false); setFailed(true); return; }
    setLoading(true); setFailed(false);
    try {
      const [profileSnapshot, membership] = await Promise.all([
        localOnboardingService.getAccountSnapshot(accountId),
        localCoupleService.getMembership(accountId),
      ]);
      setAccount(profileSnapshot);
      setCoupleStatus({
        status: membership.status,
        partnerName: membership.partner?.nickname || membership.partner?.displayName || null,
      });
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void load(); }, [accountId]);

  if (loading || (!failed && accountId !== null && account?.accountId !== accountId)) return <AppScreen><AppHeader eyebrow={getMessage("vi", "profileEyebrow")} title={getMessage("vi", "profileTitle")} /><StatusBanner tone="info" title={getMessage("vi", "loadingTitle")} description={getMessage("vi", "loadingDescription")} /></AppScreen>;
  if (failed || !accountId || !account) return <AppScreen><AppHeader eyebrow={getMessage("vi", "profileEyebrow")} title={getMessage("vi", "profileTitle")} /><StatusBanner tone="warning" title={getMessage("vi", "profileLoadError")} /><AppButton variant="secondary" onPress={() => void load()}>{getMessage("vi", "retry")}</AppButton></AppScreen>;
  const profile = account.profile;
  const relationship = coupleStatus.status === "paired" && coupleStatus.partnerName
    ? formatMessage("vi", "pairedStatusLabel", { name: coupleStatus.partnerName })
    : coupleStatus.status === "waiting" ? getMessage("vi", "waitingPartnerStatusLabel") : getMessage("vi", "unpairedStatusLabel");

  return (
    <AppScreen>
      <AppHeader eyebrow={getMessage("vi", "profileEyebrow")} title={profile.displayName || getMessage("vi", "profileTitle")} subtitle={getMessage("vi", "profileSubtitle")} />
      <SectionCard tone="peach">
        <XStack gap="$md" alignItems="center">
          <YStack width={64} height={64} borderRadius="$xl" backgroundColor="$primary" alignItems="center" justifyContent="center">
            <Text color="$white" fontSize="$h3" fontWeight="$bold">{(profile.displayName || "F").slice(0, 1).toUpperCase()}</Text>
          </YStack>
          <YStack flex={1} gap="$xs">
            <Text fontFamily="$heading" fontSize="$h4" fontWeight="$bold" color="$textPrimary">{profile.displayName}</Text>
            <Text fontSize="$bodyS" color="$textSecondary">{relationship}</Text>
          </YStack>
        </XStack>
      </SectionCard>
      <YStack gap="$sm">
        {profileSettingsSections.map((section) => {
          const { key, icon: Icon } = rowDetails[section];
          return (
          <AppButton key={section} variant="ghost" fill contentAlign="start" icon={<Icon size={20} color="$primary" />} iconAfter={<ChevronRight size={18} color="$textSecondary" />} onPress={() => router.push({ pathname: "/settings", params: { section } })}>
            {getMessage("vi", key)}
          </AppButton>
          );
        })}
      </YStack>
    </AppScreen>
  );
}
