
import { router } from 'expo-router';
import { useEffect } from 'react';
import {
  Image,
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
            source={require('../assets/gileo-logo.png')}
            style={styles.brandLogo}
            resizeMode="contain"
            accessibilityLabel="Gileo Medicals"
          />
        </View>

        <View style={styles.hero}>
          <View style={styles.illustration}>
            <Image
              source={require('../assets/onboarding-care.png')}
              resizeMode="contain"
              style={styles.heroIllustration}
              accessibilityLabel="Illustration representing healthcare and care services"
            />
          </View>

          <Text style={styles.eyebrow}>CARE • COMMUNITY • GROWTH</Text>

          <Text style={styles.title}>
            Healthcare. Medical{' '}
            <Text style={styles.titleAccent}>essentials. Professional growth.</Text>
          </Text>

          <Text style={styles.description}>
            One connected platform for care, medical products, and nursing development. Discover services, shop medical essentials, and explore resources built to help you grow.
          </Text>
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            title="Log in"
            onPress={() => router.push('/login')}
          />

          <View style={styles.loginRow}>
            <Text style={styles.loginPrompt}>
              Don't have an account?
            </Text>

            <Text
              accessibilityRole="link"
              onPress={() => router.push('/register')}
              style={styles.loginLink}
            >
              Get started
            </Text>
          </View>

          <View style={styles.privacyRow}>
            <Ionicons
              name="lock-closed-outline"
              size={14}
              color="#707070"
            />
            <Text style={styles.privacyNote}>
              Care and support, all in one place.
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
    paddingTop: 18,
    paddingBottom: 24,
  },
  brandRow: {
    height: 58,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  brandLogo: {
    width: 112,
    height: 58,
    marginLeft: -20,
  },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#761B36',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: {
    color: '#FFFFFF',
    fontSize: 25,
    fontFamily: 'Inter_700Bold',
  },
  brandName: {
    color: '#761B36',
    fontSize: 21,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.7,
  },
  brandSubtitle: {
    color: '#74696B',
    fontSize: 8,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 2.1,
    marginTop: -2,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },
  illustration: {
    width: '100%',
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  heroIllustration: {
    width: '100%',
    height: '100%',
    maxWidth: 340,
  },
  outerCircle: {
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: '#E9DFE1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  middleCircle: {
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: '#F7E9ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F5D56A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseBadge: {
    position: 'absolute',
    right: -14,
    bottom: 2,
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9DFE1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldDot: {
    position: 'absolute',
    top: 18,
    right: 35,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#F2B705',
  },
  darkDot: {
    position: 'absolute',
    bottom: 30,
    left: 25,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#761B36',
  },
  smallCircle: {
    position: 'absolute',
    top: 40,
    left: 5,
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9DFE1',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  eyebrow: {
    color: '#707070',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.7,
    marginBottom: 14,
    textAlign: 'center',
  },
  title: {
    color: '#761B36',
    fontSize: 32,
    lineHeight: 41,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -1,
    textAlign: 'center',
  },
  titleAccent: {
    color: '#761B36',
  },
  description: {
    maxWidth: 330,
    color: '#707070',
    fontSize: 15,
    lineHeight: 24,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 18,
  },
  footer: {
    gap: 22,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },
  loginPrompt: {
    color: '#707070',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  loginLink: {
    color: '#761B36',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    padding: 4,
  },
  privacyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  privacyNote: {
    color: '#707070',
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});
