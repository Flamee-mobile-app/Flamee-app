import { useMemo, useState } from 'react';
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
  Image,
} from 'react-native';

import { flameeTheme } from '@/constants/flameeTheme';
import { StateView } from '@/components/ui';
import { useMemoryGallery } from '@/features/memories/hooks/useMemories';
import type { MemoryCategory } from '@/features/memories/types';
const { width } = Dimensions.get('window');

const CELL_SIZE = (width - 48 - 16) / 2;

const CATEGORIES = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Chuyến đi', value: 'trip' },
  { label: 'Đặc biệt', value: 'special' },
  { label: 'Mùa hè', value: 'summer' },
];

// Mock gallery items matching Figma grid with images and details
const MOCK_MEMORIES = [
  {
    id: 'm1',
    title: 'Chuyến đi Đà Lạt',
    date: '20/06/2026',
    category: 'trip',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop',
  },
  {
    id: 'm2',
    title: 'Kỷ niệm 1 năm',
    date: '14/02/2026',
    category: 'special',
    image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=500&auto=format&fit=crop',
  },
  {
    id: 'm3',
    title: 'Mùa hè rực rỡ',
    date: '01/06/2026',
    category: 'summer',
    image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=500&auto=format&fit=crop',
  },
  {
    id: 'm4',
    title: 'Quán cà phê quen',
    date: '12/03/2026',
    category: 'special',
    image: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=500&auto=format&fit=crop',
  },
  {
    id: 'm5',
    title: 'Chiều hoàng hôn',
    date: '24/05/2026',
    category: 'summer',
    image: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=500&auto=format&fit=crop',
  },
  {
    id: 'm6',
    title: 'Hành trình Sa Pa',
    date: '08/04/2026',
    category: 'trip',
    image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=500&auto=format&fit=crop',
  },
];

export function MemoriesScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<string>('all');

  const filteredMemories = useMemo(() => {
    if (category === 'all') return MOCK_MEMORIES;
    return MOCK_MEMORIES.filter((m) => m.category === category);
  }, [category]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#FF7158" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sổ kỉ niệm</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="search-outline" size={22} color="#FF7158" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="ellipsis-horizontal" size={22} color="#FF7158" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Category tabs */}
        <View style={{ paddingBottom: 10 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsRow}
          >
            {CATEGORIES.map((cat) => {
              const active = cat.value === category;
              return (
                <TouchableOpacity
                  key={cat.value}
                  onPress={() => setCategory(cat.value)}
                  activeOpacity={0.8}
                >
                  {active ? (
                    <LinearGradient
                      colors={['#FCB76D', '#FF7158']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.tabActive}
                    >
                      <Text style={styles.tabTextActive}>{cat.label}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.tabInactive}>
                      <Text style={styles.tabText}>{cat.label}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* Memory grid */}
      <ScrollView
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {filteredMemories.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.gridItem} 
              activeOpacity={0.85}
            >
              <Image 
                source={{ uri: item.image }} 
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.65)']}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.cardContent}>
                <View style={styles.tagWrapper}>
                  <Text style={styles.tagText}>
                    {item.category === 'trip' ? 'Chuyến đi' : item.category === 'special' ? 'Đặc biệt' : 'Mùa hè'}
                  </Text>
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDate}>{item.date}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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

  tabsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 4,
  },
  tabInactive: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FCB76D',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabActive: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FF7158',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    color: '#FF7158',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  gridContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridItem: {
    width: CELL_SIZE,
    height: CELL_SIZE * 1.3, // Vertically rectangular boxes
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    backgroundColor: '#FFFFFF',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 12,
  },
  tagWrapper: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 6,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'SF-Pro-Rounded-Bold',
  },
  cardDate: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    marginTop: 2,
    fontFamily: 'SF-Pro-Regular',
  },
});
