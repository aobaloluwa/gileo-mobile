import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
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
import { apiRequest } from '../services/api';
import { signInWithGoogleIdToken } from '../services/auth';
import { colors, spacing } from '../theme';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [canGoBack, setCanGoBack] = useState(false);

  const backScale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    try {
      setCanGoBack(router.canGoBack());
    } catch {
      setCanGoBack(false);
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

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
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/welcome');
      }
    } catch {
      router.replace('/welcome');
    }
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
      const googleSignIn = await import('../services/googleSignIn');

      await googleSignIn.configureGoogleSignIn();

      const idToken = await googleSignIn.signInWithGoogle();

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
          {/* Top Header with Close Button */}
          <View style={styles.topRow}>
            {canGoBack ? (
              <Animated.View style={{ transform: [{ scale: backScale }] }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  onPress={handleBack}
                  onPressIn={() => animateBack(0.92)}
                  onPressOut={() => animateBack(1)}
                  hitSlop={8}
                  style={styles.closeButton}
                >
                  <Ionicons name="arrow-back" size={20} color="#0F172A" />
                </Pressable>
              </Animated.View>
            ) : (
              <View style={{ width: 42, height: 42 }} />
            )}
          </View>

          {/* Animated Centered Brand & Form */}
          <Animated.View
            style={[
              styles.animatedContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Centered Brand Logo (Positioned Lower & Slightly Bigger) */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/gileo-logo.png')}
                style={styles.brandLogo}
                resizeMode="contain"
                accessibilityLabel="Gileo Medicals"
              />
            </View>

            {/* Segmented Control Pill Bar Directly Below Logo */}
            <View style={styles.segmentedContainer}>
              <View style={styles.segmentedBar}>
                <Pressable
                  style={styles.segmentItem}
                  onPress={() => router.push('/login')}
                >
                  <Text style={styles.segmentInactiveText}>Log in</Text>
                </Pressable>
                <Pressable style={[styles.segmentItem, styles.segmentActive]}>
                  <Text style={styles.segmentActiveText}>Sign up</Text>
                </Pressable>
              </View>
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

              <AppTextInput
                label="Password"
                placeholder="At least 12 characters"
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  setErrorMessage('');
                }}
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />

              <AppTextInput
                label="Confirm password"
                placeholder="Enter your password again"
                value={confirmPassword}
                onChangeText={(value) => {
                  setConfirmPassword(value);
                  setErrorMessage('');
                }}
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />

              {errorMessage ? (
                <View style={styles.errorBox} accessibilityRole="alert">
                  <Ionicons
                    name="alert-circle-outline"
                    size={18}
                    color="#EF4444"
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
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.divider} />
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Continue with Google"
                disabled={isSubmitting}
                onPress={handleGoogleSignUp}
                style={({ pressed }) => [
                  styles.socialButton,
                  pressed && styles.socialButtonPressed,
                  isSubmitting && styles.disabledButton,
                ]}
              >
                <FontAwesome name="google" size={18} color="#4285F4" />
                <Text style={styles.socialLabel}>
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
                  <Text style={styles.loginLink}> Log in</Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>

          <View style={styles.footer}>
            <Ionicons
              name="shield-checkmark-outline"
              size={15}
              color="#64748B"
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
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EAECEF',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    marginBottom: 24,
  },
  brandLogo: {
    width: 160,
    height: 54,
  },
  animatedContainer: {
    flex: 1,
  },
  segmentedContainer: {
    marginBottom: 24,
  },
  segmentedBar: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 999,
    backgroundColor: '#F8F9FA',
    padding: 4,
    borderWidth: 1,
    borderColor: '#EAECEF',
  },
  segmentItem: {
    flex: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  segmentActiveText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  segmentInactiveText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    gap: spacing.lg,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECDD3',
    backgroundColor: '#FFF1F2',
  },
  errorText: {
    flex: 1,
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  submitButton: {
    marginTop: 4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: 4,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#EAECEF',
  },
  dividerText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  socialButton: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#EAECEF',
    borderRadius: 999,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: spacing.lg,
  },
  socialButtonPressed: {
    backgroundColor: '#FFFFFF',
    transform: [{ scale: 0.985 }],
  },
  disabledButton: {
    opacity: 0.6,
  },
  socialLabel: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 4,
  },
  loginPrompt: {
    color: '#64748B',
    fontSize: 13,
  },
  loginLink: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 'auto',
    paddingTop: spacing.xl,
  },
  footerNote: {
    color: '#64748B',
    fontSize: 12,
  },
});
