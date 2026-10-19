
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
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
import { colors, spacing, typography } from '../theme';

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
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

      await storeAuthSession({ accessToken: response.accessToken, refreshToken: response.refreshToken, user: response.user ? { id: response.user.id ?? '', email: response.user.email ?? cleanEmail, displayName: null } : null });
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

      // A null token means the user cancelled Google Sign-In.
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
            <Image
              source={require('../assets/gileo-logo.png')}
              style={styles.brandLogo}
              resizeMode="contain"
              accessibilityLabel="Gileo Medicals"
            />
          </View>

          <View style={styles.heading}>
            <Text style={styles.eyebrow}>GILEO MEDICALS GLOBAL LIMITED</Text>
            <Text style={styles.title}>Welcome back.</Text>
            <Text style={styles.subtitle}>
              Sign in securely to access your healthcare services, medical orders, nursing community, and learning library.
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
                secureTextEntry={!showPassword}
                autoComplete="current-password"
                textContentType="password"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
            </View>

            <Pressable
              onPress={() => router.push('/forgot-password')}
              style={styles.forgotButton}
              accessibilityRole="link"
              hitSlop={8}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>

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
                <Text style={styles.registerLink}>Sign up</Text>
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
    backgroundColor: '#FFFFFF',
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
    height: 48,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  brandLogo: {
    width: 106,
    height: 48,
    marginLeft: -20,
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
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: -spacing.sm,
  },
  forgotText: {
    color: colors.primary,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
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
  loginButton: {
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
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  registerPrompt: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  registerLink: {
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
