import { Camera } from "@tamagui/lucide-icons-2/icons/Camera";
import { MessageCircle } from "@tamagui/lucide-icons-2/icons/MessageCircle";
import { Mic } from "@tamagui/lucide-icons-2/icons/Mic";
import { Heart } from "@tamagui/lucide-icons-2/icons/Heart";
import { Image, Text, XStack, YStack } from "tamagui";
import { formatMessage, getMessage } from "../../../shared/localization/messages";
import { SectionCard } from "../../../shared/components";
import type { Moment } from "../types";

const icons = { photo: Camera, voice: Mic, text: MessageCircle, signal: Heart };

export function TimelineMomentRow({ moment, own, partnerName, timezone, onOpen }: {
  moment: Moment; own: boolean; partnerName: string; timezone: string; onOpen: () => void;
}) {
  const Icon = icons[moment.kind];
  const name = own ? getMessage("vi", "youLabel") : partnerName;
  const time = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: timezone }).format(new Date(moment.createdAt));
  const body = moment.text || moment.caption || getMessage("vi", moment.kind === "photo" ? "photoMoment" : moment.kind === "voice" ? "voiceMoment" : "momentSignal");
  return (
    <SectionCard accessibilityLabel={formatMessage("vi", "timelineOpenMoment", { name, time })} onPress={onOpen}><XStack gap="$md">
      <YStack alignItems="center" width={40}>
        <YStack width={40} height={40} borderRadius="$md" backgroundColor={own ? "$accentSoft" : "$calmSurface"} alignItems="center" justifyContent="center">
          <Icon size={20} color={own ? "$accentText" : "$calmText"} />
        </YStack>
        <YStack width={1} flex={1} backgroundColor="$border" marginTop="$sm" />
      </YStack>
      <YStack flex={1} minWidth={0} gap="$sm">
        <Text fontFamily="$body" fontSize="$bodyS" lineHeight="$bodyS" color="$textSecondary">{name} · {time}</Text>
        <Text fontFamily="$body" fontSize="$bodyM" lineHeight="$bodyM" color="$textPrimary">{body}</Text>
        {moment.kind === "photo" && moment.mediaUri ? <Image source={{ uri: moment.mediaUri }} width="100%" height={180} borderRadius="$md" resizeMode="cover" accessibilityLabel={body} /> : null}
        {moment.kind === "voice" ? <Text fontFamily="$body" fontSize="$bodyS" color="$accentText">{getMessage("vi", "playRecording")}{moment.durationSeconds ? ` · ${moment.durationSeconds}s` : ""}</Text> : null}
        {moment.status !== "saved_local" ? <Text fontFamily="$body" fontSize="$bodyS" color={moment.status === "failed" ? "$error" : "$textSecondary"}>{getMessage("vi", moment.status === "failed" ? "momentFailedTitle" : "momentPendingTitle")}</Text> : null}
      </YStack>
    </XStack></SectionCard>
  );
}
