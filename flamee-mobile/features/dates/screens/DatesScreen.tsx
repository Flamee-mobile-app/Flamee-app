import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { flameeFonts } from '@/shared/constants/flameeTheme';
import { StateView } from '@/shared/components/ui';
import {
  useCreateDate,
  useDateSchedule,
  useDeleteDate,
  useUpdateDateStatus,
} from '@/features/dates/hooks/useDateSchedule';
import type { DateFilterType, DateItem } from '@/features/dates/types';
import { ROUTES } from '@/shared/lib/navigation/routes';
import { AddDateModal } from '@/features/dates/components/AddDateModal';
import { DateDetailModal } from '@/features/dates/components/DateDetailModal';
import { MascotSuggestBubble } from '@/features/dates/components/MascotSuggestBubble';



const { width } = Dimensions.get('window');

const FILTER_TABS: { key: DateFilterType; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'upcoming', label: 'Sắp tới' },
  { key: 'completed', label: 'Đã xong' },
];

export function DatesScreen() {
  const router = useRouter();
  const schedule = useDateSchedule();

  const createMutation = useCreateDate();
  const updateStatusMutation = useUpdateDateStatus();
  const deleteMutation = useDeleteDate();

  const [activeFilter, setActiveFilter] = useState<DateFilterType>('all');
  const [selectedDayId, setSelectedDayId] = useState<string>('thu');

  // Modals state
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<DateItem | null>(null);

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

  const { week, upcoming, items } = schedule.data;

  // Filter items based on active filter
  const filteredItems = items.filter((item) => {
    if (activeFilter === 'upcoming') return item.status === 'upcoming';
    if (activeFilter === 'completed') return item.status === 'completed';
    return true; // 'all'
  });

  const handleOpenAddModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsAddModalVisible(true);
  };

  const handleSelectDay = (dayId: string) => {
    Haptics.selectionAsync();
    setSelectedDayId(dayId);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Custom Header */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#FF7158" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lịch hẹn hò</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.addHeaderBtn}
              onPress={() => handleOpenAddModal()}
            >
              <Ionicons name="add" size={24} color="#FF7158" />
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
          <View style={styles.calendarMonthRow}>
            <Text style={styles.calendarMonth}>Tháng 5, 2026</Text>
            <TouchableOpacity
              style={styles.addQuickPill}
              onPress={() => handleOpenAddModal()}
            >
              <Ionicons name="add-circle" size={16} color="#FF7158" />
              <Text style={styles.addQuickPillText}>Thêm lịch hẹn</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.calendarCard}>
            {week.map((day) => {
              const active = day.id === selectedDayId;
              return (
                <TouchableOpacity
                  key={day.id}
                  style={styles.dayCol}
                  onPress={() => handleSelectDay(day.id)}
                >
                  <Text style={[styles.dayLabel, active && styles.dayLabelActive]}>
                    {day.label}
                  </Text>
                  <View style={[styles.dateCircle, active && styles.dateCircleActive]}>
                    <Text style={[styles.dateText, active && styles.dateTextActive]}>
                      {day.date}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Upcoming Featured Date Card */}
        {upcoming && activeFilter !== 'completed' && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Lịch hẹn sắp tới 💕</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.splitCard}
              onPress={() => setSelectedItemForDetail(upcoming)}
            >
              {/* Left card content */}
              <View style={styles.cardLeft}>
                <Text style={styles.upcomingTime}>{upcoming.displayTime}</Text>
                <Text style={styles.upcomingTitle}>{upcoming.title}</Text>
                <Text style={styles.upcomingLocation}>📍 {upcoming.location}</Text>
                <View style={styles.badgeRow}>
                  <Text style={styles.upcomingStatusBadge}>Sắp diễn ra • Chạm để xem</Text>
                </View>
              </View>

              {/* Right card visual */}
              <View style={styles.cardRight}>
                <View style={styles.cinemaSeatsMock}>
                  <Text style={styles.emojiVisual}>{upcoming.emoji || '🎬'}</Text>
                  <View style={styles.screenBar} />
                  <Text style={styles.cardRightText}>{upcoming.category.toUpperCase()}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Filter Tabs Bar */}
        <View style={styles.filterTabsRow}>
          {FILTER_TABS.map((tab) => {
            const active = activeFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterTab, active && styles.filterTabActive]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveFilter(tab.key);
                }}
              >
                <Text style={[styles.filterTabText, active && styles.filterTabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Filtered Items Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {activeFilter === 'completed'
                ? 'Lịch hẹn đã hoàn thành'
                : activeFilter === 'upcoming'
                ? 'Danh sách sắp tới'
                : 'Tất cả cuộc hẹn'}
            </Text>
          </View>

          {filteredItems.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Chưa có lịch hẹn nào ở mục này</Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => handleOpenAddModal()}
              >
                <Text style={styles.emptyAddBtnText}>+ Tạo lịch mới ngay</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.itemsList}>
              {filteredItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.itemCard}
                  activeOpacity={0.85}
                  onPress={() => setSelectedItemForDetail(item)}
                >
                  <View style={styles.itemEmojiBox}>
                    <Text style={styles.itemEmoji}>{item.emoji || '💖'}</Text>
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemSub}>{item.displayTime} • {item.location}</Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color="rgba(43,43,43,0.3)"
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Bottom Spacing for BottomNav */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Mascot AI Suggestion Widget (Collapsible with smooth Reanimated transition) */}
      <MascotSuggestBubble
        onPressChat={() => router.push(ROUTES.ai)}
      />



      {/* Add Date Modal (Floating Popup with Custom Date & Time Pickers) */}
      <AddDateModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onSubmit={(payload) => createMutation.mutate(payload)}
      />

      {/* Date Detail Modal (Renders Mockup 3 Design) */}
      <DateDetailModal
        visible={!!selectedItemForDetail}
        item={selectedItemForDetail}
        onClose={() => setSelectedItemForDetail(null)}
        onUpdateStatus={(id, status) => updateStatusMutation.mutate({ id, status })}
        onDelete={(id) => deleteMutation.mutate(id)}
      />
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
    fontFamily: flameeFonts.roundedBold,
    fontSize: 22,
    color: '#FF7158',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addHeaderBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Calendar
  calendarContainer: {
    marginBottom: 20,
  },
  calendarMonthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  calendarMonth: {
    fontFamily: flameeFonts.roundedBold,
    fontSize: 18,
    color: '#FF7158',
  },
  addQuickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF1E4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  addQuickPillText: {
    fontFamily: flameeFonts.bold,
    fontSize: 12,
    color: '#FF7158',
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
    paddingHorizontal: 8,
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
    fontFamily: flameeFonts.medium,
    fontSize: 11,
    color: '#888888',
  },
  dayLabelActive: {
    color: '#FF7158',
    fontFamily: flameeFonts.bold,
  },
  dateCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCircleActive: {
    backgroundColor: '#FF7158',
  },
  dateText: {
    fontFamily: flameeFonts.bold,
    fontSize: 13,
    color: '#2B2B2B',
  },
  dateTextActive: {
    color: '#FFFFFF',
  },

  // Sections
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: flameeFonts.roundedBold,
    fontSize: 18,
    color: '#FF7158',
  },

  // Split Upcoming Card
  splitCard: {
    flexDirection: 'row',
    gap: 12,
    height: 145,
  },
  cardLeft: {
    flex: 1.1,
    borderRadius: 22,
    padding: 14,
    justifyContent: 'space-between',
    backgroundColor: '#FF7158',
    shadowColor: '#FF7158',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  upcomingTime: {
    fontFamily: flameeFonts.bold,
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  upcomingTitle: {
    fontFamily: flameeFonts.roundedBold,
    fontSize: 17,
    color: '#FFFFFF',
  },
  upcomingLocation: {
    fontFamily: flameeFonts.medium,
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.95,
  },
  badgeRow: {
    alignSelf: 'flex-start',
  },
  upcomingStatusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    fontSize: 10,
    fontFamily: flameeFonts.bold,
    color: '#FFFFFF',
  },
  cardRight: {
    flex: 0.9,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FCB76D',
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cinemaSeatsMock: {
    width: '100%',
    height: '100%',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1E4',
    gap: 8,
  },
  emojiVisual: {
    fontSize: 32,
  },
  screenBar: {
    width: '60%',
    height: 3,
    backgroundColor: '#FCB76D',
    borderRadius: 2,
  },
  cardRightText: {
    fontFamily: flameeFonts.bold,
    fontSize: 11,
    color: '#FF7158',
  },

  // Filter Tabs
  filterTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFE6CE',
  },
  filterTabActive: {
    backgroundColor: '#FF7158',
    borderColor: '#FF7158',
  },
  filterTabText: {
    fontFamily: flameeFonts.medium,
    fontSize: 13,
    color: '#2B2B2B',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontFamily: flameeFonts.bold,
  },

  // Items List
  itemsList: {
    gap: 10,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FFE6CE',
    padding: 12,
    gap: 12,
  },
  itemEmojiBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF1E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemEmoji: {
    fontSize: 20,
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontFamily: flameeFonts.bold,
    fontSize: 15,
    color: '#2B2B2B',
  },
  itemSub: {
    fontFamily: flameeFonts.regular,
    fontSize: 12,
    color: '#888888',
  },

  // Empty Card
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFE6CE',
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontFamily: flameeFonts.medium,
    fontSize: 14,
    color: '#888888',
  },
  emptyAddBtn: {
    backgroundColor: '#FFF1E4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  emptyAddBtnText: {
    fontFamily: flameeFonts.bold,
    fontSize: 13,
    color: '#FF7158',
  },

  // Mascot FAB & Speech Bubble
  mascotFabContainer: {
    position: 'absolute',
    bottom: 85,
    right: 16,
    alignItems: 'flex-end',
    zIndex: 99,
  },
  speechBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FFE6CE',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: 220,
    marginBottom: 8,
    shadowColor: '#FF7158',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  speechText: {
    fontFamily: flameeFonts.medium,
    fontSize: 13,
    color: '#2B2B2B',
    lineHeight: 18,
  },
  speechArrow: {
    position: 'absolute',
    bottom: -8,
    right: 24,
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 8,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
  },
  mascotAvatarBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF1E4',
    borderWidth: 2,
    borderColor: '#FF7158',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF7158',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
});




