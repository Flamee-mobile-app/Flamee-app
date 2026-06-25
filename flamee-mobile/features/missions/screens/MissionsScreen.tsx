import { useEffect, useMemo, useState } from 'react';
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
import { useMissions } from '@/features/missions/hooks/useMissions';
import { completeMissionById } from '@/features/missions/services/missionService';
import type { Mission, MissionCategory } from '@/features/missions/types';
import { MAIN_NAV_ITEMS, ROUTES } from '@/lib/navigation/routes';

const { width } = Dimensions.get('window');

const categoryTabs = [
  { label: 'Hàng ngày', value: 'daily' },
  { label: 'Hàng tuần', value: 'weekly' },
  { label: 'Hàng tháng', value: 'surprise' },
];

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

export function MissionsScreen() {
  const router = useRouter();
  const missionsQuery = useMissions();
  const [category, setCategory] = useState<MissionCategory>('daily');
  const [missions, setMissions] = useState<Mission[]>([]);

  useEffect(() => {
    if (missionsQuery.data) {
      setMissions(missionsQuery.data);
    }
  }, [missionsQuery.data]);

  const filteredMissions = useMemo(
    () => missions.filter((mission) => mission.category === category),
    [category, missions]
  );

  // The first mission is featured today
  const featured = filteredMissions[0];
  
  // The rest are additional/suggested missions
  const additional = [
    { id: 'add-1', title: 'Chia sẻ 1 điều biết ơn', xp: 20, completed: false },
    { id: 'add-2', title: 'Gửi ảnh đáng yêu cho nhau', xp: 20, completed: false },
    { id: 'add-3', title: 'Lên kế hoạch cho cuối tuần', xp: 20, completed: false },
    { id: 'add-4', title: 'Gọi video call cho nhau', xp: 20, completed: false },
  ];

  const handleComplete = (id: string) => {
    setMissions((current) => completeMissionById(current, id));
  };

  if (missionsQuery.isLoading) {
    return <StateView title="Đang tải nhiệm vụ" loading />;
  }

  if (missionsQuery.isError) {
    return (
      <StateView
        title="Không tải được nhiệm vụ"
        actionLabel="Thử lại"
        onAction={() => missionsQuery.refetch()}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Custom Header with no mock status row */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Nhiệm vụ nho nhỏ</Text>
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
        {/* Category Tabs */}
        <View style={styles.tabContainer}>
          {categoryTabs.map((tab) => {
            const active = category === tab.value;
            return (
              <TouchableOpacity
                key={tab.value}
                onPress={() => setCategory(tab.value as MissionCategory)}
                style={[styles.tabButton, active && styles.tabButtonActive]}
                activeOpacity={0.8}
              >
                {active ? (
                  <LinearGradient
                    colors={['#FCB76D', '#FF7158']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                ) : null}
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Featured Daily Mission */}
        <View style={styles.featuredCard}>
          <Text style={styles.featuredTag}>Nhiệm vụ hôm nay</Text>
          
          <View style={styles.featuredRow}>
            <View style={styles.featuredImgWrapper}>
              <Text style={styles.featuredEmoji}>🎁</Text>
            </View>
            <View style={styles.featuredTextCol}>
              <Text style={styles.featuredTitle} numberOfLines={2}>
                {featured?.title || 'Gửi một lời khen dành cho đối phương'}
              </Text>
              <Text style={styles.featuredXp}>+20 SP</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.completeBtn, featured?.completed && styles.completeBtnDone]}
            disabled={featured?.completed}
            onPress={() => featured && handleComplete(featured.id)}
            activeOpacity={0.85}
          >
            <Text style={styles.completeBtnText}>
              {featured?.completed ? 'Đã hoàn thành' : 'Hoàn thành'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Additional Missions Section */}
        <View style={styles.additionalHeader}>
          <Text style={styles.additionalTitle}>Nhiệm vụ thêm</Text>
        </View>

        {/* Missions list */}
        <View style={styles.additionalList}>
          {additional.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.listItem}
              activeOpacity={0.8}
            >
              <Text style={styles.itemText}>{item.title}</Text>
              
              <View style={styles.itemRight}>
                <Text style={styles.itemXpText}>+{item.xp} SP</Text>
                <View style={styles.starCircle}>
                  <Text style={styles.starEmoji}>⭐</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomTabBar activeRoute={ROUTES.missions} onNavigate={(href) => router.replace(href as any)} />
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
    paddingHorizontal: 24,
    paddingVertical: 12,
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
  iconBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },

  // Category Selector Tabs
  tabContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    height: 38,
    backgroundColor: '#FFF1E4',
    borderWidth: 1,
    borderColor: '#FCB76D',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  tabButtonActive: {
    borderColor: 'transparent',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF7158',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },

  // Featured card
  featuredCard: {
    backgroundColor: '#FFF1E4',
    borderWidth: 1,
    borderColor: '#FFE6CE',
    borderRadius: 24,
    padding: 20,
    gap: 16,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  featuredTag: {
    color: '#888888',
    fontSize: 12,
    fontWeight: '700',
    alignSelf: 'flex-start',
  },
  featuredRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  featuredImgWrapper: {
    width: 60,
    height: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFE6CE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredEmoji: {
    fontSize: 34,
  },
  featuredTextCol: {
    flex: 1,
    gap: 4,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2B2B2B',
    lineHeight: 20,
  },
  featuredXp: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FF7158',
  },
  completeBtn: {
    width: '100%',
    height: 44,
    backgroundColor: '#FF7158',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  completeBtnDone: {
    backgroundColor: '#CCCCCC',
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  // Additional section
  additionalHeader: {
    marginBottom: 16,
  },
  additionalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF7158',
  },
  additionalList: {
    gap: 12,
  },
  listItem: {
    width: '100%',
    height: 52,
    borderWidth: 1.5,
    borderColor: '#FCB76D',
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  itemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2B2B2B',
    flex: 1,
    paddingRight: 8,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemXpText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2B2B2B',
  },
  starCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFF1E4',
    borderWidth: 1,
    borderColor: '#FCB76D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starEmoji: {
    fontSize: 12,
  },
});
