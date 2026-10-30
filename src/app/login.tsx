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
import { signInWithGoogleIdToken, storeAuthSession } from '../services/auth';
import { colors, spacing } from '../theme';

type LoginResponse = {
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id?: string;
    email?: string;
    emailVerified?: boolean;
  };
  message?: string | string[];
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  const handleLogin = async () => {
    if (isLoading) return;

    Keyboard.dismiss();
    setErrorMessage('');

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setErrorMessage('Please enter your email address and password.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage('Enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: cleanEmail,
          password,
        }),
      });

      if (!response.accessToken || !response.refreshToken) {
        throw new Error('The server returned an unexpected login response.');
      }

      const userRole = (response.user as any)?.role;
      await storeAuthSession({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        user: response.user
          ? {
              id: response.user.id ?? '',
              email: response.user.email ?? cleanEmail,
              displayName: (response.user as any).displayName ?? null,
              role: userRole as any,
            }
          : null,
      });

      router.replace('/(tabs)');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to log in. Please check your details and try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isLoading) return;

    Keyboard.dismiss();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const googleSignIn = await import('../services/googleSignIn');

      await googleSignIn.configureGoogleSignIn();

      const idToken = await googleSignIn.signInWithGoogle();

      if (!idToken) return;

      await signInWithGoogleIdToken(idToken);

      router.replace('/(tabs)');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Google sign-in failed. Please try again.',
      );
    } finally {
      setIsLoading(false);
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
          {/* Top Row Header with Close Button */}
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
                <Pressable style={[styles.segmentItem, styles.segmentActive]}>
                  <Text style={styles.segmentActiveText}>Log in</Text>
                </Pressable>
                <Pressable
                  style={styles.segmentItem}
                  onPress={() => router.push('/register')}
                >
                  <Text style={styles.segmentInactiveText}>Sign up</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.form}>
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
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    setErrorMessage('');
                  }}
                  secureTextEntry
                  autoComplete="current-password"
                  textContentType="password"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />

                <Pressable
                  onPress={() => router.push('/forgot-password')}
                  style={styles.forgotButton}
                  accessibilityRole="link"
                  hitSlop={8}
                >
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </Pressable>
              </View>

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
                title="Log in"
                onPress={handleLogin}
                loading={isLoading}
                disabled={isLoading}
                style={styles.loginButton}
              />

              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.divider} />
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Continue with Google"
                onPress={handleGoogleSignIn}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.socialButton,
                  pressed && styles.socialButtonPressed,
                  isLoading && styles.disabledButton,
                ]}
              >
                <FontAwesome name="google" size={18} color="#4285F4" />
                <Text style={styles.socialLabel}>
                  {isLoading ? 'Please wait…' : 'Continue with Google'}
                </Text>
              </Pressable>

              <View style={styles.registerRow}>
                <Text style={styles.registerPrompt}>
                  Don't have an account?
                </Text>
                <Pressable
                  onPress={() => router.push('/register')}
                  accessibilityRole="link"
                  hitSlop={8}
                >
                  <Text style={styles.registerLink}> Sign up</Text>
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
  passwordGroup: {
    gap: 8,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  forgotText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
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
  loginButton: {
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
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 4,
  },
  registerPrompt: {
    color: '#64748B',
    fontSize: 13,
  },
  registerLink: {
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
