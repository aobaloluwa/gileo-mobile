
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppTextInput from '../components/ui/AppTextInput';
import PrimaryButton from '../components/ui/PrimaryButton';
import { colors, spacing, typography } from '../theme';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string }>();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleResetPassword = () => {
    Keyboard.dismiss();

    if (!password || !confirmPassword) {
      Alert.alert(
        'Missing information',
        'Please enter and confirm your new password.',
      );
      return;
    }

    if (password.length < 8) {
      Alert.alert(
        'Password too short',
        'Your new password must contain at least 8 characters.',
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        'Passwords do not match',
        'Please make sure both passwords are the same.',
      );
      return;
    }

    if (!params.token) {
      Alert.alert(
        'Reset link required',
        'Open the password reset link sent to your email to reset your password.',
      );
      return;
    }

    Alert.alert(
      'Ready to continue',
      'Your passwords match. We will connect this screen to the GILEO password-reset API next.',
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backLink}>‹  Back</Text>
          </Pressable>

          <View style={styles.brandRow}>
            <Image
              source={require('../assets/gileo-logo.png')}
              style={styles.brandLogo}
              resizeMode="contain"
              accessibilityLabel="Gileo Medicals"
            />
          </View>

          <View style={styles.illustration}>
            <View style={styles.iconCircle}>
              <Text style={styles.lockIcon}>⌑</Text>
              <View style={styles.checkBadge}>
                <Text style={styles.checkIcon}>✓</Text>
              </View>
            </View>
          </View>

          <View style={styles.heading}>
            <Text style={styles.eyebrow}>ACCOUNT SECURITY</Text>
            <Text style={styles.title}>Create a new password</Text>
            <Text style={styles.subtitle}>
              Choose a strong password to help keep your GILEO account and
              health information secure.
            </Text>
          </View>

          <View style={styles.form}>
            <AppTextInput
              label="New password"
              placeholder="At least 8 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
            />

            <AppTextInput
              label="Confirm new password"
              placeholder="Enter your new password again"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={handleResetPassword}
            />

            <Text style={styles.helperText}>
              Use at least 8 characters. Avoid reusing a password from another
              account.
            </Text>

            <PrimaryButton
              title="Reset password"
              onPress={handleResetPassword}
              style={styles.submitButton}
            />

            <Pressable
              accessibilityRole="link"
              onPress={() => router.replace('/login')}
              style={styles.loginButton}
            >
              <Text style={styles.loginLink}>Return to log in</Text>
            </Pressable>
          </View>

          <Text style={styles.footerNote}>
            Your health information belongs to you.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
  },
  backLink: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  brandRow: {
    height: 48,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  brandLogo: {
    width: 106,
    height: 48,
    marginLeft: -20,
  },
  illustration: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIcon: {
    color: colors.primary,
    fontSize: 48,
    fontWeight: '600',
  },
  checkBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  heading: {
    marginBottom: spacing.xl,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.8,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '700',
    letterSpacing: -0.7,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.body,
    lineHeight: 23,
    marginTop: spacing.md,
  },
  form: {
    gap: spacing.lg,
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: -spacing.sm,
  },
  submitButton: {
    marginTop: spacing.sm,
  },
  loginButton: {
    alignSelf: 'center',
    padding: spacing.sm,
  },
  loginLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  footerNote: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 'auto',
    paddingTop: spacing.xxl,
  },
});
