import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';

const pillars = [
  {
    id: 'services',
    icon: 'heart-outline' as const,
    activeIcon: 'heart' as const,
    title: 'Healthcare',
    subtitle: 'Home care & nursing',
    bg: '#FFF1F2',
    iconColor: '#761B36',
    targetRoute: '/(tabs)/services',
  },
  {
    id: 'marketplace',
    icon: 'bag-handle-outline' as const,
    activeIcon: 'bag-handle' as const,
    title: 'Marketplace',
    subtitle: 'Scrubs & supplies',
    bg: '#FEF3C7',
    iconColor: '#B45309',
    targetRoute: '/(tabs)/marketplace',
  },
  {
    id: 'community',
    icon: 'people-outline' as const,
    activeIcon: 'people' as const,
    title: 'Community',
    subtitle: 'Nurses network',
    bg: '#ECFDF5',
    iconColor: '#059669',
    targetRoute: '/(tabs)/community',
  },
  {
    id: 'learning',
    icon: 'school-outline' as const,
    activeIcon: 'school' as const,
    title: 'Learning Hub',
    subtitle: 'E-books & Elevate',
    bg: '#EEF2FF',
    iconColor: '#4F46E5',
    targetRoute: '/(tabs)/community',
  },
];

const featuredServices = [
  {
    id: 'wound-dressing',
    title: 'Home-Service Wound Dressing',
    category: 'Healthcare Service',
    price: '₦20,000 / session',
    description: 'Professional sterile clinical wound dressing and nursing management delivered at home.',
    icon: 'medkit-outline' as const,
    color: '#761B36',
    actionRoute: '/(tabs)/services',
  },
  {
    id: 'gileo-scrubs',
    title: 'Gileo Scrubs & Medical Apparel',
    category: 'Medical Marketplace',
    price: 'Authentic Gileo Collection',
    description: 'Premium fluid-resistant medical scrubs and clinical wear tailored for comfort.',
    icon: 'bag-handle-outline' as const,
    color: '#B45309',
    actionRoute: '/(tabs)/marketplace',
  },
];

const featuredBooks = [
  {
    id: 'book-1',
    title: 'How to Become a Nurse Concierge',
    author: 'Gileo Learning',
    price: '₦5,000',
    description: 'A comprehensive guide on establishing an independent nurse concierge practice.',
    format: 'E-Book Resource',
  },
  {
    id: 'book-2',
    title: 'Global Nursing Careers & Opportunities',
    author: 'Gileo Learning',
    price: '₦6,500',
    description: 'Discover international opportunities, registration requirements, and career pathways.',
    format: 'E-Book Resource',
  },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning 👋';
  if (hour < 17) return 'Good Afternoon 👋';
  return 'Good Evening 👋';
}

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<typeof featuredBooks[0] | null>(null);

  const handleCallSupport = () => {
    void Linking.openURL('tel:+2348165335594');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Bar Header */}
        <View style={styles.topBar}>
          <Image
            source={require('../../../assets/gileo-logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Gileo Medicals"
          />

          <View style={styles.headerRight}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Support"
              onPress={handleCallSupport}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            >
              <Ionicons name="call-outline" size={20} color="#0F172A" />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              onPress={() => router.push('/(tabs)/community')}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            >
              <Ionicons name="notifications-outline" size={20} color="#0F172A" />
              <View style={styles.notifBadge} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Profile"
              onPress={() => router.push('/(tabs)/profile')}
              style={({ pressed }) => [styles.avatarBtn, pressed && styles.pressed]}
            >
              <Ionicons name="person" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {/* User Greeting Section */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>{getGreeting()}</Text>
          <Text style={styles.welcomeHeading}>Welcome to Gileo</Text>
          <Text style={styles.welcomeSubtext}>
            Healthcare. Medical Essentials. Professional Growth.
          </Text>
        </View>

        {/* Clean Search Input */}
        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={20} color="#94A3B8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search care, scrubs, e-books..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </Pressable>
          )}
        </View>

        {/* Quick Category Pillars (Row) */}
        <View style={styles.pillarsRow}>
          {pillars.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              onPress={() => router.push(item.targetRoute as any)}
              style={({ pressed }) => [styles.pillarCard, pressed && styles.pressed]}
            >
              <View style={[styles.pillarIconCircle, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={22} color={item.iconColor} />
              </View>
              <Text style={styles.pillarTitle}>{item.title}</Text>
            </Pressable>
          ))}
        </View>

        {/* Featured Hero Banner Card (Gileo Wine Red #761B36 theme) */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>GILEO ELEVATE</Text>
            </View>
            <Ionicons name="sparkles" size={18} color="#F59E0B" />
          </View>

          <Text style={styles.heroTitle}>Cohort Enrolment Open</Text>
          <Text style={styles.heroDescription}>
            Advance your nursing career with structured professional development & mentorship.
          </Text>

          <View style={styles.heroFooter}>
            <View style={styles.heroTimeBox}>
              <Ionicons name="calendar-outline" size={14} color="#F8FAFC" />
              <Text style={styles.heroTimeText}>Next Cohort Starts Soon</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(tabs)/community')}
              style={({ pressed }) => [
                styles.heroActionBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.heroActionText}>Explore Cohort</Text>
              <Ionicons name="arrow-forward" size={14} color="#761B36" />
            </Pressable>
          </View>
        </View>

        {/* The 4 Pillars Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Four Connected Pillars</Text>
          </View>

          <View style={styles.pillarsGrid}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(tabs)/services')}
              style={({ pressed }) => [
                styles.gridCard,
                { backgroundColor: '#FFF1F2' },
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.gridIconCircle}>
                <Ionicons name="heart" size={20} color="#761B36" />
              </View>
              <Text style={styles.gridTitle}>Healthcare Services</Text>
              <Text style={styles.gridSub}>Home care & nursing</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(tabs)/marketplace')}
              style={({ pressed }) => [
                styles.gridCard,
                { backgroundColor: '#FEF3C7' },
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.gridIconCircle}>
                <Ionicons name="bag-handle" size={20} color="#B45309" />
              </View>
              <Text style={styles.gridTitle}>Medical Marketplace</Text>
              <Text style={styles.gridSub}>Scrubs & equipment</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(tabs)/community')}
              style={({ pressed }) => [
                styles.gridCard,
                { backgroundColor: '#ECFDF5' },
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.gridIconCircle}>
                <Ionicons name="people" size={20} color="#059669" />
              </View>
              <Text style={styles.gridTitle}>Nurses Community</Text>
              <Text style={styles.gridSub}>Connect & grow</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/(tabs)/community')}
              style={({ pressed }) => [
                styles.gridCard,
                { backgroundColor: '#EEF2FF' },
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.gridIconCircle}>
                <Ionicons name="school" size={20} color="#4F46E5" />
              </View>
              <Text style={styles.gridTitle}>Learning & Elevate</Text>
              <Text style={styles.gridSub}>E-books & courses</Text>
            </Pressable>
          </View>
        </View>

        {/* Featured Offerings */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Offerings</Text>
          </View>

          {featuredServices.map((item) => (
            <Pressable
              key={item.title}
              accessibilityRole="button"
              onPress={() => router.push(item.actionRoute as any)}
              style={({ pressed }) => [
                styles.featuredCard,
                pressed && styles.pressed,
              ]}
            >
              <View style={[styles.featuredIconBox, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={22} color={item.color} />
              </View>

              <View style={styles.featuredContent}>
                <Text style={styles.featuredCategory}>{item.category}</Text>
                <Text style={styles.featuredTitle}>{item.title}</Text>
                <Text style={styles.featuredPrice}>{item.price}</Text>
              </View>

              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </Pressable>
          ))}
        </View>

        {/* Gileo Learning Hub Books Spotlight */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Learning Hub E-Books</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalBooks}
          >
            {featuredBooks.map((book) => (
              <Pressable
                key={book.title}
                accessibilityRole="button"
                onPress={() => setSelectedBook(book)}
                style={({ pressed }) => [
                  styles.bookCard,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.bookCover}>
                  <Ionicons name="book" size={32} color="#761B36" />
                </View>
                <Text numberOfLines={2} style={styles.bookTitle}>
                  {book.title}
                </Text>
                <Text style={styles.bookFormat}>{book.price}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Real Person Support Banner */}
        <Pressable
          accessibilityRole="button"
          onPress={handleCallSupport}
          style={({ pressed }) => [styles.supportBanner, pressed && styles.pressed]}
        >
          <View style={styles.supportIconCircle}>
            <Ionicons name="headset" size={22} color="#FFFFFF" />
          </View>

          <View style={styles.supportTextContainer}>
            <Text style={styles.supportBannerTitle}>Need Assistance?</Text>
            <Text style={styles.supportBannerSubtitle}>
              Speak directly with GILEO Support
            </Text>
            <Text style={styles.supportPhone}>+234 816 533 5594</Text>
          </View>

          <Ionicons name="call" size={20} color="#FFFFFF" />
        </Pressable>

        {/* E-Book Modal */}
        <Modal
          visible={Boolean(selectedBook)}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedBook(null)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setSelectedBook(null)}
          >
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              {selectedBook && (
                <>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalIconBox}>
                      <Ionicons name="book" size={24} color="#761B36" />
                    </View>
                    <Pressable
                      onPress={() => setSelectedBook(null)}
                      hitSlop={10}
                    >
                      <Ionicons name="close" size={22} color="#64748B" />
                    </Pressable>
                  </View>

                  <Text style={styles.modalCategory}>{selectedBook.format}</Text>
                  <Text style={styles.modalTitle}>{selectedBook.title}</Text>
                  <Text style={styles.modalPrice}>{selectedBook.price}</Text>

                  <Text style={styles.modalDescription}>
                    {selectedBook.description}
                  </Text>

                  <View style={styles.modalFooter}>
                    <Pressable
                      style={styles.modalPrimaryBtn}
                      onPress={handleCallSupport}
                    >
                      <Ionicons name="call" size={18} color="#FFFFFF" />
                      <Text style={styles.modalPrimaryText}>Purchase via Support (+234 816 533 5594)</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </Pressable>
          </Pressable>
        </Modal>

        {/* Footer Note */}
        <Text style={styles.footerNote}>
          GILEO MEDICALS GLOBAL LIMITED • 2026
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  logo: {
    width: 120,
    height: 38,
    marginLeft: -25,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#761B36',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingSection: {
    gap: 4,
  },
  greetingText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
  welcomeHeading: {
    color: '#0F172A',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  welcomeSubtext: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
  },
  searchWrapper: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 8,
  },
  pillarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  pillarCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  pillarIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarTitle: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  heroCard: {
    borderRadius: 24,
    backgroundColor: '#761B36',
    padding: 20,
    gap: 12,
    shadowColor: '#761B36',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 3,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  heroDescription: {
    color: '#F8FAFC',
    fontSize: 13,
    lineHeight: 19,
    opacity: 0.9,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  heroTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroTimeText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  heroActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  heroActionText: {
    color: '#761B36',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionContainer: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  seeAllText: {
    color: '#761B36',
    fontSize: 13,
    fontWeight: '600',
  },
  pillarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    width: '48%',
    padding: 16,
    borderRadius: 20,
    gap: 6,
  },
  gridIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  gridTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  gridSub: {
    color: '#64748B',
    fontSize: 11,
  },
  featuredCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  featuredIconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredContent: {
    flex: 1,
    gap: 2,
  },
  featuredCategory: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  featuredTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  featuredPrice: {
    color: '#761B36',
    fontSize: 12,
    fontWeight: '600',
  },
  horizontalBooks: {
    gap: 12,
  },
  bookCard: {
    width: 140,
    padding: 12,
    borderRadius: 18,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  bookCover: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookTitle: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  bookFormat: {
    color: '#761B36',
    fontSize: 11,
    fontWeight: '700',
  },
  supportBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 22,
    backgroundColor: '#761B36',
    gap: 12,
  },
  supportIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportTextContainer: {
    flex: 1,
    gap: 2,
  },
  supportBannerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  supportBannerSubtitle: {
    color: '#F1F5F9',
    fontSize: 11,
    opacity: 0.9,
  },
  supportPhone: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  footerNote: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    textAlign: 'center',
    paddingTop: 8,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 24,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalIconBox: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCategory: {
    color: '#8A7045',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '700',
  },
  modalPrice: {
    color: '#761B36',
    fontSize: 16,
    fontWeight: '700',
  },
  modalDescription: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 22,
  },
  modalFooter: {
    paddingTop: 8,
  },
  modalPrimaryBtn: {
    height: 52,
    borderRadius: 999,
    backgroundColor: '#761B36',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
