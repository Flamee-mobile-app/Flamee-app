import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Dimensions,
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';

import { ROUTES } from '@/lib/navigation/routes';

const { width } = Dimensions.get('window');

export function StartScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Background artwork imported directly from Figma frame */}
      <Image
        source={require('../../../assets/chinh_mau_1.png')}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        transition={200}
      />

      {/* Dark overlay matching linear-gradient(0deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)) in Figma */}
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea}>
        {/* Main Content Area */}
        <View style={styles.mainContent}>
          {/* Signature Logo from Figma (Vector 5785:829) */}
          <Image
            source={require('../../../assets/flamee_logo.png')}
            style={styles.logo}
            contentFit="contain"
            transition={200}
          />

          <View style={styles.textContainer}>
            <Text style={styles.tagline}>
              Mỗi kết nối đều mang một câu chuyện
            </Text>
            <Text style={styles.subTagline}>
              Hãy bắt đầu hành trình của riêng các bạn cùng Flamee
            </Text>
          </View>
        </View>

        {/* Bottom Actions stack (Figma width: 294px, height: 112px, gap: 16px) */}
        <View style={styles.actions}>
          {/* Đăng nhập (Filled Gradient Button) */}
          <TouchableOpacity
            onPress={() => router.push(ROUTES.login)}
            activeOpacity={0.85}
            style={styles.solidBtn}
          >
            <LinearGradient
              colors={['#FCB76D', '#FF7158']}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.solidBtnGradient}
            >
              <Text style={styles.solidBtnText}>Đăng nhập</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Đăng ký (White/Cream Outline Button) */}
          <TouchableOpacity
            onPress={() => router.push(ROUTES.register)}
            activeOpacity={0.8}
            style={styles.outlineBtn}
          >
            <Text style={styles.outlineBtnText}>Đăng ký</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0a00',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)', // 0.4 - 0.5 opacity dark overlay to make text highly readable
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 40,
  },

  // Main Content
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    gap: 28,
  },

  // Signature Logo (Figma specs: 131x156px)
  logo: {
    width: 131,
    height: 156,
    marginBottom: 8,
  },

  // Taglines
  textContainer: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  tagline: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 30,
    color: '#FFFFFF',
    fontFamily: 'System',
  },
  subTagline: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 18,
    color: '#FFFFFF',
    opacity: 0.85,
  },

  // Actions (Figma buttons layout specs: width: 294px, height: 112px, gap: 16px)
  actions: {
    width: 294,
    height: 112,
    gap: 16,
    marginBottom: 20,
  },
  solidBtn: {
    width: 294,
    height: 48,
    borderRadius: 32,
    overflow: 'hidden',
  },
  solidBtnGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solidBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5B4C1B',
  },

  // Outline register button
  outlineBtn: {
    width: 294,
    height: 48,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: '#FAF9F7', // Neutral light color from Figma
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)', // glassmorphism backdrop
  },
  outlineBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FAF9F7',
  },
});
