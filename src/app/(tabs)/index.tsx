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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiRequest } from '../../services/api';
import { AuthUser, getStoredUser } from '../../services/auth';
import { getFirstName } from './profile';
import { colors, spacing } from '../../theme';

type LivePost = {
  id: string;
  authorName: string;
  authorRole: string;
  createdAt: number;
  content: string;
  likesCount: number;
  commentsCount: number;
};

type LiveProduct = {
  id: string;
  title: string;
  category: string;
  price: string;
  priceKobo: number;
  rating: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

const defaultProducts: LiveProduct[] = [
  {
    id: '9b1deb4d-3b7d-4149-9cd1-e633d3170001',
    title: 'Gileo Dri-FIT Premium Scrubs Set',
    category: 'Gileo Scrubs',
    price: '₦28,500',
    priceKobo: 2850000,
    rating: '4.9',
    icon: 'shirt-outline',
    color: '#f90202',
  },
  {
    id: '9b1deb4d-3b7d-4149-9cd1-e633d3170002',
    title: 'Clinical Dual-Head Stethoscope',
    category: 'Equipment',
    price: '₦35,000',
    priceKobo: 3500000,
    rating: '4.8',
    icon: 'fitness-outline',
    color: '#059669',
  },
  {
    id: '9b1deb4d-3b7d-4149-9cd1-e633d3170003',
    title: 'Digital Automatic BP Monitor',
    category: 'Accessories',
    price: '₦22,000',
    priceKobo: 2200000,
    rating: '4.7',
    icon: 'pulse-outline',
    color: '#4F46E5',
  },
  {
    id: '9b1deb4d-3b7d-4149-9cd1-e633d3170004',
    title: 'Nurse Organizer Carry Backpack',
    category: 'Accessories',
    price: '₦18,000',
    priceKobo: 1800000,
    rating: '4.9',
    icon: 'bag-handle-outline',
    color: '#B45309',
  },
];

const pillars = [
  {
    id: 'services',
    icon: 'heart' as const,
    title: 'Healthcare Services',
    subtitle: 'Home care & nursing',
    bg: '#FFF0F0',
    iconColor: '#f90202',
    targetRoute: '/(tabs)/services',
  },
  {
    id: 'marketplace',
    icon: 'bag-handle' as const,
    title: 'Gileo Marketplace',
    subtitle: 'Scrubs & supplies',
    bg: '#FEF3C7',
    iconColor: '#B45309',
    targetRoute: '/(tabs)/marketplace',
  },
  {
    id: 'community',
    icon: 'people' as const,
    title: 'Gileo Nursing Community',
    subtitle: 'Nurses network',
    bg: '#ECFDF5',
    iconColor: '#059669',
    targetRoute: '/(tabs)/community',
  },
  {
    id: 'learning',
    icon: 'school' as const,
    title: 'Gileo Elevate',
    subtitle: 'Learning hub',
    bg: '#EEF2FF',
    iconColor: '#4F46E5',
    targetRoute: '/(tabs)/community?tab=elevate',
  },
];

function shuffleArray<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Live Data States
  const [allPosts, setAllPosts] = useState<LivePost[]>([]);
  const [randomPosts, setRandomPosts] = useState<LivePost[]>([]);
  const [allProducts, setAllProducts] = useState<LiveProduct[]>(defaultProducts);
  const [randomProducts, setRandomProducts] = useState<LiveProduct[]>(defaultProducts);
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [connectionsCount, setConnectionsCount] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(18)).current;

  const loadHomeDashboardData = async () => {
    const u = await getStoredUser();
    setUser(u);
    const userIdKey = u?.id || 'guest';

    // 1. Read real active orders from NestJS backend API
    try {
      const myOrders = await apiRequest<any[]>('/shop/orders/mine');
      if (Array.isArray(myOrders) && myOrders.length > 0) {
        setActiveOrder(myOrders[0]);
      } else {
        setActiveOrder(null);
      }
    } catch {
      setActiveOrder(null);
    }

    // 2. Read real connections count from NestJS backend API
    try {
      const connRes = await apiRequest<string[]>('/community/connections');
      if (Array.isArray(connRes)) {
        setConnectionsCount(connRes.length);
      } else {
        setConnectionsCount(0);
      }
    } catch {
      setConnectionsCount(0);
    }

    // 3. Load real community posts from NestJS backend API & pick 2 RANDOM posts on reload
    try {
      const backendPosts = await apiRequest<any[]>('/community/posts');
      if (Array.isArray(backendPosts) && backendPosts.length > 0) {
        const mappedPosts: LivePost[] = backendPosts.map((p) => ({
          id: p.id,
          authorName: p.authorName || 'Gileo Nurse',
          authorRole: p.authorRole || 'Community Member',
          createdAt: p.createdAt || Date.now(),
          content: p.content,
          likesCount: p.likesCount || 0,
          commentsCount: p.commentsCount || 0,
        }));
        setAllPosts(mappedPosts);
        setRandomPosts(shuffleArray(mappedPosts).slice(0, 2));
      }
    } catch {}


    // 4. Load real products from NestJS backend & pick 4 RANDOM products on reload
    try {
      const backendProds = await apiRequest<any[]>('/shop/products');
      if (Array.isArray(backendProds) && backendProds.length > 0) {
        const mapped: LiveProduct[] = backendProds.map((p) => ({
          id: p.id,
          title: p.title,
          category: p.category?.name || 'Gileo Apparel',
          price: `₦${(p.priceKobo / 100).toLocaleString()}`,
          priceKobo: p.priceKobo,
          rating: '4.9',
          icon: 'bag-handle-outline',
          color: '#f90202',
        }));
        setAllProducts(mapped);
        setRandomProducts(shuffleArray(mapped).slice(0, 4));
      } else {
        setRandomProducts(shuffleArray(defaultProducts).slice(0, 4));
      }
    } catch {
      setRandomProducts(shuffleArray(defaultProducts).slice(0, 4));
    }
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

    void loadHomeDashboardData();
  }, [fadeAnim, slideAnim]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadHomeDashboardData();
    } catch {
    } finally {
      setRefreshing(false);
    }
  };

  const handleCallSupport = () => {
    void Linking.openURL('tel:+2348165335594');
  };

  const firstName = getFirstName(user);

  // Global Deep Search Filtering
  const isSearching = searchQuery.trim().length > 0;
  const q = searchQuery.toLowerCase().trim();

  const searchMatchingProducts = allProducts.filter(
    (p) => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q),
  );
  const searchMatchingPosts = allPosts.filter(
    (p) => p.content.toLowerCase().includes(q) || p.authorName.toLowerCase().includes(q),
  );

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
            tintColor="#f90202"
            colors={['#f90202']}
          />
        }
      >
        <Animated.View
          style={{
            gap: 18,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {/* Top Bar Header with Hello First Name */}
          <View style={styles.topHeaderRow}>
            <View style={styles.greetingBox}>
              <Text style={styles.greetingSubTitle}>Hello, {firstName} 👋</Text>
              <Text style={styles.greetingTitle} numberOfLines={1}>Gileo Medicals</Text>
            </View>

            <View style={styles.topRightActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/notifications')}
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

          {/* Global Search Bar Container */}
          <View style={styles.searchCardWrapper}>
            <Ionicons name="search-outline" size={20} color="#94A3B8" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search products, posts, cohorts..."
              placeholderTextColor="#94A3B8"
              style={styles.searchInputField}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </Pressable>
            )}
          </View>

          {/* Render Deep Search Results if searching */}
          {isSearching ? (
            <View style={styles.searchResultsContainer}>
              <Text style={styles.searchResultHeading}>Search Results for "{searchQuery}"</Text>

              {/* Matching Products */}
              {searchMatchingProducts.length > 0 && (
                <View style={styles.sectionGroup}>
                  <Text style={styles.searchSubHeading}>Products ({searchMatchingProducts.length})</Text>
                  {searchMatchingProducts.map((prod) => (
                    <Pressable
                      key={prod.id}
                      style={styles.searchItemCard}
                      onPress={() =>
                        router.push({ pathname: '/(tabs)/marketplace', params: { productId: prod.id } })
                      }
                    >
                      <Ionicons name="bag-handle" size={20} color="#f90202" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.searchItemTitle}>{prod.title}</Text>
                        <Text style={styles.searchItemSub}>{prod.category} • {prod.price}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Matching Posts */}
              {searchMatchingPosts.length > 0 && (
                <View style={styles.sectionGroup}>
                  <Text style={styles.searchSubHeading}>Community Posts ({searchMatchingPosts.length})</Text>
                  {searchMatchingPosts.map((post) => (
                    <Pressable
                      key={post.id}
                      style={styles.searchItemCard}
                      onPress={() =>
                        router.push({ pathname: '/(tabs)/community', params: { postId: post.id } })
                      }
                    >
                      <Ionicons name="chatbubbles" size={20} color="#059669" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.searchItemTitle}>{post.authorName}</Text>
                        <Text style={styles.searchItemSub} numberOfLines={1}>{post.content}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                    </Pressable>
                  ))}
                </View>
              )}

              {searchMatchingProducts.length === 0 && searchMatchingPosts.length === 0 && (
                <Text style={styles.noSearchText}>No items found matching "{searchQuery}".</Text>
              )}
            </View>
          ) : (
            <>
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

              {/* Gileo Elevate Spotlight Card */}
              <View style={styles.spotlightHeroCard}>
                <View style={styles.spotlightHeaderRow}>
                  <View style={styles.spotlightTagPill}>
                    <Text style={styles.spotlightTagText}>GILEO ELEVATE</Text>
                  </View>
                  <Ionicons name="sparkles" size={18} color="#F59E0B" />
                </View>

                <Text style={styles.spotlightTitle}>Executive Leadership Cohort</Text>
                <Text style={styles.spotlightSub}>
                  Advance your nursing practice with 6 weeks of structured mentorship, concierge consulting, and international career pathways.
                </Text>

                <View style={styles.spotlightFooterRow}>
                  <View style={styles.timeTagBox}>
                    <Ionicons name="calendar" size={14} color="#FFFFFF" />
                    <Text style={styles.timeTagText}>Starts Nov 2026 • ₦150,000</Text>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push('/(tabs)/community?tab=elevate')}
                    style={({ pressed }) => [styles.spotlightPillBtn, pressed && styles.pressed]}
                  >
                    <Text style={styles.spotlightPillBtnText}>Enrol in Cohort</Text>
                    <Ionicons name="arrow-forward" size={14} color="#f90202" />
                  </Pressable>
                </View>
              </View>

              {/* 4 Random Products Catalog Section */}
              <View style={[styles.sectionGroup, { marginBottom: 16 }]}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeadingText}>Medical Marketplace</Text>
                  <Pressable onPress={() => router.push('/(tabs)/marketplace')}>
                    <Text style={styles.seeAllText}>View All</Text>
                  </Pressable>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                  {randomProducts.map((prod) => (
                    <Pressable
                      key={prod.id}
                      accessibilityRole="button"
                      onPress={() =>
                        router.push({ pathname: '/(tabs)/marketplace', params: { productId: prod.id } })
                      }
                      style={({ pressed }) => [styles.catalogCard, pressed && styles.pressed]}
                    >
                      <View style={[styles.catalogIconBox, { backgroundColor: prod.color + '15' }]}>
                        <Ionicons name={prod.icon} size={28} color={prod.color} />
                      </View>

                      <Text style={styles.catalogCategory}>{prod.category}</Text>
                      <Text style={styles.catalogTitle} numberOfLines={1}>{prod.title}</Text>
                      <Text style={styles.catalogPrice}>{prod.price}</Text>

                      <View style={styles.shopPillBtn}>
                        <Text style={styles.shopPillText}>Shop Now</Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* 2 Random Live Community Posts Section */}
              {randomPosts.length > 0 && (
                <View style={styles.sectionGroup}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionHeadingText}>Community Discussions</Text>
                    <Pressable onPress={() => router.push('/(tabs)/community')}>
                      <Text style={styles.seeAllText}>Join Feed</Text>
                    </Pressable>
                  </View>

                  {randomPosts.map((post) => (
                    <Pressable
                      key={post.id}
                      accessibilityRole="button"
                      onPress={() =>
                        router.push({ pathname: '/(tabs)/community', params: { postId: post.id } })
                      }
                      style={({ pressed }) => [styles.livePostCard, pressed && styles.pressed]}
                    >
                      <View style={styles.livePostHeader}>
                        <View style={styles.liveAvatarCircle}>
                          <Text style={styles.liveAvatarInitial}>
                            {post.authorName.charAt(0).toUpperCase()}
                          </Text>
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={styles.liveAuthorName}>{post.authorName}</Text>
                          <Text style={styles.liveAuthorRole}>{post.authorRole}</Text>
                        </View>
                      </View>

                      <Text style={styles.livePostContent} numberOfLines={2}>{post.content}</Text>

                      <View style={styles.livePostFooter}>
                        <View style={styles.liveMetaItem}>
                          <Ionicons name="heart-outline" size={14} color="#64748B" />
                          <Text style={styles.liveMetaText}>{post.likesCount || 0}</Text>
                        </View>
                        <View style={styles.liveMetaItem}>
                          <Ionicons name="chatbubble-outline" size={14} color="#64748B" />
                          <Text style={styles.liveMetaText}>{post.commentsCount || 0}</Text>
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Relocated Active Order Banner */}
              {activeOrder && (
                <Pressable
                  style={styles.trackerBanner}
                  onPress={() => router.push('/(tabs)/profile')}
                >
                  <View style={styles.trackerIconBox}>
                    <Ionicons name="receipt-outline" size={20} color="#f90202" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.trackerTitle}>Order {activeOrder.reference}</Text>
                    <Text style={styles.trackerSub}>
                      Status: {activeOrder.status} • Total: ₦{(activeOrder.totalKobo / 100).toLocaleString()}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#f90202" />
                </Pressable>
              )}

              {/* Care Request Banner */}
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/(tabs)/services')}
                style={({ pressed }) => [styles.careBannerCard, pressed && styles.pressed]}
              >
                <View style={styles.careIconSquare}>
                  <Ionicons name="medkit" size={24} color="#f90202" />
                </View>

                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.careTitle}>Request Clinical Home Care</Text>
                  <Text style={styles.careSub}>Wound dressing, elderly recovery, and nursing standby.</Text>
                </View>

                <Ionicons name="arrow-forward" size={18} color="#f90202" />
              </Pressable>

              {/* Support Banner */}
              <Pressable
                accessibilityRole="button"
                onPress={handleCallSupport}
                style={({ pressed }) => [styles.supportBannerCard, pressed && styles.pressed]}
              >
                <View style={styles.supportIconSquare}>
                  <Ionicons name="headset" size={22} color="#FFFFFF" />
                </View>

                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.supportTitle}>Need Direct Support?</Text>
                  <Text style={styles.supportSub}>Speak directly with GILEO Support Team</Text>
                  <Text style={styles.supportPhone}>+234 816 533 5594</Text>
                </View>

                <Ionicons name="call" size={20} color="#FFFFFF" />
              </Pressable>
            </>
          )}

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
    gap: 18,
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  greetingBox: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  greetingSubTitle: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
  greetingTitle: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
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
    backgroundColor: '#f90202',
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
  searchResultsContainer: {
    gap: 14,
  },
  searchResultHeading: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  searchSubHeading: {
    color: '#f90202',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  searchItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    gap: 12,
  },
  searchItemTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  searchItemSub: {
    color: '#64748B',
    fontSize: 12,
  },
  noSearchText: {
    color: '#94A3B8',
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 12,
  },
  trackerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    gap: 12,
  },
  trackerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackerTitle: {
    color: '#f90202',
    fontSize: 14,
    fontWeight: '800',
  },
  trackerSub: {
    color: '#9F1239',
    fontSize: 11,
    marginTop: 2,
  },
  pillarsGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  pillarCardBox: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 14,
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
    lineHeight: 16,
  },
  spotlightHeroCard: {
    borderRadius: 26,
    backgroundColor: '#f90202',
    padding: 22,
    gap: 12,
    shadowColor: '#f90202',
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
    color: '#f90202',
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
    color: '#f90202',
    fontSize: 13,
    fontWeight: '700',
  },
  catalogCard: {
    width: 150,
    padding: 14,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    gap: 6,
  },
  catalogIconBox: {
    width: '100%',
    height: 100,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  catalogCategory: {
    color: '#8A7045',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  catalogTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  catalogPrice: {
    color: '#f90202',
    fontSize: 13,
    fontWeight: '800',
  },
  shopPillBtn: {
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  shopPillText: {
    color: '#f90202',
    fontSize: 11,
    fontWeight: '800',
  },
  livePostCard: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    gap: 10,
  },
  livePostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  liveAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveAvatarInitial: {
    color: '#f90202',
    fontSize: 15,
    fontWeight: '800',
  },
  liveAuthorName: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  liveAuthorRole: {
    color: '#64748B',
    fontSize: 11,
  },
  livePostContent: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 19,
  },
  livePostFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  liveMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveMetaText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  careBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 22,
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FECDD3',
    gap: 12,
  },
  careIconSquare: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  careTitle: {
    color: '#f90202',
    fontSize: 15,
    fontWeight: '800',
  },
  careSub: {
    color: '#9F1239',
    fontSize: 11,
    lineHeight: 16,
  },
  supportBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#f90202',
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
});
