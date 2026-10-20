import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { colors, spacing } from '../theme';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ token?: string }>();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    try {
      setCanGoBack(router.canGoBack());
    } catch {
      setCanGoBack(false);
    }
  }, []);

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
          {/* Top Row Header */}
          <View style={styles.topRow}>
            {canGoBack ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                onPress={() => {
                  Keyboard.dismiss();
                  try {
                    if (router.canGoBack()) {
                      router.back();
                    } else {
                      router.replace('/login');
                    }
                  } catch {
                    router.replace('/login');
                  }
                }}
                hitSlop={8}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={20} color={colors.text} />
              </Pressable>
            ) : (
              <View style={{ width: 42, height: 42 }} />
            )}

            <Image
              source={require('../../assets/gileo-logo.png')}
              style={styles.brandLogo}
              resizeMode="contain"
              accessibilityLabel="Gileo Medicals"
            />
          </View>

          <View style={styles.heading}>
            <Text style={styles.title}>Create a new password</Text>
            <Text style={styles.subtitle}>
              Choose a strong password to help keep your Gileo account secure.
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

            <PrimaryButton
              title="Reset password"
              onPress={handleResetPassword}
              style={styles.submitButton}
            />

            <View style={styles.loginRow}>
              <Pressable
                accessibilityRole="link"
                onPress={() => router.replace('/login')}
                hitSlop={8}
              >
                <Text style={styles.loginLink}>Return to log in</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.footer}>
            <Ionicons
              name="shield-checkmark-outline"
              size={15}
              color={colors.textSecondary}
            />
            <Text style={styles.footerNote}>
              Your health information is safely secured.
            </Text>
          </View>
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  brandLogo: {
    width: 120,
    height: 40,
    marginRight: -10,
  },
  heading: {
    marginBottom: spacing.xl,
  },
  title: {
    color: '#0F172A',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 6,
    maxWidth: 340,
  },
  form: {
    gap: spacing.lg,
  },
  submitButton: {
    marginTop: 4,
  },
  loginRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  loginLink: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 'auto',
    paddingTop: spacing.xxl,
  },
  footerNote: {
    color: '#64748B',
    fontSize: 12,
  },
});
