import { Redirect } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStoredAccessToken } from '../services/auth';

const ONBOARDING_KEY = '@vitaltron/onboarding-completed';
type Destination = '/onboarding' | '/welcome' | '/login' | '/(tabs)';

export default function IndexRoute() {
  const [destination, setDestination] = useState<Destination | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    // Fade in and scale animation for initial splash screen
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    let active = true;

    async function chooseDestination() {
      // Small pause to let splash logo show cleanly
      const delayPromise = new Promise((resolve) => setTimeout(resolve, 1200));

      try {
        const [onboardingCompleted, token] = await Promise.all([
          AsyncStorage.getItem(ONBOARDING_KEY),
          getStoredAccessToken(),
          delayPromise,
        ]);

        if (!active) return;

        if (onboardingCompleted !== 'true') {
          setDestination('/onboarding');
        } else {
          setDestination(token ? '/(tabs)' : '/welcome');
        }
      } catch {
        if (active) setDestination('/onboarding');
      }
    }

    void chooseDestination();
    return () => {
      active = false;
    };
  }, [fadeAnim, scaleAnim]);

  if (destination) return <Redirect href={destination} />;

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <Image
          source={require('../assets/gileo-logo.png')}
          style={styles.splashLogo}
          resizeMode="contain"
          accessibilityLabel="Gileo Logo"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: 200,
    height: 80,
  },
});
