import { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { BottomNavigationIcon } from "../../shared/components";
import { colors, navigationTokens } from "../../shared/constants/tokens";
import { useSessionStore } from "../../shared/state/sessionStore";

type ProfileNavigationIconProps = {
  focused: boolean;
  size: number;
};

export function ProfileNavigationIcon({ focused, size }: ProfileNavigationIconProps) {
  const avatarUrl = useSessionStore((session) => session.activeAvatarUrl);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  useEffect(() => setFailedUrl(null), [avatarUrl]);

  if (!avatarUrl || failedUrl === avatarUrl) {
    return <BottomNavigationIcon name="profile" focused={focused} size={size} />;
  }

  const avatarSize = navigationTokens.profileAvatarSize * size / navigationTokens.tabIconSize;
  return (
    <View pointerEvents="none" style={[styles.frame, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
      <Image
        source={{ uri: avatarUrl }}
        resizeMode="cover"
        fadeDuration={160}
        onError={() => setFailedUrl(avatarUrl)}
        accessible={false}
        style={{ width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: colors.surfaceMuted,
    overflow: "hidden",
  },
});
