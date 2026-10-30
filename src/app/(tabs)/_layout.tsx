import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest } from '../../services/api';
import {
  getStoredAccessToken,
  getStoredRefreshToken,
  getStoredUser,
  storeAuthSession,
} from '../../services/auth';
import { colors } from '../../theme';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkRole() {
      const u = await getStoredUser();
      if (u?.role === 'ADMIN') {
        setIsAdmin(true);
      }

      try {
        const profile = await apiRequest<any>('/profile/me');
        if (profile?.role === 'ADMIN') {
          setIsAdmin(true);
          if (u && u.role !== 'ADMIN') {
            const updated = { ...u, role: 'ADMIN' as const };
            const access = await getStoredAccessToken();
            const refresh = await getStoredRefreshToken();
            if (access && refresh) {
              await storeAuthSession({ accessToken: access, refreshToken: refresh, user: updated });
            }
          }
        } else if (profile?.role === 'CUSTOMER') {
          setIsAdmin(false);
        }
      } catch {}
    }

    void checkRole();
  }, []);

  return (
    <Tabs
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
              color={color}
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
              color={color}
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
              color={color}
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
              color={color}
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
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
