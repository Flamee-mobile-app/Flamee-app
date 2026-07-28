import { useState, useEffect } from 'react';
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
  Platform,
} from 'react-native';

import { handleSafeBack } from '@/shared/lib/navigation/safeBack';
import { flameeFonts } from '@/shared/constants/flameeTheme';
import { MascotArtwork } from '@/features/mascot/components/MascotArtwork';
import { useMoodSummary } from '@/features/mood/hooks/useMoodSummary';
import { MoodCheckinModal } from '@/features/mood/components/MoodCheckinModal';
import type { MoodEntry } from '@/features/mood/types';

const { width } = Dimensions.get('window');

export function MoodScreen() {
  const router = useRouter();
  const { data: summary, refetch: refresh } = useMoodSummary();
  const [notification, setNotification] = useState('');
  const [chartWidth, setChartWidth] = useState(width - 48 - 32);
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
  const [userMood, setUserMood] = useState<MoodEntry | undefined>(summary?.userMood);

  useEffect(() => {
    if (summary?.userMood) {
      setUserMood(summary.userMood);
    }
  }, [summary]);

  const handleCheckinSuccess = (entry: MoodEntry) => {
    setUserMood(entry);
    refresh();
  };

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

      {/* Custom Header */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => handleSafeBack(router)} style={styles.backBtn}>
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
        {/* Banner: Check-in Mood Ngay */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setIsCheckinModalOpen(true)}
          style={styles.checkinBannerWrapper}
        >
          <LinearGradient
            colors={['#FCB76D', '#FF7158']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.checkinBanner}
          >
            <View style={styles.bannerTextCol}>
              <Text style={styles.bannerTitle}>Check-in Mood hôm nay</Text>
              <Text style={styles.bannerSubtitle}>Chia sẻ cảm xúc của bạn với người ấy ngay nào 💕</Text>
            </View>
            <View style={styles.bannerBtn}>
              <Ionicons name="add-circle" size={32} color="#FFFFFF" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Side-by-Side Mood Cards */}
        <View style={styles.moodCardsRow}>
          {/* Card: Bạn */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsCheckinModalOpen(true)}
            style={styles.moodCard}
          >
            <Text style={styles.moodCardTitle}>Bạn</Text>
            <View style={styles.emojiCircle}>
              <MascotArtwork mood={userMood?.mood || 'happy'} size={48} />
            </View>
            <Text style={styles.moodLabel}>{userMood?.label || 'Vui vẻ'}</Text>
          </TouchableOpacity>

          {/* Card: Đối phương */}
          <View style={styles.moodCard}>
            <Text style={styles.moodCardTitle}>Đối phương</Text>
            <View style={styles.emojiCircle}>
              <MascotArtwork mood="calm" size={48} />
            </View>
            <Text style={styles.moodLabel}>Bình yên</Text>
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
                  color: (opacity = 1) => `rgba(252, 183, 109, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(136, 136, 136, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForBackgroundLines: {
                    strokeWidth: 1,
                    stroke: '#FAF9F7',
                  },
                  propsForDots: {
                    r: '5',
                    strokeWidth: '2',
                    stroke: '#FF7158',
                    fill: '#FFFFFF',
                  },
                }}
                style={{
                  paddingRight: 0,
                  paddingLeft: 0,
                  borderRadius: 16,
                }}
              />
            )}

            {/* Custom Emoji Overlay on Data Points */}
            {chartWidth > 0 &&
              chartPoints.map((pt, idx) => {
                const leftPos = (pt.xPercent / 100) * chartWidth - 12;
                const topPos = ((100 - pt.y) / 100) * 100 - 10;
                return (
                  <Text
                    key={idx}
                    style={[
                      styles.dotLabelText,
                      { left: leftPos, top: topPos },
                    ]}
                  >
                    {pt.emoji}
                  </Text>
                );
              })}
          </View>

          {/* X Axis Labels */}
          <View style={styles.chartXLabels}>
            {chartPoints.map((pt, idx) => (
              <Text key={`label-${idx}`} style={styles.xAxisLabel}>{pt.date}</Text>
            ))}
          </View>
        </View>

        {/* Bottom tab clearance spacing */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Mood Checkin 2-Step Modal */}
      <MoodCheckinModal
        onClose={() => setIsCheckinModalOpen(false)}
        onSuccess={handleCheckinSuccess}
        visible={isCheckinModalOpen}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bannerBtn: {
    paddingLeft: 8,
  },
  bannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: flameeFonts.medium,
    fontSize: 13,
  },
  bannerTextCol: {
    flex: 1,
    gap: 4,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontFamily: flameeFonts.bold,
    fontSize: 17,
  },
  checkinBanner: {
    alignItems: 'center',
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  checkinBannerWrapper: {
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#FF7158',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  container: { flex: 1, backgroundColor: '#FAF9F7' },
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
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: flameeFonts.roundedBold, fontSize: 22, color: '#FF7158' },
  headerRight: { flexDirection: 'row', gap: 12 },
  iconBtn: { padding: 4 },
  
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 100, gap: 20 },

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
    fontFamily: flameeFonts.bold,
    fontSize: 14,
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
    fontFamily: flameeFonts.bold,
    fontSize: 16,
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
    fontFamily: flameeFonts.bold,
    fontSize: 14,
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
    fontFamily: flameeFonts.regular,
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
    fontFamily: flameeFonts.roundedBold,
    fontSize: 18,
    color: '#FF7158',
  },
  seeDetailLink: {
    fontFamily: flameeFonts.bold,
    fontSize: 13,
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
    fontFamily: flameeFonts.medium,
    fontSize: 11,
    color: '#888888',
  },
});
