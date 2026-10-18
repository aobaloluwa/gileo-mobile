import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme';

const profileItems = [
  { icon: 'person-outline' as const, title: 'Personal details', description: 'Name, date of birth and contact information' },
  { icon: 'card-outline' as const, title: 'Health identity', description: 'Your portable health identity and emergency details' },
  { icon: 'people-outline' as const, title: 'Trusted access', description: 'Manage who can access selected information' },
  { icon: 'shield-checkmark-outline' as const, title: 'Privacy & security', description: 'Review your privacy and account security' },
];

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>YOUR ACCOUNT</Text>
        <Text style={styles.title}>Your profile</Text>
        <Text style={styles.subtitle}>Manage your details and how your health information is used.</Text>
        <View style={styles.identityCard}>
          <View style={styles.avatar}><FontAwesome name="heart" size={22} color="#FFFFFF" /></View>
          <View style={styles.identityCopy}>
            <Text style={styles.identityTitle}>Your health identity</Text>
            <Text style={styles.identitySubtitle}>Personal details haven't been added yet.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#79623F" />
        </View>
        {profileItems.map((item) => (
          <Pressable key={item.title} accessibilityRole="button" onPress={() => {}} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <View style={styles.iconBox}><Ionicons name={item.icon} size={21} color={colors.primary} /></View>
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowDescription}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </Pressable>
        ))}
        <Pressable accessibilityRole="button" onPress={() => router.replace('/login')} style={styles.signOutButton}>
          <Ionicons name="log-out-outline" size={19} color={colors.error} />
          <Text style={styles.signOutText}>Return to login</Text>
        </Pressable>
        <Text style={styles.footer}>Your health information belongs to you.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing.xxl },
  eyebrow: { color: '#8A7045', fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1.6, marginTop: spacing.md, marginBottom: spacing.sm },
  title: { color: colors.text, fontSize: 29, fontFamily: 'Inter_700Bold', letterSpacing: -0.8 },
  subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 22, fontFamily: 'Inter_400Regular', marginTop: spacing.sm, marginBottom: spacing.xl },
  identityCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: '#EEE8DB', borderRadius: 20, padding: spacing.lg, marginBottom: spacing.lg },
  avatar: { width: 48, height: 48, borderRadius: 17, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  identityCopy: { flex: 1, gap: 4 },
  identityTitle: { color: '#292923', fontSize: 14, fontFamily: 'Inter_700Bold' },
  identitySubtitle: { color: '#716D63', fontSize: 11, lineHeight: 16, fontFamily: 'Inter_400Regular' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  pressed: { opacity: 0.75 },
  iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F0EEE7', alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, gap: 4 },
  rowTitle: { color: colors.text, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  rowDescription: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, fontFamily: 'Inter_400Regular' },
  signOutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, minHeight: 52, borderRadius: 999, borderWidth: 1, borderColor: '#E8D2D2', marginTop: spacing.xxl, backgroundColor: '#FFF8F8' },
  signOutText: { color: colors.error, fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  footer: { color: colors.textSecondary, textAlign: 'center', fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: spacing.xl },
});
