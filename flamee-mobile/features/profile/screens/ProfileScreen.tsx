import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Image } from 'expo-image';

import { flameeFonts, flameeTheme } from '@/shared/constants/flameeTheme';
import { StateView } from '@/shared/components/ui';
import { brandAssets } from '@/shared/assets';
import { useProfileData } from '@/features/profile/hooks/useProfileData';

const { width, height } = Dimensions.get('window');

const MENU_ITEMS = [
  { id: 'info', label: 'Thông tin của chúng ta' },
  { id: 'notif', label: 'Cài đặt thông báo' },
  { id: 'premium', label: 'Mở khóa Premium' },
  { id: 'account', label: 'Quản lý tài khoản' },
  { id: 'help', label: 'Trung tâm trợ giúp' },
];

export function ProfileScreen() {
  const profile = useProfileData();

  if (profile.isLoading) return <StateView title="Đang tải Profile" loading />;
  if (profile.isError || !profile.data) {
    return <StateView title="Không tải được Profile" actionLabel="Thử lại" onAction={() => profile.refetch()} />;
  }

  const data = profile.data;

  return (
    <View style={styles.container}>
      <Image
        source={brandAssets.background}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        transition={200}
      />
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.overlay} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Transparent Spacer to show top artwork background */}
        <View style={styles.topSpacer} />

        {/* Profile Panel matching Figma soft colors */}
        <View style={styles.profilePanel}>
          {/* Avatar (overlapping the top panel border) */}
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarBg}>
                {/* Bob haircut */}
                <View style={styles.bobHairL} />
                <View style={styles.bobHairR} />
                <View style={styles.bobHairTop} />
                {/* Neck */}
                <View style={styles.neck} />
                {/* Shirt */}
                <View style={styles.shirt} />
                {/* Face */}
                <View style={styles.face} />
                {/* Bangs */}
                <View style={styles.bangs} />
                {/* Eyes */}
                <View style={[styles.eye, { left: '33%' }]} />
                <View style={[styles.eye, { right: '33%' }]} />
                {/* Cheeks */}
                <View style={[styles.blush, { left: '26%' }]} />
                <View style={[styles.blush, { right: '26%' }]} />
              </View>
            </View>
          </View>

          {/* Couple name + heart */}
          <View style={styles.coupleNameRow}>
            <Text style={styles.coupleName}>A & B</Text>
            <Ionicons name="heart" size={20} color="#FF7158" />
          </View>
          <Text style={styles.daysTogether}>Đang yêu 150 ngày</Text>

          {/* Unified Card for Stats & Streak */}
          <View style={styles.unifiedCard}>
            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statNumber}>245</Text>
                <Text style={styles.statLabel}>Kỷ niệm</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Text style={styles.statNumber}>72</Text>
                <Text style={styles.statLabel}>Nhiệm vụ</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Text style={styles.statNumber}>120</Text>
                <Text style={styles.statLabel}>Mood checkin</Text>
              </View>
            </View>

            {/* Horizontal divider inside card */}
            <View style={styles.cardHorizontalDivider} />

            {/* Streak row */}
            <View style={styles.streakRow}>
              <Ionicons name="flame" size={20} color="#FF7158" />
              <Text style={styles.streakText}>
                Chuỗi 14 ngày yêu thương
              </Text>
            </View>
          </View>

          {/* Menu items in unified list container */}
          <View style={styles.menuContainer}>
            {MENU_ITEMS.map((item, idx) => (
              <View key={item.id}>
                <TouchableOpacity style={styles.menuItemBtn} activeOpacity={0.7}>
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#FF7158" />
                </TouchableOpacity>
                {idx < MENU_ITEMS.length - 1 && <View style={styles.menuDivider} />}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const ARTWORK_HEIGHT = height * 0.28;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0a00' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: 100,
  },
  topSpacer: {
    height: ARTWORK_HEIGHT,
  },
  profilePanel: {
    backgroundColor: '#FAF9F7',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingBottom: 40,
    minHeight: height - ARTWORK_HEIGHT,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginTop: -46,
    marginBottom: 8,
  },
  avatarContainer: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#FFFFFF',
    padding: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarBg: {
    flex: 1,
    borderRadius: 43,
    backgroundColor: '#FFE6CE',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bobHairL: {
    position: 'absolute',
    left: 10,
    top: 18,
    width: 24,
    height: 52,
    backgroundColor: '#222222',
    borderRadius: 12,
  },
  bobHairR: {
    position: 'absolute',
    right: 10,
    top: 18,
    width: 24,
    height: 52,
    backgroundColor: '#222222',
    borderRadius: 12,
  },
  bobHairTop: {
    position: 'absolute',
    top: 14,
    width: 58,
    height: 36,
    backgroundColor: '#222222',
    borderRadius: 20,
  },
  neck: {
    position: 'absolute',
    bottom: 22,
    width: 14,
    height: 16,
    backgroundColor: '#F5C6A5',
    borderRadius: 6,
  },
  shirt: {
    position: 'absolute',
    bottom: 0,
    width: 56,
    height: 26,
    backgroundColor: '#FCB76D',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  face: {
    position: 'absolute',
    top: 28,
    width: 46,
    height: 50,
    backgroundColor: '#F5C6A5',
    borderRadius: 23,
  },
  bangs: {
    position: 'absolute',
    top: 20,
    width: 46,
    height: 16,
    backgroundColor: '#222222',
    borderTopLeftRadius: 23,
    borderTopRightRadius: 23,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  eye: {
    position: 'absolute',
    top: 48,
    width: 4,
    height: 4,
    backgroundColor: '#222222',
    borderRadius: 2,
  },
  blush: {
    position: 'absolute',
    top: 54,
    width: 5,
    height: 3,
    backgroundColor: '#FF9B8A',
    borderRadius: 2,
    opacity: 0.8,
  },
  coupleNameRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  coupleName: { fontFamily: flameeFonts.roundedBold, fontSize: 24, color: '#2B2B2B' },
  daysTogether: { fontFamily: flameeFonts.medium, fontSize: 14, color: '#888888', textAlign: 'center', marginBottom: 8 },
  unifiedCard: {
    backgroundColor: '#FFFBF7',
    borderWidth: 1.5,
    borderColor: '#FCB76D',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 2,
    marginTop: 8,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: { fontFamily: flameeFonts.roundedBold, fontSize: 20, color: '#2B2B2B' },
  statLabel: { fontFamily: flameeFonts.medium, fontSize: 12, color: '#888888' },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#FFE6CE',
  },
  cardHorizontalDivider: {
    height: 1,
    backgroundColor: '#FFE6CE',
    marginVertical: 14,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  streakText: {
    fontFamily: flameeFonts.bold,
    fontSize: 15,
    color: '#FF7158',
  },
  menuContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FCB76D',
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItemBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemLabel: { fontFamily: flameeFonts.bold, fontSize: 15, color: '#2B2B2B' },
  menuDivider: {
    height: 1,
    backgroundColor: '#FFE6CE',
    marginHorizontal: 20,
  },
});
