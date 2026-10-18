import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme';

const features = [
  { icon: 'calendar-outline' as const, title: 'Cycle tracking', description: 'Log periods and track your cycle patterns.' },
  { icon: 'leaf-outline' as const, title: 'Family planning', description: 'Keep notes about your chosen method and reminders.' },
  { icon: 'heart-outline' as const, title: 'Pregnancy journey', description: 'Organise pregnancy details, antenatal visits and notes.' },
  { icon: 'flower-outline' as const, title: 'Postnatal care', description: 'Keep track of follow-ups and recovery milestones.' },
];

export default function WomensHealthScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>CARE THAT CENTRES YOU</Text>
        <Text style={styles.title}>Women's health</Text>
        <Text style={styles.subtitle}>Support for your health journey, through every stage of life.</Text>
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Ionicons name="flower-outline" size={27} color="#79623F" /></View>
          <Text style={styles.heroTitle}>Your journey, your pace.</Text>
          <Text style={styles.heroText}>Choose the areas that matter to you. You stay in control of what you record and share.</Text>
        </View>
        {features.map((item) => (
          <View key={item.title} style={styles.row}>
            <View style={styles.iconBox}><Ionicons name={item.icon} size={22} color={colors.primary} /></View>
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowDescription}>{item.description}</Text>
              <Text style={styles.comingSoon}>FEATURE SETUP COMING NEXT</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </View>
        ))}
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
  hero: { backgroundColor: '#EEE8DB', borderRadius: 22, padding: spacing.lg, marginBottom: spacing.lg },
  heroIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#FBF9F4', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  heroTitle: { color: '#292923', fontSize: 17, fontFamily: 'Inter_700Bold', marginBottom: spacing.sm },
  heroText: { color: '#716D63', fontSize: 12, lineHeight: 19, fontFamily: 'Inter_400Regular' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F0EEE7', alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, gap: 4 },
  rowTitle: { color: colors.text, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  rowDescription: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, fontFamily: 'Inter_400Regular' },
  comingSoon: { color: '#8A7045', fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 0.8, marginTop: 3 },
});
