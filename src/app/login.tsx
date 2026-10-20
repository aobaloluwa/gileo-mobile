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

      await storeAuthSession({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        user: response.user
          ? {
              id: response.user.id ?? '',
              email: response.user.email ?? cleanEmail,
              displayName: null,
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
          {/* Top Row Header */}
          <View style={styles.topRow}>
            {canGoBack ? (
              <Animated.View style={{ transform: [{ scale: backScale }] }}>
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

          {/* Animated Heading & Form */}
          <Animated.View
            style={[
              styles.animatedContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.heading}>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>
                Sign in to manage your health, community, and services.
              </Text>
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
                    color={colors.error}
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
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.divider} />
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Continue with Google"
                onPress={handleGoogleSignIn}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.googleButton,
                  pressed && styles.googleButtonPressed,
                  isLoading && styles.disabledButton,
                ]}
              >
                <FontAwesome name="google" size={18} color="#4285F4" />
                <Text style={styles.googleLabel}>
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
                  <Text style={styles.registerLink}> Signup</Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>

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
  animatedContainer: {
    flex: 1,
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
    color: colors.error,
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
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  googleButton: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.lg,
  },
  googleButtonPressed: {
    backgroundColor: '#F8FAFC',
    transform: [{ scale: 0.985 }],
  },
  disabledButton: {
    opacity: 0.6,
  },
  googleLabel: {
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
    paddingTop: spacing.xxl,
  },
  footerNote: {
    color: '#64748B',
    fontSize: 12,
  },
});
