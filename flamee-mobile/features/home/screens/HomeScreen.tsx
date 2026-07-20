import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';

import { ROUTES } from '@/lib/navigation/routes';

const { width } = Dimensions.get('window');

export function HomeScreen() {
  const router = useRouter();

  const handleNavigateTab = (route: string) => {
    router.replace(route as any);
  };

  const handlePushRoute = (route: string) => {
    router.push(route as any);
  };

  const shortcuts = [
    { label: 'Chat AI', icon: 'chatbubble-ellipses', route: ROUTES.ai, push: true },
    { label: 'Dòng thời gian', icon: 'time', route: ROUTES.memories, push: false },
    { label: 'Lịch hẹn hò', icon: 'calendar', route: ROUTES.dates, push: true },
    { label: 'Sổ kỉ niệm', icon: 'heart', route: ROUTES.memories, push: false },
    { label: 'Mood checkin', icon: 'happy', route: ROUTES.mood, push: false },
    { label: 'Nhiệm vụ', icon: 'checkmark-circle', route: ROUTES.missions, push: false },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Full screen artwork background */}
      <Image
        source={require('../../../assets/chinh_mau_1.png')}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        transition={200}
      />

      {/* Semi-transparent dark overlay for high text readability */}
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea}>
        {/* Top Header Row with Small Signature Logo and Chat Button */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Image
              source={require('../../../assets/flamee_logo.png')}
              style={styles.logoIcon}
              contentFit="contain"
              transition={200}
            />
            <Text style={styles.logoText}>Flamee</Text>
          </View>
            
            <TouchableOpacity 
              style={styles.chatHeaderBtn} 
              onPress={() => handlePushRoute(ROUTES.ai)}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Scrollable middle container to hold the quote and shortcuts */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Greeting & Quote */}
            <View style={styles.greetingContainer}>
              <Text style={styles.greetingTitle}>Good evening</Text>
              <Text style={styles.greetingQuote}>
                {"\"Tình yêu được nuôi dưỡng từ những kỷ niệm.\""}
              </Text>
            </View>

            {/* Test Navigation Shortcuts (Glassmorphism layout) */}
            <View style={styles.shortcutsContainer}>
              <Text style={styles.shortcutsTitle}>Danh mục chức năng</Text>
              
              <View style={styles.grid}>
                {shortcuts.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.shortcutBtn}
                    onPress={() => item.push ? handlePushRoute(item.route) : handleNavigateTab(item.route)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.shortcutIconBg}>
                      <Ionicons name={item.icon as any} size={18} color="#FF7158" />
                    </View>
                    <Text style={styles.shortcutLabel} numberOfLines={1}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Spacer for bottom tab bar */}
            <View style={{ height: 100 }} />
          </ScrollView>
        </SafeAreaView>
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 8,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 24,
    height: 24,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  chatHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 30,
    gap: 36,
  },
  greetingContainer: {
    gap: 12,
    marginTop: 40,
  },
  greetingTitle: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
  },
  greetingQuote: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    fontStyle: 'italic',
    lineHeight: 22,
    opacity: 0.95,
  },
  
  // Shortcuts
  shortcutsContainer: {
    gap: 16,
  },
  shortcutsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    opacity: 0.8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingLeft: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  shortcutBtn: {
    width: (width - 48 - 12) / 2, // 2-column layout
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shortcutIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF1E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
});
