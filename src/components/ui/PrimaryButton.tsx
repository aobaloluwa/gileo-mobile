import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { colors, spacing } from '../../theme';

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  variant?: 'primary' | 'secondary' | 'outline';
};

export default function PrimaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
  labelStyle,
  variant = 'primary',
}: PrimaryButtonProps) {
  const unavailable = disabled || loading;

  const isOutline = variant === 'outline';
  const isSecondary = variant === 'secondary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{
        disabled: unavailable,
        busy: loading,
      }}
      onPress={onPress}
      disabled={unavailable}
      style={({ pressed }) => [
        styles.button,
        isSecondary && styles.buttonSecondary,
        isOutline && styles.buttonOutline,
        unavailable && styles.disabled,
        pressed && !unavailable && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline || isSecondary ? '#0F172A' : '#FFFFFF'} />
      ) : (
        <Text
          style={[
            styles.label,
            isSecondary && styles.labelSecondary,
            isOutline && styles.labelOutline,
            labelStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    paddingHorizontal: spacing.xl,
    borderRadius: 999,
    backgroundColor: '#B81C25',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#B81C25',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonSecondary: {
    backgroundColor: '#F4F5F7',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#EAECEF',
    shadowOpacity: 0,
    elevation: 0,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  labelSecondary: {
    color: '#0F172A',
    fontWeight: '700',
  },
  labelOutline: {
    color: '#0F172A',
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
