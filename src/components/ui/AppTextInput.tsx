import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';

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
          Boolean(error) && styles.inputError,
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
          placeholderTextColor="#94A3B8"
          selectionColor="#761B36"
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
            hitSlop={10}
            style={styles.eyeButton}
          >
            <Ionicons
              name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#64748B"
            />
          </Pressable>
        )}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  inputWrapper: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAECEF',
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
  },
  inputFocused: {
    borderColor: '#0F172A',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FFF8F8',
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '500',
  },
  eyeButton: {
    paddingLeft: spacing.sm,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
});
