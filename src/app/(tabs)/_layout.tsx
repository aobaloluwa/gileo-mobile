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
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          // Reserve space for Android's gesture/navigation area so the tab
          // buttons sit higher instead of colliding with the system bar.
          height: 66 + insets.bottom,
          paddingTop: 7,
          paddingBottom: Math.max(insets.bottom, 8),
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter_600SemiBold',
          fontSize: 10,
          marginTop: 3,
        },
        tabBarItemStyle: { paddingVertical: 1 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} /> }} />
      <Tabs.Screen name="records" options={{ title: 'Records', tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'folder-open' : 'folder-open-outline'} size={size} color={color} /> }} />
      <Tabs.Screen name="womens-health" options={{ title: "Women's health", tabBarLabel: "Women's health", tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'flower' : 'flower-outline'} size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={size} color={color} /> }} />
    </Tabs>
  );
}
