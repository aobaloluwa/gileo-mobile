
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Animated,
  Easing,
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
import { apiRequest } from '../services/api';
import { signInWithGoogleIdToken } from '../services/auth';
import { colors, spacing, typography } from '../theme';

type RegisterResponse = {
  message: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    createdAt: string;
  };
  requiresEmailVerification: boolean;
};

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const backScale = useRef(new Animated.Value(1)).current;

  const animateBack = (toValue: number) => {
    Animated.timing(backScale, {
      toValue,
      duration: 140,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const handleBack = () => {
    Keyboard.dismiss();
    router.back();
  };

  const handleRegister = async () => {
    if (isSubmitting) return;

    Keyboard.dismiss();
    setErrorMessage('');

    const displayName = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!displayName || !normalizedEmail || !password || !confirmPassword) {
      setErrorMessage('Please complete all fields to continue.');
      return;
    }

    if (displayName.length > 100) {
      setErrorMessage('Your name must be 100 characters or fewer.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setErrorMessage('Enter a valid email address.');
      return;
    }

    if (password.length < 12) {
      setErrorMessage('Your password must contain at least 12 characters.');
      return;
    }

    if (password.length > 128) {
      setErrorMessage('Your password must be 128 characters or fewer.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Your passwords do not match. Please check them.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await apiRequest<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          displayName,
          email: normalizedEmail,
          password,
        }),
      });

      if (result.requiresEmailVerification && result.user?.email) {
        router.replace({
          pathname: '/verify-email',
          params: { email: result.user.email },
        });
      } else {
        setErrorMessage(
          result.message ||
            'Your account was created, but verification is required.',
        );
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'We could not create your account. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (isSubmitting) return;

    Keyboard.dismiss();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      // Load Google Sign-In only when the user taps the button.
      // This avoids loading its native module when the route is opened.
      const googleSignIn = await import('../services/googleSignIn');

      await googleSignIn.configureGoogleSignIn();

      const idToken = await googleSignIn.signInWithGoogle();

      // The user may cancel the Google sign-in flow.
      if (!idToken) return;

      await signInWithGoogleIdToken(idToken);

      router.replace('/');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Google sign-in failed. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.backButtonWrapper,
              { transform: [{ scale: backScale }] },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={handleBack}
              onPressIn={() => animateBack(0.92)}
              onPressOut={() => animateBack(1)}
              hitSlop={8}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </Pressable>
          </Animated.View>

          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <FontAwesome name="heart" size={17} color="#FFFFFF" />
            </View>
            <Text style={styles.brandName}>vitaltron</Text>
          </View>

          <View style={styles.heading}>
            <Text style={styles.eyebrow}>YOUR HEALTH, YOUR STORY</Text>
            <Text style={styles.title}>Create your account.</Text>
            <Text style={styles.subtitle}>
              One secure place for your health information, wherever life takes
              you.
            </Text>
          </View>

          <View style={styles.form}>
            <AppTextInput
              label="Full name"
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={(value) => {
                setFullName(value);
                setErrorMessage('');
              }}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
            />

            <AppTextInput
              label="Email address"
              placeholder="you@example.com"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setErrorMessage('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
            />

            <View style={styles.passwordGroup}>
              <AppTextInput
                label="Password"
                placeholder="At least 12 characters"
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  setErrorMessage('');
                }}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
                textContentType="newPassword"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <View style={styles.passwordGroup}>
              <AppTextInput
                label="Confirm password"
                placeholder="Enter your password again"
                value={confirmPassword}
                onChangeText={(value) => {
                  setConfirmPassword(value);
                  setErrorMessage('');
                }}
                secureTextEntry={!showConfirmPassword}
                autoComplete="new-password"
                textContentType="newPassword"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
            </View>

            <Text style={styles.helperText}>
              Use 12–128 characters. Choose a password you don't use elsewhere.
            </Text>

            {errorMessage ? (
              <View style={styles.errorBox} accessibilityRole="alert">
                <Ionicons
                  name="alert-circle-outline"
                  size={19}
                  color={colors.error}
                />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <PrimaryButton
              title="Create account"
              onPress={handleRegister}
              loading={isSubmitting}
              disabled={isSubmitting}
              style={styles.submitButton}
            />

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continue with Google"
              disabled={isSubmitting}
              onPress={handleGoogleSignUp}
              style={({ pressed }) => [
                styles.googleButton,
                pressed && styles.googleButtonPressed,
                isSubmitting && styles.disabledButton,
              ]}
            >
              <FontAwesome name="google" size={18} color="#4285F4" />
              <Text style={styles.googleLabel}>
                {isSubmitting ? 'Please wait…' : 'Continue with Google'}
              </Text>
            </Pressable>

            <View style={styles.loginRow}>
              <Text style={styles.loginPrompt}>Already have an account?</Text>
              <Pressable
                accessibilityRole="link"
                onPress={() => router.push('/login')}
                hitSlop={8}
              >
                <Text style={styles.loginLink}>Log in</Text>
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
              Your health information belongs to you.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  backButtonWrapper: {
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F2',
    borderWidth: 1,
    borderColor: '#EBEBE8',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    color: colors.text,
    fontSize: 21,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.7,
  },
  heading: {
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
  eyebrow: {
    color: '#8A7045',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.8,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 29,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -1,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.body,
    fontFamily: 'Inter_400Regular',
    lineHeight: 23,
    marginTop: spacing.sm,
    maxWidth: 360,
  },
  form: {
    gap: spacing.lg,
  },
  passwordGroup: {
    gap: spacing.xs,
  },
  passwordToggle: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  passwordToggleText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  helperText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
    marginTop: -spacing.sm,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1CECE',
    backgroundColor: '#FFF7F7',
  },
  errorText: {
    flex: 1,
    color: colors.error,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    lineHeight: 19,
  },
  submitButton: {
    marginTop: spacing.xs,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.2,
  },
  googleButton: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  googleButtonPressed: {
    backgroundColor: '#F7F7F5',
    transform: [{ scale: 0.99 }],
  },
  disabledButton: {
    opacity: 0.6,
  },
  googleLabel: {
    color: colors.text,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  loginPrompt: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  loginLink: {
    color: colors.text,
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    padding: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: 'auto',
    paddingTop: spacing.xxl,
  },
  footerNote: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
});
