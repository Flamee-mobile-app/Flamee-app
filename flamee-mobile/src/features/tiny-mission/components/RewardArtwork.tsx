import { Image, StyleSheet } from "react-native";
import { YStack } from "tamagui";
import { missionTokens as t } from "../../../shared/constants/tokens";
import { getMessage } from "../../../shared/localization/messages";
import { rewardArtwork } from "../rewardArtwork";
import { MissionIllustration } from "./MissionIllustrations";

export function RewardArtwork({ id, title, size, rounded = false }: { id: string; title: string; size?: number; rounded?: boolean }) {
  const image = rewardArtwork(id);
  return <YStack width={size ?? "100%"} aspectRatio={t.rewardAspectRatio} backgroundColor={t.peach} alignItems="center" justifyContent="center" overflow="hidden" borderRadius={rounded ? t.rewardImageRadius : size ? t.rewardRadius : 0}>
    {image ? <Image source={image} resizeMode="cover" accessibilityLabel={`${title}. ${getMessage("vi", "missionRewardIllustration")}`} style={[StyleSheet.absoluteFill, { width: "100%", height: "100%" }]} /> : <MissionIllustration kind="gift" size={t.rewardWalletMascotSize} />}
  </YStack>;
}
