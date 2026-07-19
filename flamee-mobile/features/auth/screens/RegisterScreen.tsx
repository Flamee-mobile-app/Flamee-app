import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
import { useRegisterForm } from '@/features/auth/hooks/useAuthForm';
import { ROUTES } from '@/lib/navigation/routes';

const { width, height } = Dimensions.get('window');

function CustomInputField({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  error,
}: {
  label?: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  error?: string;
}) {
  return (
    <View style={inputStyles.wrapper}>
      {label ? <Text style={inputStyles.label}>{label}</Text> : null}
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
  label: {
    fontFamily: 'SF-Pro',
    fontSize: 14,
    fontWeight: '500',
    color: '#444444',
    marginLeft: 16,
  },
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
  input: {
    fontFamily: 'SF-Pro',
    fontSize: 15,
    color: '#2B2B2B',
    flex: 1,
  },
  error: {
    fontFamily: 'SF-Pro',
    color: '#FF7158',
    fontSize: 11,
    paddingHorizontal: 16,
  },
});

export function RegisterScreen() {
  const router = useRouter();
  const form = useRegisterForm(() => router.replace(ROUTES.home));

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
            <Text style={styles.title}>Đăng ký thôi nào!</Text>

            {/* Form Fields */}
            <View style={styles.formFields}>
              <CustomInputField
                label="Tên đăng nhập"
                placeholder="flamee_user"
                value={form.values.phone}
                onChangeText={(v) => form.update('phone', v)}
                error={form.errors.phone}
              />
              <CustomInputField
                label="Email"
                placeholder="example@gmail.com"
                value={form.values.email}
                onChangeText={(v) => form.update('email', v)}
                error={form.errors.email}
              />
              <CustomInputField
                label="Mật khẩu"
                placeholder="••••••••"
                value={form.values.password}
                onChangeText={(v) => form.update('password', v)}
                secureTextEntry
                error={form.errors.password}
              />
            </View>

            {/* Terms checkbox row */}
            <TouchableOpacity
              style={styles.termsRow}
              activeOpacity={0.8}
              onPress={() => form.update('acceptedPolicy', !form.values.acceptedPolicy)}
            >
              <View style={[styles.checkbox, form.values.acceptedPolicy && styles.checkboxActive]}>
                {form.values.acceptedPolicy && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
              </View>
              <Text style={styles.termsText}>
                Tôi đồng ý với{' '}
                <Text style={styles.termsLink}>chính sách và điều khoản</Text>
              </Text>
            </TouchableOpacity>
            {form.errors.acceptedPolicy && (
              <Text style={styles.termsError}>{form.errors.acceptedPolicy}</Text>
            )}

            {/* Submit Button */}
            <GradientButton
              title={form.submitting ? 'Đang đăng ký...' : 'Đăng ký'}
              onPress={form.submit}
              style={styles.submitBtn}
            />

            {/* Social Logins */}
            <View style={styles.socialContainer}>
              <Text style={styles.socialTitle}>Hoặc đăng ký với</Text>
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

            {/* Login Link */}
            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Đã có tài khoản? </Text>
              <TouchableOpacity onPress={() => router.push(ROUTES.login)}>
                <Text style={styles.loginLink}>Đăng nhập</Text>
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
    fontFamily: 'SF-Pro-Rounded',
    fontSize: 28,
    fontWeight: '700',
    color: '#2B2B2B',
    textAlign: 'center',
    lineHeight: 33,
    marginBottom: 10,
  },
  formFields: {
    gap: 12,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
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
  termsText: {
    fontFamily: 'SF-Pro',
    fontSize: 11,
    color: '#555555',
    fontWeight: '400',
  },
  termsLink: {
    fontFamily: 'SF-Pro',
    color: '#FF7158',
    fontWeight: '600',
  },
  termsError: {
    fontFamily: 'SF-Pro',
    color: '#FF7158',
    fontSize: 11,
    paddingHorizontal: 4,
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
    fontFamily: 'SF-Pro',
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
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  loginText: {
    fontFamily: 'SF-Pro',
    fontSize: 13,
    color: '#555555',
    fontWeight: '400',
  },
  loginLink: {
    fontFamily: 'SF-Pro',
    fontSize: 13,
    fontWeight: '600',
    color: '#FF7158',
  },
});
