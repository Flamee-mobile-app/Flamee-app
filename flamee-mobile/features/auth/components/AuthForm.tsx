import { Pressable, StyleSheet, View } from 'react-native';

import { flameeTheme } from '@/shared/constants/flameeTheme';
import { AppText, Button, TextField } from '@/shared/components/ui';

type LoginModeProps = {
  mode: 'login';
  email: string;
  password: string;
  remember: boolean;
  errors: {
    email?: string;
    password?: string;
  };
  submitting: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRememberChange: (value: boolean) => void;
  onSubmit: () => void;
};

type RegisterModeProps = {
  mode: 'register';
  phone: string;
  email: string;
  password: string;
  acceptedPolicy: boolean;
  errors: {
    phone?: string;
    email?: string;
    password?: string;
    acceptedPolicy?: string;
  };
  submitting: boolean;
  onPhoneChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onAcceptedPolicyChange: (value: boolean) => void;
  onSubmit: () => void;
};

export type AuthFormProps = LoginModeProps | RegisterModeProps;

export function AuthForm(props: AuthFormProps) {
  return (
    <View style={styles.form}>
      {props.mode === 'register' ? (
        <TextField
          label="Số điện thoại"
          keyboardType="phone-pad"
          value={props.phone}
          error={props.errors.phone}
          onChangeText={props.onPhoneChange}
          placeholder="0901234567"
        />
      ) : null}
      <TextField
        label="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={props.email}
        error={props.errors.email}
        onChangeText={props.onEmailChange}
        placeholder="love@flamee.app"
      />
      <TextField
        label="Mật khẩu"
        secureTextEntry
        value={props.password}
        error={props.errors.password}
        onChangeText={props.onPasswordChange}
        placeholder="••••••••"
      />
      {props.mode === 'login' ? (
        <ToggleRow
          label="Ghi nhớ đăng nhập"
          selected={props.remember}
          onPress={() => props.onRememberChange(!props.remember)}
        />
      ) : (
        <View>
          <ToggleRow
            label="Tôi đồng ý với điều khoản sử dụng"
            selected={props.acceptedPolicy}
            onPress={() => props.onAcceptedPolicyChange(!props.acceptedPolicy)}
          />
          {props.errors.acceptedPolicy ? (
            <AppText variant="caption" color={flameeTheme.colors.accentRed}>
              {props.errors.acceptedPolicy}
            </AppText>
          ) : null}
        </View>
      )}
      <Button
        title={props.mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
        loading={props.submitting}
        onPress={props.onSubmit}
      />
    </View>
  );
}

type ToggleRowProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function ToggleRow({ label, selected, onPress }: ToggleRowProps) {
  return (
    <Pressable onPress={onPress} style={styles.toggle}>
      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
        {selected ? (
          <AppText variant="caption" color={flameeTheme.colors.text.inverse} align="center">
            ✓
          </AppText>
        ) : null}
      </View>
      <AppText variant="bodySmall" color={flameeTheme.colors.text.secondary}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: flameeTheme.spacing[4],
  },
  toggle: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: flameeTheme.spacing[2],
  },
  checkbox: {
    alignItems: 'center',
    borderColor: flameeTheme.colors.brand,
    borderRadius: flameeTheme.radii.sm,
    borderWidth: 1,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  checkboxSelected: {
    backgroundColor: flameeTheme.colors.brand,
  },
});
