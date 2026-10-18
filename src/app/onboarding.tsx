
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const slides = [
  {
    eyebrow: 'YOUR HEALTH, YOUR STORY',
    title: 'Your health,\nin your hands.',
    description:
      'Keep your personal health information close, secure, and ready whenever you need it.',
    icon: 'heart-outline' as const,
    accentIcon: 'pulse' as const,
  },
  {
    eyebrow: 'EVERYTHING IN ONE PLACE',
    title: 'Your health story,\nall together.',
    description:
      'Keep track of your health records, appointments, medicines, and important milestones in one place.',
    icon: 'document-text-outline' as const,
    accentIcon: 'folder-open-outline' as const,
  },
  {
    eyebrow: 'SHARED ON YOUR TERMS',
    title: 'Your records.\nYour choice.',
    description:
      'Choose when and what to share with healthcare professionals, while keeping control of your information.',
    icon: 'shield-checkmark-outline' as const,
    accentIcon: 'people-outline' as const,
  },
];

const ONBOARDING_KEY = '@vitaltron/onboarding-completed';

export default function OnboardingScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const { width, height } = useWindowDimensions();
  const slide = slides[activeIndex];

  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentTranslate = useRef(new Animated.Value(0)).current;
  const illustrationScale = useRef(new Animated.Value(1)).current;
  const illustrationRotate = useRef(new Animated.Value(0)).current;
  const indicatorProgress = useRef(
    slides.map((_, index) => new Animated.Value(index === 0 ? 1 : 0)),
  ).current;

  useEffect(() => {
    contentOpacity.setValue(0);
    contentTranslate.setValue(18);
    illustrationScale.setValue(0.88);
    illustrationRotate.setValue(0);

    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslate, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(illustrationScale, {
        toValue: 1,
        speed: 12,
        bounciness: 7,
        useNativeDriver: true,
      }),
      Animated.timing(illustrationRotate, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      ...indicatorProgress.map((value, index) =>
        Animated.spring(value, {
          toValue: index === activeIndex ? 1 : 0,
          speed: 18,
          bounciness: 0,
          useNativeDriver: false,
        }),
      ),
    ]).start();
  }, [
    activeIndex,
    contentOpacity,
    contentTranslate,
    illustrationScale,
    illustrationRotate,
    indicatorProgress,
  ]);

  const finishOnboarding = async () => {
    if (isSaving) return;

    setIsSaving(true);

    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      router.replace('/welcome');
    } catch {
      setIsSaving(false);
    }
  };

  const goNext = () => {
    if (activeIndex < slides.length - 1) {
      setActiveIndex((current) => current + 1);
    } else {
      void finishOnboarding();
    }
  };

  const illustrationSize = Math.min(width * 0.62, height * 0.32, 260);

  const rotate = illustrationRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-7deg', '0deg'],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <View style={styles.brand}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>v</Text>
            </View>
            <Text style={styles.brandName}>vitaltron</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => void finishOnboarding()}
            disabled={isSaving}
            hitSlop={12}
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Animated.View
            style={[
              styles.illustrationArea,
              {
                opacity: contentOpacity,
                transform: [
                  { scale: illustrationScale },
                  { rotate },
                ],
              },
            ]}
          >
            <View
              style={[
                styles.illustrationCircle,
                {
                  width: illustrationSize,
                  height: illustrationSize,
                  borderRadius: illustrationSize / 2,
                },
              ]}
            >
              <View style={styles.sunShape} />

              <View style={styles.orbitRing}>
                <View style={styles.mainIconCircle}>
                  <Ionicons
                    name={slide.icon}
                    size={illustrationSize * 0.38}
                    color="#242424"
                  />
                </View>
              </View>

              <View style={styles.accentIconCircle}>
                <Ionicons
                  name={slide.accentIcon}
                  size={29}
                  color="#242424"
                />
              </View>

              <View style={styles.smallGoldDot} />
              <View style={styles.smallDarkDot} />
            </View>
          </Animated.View>

          <View style={styles.textContent}>
            <View style={styles.indicators}>
              {slides.map((item, index) => {
                const indicatorWidth = indicatorProgress[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [7, 26],
                });

                return (
                  <Animated.View
                    key={item.eyebrow}
                    style={[
                      styles.indicator,
                      {
                        width: indicatorWidth,
                        backgroundColor:
                          index === activeIndex ? '#111111' : '#D4D4D4',
                      },
                    ]}
                  />
                );
              })}
            </View>

            <Animated.View
              style={{
                alignItems: 'center',
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslate }],
              }}
            >
              <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.description}>{slide.description}</Text>
            </Animated.View>
          </View>

          <View style={styles.cardFooter}>
            <Pressable
              accessibilityRole="button"
              onPress={() => void finishOnboarding()}
              disabled={isSaving}
              style={styles.skipButton}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={goNext}
              disabled={isSaving}
              style={({ pressed }) => [
                styles.nextButton,
                pressed && styles.nextButtonPressed,
                isSaving && styles.buttonDisabled,
              ]}
            >
              <Text style={styles.nextButtonText}>
                {activeIndex === slides.length - 1
                  ? 'Get Started'
                  : 'Next'}
              </Text>
              {activeIndex !== slides.length - 1 && (
                <Ionicons
                  name="arrow-forward"
                  size={17}
                  color="#FFFFFF"
                />
              )}
            </Pressable>
          </View>
        </View>

        <Text style={styles.footerNote}>
          YOUR HEALTH. YOUR CHOICE.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screen: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandMark: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  brandName: {
    color: '#111111',
    fontSize: 19,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.6,
  },
  skipText: {
    color: '#333333',
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    textTransform: 'uppercase',
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 34,
    paddingHorizontal: 25,
    paddingTop: 18,
    paddingBottom: 22,
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  illustrationArea: {
    flex: 1,
    minHeight: 170,
    maxHeight: 330,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationCircle: {
    backgroundColor: '#F2EEE5',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sunShape: {
    position: 'absolute',
    top: '12%',
    right: '12%',
    width: '28%',
    height: '28%',
    borderRadius: 999,
    backgroundColor: '#E8D6A6',
  },
  orbitRing: {
    width: '70%',
    height: '70%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(17,17,17,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainIconCircle: {
    width: '88%',
    height: '88%',
    borderRadius: 999,
    backgroundColor: '#E6C779',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentIconCircle: {
    position: 'absolute',
    bottom: '2%',
    right: '1%',
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E1D5',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  smallGoldDot: {
    position: 'absolute',
    left: '5%',
    top: '20%',
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: '#D5AE54',
  },
  smallDarkDot: {
    position: 'absolute',
    bottom: '8%',
    left: '15%',
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#38342C',
  },
  textContent: {
    width: '100%',
    alignItems: 'center',
  },
  indicators: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginBottom: 22,
  },
  indicator: {
    height: 7,
    borderRadius: 4,
  },
  eyebrow: {
    color: '#777777',
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.4,
    textAlign: 'center',
    marginBottom: 14,
  },
  title: {
    color: '#111111',
    fontSize: 29,
    lineHeight: 37,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.9,
    textAlign: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  description: {
    color: '#666666',
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    maxWidth: 300,
    marginTop: 13,
    marginBottom: 18,
  },
  cardFooter: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  skipButton: {
    minHeight: 48,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    color: '#111111',
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
  },
  nextButton: {
    minHeight: 52,
    minWidth: 112,
    paddingHorizontal: 22,
    borderRadius: 999,
    backgroundColor: '#080808',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  nextButtonPressed: {
    backgroundColor: '#333333',
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footerNote: {
    color: '#777777',
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 2,
    textAlign: 'center',
    paddingTop: 12,
  },
});
