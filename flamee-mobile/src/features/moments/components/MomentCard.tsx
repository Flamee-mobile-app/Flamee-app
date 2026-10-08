import { Camera, MessageCircle, Mic, Radio, RotateCcw } from "@tamagui/lucide-icons-2";
import { useAudioPlayer } from "expo-audio";
import { Pressable } from "react-native";
import { Image, Text, XStack, YStack } from "tamagui";
import type { Moment } from "../types";
import { AppButton, SectionCard, StatusBanner } from "../../../shared/components";
import { formatMessage, getMessage } from "../../../shared/localization/messages";

const icons = { photo: Camera, voice: Mic, text: MessageCircle, signal: Radio };

type Props = {
  moment: Moment;
  own: boolean;
  partnerName?: string;
  viewerTimezone?: string;
  onOpen: () => void;
  onRetry?: () => void;
};

export function MomentCard({ moment, own, partnerName, viewerTimezone, onOpen, onRetry }: Props) {
  const Icon = icons[moment.kind];
  const mediaUnavailable = (moment.kind === "photo" || moment.kind === "voice") && !moment.mediaUri;
  const voiceUri = moment.kind === "voice" && !mediaUnavailable ? moment.mediaUri : null;
  const player = useAudioPlayer(voiceUri);
  const body = moment.text || moment.caption || getMessage("vi", moment.kind === "photo" ? "photoMoment" : moment.kind === "voice" ? "voiceMoment" : "momentSignal");
  const time = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: viewerTimezone }).format(new Date(moment.createdAt));
  return (
    <SectionCard tone={own ? "peach" : "lavender"}>
      <Pressable onPress={onOpen} accessibilityRole="button">
        <YStack gap="$sm">
        <XStack gap="$sm" alignItems="center">
          <YStack width={40} height={40} borderRadius="$xl" backgroundColor="$surface" alignItems="center" justifyContent="center">
            <Icon size={20} color="$primary" />
          </YStack>
          <YStack flex={1}>
            <Text fontSize="$bodyS" color="$textSecondary">{own ? getMessage("vi", "youLabel") : partnerName ?? getMessage("vi", "partnerGenericName")} · {time}</Text>
            <Text fontSize="$bodyL" color="$textPrimary">{body}</Text>
            {moment.place ? <Text fontSize="$bodyS" color="$textSecondary">{moment.place}</Text> : null}
          </YStack>
        </XStack>
        {moment.kind === "photo" && moment.mediaUri && !mediaUnavailable ? (
          <Image source={{ uri: moment.mediaUri }} width="100%" height={220} borderRadius="$lg" resizeMode="cover" accessibilityLabel={body} />
        ) : null}
        </YStack>
      </Pressable>
        {moment.kind === "voice" && moment.mediaUri && !mediaUnavailable ? (
          <AppButton variant="secondary" icon={<Mic size={18} />} onPress={() => player.play()}>
            {getMessage("vi", "playRecording")}{moment.durationSeconds ? ` · ${moment.durationSeconds}s` : ""}
          </AppButton>
        ) : null}
        {mediaUnavailable ? <StatusBanner tone="warning" title={getMessage("vi", "mediaUnavailableTitle")} description={getMessage("vi", "mediaUnavailableBody")} /> : null}
        {moment.status === "pending" ? (
          <StatusBanner tone="offline" title={getMessage("vi", "momentPendingTitle")} />
        ) : null}
        {moment.status === "failed" ? (
          <YStack gap="$sm">
            <StatusBanner tone="warning" title={getMessage("vi", "momentFailedTitle")} description={getMessage("vi", "momentFailedBody")} />
            {onRetry ? <AppButton variant="ghost" icon={<RotateCcw size={18} />} onPress={onRetry}>{getMessage("vi", "retryUpload")}</AppButton> : null}
          </YStack>
        ) : null}
        {moment.reactions.length ? <Text fontSize="$bodyS" color="$textSecondary">{formatMessage("vi", "reactionCount", { count: moment.reactions.length })} {moment.reactions.map((item) => item.emoji).join(" ")}</Text> : null}
    </SectionCard>
  );
}
