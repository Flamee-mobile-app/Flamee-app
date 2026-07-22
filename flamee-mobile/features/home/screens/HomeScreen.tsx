import { Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import { StatusBar } from 'react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HomeMascotCompanion } from '@/features/mascot';
import { brandAssets } from '@/shared/assets';
import { AppImage } from '@/shared/components/media';
import { flameeFonts } from '@/shared/constants/flameeTheme';
import { ROUTES } from '@/shared/lib/navigation/routes';

import { HomeBentoGrid } from '../components/HomeBentoGrid';
import { HomeWelcomeHeader } from '../components/HomeWelcomeHeader';
import { useHomeWelcome } from '../hooks/useHomeWelcome';

type HomeNavigationMode = 'push' | 'replace';

export function HomeScreen() {
  const router = useRouter();
  const { content, greetingStyle, quoteStyle, shouldAnimate } = useHomeWelcome();

  const handleNavigate = (route: Href, mode: HomeNavigationMode) => {
    if (mode === 'push') {
      router.push(route);
      return;
    }

    router.replace(route);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <AppImage
        contentFit="cover"
        source={brandAssets.background}
        style={StyleSheet.absoluteFillObject}
        testID="home-background"
        transition={200}
      />
      <View pointerEvents="none" style={styles.overlay} />

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <AppImage
              contentFit="contain"
              source={brandAssets.logo}
              style={styles.logoIcon}
              transition={200}
            />
            <Text style={styles.logoText}>Flamee</Text>
          </View>
          <Pressable
            accessibilityLabel="Mở Chat AI"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => handleNavigate(ROUTES.ai, 'push')}
            style={({ pressed }) => [styles.chatHeaderButton, pressed && styles.chatHeaderButtonPressed]}>
            <Ionicons color="#FFFFFF" name="chatbubble-ellipses-outline" size={22} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}>
          <HomeWelcomeHeader
            content={content}
            greetingStyle={greetingStyle}
            quoteStyle={quoteStyle}
          />
          <HomeBentoGrid onNavigate={handleNavigate} shouldAnimate={shouldAnimate} />
        </ScrollView>
      </SafeAreaView>

      <HomeMascotCompanion />
    </View>
  );
}

const styles = StyleSheet.create({
  chatHeaderButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderColor: 'rgba(255, 255, 255, 0.24)',
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  chatHeaderButtonPressed: {
    opacity: 0.78,
  },
  container: {
    backgroundColor: '#3B1717',
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  logoIcon: {
    height: 24,
    width: 24,
  },
  logoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  logoText: {
    color: '#FFFFFF',
    fontFamily: flameeFonts.roundedBold,
    fontSize: 22,
    letterSpacing: 0.5,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(65, 17, 4, 0.47)',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    gap: 28,
    paddingBottom: 128,
    paddingHorizontal: 24,
  },
  scrollView: {
    flex: 1,
  },
});
