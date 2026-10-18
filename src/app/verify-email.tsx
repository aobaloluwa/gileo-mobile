
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiRequest } from '../services/api';
import { colors, spacing, typography } from '../theme';

const RESEND_COOLDOWN = 60;

type MessageResponse = {
  message: string;
};

export default function VerifyEmailScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const email = typeof params.email === 'string' ? params.email : '';

  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const backScale = useRef(new Animated.Value(1)).current;
  const codeInput = useRef<TextInput>(null);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setTimeout(() => {
      setCountdown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

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

  const handleVerify = async () => {
    if (isVerifying || isResending) return;

    Keyboard.dismiss();
    setErrorMessage('');
    setInfoMessage('');

    if (!email.trim()) {
      setErrorMessage('Your email address is missing. Please return to registration.');
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      setErrorMessage('Enter the six-digit code from your email.');
      return;
    }

    setIsVerifying(true);

    try {
      const result = await apiRequest<MessageResponse>('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code,
        }),
      });

      setInfoMessage(result.message || 'Email verified successfully.');
      router.replace('/login');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'We could not verify your email. Please try again.',
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending || isVerifying) return;

    Keyboard.dismiss();
    setErrorMessage('');
    setInfoMessage('');

    if (!email.trim()) {
      setErrorMessage('Your email address is missing. Please return to registration.');
      return;
    }

    setIsResending(true);

    try {
      const result = await apiRequest<MessageResponse>(
        '/auth/resend-verification',
        {
          method: 'POST',
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
          }),
        },
      );

      setInfoMessage(
        result.message ||
          'If your account needs verification, a new code will be sent.',
      );
      setCountdown(RESEND_COOLDOWN);
      setCode('');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'We could not request a new code. Please try again.',
      );
    } finally {
      setIsResending(false);
    }
  };

  const formattedEmail = email.trim() || 'your registered email address';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
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

          <View style={styles.header}>
            <View style={styles.logoMark}>
              <FontAwesome name="heart" size={17} color="#FFFFFF" />
            </View>
            <Text style={styles.brand}>vitaltron</Text>
            <Text style={styles.tagline}>Your health, your hands.</Text>
          </View>

          <View style={styles.illustration}>
            <View style={styles.outerCircle}>
              <View style={styles.innerCircle}>
                <Ionicons
                  name="mail-open-outline"
                  size={42}
                  color={colors.primary}
                />
              </View>
              <View style={styles.checkBadge}>
                <Ionicons name="checkmark" size={17} color="#FFFFFF" />
              </View>
            </View>
          </View>

          <View style={styles.content}>
            <Text style={styles.eyebrow}>ONE LAST STEP</Text>
            <Text style={styles.title}>Verify your email.</Text>
            <Text style={styles.description}>
              We've sent a six-digit verification code to the email address
              below. Enter it to confirm your account.
            </Text>

            <View style={styles.emailCard}>
              <Ionicons
                name="mail-outline"
                size={19}
                color={colors.primary}
              />
              <Text style={styles.emailText}>{formattedEmail}</Text>
            </View>

            <Text style={styles.fieldLabel}>VERIFICATION CODE</Text>
            <Pressable
              style={styles.codeContainer}
              onPress={() => codeInput.current?.focus()}
              accessibilityRole="button"
              accessibilityLabel="Enter six-digit verification code"
            >
              {Array.from({ length: 6 }, (_, index) => (
                <View
                  key={index}
                  style={[
                    styles.codeCell,
                    code.length === index && styles.codeCellActive,
                  ]}
                >
                  <Text style={styles.codeDigit}>{code[index] || ''}</Text>
                </View>
              ))}
              <TextInput
                ref={codeInput}
                value={code}
                onChangeText={(value) => {
                  setCode(value.replace(/\D/g, '').slice(0, 6));
                  setErrorMessage('');
                  setInfoMessage('');
                }}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                maxLength={6}
                caretHidden
                style={styles.hiddenCodeInput}
                accessibilityLabel="Six-digit verification code"
              />
            </Pressable>

            <Text style={styles.helpText}>
              Check your inbox and spam folder. The code expires after a limited
              time.
            </Text>

            {errorMessage ? (
              <View style={styles.messageBoxError} accessibilityRole="alert">
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color={colors.error}
                />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {infoMessage && !errorMessage ? (
              <View style={styles.messageBoxInfo}>
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={colors.textSecondary}
                />
                <Text style={styles.infoText}>{infoMessage}</Text>
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={isVerifying || isResending || code.length !== 6}
              onPress={handleVerify}
              style={({ pressed }) => [
                styles.verifyButton,
                pressed && styles.verifyButtonPressed,
                (isVerifying || isResending || code.length !== 6) &&
                  styles.buttonDisabled,
              ]}
            >
              {isVerifying ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.verifyButtonText}>Verify email</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color="#FFFFFF"
                  />
                </>
              )}
            </Pressable>

            <View style={styles.resendRow}>
              <Text style={styles.resendPrompt}>Didn't receive a code?</Text>
              <Pressable
                accessibilityRole="button"
                disabled={countdown > 0 || isResending || isVerifying}
                onPress={handleResend}
                hitSlop={8}
              >
                <Text
                  style={[
                    styles.resendLink,
                    (countdown > 0 || isResending || isVerifying) &&
                      styles.resendLinkDisabled,
                  ]}
                >
                  {isResending
                    ? 'Sending...'
                    : countdown > 0
                      ? `Resend in ${countdown}s`
                      : 'Resend code'}
                </Text>
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace('/register')}
              style={styles.changeEmailButton}
            >
              <Ionicons
                name="pencil-outline"
                size={15}
                color={colors.textSecondary}
              />
              <Text style={styles.changeEmailText}>Change email address</Text>
            </Pressable>

            <View style={styles.loginDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ALREADY VERIFIED?</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              accessibilityRole="link"
              onPress={() => router.replace('/login')}
              style={styles.loginButton}
            >
              <Text style={styles.loginText}>Continue to login</Text>
              <Ionicons
                name="arrow-forward"
                size={16}
                color={colors.primary}
              />
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Ionicons
              name="shield-checkmark-outline"
              size={15}
              color={colors.textSecondary}
            />
            <Text style={styles.footerText}>
              Your health information deserves privacy.
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
  scrollContent: {
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
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  brand: {
    color: colors.text,
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.7,
  },
  tagline: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontFamily: 'Inter_400Regular',
    marginTop: 3,
  },
  illustration: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  outerCircle: {
    width: 126,
    height: 126,
    borderRadius: 63,
    backgroundColor: '#F3F0E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  checkBadge: {
    position: 'absolute',
    right: 3,
    bottom: 6,
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  content: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  eyebrow: {
    color: '#8A7045',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.8,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 29,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.9,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    color: colors.textSecondary,
    fontSize: typography.body,
    fontFamily: 'Inter_400Regular',
    lineHeight: 23,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emailCard: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: '#F8F8F6',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    marginBottom: spacing.xl,
  },
  emailText: {
    flexShrink: 1,
    color: colors.text,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.2,
    marginBottom: spacing.md,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    position: 'relative',
    marginBottom: spacing.md,
  },
  codeCell: {
    flex: 1,
    height: 56,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FAFAF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeCellActive: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
  },
  codeDigit: {
    color: colors.text,
    fontSize: 22,
    fontFamily: 'Inter_600SemiBold',
  },
  hiddenCodeInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.02,
    color: 'transparent',
  },
  helpText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 19,
    marginBottom: spacing.lg,
  },
  messageBoxError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#F1CECE',
    backgroundColor: '#FFF7F7',
    marginBottom: spacing.md,
  },
  errorText: {
    flex: 1,
    color: colors.error,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    lineHeight: 18,
  },
  messageBoxInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#F8F8F6',
    marginBottom: spacing.md,
  },
  infoText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
  verifyButton: {
    minHeight: 54,
    borderRadius: 999,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  verifyButtonPressed: {
    backgroundColor: '#333333',
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  resendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  resendPrompt: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  resendLink: {
    color: colors.text,
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  resendLinkDisabled: {
    color: colors.placeholder,
  },
  changeEmailButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
  },
  changeEmailText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  loginDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textSecondary,
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  loginText: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: 'auto',
    paddingTop: spacing.xxl,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
});
