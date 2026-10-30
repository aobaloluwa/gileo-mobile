import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getStoredAccessToken } from '../services/auth';

const slides = [
  {
    eyebrow: 'DISCOVERING GILEO',
    title: 'Quality healthcare beyond boundaries',
    description:
      'Access healthcare services, shop medical essentials, connect with the nursing community, and discover learning opportunities, all in one place.',
    illustration: require('../../assets/onboarding-care.png'),
  },
  {
    eyebrow: 'ACCESS WHAT YOU NEED',
    title: 'Care, made easier.',
    description:
      'Request healthcare services and explore medical essentials, scrubs, equipment, and everyday supplies in the Gileo Marketplace.',
    illustration: require('../../assets/onboarding-privacy.png'),
  },
  {
    eyebrow: 'CONNECT AND GROW',
    title: 'More than healthcare. A connected ecosystem.',
    description:
      'Connect through Gileo Nurses Community and grow professionally with Gileo Elevate and practical learning resources.',
    illustration: require('../../assets/onboarding-growth.png'),
  },
]

const ONBOARDING_KEY = '@gileo/onboarding-completed';
const LEGACY_ONBOARDING_KEY = '@vitaltron/onboarding-completed';
const AUTO_ADVANCE_DELAY = 5500; // Give users time to read before moving on

export default function OnboardingScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const slide = slides[activeIndex];

  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentTranslate = useRef(new Animated.Value(0)).current;
  const illustrationScale = useRef(new Animated.Value(1)).current;
  const illustrationFloat = useRef(new Animated.Value(0)).current;
  const indicatorProgress = useRef(
    slides.map((_, index) => new Animated.Value(index === 0 ? 1 : 0)),
  ).current;

  // Floating animation
  useEffect(() => {
    const floating = Animated.loop(
      Animated.sequence([
        Animated.timing(illustrationFloat, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(illustrationFloat, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    floating.start();
    return () => floating.stop();
  }, [illustrationFloat]);

  // Auto-advance through the slides, then stop on the final slide.
  useEffect(() => {
    if (activeIndex >= slides.length - 1) return;
    const timer = setTimeout(() => {
      setActiveIndex((current) => Math.min(current + 1, slides.length - 1));
    }, AUTO_ADVANCE_DELAY);
    return () => clearTimeout(timer);
  }, [activeIndex]);

  // Transition animations when activeIndex changes
  useEffect(() => {
    contentOpacity.setValue(0);
    contentTranslate.setValue(16);
    illustrationScale.setValue(0.92);

    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslate, {
        toValue: 0,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(illustrationScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      ...indicatorProgress.map((value, index) =>
        Animated.spring(value, {
          toValue: index === activeIndex ? 1 : 0,
          friction: 8,
          tension: 50,
          useNativeDriver: false,
        }),
      ),
    ]).start();
  }, [activeIndex, contentOpacity, contentTranslate, illustrationScale, indicatorProgress]);

  const finishOnboarding = async (targetRoute?: '/login' | '/register' | '/welcome') => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      await AsyncStorage.multiSet([
        [ONBOARDING_KEY, 'true'],
        [LEGACY_ONBOARDING_KEY, 'true'],
      ]);
      const token = await getStoredAccessToken();
      if (token) {
        router.replace('/(tabs)');
      } else {
        router.replace(targetRoute || '/welcome');
      }
    } catch {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/gileo-logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Gileo Logo"
          />

          <Pressable
            accessibilityRole="button"
            onPress={() => void finishOnboarding('/login')}
            disabled={isSaving}
            hitSlop={10}
            style={styles.skipButton}
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        {/* Main Content Area */}
        <View style={styles.mainContent}>
          {/* Illustration Area */}
          <Animated.View
            style={[
              styles.illustrationArea,
              {
                opacity: contentOpacity,
                transform: [
                  { scale: illustrationScale },
                  {
                    translateY: illustrationFloat.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -6],
                    }),
                  },
                ],
              },
            ]}
          >
            <Image
              source={slide.illustration}
              resizeMode="contain"
              style={styles.illustrationImage}
              accessibilityLabel={slide.title}
            />
          </Animated.View>

          {/* Text & Indicators Area */}
          <Animated.View
            style={[
              styles.textContainer,
              {
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslate }],
              },
            ]}
          >
            <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.description}>{slide.description}</Text>

            {/* Pagination Indicator Dots */}
            <View style={styles.indicators}>
              {slides.map((item, index) => {
                const indicatorWidth = indicatorProgress[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [6, 24],
                });

                return (
                  <Animated.View
                    key={item.eyebrow}
                    style={[
                      styles.indicatorDot,
                      {
                        width: indicatorWidth,
                        backgroundColor:
                          index === activeIndex ? '#F10505' : '#E2E8F0',
                      },
                    ]}
                  />
                );
              })}
            </View>
          </Animated.View>
        </View>

        {/* Action Footer */}
        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            onPress={() => void finishOnboarding('/login')}
            disabled={isSaving}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>Access Your Account</Text>
          </Pressable>

          <View style={styles.signupRow}>
            <Text style={styles.signupPrompt}>Don't have an account?</Text>
            <Pressable
              accessibilityRole="link"
              onPress={() => void finishOnboarding('/register')}
              hitSlop={8}
            >
              <Text style={styles.signupLink}> Signup</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    width: 120,
    height: 40,
    marginLeft: -16,
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FAFAFA',
  },
  skipText: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  illustrationArea: {
    width: '100%',
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  illustrationImage: {
    width: '100%',
    height: '100%',
    maxWidth: 320,
    maxHeight: 250,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  eyebrow: {
    color: '#F10505',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 10,
  },
  title: {
    color: '#0F172A',
    fontSize: 27,
    fontWeight: '700',
    letterSpacing: -0.6,
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 310,
    marginBottom: 24,
  },
  indicators: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  indicatorDot: {
    height: 6,
    borderRadius: 999,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
    paddingTop: 8,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    borderRadius: 999,
    backgroundColor: '#F10505',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  primaryButtonPressed: {
    backgroundColor: '#5E162B',
    transform: [{ scale: 0.985 }],
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  signupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupPrompt: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '400',
  },
  signupLink: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
});
