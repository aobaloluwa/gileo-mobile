import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          height: 64,
          marginHorizontal: 16,
          marginBottom: Math.max(insets.bottom, 12),
          borderRadius: 32,
          position: 'absolute',
          elevation: 12,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
          paddingHorizontal: 8,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabItem, focused && styles.tabItemActive]}>
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={18}
                color={focused ? '#FFFFFF' : '#64748B'}
              />
              {focused && <Text style={styles.tabLabel}>Home</Text>}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabItem, focused && styles.tabItemActive]}>
              <Ionicons
                name={focused ? 'heart' : 'heart-outline'}
                size={18}
                color={focused ? '#FFFFFF' : '#64748B'}
              />
              {focused && <Text style={styles.tabLabel}>Services</Text>}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="marketplace"
        options={{
          title: 'Marketplace',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabItem, focused && styles.tabItemActive]}>
              <Ionicons
                name={focused ? 'bag-handle' : 'bag-handle-outline'}
                size={18}
                color={focused ? '#FFFFFF' : '#64748B'}
              />
              {focused && <Text style={styles.tabLabel}>Shop</Text>}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabItem, focused && styles.tabItemActive]}>
              <Ionicons
                name={focused ? 'people' : 'people-outline'}
                size={18}
                color={focused ? '#FFFFFF' : '#64748B'}
              />
              {focused && <Text style={styles.tabLabel}>Community</Text>}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabItem, focused && styles.tabItemActive]}>
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={18}
                color={focused ? '#FFFFFF' : '#64748B'}
              />
              {focused && <Text style={styles.tabLabel}>Profile</Text>}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  tabItemActive: {
    backgroundColor: '#761B36',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  tabLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
