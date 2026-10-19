import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../theme';

type Pillar = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  tint: string;
  iconColor: string;
};

const pillars: Pillar[] = [
  {
    icon: 'medkit-outline',
    title: 'Healthcare Services',
    description: 'Care support and service requests',
    tint: '#F7E8EB',
    iconColor: '#761B36',
  },
  {
    icon: 'bag-handle-outline',
    title: 'Medical Marketplace',
    description: 'Scrubs, equipment and essentials',
    tint: '#F7F0DE',
    iconColor: '#8A6824',
  },
  {
    icon: 'people-outline',
    title: 'Nurses Community',
    description: 'Connect, share and learn together',
    tint: '#E8F0EA',
    iconColor: '#3F7656',
  },
  {
    icon: 'school-outline',
    title: 'Learning & Elevate',
    description: 'Build skills and grow your career',
    tint: '#EAEAF7',
    iconColor: '#5A58A0',
  },
];

function PillarCard({ item, onPress }: { item: Pillar; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.pillarCard, pressed && styles.cardPressed]}
    >
      <View style={[styles.pillarIcon, { backgroundColor: item.tint }]}>
        <Ionicons name={item.icon} size={23} color={item.iconColor} />
      </View>
      <Text style={styles.pillarTitle}>{item.title}</Text>
      <Text style={styles.pillarDescription}>{item.description}</Text>
      <View style={styles.pillarArrow}>
        <Ionicons name="arrow-redo-outline" size={17} color={colors.primary} />
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Image
            source={require('../../assets/gileo-logo.png')}
            style={styles.brandLogo}
            resizeMode="contain"
            accessibilityLabel="Gileo Medicals"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={() => router.push('/explore')}
            style={({ pressed }) => [styles.iconButton, pressed && styles.cardPressed]}
          >
            <Ionicons name="notifications-outline" size={21} color={colors.text} />
            <View style={styles.notificationDot} />
          </Pressable>
        </View>

        <View style={styles.welcomeBlock}>
          <Text style={styles.eyebrow}>YOUR HEALTH. YOUR COMMUNITY. YOUR GROWTH.</Text>
          <Text style={styles.welcomeTitle}>{greeting},</Text>
          <Text style={styles.welcomeTitleAccent}>welcome to GILEO.</Text>
          <Text style={styles.welcomeSubtitle}>
            Healthcare, medical essentials, community and professional learning — connected in one place.
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
              <Text style={styles.profileCardTitle}>Make GILEO yours</Text>
              <Text style={styles.profileCardSubtitle}>Start with your personal health profile</Text>
            </View>
            <Ionicons name="arrow-forward" size={19} color="#79623F" />
          </View>
          <Text style={styles.profileCardBody}>
            Add your essential details so your information is ready when you need it.
          </Text>
        </Pressable>

        <View style={styles.sectionHeading}>
          <View style={styles.sectionCopy}>
            <Text style={styles.sectionTitle}>Explore GILEO</Text>
            <Text style={styles.sectionSubtitle}>Everything you need, all in one ecosystem</Text>
          </View>
        </View>

        <View style={styles.pillarGrid}>
          {pillars.map((item) => (
            <PillarCard
              key={item.title}
              item={item}
              onPress={() => router.push('/explore')}
            />
          ))}
        </View>

        <View style={styles.sectionHeadingHealth}>
          <View>
            <Text style={styles.sectionTitle}>Your health space</Text>
            <Text style={styles.sectionSubtitle}>Quick access to your personal tools</Text>
          </View>
        </View>

        <View style={styles.quickLinks}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(tabs)/records')}
            style={({ pressed }) => [styles.quickLink, pressed && styles.cardPressed]}
          >
            <View style={[styles.quickIcon, { backgroundColor: '#F7E8EB' }]}>
              <Ionicons name="folder-open-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.quickCopy}>
              <Text style={styles.quickTitle}>Health records</Text>
              <Text style={styles.quickDescription}>Visits, tests and medical history</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(tabs)/womens-health')}
            style={({ pressed }) => [styles.quickLink, pressed && styles.cardPressed]}
          >
            <View style={[styles.quickIcon, { backgroundColor: '#F7F0DE' }]}>
              <Ionicons name="flower-outline" size={20} color="#8A6824" />
            </View>
            <View style={styles.quickCopy}>
              <Text style={styles.quickTitle}>Women's health</Text>
              <Text style={styles.quickDescription}>Cycles, pregnancy and planning</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>
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
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  brandLogo: { width: 148, height: 44, marginLeft: -10 },
  iconButton: {
    width: 43, height: 43, borderRadius: 22, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  notificationDot: { position: 'absolute', top: 9, right: 10, width: 7, height: 7, borderRadius: 4, backgroundColor: '#B58A50' },
  welcomeBlock: { marginBottom: spacing.xl },
  eyebrow: { color: '#8A7045', fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 1.25, marginBottom: spacing.md },
  welcomeTitle: { color: colors.text, fontSize: 29, lineHeight: 35, fontFamily: 'Inter_700Bold', letterSpacing: -0.9 },
  welcomeTitleAccent: { color: colors.primary, fontSize: 29, lineHeight: 35, fontFamily: 'Inter_700Bold', letterSpacing: -0.9 },
  welcomeSubtitle: { color: colors.textSecondary, fontSize: typography.body, fontFamily: 'Inter_400Regular', lineHeight: 23, marginTop: spacing.md },
  profileCard: { backgroundColor: '#EEE8DB', borderRadius: 23, padding: spacing.lg, marginBottom: spacing.xxl, borderWidth: 1, borderColor: '#E5DDCE' },
  profileCardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  profileIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#FBF9F4', alignItems: 'center', justifyContent: 'center' },
  profileCardCopy: { flex: 1, gap: 4 },
  profileCardTitle: { color: '#292923', fontSize: 15, fontFamily: 'Inter_700Bold' },
  profileCardSubtitle: { color: '#716D63', fontSize: 11, lineHeight: 16, fontFamily: 'Inter_400Regular' },
  profileCardBody: { color: '#514D43', fontSize: 12, lineHeight: 19, fontFamily: 'Inter_400Regular', marginTop: spacing.md },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  sectionHeadingHealth: { marginTop: spacing.xxl, marginBottom: spacing.md },
  sectionCopy: { flex: 1 },
  sectionTitle: { color: colors.text, fontSize: 19, fontFamily: 'Inter_700Bold', letterSpacing: -0.4 },
  sectionSubtitle: { color: colors.textSecondary, fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 5 },
  pillarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  pillarCard: {
    width: '47%', minHeight: 166, flexGrow: 1, flexBasis: '44%',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 20, padding: spacing.md, position: 'relative',
  },
  cardPressed: { opacity: 0.84, transform: [{ scale: 0.99 }] },
  pillarIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  pillarTitle: { color: colors.text, fontSize: 13, lineHeight: 18, fontFamily: 'Inter_700Bold', paddingRight: 8, marginBottom: 5 },
  pillarDescription: { color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontFamily: 'Inter_400Regular', paddingRight: 4 },
  pillarArrow: { position: 'absolute', right: 12, top: 13 },
  quickLinks: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md },
  quickLink: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  quickIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  quickCopy: { flex: 1, gap: 4 },
  quickTitle: { color: colors.text, fontSize: 13, fontFamily: 'Inter_700Bold' },
  quickDescription: { color: colors.textSecondary, fontSize: 11, fontFamily: 'Inter_400Regular' },
  privacyNote: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, borderRadius: 17, backgroundColor: '#F0EEE7', marginTop: spacing.xl },
  privacyIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#FAF8F2', alignItems: 'center', justifyContent: 'center' },
  privacyCopy: { flex: 1, gap: 4 },
  privacyTitle: { color: colors.text, fontSize: 12, fontFamily: 'Inter_700Bold' },
  privacyText: { color: colors.textSecondary, fontSize: 11, lineHeight: 17, fontFamily: 'Inter_400Regular' },
  footerNote: { color: colors.textSecondary, textAlign: 'center', fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: spacing.xl },
});
