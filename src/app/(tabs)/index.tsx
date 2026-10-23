import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthUser, getStoredUser } from '../../services/auth';
import { getFirstName } from './profile';
import { colors, spacing } from '../../theme';

const pillars = [
  {
    id: 'services',
    icon: 'heart' as const,
    title: 'Healthcare',
    subtitle: 'Home care & nursing',
    bg: '#FFF1F2',
    iconColor: '#761B36',
    targetRoute: '/(tabs)/services',
  },
  {
    id: 'marketplace',
    icon: 'bag-handle' as const,
    title: 'Marketplace',
    subtitle: 'Scrubs & supplies',
    bg: '#FEF3C7',
    iconColor: '#B45309',
    targetRoute: '/(tabs)/marketplace',
  },
  {
    id: 'community',
    icon: 'people' as const,
    title: 'Community',
    subtitle: 'Nurses network',
    bg: '#ECFDF5',
    iconColor: '#059669',
    targetRoute: '/(tabs)/community',
  },
  {
    id: 'learning',
    icon: 'school' as const,
    title: 'Elevate',
    subtitle: 'Learning hub',
    bg: '#EEF2FF',
    iconColor: '#4F46E5',
    targetRoute: '/(tabs)/community',
  },
];

const featuredServices = [
  {
    id: 'wound-dressing',
    title: 'Home Wound Care',
    category: 'Home Nursing',
    price: '₦20,000 / session',
    description: 'Professional sterile clinical wound dressing delivered at home.',
    icon: 'medkit' as const,
    color: '#761B36',
    actionRoute: '/(tabs)/services',
  },
  {
    id: 'gileo-scrubs',
    title: 'Gileo Premium Scrubs',
    category: 'Medical Wear',
    price: 'Authentic Collection',
    description: 'Fluid-resistant medical scrubs tailored for clinical comfort.',
    icon: 'shirt' as const,
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
    title: 'Global Nursing Careers & Pathways',
    author: 'Gileo Learning',
    price: '₦6,500',
    description: 'Discover international licensure requirements, registration, and career pathways.',
    format: 'E-Book Resource',
  },
];

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<typeof featuredBooks[0] | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  const loadUserData = async () => {
    const u = await getStoredUser();
    setUser(u);
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    void loadUserData();
  }, [fadeAnim, slideAnim]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadUserData();
    } catch {
    } finally {
      setRefreshing(false);
    }
  };

  const handleCallSupport = () => {
    void Linking.openURL('tel:+2348165335594');
  };

  const firstName = getFirstName(user);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#761B36"
            colors={['#761B36']}
          />
        }
      >
        <Animated.View
          style={{
            gap: 20,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Top Bar Header with Two-Line Greeting & Profile Badge */}
          <View style={styles.topHeaderRow}>
            <View style={styles.greetingBox}>
              <Text style={styles.greetingSubTitle}>Hello,</Text>
              <Text style={styles.greetingTitle}>
                {user?.displayName || `${firstName}!`}
              </Text>
            </View>

            <View style={styles.topRightActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/(tabs)/community')}
                style={({ pressed }) => [styles.circleIconBtn, pressed && styles.pressed]}
              >
                <Ionicons name="notifications-outline" size={20} color="#0F172A" />
                <View style={styles.notifBadgeDot} />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/(tabs)/profile')}
                style={({ pressed }) => [styles.avatarBadgeBtn, pressed && styles.pressed]}
              >
                <Text style={styles.avatarInitialText}>
                  {firstName.charAt(0).toUpperCase()}
                </Text>
                <View style={styles.proBadgePill}>
                  <Text style={styles.proBadgeText}>MEMBER</Text>
                </View>
              </Pressable>
            </View>
          </View>

          {/* Pure White Search Container */}
          <View style={styles.searchCardWrapper}>
            <Ionicons name="search-outline" size={20} color="#94A3B8" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search care, scrubs, e-books..."
              placeholderTextColor="#94A3B8"
              style={styles.searchInputField}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </Pressable>
            )}
          </View>

          {/* Quick Category Pillars Row */}
          <View style={styles.pillarsGridRow}>
            {pillars.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() => router.push(item.targetRoute as any)}
                style={({ pressed }) => [styles.pillarCardBox, pressed && styles.pressed]}
              >
                <View style={[styles.pillarIconCircleBox, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={22} color={item.iconColor} />
                </View>
                <Text style={styles.pillarTitleText}>{item.title}</Text>
              </Pressable>
            ))}
          </View>

          {/* Featured Spotlight Banner Card (Gileo Wine Red #761B36) */}
          <View style={styles.spotlightHeroCard}>
            <View style={styles.spotlightHeaderRow}>
              <View style={styles.spotlightTagPill}>
                <Text style={styles.spotlightTagText}>GILEO ELEVATE</Text>
              </View>
              <Ionicons name="sparkles" size={18} color="#F59E0B" />
            </View>

            <Text style={styles.spotlightTitle}>Executive Leadership Cohort</Text>
            <Text style={styles.spotlightSub}>
              Advance your nursing practice with 6 weeks of structured mentorship and international career guidance.
            </Text>

            <View style={styles.spotlightFooterRow}>
              <View style={styles.timeTagBox}>
                <Ionicons name="calendar" size={14} color="#FFFFFF" />
                <Text style={styles.timeTagText}>Starts Nov 2026 • 6 Weeks</Text>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/(tabs)/community')}
                style={({ pressed }) => [styles.spotlightPillBtn, pressed && styles.pressed]}
              >
                <Text style={styles.spotlightPillBtnText}>Explore Cohort</Text>
                <Ionicons name="arrow-forward" size={14} color="#761B36" />
              </Pressable>
            </View>
          </View>

          {/* Featured Services Section */}
          <View style={styles.sectionGroup}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeadingText}>Featured Offerings</Text>
              <Pressable onPress={() => router.push('/(tabs)/services')}>
                <Text style={styles.seeAllText}>See All</Text>
              </Pressable>
            </View>

            {featuredServices.map((item) => (
              <Pressable
                key={item.title}
                accessibilityRole="button"
                onPress={() => router.push(item.actionRoute as any)}
                style={({ pressed }) => [styles.offeringCard, pressed && styles.pressed]}
              >
                <View style={[styles.offeringIconSquare, { backgroundColor: item.color + '15' }]}>
                  <Ionicons name={item.icon} size={24} color={item.color} />
                </View>

                <View style={styles.offeringMeta}>
                  <Text style={styles.offeringCategory}>{item.category}</Text>
                  <Text style={styles.offeringTitle}>{item.title}</Text>
                  <Text style={styles.offeringPrice}>{item.price}</Text>
                </View>

                <View style={styles.bookNowPill}>
                  <Text style={styles.bookNowText}>Book Now</Text>
                </View>
              </Pressable>
            ))}
          </View>

          {/* Learning Hub E-Books Carousel */}
          <View style={styles.sectionGroup}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeadingText}>Learning Hub E-Books</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.booksScrollRow}
            >
              {featuredBooks.map((book) => (
                <Pressable
                  key={book.title}
                  accessibilityRole="button"
                  onPress={() => setSelectedBook(book)}
                  style={({ pressed }) => [styles.eBookCard, pressed && styles.pressed]}
                >
                  <View style={styles.eBookCoverBox}>
                    <Ionicons name="book" size={32} color="#761B36" />
                  </View>
                  <Text numberOfLines={2} style={styles.eBookCardTitle}>
                    {book.title}
                  </Text>
                  <Text style={styles.eBookCardPrice}>{book.price}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Customer Support Banner */}
          <Pressable
            accessibilityRole="button"
            onPress={handleCallSupport}
            style={({ pressed }) => [styles.supportBannerCard, pressed && styles.pressed]}
          >
            <View style={styles.supportIconSquare}>
              <Ionicons name="headset" size={22} color="#FFFFFF" />
            </View>

            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.supportTitle}>Need Assistance?</Text>
              <Text style={styles.supportSub}>Speak directly with GILEO Support</Text>
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
              <Pressable style={styles.modalCardContent} onPress={(e) => e.stopPropagation()}>
                {selectedBook && (
                  <>
                    <View style={styles.modalHeaderRow}>
                      <View style={styles.modalIconCircle}>
                        <Ionicons name="book" size={24} color="#761B36" />
                      </View>
                      <Pressable onPress={() => setSelectedBook(null)} hitSlop={10}>
                        <Ionicons name="close" size={22} color="#64748B" />
                      </Pressable>
                    </View>

                    <Text style={styles.modalCategoryText}>{selectedBook.format}</Text>
                    <Text style={styles.modalHeadingText}>{selectedBook.title}</Text>
                    <Text style={styles.modalPriceText}>{selectedBook.price}</Text>

                    <Text style={styles.modalBodyText}>{selectedBook.description}</Text>

                    <Pressable style={styles.modalActionPillBtn} onPress={handleCallSupport}>
                      <Ionicons name="call" size={18} color="#FFFFFF" />
                      <Text style={styles.modalActionPillText}>
                        Purchase via Support (+234 816 533 5594)
                      </Text>
                    </Pressable>
                  </>
                )}
              </Pressable>
            </Pressable>
          </Modal>

          <Text style={styles.footerNoteText}>GILEO MEDICALS GLOBAL LIMITED • 2026</Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 96,
    gap: 20,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingBox: {
    gap: 2,
  },
  greetingSubTitle: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  greetingTitle: {
    color: '#0F172A',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  circleIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    position: 'relative',
  },
  notifBadgeDot: {
    position: 'absolute',
    top: 11,
    right: 11,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  avatarBadgeBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#761B36',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarInitialText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  proBadgePill: {
    position: 'absolute',
    bottom: -4,
    backgroundColor: '#111111',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  proBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  searchCardWrapper: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    gap: 12,
  },
  searchInputField: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  pillarsGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  pillarCardBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 12,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  pillarIconCircleBox: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarTitleText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  spotlightHeroCard: {
    borderRadius: 26,
    backgroundColor: '#761B36',
    padding: 22,
    gap: 12,
    shadowColor: '#761B36',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 5,
  },
  spotlightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spotlightTagPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  spotlightTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  spotlightTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  spotlightSub: {
    color: '#F8FAFC',
    fontSize: 13,
    lineHeight: 20,
    opacity: 0.9,
  },
  spotlightFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.18)',
  },
  timeTagBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  spotlightPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  spotlightPillBtnText: {
    color: '#761B36',
    fontSize: 12,
    fontWeight: '800',
  },
  sectionGroup: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeadingText: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  seeAllText: {
    color: '#761B36',
    fontSize: 13,
    fontWeight: '700',
  },
  offeringCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    gap: 14,
  },
  offeringIconSquare: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offeringMeta: {
    flex: 1,
    gap: 2,
  },
  offeringCategory: {
    color: '#8A7045',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  offeringTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  offeringPrice: {
    color: '#761B36',
    fontSize: 13,
    fontWeight: '700',
  },
  bookNowPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFF1F2',
  },
  bookNowText: {
    color: '#761B36',
    fontSize: 12,
    fontWeight: '700',
  },
  booksScrollRow: {
    gap: 12,
  },
  eBookCard: {
    width: 150,
    padding: 14,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    gap: 8,
  },
  eBookCoverBox: {
    width: '100%',
    height: 110,
    borderRadius: 16,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eBookCardTitle: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  eBookCardPrice: {
    color: '#761B36',
    fontSize: 12,
    fontWeight: '800',
  },
  supportBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#761B36',
    gap: 14,
  },
  supportIconSquare: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  supportSub: {
    color: '#F1F5F9',
    fontSize: 11,
    opacity: 0.9,
  },
  supportPhone: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  footerNoteText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
    paddingTop: 8,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCardContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    padding: 24,
    gap: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 20,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCategoryText: {
    color: '#8A7045',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  modalHeadingText: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
  },
  modalPriceText: {
    color: '#761B36',
    fontSize: 16,
    fontWeight: '800',
  },
  modalBodyText: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 22,
  },
  modalActionPillBtn: {
    height: 52,
    borderRadius: 999,
    backgroundColor: '#761B36',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  modalActionPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
