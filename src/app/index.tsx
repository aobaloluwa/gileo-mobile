import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStoredAccessToken } from '../services/auth';
import { colors } from '../theme';

const ONBOARDING_KEY = '@vitaltron/onboarding-completed';
type Destination = '/onboarding' | '/welcome' | '/login' | '/(tabs)';

export default function IndexRoute() {
  const [destination, setDestination] = useState<Destination | null>(null);

  useEffect(() => {
    let active = true;

    async function chooseDestination() {
      try {
        const onboardingCompleted = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (onboardingCompleted !== 'true') {
          if (active) setDestination('/onboarding');
          return;
        }

        const token = await getStoredAccessToken();
        if (active) setDestination(token ? '/(tabs)' : '/welcome');
      } catch {
        if (active) setDestination('/onboarding');
      }
    }

    void chooseDestination();
    return () => { active = false; };
  }, []);

  if (destination) return <Redirect href={destination} />;

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}
