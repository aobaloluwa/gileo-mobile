import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
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
  getStoredNotifications,
  markNotificationsAsRead,
} from '../services/notificationsStorage';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [userId, setUserId] = useState('guest');

  const loadNotifs = async () => {
    const user = await getStoredUser();
    const uid = user?.id || 'guest';
    setUserId(uid);

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
        return;
      }
    } catch {}

    const notifs = await getStoredNotifications(uid, user?.email);
    setNotifications(notifs);
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

  const handleConnectBack = (item: AppNotification) => {
    router.push('/(tabs)/community');
  };

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
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>Updates on your orders, network connections, and community.</Text>
          </View>

          {notifications.some((n) => !n.read) && (
            <Pressable onPress={handleMarkAllRead} style={styles.markReadBtn} hitSlop={6}>
              <Text style={styles.markReadText} numberOfLines={1}>Mark all read</Text>
            </Pressable>
          )}
        </View>

        {/* Notifications List */}
        <View style={styles.list}>
          {notifications.map((item) => {
            const isConnectionReq = item.title.toLowerCase().includes('connection') || item.icon === 'person-add';
            return (
              <View
                key={item.id}
                style={[styles.notifCard, !item.read && styles.notifCardUnread]}
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
                    <Text style={styles.notifTitle}>{item.title}</Text>
                    <Text style={styles.notifTime}>{item.timeAgo}</Text>
                  </View>

                  <Text style={styles.notifBody}>{item.body}</Text>

                  {isConnectionReq && (
                    <Pressable
                      style={styles.connectBackPillBtn}
                      onPress={() => handleConnectBack(item)}
                    >
                      <Ionicons name="person-add" size={13} color="#FFFFFF" />
                      <Text style={styles.connectBackPillText}>Connect Back</Text>
                    </Pressable>
                  )}
                </View>

                {!item.read && <View style={styles.unreadDot} />}
              </View>
            );
          })}
        </View>

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
    gap: 20,
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
  title: {
    color: '#0F172A',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
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
  },
  notifTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
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
  footerNote: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
    paddingTop: 12,
  },
});
