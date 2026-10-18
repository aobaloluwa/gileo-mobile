
import { router } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from '../components/ui/PrimaryButton';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>v</Text>
          </View>
          <Text style={styles.brandName}>vitaltron</Text>
        </View>

        <View style={styles.hero}>
          <View style={styles.illustration}>
            <View style={styles.outerCircle}>
              <View style={styles.middleCircle}>
                <View style={styles.iconCircle}>
                  <Ionicons
                    name="heart"
                    size={64}
                    color="#111111"
                  />
                  <View style={styles.pulseBadge}>
                    <Ionicons
                      name="pulse"
                      size={24}
                      color="#111111"
                    />
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.goldDot} />
            <View style={styles.darkDot} />
            <View style={styles.smallCircle}>
              <Ionicons
                name="shield-checkmark-outline"
                size={25}
                color="#111111"
              />
            </View>
          </View>

          <Text style={styles.eyebrow}>YOUR HEALTH, YOUR STORY</Text>

          <Text style={styles.title}>
            Your health story,{' '}
            <Text style={styles.titleAccent}>in your hands.</Text>
          </Text>

          <Text style={styles.description}>
            A simpler way to keep your health records close,
            understand your wellbeing, and share your health
            information when you choose.
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
              Your health information belongs to you.
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: {
    color: '#FFFFFF',
    fontSize: 25,
    fontFamily: 'Inter_700Bold',
  },
  brandName: {
    color: '#111111',
    fontSize: 21,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.7,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },
  illustration: {
    width: 250,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 34,
  },
  outerCircle: {
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: '#F8F6F1',
    borderWidth: 1,
    borderColor: '#EAE6DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  middleCircle: {
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: '#F0E6CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E6C779',
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
    borderColor: '#E7E1D5',
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
    backgroundColor: '#D5AE54',
  },
  darkDot: {
    position: 'absolute',
    bottom: 30,
    left: 25,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#38342C',
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
    borderColor: '#E7E1D5',
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
    color: '#111111',
    fontSize: 32,
    lineHeight: 41,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -1,
    textAlign: 'center',
  },
  titleAccent: {
    color: '#111111',
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
    color: '#111111',
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
