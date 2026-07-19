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
} from 'react-native';

import { flameeTheme } from '@/constants/flameeTheme';
import { StateView } from '@/components/ui';
import { useTimelineMemories } from '@/features/memories/hooks/useMemories';

const { width } = Dimensions.get('window');

const TIMELINE_EVENTS = [
  { id: '1', date: '10/05/2023', title: '500 ngày bên nhau', note: null, icon: 'heart', highlight: true },
  { id: '2', date: '08/04/2023', title: 'Đi ăn cùng nhau', note: 'Nhà hàng cảnh đẹp hoàng hôn', icon: 'restaurant-outline', highlight: false },
  { id: '3', date: '25/02/2023', title: 'Ăn kem cùng nhau', note: 'Kem dâu ngọt ngào', icon: 'ice-cream-outline', highlight: false },
  { id: '4', date: '01/01/2023', title: 'Lần đầu gặp nhau', note: 'Quán cà phê nhỏ phố cổ', icon: 'cafe-outline', highlight: false },
  { id: '5', date: '01/01/2023', title: 'Tình yêu bắt đầu từ đây', note: 'Cùng nhau bước đi tiếp nhé', icon: 'star-outline', highlight: false },
];

export function TimelineScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#FF7158" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dòng thời gian</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="search-outline" size={22} color="#FF7158" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="ellipsis-horizontal" size={22} color="#FF7158" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Days Together Card (500 ngày bên nhau) */}
        <LinearGradient
          colors={['#FF7158', '#FCB76D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.daysCard}
        >
          {/* Semi-transparent overlay to match Figma */}
          <View style={styles.cardOverlay} />
          
          <View style={styles.daysLeft}>
            <Ionicons name="heart" size={32} color="#FFFFFF" style={{ marginBottom: 4 }} />
            <Text style={styles.daysNumber}>500</Text>
            <Text style={styles.daysLabel}>Ngày bên nhau</Text>
          </View>
          <View style={styles.daysRight}>
            <Text style={styles.coupleSilhouette}>👫</Text>
          </View>
        </LinearGradient>

        {/* Timeline Event List */}
        <View style={styles.timelineList}>
          {TIMELINE_EVENTS.map((event, index) => (
            <View key={event.id} style={styles.timelineRow}>
              {/* Timeline Indicator Column */}
              <View style={styles.timelineLeft}>
                <View style={styles.dotOuter}>
                  <LinearGradient
                    colors={['#FCB76D', '#FF7158']}
                    style={styles.dotGradient}
                  >
                    <Ionicons name={event.icon as any} size={16} color="#FFFFFF" />
                  </LinearGradient>
                </View>
                {index < TIMELINE_EVENTS.length - 1 && (
                  <View style={styles.connector} />
                )}
              </View>

              {/* Event Content Details */}
              <View style={styles.eventContent}>
                <Text style={styles.eventDate}>{event.date}</Text>
                <Text style={[styles.eventTitle, event.highlight && styles.eventTitleHighlight]}>
                  {event.title}
                </Text>
                {event.note && <Text style={styles.eventNote}>{event.note}</Text>}
              </View>
            </View>
          ))}
        </View>

        {/* Bottom padding for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
        <LinearGradient
          colors={['#FCB76D', '#FF7158']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF9F7' },
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
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FF7158' },
  headerRight: { flexDirection: 'row', gap: 12 },
  iconBtn: { padding: 4 },

  scrollContent: { paddingHorizontal: 24, paddingTop: 20 },

  // Days together card
  daysCard: {
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    overflow: 'hidden',
    height: 140,
    position: 'relative',
    shadowColor: '#FF7158',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  daysLeft: { gap: 2, zIndex: 10 },
  daysNumber: { fontSize: 34, fontWeight: '800', color: '#FFFFFF' },
  daysLabel: { fontSize: 16, fontWeight: '600', color: '#FFFFFF', opacity: 0.95 },
  daysRight: { zIndex: 10 },
  coupleSilhouette: { fontSize: 60 },

  // Timeline
  timelineList: { paddingLeft: 8 },
  timelineRow: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
  },
  timelineLeft: {
    alignItems: 'center',
    width: 36,
  },
  dotOuter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dotGradient: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connector: {
    width: 2,
    height: 48,
    backgroundColor: '#FF7158',
    marginVertical: 4,
  },
  eventContent: {
    flex: 1,
    paddingBottom: 28,
    gap: 4,
  },
  eventDate: { fontSize: 12, color: '#888888', fontWeight: '500' },
  eventTitle: { fontSize: 16, fontWeight: '700', color: '#2B2B2B', lineHeight: 20 },
  eventTitleHighlight: { color: '#FF7158' },
  eventNote: { fontSize: 13, color: '#555555', fontStyle: 'italic' },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  fabGradient: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
