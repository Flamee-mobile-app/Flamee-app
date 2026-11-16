import { useMemo, useRef, useState } from "react";
import { Image } from "react-native";
import { YStack } from "tamagui";
import { avatarObjectKey, resolveProfileAvatar } from "./profileAvatarModel";
import { AppSkeleton } from "./AppSkeleton";

const portraits = {
  a: require("../assets/avatars/portrait-a.png"),
  b: require("../assets/avatars/portrait-b.png"),
};

type Props = {
  uri?: string | null;
  size: number;
  accessibilityLabel: string;
  fallbackSeed?: string | null;
  onRefresh?: () => void | Promise<unknown>;
  loading?: boolean;
};

export function AppProfileAvatar({ uri, size, accessibilityLabel, fallbackSeed, onRefresh, loading = false }: Props) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<{ uri: string; seed: string } | null>(null);
  const [recovering, setRecovering] = useState<string | null>(null);
  const recovery = useRef<string | null>(null);
  const seed = fallbackSeed ?? "";
  const current = useRef({ uri, seed });
  current.current = { uri, seed };
  const avatar = resolveProfileAvatar(uri, failedUri, seed, loaded);
  const displayedUri = avatar.kind === "remote" ? avatar.uri : null;
  const variant = avatar.kind === "default" ? avatar.variant : "a";
  const source = useMemo(() => displayedUri ? { uri: displayedUri, cache: "force-cache" as const } : portraits[variant], [displayedUri, variant]);
  const pending = Boolean(uri && displayedUri && uri !== displayedUri && uri !== failedUri);
  const accept = (imageUri: string) => {
    if (current.current.uri === imageUri && current.current.seed === seed) setLoaded({ uri: imageUri, seed });
  };
  const fail = (imageUri: string) => {
    if (current.current.uri !== imageUri || current.current.seed !== seed) return;
    setFailedUri(imageUri);
    const key = JSON.stringify([seed, avatarObjectKey(imageUri)]);
    // One automatic recovery per asset; renewed bad URLs must not create a fetch loop.
    if (recovery.current !== key && onRefresh) {
      recovery.current = key; setRecovering(key);
      try { void Promise.resolve(onRefresh()).catch(() => undefined).finally(() => setRecovering((value) => value === key ? null : value)); }
      catch { setRecovering(null); }
    }
  };

  return <YStack role="img" aria-label={accessibilityLabel} width={size} height={size} borderRadius={size / 2} backgroundColor="$surfaceMuted" overflow="hidden" alignItems="center" justifyContent="center">
    {avatar.kind === "default" && (loading || recovering === JSON.stringify([seed, uri ? avatarObjectKey(uri) : ""])) ? <AppSkeleton width={size} height={size} borderRadius={size / 2} /> : <Image source={source} resizeMode="cover" fadeDuration={0}
      onLoad={displayedUri ? () => accept(displayedUri) : undefined}
      onError={displayedUri ? () => fail(displayedUri) : undefined} style={{ width: size, height: size }} accessible={false} />}
    {pending && uri ? <Image key={uri} source={{ uri, cache: "reload" }} resizeMode="cover" fadeDuration={0}
      onLoad={() => accept(uri)} onError={() => fail(uri)} style={{ position: "absolute", width: size, height: size, opacity: 0 }} accessible={false} /> : null}
    {displayedUri && !(loaded?.uri === displayedUri && loaded.seed === seed) ? <YStack position="absolute" top={0} left={0} pointerEvents="none">
      <AppSkeleton width={size} height={size} borderRadius={size / 2} />
    </YStack> : null}
  </YStack>;
}
