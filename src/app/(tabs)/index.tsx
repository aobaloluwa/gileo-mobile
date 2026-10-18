import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../theme';

function FeatureCard({
  icon,
  title,
  description,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.featureCard, pressed && styles.cardPressed]}
    >
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
      <View style={styles.featureArrow}>
        <Ionicons name="arrow-forward" size={17} color={colors.primary} />
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 17) return 'Good afternoon,';
    return 'Good evening,';
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <FontAwesome name="heart" size={16} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.brandName}>vitaltron</Text>
              <Text style={styles.brandTagline}>YOUR HEALTH, YOUR HANDS.</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={() => {}}
            style={styles.iconButton}
          >
            <Ionicons name="notifications-outline" size={21} color={colors.text} />
            <View style={styles.notificationDot} />
          </Pressable>
        </View>

        <View style={styles.welcomeBlock}>
          <Text style={styles.eyebrow}>YOUR PERSONAL HEALTH SPACE</Text>
          <Text style={styles.welcomeTitle}>{greeting}</Text>
          <Text style={styles.welcomeTitle}>Welcome back.</Text>
          <Text style={styles.welcomeSubtitle}>
            Your health journey, all in one place.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(tabs)/profile')}
          style={({ pressed }) => [styles.profileCard, pressed && styles.cardPressed]}
        >
          <View style={styles.profileCardTop}>
            <View style={styles.profileIcon}>
              <Ionicons name="heart-outline" size={23} color="#79623F" />
            </View>
            <View style={styles.profileCardCopy}>
              <Text style={styles.profileCardTitle}>Your health profile</Text>
              <Text style={styles.profileCardSubtitle}>Make your health information your own</Text>
            </View>
            <Ionicons name="arrow-forward" size={19} color="#79623F" />
          </View>
          <Text style={styles.profileCardBody}>
            Add your essential details so your health information is ready when you need it.
          </Text>
          <View style={styles.profileProgressTrack}>
            <View style={styles.profileProgressFill} />
          </View>
          <View style={styles.profileCardBottom}>
            <Text style={styles.profileProgressLabel}>Profile setup</Text>
            <Text style={styles.profileProgressValue}>Get started</Text>
          </View>
        </Pressable>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>Your health, at a glance</Text>
            <Text style={styles.sectionSubtitle}>A few useful places to start</Text>
          </View>
        </View>

        <View style={styles.featureGrid}>
          <FeatureCard
            icon="folder-open-outline"
            title="Health records"
            description="Visits, tests and medical history"
            onPress={() => router.push('/(tabs)/records')}
          />
          <FeatureCard
            icon="calendar-outline"
            title="Women's health"
            description="Cycles, pregnancy and planning"
            onPress={() => router.push('/(tabs)/womens-health')}
          />
          <FeatureCard
            icon="pulse-outline"
            title="Vitals"
            description="Keep track of key measurements"
            onPress={() => router.push('/(tabs)/records')}
          />
          <FeatureCard
            icon="qr-code-outline"
            title="Health identity"
            description="Your portable health profile"
            onPress={() => router.push('/(tabs)/profile')}
          />
        </View>

        <View style={styles.privacyNote}>
          <View style={styles.privacyIcon}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
          </View>
          <View style={styles.privacyCopy}>
            <Text style={styles.privacyTitle}>Your health. Your control.</Text>
            <Text style={styles.privacyText}>
              Your health information deserves privacy. You decide what to add and share.
            </Text>
          </View>
        </View>

        <Text style={styles.footerNote}>A little more care, every day.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  brandMark: {
    width: 38, height: 38, borderRadius: 13, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  brandName: {
    color: colors.text, fontSize: 21, fontFamily: 'Inter_700Bold', letterSpacing: -0.7,
  },
  brandTagline: {
    color: colors.textSecondary, fontSize: 8, fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1.1, marginTop: 2,
  },
  iconButton: {
    width: 43, height: 43, borderRadius: 22, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute', top: 9, right: 10, width: 7, height: 7,
    borderRadius: 4, backgroundColor: '#B58A50',
  },
  welcomeBlock: { marginBottom: spacing.xl },
  eyebrow: {
    color: '#8A7045', fontSize: 10, fontFamily: 'Inter_700Bold',
    letterSpacing: 1.6, marginBottom: spacing.md,
  },
  welcomeTitle: {
    color: colors.text, fontSize: 30, lineHeight: 36,
    fontFamily: 'Inter_700Bold', letterSpacing: -1,
  },
  welcomeSubtitle: {
    color: colors.textSecondary, fontSize: typography.body,
    fontFamily: 'Inter_400Regular', lineHeight: 22, marginTop: spacing.sm,
  },
  profileCard: {
    backgroundColor: '#EEE8DB', borderRadius: 23, padding: spacing.lg,
    marginBottom: spacing.xxl, borderWidth: 1, borderColor: '#E5DDCE',
  },
  profileCardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  profileIcon: {
    width: 44, height: 44, borderRadius: 15, backgroundColor: '#FBF9F4',
    alignItems: 'center', justifyContent: 'center',
  },
  profileCardCopy: { flex: 1, gap: 4 },
  profileCardTitle: { color: '#292923', fontSize: 15, fontFamily: 'Inter_700Bold' },
  profileCardSubtitle: {
    color: '#716D63', fontSize: 11, lineHeight: 16, fontFamily: 'Inter_400Regular',
  },
  profileCardBody: {
    color: '#514D43', fontSize: 12, lineHeight: 19,
    fontFamily: 'Inter_400Regular', marginTop: spacing.md,
  },
  profileProgressTrack: {
    height: 5, borderRadius: 3, backgroundColor: '#DAD1C0',
    marginTop: spacing.lg, overflow: 'hidden',
  },
  profileProgressFill: { width: '18%', height: '100%', backgroundColor: '#8A7045', borderRadius: 3 },
  profileCardBottom: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: spacing.sm, alignItems: 'center',
  },
  profileProgressLabel: { color: '#716D63', fontSize: 11, fontFamily: 'Inter_500Medium' },
  profileProgressValue: { color: '#6D5634', fontSize: 12, fontFamily: 'Inter_700Bold' },
  sectionHeading: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: { color: colors.text, fontSize: 18, fontFamily: 'Inter_700Bold', letterSpacing: -0.4 },
  sectionSubtitle: {
    color: colors.textSecondary, fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 4,
  },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  featureCard: {
    width: '47.5%', minHeight: 164, flexGrow: 1, flexBasis: '44%',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 19, padding: spacing.md, position: 'relative',
  },
  cardPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  featureIcon: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: '#F2EFE7',
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
  },
  featureTitle: { color: colors.text, fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 5 },
  featureDescription: {
    color: colors.textSecondary, fontSize: 11, lineHeight: 16,
    fontFamily: 'Inter_400Regular', paddingRight: 2,
  },
  featureArrow: { position: 'absolute', right: 13, top: 14 },
  privacyNote: {
    flexDirection: 'row', gap: spacing.md, padding: spacing.md,
    borderRadius: 17, backgroundColor: '#F0EEE7', marginTop: spacing.xl,
  },
  privacyIcon: {
    width: 34, height: 34, borderRadius: 12, backgroundColor: '#FAF8F2',
    alignItems: 'center', justifyContent: 'center',
  },
  privacyCopy: { flex: 1, gap: 4 },
  privacyTitle: { color: colors.text, fontSize: 12, fontFamily: 'Inter_700Bold' },
  privacyText: { color: colors.textSecondary, fontSize: 11, lineHeight: 17, fontFamily: 'Inter_400Regular' },
  footerNote: {
    color: colors.textSecondary, textAlign: 'center', fontSize: 11,
    fontFamily: 'Inter_400Regular', marginTop: spacing.xl,
  },
});
