import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { colors } from '../theme';

// Prevent Expo native splash screen from hiding prematurely
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useEffect(() => {
    // Hide the single Expo native splash screen when root layout mounts
    const timer = setTimeout(() => {
      void SplashScreen.hideAsync().catch(() => {});
    }, 400);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="verify-email" />
        <Stack.Screen name="privacy-security" />
        <Stack.Screen name="notifications" />
      </Stack>
    </SafeAreaProvider>
  );
}
