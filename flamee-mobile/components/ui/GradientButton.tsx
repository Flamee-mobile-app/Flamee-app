import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, TouchableOpacity, Text, ViewStyle, TextStyle } from 'react-native';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'solid' | 'outline';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function GradientButton({ title, onPress, variant = 'solid', style, textStyle }: GradientButtonProps) {
  if (variant === 'outline') {
    return (
      <TouchableOpacity onPress={onPress} style={[styles.outlineWrapper, style]} activeOpacity={0.8}>
        <LinearGradient
          colors={['#FCB76D', '#FF7158']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.outlineBorder}
        >
          <TouchableOpacity onPress={onPress} style={styles.outlineInner} activeOpacity={0.8}>
            <LinearGradient
              colors={['#FCB76D', '#FF7158']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={[styles.outlineText, textStyle]}>{title}</Text>
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.solidWrapper, style]}>
      <LinearGradient
        colors={['#FCB76D', '#FF7158']}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={styles.solidGradient}
      >
        <Text style={[styles.solidText, textStyle]}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  solidWrapper: {
    borderRadius: 32,
    overflow: 'hidden',
  },
  solidGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solidText: {
    fontFamily: 'SF-Pro',
    color: '#5B4C1B',
    fontSize: 14,
    fontWeight: '600',
  },
  outlineWrapper: {
    borderRadius: 32,
    overflow: 'hidden',
  },
  outlineBorder: {
    padding: 2,
    borderRadius: 32,
  },
  outlineInner: {
    backgroundColor: 'transparent',
    borderRadius: 30,
    overflow: 'hidden',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineText: {
    fontFamily: 'SF-Pro',
    fontSize: 14,
    fontWeight: '600',
    color: '#FF7158',
  },
});
