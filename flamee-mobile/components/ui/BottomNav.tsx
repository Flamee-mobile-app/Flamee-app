import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { flameeTheme } from '@/constants/flameeTheme';
import { BOTTOM_NAV_ITEMS, type BottomNavItem } from '@/lib/navigation/routes';

import { AppText } from './AppText';

const navBackground = require('../../assets/navigation/bottom-nav-union.svg');
const homeIcon = require('../../assets/navigation/bottom-nav-home.svg');
const activitiesIcon = require('../../assets/navigation/bottom-nav-activities.svg');
const missionStarOne = require('../../assets/navigation/bottom-nav-missions-star-one.svg');
const missionStarTwo = require('../../assets/navigation/bottom-nav-missions-star-two.svg');
const profileHead = require('../../assets/navigation/bottom-nav-profile-head.svg');
const profileBody = require('../../assets/navigation/bottom-nav-profile-body.svg');
const flameeLogo = require('../../assets/flamee_logo.png');

const TAB_LAYOUT: Record<BottomNavItem['key'], Pick<ViewStyle, 'left' | 'top'>> = {
  home: { left: '4.85%', top: 15 },
  memories: { left: '24.38%', top: 15 },
  missions: { left: '59.08%', top: 12 },
  profile: { left: '76.12%', top: 12 },
};

function BottomNavIcon({ itemKey }: { itemKey: BottomNavItem['key'] }) {
  if (itemKey === 'home') {
    return <Image source={homeIcon} contentFit="contain" style={styles.homeIcon} />;
  }

  if (itemKey === 'memories') {
    return <Image source={activitiesIcon} contentFit="contain" style={styles.activitiesIcon} />;
  }

  if (itemKey === 'missions') {
    return (
      <>
        <Image source={missionStarOne} contentFit="contain" style={styles.missionStarOne} />
        <Image source={missionStarTwo} contentFit="contain" style={styles.missionStarTwo} />
      </>
    );
  }

  return (
    <>
      <Image source={profileHead} contentFit="contain" style={styles.profileHead} />
      <Image source={profileBody} contentFit="contain" style={styles.profileBody} />
    </>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.bar}>
        <Image
          accessible={false}
          pointerEvents="none"
          source={navBackground}
          contentFit="fill"
          style={styles.background}
        />

        <View style={styles.tabs}>
          {BOTTOM_NAV_ITEMS.map((item) => {
            const selected = String(item.href).replace('/(main)', '') === pathname;

            return (
              <Pressable
                key={item.key}
                accessibilityLabel={item.label}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => router.replace(item.href)}
                style={({ pressed }) => [
                  styles.tab,
                  TAB_LAYOUT[item.key],
                  pressed && styles.tabPressed,
                ]}>
                <View style={styles.iconBox}>
                  <BottomNavIcon itemKey={item.key} />
                </View>
                <AppText
                  variant="micro"
                  color={flameeTheme.colors.text.inverse}
                  align="center"
                  numberOfLines={1}
                  style={styles.label}>
                  {item.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <LinearGradient
          accessible={false}
          pointerEvents="none"
          colors={flameeTheme.gradients.brandDiag}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoBadge}>
          <Image accessible={false} source={flameeLogo} contentFit="contain" style={styles.logo} />
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  activitiesIcon: {
    bottom: '10.95%',
    left: '12%',
    position: 'absolute',
    right: '12%',
    top: '18%',
  },
  background: {
    bottom: 0,
    height: 72,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  bar: {
    elevation: 8,
    height: 72,
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
  homeIcon: {
    bottom: '15%',
    left: '7%',
    position: 'absolute',
    right: '7%',
    top: '9.34%',
  },
  iconBox: {
    height: 32,
    position: 'relative',
    width: 32,
  },
  label: {
    fontWeight: '400',
    lineHeight: 10,
    marginTop: 0,
  },
  logo: {
    height: 42,
    width: 36,
  },
  logoBadge: {
    alignItems: 'center',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    left: '50%',
    marginLeft: -28,
    position: 'absolute',
    top: -28,
    width: 56,
    zIndex: 2,
  },
  missionStarOne: {
    bottom: '10.17%',
    left: '10.34%',
    position: 'absolute',
    right: '25.34%',
    top: '15.17%',
  },
  missionStarTwo: {
    bottom: '58.81%',
    left: '58.71%',
    position: 'absolute',
    right: '14.71%',
    top: '11.81%',
  },
  profileBody: {
    bottom: '14.96%',
    left: '18%',
    position: 'absolute',
    right: '18%',
    top: '58.43%',
  },
  profileHead: {
    bottom: '50%',
    left: '30%',
    position: 'absolute',
    right: '30%',
    top: '10%',
  },
  tab: {
    alignItems: 'center',
    position: 'absolute',
    width: 64,
  },
  tabPressed: {
    opacity: 0.75,
  },
  tabs: {
    height: 72,
    position: 'relative',
  },
});
