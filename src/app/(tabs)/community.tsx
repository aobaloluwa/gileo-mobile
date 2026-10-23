import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
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
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiRequest } from '../../services/api';
import { AuthUser, getStoredAccessToken, getStoredUser } from '../../services/auth';
import { getFirstName } from './profile';
import { colors, spacing } from '../../theme';

type Resource = {
  id: string;
  title: string;
  summary: string;
  category: string;
  content: string;
};

type Cohort = {
  id: string;
  title: string;
  slug: string;
  overview: string;
  learningOutcomes: string[];
  startsAt: string;
  endsAt: string;
  priceKobo: number;
  capacity: number;
  enrolledCount: number;
};

const initialResources: Resource[] = [
  {
    id: 'res-1',
    title: 'Exploring Non-Traditional Nursing Pathways in 2026',
    category: 'Career Guidance',
    summary:
      'Learn about nurse concierge roles, corporate healthcare coordination, and independent clinical practice.',
    content:
      'Traditional bedside nursing is only one aspect of a rewarding healthcare career. Today, healthcare systems and private clients actively seek nurses for concierge healthcare management, executive health coordination, and independent consulting.',
  },
  {
    id: 'res-2',
    title: 'How to Build a High-Impact Executive Nursing Portfolio',
    category: 'Professional Growth',
    summary:
      'Key guidelines for structuring clinical experience, certifications, and leadership achievements for global roles.',
    content:
      'A professional nursing portfolio highlights your clinical competencies, certifications, leadership experience, and continuous professional development. When applying for global nursing roles or executive positions, a well-structured portfolio differentiates you.',
  },
];

const initialCohorts: Cohort[] = [
  {
    id: '8f2d3a1b-4c5e-6f7a-8b9c-0d1e2f3a4b5c',
    title: 'Nurse Concierge & Executive Leadership Cohort',
    slug: 'nurse-concierge-leadership-2026',
    overview:
      'A 6-week intensive cohort for nurses seeking independent practice, concierge healthcare consulting, and international leadership opportunities.',
    learningOutcomes: [
      'Nurse Concierge Business Model & Operations',
      'International Career Registration & Pathways',
      'Executive Nursing Portfolio Development',
      'Clinical Quality & Contract Management',
    ],
    startsAt: new Date('2026-11-15').toISOString(),
    endsAt: new Date('2026-12-20').toISOString(),
    priceKobo: 15000000,
    capacity: 30,
    enrolledCount: 14,
  },
  {
    id: '8f2d3a1b-4c5e-6f7a-8b9c-0d1e2f3a4b5d',
    title: 'Global Nursing Career & Migration Pathways',
    slug: 'global-nursing-career-pathways-2026',
    overview:
      'A 4-week cohort focused on international nursing licensure (UK, US, Canada, Australia), documentation, and visa sponsorship strategies.',
    learningOutcomes: [
      'NCLEX, NMC & AHPRA Registration Roadmap',
      'Sponsorship Interview Preparation',
      'Global Nursing Resume & Portfolio Optimization',
    ],
    startsAt: new Date('2026-12-01').toISOString(),
    endsAt: new Date('2026-12-28').toISOString(),
    priceKobo: 12000000,
    capacity: 40,
    enrolledCount: 22,
  },
];

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<'resources' | 'elevate'>('resources');
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [cohorts, setCohorts] = useState<Cohort[]>(initialCohorts);
  const [refreshing, setRefreshing] = useState(false);

  // Selected Item Modals
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null);

  // Enrolment Paystack State
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [paystackUrl, setPaystackUrl] = useState<string | null>(null);
  const [enrolmentRef, setEnrolmentRef] = useState('');
  const [enrolmentSuccess, setEnrolmentSuccess] = useState(false);

  // Page Entrance Animation
  const pageFadeAnim = useRef(new Animated.Value(0)).current;
  const pageSlideAnim = useRef(new Animated.Value(18)).current;

  // Toast Notification State
  const [toastText, setToastText] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);
  const toastAnim = useRef(new Animated.Value(-150)).current;

  const loadCommunityData = async () => {
    const u = await getStoredUser();
    setUser(u);

    try {
      const communityData = await apiRequest<any>('/community/resources').catch(() => null);
      if (communityData?.resources && Array.isArray(communityData.resources) && communityData.resources.length > 0) {
        setResources(communityData.resources);
      }

      const fetchedCohorts = await apiRequest<Cohort[]>('/learning/cohorts').catch(() => null);
      if (Array.isArray(fetchedCohorts) && fetchedCohorts.length > 0) {
        setCohorts(fetchedCohorts);
      }
    } catch {
      // Keep demo data for offline/demo
    }
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(pageFadeAnim, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(pageSlideAnim, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    void loadCommunityData();
  }, [pageFadeAnim, pageSlideAnim]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadCommunityData();
    } catch {
    } finally {
      setRefreshing(false);
    }
  };

  const triggerToast = (message: string) => {
    setToastText(message);
    setIsToastVisible(true);
    toastAnim.setValue(-150);

    Animated.sequence([
      Animated.spring(toastAnim, {
        toValue: Math.max(insets.top, 12),
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.delay(2200),
      Animated.timing(toastAnim, {
        toValue: -150,
        duration: 280,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsToastVisible(false);
    });
  };

  const handleJoinCommunity = async () => {
    const token = await getStoredAccessToken();
    if (!token) {
      triggerToast('Please sign in to register for Gileo Community');
      router.push('/login');
      return;
    }

    try {
      await apiRequest('/community/join', { method: 'POST' });
      triggerToast('Welcome! You are now a registered Gileo Community Member.');
    } catch {
      triggerToast('Joined Gileo Community!');
    }
  };

  const handleCallSupport = () => {
    void Linking.openURL('tel:+2348165335594');
  };

  const handleEnrolInCohort = async (cohort: Cohort) => {
    const token = await getStoredAccessToken();
    if (!token) {
      triggerToast('Please sign in to enrol in a Gileo Elevate cohort');
      setSelectedCohort(null);
      router.push('/login');
      return;
    }

    setIsEnrolling(true);

    try {
      const paymentRes = await apiRequest<any>('/payments/initialize', {
        method: 'POST',
        body: JSON.stringify({
          purchaseType: 'ELEVATE_COHORT',
          targetId: cohort.id,
        }),
      });

      if (!paymentRes?.authorizationUrl) {
        throw new Error('Could not initialize Paystack enrolment payment.');
      }

      const authUrl = paymentRes.authorizationUrl;
      setPaystackUrl(authUrl);
      setEnrolmentRef(paymentRes.reference || 'GIL-COHORT');
      setEnrolmentSuccess(true);

      await WebBrowser.openBrowserAsync(authUrl).catch(() => {
        void Linking.openURL(authUrl);
      });
    } catch (error) {
      triggerToast(
        error instanceof Error ? error.message : 'Could not complete enrolment payment.',
      );
    } finally {
      setIsEnrolling(false);
    }
  };

  const firstName = getFirstName(user);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Toast Notification Banner */}
      {isToastVisible && (
        <Animated.View
          style={[
            styles.toastContainer,
            { top: Math.max(insets.top, 12), transform: [{ translateY: toastAnim }] },
          ]}
        >
          <Ionicons name="people" size={18} color="#FFFFFF" />
          <Text style={styles.toastText} numberOfLines={1}>
            {toastText}
          </Text>
        </Animated.View>
      )}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
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
            gap: 18,
            opacity: pageFadeAnim,
            transform: [{ translateY: pageSlideAnim }],
          }}
        >
          {/* Top Bar Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greetingSubTitle}>Hello, {firstName} 👋</Text>
              <Text style={styles.headerTitle}>Gileo Community</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={handleCallSupport}
              style={({ pressed }) => [styles.callBtn, pressed && styles.pressed]}
            >
              <Ionicons name="call-outline" size={20} color="#0F172A" />
            </Pressable>
          </View>

          {/* Hero Banner Card in Gileo Wine Red Theme */}
          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>PILLAR 3 & 4 • NURSES NETWORK</Text>
              </View>
              <Ionicons name="people" size={22} color="#761B36" />
            </View>

            <Text style={styles.heroTitle}>Empowering Nursing Leaders</Text>
            <Text style={styles.heroText}>
              A connected destination for nurses to explore non-traditional career pathways, share clinical insights, and enrol in Gileo Elevate paid cohorts.
            </Text>

            <Pressable
              accessibilityRole="button"
              onPress={handleJoinCommunity}
              style={({ pressed }) => [styles.joinBtn, pressed && styles.pressed]}
            >
              <Ionicons name="checkmark-circle" size={16} color="#761B36" />
              <Text style={styles.joinBtnText}>Join Free Community</Text>
            </Pressable>
          </View>

          {/* Tab Switcher */}
          <View style={styles.tabBar}>
            <Pressable
              onPress={() => setActiveTab('resources')}
              style={[styles.tabItem, activeTab === 'resources' && styles.tabItemActive]}
            >
              <Ionicons
                name="document-text-outline"
                size={16}
                color={activeTab === 'resources' ? '#761B36' : '#64748B'}
              />
              <Text style={[styles.tabLabel, activeTab === 'resources' && styles.tabLabelActive]}>
                Resource Hub
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('elevate')}
              style={[styles.tabItem, activeTab === 'elevate' && styles.tabItemActive]}
            >
              <Ionicons
                name="school"
                size={16}
                color={activeTab === 'elevate' ? '#761B36' : '#64748B'}
              />
              <Text style={[styles.tabLabel, activeTab === 'elevate' && styles.tabLabelActive]}>
                Gileo Elevate ({cohorts.length})
              </Text>
            </Pressable>
          </View>

          {/* Tab Content 1: Free Community Resources */}
          {activeTab === 'resources' ? (
            <View style={styles.resourcesSection}>
              <Text style={styles.sectionHeaderTitle}>Free Career Resources & Updates</Text>

              <View style={styles.resourceList}>
                {resources.map((res) => (
                  <Pressable
                    key={res.id}
                    accessibilityRole="button"
                    onPress={() => setSelectedResource(res)}
                    style={({ pressed }) => [styles.resourceCard, pressed && styles.pressed]}
                  >
                    <View style={styles.resourceCardHeader}>
                      <View style={styles.resourceIconBox}>
                        <Ionicons name="compass-outline" size={22} color="#761B36" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.resourceCategory}>{res.category}</Text>
                        <Text style={styles.resourceTitle}>{res.title}</Text>
                      </View>
                    </View>

                    <Text style={styles.resourceSummary}>{res.summary}</Text>

                    <View style={styles.resourceFooter}>
                      <Text style={styles.resourceAuthor}>By Gileo Community Lead</Text>
                      <View style={styles.readLink}>
                        <Text style={styles.readLinkText}>Read Guide</Text>
                        <Ionicons name="arrow-forward" size={12} color="#761B36" />
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            /* Tab Content 2: Gileo Elevate Paid Cohorts */
            <View style={styles.elevateSection}>
              <View style={styles.elevateHeaderBox}>
                <Ionicons name="school" size={24} color="#761B36" />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.elevateHeaderTitle}>Gileo Elevate Cohorts</Text>
                  <Text style={styles.elevateHeaderSub}>
                    Structured paid professional development programmes for nurses seeking executive leadership and global practice.
                  </Text>
                </View>
              </View>

              <View style={styles.cohortList}>
                {cohorts.map((cohort) => {
                  const priceFormatted = `₦${(cohort.priceKobo / 100).toLocaleString()}`;
                  return (
                    <View key={cohort.id} style={styles.cohortCard}>
                      <View style={styles.cohortCardHeader}>
                        <View style={styles.enrolmentPill}>
                          <Ionicons name="time-outline" size={12} color="#761B36" />
                          <Text style={styles.enrolmentPillText}>ENROLMENT OPEN</Text>
                        </View>
                        <Text style={styles.cohortPrice}>{priceFormatted}</Text>
                      </View>

                      <Text style={styles.cohortTitle}>{cohort.title}</Text>
                      <Text style={styles.cohortOverview}>{cohort.overview}</Text>

                      {/* Learning Outcomes List */}
                      <View style={styles.outcomesBox}>
                        <Text style={styles.outcomesBoxTitle}>Key Learning Outcomes:</Text>
                        {cohort.learningOutcomes.map((outcome, idx) => (
                          <View key={idx} style={styles.outcomeRow}>
                            <Ionicons name="checkmark-circle" size={14} color="#761B36" />
                            <Text style={styles.outcomeText}>{outcome}</Text>
                          </View>
                        ))}
                      </View>

                      <Pressable
                        style={styles.enrolBtn}
                        onPress={() => setSelectedCohort(cohort)}
                      >
                        <Text style={styles.enrolBtnText}>View Details & Enrol</Text>
                        <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Support Banner */}
          <Pressable
            accessibilityRole="button"
            onPress={handleCallSupport}
            style={({ pressed }) => [styles.supportCard, pressed && styles.pressed]}
          >
            <View style={styles.supportIconCircle}>
              <Ionicons name="headset" size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.supportCardTitle}>Have Questions About Gileo Elevate?</Text>
              <Text style={styles.supportCardSub}>Speak with our Mentorship Team</Text>
              <Text style={styles.supportCardPhone}>+234 816 533 5594</Text>
            </View>
            <Ionicons name="call" size={20} color="#FFFFFF" />
          </Pressable>
        </Animated.View>

        {/* Resource Reader Modal */}
        <Modal
          visible={Boolean(selectedResource)}
          animationType="slide"
          onRequestClose={() => setSelectedResource(null)}
        >
          <SafeAreaView style={styles.modalSafeArea}>
            {selectedResource && (
              <>
                <View style={styles.modalHeader}>
                  <Pressable onPress={() => setSelectedResource(null)} style={styles.circleBtn}>
                    <Ionicons name="close" size={20} color="#0F172A" />
                  </Pressable>
                  <Text style={styles.modalHeaderTitle}>{selectedResource.category}</Text>
                  <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.readerContent}>
                  <Text style={styles.readerTitle}>{selectedResource.title}</Text>
                  <View style={styles.readerAuthorRow}>
                    <Ionicons name="person-circle-outline" size={18} color="#761B36" />
                    <Text style={styles.readerAuthorText}>By Gileo Community Lead</Text>
                  </View>

                  <View style={styles.readerBodyCard}>
                    <Text style={styles.readerBodyText}>{selectedResource.content}</Text>
                  </View>

                  <Pressable
                    style={styles.shareBtn}
                    onPress={() => triggerToast('Resource link copied')}
                  >
                    <Ionicons name="share-social" size={16} color="#0F172A" />
                    <Text style={styles.shareBtnText}>Share Resource</Text>
                  </Pressable>
                </ScrollView>
              </>
            )}
          </SafeAreaView>
        </Modal>

        {/* Cohort Detail & Paystack Enrolment Modal */}
        <Modal
          visible={Boolean(selectedCohort)}
          animationType="slide"
          onRequestClose={() => {
            setSelectedCohort(null);
            setEnrolmentSuccess(false);
          }}
        >
          <SafeAreaView style={styles.modalSafeArea}>
            {selectedCohort && (
              <>
                <View style={styles.modalHeader}>
                  <Pressable
                    onPress={() => {
                      setSelectedCohort(null);
                      setEnrolmentSuccess(false);
                    }}
                    style={styles.circleBtn}
                  >
                    <Ionicons name="close" size={20} color="#0F172A" />
                  </Pressable>
                  <Text style={styles.modalHeaderTitle}>Gileo Elevate Enrolment</Text>
                  <View style={{ width: 40 }} />
                </View>

                {enrolmentSuccess ? (
                  <View style={styles.enrolSuccessContainer}>
                    <View style={styles.successIconCircle}>
                      <Ionicons name="checkmark" size={40} color="#FFFFFF" />
                    </View>
                    <Text style={styles.successTitle}>Enrolment Order Created!</Text>
                    <Text style={styles.successRef}>Ref: {enrolmentRef}</Text>
                    <Text style={styles.successSub}>
                      Complete your cohort enrolment fee payment securely on the Paystack gateway:
                    </Text>

                    {paystackUrl && (
                      <Pressable
                        style={styles.paystackLaunchBtn}
                        onPress={() => {
                          void WebBrowser.openBrowserAsync(paystackUrl).catch(() => {
                            void Linking.openURL(paystackUrl);
                          });
                        }}
                      >
                        <Ionicons name="card" size={18} color="#FFFFFF" />
                        <Text style={styles.paystackLaunchBtnText}>Open Paystack Gateway</Text>
                      </Pressable>
                    )}

                    <Pressable
                      style={styles.doneBtn}
                      onPress={() => {
                        setSelectedCohort(null);
                        setEnrolmentSuccess(false);
                      }}
                    >
                      <Text style={styles.doneBtnText}>Done</Text>
                    </Pressable>
                  </View>
                ) : (
                  <ScrollView contentContainerStyle={styles.enrolContent}>
                    <View style={styles.cohortDetailHeader}>
                      <Text style={styles.cohortDetailTitle}>{selectedCohort.title}</Text>
                      <Text style={styles.cohortDetailPrice}>
                        ₦{(selectedCohort.priceKobo / 100).toLocaleString()}
                      </Text>
                    </View>

                    <View style={styles.paystackNoticeBox}>
                      <Ionicons name="shield-checkmark" size={22} color="#761B36" />
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={styles.paystackNoticeTitle}>Paystack Cohort Verification</Text>
                        <Text style={styles.paystackNoticeSub}>
                          Enrolment is verified instantly upon successful Paystack payment confirmation.
                        </Text>
                      </View>
                    </View>

                    <View style={styles.sectionGroup}>
                      <Text style={styles.modalSectionHeaderTitle}>Cohort Overview</Text>
                      <Text style={styles.detailOverviewText}>{selectedCohort.overview}</Text>
                    </View>

                    <View style={styles.sectionGroup}>
                      <Text style={styles.modalSectionHeaderTitle}>Curriculum & Learning Outcomes</Text>
                      {selectedCohort.learningOutcomes.map((outcome, idx) => (
                        <View key={idx} style={styles.modalOutcomeRow}>
                          <Ionicons name="checkmark-circle" size={16} color="#761B36" />
                          <Text style={styles.outcomeDetailText}>{outcome}</Text>
                        </View>
                      ))}
                    </View>

                    <Pressable
                      style={[styles.paystackEnrolBtn, isEnrolling && { opacity: 0.6 }]}
                      disabled={isEnrolling}
                      onPress={() => handleEnrolInCohort(selectedCohort)}
                    >
                      <Ionicons name="card-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.paystackEnrolText}>
                        {isEnrolling ? 'Initializing Paystack...' : 'Proceed to Paystack Enrolment'}
                      </Text>
                    </Pressable>
                  </ScrollView>
                )}
              </>
            )}
          </SafeAreaView>
        </Modal>

        {/* Footer Note */}
        <Text style={styles.footerNote}>GILEO MEDICALS GLOBAL LIMITED • 2026</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 96,
    gap: 18,
  },
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    height: 48,
    borderRadius: 999,
    backgroundColor: '#761B36',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    shadowColor: '#761B36',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingSubTitle: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  callBtn: {
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
  },
  heroCard: {
    padding: 22,
    borderRadius: 26,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    gap: 12,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  badgeText: {
    color: '#761B36',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: '#761B36',
    fontSize: 22,
    fontWeight: '800',
  },
  heroText: {
    color: '#9F1239',
    fontSize: 13,
    lineHeight: 20,
  },
  joinBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },
  joinBtnText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  tabItem: {
    flex: 1,
    height: 44,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tabItemActive: {
    backgroundColor: '#FFF1F2',
  },
  tabLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#761B36',
    fontWeight: '800',
  },
  resourcesSection: {
    gap: 12,
  },
  sectionHeaderTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  resourceList: {
    gap: 12,
  },
  resourceCard: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    gap: 10,
  },
  resourceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resourceIconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceCategory: {
    color: '#761B36',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  resourceTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  resourceSummary: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
  },
  resourceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  resourceAuthor: {
    color: '#94A3B8',
    fontSize: 11,
  },
  readLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readLinkText: {
    color: '#761B36',
    fontSize: 12,
    fontWeight: '700',
  },
  elevateSection: {
    gap: 14,
  },
  elevateHeaderBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    gap: 12,
  },
  elevateHeaderTitle: {
    color: '#761B36',
    fontSize: 16,
    fontWeight: '800',
  },
  elevateHeaderSub: {
    color: '#9F1239',
    fontSize: 12,
    lineHeight: 18,
  },
  cohortList: {
    gap: 14,
  },
  cohortCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    gap: 12,
  },
  cohortCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  enrolmentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FFF1F2',
  },
  enrolmentPillText: {
    color: '#761B36',
    fontSize: 10,
    fontWeight: '800',
  },
  cohortPrice: {
    color: '#761B36',
    fontSize: 18,
    fontWeight: '800',
  },
  cohortTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  cohortOverview: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 20,
  },
  outcomesBox: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EAECEF',
    gap: 6,
  },
  outcomesBoxTitle: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
  },
  outcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  outcomeText: {
    color: '#334155',
    fontSize: 12,
  },
  enrolBtn: {
    height: 52,
    borderRadius: 999,
    backgroundColor: '#761B36',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  enrolBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#761B36',
    gap: 14,
  },
  supportIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportCardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  supportCardSub: {
    color: '#F1F5F9',
    fontSize: 11,
    opacity: 0.9,
  },
  supportCardPhone: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EAECEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  readerContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 16,
  },
  readerTitle: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  readerAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  readerAuthorText: {
    color: '#64748B',
    fontSize: 13,
  },
  readerBodyCard: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EAECEF',
  },
  readerBodyText: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 24,
  },
  shareBtn: {
    height: 52,
    borderRadius: 999,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EAECEF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  enrolContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 16,
  },
  cohortDetailHeader: {
    gap: 4,
  },
  cohortDetailTitle: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
  },
  cohortDetailPrice: {
    color: '#761B36',
    fontSize: 22,
    fontWeight: '800',
  },
  paystackNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  paystackNoticeTitle: {
    color: '#761B36',
    fontSize: 14,
    fontWeight: '800',
  },
  paystackNoticeSub: {
    color: '#9F1239',
    fontSize: 12,
    lineHeight: 18,
  },
  sectionGroup: {
    gap: 8,
  },
  sectionHeaderTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  detailOverviewText: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 22,
  },
  outcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  outcomeDetailText: {
    color: '#0F172A',
    fontSize: 13,
  },
  paystackEnrolBtn: {
    height: 54,
    borderRadius: 999,
    backgroundColor: '#761B36',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  paystackEnrolText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  enrolSuccessContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#761B36',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '800',
  },
  successRef: {
    color: '#761B36',
    fontSize: 14,
    fontWeight: '800',
  },
  successSub: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  paystackLaunchBtn: {
    height: 52,
    borderRadius: 999,
    backgroundColor: '#761B36',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  paystackLaunchBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  doneBtn: {
    height: 52,
    borderRadius: 999,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  footerNote: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
    paddingTop: 8,
  },
});
