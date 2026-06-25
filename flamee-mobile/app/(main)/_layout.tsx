import { Stack } from 'expo-router';

export default function MainLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Disable animation for main tab screens to feel like native tabs */}
      <Stack.Screen name="home" options={{ animation: 'none' }} />
      <Stack.Screen name="memories" options={{ animation: 'none' }} />
      <Stack.Screen name="mood" options={{ animation: 'none' }} />
      <Stack.Screen name="missions" options={{ animation: 'none' }} />
      <Stack.Screen name="profile" options={{ animation: 'none' }} />

      {/* Enable default slide animations for pushed sub-pages */}
      <Stack.Screen name="ai" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="dates" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="timeline" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
