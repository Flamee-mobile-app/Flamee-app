import { useState } from "react";
import { Image, StyleSheet } from "react-native";
import { YStack } from "tamagui";
import { AppSkeleton } from "./AppSkeleton";
import { shouldShowImageSkeleton } from "./appSkeletonModel";

type Props = {
  uri: string;
  previewUri?: string | null;
  accessibilityLabel: string;
  resizeMode?: "cover" | "contain";
  onError: () => void;
};

/** The small preview remains visible until the sharp image has decoded. */
function RemoteImage({ uri, previewUri, accessibilityLabel, resizeMode = "cover", onError }: Props) {
  const [loaded, setLoaded] = useState(false);
  const hasPreview = Boolean(previewUri && previewUri !== uri);
  return <YStack width="100%" height="100%" pointerEvents="none">
    {shouldShowImageSkeleton({ loaded, hasPreview }) ? <YStack position="absolute" top={0} right={0} bottom={0} left={0}><AppSkeleton width="100%" height="100%" borderRadius={0} /></YStack> : null}
    {hasPreview && !loaded ? <Image source={{ uri: previewUri! }} resizeMode={resizeMode} accessible={false} fadeDuration={0} style={StyleSheet.absoluteFill} /> : null}
    <Image source={{ uri }} resizeMode={resizeMode} accessibilityLabel={accessibilityLabel}
      onLoad={() => setLoaded(true)} onError={onError} fadeDuration={0}
      style={[StyleSheet.absoluteFill, { opacity: loaded ? 1 : 0 }]} />
  </YStack>;
}

export function AppRemoteImage(props: Props) {
  return <RemoteImage key={props.uri} {...props} />;
}
