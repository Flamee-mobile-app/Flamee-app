import { Image, StyleSheet } from "react-native";
import { XStack } from "tamagui";
import { loginTokens } from "../../../shared/constants/tokens";
import { getMessage } from "../../../shared/localization/messages";

const symbol = require("../assets/flamee-symbol.png");
const wordmark = require("../assets/flamee-wordmark.png");

export function FlameeLogo() {
  return (
    <XStack alignItems="center" justifyContent="center" gap="$md" accessible role="img" aria-label={getMessage("vi", "appName")}>
      <Image source={symbol} resizeMode="contain" fadeDuration={0} style={styles.symbol} accessible={false} />
      <Image source={wordmark} resizeMode="contain" fadeDuration={0} style={styles.wordmark} accessible={false} />
    </XStack>
  );
}

const styles = StyleSheet.create({
  symbol: { width: loginTokens.symbolWidth, height: loginTokens.symbolWidth * 266 / 223 },
  wordmark: { width: loginTokens.wordmarkWidth, height: loginTokens.wordmarkWidth * 168 / 772 },
});
