import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';

const destinations = [
  {
    icon: 'medkit-outline' as const,
    title: 'Healthcare Services',
    description: 'Tell us what care you need, and our team can guide you through the next steps.',
    color: '#F7E8EB',
    iconColor: '#761B36',
    action: 'View health tools',
    onPress: () => router.push('/(tabs)/services'),
  },
  {
    icon: 'bag-handle-outline' as const,
    title: 'Gileo Marketplace',
    description: 'Discover the vision for scrubs, medical wear, equipment and everyday clinical essentials.',
    color: '#F7F0DE',
    iconColor: '#8A6824',
    action: 'Contact our team',
    onPress: () => { void Linking.openURL('tel:+2348165335594'); },
  },
  {
    icon: 'people-outline' as const,
    title: 'Gileo Nurses Community',
    description: 'A space for nurses to connect, share useful resources and support professional growth.',
    color: '#E8F0EA',
    iconColor: '#3F7656',
    action: 'Contact our team',
    onPress: () => { void Linking.openURL('tel:+2348165335594'); },
  },
  {
    icon: 'school-outline' as const,
    title: 'Learning Hub & Gileo Elevate',
    description: 'Explore learning resources, e-books and structured professional development opportunities.',
    color: '#EAEAF7',
    iconColor: '#5A58A0',
    action: 'Contact our team',
    onPress: () => { void Linking.openURL('tel:+2348165335594'); },
  },
];

export default function ExploreScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.headerMark}>
            <Ionicons name="compass-outline" size={23} color="#FFFFFF" />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>DISCOVER MORE</Text>
            <Text style={styles.title}>Explore GILEO</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>
          One connected ecosystem for care, clinical essentials, nursing community and lifelong learning.
        </Text>

        <View style={styles.noteCard}>
          <View style={styles.noteIcon}>
            <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.noteCopy}>
            <Text style={styles.noteTitle}>A little more connected</Text>
            <Text style={styles.noteBody}>
              Choose an area below to learn more. For availability, service requests or product enquiries, our team can help.
            </Text>
          </View>
        </View>

        <View style={styles.destinationList}>
          {destinations.map((item) => (
            <View key={item.title} style={styles.destinationCard}>
              <View style={[styles.destinationIcon, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon} size={24} color={item.iconColor} />
              </View>
              <Text style={styles.destinationTitle}>{item.title}</Text>
              <Text style={styles.destinationDescription}>{item.description}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={item.onPress}
                style={({ pressed }) => [styles.destinationAction, pressed && styles.actionPressed]}
              >
                <Text style={styles.destinationActionText}>{item.action}</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.primary} />
              </Pressable>
            </View>
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => { void Linking.openURL('tel:+2348165335594'); }}
          style={({ pressed }) => [styles.supportCard, pressed && styles.actionPressed]}
        >
          <View style={styles.supportIcon}>
            <Ionicons name="call-outline" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.supportCopy}>
            <Text style={styles.supportTitle}>Need a hand?</Text>
            <Text style={styles.supportSubtitle}>Speak with GILEO support</Text>
            <Text style={styles.supportNumber}>+234 816 533 5594</Text>
          </View>
          <Ionicons name="arrow-redo-outline" size={20} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.footer}>GILEO MEDICALS GLOBAL LIMITED</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerMark: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, gap: 3 },
  eyebrow: { color: '#8A7045', fontSize: 10, letterSpacing: 1.6, fontFamily: 'Inter_700Bold' },
  title: { color: colors.text, fontSize: 27, letterSpacing: -0.8, fontFamily: 'Inter_700Bold' },
  subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 22, marginTop: spacing.lg, marginBottom: spacing.xl, fontFamily: 'Inter_400Regular' },
  noteCard: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, borderRadius: 20, backgroundColor: '#EEE8DB', borderWidth: 1, borderColor: '#E5DDCE', marginBottom: spacing.xl },
  noteIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#FBF9F4', alignItems: 'center', justifyContent: 'center' },
  noteCopy: { flex: 1, gap: 5 },
  noteTitle: { color: '#292923', fontSize: 14, fontFamily: 'Inter_700Bold' },
  noteBody: { color: '#625D52', fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular' },
  destinationList: { gap: spacing.md },
  destinationCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 21, padding: spacing.lg },
  destinationIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  destinationTitle: { color: colors.text, fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: -0.2 },
  destinationDescription: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, fontFamily: 'Inter_400Regular', marginTop: spacing.sm },
  destinationAction: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginTop: spacing.md, minHeight: 38 },
  destinationActionText: { color: colors.primary, fontSize: 12, fontFamily: 'Inter_700Bold' },
  actionPressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
  supportCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.primary, borderRadius: 21, padding: spacing.lg, marginTop: spacing.xl },
  supportIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  supportCopy: { flex: 1, gap: 4 },
  supportTitle: { color: '#FFFFFF', fontSize: 15, fontFamily: 'Inter_700Bold' },
  supportSubtitle: { color: '#F4DDE3', fontSize: 11, fontFamily: 'Inter_400Regular' },
  supportNumber: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Inter_600SemiBold', marginTop: 2 },
  footer: { color: colors.textSecondary, textAlign: 'center', fontSize: 9, letterSpacing: 1.4, marginTop: spacing.xl, fontFamily: 'Inter_600SemiBold' },
});
