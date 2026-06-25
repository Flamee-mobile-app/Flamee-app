import { useState, Fragment } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  SafeAreaView,
  Pressable,
} from 'react-native';

import { flameeTheme } from '@/constants/flameeTheme';
import { StateView } from '@/components/ui';
import { useMoodSummary } from '@/features/mood/hooks/useMoodSummary';
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

export function MoodScreen() {
  const router = useRouter();
  const [notification, setNotification] = useState('');
  const [chartWidth, setChartWidth] = useState(0);

  const chartPoints = [
    { xPercent: 10, y: 30, emoji: '😄', date: '10/5' },
    { xPercent: 26, y: 65, emoji: '🥰', date: '11/5' },
    { xPercent: 42, y: 45, emoji: '😌', date: '12/5' },
    { xPercent: 58, y: 20, emoji: '😩', date: '13/5' },
    { xPercent: 74, y: 85, emoji: '🤩', date: '14/5' },
    { xPercent: 90, y: 50, emoji: '😄', date: '15/5' },
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
          <Text style={styles.headerTitle}>Mood của chúng ta</Text>
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Side-by-Side Mood Cards */}
        <View style={styles.moodCardsRow}>
          {/* Card: Bạn */}
          <View style={styles.moodCard}>
            <Text style={styles.moodCardTitle}>Bạn</Text>
            <View style={styles.emojiCircle}>
              <Text style={styles.moodEmoji}>😄</Text>
            </View>
            <Text style={styles.moodLabel}>Vui vẻ</Text>
          </View>

          {/* Card: Đối phương */}
          <View style={styles.moodCard}>
            <Text style={styles.moodCardTitle}>Đối phương</Text>
            <View style={styles.emojiCircle}>
              <Text style={styles.moodEmoji}>🥰</Text>
            </View>
            <Text style={styles.moodLabel}>Hạnh phúc</Text>
          </View>
        </View>

        {/* Gửi thông báo đến đối phương */}
        <View style={styles.notificationCard}>
          <Text style={styles.sectionTitle}>Gửi thông báo đến đối phương</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Bạn muốn nhắn gì cho đối phương..."
              placeholderTextColor="rgba(43,43,43,0.35)"
              value={notification}
              onChangeText={setNotification}
              multiline
            />
            <TouchableOpacity style={styles.sendBtn} activeOpacity={0.8}>
              <LinearGradient
                colors={['#FCB76D', '#FF7158']}
                style={styles.sendGradient}
              >
                <Ionicons name="paper-plane" size={16} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Lịch sử cảm xúc */}
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Lịch sử cảm xúc</Text>
          <TouchableOpacity>
            <Text style={styles.seeDetailLink}>Xem chi tiết</Text>
          </TouchableOpacity>
        </View>

        {/* Custom Premium Line Chart */}
        <View style={styles.chartCard}>
          <View 
            style={styles.chartContainer}
            onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
          >
            {chartWidth > 0 && (
              <LineChart
                data={{
                  labels: chartPoints.map((p) => p.date),
                  datasets: [
                    {
                      data: chartPoints.map((p) => p.y),
                    },
                  ],
                }}
                width={chartWidth}
                height={140}
                withInnerLines={true}
                withOuterLines={false}
                withVerticalLines={false}
                withHorizontalLines={true}
                withVerticalLabels={false}
                withHorizontalLabels={false}
                bezier
                chartConfig={{
                  backgroundColor: '#FFFFFF',
                  backgroundGradientFrom: '#FFFFFF',
                  backgroundGradientTo: '#FFFFFF',
                  fillShadowGradientFrom: '#FFE6CE',
                  fillShadowGradientTo: '#FFFFFF',
                  fillShadowGradientOpacity: 0.4,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(252, 183, 109, ${opacity})`, // Cam nhạt cho line (#FCB76D)
                  labelColor: (opacity = 1) => `rgba(136, 136, 136, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForBackgroundLines: {
                    strokeWidth: 1,
                    stroke: '#FAF9F7',
                  },
                  propsForDots: {
                    r: '4',
                    strokeWidth: '1.5',
                    stroke: '#FF7158',
                    fill: '#FFFFFF',
                  },
                }}
                renderDotContent={({ x, y, index }) => (
                  <Text
                    key={`dot-${index}`}
                    style={[
                      styles.dotLabelText,
                      {
                        left: x - 9, // center the emoji
                        top: y - 24, // place the emoji above the dot
                      },
                    ]}
                  >
                    {chartPoints[index].emoji}
                  </Text>
                )}
                style={{
                  marginVertical: 0,
                  borderRadius: 16,
                  paddingRight: 0,
                  paddingLeft: 0,
                }}
              />
            )}
          </View>
          
          {/* Chart X axis dates */}
          <View style={styles.chartXLabels}>
            {chartPoints.map((pt, idx) => (
              <Text key={`label-${idx}`} style={styles.xAxisLabel}>{pt.date}</Text>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomTabBar activeRoute={ROUTES.mood} onNavigate={(r) => router.replace(r as any)} />
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
  
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, gap: 20 },

  // Side-by-Side Mood Cards
  moodCardsRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
  },
  moodCard: {
    flex: 1,
    backgroundColor: '#FFF1E4',
    borderWidth: 1,
    borderColor: '#FFE6CE',
    borderRadius: 24,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  moodCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888888',
  },
  emojiCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFE6CE',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  moodEmoji: {
    fontSize: 36,
  },
  moodLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF7158',
  },

  // Notification input card
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FCB76D',
    borderRadius: 24,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF7158',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF9F7',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 50,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#2B2B2B',
    paddingRight: 8,
  },
  sendBtn: {
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  sendGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // History Section
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF7158',
  },
  seeDetailLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FCB76D',
  },

  // Chart
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FFE6CE',
    padding: 16,
    gap: 8,
  },
  chartContainer: {
    height: 140,
    position: 'relative',
  },
  dotLabelText: {
    position: 'absolute',
    fontSize: 16,
    zIndex: 15,
  },
  chartXLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 4,
  },
  xAxisLabel: {
    fontSize: 11,
    color: '#888888',
    fontWeight: '600',
  },
});
