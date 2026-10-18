import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [countdown, setCountdown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

    router.back();
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
          'If an eligible account exists, a password-reset code will be sent.',
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

    if (newPassword.length > 128) {
      setErrorMessage('Your password must be 128 characters or fewer.');
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
          'If an eligible account exists, a password-reset code will be sent.',
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
      ? 'Reset your password.'
      : stage === 'code'
        ? 'Check your email.'
        : 'Create a new password.';

  const description =
    stage === 'email'
      ? 'Enter the email address linked to your Vitaltron account. We’ll send you a code to reset your password.'
      : stage === 'code'
        ? 'Enter the six-digit password-reset code sent to your email address.'
        : 'Choose a strong password you have not used for your Vitaltron account before.';

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
                  name={
                    stage === 'email'
                      ? 'lock-closed-outline'
                      : stage === 'code'
                        ? 'mail-open-outline'
                        : 'shield-checkmark-outline'
                  }
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
            <Text style={styles.eyebrow}>ACCOUNT RECOVERY</Text>
            <View style={styles.progressRow} accessibilityLabel={`Step ${stage === 'email' ? 1 : stage === 'code' ? 2 : 3} of 3`}>
              {(['email', 'code', 'password'] as Stage[]).map((item, index) => {
                const activeIndex = stage === 'email' ? 0 : stage === 'code' ? 1 : 2;
                return (
                  <View
                    key={item}
                    style={[
                      styles.progressSegment,
                      index <= activeIndex && styles.progressSegmentActive,
                    ]}
                  />
                );
              })}
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>

            {stage === 'email' ? (
              <>
                <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                <TextInput
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    clearMessages();
                  }}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="done"
                  onSubmitEditing={handleRequestCode}
                  editable={!isSubmitting}
                  style={styles.textInput}
                  accessibilityLabel="Email address"
                />

                <Text style={styles.helpText}>
                  For your security, we’ll only send a reset code if the
                  account is eligible.
                </Text>
              </>
            ) : (
              <>
                <View style={styles.emailCard}>
                  <Ionicons
                    name="mail-outline"
                    size={19}
                    color={colors.primary}
                  />
                  <Text style={styles.emailText}>{email}</Text>
                  {stage === 'code' && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Change email address"
                      onPress={() => {
                        setStage('email');
                        clearMessages();
                      }}
                    >
                      <Ionicons
                        name="pencil-outline"
                        size={17}
                        color={colors.primary}
                      />
                    </Pressable>
                  )}
                </View>

                {stage === 'code' ? (
                  <>
                    <Text style={styles.fieldLabel}>RESET CODE</Text>
                    <Pressable
                      style={styles.codeContainer}
                      onPress={() => codeInput.current?.focus()}
                      accessibilityRole="button"
                      accessibilityLabel="Enter six-digit password reset code"
                    >
                      {Array.from({ length: 6 }, (_, index) => (
                        <View
                          key={index}
                          style={[
                            styles.codeCell,
                            code.length === index && styles.codeCellActive,
                          ]}
                        >
                          <Text style={styles.codeDigit}>
                            {code[index] || ''}
                          </Text>
                        </View>
                      ))}
                      <TextInput
                        ref={codeInput}
                        value={code}
                        onChangeText={(value) => {
                          setCode(value.replace(/\D/g, '').slice(0, 6));
                          clearMessages();
                        }}
                        keyboardType="number-pad"
                        textContentType="oneTimeCode"
                        autoComplete="one-time-code"
                        maxLength={6}
                        caretHidden
                        style={styles.hiddenCodeInput}
                        accessibilityLabel="Six-digit password reset code"
                      />
                    </Pressable>

                    <Text style={styles.helpText}>
                      Check your inbox and spam folder. The code may expire
                      after a limited time.
                    </Text>

                    <View style={styles.resendRow}>
                      <Text style={styles.resendPrompt}>
                        Didn’t receive a code?
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        disabled={countdown > 0 || isSubmitting}
                        onPress={handleResendCode}
                        hitSlop={8}
                      >
                        <Text
                          style={[
                            styles.resendLink,
                            (countdown > 0 || isSubmitting) &&
                              styles.resendLinkDisabled,
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
                    <Text style={styles.fieldLabel}>NEW PASSWORD</Text>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        value={newPassword}
                        onChangeText={(value) => {
                          setNewPassword(value);
                          clearMessages();
                        }}
                        placeholder="At least 12 characters"
                        placeholderTextColor={colors.placeholder}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="new-password"
                        textContentType="newPassword"
                        returnKeyType="next"
                        style={styles.passwordInput}
                        accessibilityLabel="New password"
                      />
                      <Pressable
                        onPress={() => setShowPassword((value) => !value)}
                        accessibilityRole="button"
                        accessibilityLabel={
                          showPassword ? 'Hide password' : 'Show password'
                        }
                        hitSlop={8}
                      >
                        <Ionicons
                          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={21}
                          color={colors.textSecondary}
                        />
                      </Pressable>
                    </View>

                    <Text style={styles.fieldLabel}>CONFIRM NEW PASSWORD</Text>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        value={confirmPassword}
                        onChangeText={(value) => {
                          setConfirmPassword(value);
                          clearMessages();
                        }}
                        placeholder="Enter your new password again"
                        placeholderTextColor={colors.placeholder}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="new-password"
                        textContentType="newPassword"
                        returnKeyType="done"
                        onSubmitEditing={handleResetPassword}
                        style={styles.passwordInput}
                        accessibilityLabel="Confirm new password"
                      />
                      <Pressable
                        onPress={() =>
                          setShowConfirmPassword((value) => !value)
                        }
                        accessibilityRole="button"
                        accessibilityLabel={
                          showConfirmPassword
                            ? 'Hide confirmation password'
                            : 'Show confirmation password'
                        }
                        hitSlop={8}
                      >
                        <Ionicons
                          name={
                            showConfirmPassword
                              ? 'eye-off-outline'
                              : 'eye-outline'
                          }
                          size={21}
                          color={colors.textSecondary}
                        />
                      </Pressable>
                    </View>

                    <View style={styles.passwordHint}>
                      <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
                      <Text style={styles.passwordHintText}>
                        Use 12–128 characters. A unique passphrase is easier to remember and harder to guess.
                      </Text>
                    </View>
                  </>
                )}
              </>
            )}

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
              disabled={isSubmitting}
              onPress={
                stage === 'email'
                  ? handleRequestCode
                  : stage === 'code'
                    ? handleVerifyCode
                    : handleResetPassword
              }
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.primaryButtonPressed,
                isSubmitting && styles.buttonDisabled,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>
                    {stage === 'email'
                      ? 'Send reset code'
                      : stage === 'code'
                        ? 'Continue'
                        : 'Reset password'}
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color="#FFFFFF"
                  />
                </>
              )}
            </Pressable>

            <View style={styles.loginDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>REMEMBER YOUR PASSWORD?</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              accessibilityRole="link"
              onPress={() => router.replace('/login')}
              style={styles.loginButton}
            >
              <Text style={styles.loginText}>Back to login</Text>
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
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xxl,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#E8E5DE',
  },
  progressSegmentActive: {
    backgroundColor: colors.primary,
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
  fieldLabel: {
    color: colors.text,
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.2,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  textInput: {
    minHeight: 54,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FAFAF8',
    paddingHorizontal: spacing.lg,
    color: colors.text,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: spacing.md,
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
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
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
  passwordContainer: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FAFAF8',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  passwordInput: {
    flex: 1,
    minHeight: 52,
    color: colors.text,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    paddingVertical: spacing.md,
    paddingRight: spacing.sm,
  },
  helpText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 19,
    marginBottom: spacing.lg,
  },
  passwordHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: 13,
    backgroundColor: '#F3F0E8',
  },
  passwordHintText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
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
  primaryButton: {
    minHeight: 54,
    borderRadius: 999,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  primaryButtonPressed: {
    backgroundColor: '#333333',
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
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
    marginTop: spacing.md,
    marginBottom: spacing.lg,
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
  loginDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
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
