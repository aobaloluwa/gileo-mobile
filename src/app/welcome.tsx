import { router } from 'expo-router';
import { useEffect } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from '../components/ui/PrimaryButton';
import { getStoredAccessToken } from '../services/auth';

export default function WelcomeScreen() {
  useEffect(() => {
    async function checkAuth() {
      try {
        const token = await getStoredAccessToken();
        if (token) {
          router.replace('/(tabs)');
        }
      } catch {}
    }
    void checkAuth();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandRow}>
          <Image
            source={require('../../assets/gileo-logo.png')}
            style={styles.brandLogo}
            resizeMode="contain"
            accessibilityLabel="Gileo Logo"
          />
        </View>

        <View style={styles.hero}>
          <View style={styles.illustration}>
            <Image
              source={require('../../assets/onboarding-care.png')}
              resizeMode="contain"
              style={styles.heroIllustration}
              accessibilityLabel="Healthcare and care services"
            />
          </View>

          <Text style={styles.title}>Welcome to Gileo!</Text>

          <Text style={styles.description}>
            The ultimate connected platform for healthcare services, medical marketplace, nursing community, and learning resources.
          </Text>
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            title="Access Your Account"
            onPress={() => router.push('/login')}
          />

          <View style={styles.loginRow}>
            <Text style={styles.loginPrompt}>
              Don't have an account?
            </Text>

            <Pressable
              accessibilityRole="link"
              onPress={() => router.push('/register')}
              hitSlop={8}
            >
              <Text style={styles.loginLink}> Signup</Text>
            </Pressable>
          </View>

          <View style={styles.supportRow}>
            <Ionicons
              name="headset-outline"
              size={14}
              color="#64748B"
            />
            <Text style={styles.supportNote}>
              Support: +234 816 533 5594
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  brandRow: {
    height: 48,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  brandLogo: {
    width: 120,
    height: 40,
    marginLeft: -16,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  illustration: {
    width: '100%',
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  heroIllustration: {
    width: '100%',
    height: '100%',
    maxWidth: 320,
  },
  title: {
    color: '#0F172A',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  description: {
    maxWidth: 320,
    color: '#64748B',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 12,
  },
  footer: {
    gap: 16,
    width: '100%',
    alignItems: 'stretch',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginPrompt: {
    color: '#64748B',
    fontSize: 13,
  },
  loginLink: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  supportRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
  },
  supportNote: {
    color: '#64748B',
    fontSize: 12,
  },
});
