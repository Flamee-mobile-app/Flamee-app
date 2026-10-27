import { View } from "react-native";
import { AppProfileAvatar } from "../../shared/components";
import { navigationTokens } from "../../shared/constants/tokens";
import { getMessage } from "../../shared/localization/messages";
import { useSessionStore } from "../../shared/state/sessionStore";

type ProfileNavigationIconProps = {
  focused: boolean;
  size: number;
};

export function ProfileNavigationIcon({ focused, size }: ProfileNavigationIconProps) {
  const avatarUrl = useSessionStore((session) => session.activeAvatarUrl);
  const accountId = useSessionStore((session) => session.activeAccountId);
  const avatarSize = navigationTokens.profileAvatarSize * size / navigationTokens.tabIconSize;
  return (
    <View pointerEvents="none" accessible={false} style={{ opacity: focused ? 1 : 0.9 }}>
      <AppProfileAvatar uri={avatarUrl} fallbackSeed={accountId} size={avatarSize} accessibilityLabel={getMessage("vi", "profileAvatarLabel")} />
    </View>
  );
}
