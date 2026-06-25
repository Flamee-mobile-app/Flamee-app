import { useRouter } from 'expo-router';
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
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';

import { flameeTheme } from '@/constants/flameeTheme';
import { StateView } from '@/components/ui';
import { useProfileData } from '@/features/profile/hooks/useProfileData';
import { MAIN_NAV_ITEMS, ROUTES } from '@/lib/navigation/routes';

const { width, height } = Dimensions.get('window');

function BottomTabBar({ activeRoute, onNavigate }: { activeRoute: string; onNavigate: (r: string) => void }) {
  return (
    <View style={tabStyles.bar}>
      {MAIN_NAV_ITEMS.map((item) => {
        const active = String(item.href) === activeRoute;
        return (
          <Pressable key={item.key} style={tabStyles.item} onPress={() => onNavigate(String(item.href))}>
            <Ionicons name={item.icon as any} size={24} color={active ? '#FF7158' : '#999999'} />
            <Text style={[tabStyles.label, active && tabStyles.labelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#FFE6CE',
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  item: { flex: 1, alignItems: 'center', gap: 3 },
  label: { fontSize: 10, color: '#999999' },
  labelActive: { color: '#FF7158', fontWeight: '600' },
});

const MENU_ITEMS = [
  { id: 'info', label: 'Thông tin của chúng ta' },
  { id: 'notif', label: 'Cài đặt thông báo' },
  { id: 'premium', label: 'Mở khóa Premium' },
  { id: 'account', label: 'Quản lý tài khoản' },
  { id: 'help', label: 'Trung tâm trợ giúp' },
];

export function ProfileScreen() {
  const router = useRouter();
  const profile = useProfileData();

  if (profile.isLoading) return <StateView title="Đang tải Profile" loading />;
  if (profile.isError || !profile.data) {
    return <StateView title="Không tải được Profile" actionLabel="Thử lại" onAction={() => profile.refetch()} />;
  }

  const data = profile.data;

  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/chinh_mau_1.png')}
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
                {data.streakDays ?? 32} ngày streak 🔥
              </Text>
            </View>
          </View>

          {/* Settings Menu grouped in a single container */}
          <View style={styles.menuContainer}>
            {MENU_ITEMS.map((item, index) => (
              <View key={item.id}>
                <TouchableOpacity style={styles.menuItemBtn} activeOpacity={0.7}>
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#FF7158" />
                </TouchableOpacity>
                {index < MENU_ITEMS.length - 1 && <View style={styles.menuDivider} />}
              </View>
            ))}
          </View>

          {/* Spacer for bottom tab */}
          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      <BottomTabBar activeRoute={ROUTES.profile} onNavigate={(r) => router.replace(r as any)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  topSpacer: {
    height: 120,
  },
  profilePanel: {
    backgroundColor: '#FAF9F7',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 16,
    minHeight: height - 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 5,
  },
  avatarWrapper: {
    alignSelf: 'center',
    marginTop: -80,
    marginBottom: 8,
    zIndex: 10,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#FFE6CE',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    overflow: 'hidden',
  },
  avatarBg: {
    width: '100%',
    height: '100%',
    position: 'relative',
    alignItems: 'center',
    backgroundColor: '#FFF1E4',
  },
  bobHairTop: {
    position: 'absolute',
    top: 12,
    width: 70,
    height: 55,
    backgroundColor: '#222222',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
  },
  bobHairL: {
    position: 'absolute',
    top: 30,
    left: 18,
    width: 22,
    height: 55,
    backgroundColor: '#222222',
    borderBottomLeftRadius: 12,
  },
  bobHairR: {
    position: 'absolute',
    top: 30,
    right: 18,
    width: 22,
    height: 55,
    backgroundColor: '#222222',
    borderBottomRightRadius: 12,
  },
  neck: {
    position: 'absolute',
    top: 75,
    width: 14,
    height: 22,
    backgroundColor: '#F5C6A5',
  },
  shirt: {
    position: 'absolute',
    bottom: 0,
    width: 64,
    height: 30,
    backgroundColor: '#FF7158',
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
  coupleName: { fontSize: 24, fontWeight: '700', color: '#2B2B2B' },
  daysTogether: { fontSize: 14, color: '#888888', textAlign: 'center', fontWeight: '500', marginBottom: 8 },
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
  statNumber: { fontSize: 20, fontWeight: '700', color: '#2B2B2B' },
  statLabel: { fontSize: 12, color: '#888888', fontWeight: '500' },
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
    fontSize: 15,
    fontWeight: '700',
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
  menuItemLabel: { fontSize: 15, fontWeight: '600', color: '#2B2B2B' },
  menuDivider: {
    height: 1,
    backgroundColor: '#FFE6CE',
    marginHorizontal: 20,
  },
});
