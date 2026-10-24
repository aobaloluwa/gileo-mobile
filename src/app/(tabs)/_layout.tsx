
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

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
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'heart' : 'heart-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="marketplace"
        options={{
          title: 'Marketplace',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'bag-handle' : 'bag-handle-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'people' : 'people-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'person-circle' : 'person-circle-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
