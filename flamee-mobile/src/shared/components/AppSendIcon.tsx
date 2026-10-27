import Svg, { Path } from "react-native-svg";
import { colors } from "../constants/tokens";

/** Filled paper plane matching the approved circular send action. */
export function AppSendIcon() {
  return <Svg width={36} height={36} viewBox="0 0 48 48" accessible={false}>
    <Path transform="translate(0 3)" fill={colors.white} d="M38.7 5.7C41.9 4.9 43.6 6.5 42.8 9.8L35.6 40.1C34.8 43.2 32.8 43.8 31.4 41L24.5 28.1L32.6 17.3C33.5 16.1 32.1 14.9 31 16L20.4 24.5L7.2 20.7C4.2 19.8 4.4 17.6 7.4 16.6L38.7 5.7Z" />
  </Svg>;
}
