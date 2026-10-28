import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from './api';

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  timeAgo: string;
  timestamp: number;
  icon: string;
  iconBg: string;
  iconColor: string;
  read: boolean;
  targetId?: string;
  targetEmail?: string;
};

export function formatNotificationTime(timestamp: number): string {
  if (!timestamp) return 'Just now';
  const diffMs = Date.now() - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export async function getStoredNotifications(
  userId: string,
  email?: string | null,
): Promise<AppNotification[]> {
  // 1. Try fetching persistent real-time notifications from backend API
  try {
    const backendNotifs = await apiRequest<any[]>('/notifications');
    if (Array.isArray(backendNotifs) && backendNotifs.length > 0) {
      const mapped: AppNotification[] = backendNotifs.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        timeAgo: formatNotificationTime(n.timestamp || Date.now()),
        timestamp: n.timestamp || Date.now(),
        icon: n.icon || 'notifications',
        iconBg: n.iconBg || '#FFF0F0',
        iconColor: n.iconColor || '#f90202',
        read: Boolean(n.read),
      }));

      // Cache in AsyncStorage
      await AsyncStorage.setItem(`@gileo/notifications_${userId || 'guest'}`, JSON.stringify(mapped));
      return mapped;
    }
  } catch {}

  // 2. Fallback to AsyncStorage cache
  try {
    const normalizedUserEmail = email ? email.toLowerCase().trim() : null;
    const keys = [`@gileo/notifications_${userId || 'guest'}`];
    if (normalizedUserEmail) {
      keys.push(`@gileo/notifications_${normalizedUserEmail}`);
    }
    keys.push('@gileo/global_shared_notifications');

    const multi = await AsyncStorage.multiGet(keys);
    const notifMap = new Map<string, AppNotification>();

    multi.forEach(([_, value]) => {
      if (value) {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            parsed.forEach((item: AppNotification) => {
              let belongsToUser = false;

              if (item.targetEmail) {
                belongsToUser = Boolean(
                  normalizedUserEmail &&
                    item.targetEmail.toLowerCase().trim() === normalizedUserEmail,
                );
              } else if (item.targetId) {
                belongsToUser =
                  item.targetId === userId || item.targetId === 'guest';
              } else {
                belongsToUser = true;
              }

              if (belongsToUser && !notifMap.has(item.id)) {
                notifMap.set(item.id, {
                  ...item,
                  timeAgo: formatNotificationTime(item.timestamp),
                });
              }
            });
          }
        } catch {}
      }
    });

    if (notifMap.size > 0) {
      return Array.from(notifMap.values()).sort((a, b) => b.timestamp - a.timestamp);
    }
  } catch {}

  return [
    {
      id: 'notif-default-1',
      title: 'Welcome to Gileo Medicals',
      body: 'Explore healthcare services, medical marketplace, and community network.',
      timeAgo: 'Just now',
      timestamp: Date.now(),
      icon: 'sparkles',
      iconBg: '#FFF0F0',
      iconColor: '#f90202',
      read: false,
    },
  ];
}

export async function addNotification(
  targetKey: string,
  notification: Omit<AppNotification, 'id' | 'timestamp' | 'read' | 'timeAgo'>,
  targetEmail?: string,
): Promise<void> {
  // 1. Post notification to backend API database for persistence across devices
  void apiRequest('/notifications', {
    method: 'POST',
    body: JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon,
      iconBg: notification.iconBg,
      iconColor: notification.iconColor,
    }),
  }).catch(() => null);

  // 2. Save locally in AsyncStorage
  try {
    const newNotif: AppNotification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      timeAgo: 'Just now',
      read: false,
      targetId: targetKey,
      targetEmail: targetEmail ? targetEmail.toLowerCase().trim() : undefined,
    };

    const targetStorageKey = `@gileo/notifications_${targetKey || 'guest'}`;
    const rawTarget = await AsyncStorage.getItem(targetStorageKey);
    const targetList: AppNotification[] = rawTarget ? JSON.parse(rawTarget) : [];
    await AsyncStorage.setItem(targetStorageKey, JSON.stringify([newNotif, ...targetList]));
  } catch {}
}

export async function markNotificationsAsRead(
  userId: string,
  email?: string | null,
): Promise<void> {
  void apiRequest('/notifications/mark-read', { method: 'POST' }).catch(() => null);

  try {
    const notifs = await getStoredNotifications(userId, email);
    const updated = notifs.map((n) => ({ ...n, read: true }));
    await AsyncStorage.setItem(`@gileo/notifications_${userId || 'guest'}`, JSON.stringify(updated));
    if (email) {
      await AsyncStorage.setItem(`@gileo/notifications_${email.toLowerCase().trim()}`, JSON.stringify(updated));
    }
  } catch {}
}
