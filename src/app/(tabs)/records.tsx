import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../theme';

const sections = [
  { icon: 'medkit-outline' as const, title: 'Medications & allergies', description: 'Keep track of medicines and known allergies.' },
  { icon: 'flask-outline' as const, title: 'Laboratory results', description: 'Store test results and review them when needed.' },
  { icon: 'fitness-outline' as const, title: 'Vitals', description: 'Record measurements such as blood pressure and weight.' },
  { icon: 'calendar-outline' as const, title: 'Visits & vaccinations', description: 'Keep appointments, clinical visits and vaccination details together.' },
];

export default function RecordsScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>YOUR HEALTH HISTORY</Text>
        <Text style={styles.title}>Health records</Text>
        <Text style={styles.subtitle}>Your important health information, organised in one place.</Text>
        <View style={styles.notice}>
          <Ionicons name="folder-open-outline" size={23} color={colors.primary} />
          <View style={styles.noticeCopy}>
            <Text style={styles.noticeTitle}>Your record starts here</Text>
            <Text style={styles.noticeText}>Your records will appear here as you add them. No medical data is being shown until it is available.</Text>
          </View>
        </View>
        {sections.map((item) => (
          <View key={item.title} style={styles.row}>
            <View style={styles.iconBox}><Ionicons name={item.icon} size={22} color={colors.primary} /></View>
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowDescription}>{item.description}</Text>
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
  notice: { flexDirection: 'row', gap: spacing.md, backgroundColor: '#EEE8DB', borderRadius: 20, padding: spacing.lg, marginBottom: spacing.lg },
  noticeCopy: { flex: 1, gap: 5 },
  noticeTitle: { color: colors.text, fontSize: 14, fontFamily: 'Inter_700Bold' },
  noticeText: { color: '#716D63', fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  iconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F0EEE7', alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, gap: 4 },
  rowTitle: { color: colors.text, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  rowDescription: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, fontFamily: 'Inter_400Regular' },
});
