import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { colors, radii, spacing } from '../../theme';

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
        pressed && !unavailable && (isOutline ? styles.pressedOutline : styles.pressed),
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.text : '#FFFFFF'} />
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
    height: 56,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  buttonSecondary: {
    backgroundColor: colors.primarySoft,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  labelSecondary: {
    color: colors.text,
  },
  labelOutline: {
    color: colors.text,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    backgroundColor: colors.primaryPressed,
    transform: [{ scale: 0.985 }],
  },
  pressedOutline: {
    backgroundColor: colors.surfaceSubtle,
    transform: [{ scale: 0.985 }],
  },
});