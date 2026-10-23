import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../../services/api';
import { AuthUser, clearAuthSession, getStoredUser, storeAuthSession } from '../../services/auth';
import { colors, spacing } from '../../theme';

type OrderItem = {
  titleSnapshot: string;
  quantity: number;
  unitPriceKobo: number;
};

type Order = {
  id: string;
  reference: string;
  status: string;
  totalKobo: number;
  createdAt: string;
  shippingAddress?: {
    name?: string;
    phone?: string;
    address?: string;
  };
  items: OrderItem[];
};

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

const mockOrders: Order[] = [
  {
    id: 'ord-1',
    reference: 'GIL-849201',
    status: 'PAID',
    totalKobo: 2850000,
    createdAt: new Date().toISOString(),
    shippingAddress: {
      name: 'Nurse Siyam Ahamed',
      phone: '+234 816 533 5594',
      address: 'Gileo Care Center, Lagos, Nigeria',
    },
    items: [
      {
        titleSnapshot: 'Gileo Dri-FIT Premium Scrubs Set (Size: M, Gileo Wine)',
        quantity: 1,
        unitPriceKobo: 2850000,
      },
    ],
  },
  {
    id: 'ord-2',
    reference: 'GIL-620194',
    status: 'PROCESSING',
    totalKobo: 3500000,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    shippingAddress: {
      name: 'Nurse Siyam Ahamed',
      phone: '+234 816 533 5594',
      address: 'General Hospital, Ikeja, Lagos',
    },
    items: [
      {
        titleSnapshot: 'Clinical Dual-Head Stethoscope',
        quantity: 1,
        unitPriceKobo: 3500000,
      },
    ],
  },
];

export function getFirstName(user: AuthUser | null): string {
  if (user?.displayName && user.displayName.trim()) {
    return user.displayName.trim().split(' ')[0];
  }
  if (user?.email && user.email.includes('@')) {
    const username = user.email.split('@')[0];
    const clean = username.replace(/[^a-zA-Z]/g, '');
    if (clean.length > 2) {
      return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
    }
  }
  return 'there';
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'settings'>('orders');
  const [refreshing, setRefreshing] = useState(false);

  // Edit Profile State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Entrance Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  // Custom Alert Modal State
  const [customAlert, setCustomAlert] = useState<CustomAlert>({
    visible: false,
    title: '',
    message: '',
    icon: 'log-out-outline',
    iconColor: '#EF4444',
    primaryBtnText: 'Log Out',
    onPrimaryPress: () => {},
  });

  // Notification Toast State
  const [toastText, setToastText] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);
  const toastAnim = useRef(new Animated.Value(-150)).current;

  const loadUserData = async () => {
    const storedUser = await getStoredUser();
    setUser(storedUser);
    if (storedUser) {
      setEditName(storedUser.displayName || '');
    }

    try {
      const myOrders = await apiRequest<Order[]>('/shop/orders/mine');
      if (Array.isArray(myOrders) && myOrders.length > 0) {
        setOrders(myOrders);
      }
    } catch {
      // Keep mock orders for offline/demo
    }
  };

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

    void loadUserData();
  }, [fadeAnim, slideAnim]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadUserData();
    } catch {
    } finally {
      setRefreshing(false);
    }
  };

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

  const handleCallSupport = () => {
    void Linking.openURL('tel:+2348165335594');
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      triggerToast('Please enter your full name');
      return;
    }

    setIsSavingProfile(true);

    try {
      await apiRequest<any>('/profile/me', {
        method: 'PATCH',
        body: JSON.stringify({
          displayName: editName.trim(),
          phoneNumber: editPhone.trim(),
        }),
      }).catch(() => null);

      const updatedUser: AuthUser = {
        id: user?.id || 'user-id',
        email: user?.email || '',
        displayName: editName.trim(),
      };

      const existingToken = (await AsyncStorage.getItem('@gileo/accessToken')) || 'dummy-token';
      const existingRefreshToken = (await AsyncStorage.getItem('@gileo/refreshToken')) || 'dummy-refresh';

      await storeAuthSession({
        accessToken: existingToken,
        refreshToken: existingRefreshToken,
        user: updatedUser,
      });

      setUser(updatedUser);
      setShowEditModal(false);
      triggerToast('Profile updated successfully!');
    } catch {
      triggerToast('Profile saved locally.');
      setShowEditModal(false);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleLogoutPress = () => {
    setCustomAlert({
      visible: true,
      title: 'Log Out',
      message: 'Are you sure you want to log out of your Gileo account?',
      icon: 'log-out-outline',
      iconColor: '#EF4444',
      primaryBtnText: 'Log Out',
      onPrimaryPress: async () => {
        setCustomAlert((prev) => ({ ...prev, visible: false }));
        await clearAuthSession();
        router.replace('/login');
      },
      secondaryBtnText: 'Cancel',
      onSecondaryPress: () => {
        setCustomAlert((prev) => ({ ...prev, visible: false }));
      },
    });
  };

  const firstName = getFirstName(user);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Toast Notification Banner */}
      {isToastVisible && (
        <Animated.View
          style={[
            styles.toastContainer,
            { top: Math.max(insets.top, 12), transform: [{ translateY: toastAnim }] },
          ]}
        >
          <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
          <Text style={styles.toastText} numberOfLines={1}>
            {toastText}
          </Text>
        </Animated.View>
      )}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#761B36"
            colors={['#761B36']}
          />
        }
      >
        {/* Header Bar */}
        <View style={styles.header}>
          <Image
            source={require('../../../assets/gileo-logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Gileo Logo"
          />

          <Pressable
            accessibilityRole="button"
            onPress={handleCallSupport}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          >
            <Ionicons name="call-outline" size={20} color="#0F172A" />
          </Pressable>
        </View>

        {/* Animated Page Main Body */}
        <Animated.View
          style={[
            styles.animatedContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* User Profile Hero Card */}
          <View style={styles.userCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.displayName || `Nurse ${firstName}`}</Text>
              <Text style={styles.userEmail}>{user?.email || 'user@gileo.com'}</Text>
              <View style={styles.roleBadge}>
                <Ionicons name="shield-checkmark" size={12} color="#10B981" />
                <Text style={styles.roleText}>Verified Gileo Member</Text>
              </View>
            </View>

            <Pressable style={styles.editProfileBtn} onPress={() => setShowEditModal(true)}>
              <Ionicons name="create-outline" size={18} color="#761B36" />
            </Pressable>
          </View>

          {/* Tab Selector Bar */}
          <View style={styles.tabBar}>
            <Pressable
              onPress={() => setActiveTab('orders')}
              style={[styles.tabItem, activeTab === 'orders' && styles.tabItemActive]}
            >
              <Ionicons
                name="bag-handle"
                size={16}
                color={activeTab === 'orders' ? '#761B36' : '#64748B'}
              />
              <Text style={[styles.tabLabel, activeTab === 'orders' && styles.tabLabelActive]}>
                My Orders ({orders.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('settings')}
              style={[styles.tabItem, activeTab === 'settings' && styles.tabItemActive]}
            >
              <Ionicons
                name="settings-outline"
                size={16}
                color={activeTab === 'settings' ? '#761B36' : '#64748B'}
              />
              <Text style={[styles.tabLabel, activeTab === 'settings' && styles.tabLabelActive]}>
                Account Settings
              </Text>
            </Pressable>
          </View>

          {/* Tab Content 1: My Orders */}
          {activeTab === 'orders' ? (
            <View style={styles.ordersSection}>
              {orders.length === 0 ? (
                <View style={styles.emptyOrdersCard}>
                  <Ionicons name="bag-handle-outline" size={48} color="#CBD5E1" />
                  <Text style={styles.emptyOrdersTitle}>No orders yet</Text>
                  <Text style={styles.emptyOrdersSub}>
                    When you purchase scrubs or medical equipment, your orders will appear here.
                  </Text>
                  <Pressable
                    style={styles.shopBtn}
                    onPress={() => router.push('/(tabs)/marketplace')}
                  >
                    <Text style={styles.shopBtnText}>Explore Marketplace</Text>
                  </Pressable>
                </View>
              ) : (
                orders.map((order) => {
                  const totalFormatted = `₦${(order.totalKobo / 100).toLocaleString()}`;
                  const isPaid = order.status === 'PAID' || order.status === 'DELIVERED';
                  return (
                    <Pressable
                      key={order.id}
                      accessibilityRole="button"
                      onPress={() => setSelectedOrder(order)}
                      style={({ pressed }) => [styles.orderCard, pressed && styles.pressed]}
                    >
                      <View style={styles.orderCardHeader}>
                        <View style={styles.orderRefBox}>
                          <Ionicons name="receipt-outline" size={18} color="#761B36" />
                          <Text style={styles.orderRefText}>{order.reference}</Text>
                        </View>

                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: isPaid ? '#ECFDF5' : '#FEF3C7' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              { color: isPaid ? '#059669' : '#B45309' },
                            ]}
                          >
                            {order.status}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.orderItemSummary} numberOfLines={2}>
                        {order.items.map((i) => `${i.titleSnapshot} (x${i.quantity})`).join(', ')}
                      </Text>

                      <View style={styles.orderCardFooter}>
                        <Text style={styles.orderTotalText}>{totalFormatted}</Text>
                        <View style={styles.viewReceiptLink}>
                          <Text style={styles.viewReceiptText}>View Details & Receipt</Text>
                          <Ionicons name="chevron-forward" size={14} color="#761B36" />
                        </View>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>
          ) : (
            /* Tab Content 2: Account Settings */
            <View style={styles.settingsSection}>
              <View style={styles.settingsGroup}>
                <Pressable style={styles.settingsRow} onPress={() => setShowEditModal(true)}>
                  <View style={styles.settingsIconCircle}>
                    <Ionicons name="person-outline" size={20} color="#761B36" />
                  </View>
                  <View style={styles.settingsTextGroup}>
                    <Text style={styles.settingsTitle}>Personal Details</Text>
                    <Text style={styles.settingsSub}>Edit name, phone number, and contact info</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </Pressable>

                <Pressable style={styles.settingsRow} onPress={() => router.push('/privacy-security')}>
                  <View style={styles.settingsIconCircle}>
                    <Ionicons name="shield-checkmark-outline" size={20} color="#4F46E5" />
                  </View>
                  <View style={styles.settingsTextGroup}>
                    <Text style={styles.settingsTitle}>Privacy & Security</Text>
                    <Text style={styles.settingsSub}>Manage account security and permissions</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </Pressable>
              </View>

              {/* Support Card */}
              <Pressable
                accessibilityRole="button"
                onPress={handleCallSupport}
                style={({ pressed }) => [styles.supportCard, pressed && styles.pressed]}
              >
                <View style={styles.supportIconCircle}>
                  <Ionicons name="headset" size={22} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.supportCardTitle}>Need Help with an Order?</Text>
                  <Text style={styles.supportCardSub}>Speak directly with GILEO Support</Text>
                  <Text style={styles.supportCardPhone}>+234 816 533 5594</Text>
                </View>
                <Ionicons name="call" size={20} color="#FFFFFF" />
              </Pressable>
            </View>
          )}

          {/* Log Out Action Button */}
          <Pressable
            accessibilityRole="button"
            onPress={handleLogoutPress}
            style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </Pressable>
        </Animated.View>

        {/* Detailed Order Receipt Modal */}
        <Modal
          visible={Boolean(selectedOrder)}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedOrder(null)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setSelectedOrder(null)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              {selectedOrder && (
                <>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalIconBox}>
                      <Ionicons name="receipt" size={24} color="#761B36" />
                    </View>
                    <Pressable onPress={() => setSelectedOrder(null)} hitSlop={10}>
                      <Ionicons name="close" size={22} color="#64748B" />
                    </Pressable>
                  </View>

                  <Text style={styles.modalRefTitle}>Order {selectedOrder.reference}</Text>
                  <View style={styles.statusRow}>
                    <Text style={styles.modalStatusLabel}>Status:</Text>
                    <View style={styles.modalStatusPill}>
                      <Text style={styles.modalStatusText}>{selectedOrder.status}</Text>
                    </View>
                  </View>

                  {/* Delivery Address Details */}
                  {selectedOrder.shippingAddress && (
                    <View style={styles.addressBox}>
                      <Text style={styles.addressBoxTitle}>Delivery Recipient</Text>
                      <Text style={styles.addressText}>
                        {selectedOrder.shippingAddress.name || user?.displayName}
                      </Text>
                      <Text style={styles.addressText}>
                        {selectedOrder.shippingAddress.phone || '+234 816 533 5594'}
                      </Text>
                      <Text style={styles.addressText}>
                        {selectedOrder.shippingAddress.address || 'Gileo Medical Center, Lagos'}
                      </Text>
                    </View>
                  )}

                  {/* Itemized Line Items */}
                  <View style={styles.receiptItemsList}>
                    <Text style={styles.itemsSectionTitle}>Items Purchased</Text>
                    {selectedOrder.items.map((item, idx) => (
                      <View key={idx} style={styles.receiptItemRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.receiptItemTitle}>{item.titleSnapshot}</Text>
                          <Text style={styles.receiptItemQty}>Qty: {item.quantity}</Text>
                        </View>
                        <Text style={styles.receiptItemPrice}>
                          ₦{((item.unitPriceKobo * item.quantity) / 100).toLocaleString()}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.receiptTotalRow}>
                    <Text style={styles.receiptTotalLabel}>Total Amount Paid</Text>
                    <Text style={styles.receiptTotalValue}>
                      ₦{(selectedOrder.totalKobo / 100).toLocaleString()}
                    </Text>
                  </View>

                  <Pressable style={styles.modalPrimaryBtn} onPress={handleCallSupport}>
                    <Ionicons name="call" size={18} color="#FFFFFF" />
                    <Text style={styles.modalPrimaryText}>Contact Support Regarding Order</Text>
                  </Pressable>
                </>
              )}
            </Pressable>
          </Pressable>
        </Modal>

        {/* Edit Personal Details Modal */}
        <Modal
          visible={showEditModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowEditModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowEditModal(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <View style={styles.modalIconBox}>
                  <Ionicons name="person" size={24} color="#761B36" />
                </View>
                <Pressable onPress={() => setShowEditModal(false)} hitSlop={10}>
                  <Ionicons name="close" size={22} color="#64748B" />
                </Pressable>
              </View>

              <Text style={styles.modalRefTitle}>Edit Personal Details</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Enter your full name"
                  placeholderTextColor="#94A3B8"
                  style={styles.modalInput}
                />

                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="+234..."
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  style={styles.modalInput}
                />
              </View>

              <Pressable
                style={[styles.modalPrimaryBtn, isSavingProfile && { opacity: 0.6 }]}
                disabled={isSavingProfile}
                onPress={handleSaveProfile}
              >
                <Text style={styles.modalPrimaryText}>
                  {isSavingProfile ? 'Saving...' : 'Save Changes'}
                </Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Custom Logout Alert Modal */}
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

                <Pressable style={styles.alertPrimaryBtn} onPress={customAlert.onPrimaryPress}>
                  <Text style={styles.alertPrimaryText}>{customAlert.primaryBtnText}</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Footer Note */}
        <Text style={styles.footerNote}>GILEO MEDICALS GLOBAL LIMITED • 2026</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 96,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    width: 120,
    height: 38,
    marginLeft: -25,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  animatedContainer: {
    gap: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    gap: 16,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#761B36',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  userEmail: {
    color: '#64748B',
    fontSize: 13,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  roleText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  editProfileBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  tabItem: {
    flex: 1,
    height: 44,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tabItemActive: {
    backgroundColor: '#FFF1F2',
  },
  tabLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#761B36',
    fontWeight: '800',
  },
  ordersSection: {
    gap: 12,
  },
  emptyOrdersCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    gap: 12,
  },
  emptyOrdersTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  emptyOrdersSub: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
  },
  shopBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#111111',
    marginTop: 4,
  },
  shopBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  orderCard: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    gap: 10,
  },
  orderCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderRefBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderRefText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  orderItemSummary: {
    color: '#64748B',
    fontSize: 13,
  },
  orderCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  orderTotalText: {
    color: '#761B36',
    fontSize: 15,
    fontWeight: '800',
  },
  viewReceiptLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewReceiptText: {
    color: '#761B36',
    fontSize: 12,
    fontWeight: '700',
  },
  settingsSection: {
    gap: 16,
  },
  settingsGroup: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingsIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsTextGroup: {
    flex: 1,
    gap: 2,
  },
  settingsTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  settingsSub: {
    color: '#64748B',
    fontSize: 12,
  },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#761B36',
    gap: 14,
  },
  supportIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportCardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  supportCardSub: {
    color: '#F1F5F9',
    fontSize: 11,
    opacity: 0.9,
  },
  supportCardPhone: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  logoutBtn: {
    height: 54,
    borderRadius: 999,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    padding: 24,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalIconBox: {
    width: 48,
    height: 48,
    borderRadius: 20,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalRefTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalStatusLabel: {
    color: '#64748B',
    fontSize: 13,
  },
  modalStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#ECFDF5',
  },
  modalStatusText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '800',
  },
  addressBox: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EAECEF',
    gap: 2,
  },
  addressBoxTitle: {
    color: '#8A7045',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  addressText: {
    color: '#0F172A',
    fontSize: 12,
  },
  itemsSectionTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  receiptItemsList: {
    paddingVertical: 8,
    gap: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  receiptItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  receiptItemTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
  },
  receiptItemQty: {
    color: '#64748B',
    fontSize: 11,
  },
  receiptItemPrice: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  receiptTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  receiptTotalLabel: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  receiptTotalValue: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
  },
  modalPrimaryBtn: {
    height: 52,
    borderRadius: 999,
    backgroundColor: '#761B36',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  modalPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  inputGroup: {
    gap: 8,
    marginVertical: 4,
  },
  inputLabel: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
  },
  modalInput: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EAECEF',
    paddingHorizontal: 16,
    color: '#0F172A',
    fontSize: 14,
  },
  customAlertCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
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
    fontWeight: '800',
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
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EAECEF',
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
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
    paddingTop: 8,
  },
});
