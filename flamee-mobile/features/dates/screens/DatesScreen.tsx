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

import { flameeTheme } from '@/constants/flameeTheme';
import { StateView } from '@/components/ui';
import { useDateSchedule } from '@/features/dates/hooks/useDateSchedule';
import { MAIN_NAV_ITEMS, ROUTES } from '@/lib/navigation/routes';

const { width } = Dimensions.get('window');

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

export function DatesScreen() {
  const router = useRouter();
  const schedule = useDateSchedule();

  if (schedule.isLoading) {
    return <StateView title="Đang tải lịch hẹn hò" loading />;
  }

  if (schedule.isError || !schedule.data) {
    return (
      <StateView
        title="Không tải được lịch hẹn"
        actionLabel="Thử lại"
        onAction={() => schedule.refetch()}
      />
    );
  }

  // Define dates custom matching Figma layout
  const weekDays = [
    { label: 'T2', date: '11', active: false },
    { label: 'T3', date: '12', active: false },
    { label: 'T4', date: '13', active: false },
    { label: 'T5', date: '14', active: true },
    { label: 'T6', date: '15', active: false },
    { label: 'T7', date: '16', active: false },
    { label: 'CN', date: '17', active: false },
  ];

  const dateIdeas = [
    { id: '1', emoji: '🍕', title: 'Picnic công viên', details: 'Công viên thành phố • 14:00' },
    { id: '2', emoji: '🍳', title: 'Nấu ăn cùng nhau', details: 'Tại nhà • 18:00' },
    { id: '3', emoji: '☕', title: 'Cà phê trò chuyện', details: 'Quán cafe acoustic • 20:00' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Custom Header with no mock status row */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#FF7158" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lịch hẹn hò</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIcon}>
              <Ionicons name="search-outline" size={22} color="#FF7158" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon}>
              <Ionicons name="ellipsis-horizontal" size={22} color="#FF7158" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar Month Selector & Week Scroller */}
        <View style={styles.calendarContainer}>
          <Text style={styles.calendarMonth}>Tháng 5, 2026</Text>
          
          <View style={styles.calendarCard}>
            {weekDays.map((day, idx) => (
              <View key={idx} style={styles.dayCol}>
                <Text style={styles.dayLabel}>{day.label}</Text>
                <View style={[styles.dateCircle, day.active && styles.dateCircleActive]}>
                  <Text style={[styles.dateText, day.active && styles.dateTextActive]}>
                    {day.date}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Lịch hẹn sắp tới */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Lịch hẹn sắp tới</Text>
        </View>

        {/* Split screen card (Info on left, photo on right) */}
        <View style={styles.splitCard}>
          {/* Left card content */}
          <View style={styles.cardLeft}>
            <Text style={styles.upcomingTime}>16:00, Hôm nay</Text>
            <Text style={styles.upcomingTitle}>Đi xem phim</Text>
            <Text style={styles.upcomingLocation}>📍 CGV Vincom</Text>
            <Text style={styles.upcomingDuration}>19:00</Text>
          </View>

          {/* Right card mockup photo */}
          <View style={styles.cardRight}>
            <View style={styles.cinemaSeatsMock}>
              <View style={styles.screenBar} />
              <View style={styles.seatsGrid}>
                <View style={styles.seatRow}>
                  <View style={styles.seat} /><View style={styles.seat} /><View style={styles.seat} /><View style={styles.seat} />
                </View>
                <View style={styles.seatRow}>
                  <View style={styles.seat} /><View style={[styles.seat, styles.seatSelected]} /><View style={[styles.seat, styles.seatSelected]} /><View style={styles.seat} />
                </View>
                <View style={styles.seatRow}>
                  <View style={styles.seat} /><View style={styles.seat} /><View style={styles.seat} /><View style={styles.seat} />
                </View>
              </View>
              <Text style={styles.cardRightText}>Cinema</Text>
            </View>
          </View>
        </View>

        {/* Ý tưởng hẹn hò */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ý tưởng hẹn hò</Text>
        </View>

        <View style={styles.ideasList}>
          {dateIdeas.map((idea) => (
            <TouchableOpacity key={idea.id} style={styles.ideaItem} activeOpacity={0.8}>
              <View style={styles.ideaLeft}>
                <View style={styles.emojiCircle}>
                  <Text style={styles.ideaEmoji}>{idea.emoji}</Text>
                </View>
                <View style={styles.ideaInfo}>
                  <Text style={styles.ideaTitle}>{idea.title}</Text>
                  <Text style={styles.ideaSubText}>{idea.details}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#FF7158" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Activated bottom tab */}
      <BottomTabBar activeRoute={ROUTES.home} onNavigate={(href) => router.replace(href as any)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F7',
  },
  headerSafeArea: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE6CE',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FF7158',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  headerIcon: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },

  // Calendar
  calendarContainer: {
    marginBottom: 24,
  },
  calendarMonth: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF7158',
    marginBottom: 12,
  },
  calendarCard: {
    width: '100%',
    height: 60,
    backgroundColor: '#FFF1E4',
    borderWidth: 1,
    borderColor: '#FFE6CE',
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  dayCol: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  dayLabel: {
    fontSize: 11,
    color: '#888888',
    fontWeight: '600',
  },
  dateCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCircleActive: {
    backgroundColor: '#FF7158',
  },
  dateText: {
    fontSize: 13,
    color: '#2B2B2B',
    fontWeight: '600',
  },
  dateTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Sections
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF7158',
  },

  // Split Upcoming Card
  splitCard: {
    flexDirection: 'row',
    gap: 14,
    height: 150,
    marginBottom: 28,
  },
  cardLeft: {
    flex: 1.1,
    borderRadius: 24,
    padding: 16,
    justifyContent: 'space-between',
    backgroundColor: '#FF7158',
    shadowColor: '#FF7158',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  upcomingTime: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  upcomingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  upcomingLocation: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.95,
  },
  upcomingDuration: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.7,
  },
  cardRight: {
    flex: 0.9,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FCB76D',
    borderRadius: 24,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cinemaSeatsMock: {
    width: '100%',
    height: '100%',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF1E4',
  },
  screenBar: {
    width: '70%',
    height: 3,
    backgroundColor: '#FCB76D',
    borderRadius: 2,
  },
  seatsGrid: {
    gap: 4,
    width: '80%',
    alignItems: 'center',
  },
  seatRow: {
    flexDirection: 'row',
    gap: 4,
  },
  seat: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCB76D',
  },
  seatSelected: {
    backgroundColor: '#FF7158',
    borderColor: '#FF7158',
  },
  cardRightText: {
    fontSize: 12,
    color: '#FF7158',
    fontWeight: '700',
  },

  // Ideas List
  ideasList: {
    gap: 12,
  },
  ideaItem: {
    width: '100%',
    height: 60,
    borderWidth: 1.5,
    borderColor: '#FCB76D',
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  ideaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emojiCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF1E4',
    borderWidth: 1,
    borderColor: '#FFE6CE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ideaEmoji: {
    fontSize: 18,
  },
  ideaInfo: {
    gap: 2,
  },
  ideaTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2B2B2B',
  },
  ideaSubText: {
    fontSize: 12,
    color: '#888888',
    fontWeight: '500',
  },
});
