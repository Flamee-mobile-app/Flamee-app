import { Brain, Eye, EyeOff, HeartHandshake, ShieldCheck } from "@tamagui/lucide-icons-2";
import { useEffect, useState } from "react";
import { Text, XStack, YStack } from "tamagui";
import { useSessionStore } from "../../../../app/providers/sessionStore";
import { AppButton, SectionCard, StatusBanner } from "../../../shared/components";
import { formatMessage, getMessage } from "../../../shared/localization/messages";
import { localOnboardingService, type LocalAccountSnapshot } from "../../onboarding";

export function PrivacyScreen() {
  const accountId = useSessionStore((session) => session.activeAccountId);
  const [account, setAccount] = useState<LocalAccountSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const load = async () => {
    if (!accountId) { setLoading(false); setFailed(true); return; }
    setLoading(true); setFailed(false);
    try { setAccount(await localOnboardingService.getAccountSnapshot(accountId)); }
    catch { setFailed(true); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [accountId]);
  const rows = [
    { icon: Eye, title: "privacyFullTitle" as const, body: "privacyFullBody" as const },
    { icon: HeartHandshake, title: "privacyMoodTitle" as const, body: "privacyMoodBody" as const },
    { icon: EyeOff, title: "privacyPrivateTitle" as const, body: "privacyPrivateBody" as const },
  ];
  if (loading || (!failed && accountId !== null && account?.accountId !== accountId)) return <YStack gap="$lg"><StatusBanner tone="info" title={getMessage("vi", "loadingTitle")} description={getMessage("vi", "loadingDescription")} /></YStack>;
  if (failed || !accountId || !account) return <YStack gap="$lg"><StatusBanner tone="warning" title={getMessage("vi", "privacyLoadError")} /><AppButton variant="secondary" onPress={() => void load()}>{getMessage("vi", "retry")}</AppButton></YStack>;
  return (
    <YStack gap="$lg">
      {rows.map(({ icon: Icon, title, body }) => <SectionCard key={title}><XStack gap="$sm" alignItems="flex-start"><Icon size={22} color="$primary" /><YStack flex={1} gap="$xs"><Text fontSize="$bodyL" fontWeight="$semibold" color="$textPrimary">{getMessage("vi", title)}</Text><Text fontSize="$bodyM" color="$textSecondary">{getMessage("vi", body)}</Text></YStack></XStack></SectionCard>)}
      <SectionCard tone="lavender"><XStack gap="$sm"><Brain size={22} color="$primary" /><YStack flex={1} gap="$xs"><Text fontSize="$bodyL" fontWeight="$semibold">{getMessage("vi", "privacyAiTitle")}</Text><Text fontSize="$bodyM" color="$textSecondary">{getMessage("vi", "privacyAiBody")}</Text></YStack></XStack></SectionCard>
      <SectionCard><XStack gap="$sm"><ShieldCheck size={22} color="$success" /><YStack flex={1} gap="$xs"><Text fontSize="$bodyL" fontWeight="$semibold">{getMessage("vi", "consentRecordTitle")}</Text><Text fontSize="$bodyM" color="$textSecondary">{account.consentedAt ? formatMessage("vi", "consentRecordBody", { version: account.consentVersion ?? "—", time: new Date(account.consentedAt).toLocaleString("vi-VN") }) : getMessage("vi", "consentRecordMissing")}</Text></YStack></XStack></SectionCard>
    </YStack>
  );
}
