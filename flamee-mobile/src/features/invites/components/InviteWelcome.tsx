import { Image, StyleSheet } from "react-native";
import { Text, YStack } from "tamagui";
import { inviteSceneTokens } from "../../../shared/constants/tokens";
import { getMessage } from "../../../shared/localization/messages";

export function InviteWelcome() {
  return <YStack alignItems="center" width="100%" gap="$lg">
    <YStack maxWidth={inviteSceneTokens.chooserWidth} backgroundColor="$surface" borderRadius="$lg" paddingHorizontal="$xl" paddingVertical="$lg">
      <Text fontFamily="$body" fontSize="$bodyL" lineHeight="$bodyL" fontWeight="$medium" color="$textPrimary" textAlign="center">{getMessage("vi", "inviteMascotReminder")}</Text>
      <YStack position="absolute" bottom={-6} alignSelf="center" width={14} height={14} backgroundColor="$surface" rotate="45deg" pointerEvents="none" />
    </YStack>
    <Image source={require("../../../public/mascot-sticker/image(3).png")} resizeMode="contain" fadeDuration={0} style={styles.mascot} accessible={false} />
  </YStack>;
}

const styles = StyleSheet.create({ mascot: { width: inviteSceneTokens.mascotSize, height: inviteSceneTokens.mascotSize } });
