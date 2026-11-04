import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiRequest } from '../services/api';
import { getStoredUser } from '../services/auth';
import {
  AppNotification,
  formatNotificationTime,
  getStoredNotifications,
  markNotificationsAsRead,
} from '../services/notificationsStorage';
import { formatKobo } from '../theme/colors';

type AdminNotifCategory = 'ALL' | 'ORDERS' | 'CARE_REQUESTS' | 'INVENTORY' | 'USERS';

type ExtendedNotification = AppNotification & {
  category?: 'ORDERS' | 'CARE_REQUESTS' | 'INVENTORY' | 'USERS' | 'SYSTEM';
  actionRoute?: string;
  actionText?: string;
};

function isCustomerOnlyNotification(title?: string, body?: string): boolean {
  const t = (title || '').toLowerCase();
  const b = (body || '').toLowerCase();
  return (
    t.includes('e-book unlocked') ||
    t.includes('ebook unlocked') ||
    t.includes('welcome to gileo') ||
    b.includes('available in your library') ||
    b.includes('explore healthcare services')
  );
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<ExtendedNotification[]>([]);
  const [userId, setUserId] = useState('guest');
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedAdminCategory, setSelectedAdminCategory] = useState<AdminNotifCategory>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifs = async () => {
    setIsLoading(true);
    const user = await getStoredUser();
    const uid = user?.id || 'guest';
    setUserId(uid);
    const adminRole = Boolean(user?.role === 'ADMIN');
    setIsAdmin(adminRole);

    if (adminRole) {
      // Fetch system-wide activities for Admin Notification Center in parallel
      try {
        const [ordersRes, reqsRes, prodsRes, usersRes, serverNotifsRes] = await Promise.allSettled([
          apiRequest<any[]>('/shop/orders'),
          apiRequest<any[]>('/service-requests'),
          apiRequest<any[]>('/shop/products'),
          apiRequest<any[]>('/admin/users'),
          apiRequest<any[]>('/notifications'),
        ]);

        const notifList: ExtendedNotification[] = [];

        // 1. Process Orders Notifications
        if (ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value)) {
          ordersRes.value.forEach((ord) => {
            const timeMs = new Date(ord.createdAt || Date.now()).getTime();
            const customerName =
              ord.shippingAddress?.name ||
              ord.user?.displayName ||
              ord.user?.email ||
              'Customer';
            notifList.push({
              id: `admin-ord-${ord.id}`,
              title: `New Order: #${ord.reference || ord.id}`,
              body: `${customerName} placed an order of ${formatKobo(ord.totalKobo)}. Status: ${ord.status}.`,
              timeAgo: formatNotificationTime(timeMs),
              timestamp: timeMs,
              icon: 'bag-handle',
              iconBg: '#FEF3C7',
              iconColor: '#B45309',
              read: ord.status === 'DELIVERED' || ord.status === 'CANCELLED',
              category: 'ORDERS',
              actionRoute: '/(tabs)/community',
              actionText: 'View Order',
            });
          });
        }

        // 2. Process Care Requests Notifications
        if (reqsRes.status === 'fulfilled' && Array.isArray(reqsRes.value)) {
          reqsRes.value.forEach((req) => {
            const timeMs = new Date(req.createdAt || Date.now()).getTime();
            const clientName = req.patientName || req.user?.displayName || 'Client';
            const srvTitle = req.service?.title || 'Clinical Care Request';
            notifList.push({
              id: `admin-req-${req.id}`,
              title: `Care Request: #${req.reference || req.id}`,
              body: `${srvTitle} for ${clientName}. Delivery: ${req.location || 'Home Address'}. Status: ${req.status}.`,
              timeAgo: formatNotificationTime(timeMs),
              timestamp: timeMs,
              icon: 'medkit',
              iconBg: '#ECFDF5',
              iconColor: '#059669',
              read: req.status === 'COMPLETED',
              category: 'CARE_REQUESTS',
              actionRoute: '/(tabs)/services',
              actionText: 'Manage Request',
            });
          });
        }

        // 3. Process Low Stock Inventory Alerts
        if (prodsRes.status === 'fulfilled' && Array.isArray(prodsRes.value)) {
          prodsRes.value
            .filter((p) => (p.stock ?? 10) <= 3)
            .forEach((prod) => {
              notifList.push({
                id: `admin-stock-${prod.id}`,
                title: `Low Stock Alert: ${prod.title}`,
                body: `Only ${prod.stock ?? 0} unit(s) left in inventory. Tap to restock catalog item.`,
                timeAgo: 'Attention Needed',
                timestamp: Date.now() + 1000,
                icon: 'alert-circle',
                iconBg: '#FEF2F2',
                iconColor: '#EF4444',
                read: false,
                category: 'INVENTORY',
                actionRoute: '/(tabs)/marketplace',
                actionText: 'Restock Item',
              });
            });
        }

        // 4. Process User Signups Notifications
        if (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value)) {
          usersRes.value.forEach((u) => {
            const timeMs = new Date(u.createdAt || Date.now()).getTime();
            notifList.push({
              id: `admin-user-${u.id}`,
              title: `New User: ${u.displayName || u.email?.split('@')[0] || 'Member'}`,
              body: `${u.email} registered on Gileo platform as ${u.role || 'CUSTOMER'}.`,
              timeAgo: formatNotificationTime(timeMs),
              timestamp: timeMs,
              icon: 'person-add',
              iconBg: '#EEF2FF',
              iconColor: '#4F46E5',
              read: true,
              category: 'USERS',
              actionRoute: '/(tabs)/profile',
              actionText: 'View Member',
            });
          });
        }

        // 5. Process Server System Notifications
        if (serverNotifsRes.status === 'fulfilled' && Array.isArray(serverNotifsRes.value)) {
          serverNotifsRes.value
            .filter((sn) => !isCustomerOnlyNotification(sn.title, sn.body))
            .forEach((sn) => {
              const timeMs = sn.timestamp || Date.now();
              notifList.push({
                id: sn.id || `admin-sys-${timeMs}`,
                title: sn.title,
                body: sn.body,
                timeAgo: formatNotificationTime(timeMs),
                timestamp: timeMs,
                icon: sn.icon || 'notifications',
                iconBg: sn.iconBg || '#FDF2F2',
                iconColor: sn.iconColor || '#F10505',
                read: Boolean(sn.read),
                category: 'SYSTEM',
              });
            });
        }

        notifList.sort((a, b) => b.timestamp - a.timestamp);
        setNotifications(notifList);
        setIsLoading(false);
        return;
      } catch {
      } finally {
        setIsLoading(false);
      }
    }

    // Customer Notification Loading
    try {
      const serverNotifs = await apiRequest<any[]>('/notifications');
      if (Array.isArray(serverNotifs) && serverNotifs.length > 0) {
        setNotifications(
          serverNotifs.map((n) => ({
            id: n.id,
            title: n.title,
            body: n.body,
            timeAgo: n.timeAgo || 'Just now',
            timestamp: n.timestamp || Date.now(),
            icon: n.icon || 'notifications',
            iconBg: n.iconBg || '#FDF2F2',
            iconColor: n.iconColor || '#F10505',
            read: Boolean(n.read),
          })),
        );
        setIsLoading(false);
        return;
      }
    } catch {}

    const notifs = await getStoredNotifications(uid, user?.email);
    setNotifications(notifs);
    setIsLoading(false);
  };

  useEffect(() => {
    void loadNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    const user = await getStoredUser();
    try {
      await apiRequest('/notifications/mark-read', { method: 'POST' });
    } catch {}
    await markNotificationsAsRead(userId, user?.email);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationAction = (item: ExtendedNotification) => {
    if (item.actionRoute) {
      router.push(item.actionRoute as any);
    } else {
      router.push('/(tabs)/community');
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    if (!isAdmin || selectedAdminCategory === 'ALL') return true;
    return item.category === selectedAdminCategory;
  });

  const totalUnreadAll = notifications.filter((n) => !n.read).length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View style={styles.topRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            hitSlop={8}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </Pressable>

          <Image
            source={require('../assets/gileo-logo.png')}
            style={styles.brandLogo}
            resizeMode="contain"
            accessibilityLabel="Gileo Medicals"
          />
        </View>

        <View style={styles.headingRow}>
          <View style={{ flex: 1, paddingRight: 4 }}>
            <View style={styles.badgeTitleRow}>
              <Text style={styles.title}>{isAdmin ? 'Admin Activity Center' : 'Notifications'}</Text>
              {totalUnreadAll > 0 && (
                <View style={styles.headerUnreadBadge}>
                  <Text style={styles.headerUnreadText}>
                    {totalUnreadAll > 99 ? '99+' : totalUnreadAll}
                  </Text>
                </View>
              )}
              {isAdmin && (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>ADMIN CONTROL</Text>
                </View>
              )}
            </View>
            <Text style={styles.subtitle}>
              {isAdmin
                ? 'Real-time updates on orders, care requests, stock alerts, and platform signups.'
                : 'Updates on your orders, network connections, and community.'}
            </Text>
          </View>

          {totalUnreadAll > 0 && (
            <Pressable onPress={handleMarkAllRead} style={styles.markReadBtn} hitSlop={6}>
              <Text style={styles.markReadText} numberOfLines={1}>Mark all read</Text>
            </Pressable>
          )}
        </View>

        {/* Admin Filter Chips */}
        {isAdmin && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipsContainer}
          >
            {[
              { key: 'ALL', label: `All (${notifications.length})` },
              { key: 'ORDERS', label: `Orders (${notifications.filter((n) => n.category === 'ORDERS').length})` },
              { key: 'CARE_REQUESTS', label: `Care Requests (${notifications.filter((n) => n.category === 'CARE_REQUESTS').length})` },
              { key: 'INVENTORY', label: `Stock Alerts (${notifications.filter((n) => n.category === 'INVENTORY').length})` },
              { key: 'USERS', label: `Signups (${notifications.filter((n) => n.category === 'USERS').length})` },
            ].map((chip) => {
              const isActive = selectedAdminCategory === chip.key;
              return (
                <Pressable
                  key={chip.key}
                  onPress={() => setSelectedAdminCategory(chip.key as AdminNotifCategory)}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {chip.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* Notifications List */}
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#F10505" />
            <Text style={styles.loadingText}>Fetching system notifications...</Text>
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="notifications-off-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySub}>
              {isAdmin
                ? 'No system activity or alerts matching this category.'
                : 'You have no new notifications right now.'}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {(() => {
              let unreadCounter = 0;
              return filteredNotifications.map((item) => {
                const isUnread = !item.read;
                if (isUnread) unreadCounter += 1;
                const currentUnreadIndex = unreadCounter;
                const isConnectionReq =
                  item.title.toLowerCase().includes('connection') || item.icon === 'person-add';

                return (
                  <Pressable
                    key={item.id}
                    style={[styles.notifCard, isUnread && styles.notifCardUnread]}
                    onPress={() => handleNotificationAction(item)}
                  >
                    <View style={[styles.iconCircle, { backgroundColor: item.iconBg || '#FDF2F2' }]}>
                      <Ionicons
                        name={(item.icon as keyof typeof Ionicons.glyphMap) || 'notifications'}
                        size={20}
                        color={item.iconColor || '#F10505'}
                      />
                    </View>

                    <View style={styles.notifContent}>
                      <View style={styles.notifTitleRow}>
                        <Text style={styles.notifTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.notifTime}>{item.timeAgo}</Text>
                      </View>

                      <Text style={styles.notifBody}>{item.body}</Text>

                      {(item.actionText || isConnectionReq) && (
                        <Pressable
                          style={styles.connectBackPillBtn}
                          onPress={() => handleNotificationAction(item)}
                        >
                          <Ionicons
                            name={
                              item.category === 'ORDERS'
                                ? 'bag-handle'
                                : item.category === 'CARE_REQUESTS'
                                  ? 'medkit'
                                  : item.category === 'INVENTORY'
                                    ? 'cube'
                                    : 'arrow-forward'
                            }
                            size={13}
                            color="#FFFFFF"
                          />
                          <Text style={styles.connectBackPillText}>
                            {item.actionText || 'Connect Back'}
                          </Text>
                        </Pressable>
                      )}
                    </View>

                    {isUnread && (
                      <View style={styles.itemUnreadBadge}>
                        <Text style={styles.itemUnreadBadgeText}>#{currentUnreadIndex}</Text>
                      </View>
                    )}
                  </Pressable>
                );
              });
            })()}
          </View>
        )}

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
    paddingBottom: 32,
    gap: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  brandLogo: {
    width: 120,
    height: 40,
    marginRight: -10,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    width: '100%',
  },
  badgeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  title: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  adminBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#F10505',
  },
  adminBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },
  markReadBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FDF2F2',
    flexShrink: 0,
    alignSelf: 'center',
  },
  markReadText: {
    color: '#F10505',
    fontSize: 11,
    fontWeight: '700',
  },
  filterChipsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#F10505',
    borderColor: '#F10505',
  },
  filterChipText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  loadingBox: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyBox: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  emptySub: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
  },
  list: {
    gap: 12,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    gap: 14,
    position: 'relative',
  },
  notifCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#F10505',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: {
    flex: 1,
    gap: 4,
  },
  notifTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  notifTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  notifTime: {
    color: '#94A3B8',
    fontSize: 11,
  },
  notifBody: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
  },
  connectBackPillBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F10505',
    marginTop: 6,
  },
  connectBackPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F10505',
    marginTop: 6,
  },
  headerUnreadBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: '#F10505',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerUnreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  itemUnreadBadge: {
    minWidth: 26,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: '#F10505',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  itemUnreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  footerNote: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
    paddingTop: 12,
  },
});
