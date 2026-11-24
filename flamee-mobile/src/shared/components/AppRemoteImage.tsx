import { useEffect, useMemo, useRef, useState } from "react";
import { Image, StyleSheet } from "react-native";
import Animated, { cancelAnimation, Easing, runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { YStack } from "tamagui";
import { AppSkeleton } from "./AppSkeleton";
import { shouldShowImageSkeleton } from "./appSkeletonModel";
import { buttonTokens } from "../constants/tokens";

type Props = {
  uri: string;
  previewUri?: string | null;
  accessibilityLabel: string;
  resizeMode?: "cover" | "contain";
  onError: () => void;
  loadFull?: boolean;
};

/** The small preview remains visible until the sharp image has decoded. */
function RemoteImage({ uri, previewUri, accessibilityLabel, resizeMode = "cover", onError, loadFull = true }: Props) {
  const [fullVisible, setFullVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [fullFailed, setFullFailed] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const requested = useRef(loadFull);
  if (loadFull) requested.current = true;
  const reported = useRef(false);
  const reducedMotion = useReducedMotion();
  const fullOpacity = useSharedValue(0);
  const previewOpacity = useSharedValue(0);
  const fullStyle = useAnimatedStyle(() => ({ opacity: fullOpacity.value }));
  const previewStyle = useAnimatedStyle(() => ({ opacity: previewOpacity.value }));
  const source = useMemo(() => ({ uri, cache: "force-cache" as const }), [uri]);
  const previewSource = useMemo(() => ({ uri: previewUri ?? "", cache: "force-cache" as const }), [previewUri]);
  const hasPreview = Boolean(previewUri && previewUri !== uri);
  useEffect(() => () => { cancelAnimation(fullOpacity); cancelAnimation(previewOpacity); }, [fullOpacity, previewOpacity]);
  useEffect(() => {
    if (fullFailed && (!hasPreview || previewFailed) && !reported.current) { reported.current = true; onError(); }
  }, [fullFailed, previewFailed, hasPreview, onError]);
  const reveal = (full: boolean) => {
    const opacity = full ? fullOpacity : previewOpacity;
    const complete = full ? setFullVisible : setPreviewVisible;
    if (reducedMotion) { opacity.value = 1; complete(true); return; }
    opacity.value = withTiming(1, { duration: buttonTokens.revealDuration, easing: Easing.out(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(complete)(true);
    });
  };
  return <YStack width="100%" height="100%" pointerEvents="none">
    {shouldShowImageSkeleton({ loaded: fullVisible, previewLoaded: previewVisible }) ? <YStack position="absolute" top={0} right={0} bottom={0} left={0}><AppSkeleton width="100%" height="100%" borderRadius={0} active={loadFull} /></YStack> : null}
    {hasPreview && !fullVisible ? <Animated.View style={[StyleSheet.absoluteFill, previewStyle]}>
      <Image source={previewSource} resizeMode={resizeMode} accessible={false} fadeDuration={0} style={StyleSheet.absoluteFill} onLoad={() => reveal(false)} onError={() => setPreviewFailed(true)} />
    </Animated.View> : null}
    {requested.current ? <Animated.View style={[StyleSheet.absoluteFill, fullStyle]}>
      <Image source={source} resizeMode={resizeMode} accessibilityLabel={accessibilityLabel}
        onLoad={() => reveal(true)} onError={() => setFullFailed(true)} fadeDuration={0} style={StyleSheet.absoluteFill} />
    </Animated.View> : null}
  </YStack>;
}

export function AppRemoteImage(props: Props) {
  return <RemoteImage key={props.uri} {...props} />;
}
