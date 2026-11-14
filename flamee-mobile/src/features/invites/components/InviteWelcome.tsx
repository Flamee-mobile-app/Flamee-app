import { Image, StyleSheet } from "react-native";
import { Text, YStack } from "tamagui";
import { getMessage } from "../../../shared/localization/messages";

export function InviteWelcome() {
  return <YStack alignItems="center" width="100%" gap="$md">
    <Image source={require("../assets/onboarding-couple.png")} resizeMode="contain" fadeDuration={0} style={styles.artwork} accessible={false} />
    <YStack backgroundColor="$accentSoft" borderRadius="$lg" paddingHorizontal="$lg" paddingVertical="$md">
      <Text fontFamily="$body" fontSize="$bodyL" lineHeight="$bodyL" fontWeight="$medium" color="$textPrimary" textAlign="center">{getMessage("vi", "onboardingConnectMessage")}</Text>
      <YStack position="absolute" bottom={-5} alignSelf="center" width={12} height={12} backgroundColor="$accentSoft" rotate="45deg" pointerEvents="none" />
    </YStack>
  </YStack>;
}

const styles = StyleSheet.create({ artwork: { width: "100%", aspectRatio: 1672 / 941, borderRadius: 16 } });
