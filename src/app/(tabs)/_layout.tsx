import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest } from '../../services/api';
import {
  getInMemoryUserSync,
  getStoredAccessToken,
  getStoredRefreshToken,
  getStoredUser,
  storeAuthSession,
} from '../../services/auth';
import { colors } from '../../theme';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const [isRoleChecked, setIsRoleChecked] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    const mem = getInMemoryUserSync();
    return Boolean(mem?.role === 'ADMIN');
  });

  useEffect(() => {
    let isMounted = true;

    async function checkRole() {
      const u = await getStoredUser();
      let currentAdmin = Boolean(u?.role === 'ADMIN');
      if (isMounted) setIsAdmin(currentAdmin);

      try {
        const profile = await apiRequest<any>('/profile/me');
        const role = profile?.role || u?.role || 'CUSTOMER';
        currentAdmin = role === 'ADMIN';

        if (isMounted) setIsAdmin(currentAdmin);

        const updated = {
          id: profile?.id || u?.id || '',
          email: profile?.email || u?.email || '',
          displayName: profile?.displayName || u?.displayName || null,
          role: role as 'ADMIN' | 'CUSTOMER',
        };

        const access = await getStoredAccessToken();
        const refresh = await getStoredRefreshToken();
        if (access && refresh) {
          await storeAuthSession({ accessToken: access, refreshToken: refresh, user: updated });
        }
      } catch {} finally {
        if (isMounted) setIsRoleChecked(true);
      }
    }

    void checkRole();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!isRoleChecked) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#F10505" />
      </View>
    );
  }

  return (
    <Tabs
      id="tabs"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 62 + insets.bottom,
          paddingTop: 7,
          paddingBottom: Math.max(insets.bottom, 8),
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter_600SemiBold',
          fontSize: 10,
          marginTop: 3,
        },
        tabBarItemStyle: {
          paddingVertical: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: isAdmin ? 'Dashboard' : 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={isAdmin ? (focused ? 'grid' : 'grid-outline') : (focused ? 'home' : 'home-outline')}
              size={size}
              color={color as string}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="services"
        options={{
          title: isAdmin ? 'Care Requests' : 'Services',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={isAdmin ? (focused ? 'medkit' : 'medkit-outline') : (focused ? 'heart' : 'heart-outline')}
              size={size}
              color={color as string}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="marketplace"
        options={{
          title: isAdmin ? 'Products' : 'Marketplace',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={isAdmin ? (focused ? 'shirt' : 'shirt-outline') : (focused ? 'bag-handle' : 'bag-handle-outline')}
              size={size}
              color={color as string}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="community"
        options={{
          title: isAdmin ? 'Orders' : 'Community',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={isAdmin ? (focused ? 'bag-handle' : 'bag-handle-outline') : (focused ? 'people' : 'people-outline')}
              size={size}
              color={color as string}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: isAdmin ? 'Admin Hub' : 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={
                isAdmin
                  ? focused
                    ? 'shield-checkmark'
                    : 'shield-checkmark-outline'
                  : focused
                    ? 'person-circle'
                    : 'person-circle-outline'
              }
              size={size}
              color={color as string}
            />
          ),
        }}
      />
    </Tabs>
  );
}
