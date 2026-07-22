import { AccessibilityInfo, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import * as Haptics from 'expo-haptics';

import { useAppSafeArea } from '@/shared/hooks';
import { useBottomNavLayout } from '@/shared/layouts';

import { useMascotCompanion } from '../hooks/useMascotCompanion';
import { MASCOT_VISUAL_SIZE, resolveMascotHaloLayout } from '../mascotLayout';

import { MascotActionHalo } from './MascotActionHalo';
import { MascotVisual } from './MascotVisual';

export function HomeMascotCompanion() {
  const window = useWindowDimensions();
  const safeArea = useAppSafeArea();
  const { frame: bottomNavFrame } = useBottomNavLayout();
  const { complete, dismiss, isExpanded, nudge, open } = useMascotCompanion();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => setReduceMotion(false));
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);

    return () => subscription.remove();
  }, []);

  const handlePressIn = () => {
    setIsPressed(true);
  };

  const handlePressOut = () => {
    setIsPressed(false);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {}
  };

  const haloLayout = useMemo(
    () =>
      resolveMascotHaloLayout({
        bottomNavFrame,
        safeArea,
        window,
      }),
    [bottomNavFrame, safeArea, window],
  );
  const hasUnreadNudge = nudge?.hasUnreadNudge ?? false;
  const accessibilityLabel = hasUnreadNudge ? 'Flamee có một gợi ý mới' : 'Trò chuyện với Flamee';

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {isExpanded && nudge && (
        <Pressable
          accessibilityLabel="Đóng gợi ý Flamee"
          accessibilityRole="button"
          onPress={dismiss}
          style={StyleSheet.absoluteFill}
          testID="mascot-halo-dismiss-surface"
        />
      )}
      <View
        pointerEvents="box-none"
        style={[
          styles.anchor,
          { bottom: haloLayout.anchor.bottom, right: haloLayout.anchor.right },
        ]}
        testID="home-mascot-anchor">
        {isExpanded && nudge && (
          <MascotActionHalo layout={haloLayout} nudge={nudge} onAction={complete} />
        )}
        <Pressable
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
          accessibilityState={{ expanded: isExpanded }}
          hitSlop={8}
          onPress={isExpanded ? dismiss : open}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <MascotVisual
            hasUnreadNudge={hasUnreadNudge}
            isExpanded={isExpanded}
            isPressed={isPressed}
            mood={nudge?.mood ?? 'neutral'}
            reduceMotion={reduceMotion}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    alignItems: 'flex-end',
    height: MASCOT_VISUAL_SIZE,
    position: 'absolute',
    width: MASCOT_VISUAL_SIZE,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  pressed: {
    opacity: 0.9,
  },
});
