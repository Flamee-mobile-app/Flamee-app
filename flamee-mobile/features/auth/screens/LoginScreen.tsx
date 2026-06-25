import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
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
import { Image } from 'expo-image';

import { flameeTheme } from '@/constants/flameeTheme';
import { GradientButton } from '@/components/ui';
import { useLoginForm } from '@/features/auth/hooks/useAuthForm';
import { ROUTES } from '@/lib/navigation/routes';

const { width, height } = Dimensions.get('window');

function CustomInputField({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  error,
}: {
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  error?: string;
}) {
  return (
    <View style={inputStyles.wrapper}>
      <View style={inputStyles.border}>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="rgba(43, 43, 43, 0.4)"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          style={inputStyles.input}
          autoCapitalize="none"
        />
      </View>
      {error ? <Text style={inputStyles.error}>{error}</Text> : null}
    </View>
  );
}

const inputStyles = StyleSheet.create({
  wrapper: { gap: 4 },
  border: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingHorizontal: 20,
    height: 48,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFE6CE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  input: { fontSize: 15, color: '#2B2B2B', flex: 1 },
  error: { color: '#FF7158', fontSize: 11, paddingHorizontal: 16 },
});

export function LoginScreen() {
  const router = useRouter();
  const form = useLoginForm(() => router.replace(ROUTES.home));
  const [rememberMe, setRememberMe] = useState(true);

  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/chinh_mau_1.png')}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        transition={200}
      />
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.overlay} />

      {/* Fixed Logo image top-left */}
      <SafeAreaView style={styles.logoArea}>
        <View style={styles.logoRow}>
          <Image
            source={require('../../../assets/flamee_logo.png')}
            style={styles.logoIcon}
            contentFit="contain"
            transition={200}
          />
          <Text style={styles.logoText}>Flamee</Text>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Transparent Spacer to push the Form Panel down to y-position 280 */}
          <View style={styles.topSpacer} />

          {/* Form Panel matching Figma soft cream color */}
          <View style={styles.formPanel}>
            <Text style={styles.title}>Flamee xin chào!</Text>

            {/* Form Fields */}
            <View style={styles.formFields}>
              <CustomInputField
                placeholder="Email"
                value={form.values.email}
                onChangeText={(v) => form.update('email', v)}
                error={form.errors.email}
              />
              <CustomInputField
                placeholder="Mật khẩu"
                value={form.values.password}
                onChangeText={(v) => form.update('password', v)}
                secureTextEntry
                error={form.errors.password}
              />
            </View>

            {/* Remember me & Forgot password row */}
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.rememberBtn}
                activeOpacity={0.8}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                  {rememberMe && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
                </View>
                <Text style={styles.rememberText}>Ghi nhớ đăng nhập</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.forgotBtn} activeOpacity={0.7}>
                <Text style={styles.forgotText}>Quên mật khẩu?</Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <GradientButton
              title={form.submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
              onPress={form.submit}
              style={styles.submitBtn}
            />

            {/* Social Logins */}
            <View style={styles.socialContainer}>
              <Text style={styles.socialTitle}>Hoặc đăng nhập với</Text>
              <View style={styles.socialButtons}>
                <TouchableOpacity style={styles.socialBtn}>
                  <Ionicons name="logo-facebook" size={24} color="#1877F2" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialBtn}>
                  <Ionicons name="logo-google" size={24} color="#EA4335" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialBtn}>
                  <Ionicons name="logo-apple" size={24} color="#000000" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Register Link */}
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Chưa có tài khoản? </Text>
              <TouchableOpacity onPress={() => router.push(ROUTES.register)}>
                <Text style={styles.registerLink}>Đăng ký</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const ARTWORK_HEIGHT = 280;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  logoArea: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 24 : 10,
    left: 24,
    zIndex: 20,
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
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  topSpacer: {
    height: ARTWORK_HEIGHT,
  },
  formPanel: {
    backgroundColor: '#FFF1E4', // Soft cream background from brand palette
    borderTopLeftRadius: 63,
    borderTopRightRadius: 63,
    paddingHorizontal: 40,
    paddingTop: 36,
    paddingBottom: 40,
    gap: 20,
    minHeight: height - ARTWORK_HEIGHT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2B2B2B',
    textAlign: 'center',
    marginBottom: 10,
  },
  formFields: {
    gap: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  rememberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#76E69F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#76E69F',
  },
  rememberText: {
    fontSize: 12,
    color: '#555555',
  },
  forgotBtn: {
    paddingVertical: 2,
  },
  forgotText: {
    fontSize: 12,
    color: '#FF7158',
    fontWeight: '500',
  },
  submitBtn: {
    marginTop: 10,
  },
  socialContainer: {
    alignItems: 'center',
    marginTop: 10,
    gap: 12,
  },
  socialTitle: {
    fontSize: 12,
    color: '#555555',
    fontWeight: '400',
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 24,
  },
  socialBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFE6CE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  registerText: {
    fontSize: 13,
    color: '#555555',
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF7158',
  },
});
