import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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

import AppTextInput from '../components/ui/AppTextInput';
import PrimaryButton from '../components/ui/PrimaryButton';
import { apiRequest } from '../services/api';
import { colors, spacing } from '../theme';

type MessageResponse = {
  message?: string;
};

type Stage = 'email' | 'code' | 'password';

const RESEND_COOLDOWN = 60;

export default function ForgotPasswordScreen() {
  const [stage, setStage] = useState<Stage>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [countdown, setCountdown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [canGoBack, setCanGoBack] = useState(false);

  const backScale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const codeInput = useRef<TextInput>(null);

  useEffect(() => {
    try {
      setCanGoBack(router.canGoBack());
    } catch {
      setCanGoBack(false);
    }

    fadeAnim.setValue(0);
    slideAnim.setValue(16);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [stage, fadeAnim, slideAnim]);

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

  const clearMessages = () => {
    setErrorMessage('');
    setInfoMessage('');
  };

  const handleBack = () => {
    Keyboard.dismiss();

    if (stage === 'password') {
      setStage('code');
      clearMessages();
      return;
    }

    if (stage === 'code') {
      setStage('email');
      clearMessages();
      return;
    }

    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/login');
      }
    } catch {
      router.replace('/login');
    }
  };

  const handleRequestCode = async () => {
    if (isSubmitting) return;

    Keyboard.dismiss();
    clearMessages();

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setErrorMessage('Enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await apiRequest<MessageResponse>(
        '/auth/forgot-password',
        {
          method: 'POST',
          body: JSON.stringify({ email: normalizedEmail }),
        },
      );

      setEmail(normalizedEmail);
      setCode('');
      setStage('code');
      setCountdown(RESEND_COOLDOWN);
      setInfoMessage(
        result?.message ||
          'If an account exists, a password reset code has been sent.',
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'We could not request a reset code. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = () => {
    Keyboard.dismiss();
    clearMessages();

    if (!/^\d{6}$/.test(code)) {
      setErrorMessage('Enter the six-digit code sent to your email.');
      return;
    }

    setStage('password');
  };

  const handleResetPassword = async () => {
    if (isSubmitting) return;

    Keyboard.dismiss();
    clearMessages();

    if (!/^\d{6}$/.test(code)) {
      setStage('code');
      setErrorMessage('Enter the six-digit code sent to your email.');
      return;
    }

    if (newPassword.length < 12) {
      setErrorMessage('Your new password must contain at least 12 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Your passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await apiRequest<MessageResponse>(
        '/auth/reset-password',
        {
          method: 'POST',
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            code,
            newPassword,
          }),
        },
      );

      setInfoMessage(
        result?.message || 'Password reset successfully. Please log in with your new password.',
      );
      router.replace('/login');
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'We could not reset your password. Check your code and try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (isSubmitting || countdown > 0) return;

    Keyboard.dismiss();
    clearMessages();
    setIsSubmitting(true);

    try {
      const result = await apiRequest<MessageResponse>(
        '/auth/forgot-password',
        {
          method: 'POST',
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
          }),
        },
      );

      setCode('');
      setCountdown(RESEND_COOLDOWN);
      setInfoMessage(
        result?.message ||
          'A new password reset code has been sent to your email.',
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'We could not send another code. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const title =
    stage === 'email'
      ? 'Forgot password?'
      : stage === 'code'
        ? 'Check your email'
        : 'New password';

  const description =
    stage === 'email'
      ? 'Enter your email address and we’ll send you a 6-digit code to reset your password.'
      : stage === 'code'
        ? 'Enter the 6-digit verification code sent to your email.'
        : 'Choose a new password for your account (at least 12 characters).';

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
          {/* Top Row Header with Close Button */}
          <View style={styles.topRow}>
            {(stage !== 'email' || canGoBack) ? (
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

          {/* Animated Main Content */}
          <Animated.View
            style={[
              styles.animatedContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Centered Brand Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/gileo-logo.png')}
                style={styles.brandLogo}
                resizeMode="contain"
                accessibilityLabel="Gileo Medicals"
              />
            </View>

            <Text style={styles.centeredTitle}>{title}</Text>

            {/* Step indicators */}
            <View style={styles.progressRow}>
              {(['email', 'code', 'password'] as Stage[]).map((item, index) => {
                const activeIndex = stage === 'email' ? 0 : stage === 'code' ? 1 : 2;
                return (
                  <View
                    key={item}
                    style={[
                      styles.progressDot,
                      index <= activeIndex && styles.progressDotActive,
                    ]}
                  />
                );
              })}
            </View>

            <View style={styles.heading}>
              <Text style={styles.subtitle}>{description}</Text>
            </View>

            <View style={styles.form}>
              {stage === 'email' ? (
                <AppTextInput
                  label="Email address"
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    clearMessages();
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  returnKeyType="done"
                  onSubmitEditing={handleRequestCode}
                />
              ) : stage === 'code' ? (
                <>
                  <View style={styles.emailBadge}>
                    <Ionicons name="mail-outline" size={16} color="#64748B" />
                    <Text style={styles.emailBadgeText}>{email}</Text>
                    <Pressable
                      onPress={() => {
                        setStage('email');
                        clearMessages();
                      }}
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
                      onChangeText={(val) => {
                        setCode(val.replace(/\D/g, '').slice(0, 6));
                        clearMessages();
                      }}
                      keyboardType="number-pad"
                      maxLength={6}
                      caretHidden
                      style={styles.hiddenCodeInput}
                    />
                  </Pressable>

                  <View style={styles.resendRow}>
                    <Text style={styles.resendPrompt}>Didn't receive code?</Text>
                    <Pressable
                      disabled={countdown > 0 || isSubmitting}
                      onPress={handleResendCode}
                      hitSlop={8}
                    >
                      <Text
                        style={[
                          styles.resendLink,
                          (countdown > 0 || isSubmitting) && styles.resendLinkDisabled,
                        ]}
                      >
                        {isSubmitting
                          ? 'Sending...'
                          : countdown > 0
                            ? `Resend in ${countdown}s`
                            : 'Resend code'}
                      </Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <>
                  <AppTextInput
                    label="New password"
                    placeholder="At least 12 characters"
                    value={newPassword}
                    onChangeText={(val) => {
                      setNewPassword(val);
                      clearMessages();
                    }}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="new-password"
                    returnKeyType="next"
                  />

                  <AppTextInput
                    label="Confirm new password"
                    placeholder="Enter your password again"
                    value={confirmPassword}
                    onChangeText={(val) => {
                      setConfirmPassword(val);
                      clearMessages();
                    }}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="new-password"
                    returnKeyType="done"
                    onSubmitEditing={handleResetPassword}
                  />
                </>
              )}

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
                title={
                  stage === 'email'
                    ? 'Send reset code'
                    : stage === 'code'
                      ? 'Continue'
                      : 'Reset password'
                }
                onPress={
                  stage === 'email'
                    ? handleRequestCode
                    : stage === 'code'
                      ? handleVerifyCode
                      : handleResetPassword
                }
                loading={isSubmitting}
                disabled={isSubmitting}
                style={styles.actionButton}
              />

              <View style={styles.loginRow}>
                <Text style={styles.loginPrompt}>Remembered your password?</Text>
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
  scrollContent: {
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
    marginBottom: 8,
  },
  brandLogo: {
    width: 140,
    height: 48,
  },
  centeredTitle: {
    color: '#0F172A',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.6,
    marginBottom: 16,
  },
  animatedContainer: {
    flex: 1,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.lg,
  },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
  },
  progressDotActive: {
    backgroundColor: '#f90202',
  },
  heading: {
    marginBottom: spacing.lg,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
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
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EAECEF',
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
    borderColor: '#EAECEF',
    backgroundColor: '#F8F9FA',
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
    color: '#EF4444',
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
    borderColor: '#EAECEF',
    backgroundColor: '#F8F9FA',
  },
  infoText: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
    lineHeight: 18,
  },
  actionButton: {
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
    paddingTop: spacing.xl,
  },
  footerNote: {
    color: '#64748B',
    fontSize: 12,
  },
});
