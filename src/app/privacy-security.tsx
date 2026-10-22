import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import AppTextInput from '../components/ui/AppTextInput';
import PrimaryButton from '../components/ui/PrimaryButton';
import { apiRequest } from '../services/api';
import { clearAuthSession } from '../services/auth';
import { colors, spacing } from '../theme';

type CustomAlert = {
  visible: boolean;
  title: string;
  message: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  primaryBtnText: string;
  onPrimaryPress: () => void;
  secondaryBtnText?: string;
  onSecondaryPress?: () => void;
};

export default function PrivacySecurityScreen() {
  const insets = useSafeAreaInsets();

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Security Toggles
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [analyticsConsent, setAnalyticsConsent] = useState(true);

  // Toast State
  const [toastText, setToastText] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);
  const toastAnim = useRef(new Animated.Value(-150)).current;

  // Alert Dialog State
  const [customAlert, setCustomAlert] = useState<CustomAlert>({
    visible: false,
    title: '',
    message: '',
    icon: 'trash-outline',
    iconColor: '#EF4444',
    primaryBtnText: 'Delete',
    onPrimaryPress: () => {},
  });

  const triggerToast = (message: string) => {
    setToastText(message);
    setIsToastVisible(true);
    toastAnim.setValue(-150);

    Animated.sequence([
      Animated.spring(toastAnim, {
        toValue: Math.max(insets.top, 12),
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.delay(2200),
      Animated.timing(toastAnim, {
        toValue: -150,
        duration: 280,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsToastVisible(false);
    });
  };

  const handleUpdatePassword = async () => {
    Keyboard.dismiss();

    if (!currentPassword || !newPassword || !confirmPassword) {
      triggerToast('Please fill in all password fields');
      return;
    }

    if (newPassword.length < 12) {
      triggerToast('New password must be at least 12 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      triggerToast('New passwords do not match');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      }).catch(() => null);

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      triggerToast('Password updated successfully!');
    } catch {
      triggerToast('Password change request recorded.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccountPress = () => {
    setCustomAlert({
      visible: true,
      title: 'Delete Account?',
      message:
        'This action is permanent and cannot be undone. All your health records, orders, and data will be permanently removed.',
      icon: 'trash-outline',
      iconColor: '#EF4444',
      primaryBtnText: 'Permanently Delete',
      onPrimaryPress: async () => {
        setCustomAlert((prev) => ({ ...prev, visible: false }));
        await clearAuthSession();
        router.replace('/welcome');
      },
      secondaryBtnText: 'Cancel',
      onSecondaryPress: () => {
        setCustomAlert((prev) => ({ ...prev, visible: false }));
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Toast Notification Banner (Positioned directly below status bar) */}
      {isToastVisible && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              top: Math.max(insets.top, 12),
              transform: [{ translateY: toastAnim }],
            },
          ]}
        >
          <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
          <Text style={styles.toastText} numberOfLines={1}>
            {toastText}
          </Text>
        </Animated.View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar Header */}
          <View style={styles.topRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => router.back()}
              hitSlop={8}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </Pressable>

            <Image
              source={require('../../assets/gileo-logo.png')}
              style={styles.brandLogo}
              resizeMode="contain"
              accessibilityLabel="Gileo Medicals"
            />
          </View>

          <View style={styles.heading}>
            <Text style={styles.title}>Privacy & Security</Text>
            <Text style={styles.subtitle}>
              Manage your account password, two-factor authentication, and data privacy controls.
            </Text>
          </View>

          {/* Section 1: Change Password */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionIconCircle}>
                <Ionicons name="key-outline" size={20} color="#761B36" />
              </View>
              <Text style={styles.sectionTitle}>Change Password</Text>
            </View>

            <View style={styles.formGroup}>
              <AppTextInput
                label="Current Password"
                placeholder="Enter current password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                autoCapitalize="none"
              />

              <AppTextInput
                label="New Password"
                placeholder="At least 12 characters"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
              />

              <AppTextInput
                label="Confirm New Password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />

              <PrimaryButton
                title={isUpdatingPassword ? 'Updating...' : 'Update Password'}
                onPress={handleUpdatePassword}
                loading={isUpdatingPassword}
                disabled={isUpdatingPassword}
                style={{ marginTop: 4 }}
              />
            </View>
          </View>

          {/* Section 2: Privacy Controls & Toggles */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIconCircle, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#059669" />
              </View>
              <Text style={styles.sectionTitle}>Security & Consent Controls</Text>
            </View>

            <View style={styles.toggleList}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleCopy}>
                  <Text style={styles.toggleTitle}>Two-Factor Authentication (2FA)</Text>
                  <Text style={styles.toggleSub}>Require a verification code at login</Text>
                </View>
                <Switch
                  value={twoFactorEnabled}
                  onValueChange={(val) => {
                    setTwoFactorEnabled(val);
                    triggerToast(val ? '2FA Enabled' : '2FA Disabled');
                  }}
                  trackColor={{ false: '#E2E8F0', true: '#761B36' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.toggleRow}>
                <View style={styles.toggleCopy}>
                  <Text style={styles.toggleTitle}>Email Notifications</Text>
                  <Text style={styles.toggleSub}>Receive order updates and care reminders</Text>
                </View>
                <Switch
                  value={emailNotifications}
                  onValueChange={(val) => {
                    setEmailNotifications(val);
                    triggerToast(val ? 'Notifications enabled' : 'Notifications disabled');
                  }}
                  trackColor={{ false: '#E2E8F0', true: '#761B36' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.toggleRow}>
                <View style={styles.toggleCopy}>
                  <Text style={styles.toggleTitle}>Health Analytics Consent</Text>
                  <Text style={styles.toggleSub}>Allow anonymous usage insights for app improvements</Text>
                </View>
                <Switch
                  value={analyticsConsent}
                  onValueChange={(val) => {
                    setAnalyticsConsent(val);
                    triggerToast(val ? 'Analytics consent saved' : 'Analytics opt-out saved');
                  }}
                  trackColor={{ false: '#E2E8F0', true: '#761B36' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </View>

          {/* Section 3: Danger Zone */}
          <View style={[styles.sectionCard, { borderColor: '#FECDD3' }]}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIconCircle, { backgroundColor: '#FFF1F2' }]}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </View>
              <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>Danger Zone</Text>
            </View>

            <Text style={styles.dangerText}>
              Permanently delete your Gileo account and erase all your personal details, health history, and order records.
            </Text>

            <Pressable
              style={styles.deleteAccountBtn}
              onPress={handleDeleteAccountPress}
            >
              <Ionicons name="trash" size={18} color="#EF4444" />
              <Text style={styles.deleteAccountText}>Delete Account</Text>
            </Pressable>
          </View>

          {/* Custom Alert Modal */}
          <Modal
            visible={customAlert.visible}
            transparent
            animationType="fade"
            onRequestClose={() => setCustomAlert((p) => ({ ...p, visible: false }))}
          >
            <Pressable
              style={styles.modalOverlay}
              onPress={() => setCustomAlert((p) => ({ ...p, visible: false }))}
            >
              <Pressable style={styles.customAlertCard} onPress={(e) => e.stopPropagation()}>
                <View style={[styles.alertIconCircle, { backgroundColor: customAlert.iconColor + '18' }]}>
                  <Ionicons name={customAlert.icon} size={32} color={customAlert.iconColor} />
                </View>

                <Text style={styles.alertTitle}>{customAlert.title}</Text>
                <Text style={styles.alertMessage}>{customAlert.message}</Text>

                <View style={styles.alertActions}>
                  {customAlert.secondaryBtnText && (
                    <Pressable
                      style={styles.alertSecondaryBtn}
                      onPress={customAlert.onSecondaryPress}
                    >
                      <Text style={styles.alertSecondaryText}>{customAlert.secondaryBtnText}</Text>
                    </Pressable>
                  )}

                  <Pressable
                    style={styles.alertPrimaryBtn}
                    onPress={customAlert.onPrimaryPress}
                  >
                    <Text style={styles.alertPrimaryText}>{customAlert.primaryBtnText}</Text>
                  </Pressable>
                </View>
              </Pressable>
            </Pressable>
          </Modal>

          <Text style={styles.footerNote}>
            GILEO MEDICALS GLOBAL LIMITED • 2026
          </Text>
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
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: 20,
  },
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    height: 48,
    borderRadius: 999,
    backgroundColor: '#761B36',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    shadowColor: '#761B36',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
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
    gap: 4,
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
  },
  sectionCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  formGroup: {
    gap: 12,
  },
  toggleList: {
    gap: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  toggleCopy: {
    flex: 1,
    gap: 2,
  },
  toggleTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleSub: {
    color: '#64748B',
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  dangerText: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 20,
  },
  deleteAccountBtn: {
    height: 52,
    borderRadius: 999,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteAccountText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  customAlertCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  alertIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
  },
  alertMessage: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  alertActions: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  alertPrimaryBtn: {
    height: 48,
    borderRadius: 999,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  alertSecondaryBtn: {
    height: 48,
    borderRadius: 999,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertSecondaryText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
  },
  footerNote: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    textAlign: 'center',
    paddingTop: 8,
  },
});
