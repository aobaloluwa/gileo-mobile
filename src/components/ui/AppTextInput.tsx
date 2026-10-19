import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { colors, radii, spacing } from '../../theme';

type AppTextInputProps = TextInputProps & {
  label: string;
  error?: string;
};

export default function AppTextInput({
  label,
  error,
  secureTextEntry,
  style,
  ...textInputProps
}: AppTextInputProps) {
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const isPassword = Boolean(secureTextEntry);
  const hidePassword = isPassword && !passwordVisible;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View
        style={[
          styles.inputWrapper,
          focused && styles.inputFocused,
          error && styles.inputError,
        ]}
      >
        <TextInput
          {...textInputProps}
          secureTextEntry={hidePassword}
          onFocus={(event) => {
            setFocused(true);
            textInputProps.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            textInputProps.onBlur?.(event);
          }}
          placeholderTextColor={colors.placeholder}
          selectionColor={colors.primary}
          style={[styles.input, style]}
          accessibilityLabel={label}
        />

        {isPassword && (
          <Pressable
            onPress={() => setPasswordVisible((visible) => !visible)}
            accessibilityRole="button"
            accessibilityLabel={
              passwordVisible ? 'Hide password' : 'Show password'
            }
            hitSlop={8}
          >
            <Text style={styles.passwordToggle}>
              {passwordVisible ? 'Hide' : 'Show'}
            </Text>
          </Pressable>
        )}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  inputWrapper: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.input,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.lg,
  },
  inputFocused: {
    borderColor: colors.primary,
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: spacing.lg,
    color: colors.text,
    fontSize: 15,
  },
  passwordToggle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
    paddingLeft: spacing.sm,
    paddingVertical: spacing.sm,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
  },
});