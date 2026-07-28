import { useState } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  SafeAreaView,
} from 'react-native';

import { handleSafeBack } from '@/shared/lib/navigation/safeBack';
import { flameeFonts, flameeTheme } from '@/shared/constants/flameeTheme';
import { StateView } from '@/shared/components/ui';
import { useAiChatSeed } from '@/features/ai/hooks/useAiChatSeed';
import type { AiMessage } from '@/features/ai/types';

const { width } = Dimensions.get('window');

export function AiScreen() {
  const router = useRouter();
  const seed = useAiChatSeed();
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [chartWidth, setChartWidth] = useState(width - 48 - 40);

  if (seed.isLoading) return <StateView title="Đang mở Chat AI" loading />;
  if (seed.isError || !seed.data) {
    return <StateView title="Không tải được Chat AI" actionLabel="Thử lại" onAction={() => seed.refetch()} />;
  }

  const visibleMessages = messages.length > 0 ? messages : seed.data.messages;

  const sendDraft = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, author: 'user', text },
    ]);
    setDraft('');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Custom Header */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => handleSafeBack(router)} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#FF7158" />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Flamee AI</Text>
            <Text style={styles.headerSubtitle}>Cặp đôi dành cho bạn</Text>
          </View>

          <TouchableOpacity style={styles.menuBtn}>
            <Ionicons name="menu-outline" size={26} color="#FF7158" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Suggestion Card 1: Ý tưởng hẹn hò */}
          <View style={styles.suggestionCard}>
            <View style={styles.suggestionLeft}>
              <Text style={styles.cardTag}>Ý tưởng hẹn hò cho hôm nay</Text>
              <Text style={styles.suggestionBody}>
                Gợi ý dành cho bạn
              </Text>
              <TouchableOpacity style={styles.seeMoreBtn} onPress={() => setDraft(seed.data!.suggestions[0]?.prompt ?? '')}>
                <Text style={styles.seeMoreText}>Xem thêm</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.ramenContainer}>
              <Text style={styles.ramenEmoji}>🍜</Text>
            </View>
          </View>

          {/* Suggestion Card 2: Phân tích cảm xúc */}
          <View style={styles.suggestionCard}>
            <Text style={styles.cardTag}>Phân tích cảm xúc đối phương</Text>
            <Text style={styles.suggestionBody}>
              Cảm xúc của đối phương đang rất tích cực sau các hoạt động gần đây
            </Text>
            
            {/* Emotion graph line chart built using react-native-chart-kit */}
            <View 
              style={styles.chartContainer}
              onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
            >
              {chartWidth > 0 && (
                <LineChart
                  data={{
                    labels: ['', '', '', '', ''],
                    datasets: [
                      {
                        data: [20, 45, 30, 65, 50],
                      },
                    ],
                  }}
                  width={chartWidth}
                  height={100}
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
                      r: '4',
                      strokeWidth: '1.5',
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
            </View>
          </View>

          {/* Chat Messages */}
          {visibleMessages.map((msg) => {
            const isUser = msg.author === 'user';
            return (
              <View
                key={msg.id}
                style={[
                  styles.bubble,
                  isUser ? styles.bubbleUser : styles.bubbleAi,
                ]}
              >
                <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
                  {msg.text}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <View style={styles.inputBorder}>
            <TextInput
              style={styles.input}
              placeholder="Nhập tin nhắn..."
              placeholderTextColor="rgba(43,43,43,0.35)"
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={sendDraft}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={sendDraft} activeOpacity={0.8}>
              <LinearGradient
                colors={['#FCB76D', '#FF7158']}
                style={styles.sendGradient}
              >
                <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F7',
  },
  flex: {
    flex: 1,
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
    paddingVertical: 10,
  },
  backBtn: {
    padding: 4,
  },
  titleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: flameeFonts.roundedBold,
    fontSize: 18,
    color: '#FF7158',
  },
  headerSubtitle: {
    fontFamily: flameeFonts.regular,
    fontSize: 11,
    color: '#888888',
  },
  menuBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },

  // Suggestion Card
  suggestionCard: {
    backgroundColor: '#FFF1E4',
    borderWidth: 1,
    borderColor: '#FFE6CE',
    borderRadius: 24,
    padding: 20,
    position: 'relative',
  },
  suggestionLeft: {
    width: '65%',
    gap: 6,
  },
  cardTag: {
    fontFamily: flameeFonts.bold,
    fontSize: 12,
    color: '#888888',
  },
  suggestionBody: {
    fontFamily: flameeFonts.roundedBold,
    fontSize: 15,
    color: '#2B2B2B',
    lineHeight: 20,
  },
  seeMoreBtn: {
    backgroundColor: '#FF7158',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  seeMoreText: {
    fontFamily: flameeFonts.bold,
    color: '#FFFFFF',
    fontSize: 12,
  },
  ramenContainer: {
    position: 'absolute',
    right: 20,
    top: 20,
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 35,
    borderWidth: 1,
    borderColor: '#FFE6CE',
  },
  ramenEmoji: {
    fontSize: 38,
  },

  chartContainer: {
    height: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FFE6CE',
    position: 'relative',
    overflow: 'hidden',
  },

  // Chat Bubbles
  bubble: {
    maxWidth: '80%',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 8,
  },
  bubbleAi: {
    backgroundColor: '#FFF1E4',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#FFE6CE',
  },
  bubbleUser: {
    backgroundColor: '#FF7158',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontFamily: flameeFonts.regular,
    fontSize: 14,
    color: '#2B2B2B',
    lineHeight: 18,
  },
  bubbleTextUser: {
    color: '#FFFFFF',
  },

  // Chat Input
  inputContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#FFE6CE',
  },
  inputBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF9F7',
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: '#FCB76D',
    paddingHorizontal: 16,
    height: 48,
  },
  input: {
    flex: 1,
    fontFamily: flameeFonts.regular,
    fontSize: 14,
    color: '#2B2B2B',
  },
  sendBtn: {
    marginLeft: 8,
  },
  sendGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
