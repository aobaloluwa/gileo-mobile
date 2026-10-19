import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { colors, radii, spacing } from '../../theme';

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

export default function PrimaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
}: PrimaryButtonProps) {
  const unavailable = disabled || loading;

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
        unavailable && styles.disabled,
        pressed && !unavailable && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.label}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    backgroundColor: colors.primaryPressed,
  },
});