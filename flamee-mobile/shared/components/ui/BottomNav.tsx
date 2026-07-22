import { useState } from 'react';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

import { flameeTheme } from '@/shared/constants/flameeTheme';
import { useBottomNavLayout } from '@/shared/layouts';
import { BOTTOM_NAV_ITEMS, type BottomNavItem } from '@/shared/lib/navigation/routes';
import { brandAssets } from '@/shared/assets';
import { FlameeIcon } from '@/shared/components/icons';
import { AppImage } from '@/shared/components/media';

import { AppText } from './AppText';
import {
  BOTTOM_NAV_BAR_HEIGHT,
  FIGMA_BOTTOM_NAV_WIDTH,
  getBottomNavTabLayout,
  type BottomNavTabLayout,
} from './bottomNavLayout';

const UNION_PATH =
  'M148 18C165.673 18 179.43 34.2897 191.865 46.8477C199.296 54.3516 209.605 59 221 59C232.395 59 242.704 54.3515 250.135 46.8477C262.57 34.2897 276.327 18 294 18H386C405.882 18 422 34.1177 422 54C422 73.8823 405.882 90 386 90H56C36.1177 90 20 73.8823 20 54C20 34.1177 36.1177 18 56 18H148Z';

function BottomNavBackground() {
  return (
    <Svg
      accessible={false}
      height={BOTTOM_NAV_BAR_HEIGHT}
      pointerEvents="none"
      preserveAspectRatio="none"
      style={styles.background}
      testID="bottom-nav-background-svg"
      viewBox="20 18 402 72"
      width="100%">
      <Defs>
        <SvgLinearGradient
          gradientUnits="userSpaceOnUse"
          id="bottom-nav-gradient"
          x1="221"
          x2="221"
          y1="90"
          y2="-9.5">
          <Stop offset="0" stopColor="#FCB76D" />
          <Stop offset="1" stopColor="#FF7158" />
        </SvgLinearGradient>
      </Defs>
      <Path d={UNION_PATH} fill="url(#bottom-nav-gradient)" />
    </Svg>
  );
}

function BottomNavIcon({ itemKey }: { itemKey: BottomNavItem['key'] }) {
  return <FlameeIcon color="#FFFFFF" name={itemKey} size={32} />;
}

function BottomNavVisualTab({
  item,
  layout,
  selected,
}: {
  item: BottomNavItem;
  layout: BottomNavTabLayout;
  selected: boolean;
}) {
  return (
    <View
      pointerEvents="none"
      style={[styles.tabVisual, layout, selected ? styles.tabVisualActive : styles.tabVisualInactive]}
      testID={`bottom-nav-visual-${item.key}`}>
      <BottomNavIcon itemKey={item.key} />
      <AppText
        variant="micro"
        color={flameeTheme.colors.text.inverse}
        align="center"
        numberOfLines={1}
        style={[styles.label, selected ? styles.labelActive : styles.labelInactive]}>
        {item.label}
      </AppText>
    </View>
  );
}

function FlameeLogoBadge() {
  return (
    <View
      pointerEvents="none"
      style={styles.logoBadge}
      testID="bottom-nav-logo-svg">
      <Svg
        accessible={false}
  height={56}
        style={StyleSheet.absoluteFill}
        viewBox="0 0 56 56"
        width={56}>
        <Defs>
          <SvgLinearGradient
            gradientUnits="userSpaceOnUse"
            id="flamee-logo-gradient"
            x1="0"
            x2="56"
            y1="0"
            y2="56">
            <Stop stopColor="#FCB76D" />
            <Stop offset="1" stopColor="#FF7158" />
          </SvgLinearGradient>
        </Defs>
        <Rect fill="url(#flamee-logo-gradient)" height="56" rx="28" width="56" />
      </Svg>
      <AppImage
        accessibilityLabel="Flamee"
        contentFit="contain"
        source={brandAssets.logo}
        style={styles.logoImage}
      />
    </View>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { setFrame } = useBottomNavLayout();
  const [barWidth, setBarWidth] = useState(FIGMA_BOTTOM_NAV_WIDTH);

  const onBarLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    setBarWidth(nativeEvent.layout.width);
  };

  const onContainerLayout = ({ nativeEvent }: LayoutChangeEvent) => {
    setFrame(nativeEvent.layout);
  };

  return (
    <View
      pointerEvents="box-none"
      style={styles.container}
      onLayout={onContainerLayout}
      testID="bottom-nav-container">
      <View testID="bottom-nav-bar" onLayout={onBarLayout} style={styles.bar}>
        <BottomNavBackground />

        <View pointerEvents="none" style={styles.visualTabs}>
          {BOTTOM_NAV_ITEMS.map((item) => (
            <BottomNavVisualTab
              key={item.key}
              item={item}
              layout={getBottomNavTabLayout(item.key, barWidth)}
              selected={String(item.href).replace('/(main)', '') === pathname}
            />
          ))}
        </View>

        <View style={styles.interactionTabs}>
          {BOTTOM_NAV_ITEMS.map((item) => {
            const selected = String(item.href).replace('/(main)', '') === pathname;

            return (
              <Pressable
                key={item.key}
                accessibilityLabel={item.label}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                hitSlop={8}
                onPress={() => router.replace(item.href)}
                style={[styles.tabButton, getBottomNavTabLayout(item.key, barWidth)]}
                testID={`bottom-nav-button-${item.key}`}
              />
            );
          })}
        </View>

        <FlameeLogoBadge />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  bar: {
    elevation: 8,
    height: BOTTOM_NAV_BAR_HEIGHT,
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  container: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  label: {
    fontWeight: '400',
    lineHeight: 10,
  },
  logoBadge: {
    height: 56,
    left: '50%',
    marginLeft: -28,
    position: 'absolute',
    top: -28,
    width: 56,
    zIndex: 3,
  },
  logoImage: {
    height: 42,
    left: 10,
    position: 'absolute',
    top: 7,
    width: 36,
  },
  interactionTabs: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 2,
  },
  tabButton: {
    height: 42,
    position: 'absolute',
  },
  tabVisual: {
    alignItems: 'center',
    position: 'absolute',
  },
  tabVisualActive: {
    opacity: 1,
  },
  tabVisualInactive: {
    opacity: 0.62,
  },
  labelActive: {
    fontWeight: '700',
  },
  labelInactive: {
    fontWeight: '400',
  },
  visualTabs: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1,
  },
});
