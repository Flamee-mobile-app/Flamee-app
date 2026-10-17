import { Clock3 } from "@tamagui/lucide-icons-2/icons/Clock3";
import { Copy } from "@tamagui/lucide-icons-2/icons/Copy";
import { RefreshCw } from "@tamagui/lucide-icons-2/icons/RefreshCw";
import { Share2 } from "@tamagui/lucide-icons-2/icons/Share2";
import { useEffect, useRef, useState } from "react";
import { Text, XStack, YStack } from "tamagui";
import { AppButton, AppDialog } from "../../../shared/components";
import { getMessage } from "../../../shared/localization/messages";
import { getInviteCountdown, splitInviteCode } from "../inviteCodePresentation";

type InviteAction = "share" | "copy" | "recreate" | null;

type InviteCodeCardProps = {
  code: string;
  expiresAt: string;
  action: InviteAction;
  onShare: () => void;
  onCopy: () => void;
  onRecreate: () => void;
  onExpired: () => void;
};

function CountdownUnit({ value, label }: { value: string; label: string }) {
  return (
    <YStack minWidth={64} alignItems="center" gap="$xs">
      <Text fontFamily="$heading" fontSize="$h3" lineHeight="$h3" fontWeight="$bold" color="$textPrimary">
        {value}
      </Text>
      <Text fontFamily="$body" fontSize="$caption" lineHeight="$caption" color="$textSecondary">
        {label}
      </Text>
    </YStack>
  );
}

export function InviteCodeCard({ code, expiresAt, action, onShare, onCopy, onRecreate, onExpired }: InviteCodeCardProps) {
  const [now, setNow] = useState(Date.now());
  const [confirmingRecreate, setConfirmingRecreate] = useState(false);
  const expiredNotified = useRef(false);
  const countdown = getInviteCountdown(expiresAt, now);
  const characters = splitInviteCode(code);
  const busy = action !== null;

  useEffect(() => {
    setNow(Date.now());
    setConfirmingRecreate(false);
    expiredNotified.current = false;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [code, expiresAt]);

  useEffect(() => {
    if (!countdown.expired || expiredNotified.current) return;
    expiredNotified.current = true;
    onExpired();
  }, [countdown.expired, onExpired]);

  return (
    <YStack flex={1} justifyContent="center" gap="$xl">
      <YStack alignItems="center" gap="$md">
        <YStack width="100%" alignItems="center" gap="$sm">
          <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight="$semibold" color="$textSecondary">
            {getMessage("vi", "inviteCodeLabel")}
          </Text>
          <XStack width="100%" maxWidth={360} justifyContent="center" gap="$xs" aria-label={`${getMessage("vi", "inviteCodeLabel")}: ${code}`}>
            {characters.map((character, index) => (
              <YStack
                key={`${index}-${character}`}
                flex={1}
                maxWidth={48}
                height={58}
                borderRadius="$md"
                borderWidth={2}
                borderColor={countdown.expired ? "$border" : "$supportPeach"}
                backgroundColor={countdown.expired ? "$surfaceMuted" : "$supportPeachLight"}
                alignItems="center"
                justifyContent="center"
              >
                <Text
                  fontFamily="$heading"
                  fontSize="$h3"
                  lineHeight="$h3"
                  fontWeight="$bold"
                  color={countdown.expired ? "$textSecondary" : "$textPrimary"}
                >
                  {character}
                </Text>
              </YStack>
            ))}
          </XStack>
        </YStack>

        <YStack
          width="100%"
          maxWidth={360}
          borderRadius="$lg"
          backgroundColor={countdown.expired ? "$accentSoft" : "$surfaceMuted"}
          padding="$lg"
          alignItems="center"
          gap="$md"
        >
          <XStack alignItems="center" gap="$sm">
            <Clock3 size={18} color={countdown.expired ? "$error" : "$accentText"} />
            <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" fontWeight="$semibold" color="$textPrimary">
              {getMessage("vi", countdown.expired ? "inviteCountdownExpired" : "inviteCountdownLabel")}
            </Text>
          </XStack>
          <XStack alignItems="flex-start" justifyContent="center" gap="$xs">
            <CountdownUnit value={countdown.hours} label={getMessage("vi", "countdownHours")} />
            <Text fontFamily="$heading" fontSize="$h3" lineHeight="$h3" fontWeight="$bold" color="$textSecondary">:</Text>
            <CountdownUnit value={countdown.minutes} label={getMessage("vi", "countdownMinutes")} />
            <Text fontFamily="$heading" fontSize="$h3" lineHeight="$h3" fontWeight="$bold" color="$textSecondary">:</Text>
            <CountdownUnit value={countdown.seconds} label={getMessage("vi", "countdownSeconds")} />
          </XStack>
        </YStack>

        <Text maxWidth={360} fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary" textAlign="center">
          {getMessage("vi", "inviteOneTimeHint")}
        </Text>
      </YStack>

      <AppDialog open={confirmingRecreate} onOpenChange={setConfirmingRecreate} dismissible={!busy}
        title={getMessage("vi", "recreateInviteConfirmTitle")} description={getMessage("vi", "recreateInviteConfirmBody")}>
        <YStack gap="$sm">
          <AppButton fill variant="destructive" loading={action === "recreate"} onPress={onRecreate}>{getMessage("vi", "confirmRecreateInvite")}</AppButton>
          <AppButton fill variant="ghost" disabled={busy} onPress={() => setConfirmingRecreate(false)}>{getMessage("vi", "keepCurrentInvite")}</AppButton>
        </YStack>
      </AppDialog>
        <YStack gap="$sm">
          <AppButton fill loading={action === "share"} disabled={countdown.expired || busy} icon={<Share2 size={18} />} onPress={onShare}>
            {getMessage("vi", "shareInvite")}
          </AppButton>
          <AppButton fill variant="secondary" loading={action === "copy"} disabled={countdown.expired || busy} icon={<Copy size={18} />} onPress={onCopy}>
            {getMessage("vi", "copyInviteCode")}
          </AppButton>
          <AppButton
            fill
            variant={countdown.expired ? "primary" : "secondary"}
            disabled={busy}
            icon={<RefreshCw size={18} />}
            onPress={() => setConfirmingRecreate(true)}
          >
            {getMessage("vi", "recreateInvite")}
          </AppButton>
        </YStack>

    </YStack>
  );
}
