import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as LinkingExpo from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiRequest } from '../../services/api';
import { AuthUser, getStoredAccessToken, getStoredUser } from '../../services/auth';
import { addNotification } from '../../services/notificationsStorage';

WebBrowser.maybeCompleteAuthSession();

import { getFirstName } from './profile';
import { colors, spacing } from '../../theme';

type CommentItem = {
  id: string;
  authorName: string;
  text: string;
  timeAgo?: string;
};

type FeedPost = {
  id: string;
  authorId?: string;
  authorName: string;
  authorRole: string;
  createdAt: number; // Timestamp in ms
  content: string;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  commentsList: CommentItem[];
  category?: string;
};

type RegisteredMember = {
  id: string;
  displayName?: string | null;
  email?: string | null;
  role?: string;
  isConnected?: boolean;
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

const GLOBAL_FEED_STORAGE_KEY = '@gileo/global_feed_v4';

const initialRegisteredMembers: RegisteredMember[] = [
  { id: 'm-1', displayName: 'Nurse Laila Gibson', email: 'laila@gileo.com', isConnected: true },
  { id: 'm-2', displayName: 'Nurse Gia Monroe', email: 'gia@gileo.com', isConnected: true },
  { id: 'm-3', displayName: 'Nurse Valerie Azer', email: 'valerie@gileo.com', isConnected: false },
  { id: 'm-4', displayName: 'Nurse Keanu Anson', email: 'keanu@gileo.com', isConnected: false },
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

export function formatTwitterTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatFullTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }) + ' • ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Personalized Recommendation Score Ranking Algorithm
export function rankPostsForUser(
  allPosts: FeedPost[],
  connectedMemberNames: Set<string>,
  likedPostsMap: Record<string, boolean>,
): FeedPost[] {
  return [...allPosts].sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    if (connectedMemberNames.has(a.authorName)) scoreA += 50;
    if (connectedMemberNames.has(b.authorName)) scoreB += 50;

    scoreA += (a.likesCount || 0) * 10 + (a.commentsList?.length || 0) * 15;
    scoreB += (b.likesCount || 0) * 10 + (b.commentsList?.length || 0) * 15;

    if (likedPostsMap[a.id]) scoreA += 20;
    if (likedPostsMap[b.id]) scoreB += 20;

    const hoursA = (Date.now() - a.createdAt) / 3600000;
    const hoursB = (Date.now() - b.createdAt) / 3600000;
    scoreA += Math.max(0, 40 - hoursA * 2);
    scoreB += Math.max(0, 40 - hoursB * 2);

    return scoreB - scoreA;
  });
}

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<'for_you' | 'network' | 'elevate'>('for_you');
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [registeredMembers, setRegisteredMembers] = useState<RegisteredMember[]>(initialRegisteredMembers);
  const [memberConnectionsCount, setMemberConnectionsCount] = useState<Record<string, number>>({});
  const [cohorts, setCohorts] = useState<Cohort[]>(initialCohorts);
  const [refreshing, setRefreshing] = useState(false);

  // Add Friends Modal & Search State
  const [showAddFriendsModal, setShowAddFriendsModal] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Member Profile Preview Modal State
  const [selectedMemberProfile, setSelectedMemberProfile] = useState<RegisteredMember | null>(null);

  // Post Detail Modal State
  const [selectedPostDetail, setSelectedPostDetail] = useState<FeedPost | null>(null);

  // New Post State
  const [newPostText, setNewPostText] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Comment Input State
  const [commentInput, setCommentInput] = useState('');

  // Selected Cohort Modal State
  const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null);

  // Enrolment Paystack State
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [paystackUrl, setPaystackUrl] = useState<string | null>(null);
  const [enrolmentRef, setEnrolmentRef] = useState('');
  const [enrolmentSuccess, setEnrolmentSuccess] = useState(false);

  // Verification & Enrolment Success State
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [showEnrolmentSuccessModal, setShowEnrolmentSuccessModal] = useState(false);
  const [confirmedEnrolmentRef, setConfirmedEnrolmentRef] = useState('');
  const [confirmedCohortTitle, setConfirmedCohortTitle] = useState('');


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
      // 1. Load real registered members & user connections from backend
      const [membersRes, userConnections] = await Promise.all([
        apiRequest<any[]>('/community/members').catch(() => null),
        apiRequest<string[]>('/community/connections').catch(() => []),
      ]);

      const connectedSet = new Set(userConnections || []);

      if (Array.isArray(membersRes) && membersRes.length > 0) {
        const mappedMembers: RegisteredMember[] = membersRes.map((m) => ({
          id: m.id,
          displayName: m.displayName || m.email?.split('@')[0] || 'Gileo Member',
          email: m.email,
          role: m.role || 'CUSTOMER',
          isConnected: connectedSet.has(m.id),
        }));
        setRegisteredMembers(mappedMembers);
      }

      // 2. Load public community posts & user saved posts from backend
      const [backendPosts, userSavedPosts] = await Promise.all([
        apiRequest<any[]>('/community/posts').catch(() => null),
        apiRequest<any[]>('/community/saved-posts').catch(() => []),
      ]);

      const savedSet = new Set((userSavedPosts || []).map((sp) => sp.id));

      if (Array.isArray(backendPosts) && backendPosts.length > 0) {
        const mappedFeed: FeedPost[] = backendPosts.map((p) => ({
          id: p.id,
          authorId: p.authorId,
          authorName: p.authorName || 'Gileo Nurse',
          authorRole: p.authorRole || 'Community Member',
          createdAt: p.createdAt || Date.now(),
          category: p.category || 'Community Share',
          content: p.content,
          likesCount: p.likesCount || 0,
          commentsCount: p.commentsCount || 0,
          repostsCount: 0,
          isLiked: Boolean(p.isLiked),
          isSaved: savedSet.has(p.id),
          commentsList: p.commentsList || [],
        }));
        setPosts(mappedFeed);
      } else {
        setPosts([]);
      }

      // 3. Load cohorts
      const fetchedCohorts = await apiRequest<Cohort[]>('/learning/cohorts').catch(() => null);
      if (Array.isArray(fetchedCohorts) && fetchedCohorts.length > 0) {
        setCohorts(fetchedCohorts);
      }
    } catch {
      // Keep fallback
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

  const params = useLocalSearchParams<{ postId?: string; tab?: string }>();

  useEffect(() => {
    if (params.tab === 'elevate') {
      setActiveTab('elevate');
    }
    if (params.postId && posts.length > 0) {
      const target = posts.find((p) => p.id === params.postId);
      if (target) {
        setSelectedPostDetail(target);
      }
    }
  }, [params.postId, params.tab, posts]);

  const handleCallSupport = () => {
    void Linking.openURL('tel:+2348165335594');
  };

  const toggleConnectMember = async (member: RegisteredMember) => {
    try {
      const res = await apiRequest<any>('/community/connections/toggle', {
        method: 'POST',
        body: JSON.stringify({ targetUserId: member.id }),
      });

      const isConnected = Boolean(res?.isConnected);
      if (isConnected) {
        triggerToast(`Connected with ${member.displayName}`);
        void addNotification(user?.id || 'guest', {
          title: 'Connection Added',
          body: `You connected with ${member.displayName}.`,
          icon: 'paper-plane',
          iconBg: '#FFF1F2',
          iconColor: '#761B36',
        });
      } else {
        triggerToast(`Disconnected from ${member.displayName}`);
      }

      setRegisteredMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, isConnected } : m)),
      );
    } catch {
      triggerToast('Could not update connection status');
    }
  };

  const toggleLikePost = async (postId: string) => {
    const userIdKey = user?.id || 'guest';
    void apiRequest(`/community/posts/${postId}/like`, { method: 'POST' }).catch(() => null);

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isLiked = !p.isLiked;
          const newLikes = isLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1);
          if (isLiked) {
            void addNotification(userIdKey, {
              title: 'Post Liked',
              body: `You liked ${p.authorName}'s post.`,
              icon: 'heart',
              iconBg: '#FFF1F2',
              iconColor: '#EF4444',
            });
          }
          const updatedPost = { ...p, isLiked, likesCount: newLikes };
          if (selectedPostDetail?.id === postId) {
            setSelectedPostDetail(updatedPost);
          }
          return updatedPost;
        }
        return p;
      }),
    );
  };

  const toggleSavePost = async (postId: string) => {
    try {
      const res = await apiRequest<any>('/community/saved-posts/toggle', {
        method: 'POST',
        body: JSON.stringify({ postId }),
      });

      const isSaved = Boolean(res?.isSaved);
      triggerToast(isSaved ? 'Post bookmarked' : 'Removed from bookmarks');

      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            const updated = { ...p, isSaved };
            if (selectedPostDetail?.id === postId) {
              setSelectedPostDetail(updated);
            }
            return updated;
          }
          return p;
        }),
      );
    } catch {
      triggerToast('Could not update bookmark status');
    }
  };

  const handleSharePost = async (post: FeedPost) => {
    try {
      await Share.share({
        message: `Gileo Community Post by ${post.authorName}: "${post.content}" - Read on Gileo App!`,
      });
    } catch {
      triggerToast('Post link copied to clipboard');
    }
  };

  const handleCreatePost = async () => {
    if (!newPostText.trim()) {
      triggerToast('Please write something before publishing');
      return;
    }

    const token = await getStoredAccessToken();
    if (!token) {
      triggerToast('Please sign in to publish a community post');
      router.push('/login');
      return;
    }

    setIsPosting(true);

    try {
      await apiRequest('/community/posts', {
        method: 'POST',
        body: JSON.stringify({
          content: newPostText.trim(),
          category: 'Community Share',
        }),
      });

      setNewPostText('');
      triggerToast('Post published successfully!');

      // Re-fetch community feed directly from backend API
      await loadCommunityData();
    } catch (error) {
      triggerToast(
        error instanceof Error ? error.message : 'Could not publish post. Please try again.',
      );
    } finally {
      setIsPosting(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentInput.trim() || !selectedPostDetail) return;
    const commentText = commentInput.trim();
    const commenterName = user?.displayName || `Nurse ${getFirstName(user)}`;
    const userIdKey = user?.id || 'guest';

    const newCommentObj: CommentItem = {
      id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      authorName: commenterName,
      text: commentText,
      timeAgo: 'Just now',
    };

    void apiRequest(`/community/posts/${selectedPostDetail.id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text: commentText }),
    }).catch(() => null);

    setPosts((prev) => {
      const updated = prev.map((p) => {
        if (p.id === selectedPostDetail.id) {
          const updatedComments = [...p.commentsList, newCommentObj];
          const updatedPost = {
            ...p,
            commentsList: updatedComments,
            commentsCount: updatedComments.length,
          };
          setSelectedPostDetail(updatedPost);
          return updatedPost;
        }
        return p;
      });

      // Save to master global feed across all accounts!
      void AsyncStorage.setItem(GLOBAL_FEED_STORAGE_KEY, JSON.stringify(updated));
      void AsyncStorage.setItem('@gileo/community_feed_posts', JSON.stringify(updated));

      return updated;
    });

    setCommentInput('');
    triggerToast('Comment added');

    void addNotification(userIdKey, {
      title: 'Comment Added',
      body: `You commented on ${selectedPostDetail.authorName}'s post.`,
      icon: 'chatbubble',
      iconBg: '#F8F9FA',
      iconColor: '#761B36',
    });
  };

  const verifyCohortPaymentWithBackend = async (ref: string, cohortTitle?: string) => {
    if (!ref) return;
    setIsVerifyingPayment(true);
    try {
      const res = await apiRequest<any>(`/payments/verify/${encodeURIComponent(ref)}`, {
        method: 'POST',
      });

      if (res?.status === 'success' || res?.status === 'VERIFIED') {
        setSelectedCohort(null);
        setConfirmedEnrolmentRef(ref);
        if (cohortTitle) setConfirmedCohortTitle(cohortTitle);
        setShowEnrolmentSuccessModal(true);

        const currentU = user || (await getStoredUser());
        void addNotification(currentU?.id || 'guest', {
          title: 'Cohort Enrolment Confirmed',
          body: `Your enrolment in ${cohortTitle || 'Gileo Elevate'} has been verified!`,
          icon: 'school',
          iconBg: '#ECFDF5',
          iconColor: '#10B981',
        });
      } else {
        triggerToast('Payment could not be confirmed immediately. Please check back shortly.');
      }
    } catch (error) {
      triggerToast(
        error instanceof Error ? error.message : 'Could not verify cohort payment with server.',
      );
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  useEffect(() => {
    void LinkingExpo.getInitialURL().then((url) => {
      if (url && url.includes('payment-callback')) {
        try {
          WebBrowser.dismissBrowser();
          WebBrowser.dismissAuthSession();
        } catch (_) {}
        const parsed = LinkingExpo.parse(url);
        const ref = parsed.queryParams?.reference || parsed.queryParams?.trxref;
        if (ref) {
          void verifyCohortPaymentWithBackend(String(ref));
        }
      }
    });

    const handleDeepLink = (event: { url: string }) => {
      if (event.url && event.url.includes('payment-callback')) {
        try {
          WebBrowser.dismissBrowser();
          WebBrowser.dismissAuthSession();
        } catch (_) {}
        const parsed = LinkingExpo.parse(event.url);
        const ref = parsed.queryParams?.reference || parsed.queryParams?.trxref;
        if (ref) {
          void verifyCohortPaymentWithBackend(String(ref));
        }
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => {
      subscription.remove();
    };
  }, []);

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
      const ref = paymentRes.reference || 'GIL-COHORT';

      const redirectUrl = LinkingExpo.createURL('payment-callback');
      const browserResult = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl).catch(
        async () => {
          await Linking.openURL(authUrl);
          return null;
        },
      );

      try {
        WebBrowser.dismissBrowser();
        WebBrowser.dismissAuthSession();
      } catch (_) {}

      let returnedRef = ref;
      if (browserResult && browserResult.type === 'success' && browserResult.url) {
        const parsed = LinkingExpo.parse(browserResult.url);
        if (parsed.queryParams?.reference || parsed.queryParams?.trxref) {
          returnedRef = String(parsed.queryParams.reference || parsed.queryParams.trxref);
        }
      }

      // Cross-check payment with the backend
      await verifyCohortPaymentWithBackend(returnedRef, cohort.title);
    } catch (error) {
      triggerToast(
        error instanceof Error ? error.message : 'Could not complete enrolment payment.',
      );
    } finally {
      setIsEnrolling(false);
    }
  };

  // Connected Members Only for Top Avatar Row
  const connectedMembers = registeredMembers.filter((m) => m.isConnected);

  // Exclude current logged in user from Add Friends list
  const otherMembers = registeredMembers.filter(
    (m) =>
      m.id !== user?.id &&
      (!user?.email || m.email?.toLowerCase() !== user.email.toLowerCase()),
  );

  // Filtered members for Add Friends search
  const filteredSearchMembers = otherMembers.filter((m) => {
    if (!memberSearchQuery.trim()) return true;
    const q = memberSearchQuery.toLowerCase();
    return (
      m.displayName?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q)
    );
  });

  const unconnectedMembers = filteredSearchMembers.filter((m) => !m.isConnected);
  const myConnectedFriends = filteredSearchMembers.filter((m) => m.isConnected);

  // Filter feed for Network Tab
  const connectedMemberNames = new Set(
    connectedMembers.map((m) => m.displayName).filter(Boolean) as string[],
  );
  const rawPostsList =
    activeTab === 'network'
      ? posts.filter((p) => connectedMemberNames.has(p.authorName) || p.authorId === user?.id)
      : posts;

  // Liked Map for Recommendation Algorithm
  const likedMap: Record<string, boolean> = {};
  posts.forEach((p) => {
    if (p.isLiked) likedMap[p.id] = true;
  });

  // Apply Personalized Recommendation Score Ranking
  const filteredPosts =
    activeTab === 'for_you'
      ? rankPostsForUser(rawPostsList, connectedMemberNames, likedMap)
      : rawPostsList;

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
        stickyHeaderIndices={[1]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#761B36"
            colors={['#761B36']}
          />
        }
      >
        {/* Top Header & Connected Members Stories (Non-sticky Index 0) */}
        <View style={styles.headerAndStoriesSection}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greetingSubTitle}>Hello, {firstName} 👋</Text>
              <Text style={styles.headerTitle}>Gileo Community</Text>
            </View>

            <View style={styles.headerRightActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Find Nurses"
                onPress={() => setShowAddFriendsModal(true)}
                style={({ pressed }) => [styles.circleIconBtn, pressed && styles.pressed]}
              >
                <Ionicons name="person-add-outline" size={20} color="#761B36" />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Notifications"
                onPress={() => router.push('/notifications')}
                style={({ pressed }) => [styles.circleIconBtn, pressed && styles.pressed]}
              >
                <Ionicons name="notifications-outline" size={20} color="#0F172A" />
                <View style={styles.notifBadgeDot} />
              </Pressable>
            </View>
          </View>

          {/* Connected Members Top Story Ring Row */}
          <View style={styles.storiesContainer}>
            <View style={styles.storiesHeaderRow}>
              <Text style={styles.storiesHeaderTitle}>Your Connections ({connectedMembers.length})</Text>
              <Pressable onPress={() => setShowAddFriendsModal(true)}>
                <Text style={styles.addMoreLink}>+ Find Nurses</Text>
              </Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesRow}>
              {connectedMembers.length === 0 ? (
                <Pressable style={styles.emptyStoryCard} onPress={() => setShowAddFriendsModal(true)}>
                  <Ionicons name="person-add-outline" size={20} color="#761B36" />
                  <Text style={styles.emptyStoryText}>Connect with Nurses</Text>
                </Pressable>
              ) : (
                connectedMembers.map((member) => (
                  <Pressable
                    key={member.id}
                    style={styles.storyItem}
                    onPress={() => setSelectedMemberProfile(member)}
                  >
                    <View style={styles.storyAvatarRingActive}>
                      <View style={styles.storyAvatarCircle}>
                        <Text style={styles.storyAvatarInitial}>
                          {(member.displayName || 'N').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.storyNameText} numberOfLines={1}>
                      {member.displayName || 'Nurse'}
                    </Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </View>

        {/* Sticky Header Segmented Control Feed Tabs (Index 1) */}
        <View style={styles.stickyTabWrapper}>
          <View style={styles.segmentedTabBar}>
            <Pressable
              onPress={() => setActiveTab('for_you')}
              style={[styles.segmentedItem, activeTab === 'for_you' && styles.segmentedItemActive]}
            >
              <Text style={[styles.segmentedLabel, activeTab === 'for_you' && styles.segmentedLabelActive]}>
                For You
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('network')}
              style={[styles.segmentedItem, activeTab === 'network' && styles.segmentedItemActive]}
            >
              <Text style={[styles.segmentedLabel, activeTab === 'network' && styles.segmentedLabelActive]}>
                My Network ({connectedMembers.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('elevate')}
              style={[styles.segmentedItem, activeTab === 'elevate' && styles.segmentedItemActive]}
            >
              <Text style={[styles.segmentedLabel, activeTab === 'elevate' && styles.segmentedLabelActive]}>
                Elevate ({cohorts.length})
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Main Feed Body Content */}
        <Animated.View
          style={{
            gap: 16,
            opacity: pageFadeAnim,
            transform: [{ translateY: pageSlideAnim }],
          }}
        >
          {activeTab !== 'elevate' ? (
            <>
              {/* Facebook-Style Create Post Box */}
              <View style={styles.createPostCard}>
                <View style={styles.createPostTopRow}>
                  <View style={styles.smallAvatarCircle}>
                    <Text style={styles.smallAvatarText}>{firstName.charAt(0).toUpperCase()}</Text>
                  </View>
                  <TextInput
                    value={newPostText}
                    onChangeText={setNewPostText}
                    placeholder="Share an update or question with fellow nurses..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    style={styles.createPostInput}
                  />
                </View>

                {newPostText.trim().length > 0 && (
                  <View style={styles.createPostFooter}>
                    <Pressable
                      style={[styles.publishPillBtn, isPosting && { opacity: 0.6 }]}
                      disabled={isPosting}
                      onPress={handleCreatePost}
                    >
                      <Text style={styles.publishPillBtnText}>
                        {isPosting ? 'Publishing...' : 'Post Update'}
                      </Text>
                      <Ionicons name="send" size={14} color="#FFFFFF" />
                    </Pressable>
                  </View>
                )}
              </View>

              {/* Feed Posts List */}
              <View style={styles.feedList}>
                {filteredPosts.length === 0 ? (
                  <View style={styles.emptyFeedCard}>
                    <Ionicons name="people-outline" size={40} color="#CBD5E1" />
                    <Text style={styles.emptyFeedTitle}>No posts in your Network yet</Text>
                    <Text style={styles.emptyFeedSub}>
                      Connect with registered nurses on Gileo to see their updates here!
                    </Text>
                    <Pressable
                      style={styles.connectNowBtn}
                      onPress={() => setShowAddFriendsModal(true)}
                    >
                      <Text style={styles.connectNowText}>Find Nurses to Connect</Text>
                    </Pressable>
                  </View>
                ) : (
                  filteredPosts.map((post) => (
                    <Pressable
                      key={post.id}
                      style={styles.feedPostCard}
                      onPress={() => setSelectedPostDetail(post)}
                    >
                      {/* Author Header */}
                      <View style={styles.postHeaderRow}>
                        <Pressable
                          style={styles.authorAvatarCircle}
                          onPress={(e) => {
                            e.stopPropagation();
                            const memberObj = registeredMembers.find(
                              (m) => m.displayName === post.authorName,
                            ) || {
                              id: post.authorId || 'm-1',
                              displayName: post.authorName,
                              email: 'nurse@gileo.com',
                              role: post.authorRole,
                              isConnected: connectedMemberNames.has(post.authorName),
                            };
                            setSelectedMemberProfile(memberObj);
                          }}
                        >
                          <Text style={styles.authorAvatarInitial}>
                            {post.authorName.charAt(0).toUpperCase()}
                          </Text>
                        </Pressable>

                        <Pressable
                          style={{ flex: 1 }}
                          onPress={(e) => {
                            e.stopPropagation();
                            const memberObj = registeredMembers.find(
                              (m) => m.displayName === post.authorName,
                            ) || {
                              id: post.authorId || 'm-1',
                              displayName: post.authorName,
                              email: 'nurse@gileo.com',
                              role: post.authorRole,
                              isConnected: connectedMemberNames.has(post.authorName),
                            };
                            setSelectedMemberProfile(memberObj);
                          }}
                        >
                          <Text style={styles.authorNameText}>{post.authorName}</Text>
                          <Text style={styles.authorRoleText}>
                            {post.authorRole} • {formatTwitterTime(post.createdAt)}
                          </Text>
                        </Pressable>
                      </View>

                      {/* Content Body */}
                      <Text style={styles.postContentText}>{post.content}</Text>

                      {/* Interactive Action Bar */}
                      <View style={styles.socialActionBar}>
                        <Pressable
                          style={styles.actionItem}
                          onPress={(e) => {
                            e.stopPropagation();
                            toggleLikePost(post.id);
                          }}
                          hitSlop={8}
                        >
                          <Ionicons
                            name={post.isLiked ? 'heart' : 'heart-outline'}
                            size={20}
                            color={post.isLiked ? '#EF4444' : '#64748B'}
                          />
                          <Text style={[styles.actionCountText, post.isLiked && { color: '#EF4444' }]}>
                            {post.likesCount}
                          </Text>
                        </Pressable>

                        <Pressable
                          style={styles.actionItem}
                          onPress={(e) => {
                            e.stopPropagation();
                            setSelectedPostDetail(post);
                          }}
                          hitSlop={8}
                        >
                          <Ionicons name="chatbubble-outline" size={18} color="#64748B" />
                          <Text style={styles.actionCountText}>{post.commentsCount}</Text>
                        </Pressable>

                        <Pressable
                          style={styles.actionItem}
                          onPress={(e) => {
                            e.stopPropagation();
                            void handleSharePost(post);
                          }}
                          hitSlop={8}
                        >
                          <Ionicons name="share-outline" size={20} color="#64748B" />
                          <Text style={styles.actionCountText}>Share</Text>
                        </Pressable>

                        <Pressable
                          style={[styles.actionItem, { marginLeft: 'auto' }]}
                          onPress={(e) => {
                            e.stopPropagation();
                            toggleSavePost(post.id);
                          }}
                          hitSlop={8}
                        >
                          <Ionicons
                            name={post.isSaved ? 'bookmark' : 'bookmark-outline'}
                            size={19}
                            color={post.isSaved ? '#761B36' : '#64748B'}
                          />
                        </Pressable>
                      </View>
                    </Pressable>
                  ))
                )}
              </View>
            </>
          ) : (
            /* Tab Content 3: Gileo Elevate Paid Cohorts */
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

          {/* Twitter / X-Style Full Post Detail Screen Modal */}
          <Modal
            visible={Boolean(selectedPostDetail)}
            animationType="slide"
            onRequestClose={() => setSelectedPostDetail(null)}
          >
            <SafeAreaView style={styles.modalSafeArea}>
              {selectedPostDetail && (
                <>
                  <View style={styles.modalHeader}>
                    <Pressable onPress={() => setSelectedPostDetail(null)} style={styles.circleBtn}>
                      <Ionicons name="arrow-back" size={20} color="#0F172A" />
                    </Pressable>
                    <Text style={styles.modalHeaderTitle}>Post</Text>
                    <Pressable
                      onPress={() => handleSharePost(selectedPostDetail)}
                      style={styles.circleBtn}
                    >
                      <Ionicons name="share-outline" size={18} color="#0F172A" />
                    </Pressable>
                  </View>

                  <ScrollView contentContainerStyle={styles.postDetailScrollContent}>
                    {/* Author Details Header */}
                    <View style={styles.postDetailAuthorRow}>
                      <Pressable
                        style={styles.postDetailAvatarCircle}
                        onPress={() => {
                          const memberObj = registeredMembers.find(
                            (m) => m.displayName === selectedPostDetail.authorName,
                          ) || {
                            id: selectedPostDetail.authorId || 'm-1',
                            displayName: selectedPostDetail.authorName,
                            email: 'nurse@gileo.com',
                            role: selectedPostDetail.authorRole,
                            isConnected: connectedMemberNames.has(selectedPostDetail.authorName),
                          };
                          setSelectedMemberProfile(memberObj);
                        }}
                      >
                        <Text style={styles.postDetailAvatarText}>
                          {selectedPostDetail.authorName.charAt(0).toUpperCase()}
                        </Text>
                      </Pressable>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.postDetailAuthorName}>{selectedPostDetail.authorName}</Text>
                        <Text style={styles.postDetailAuthorRole}>{selectedPostDetail.authorRole}</Text>
                      </View>
                    </View>

                    {/* Post Full Body Content */}
                    <Text style={styles.postDetailBodyText}>{selectedPostDetail.content}</Text>

                    {/* Full Timestamp */}
                    <Text style={styles.fullTimestampText}>
                      {formatFullTime(selectedPostDetail.createdAt)}
                    </Text>

                    {/* Engagement Metrics Stats Bar */}
                    <View style={styles.metricsStatsBar}>
                      <Text style={styles.metricText}>
                        <Text style={styles.metricBold}>{selectedPostDetail.likesCount}</Text> Likes
                      </Text>
                      <Text style={styles.metricText}>
                        <Text style={styles.metricBold}>{selectedPostDetail.commentsList.length}</Text> Comments
                      </Text>
                      <Text style={styles.metricText}>
                        <Text style={styles.metricBold}>{selectedPostDetail.repostsCount}</Text> Reposts
                      </Text>
                    </View>

                    {/* Action Bar */}
                    <View style={styles.detailActionBar}>
                      <Pressable
                        style={styles.detailActionBtn}
                        onPress={() => toggleLikePost(selectedPostDetail.id)}
                      >
                        <Ionicons
                          name={selectedPostDetail.isLiked ? 'heart' : 'heart-outline'}
                          size={22}
                          color={selectedPostDetail.isLiked ? '#EF4444' : '#64748B'}
                        />
                      </Pressable>

                      <Pressable style={styles.detailActionBtn}>
                        <Ionicons name="chatbubble-outline" size={20} color="#64748B" />
                      </Pressable>

                      <Pressable
                        style={styles.detailActionBtn}
                        onPress={() => handleSharePost(selectedPostDetail)}
                      >
                        <Ionicons name="repeat-outline" size={22} color="#64748B" />
                      </Pressable>

                      <Pressable
                        style={styles.detailActionBtn}
                        onPress={() => toggleSavePost(selectedPostDetail.id)}
                      >
                        <Ionicons
                          name={selectedPostDetail.isSaved ? 'bookmark' : 'bookmark-outline'}
                          size={20}
                          color={selectedPostDetail.isSaved ? '#761B36' : '#64748B'}
                        />
                      </Pressable>
                    </View>

                    {/* Comments List */}
                    <View style={styles.commentsContainerSection}>
                      <Text style={styles.commentsSectionTitle}>
                        Comments ({selectedPostDetail.commentsList.length})
                      </Text>

                      {selectedPostDetail.commentsList.length === 0 ? (
                        <Text style={styles.emptyCommentsNote}>
                          No comments yet. Be the first to comment!
                        </Text>
                      ) : (
                        selectedPostDetail.commentsList.map((c, idx) => (
                          <View key={c.id || idx} style={styles.singleCommentCard}>
                            <Pressable
                              onPress={() => {
                                const memberObj = registeredMembers.find(
                                  (m) => m.displayName === c.authorName || m.email === c.authorName,
                                ) || {
                                  id: 'm-c',
                                  displayName: c.authorName,
                                  email: 'nurse@gileo.com',
                                  role: 'Community Nurse',
                                  isConnected: connectedMemberNames.has(c.authorName),
                                };
                                setSelectedMemberProfile(memberObj);
                              }}
                            >
                              <Ionicons name="person-circle-outline" size={26} color="#761B36" />
                            </Pressable>
                            <View style={{ flex: 1 }}>
                              <Pressable
                                onPress={() => {
                                  const memberObj = registeredMembers.find(
                                    (m) => m.displayName === c.authorName || m.email === c.authorName,
                                  ) || {
                                    id: 'm-c',
                                    displayName: c.authorName,
                                    email: 'nurse@gileo.com',
                                    role: 'Community Nurse',
                                    isConnected: connectedMemberNames.has(c.authorName),
                                  };
                                  setSelectedMemberProfile(memberObj);
                                }}
                              >
                                <Text style={styles.commentAuthorText}>{c.authorName}</Text>
                              </Pressable>
                              <Text style={styles.commentBodyText}>{c.text}</Text>
                            </View>
                          </View>
                        ))
                      )}
                    </View>
                  </ScrollView>

                  {/* Comment Input Sticky Bar */}
                  <View style={styles.commentInputRow}>
                    <TextInput
                      value={commentInput}
                      onChangeText={setCommentInput}
                      placeholder="Post your reply..."
                      placeholderTextColor="#94A3B8"
                      style={styles.commentInputField}
                    />
                    <Pressable style={styles.sendCommentBtn} onPress={handleAddComment}>
                      <Ionicons name="send" size={16} color="#FFFFFF" />
                    </Pressable>
                  </View>
                </>
              )}
            </SafeAreaView>
          </Modal>

          {/* Member Profile Preview Modal */}
          <Modal
            visible={Boolean(selectedMemberProfile)}
            animationType="slide"
            onRequestClose={() => setSelectedMemberProfile(null)}
          >
            <SafeAreaView style={styles.modalSafeArea}>
              {selectedMemberProfile && (
                <>
                  <View style={styles.modalHeader}>
                    <Pressable onPress={() => setSelectedMemberProfile(null)} style={styles.circleBtn}>
                      <Ionicons name="arrow-back" size={20} color="#0F172A" />
                    </Pressable>
                    <Text style={styles.modalHeaderTitle}>Nurse Profile</Text>
                    <View style={{ width: 40 }} />
                  </View>

                  <ScrollView contentContainerStyle={styles.memberProfileScrollContent}>
                    {/* User Profile Card */}
                    <View style={styles.memberProfileHeroCard}>
                      <View style={styles.memberLargeAvatarCircle}>
                        <Text style={styles.memberLargeAvatarText}>
                          {(selectedMemberProfile.displayName || 'N').charAt(0).toUpperCase()}
                        </Text>
                      </View>

                      <Text style={styles.memberProfileName}>{selectedMemberProfile.displayName}</Text>
                      <Text style={styles.memberProfileEmail}>{selectedMemberProfile.email || 'Registered Nurse'}</Text>

                      <View style={styles.statsBarRow}>
                        <View style={styles.memberRoleBadge}>
                          <Ionicons name="shield-checkmark" size={12} color="#10B981" />
                          <Text style={styles.memberRoleText}>Verified Member</Text>
                        </View>

                        <View style={styles.connectionsCountPill}>
                          <Ionicons name="people" size={12} color="#761B36" />
                          <Text style={styles.connectionsCountText}>
                            {memberConnectionsCount[selectedMemberProfile.id] !== undefined
                              ? memberConnectionsCount[selectedMemberProfile.id]
                              : selectedMemberProfile.isConnected
                              ? 1
                              : 0}{' '}
                            Connection
                          </Text>
                        </View>
                      </View>

                      {/* Connect / Disconnect Action Button (Hidden for own self) */}
                      {selectedMemberProfile.id !== user?.id &&
                        selectedMemberProfile.email?.toLowerCase() !== user?.email?.toLowerCase() && (
                          <Pressable
                            style={[
                              styles.memberConnectBtn,
                              selectedMemberProfile.isConnected && styles.memberConnectBtnActive,
                            ]}
                            onPress={() => toggleConnectMember(selectedMemberProfile)}
                          >
                            <Ionicons
                              name={selectedMemberProfile.isConnected ? 'checkmark' : 'person-add'}
                              size={16}
                              color={selectedMemberProfile.isConnected ? '#761B36' : '#FFFFFF'}
                            />
                            <Text
                              style={[
                                styles.memberConnectText,
                                selectedMemberProfile.isConnected && styles.memberConnectTextActive,
                              ]}
                            >
                              {selectedMemberProfile.isConnected ? 'Connected' : 'Add Friend'}
                            </Text>
                          </Pressable>
                        )}
                    </View>

                    {/* Member's Published Posts with full feed structure */}
                    <View style={styles.memberPostsSection}>
                      <Text style={styles.memberPostsHeading}>Posts by {selectedMemberProfile.displayName}</Text>

                      {posts.filter((p) => p.authorName === selectedMemberProfile.displayName).length === 0 ? (
                        <Text style={styles.emptyMemberPostsText}>No posts published yet.</Text>
                      ) : (
                        posts
                          .filter((p) => p.authorName === selectedMemberProfile.displayName)
                          .map((post) => (
                            <Pressable
                              key={post.id}
                              style={styles.feedPostCard}
                              onPress={() => {
                                setSelectedMemberProfile(null);
                                setSelectedPostDetail(post);
                              }}
                            >
                              <View style={styles.postHeaderRow}>
                                <View style={styles.authorAvatarCircle}>
                                  <Text style={styles.authorAvatarInitial}>
                                    {post.authorName.charAt(0).toUpperCase()}
                                  </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.authorNameText}>{post.authorName}</Text>
                                  <Text style={styles.authorRoleText}>
                                    {post.authorRole} • {formatTwitterTime(post.createdAt)}
                                  </Text>
                                </View>
                              </View>

                              <Text style={styles.postContentText}>{post.content}</Text>

                              <View style={styles.socialActionBar}>
                                <Pressable
                                  style={styles.actionItem}
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    toggleLikePost(post.id);
                                  }}
                                  hitSlop={8}
                                >
                                  <Ionicons
                                    name={post.isLiked ? 'heart' : 'heart-outline'}
                                    size={20}
                                    color={post.isLiked ? '#EF4444' : '#64748B'}
                                  />
                                  <Text style={[styles.actionCountText, post.isLiked && { color: '#EF4444' }]}>
                                    {post.likesCount}
                                  </Text>
                                </Pressable>

                                <Pressable
                                  style={styles.actionItem}
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    setSelectedMemberProfile(null);
                                    setSelectedPostDetail(post);
                                  }}
                                  hitSlop={8}
                                >
                                  <Ionicons name="chatbubble-outline" size={18} color="#64748B" />
                                  <Text style={styles.actionCountText}>{post.commentsCount}</Text>
                                </Pressable>

                                <Pressable
                                  style={styles.actionItem}
                                  onPress={(e) => {
                                    e.stopPropagation();
                                    void handleSharePost(post);
                                  }}
                                  hitSlop={8}
                                >
                                  <Ionicons name="share-outline" size={20} color="#64748B" />
                                  <Text style={styles.actionCountText}>Share</Text>
                                </Pressable>
                              </View>
                            </Pressable>
                          ))
                      )}
                    </View>
                  </ScrollView>
                </>
              )}
            </SafeAreaView>
          </Modal>

          {/* Add Friends Modal (Search + Separate Connected vs New) */}
          <Modal
            visible={showAddFriendsModal}
            animationType="slide"
            onRequestClose={() => setShowAddFriendsModal(false)}
          >
            <SafeAreaView style={styles.modalSafeArea}>
              <View style={styles.modalHeader}>
                <Pressable onPress={() => setShowAddFriendsModal(false)} style={styles.circleBtn}>
                  <Ionicons name="close" size={20} color="#0F172A" />
                </Pressable>
                <Text style={styles.modalHeaderTitle}>Find Nurses & Add Friends</Text>
                <View style={{ width: 40 }} />
              </View>

              <ScrollView contentContainerStyle={styles.addFriendsContent}>
                {/* Search Bar */}
                <View style={styles.memberSearchBox}>
                  <Ionicons name="search-outline" size={18} color="#94A3B8" />
                  <TextInput
                    value={memberSearchQuery}
                    onChangeText={setMemberSearchQuery}
                    placeholder="Search nurse by name or email..."
                    placeholderTextColor="#94A3B8"
                    style={styles.memberSearchInput}
                  />
                  {memberSearchQuery.length > 0 && (
                    <Pressable onPress={() => setMemberSearchQuery('')} hitSlop={8}>
                      <Ionicons name="close-circle" size={18} color="#94A3B8" />
                    </Pressable>
                  )}
                </View>

                {/* Section 1: My Connected Nurses */}
                {myConnectedFriends.length > 0 && (
                  <View style={styles.registeredListGroup}>
                    <Text style={styles.groupSectionHeaderTitle}>My Connections ({myConnectedFriends.length})</Text>
                    {myConnectedFriends.map((member) => (
                      <View key={member.id} style={styles.registeredCard}>
                        <Pressable
                          style={styles.registeredAvatarCircle}
                          onPress={() => {
                            setShowAddFriendsModal(false);
                            setSelectedMemberProfile(member);
                          }}
                        >
                          <Text style={styles.registeredAvatarInitial}>
                            {(member.displayName || 'N').charAt(0).toUpperCase()}
                          </Text>
                        </Pressable>

                        <Pressable
                          style={{ flex: 1, gap: 2 }}
                          onPress={() => {
                            setShowAddFriendsModal(false);
                            setSelectedMemberProfile(member);
                          }}
                        >
                          <Text style={styles.registeredName}>{member.displayName}</Text>
                          <Text style={styles.registeredRole}>{member.email || 'Registered Nurse'}</Text>
                        </Pressable>

                        <Pressable
                          style={styles.connectPillBtnActive}
                          onPress={() => toggleConnectMember(member)}
                        >
                          <Ionicons name="checkmark" size={14} color="#761B36" />
                          <Text style={styles.connectPillTextActive}>Connected</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}

                {/* Section 2: Discover New Registered Nurses */}
                <View style={styles.registeredListGroup}>
                  <Text style={styles.groupSectionHeaderTitle}>
                    Discover Nurses ({unconnectedMembers.length})
                  </Text>

                  {unconnectedMembers.length === 0 ? (
                    <Text style={styles.emptySearchText}>
                      No new nurses found matching "{memberSearchQuery}".
                    </Text>
                  ) : (
                    unconnectedMembers.map((member) => (
                      <View key={member.id} style={styles.registeredCard}>
                        <Pressable
                          style={styles.registeredAvatarCircle}
                          onPress={() => {
                            setShowAddFriendsModal(false);
                            setSelectedMemberProfile(member);
                          }}
                        >
                          <Text style={styles.registeredAvatarInitial}>
                            {(member.displayName || 'N').charAt(0).toUpperCase()}
                          </Text>
                        </Pressable>

                        <Pressable
                          style={{ flex: 1, gap: 2 }}
                          onPress={() => {
                            setShowAddFriendsModal(false);
                            setSelectedMemberProfile(member);
                          }}
                        >
                          <Text style={styles.registeredName}>{member.displayName}</Text>
                          <Text style={styles.registeredRole}>{member.email || 'Registered Nurse'}</Text>
                        </Pressable>

                        <Pressable
                          style={styles.connectPillBtn}
                          onPress={() => toggleConnectMember(member)}
                        >
                          <Ionicons name="person-add" size={14} color="#FFFFFF" />
                          <Text style={styles.connectPillText}>Add Friend</Text>
                        </Pressable>
                      </View>
                    ))
                  )}
                </View>
              </ScrollView>
            </SafeAreaView>
          </Modal>

          {/* Cohort Paystack Enrolment Modal */}
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
                      onPress={() => setSelectedCohort(null)}
                      style={styles.circleBtn}
                    >
                      <Ionicons name="close" size={20} color="#0F172A" />
                    </Pressable>
                    <Text style={styles.modalHeaderTitle}>Gileo Elevate Enrolment</Text>
                    <View style={{ width: 40 }} />
                  </View>

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
                </>
              )}
            </SafeAreaView>
          </Modal>

          {/* Enrolment Success Modal */}
          <Modal
            visible={showEnrolmentSuccessModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowEnrolmentSuccessModal(false)}
          >
            <View style={styles.successModalOverlay}>
              <View style={styles.successCard}>
                <View style={styles.successBadgeBox}>
                  <Ionicons name="checkmark-circle" size={64} color="#10B981" />
                </View>

                <Text style={styles.successHeading}>Your enrolment was successful!</Text>
                <Text style={styles.successMessage}>
                  {confirmedCohortTitle
                    ? `You are now enrolled in ${confirmedCohortTitle}. Your payment has been verified by the server.`
                    : 'Congratulations! Your payment has been verified and your enrolment is active.'}
                </Text>

                {confirmedEnrolmentRef ? (
                  <View style={styles.orderRefBadge}>
                    <Text style={styles.orderRefLabel}>ENROLMENT REFERENCE</Text>
                    <Text style={styles.orderRefValue}>{confirmedEnrolmentRef}</Text>
                  </View>
                ) : null}

                <View style={styles.successActionButtons}>
                  <Pressable
                    style={styles.primarySuccessBtn}
                    onPress={() => setShowEnrolmentSuccessModal(false)}
                  >
                    <Text style={styles.primarySuccessBtnText}>Back to Community</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>

          {/* Verifying Payment Overlay */}
          <Modal
            visible={isVerifyingPayment}
            transparent
            animationType="fade"
            onRequestClose={() => {}}
          >
            <View style={styles.verifyingModalOverlay}>
              <View style={styles.verifyingCard}>
                <ActivityIndicator size="large" color="#761B36" />
                <Text style={styles.verifyingTitle}>Verifying Payment...</Text>
                <Text style={styles.verifyingSub}>Confirming enrolment with Gileo server</Text>
              </View>
            </View>
          </Modal>

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

          <Text style={styles.footerNote}>GILEO MEDICALS GLOBAL LIMITED • 2026</Text>
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 96,
    gap: 16,
  },
  headerAndStoriesSection: {
    gap: 16,
  },
  stickyTabWrapper: {
    backgroundColor: '#F6F7F9',
    paddingVertical: 4,
    zIndex: 99,
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
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  storiesContainer: {
    gap: 10,
  },
  storiesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  storiesHeaderTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  addMoreLink: {
    color: '#761B36',
    fontSize: 12,
    fontWeight: '700',
  },
  storiesRow: {
    gap: 16,
    paddingVertical: 4,
  },
  emptyStoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECEF',
  },
  emptyStoryText: {
    color: '#761B36',
    fontSize: 13,
    fontWeight: '700',
  },
  storyItem: {
    alignItems: 'center',
    gap: 4,
    width: 68,
  },
  storyAvatarRingActive: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#761B36',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  storyAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAvatarInitial: {
    color: '#761B36',
    fontSize: 16,
    fontWeight: '800',
  },
  storyNameText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  segmentedTabBar: {
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
  segmentedItem: {
    flex: 1,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedItemActive: {
    backgroundColor: '#761B36',
  },
  segmentedLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  segmentedLabelActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  createPostCard: {
    padding: 16,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    gap: 12,
  },
  createPostTopRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  smallAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#761B36',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  createPostInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 14,
    minHeight: 40,
    paddingTop: 8,
  },
  createPostFooter: {
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  publishPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#761B36',
  },
  publishPillBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  feedList: {
    gap: 14,
  },
  emptyFeedCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    gap: 12,
  },
  emptyFeedTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  emptyFeedSub: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
  },
  connectNowBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#761B36',
    marginTop: 4,
  },
  connectNowText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  feedPostCard: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    gap: 12,
  },
  postHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  authorAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAvatarInitial: {
    color: '#761B36',
    fontSize: 16,
    fontWeight: '800',
  },
  authorNameText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  authorRoleText: {
    color: '#64748B',
    fontSize: 11,
  },
  postContentText: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 22,
  },
  socialActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionCountText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  postDetailScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
  },
  postDetailAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  postDetailAvatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#761B36',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postDetailAvatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  postDetailAuthorName: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
  },
  postDetailAuthorRole: {
    color: '#64748B',
    fontSize: 12,
  },
  postDetailBodyText: {
    color: '#0F172A',
    fontSize: 17,
    lineHeight: 26,
  },
  fullTimestampText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  metricsStatsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  metricText: {
    color: '#64748B',
    fontSize: 13,
  },
  metricBold: {
    color: '#0F172A',
    fontWeight: '800',
  },
  detailActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailActionBtn: {
    padding: 8,
  },
  commentsContainerSection: {
    gap: 12,
    marginTop: 8,
  },
  commentsSectionTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  emptyCommentsNote: {
    color: '#94A3B8',
    fontSize: 13,
    fontStyle: 'italic',
  },
  singleCommentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EAECEF',
  },
  commentAuthorText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
  commentBodyText: {
    color: '#334155',
    fontSize: 13,
    marginTop: 2,
  },
  memberProfileScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 16,
  },
  memberProfileHeroCard: {
    padding: 24,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    alignItems: 'center',
    gap: 10,
  },
  memberLargeAvatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#761B36',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  memberLargeAvatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  memberProfileName: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
  },
  memberProfileEmail: {
    color: '#64748B',
    fontSize: 13,
  },
  statsBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  memberRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#ECFDF5',
  },
  memberRoleText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
  },
  connectionsCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FFF1F2',
  },
  connectionsCountText: {
    color: '#761B36',
    fontSize: 11,
    fontWeight: '700',
  },
  memberConnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#761B36',
    marginTop: 8,
  },
  memberConnectBtnActive: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  memberConnectText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  memberConnectTextActive: {
    color: '#761B36',
  },
  memberPostsSection: {
    gap: 12,
  },
  memberPostsHeading: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  emptyMemberPostsText: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 20,
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
  addFriendsContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 16,
  },
  addFriendsSub: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 20,
  },
  memberSearchBox: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EAECEF',
    gap: 10,
  },
  memberSearchInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 14,
  },
  registeredListGroup: {
    gap: 10,
  },
  groupSectionHeaderTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  emptySearchText: {
    color: '#94A3B8',
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  registeredCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    gap: 12,
  },
  registeredAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registeredAvatarInitial: {
    color: '#761B36',
    fontSize: 16,
    fontWeight: '800',
  },
  registeredName: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  registeredRole: {
    color: '#64748B',
    fontSize: 11,
  },
  connectPillBtn: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#761B36',
  },
  connectPillBtnActive: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  connectPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  connectPillTextActive: {
    color: '#761B36',
    fontSize: 12,
    fontWeight: '700',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  commentInputField: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EAECEF',
    paddingHorizontal: 16,
    color: '#0F172A',
    fontSize: 14,
  },
  sendCommentBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#761B36',
    alignItems: 'center',
    justifyContent: 'center',
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
  modalSectionHeaderTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  detailOverviewText: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 22,
  },
  modalOutcomeRow: {
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
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  successCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
    gap: 12,
    elevation: 8,
  },
  successBadgeBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  successHeading: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  successMessage: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  orderRefBadge: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    width: '100%',
    marginVertical: 4,
  },
  orderRefLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  orderRefValue: {
    color: '#761B36',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  successActionButtons: {
    width: '100%',
    gap: 10,
    marginTop: 8,
  },
  primarySuccessBtn: {
    height: 50,
    borderRadius: 999,
    backgroundColor: '#761B36',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primarySuccessBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  verifyingModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  verifyingCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 28,
    alignItems: 'center',
    gap: 12,
  },
  verifyingTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  verifyingSub: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
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
