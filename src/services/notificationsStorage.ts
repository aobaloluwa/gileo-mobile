import AsyncStorage from '@react-native-async-storage/async-storage';

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

export async function getStoredNotifications(
  userId: string,
  email?: string | null,
): Promise<AppNotification[]> {
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
                // If notification specifies targetEmail, it ONLY belongs to that email!
                belongsToUser = Boolean(
                  normalizedUserEmail &&
                    item.targetEmail.toLowerCase().trim() === normalizedUserEmail,
                );
              } else if (item.targetId) {
                // If notification specifies targetId, it ONLY belongs to that targetId or guest
                belongsToUser =
                  item.targetId === userId || item.targetId === 'guest';
              } else {
                // Broadcast notification
                belongsToUser = true;
              }

              if (belongsToUser && !notifMap.has(item.id)) {
                notifMap.set(item.id, item);
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
      iconBg: '#FFF1F2',
      iconColor: '#761B36',
      read: false,
    },
  ];
}

export async function addNotification(
  targetKey: string,
  notification: Omit<AppNotification, 'id' | 'timestamp' | 'read' | 'timeAgo'>,
  targetEmail?: string,
): Promise<void> {
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

    // Save under targetKey
    const targetStorageKey = `@gileo/notifications_${targetKey || 'guest'}`;
    const rawTarget = await AsyncStorage.getItem(targetStorageKey);
    const targetList: AppNotification[] = rawTarget ? JSON.parse(rawTarget) : [];
    await AsyncStorage.setItem(targetStorageKey, JSON.stringify([newNotif, ...targetList]));

    // If targetEmail provided, save under email key as well
    if (targetEmail) {
      const emailStorageKey = `@gileo/notifications_${targetEmail.toLowerCase().trim()}`;
      const rawEmail = await AsyncStorage.getItem(emailStorageKey);
      const emailList: AppNotification[] = rawEmail ? JSON.parse(rawEmail) : [];
      await AsyncStorage.setItem(emailStorageKey, JSON.stringify([newNotif, ...emailList]));
    }

    // Save to global shared notifications
    const globalRaw = await AsyncStorage.getItem('@gileo/global_shared_notifications');
    const globalList: AppNotification[] = globalRaw ? JSON.parse(globalRaw) : [];
    await AsyncStorage.setItem(
      '@gileo/global_shared_notifications',
      JSON.stringify([newNotif, ...globalList]),
    );
  } catch {}
}

export async function markNotificationsAsRead(
  userId: string,
  email?: string | null,
): Promise<void> {
  try {
    const notifs = await getStoredNotifications(userId, email);
    const updated = notifs.map((n) => ({ ...n, read: true }));
    await AsyncStorage.setItem(`@gileo/notifications_${userId || 'guest'}`, JSON.stringify(updated));
    if (email) {
      await AsyncStorage.setItem(`@gileo/notifications_${email.toLowerCase().trim()}`, JSON.stringify(updated));
    }
  } catch {}
}
