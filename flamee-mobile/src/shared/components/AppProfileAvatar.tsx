import { useEffect, useState } from "react";
import { Image } from "react-native";
import { YStack } from "tamagui";
import { resolveProfileAvatar } from "./profileAvatarModel";

const portraits = {
  a: require("../assets/avatars/portrait-a.png"),
  b: require("../assets/avatars/portrait-b.png"),
};

type Props = {
  uri?: string | null;
  size: number;
  accessibilityLabel: string;
  fallbackSeed?: string | null;
};

export function AppProfileAvatar({ uri, size, accessibilityLabel, fallbackSeed }: Props) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  useEffect(() => setFailedUri(null), [uri]);
  const avatar = resolveProfileAvatar(uri, failedUri, fallbackSeed ?? "");

  return <YStack role="img" aria-label={accessibilityLabel} width={size} height={size} borderRadius={size / 2} backgroundColor="$surfaceMuted" overflow="hidden" alignItems="center" justifyContent="center">
    <Image source={avatar.kind === "remote" ? { uri: avatar.uri } : portraits[avatar.variant]} resizeMode="cover"
      onError={avatar.kind === "remote" ? () => setFailedUri(avatar.uri) : undefined} style={{ width: size, height: size }} accessible={false} />
  </YStack>;
}
