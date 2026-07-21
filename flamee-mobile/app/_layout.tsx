import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import * as RN from 'react-native';

import '../styles/global.css';

import { queryClient } from '@/shared/lib/api/queryClient';

// Prevent splash screen from auto-hiding until fonts are loaded
SplashScreen.preventAutoHideAsync().catch(() => {});

// Global font mapping helper to resolve custom font weights on both Android and iOS cleanly
const mapFont = (style: any) => {
  if (!style) return { fontFamily: 'SF-Pro-Regular' };
  const flatStyle = RN.StyleSheet.flatten(style);
  if (!flatStyle) return style;

  let fontFamily = flatStyle.fontFamily;
  const fontWeight = flatStyle.fontWeight;

  // Set default app font family if not defined or system default
  if (!fontFamily || fontFamily === 'System' || fontFamily === 'sans-serif') {
    fontFamily = 'SF-Pro';
  }

  // Resolve weight for standard SF Pro Text font
  if (fontFamily === 'SF-Pro' || fontFamily === 'SF Pro' || fontFamily.startsWith('SF-Pro-Text') || fontFamily === 'sans-serif') {
    if (fontWeight === 'bold' || fontWeight === '700' || fontWeight === '800' || fontWeight === '900') {
      return [flatStyle, { fontFamily: 'SF-Pro-Bold', fontWeight: undefined }];
    }
    if (fontWeight === '600' || fontWeight === 'semibold') {
      return [flatStyle, { fontFamily: 'SF-Pro-Bold', fontWeight: undefined }];
    }
    if (fontWeight === '500' || fontWeight === 'medium') {
      return [flatStyle, { fontFamily: 'SF-Pro-Medium', fontWeight: undefined }];
    }
    if (fontWeight === '300' || fontWeight === 'light') {
      return [flatStyle, { fontFamily: 'SF-Pro-Light', fontWeight: undefined }];
    }
    return [flatStyle, { fontFamily: 'SF-Pro-Regular', fontWeight: undefined }];
  }

  // Resolve weight for SF Pro Rounded font
  if (fontFamily === 'SF-Pro-Rounded' || fontFamily === 'SF Pro Rounded') {
    if (fontWeight === 'bold' || fontWeight === '700' || fontWeight === '800' || fontWeight === '900') {
      return [flatStyle, { fontFamily: 'SF-Pro-Rounded-Bold', fontWeight: undefined }];
    }
    if (fontWeight === '600' || fontWeight === 'semibold') {
      return [flatStyle, { fontFamily: 'SF-Pro-Rounded-Semibold', fontWeight: undefined }];
    }
    if (fontWeight === '500' || fontWeight === 'medium') {
      return [flatStyle, { fontFamily: 'SF-Pro-Rounded-Medium', fontWeight: undefined }];
    }
    return [flatStyle, { fontFamily: 'SF-Pro-Rounded-Regular', fontWeight: undefined }];
  }

  return style;
};

// Override React Native Text globally
// eslint-disable-next-line @typescript-eslint/no-require-imports
const rnRaw = require('react-native');
const OriginalText = rnRaw.Text;
const CustomText = React.forwardRef((props: any, ref: any) => {
  return React.createElement(OriginalText, {
    ...props,
    ref,
    style: mapFont(props.style),
  });
});
CustomText.displayName = 'Text';
Object.setPrototypeOf(CustomText, OriginalText);
for (const key in OriginalText) {
  if (Object.prototype.hasOwnProperty.call(OriginalText, key)) {
    (CustomText as any)[key] = (OriginalText as any)[key];
  }
}
try {
  Object.defineProperty(rnRaw, 'Text', {
    get() {
      return CustomText;
    },
    configurable: true,
    enumerable: true,
  });
} catch (e) {
  console.error('Failed to override RN.Text:', e);
}

// Override React Native TextInput globally
const OriginalTextInput = rnRaw.TextInput;
const CustomTextInput = React.forwardRef((props: any, ref: any) => {
  return React.createElement(OriginalTextInput, {
    ...props,
    ref,
    style: mapFont(props.style),
  });
});
CustomTextInput.displayName = 'TextInput';
Object.setPrototypeOf(CustomTextInput, OriginalTextInput);
for (const key in OriginalTextInput) {
  if (Object.prototype.hasOwnProperty.call(OriginalTextInput, key)) {
    (CustomTextInput as any)[key] = (OriginalTextInput as any)[key];
  }
}
try {
  Object.defineProperty(rnRaw, 'TextInput', {
    get() {
      return CustomTextInput;
    },
    configurable: true,
    enumerable: true,
  });
} catch (e) {
  console.error('Failed to override RN.TextInput:', e);
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'SF-Pro-Rounded-Bold': require('../assets/fonts/SF-Pro-Rounded-Bold.otf'),
    'SF-Pro-Rounded-Semibold': require('../assets/fonts/SF-Pro-Rounded-Semibold.otf'),
    'SF-Pro-Rounded-Medium': require('../assets/fonts/SF-Pro-Rounded-Medium.otf'),
    'SF-Pro-Rounded-Regular': require('../assets/fonts/SF-Pro-Rounded-Regular.otf'),
    'SF-Pro-Light': require('../assets/fonts/SF-Pro-Text-Light.otf'),
    'SF-Pro-Regular': require('../assets/fonts/SF-Pro-Text-Regular.otf'),
    'SF-Pro-Medium': require('../assets/fonts/SF-Pro-Text-Medium.otf'),
    'SF-Pro-Bold': require('../assets/fonts/SF-Pro-Text-Bold.otf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(main)" />
      </Stack>
      <StatusBar style="dark" />
    </QueryClientProvider>
  );
}
