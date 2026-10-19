import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import PrimaryButton from '../components/ui/PrimaryButton';
import { apiRequest } from '../services/api';
import { colors, spacing } from '../theme';

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
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const codeInput = useRef<TextInput>(null);

  useEffect(() => {
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
          {/* Top Header */}
          <View style={styles.topRow}>
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

            <Image
              source={require('../../assets/gileo-logo.png')}
              style={styles.brandLogo}
              resizeMode="contain"
              accessibilityLabel="Gileo Medicals"
            />
          </View>

          {/* Animated Main Section */}
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
              <Text style={styles.title}>Verify your email</Text>
              <Text style={styles.subtitle}>
                We've sent a six-digit code to confirm your email address.
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.emailBadge}>
                <Ionicons name="mail-outline" size={16} color="#64748B" />
                <Text style={styles.emailBadgeText}>{formattedEmail}</Text>
                <Pressable
                  onPress={() => router.replace('/register')}
                  hitSlop={8}
                >
                  <Ionicons name="pencil-outline" size={15} color="#0F172A" />
                </Pressable>
              </View>

              <Text style={styles.codeLabel}>6-DIGIT CODE</Text>
              <Pressable
                style={styles.codeContainer}
                onPress={() => codeInput.current?.focus()}
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
                  maxLength={6}
                  caretHidden
                  style={styles.hiddenCodeInput}
                />
              </Pressable>

              <View style={styles.resendRow}>
                <Text style={styles.resendPrompt}>Didn't receive a code?</Text>
                <Pressable
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

              {infoMessage && !errorMessage ? (
                <View style={styles.infoBox}>
                  <Ionicons
                    name="information-circle-outline"
                    size={18}
                    color="#0F172A"
                  />
                  <Text style={styles.infoText}>{infoMessage}</Text>
                </View>
              ) : null}

              <PrimaryButton
                title="Verify email"
                onPress={handleVerify}
                loading={isVerifying}
                disabled={isVerifying || code.length !== 6}
                style={styles.verifyButton}
              />

              <View style={styles.loginRow}>
                <Text style={styles.loginPrompt}>Already verified?</Text>
                <Pressable
                  onPress={() => router.replace('/login')}
                  accessibilityRole="link"
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
  scrollContent: {
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
  emailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emailBadgeText: {
    flex: 1,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '500',
  },
  codeLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: -8,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    position: 'relative',
  },
  codeCell: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeCellActive: {
    borderColor: '#0F172A',
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
  },
  codeDigit: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '700',
  },
  hiddenCodeInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.01,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 4,
  },
  resendPrompt: {
    color: '#64748B',
    fontSize: 13,
  },
  resendLink: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  resendLinkDisabled: {
    color: '#94A3B8',
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FAFAFA',
  },
  infoText: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
    lineHeight: 18,
  },
  verifyButton: {
    marginTop: 4,
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
    paddingTop: spacing.xxl,
  },
  footerNote: {
    color: '#64748B',
    fontSize: 12,
  },
});
