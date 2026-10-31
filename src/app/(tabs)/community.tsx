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
import { AdminOrdersView } from '../../components/admin/AdminOrdersView';

import { apiRequest } from '../../services/api';
import { AuthUser, getStoredAccessToken, getStoredUser } from '../../services/auth';
import { addNotification } from '../../services/notificationsStorage';

WebBrowser.maybeCompleteAuthSession();

import { getFirstName } from './profile';
import { colors, formatKobo, spacing } from '../../theme/colors';

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
  isReposted?: boolean;
  commentsList: CommentItem[];
  category?: string;
};

type EBook = {
  id: string;
  title: string;
  author: string;
  description: string;
  priceKobo: number;
  coverBg: string;
};

const initialEBooks: EBook[] = [
  {
    id: 'ebook-1',
    title: 'How to Become a Nurse Concierge',
    author: 'Gileo Medicals Learning Hub',
    description:
      'A comprehensive step-by-step roadmap to building an independent concierge nursing practice and high-value clinical consulting.',
    priceKobo: 1500000,
    coverBg: '#F10505',
  },
  {
    id: 'ebook-2',
    title: 'How to Build a Professional Nursing Portfolio',
    author: 'Gileo Medicals Learning Hub',
    description:
      'Master executive portfolio design, credential presentation, and international leadership documentation.',
    priceKobo: 1250000,
    coverBg: '#1E3A8A',
  },
  {
    id: 'ebook-3',
    title: 'How to Present Yourself Professionally as a Nursing Leader',
    author: 'Gileo Medicals Learning Hub',
    description:
      'Executive communication, clinical influence, and strategic presence for modern healthcare leaders.',
    priceKobo: 1500000,
    coverBg: '#059669',
  },
  {
    id: 'ebook-4',
    title: 'How to Build a Career in Nursing Leadership',
    author: 'Gileo Medicals Learning Hub',
    description:
      'Strategic career mapping from bedside nursing to healthcare management and global executive roles.',
    priceKobo: 1800000,
    coverBg: '#4F46E5',
  },
  {
    id: 'ebook-5',
    title: 'Global Nursing Careers & Opportunities',
    author: 'Gileo Medicals Learning Hub',
    description:
      'Complete guide to international licensure, visa sponsorship, relocation, and working overseas as a registered nurse.',
    priceKobo: 2000000,
    coverBg: '#B45309',
  },
];

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

const fallbackCommunityPosts: FeedPost[] = [
  {
    id: 'seed-post-1',
    authorId: 'system-nurse-1',
    authorName: 'Nurse Laila Gibson',
    authorRole: 'Executive Nurse Consultant',
    createdAt: Date.now() - 3600000 * 2,
    category: 'Career Growth',
    content:
      'Transitioning from bedside nursing to concierge healthcare has been the most fulfilling career move. For any nurse considering executive nursing consulting, start building your portfolio today!',
    likesCount: 12,
    commentsCount: 1,
    repostsCount: 2,
    isLiked: false,
    isSaved: false,
    isReposted: false,
    commentsList: [
      {
        id: 'c-1',
        authorName: 'Nurse Gia Monroe',
        text: 'So inspiring! Thank you for setting the pace for us.',
      },
    ],
  },
  {
    id: 'seed-post-2',
    authorId: 'system-nurse-2',
    authorName: 'Nurse Gia Monroe',
    authorRole: 'Clinical Practice Lead',
    createdAt: Date.now() - 3600000 * 5,
    category: 'Global Nursing',
    content:
      'Just completed the NCLEX international licensure documentation roadmap! For nurses looking into UK/US registration, make sure your credentials and transcripts are certified early.',
    likesCount: 24,
    commentsCount: 0,
    repostsCount: 8,
    isLiked: false,
    isSaved: false,
    isReposted: false,
    commentsList: [],
  },
  {
    id: 'seed-post-3',
    authorId: 'system-nurse-3',
    authorName: 'Nurse Valerie Azer',
    authorRole: 'Community Health Nurse',
    createdAt: Date.now() - 3600000 * 12,
    category: 'Community Share',
    content:
      'Patient advocacy and clinical quality assurance are at the heart of our community health outreaches this weekend. Proud to see Gileo nurses leading the charge in Lagos!',
    likesCount: 18,
    commentsCount: 0,
    repostsCount: 4,
    isLiked: false,
    isSaved: false,
    isReposted: false,
    commentsList: [],
  },
  {
    id: 'seed-post-4',
    authorId: 'system-nurse-4',
    authorName: 'Gileo Medicals',
    authorRole: 'Official Platform',
    createdAt: Date.now() - 3600000 * 24,
    category: 'Announcement',
    content:
      'Welcome all registered nurses to the Gileo Nurses Community! Connect with fellow nurses, explore executive cohorts under Elevate, and access career expansion guides.',
    likesCount: 45,
    commentsCount: 0,
    repostsCount: 15,
    isLiked: false,
    isSaved: false,
    isReposted: false,
    commentsList: [],
  },
];

// Personalized Recommendation Score Ranking Algorithm
export function rankPostsForUser(
  allPosts: FeedPost[],
  connectedMemberNames: Set<string>,
  likedPostsMap: Record<string, boolean>,
): FeedPost[] {
  return [...allPosts].sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    const nameA = a.authorName || '';
    const nameB = b.authorName || '';

    if (connectedMemberNames.has(nameA)) scoreA += 50;
    if (connectedMemberNames.has(nameB)) scoreB += 50;

    scoreA += (a.likesCount || 0) * 10 + (a.commentsList?.length || 0) * 15;
    scoreB += (b.likesCount || 0) * 10 + (b.commentsList?.length || 0) * 15;

    if (likedPostsMap[a.id]) scoreA += 20;
    if (likedPostsMap[b.id]) scoreB += 20;

    const now = Date.now();
    const timeA = typeof a.createdAt === 'number' && !isNaN(a.createdAt) ? a.createdAt : now;
    const timeB = typeof b.createdAt === 'number' && !isNaN(b.createdAt) ? b.createdAt : now;

    const hoursA = Math.max(0, (now - timeA) / 3600000);
    const hoursB = Math.max(0, (now - timeB) / 3600000);

    scoreA += Math.max(0, 40 - hoursA * 2);
    scoreB += Math.max(0, 40 - hoursB * 2);

    const diff = scoreB - scoreA;
    if (isNaN(diff) || diff === 0) {
      return timeB - timeA;
    }
    return diff;
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

  // E-Books State
  const [eBooks, setEBooks] = useState<EBook[]>(initialEBooks);
  const [selectedEBook, setSelectedEBook] = useState<EBook | null>(null);
  const [purchasedEBookIds, setPurchasedEBookIds] = useState<Set<string>>(new Set());

  // Connection Options Modal State
  const [connectionOptionsMember, setConnectionOptionsMember] = useState<RegisteredMember | null>(null);

  // Ref to prevent re-opening post modal on reload
  const handledPostParamRef = useRef<string | null>(null);

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

      // 2. Load public community posts & saved posts directly from backend database
      const [backendPosts, userSavedPosts, purchasedEBooksJson, localUserPostsJson] =
        await Promise.all([
          apiRequest<any[]>('/community/posts').catch(() => null),
          apiRequest<any[]>('/community/saved-posts').catch(() => []),
          AsyncStorage.getItem('@gileo/purchased_ebooks').catch(() => null),
          AsyncStorage.getItem('@gileo/local_user_posts').catch(() => null),
        ]);

      const savedSet = new Set((userSavedPosts || []).map((sp) => sp.id));
      const localUserPosts: FeedPost[] = localUserPostsJson ? JSON.parse(localUserPostsJson) : [];

      if (purchasedEBooksJson) {
        setPurchasedEBookIds(new Set(JSON.parse(purchasedEBooksJson)));
      }

      const postMap = new Map<string, FeedPost>();

      if (Array.isArray(backendPosts) && backendPosts.length > 0) {
        backendPosts.forEach((p) => {
          const pCreatedAt =
            typeof p.createdAt === 'number' && !isNaN(p.createdAt)
              ? p.createdAt
              : new Date(p.createdAt || Date.now()).getTime();

          postMap.set(p.id, {
            id: p.id,
            authorId: p.authorId,
            authorName: p.authorName || 'Gileo Nurse',
            authorRole: p.authorRole || 'Community Member',
            createdAt: isNaN(pCreatedAt) ? Date.now() : pCreatedAt,
            category: p.category || 'Community Share',
            content: p.content,
            likesCount: typeof p.likesCount === 'number' ? p.likesCount : 0,
            commentsCount: typeof p.commentsCount === 'number' ? p.commentsCount : (p.commentsList?.length || 0),
            repostsCount: typeof p.repostsCount === 'number' ? p.repostsCount : 0,
            isLiked: Boolean(p.isLiked),
            isSaved: savedSet.has(p.id) || Boolean(p.isSaved),
            isReposted: Boolean(p.isReposted),
            commentsList: (p.commentsList || []).map((c: any) => {
              const cCreatedAt =
                typeof c.createdAt === 'number' && !isNaN(c.createdAt)
                  ? c.createdAt
                  : new Date(c.createdAt || Date.now()).getTime();
              return {
                id: c.id,
                authorName: c.authorName || 'Gileo Nurse',
                text: c.text,
                timeAgo: formatTwitterTime(isNaN(cCreatedAt) ? Date.now() : cCreatedAt),
              };
            }),
          });
        });
      }

      localUserPosts.forEach((p) => {
        const pCreatedAt =
          typeof p.createdAt === 'number' && !isNaN(p.createdAt)
            ? p.createdAt
            : new Date(p.createdAt || Date.now()).getTime();
        const normalizedCreatedAt = isNaN(pCreatedAt) ? Date.now() : pCreatedAt;

        const normalizedPost: FeedPost = {
          ...p,
          createdAt: normalizedCreatedAt,
          authorName: p.authorName || 'Gileo Nurse',
          authorRole: p.authorRole || 'Community Member',
          category: p.category || 'Community Share',
          likesCount: p.likesCount || 0,
          commentsCount: p.commentsCount || 0,
          repostsCount: p.repostsCount || 0,
          commentsList: p.commentsList || [],
        };

        if (!postMap.has(p.id)) {
          postMap.set(p.id, normalizedPost);
        }
      });

      if (postMap.size === 0) {
        fallbackCommunityPosts.forEach((fp) => {
          postMap.set(fp.id, fp);
        });
      }

      const combinedFeed = Array.from(postMap.values()).sort((a, b) => b.createdAt - a.createdAt);
      setPosts(combinedFeed);

      // 3. Load cohorts, e-books, and user library from backend API
      const [fetchedCohorts, backendEbooks, myLibraryRes] = await Promise.all([
        apiRequest<Cohort[]>('/learning/cohorts').catch(() => null),
        apiRequest<any[]>('/learning/ebooks').catch(() => null),
        apiRequest<any>('/learning/library').catch(() => null),
      ]);

      if (Array.isArray(fetchedCohorts) && fetchedCohorts.length > 0) {
        setCohorts(fetchedCohorts);
      }

      if (Array.isArray(backendEbooks) && backendEbooks.length > 0) {
        const mappedEBooks: EBook[] = backendEbooks.map((b, idx) => ({
          id: b.id,
          title: b.title,
          author: b.author || 'Gileo Medicals Global Limited',
          description: b.description,
          priceKobo: b.priceKobo,
          coverBg: ['#F10505', '#1E3A8A', '#059669', '#4F46E5', '#B45309'][idx % 5],
        }));
        setEBooks(mappedEBooks);
      }

      if (myLibraryRes?.ebooks && Array.isArray(myLibraryRes.ebooks)) {
        const unlockedIds = myLibraryRes.ebooks.map((e: any) => e.id);
        setPurchasedEBookIds((prev) => new Set([...Array.from(prev), ...unlockedIds]));
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
    if (params.postId && posts.length > 0 && handledPostParamRef.current !== params.postId) {
      const target = posts.find((p) => p.id === params.postId);
      if (target) {
        handledPostParamRef.current = params.postId;
        setSelectedPostDetail(target);
        (router.setParams as any)({ postId: undefined });
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
          iconBg: '#FDF2F2',
          iconColor: '#F10505',
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
    try {
      const res = await apiRequest<any>(`/community/posts/${postId}/like`, { method: 'POST' });

      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            const isLiked = res?.isLiked ?? !p.isLiked;
            const likesCount = typeof res?.likesCount === 'number' ? res.likesCount : (isLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1));

            if (isLiked) {
              void addNotification(userIdKey, {
                title: 'Post Liked',
                body: `You liked ${p.authorName}'s post.`,
                icon: 'heart',
                iconBg: '#FDF2F2',
                iconColor: '#EF4444',
              });
            }

            const updatedPost = { ...p, isLiked, likesCount };
            if (selectedPostDetail?.id === postId) {
              setSelectedPostDetail(updatedPost);
            }
            return updatedPost;
          }
          return p;
        }),
      );
    } catch (err) {
      triggerToast('Could not update like status');
    }
  };

  const toggleRepostPost = async (postId: string) => {
    try {
      const res = await apiRequest<any>(`/community/posts/${postId}/repost`, { method: 'POST' });

      setPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            const isReposted = res?.isReposted ?? !p.isReposted;
            const repostsCount = typeof res?.repostsCount === 'number' ? res.repostsCount : (isReposted ? (p.repostsCount || 0) + 1 : Math.max(0, (p.repostsCount || 1) - 1));
            triggerToast(isReposted ? 'Post reposted to your network' : 'Repost removed');

            const updatedPost = { ...p, isReposted, repostsCount };
            if (selectedPostDetail?.id === postId) {
              setSelectedPostDetail(updatedPost);
            }
            return updatedPost;
          }
          return p;
        }),
      );
    } catch (err) {
      triggerToast('Could not update repost status');
    }
  };

  const handleConfirmEBookPurchase = async (book: EBook) => {
    const updatedSet = new Set(purchasedEBookIds);
    updatedSet.add(book.id);
    setPurchasedEBookIds(updatedSet);
    await AsyncStorage.setItem('@gileo/purchased_ebooks', JSON.stringify(Array.from(updatedSet)));

    void addNotification(user?.id || 'guest', {
      title: 'E-Book Unlocked',
      body: `You unlocked access to "${book.title}". Available in your library.`,
      icon: 'book',
      iconBg: '#FDF2F2',
      iconColor: '#F10505',
    });

    triggerToast(`Unlocked "${book.title}"!`);
    setSelectedEBook(null);
  };

  const handlePaystackEBookPurchase = async (book: EBook) => {
    const token = await getStoredAccessToken();
    if (!token) {
      router.push('/login');
      return;
    }

    setIsEnrolling(true);

    try {
      const initRes = await apiRequest<any>('/payments/initialize', {
        method: 'POST',
        body: JSON.stringify({
          purchaseType: 'EBOOK',
          targetId: book.id,
        }),
      });

      const authUrl = initRes?.authorizationUrl;
      const ref = initRes?.reference;

      if (!authUrl || !ref) {
        throw new Error('Paystack authorization URL missing.');
      }

      setPaystackUrl(authUrl);
      setEnrolmentRef(ref);

      const callbackUrl = LinkingExpo.createURL('payment-callback');
      const browserResult = await WebBrowser.openAuthSessionAsync(
        authUrl,
        callbackUrl,
        { showInRecents: true },
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

      await verifyEBookPaymentWithBackend(returnedRef, book);
    } catch (error) {
      triggerToast(
        error instanceof Error ? error.message : 'Could not complete Paystack payment for E-Book.',
      );
    } finally {
      setIsEnrolling(false);
    }
  };

  const verifyEBookPaymentWithBackend = async (ref: string, book: EBook) => {
    setIsVerifyingPayment(true);
    try {
      const res = await apiRequest<any>(`/payments/verify/${encodeURIComponent(ref)}`, {
        method: 'POST',
      });

      if (res?.status === 'success' || res?.status === 'VERIFIED') {
        const updatedSet = new Set(purchasedEBookIds);
        updatedSet.add(book.id);
        setPurchasedEBookIds(updatedSet);
        await AsyncStorage.setItem('@gileo/purchased_ebooks', JSON.stringify(Array.from(updatedSet)));

        void addNotification(user?.id || 'guest', {
          title: 'E-Book Unlocked',
          body: `You unlocked access to "${book.title}". Available in your library.`,
          icon: 'book',
          iconBg: '#FDF2F2',
          iconColor: '#F10505',
        });

        triggerToast(`Payment verified! "${book.title}" is in your library.`);
        setSelectedEBook(null);
      } else {
        triggerToast('Payment verification pending. Check back shortly.');
      }
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : 'Could not verify payment.');
    } finally {
      setIsVerifyingPayment(false);
    }
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

    const fallbackAuthorName =
      user?.displayName || (user?.email ? user.email.split('@')[0] : `Nurse ${getFirstName(user)}`);
    const tempPostId = `post-${Date.now()}`;

    try {
      const res = await apiRequest<any>('/community/posts', {
        method: 'POST',
        body: JSON.stringify({
          content: newPostText.trim(),
          category: 'Community Share',
        }),
      }).catch((err) => {
        console.warn('Backend post creation offline/fallback:', err);
        return null;
      });

      const finalCreatedAt =
        typeof res?.createdAt === 'number' && !isNaN(res.createdAt) ? res.createdAt : Date.now();

      const myNewPost: FeedPost = {
        id: res?.id || tempPostId,
        authorId: res?.authorId || user?.id || 'local-user',
        authorName: res?.authorName || fallbackAuthorName,
        authorRole: res?.authorRole || 'Gileo Community Member',
        createdAt: finalCreatedAt,
        category: 'Community Share',
        content: newPostText.trim(),
        likesCount: 0,
        commentsCount: 0,
        repostsCount: 0,
        isLiked: false,
        isSaved: false,
        isReposted: false,
        commentsList: [],
      };

      // Immediately prepend to local feed state
      setPosts((prev) => [myNewPost, ...prev.filter((p) => p.id !== myNewPost.id)]);

      // Save to local storage for profile & offline persistence
      const existingLocal = await AsyncStorage.getItem('@gileo/local_user_posts');
      const localList: FeedPost[] = existingLocal ? JSON.parse(existingLocal) : [];
      const updatedLocalList = [myNewPost, ...localList.filter((p) => p.id !== myNewPost.id)];
      await AsyncStorage.setItem('@gileo/local_user_posts', JSON.stringify(updatedLocalList));

      setNewPostText('');
      triggerToast('Post published successfully!');

      // Re-sync with backend data
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
    const userIdKey = user?.id || 'guest';

    try {
      const res = await apiRequest<any>(`/community/posts/${selectedPostDetail.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text: commentText }),
      });

      const updatedCommentsList: CommentItem[] = Array.isArray(res?.commentsList)
        ? res.commentsList.map((c: any) => ({
            id: c.id,
            authorName: c.authorName || 'Gileo Nurse',
            text: c.text,
            timeAgo: formatTwitterTime(typeof c.createdAt === 'number' ? c.createdAt : Date.now()),
          }))
        : [
            ...(selectedPostDetail.commentsList || []),
            {
              id: res?.comment?.id || `c-${Date.now()}`,
              authorName: res?.comment?.authorName || user?.displayName || `Nurse ${getFirstName(user)}`,
              text: commentText,
              timeAgo: 'Just now',
            },
          ];

      const newCommentsCount = typeof res?.commentsCount === 'number' ? res.commentsCount : updatedCommentsList.length;

      setPosts((prev) => {
        return prev.map((p) => {
          if (p.id === selectedPostDetail.id) {
            const updatedPost = {
              ...p,
              commentsList: updatedCommentsList,
              commentsCount: newCommentsCount,
            };
            setSelectedPostDetail(updatedPost);
            return updatedPost;
          }
          return p;
        });
      });

      setCommentInput('');
      triggerToast('Comment published');

      void addNotification(userIdKey, {
        title: 'Comment Added',
        body: `You commented on ${selectedPostDetail.authorName}'s post.`,
        icon: 'chatbubble',
        iconBg: '#F8F9FA',
        iconColor: '#F10505',
      });
    } catch (err) {
      triggerToast(err instanceof Error ? err.message : 'Could not add comment.');
    }
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
  const userFirstName = getFirstName(user);
  const rawPostsList =
    activeTab === 'network'
      ? posts.filter(
          (p) =>
            connectedMemberNames.has(p.authorName) ||
            (user?.id && p.authorId === user.id) ||
            (user?.displayName && p.authorName === user.displayName) ||
            (userFirstName && p.authorName.includes(userFirstName)),
        )
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

  if (user?.role === 'ADMIN') {
    return <AdminOrdersView />;
  }

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
            tintColor="#F10505"
            colors={['#F10505']}
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
                <Ionicons name="person-add-outline" size={20} color="#F10505" />
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
                  <Ionicons name="person-add-outline" size={20} color="#F10505" />
                  <Text style={styles.emptyStoryText}>Connect with Nurses</Text>
                </Pressable>
              ) : (
                connectedMembers.map((member) => (
                  <Pressable
                    key={member.id}
                    style={styles.storyItem}
                    onPress={() => setConnectionOptionsMember(member)}
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
                    <View key={post.id} style={styles.feedPostCard}>
                      <Pressable onPress={() => setSelectedPostDetail(post)}>
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
                      </Pressable>

                      {/* Interactive Action Bar */}
                      <View style={styles.socialActionBar}>
                        <Pressable
                          style={styles.actionItem}
                          onPress={() => toggleLikePost(post.id)}
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
                          onPress={() => setSelectedPostDetail(post)}
                          hitSlop={8}
                        >
                          <Ionicons name="chatbubble-outline" size={18} color="#64748B" />
                          <Text style={styles.actionCountText}>{post.commentsCount}</Text>
                        </Pressable>

                        <Pressable
                          style={styles.actionItem}
                          onPress={() => toggleRepostPost(post.id)}
                          hitSlop={8}
                        >
                          <Ionicons
                            name={post.isReposted ? 'repeat' : 'repeat-outline'}
                            size={20}
                            color={post.isReposted ? '#059669' : '#64748B'}
                          />
                          <Text style={[styles.actionCountText, post.isReposted && { color: '#059669' }]}>
                            {post.repostsCount || 0}
                          </Text>
                        </Pressable>

                        <Pressable
                          style={styles.actionItem}
                          onPress={() => void handleSharePost(post)}
                          hitSlop={8}
                        >
                          <Ionicons name="share-outline" size={20} color="#64748B" />
                          <Text style={styles.actionCountText}>Share</Text>
                        </Pressable>

                        <Pressable
                          style={[styles.actionItem, { marginLeft: 'auto' }]}
                          onPress={() => toggleSavePost(post.id)}
                          hitSlop={8}
                        >
                          <Ionicons
                            name={post.isSaved ? 'bookmark' : 'bookmark-outline'}
                            size={19}
                            color={post.isSaved ? '#F10505' : '#64748B'}
                          />
                        </Pressable>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </>
          ) : (
            /* Tab Content 3: Gileo Elevate Paid Cohorts & E-Books */
            <View style={{ gap: 20 }}>
              <View style={styles.elevateSection}>
                <View style={styles.elevateHeaderBox}>
                  <Ionicons name="school" size={24} color="#F10505" />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.elevateHeaderTitle}>Gileo Elevate Cohorts</Text>
                    <Text style={styles.elevateHeaderSub}>
                      Structured paid professional development programmes for nurses seeking executive leadership and global practice.
                    </Text>
                  </View>
                </View>

              <View style={styles.cohortList}>
                {cohorts.map((cohort) => {
                  const priceFormatted = formatKobo(cohort.priceKobo);
                  return (
                    <View key={cohort.id} style={styles.cohortCard}>
                      <View style={styles.cohortCardHeader}>
                        <View style={styles.enrolmentPill}>
                          <Ionicons name="time-outline" size={12} color="#F10505" />
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
                            <Ionicons name="checkmark-circle" size={14} color="#F10505" />
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

            {/* Gileo Learning Hub & E-Books Section */}
            <View style={styles.elevateSection}>
              <View style={styles.elevateHeaderBox}>
                <Ionicons name="book" size={24} color="#F10505" />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.elevateHeaderTitle}>Gileo Learning Hub & E-Books</Text>
                  <Text style={styles.elevateHeaderSub}>
                    Essential digital handbooks, leadership guides, and career expansion e-books for modern nurses.
                  </Text>
                </View>
              </View>

              <View style={styles.ebooksList}>
                {eBooks.map((book) => {
                  const isUnlocked = purchasedEBookIds.has(book.id);
                  return (
                    <View key={book.id} style={styles.ebookCard}>
                      <View style={[styles.ebookCoverBox, { backgroundColor: book.coverBg }]}>
                        <Ionicons name="book" size={28} color="#FFFFFF" />
                        <Text style={styles.ebookCoverTag}>HANDBOOK</Text>
                      </View>

                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={styles.ebookTitle}>{book.title}</Text>
                        <Text style={styles.ebookAuthor}>{book.author}</Text>
                        <Text style={styles.ebookDesc} numberOfLines={2}>{book.description}</Text>
                        <Text style={styles.ebookPrice}>
                          {isUnlocked ? 'UNLOCKED IN LIBRARY' : formatKobo(book.priceKobo)}
                        </Text>

                        <Pressable
                          style={[styles.purchaseEBookBtn, isUnlocked && styles.purchaseEBookBtnUnlocked]}
                          onPress={() => {
                            if (isUnlocked) {
                              triggerToast(`"${book.title}" is in your library!`);
                            } else {
                              setSelectedEBook(book);
                            }
                          }}
                        >
                          <Ionicons
                            name={isUnlocked ? 'checkmark-circle' : 'cart-outline'}
                            size={14}
                            color={isUnlocked ? '#059669' : '#FFFFFF'}
                          />
                          <Text
                            style={[
                              styles.purchaseEBookBtnText,
                              isUnlocked && styles.purchaseEBookBtnTextUnlocked,
                            ]}
                          >
                            {isUnlocked ? 'In Library' : 'Purchase E-Book'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
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
                          color={selectedPostDetail.isSaved ? '#F10505' : '#64748B'}
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
                              <Ionicons name="person-circle-outline" size={26} color="#F10505" />
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
                          <Ionicons name="people" size={12} color="#F10505" />
                          <Text style={styles.connectionsCountText}>
                            {selectedMemberProfile.id === user?.id || selectedMemberProfile.email === user?.email
                              ? connectedMembers.length
                              : (memberConnectionsCount[selectedMemberProfile.id] ??
                                 (selectedMemberProfile.isConnected ? connectedMembers.length : 8))}{' '}
                            Connection{connectedMembers.length === 1 ? '' : 's'}
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
                              color={selectedMemberProfile.isConnected ? '#F10505' : '#FFFFFF'}
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
                          <Ionicons name="checkmark" size={14} color="#F10505" />
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
                        {formatKobo(selectedCohort.priceKobo)}
                      </Text>
                    </View>

                    <View style={styles.paystackNoticeBox}>
                      <Ionicons name="shield-checkmark" size={22} color="#F10505" />
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
                            <Ionicons name="checkmark-circle" size={16} color="#F10505" />
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
                <ActivityIndicator size="large" color="#F10505" />
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

          {/* Connection Options Modal (Requirement #10) */}
          <Modal
            visible={Boolean(connectionOptionsMember)}
            transparent
            animationType="fade"
            onRequestClose={() => setConnectionOptionsMember(null)}
          >
            <View style={styles.modalOverlayDark}>
              <View style={styles.connectionOptionsCard}>
                <View style={styles.optionsAvatarCircle}>
                  <Text style={styles.optionsAvatarText}>
                    {(connectionOptionsMember?.displayName || 'N').charAt(0).toUpperCase()}
                  </Text>
                </View>

                <Text style={styles.optionsMemberName}>
                  {connectionOptionsMember?.displayName}
                </Text>
                <Text style={styles.optionsMemberRole}>
                  {connectionOptionsMember?.email || 'Registered Nurse'}
                </Text>

                <View style={{ width: '100%', gap: 10, marginTop: 12 }}>
                  <Pressable
                    style={styles.optionsPrimaryBtn}
                    onPress={() => {
                      const m = connectionOptionsMember;
                      setConnectionOptionsMember(null);
                      if (m) setSelectedMemberProfile(m);
                    }}
                  >
                    <Ionicons name="person" size={18} color="#FFFFFF" />
                    <Text style={styles.optionsPrimaryBtnText}>View Full Profile</Text>
                  </Pressable>

                  <Pressable
                    style={styles.optionsSecondaryBtn}
                    onPress={() => {
                      const m = connectionOptionsMember;
                      setConnectionOptionsMember(null);
                      if (m) void toggleConnectMember(m);
                    }}
                  >
                    <Ionicons
                      name={connectionOptionsMember?.isConnected ? 'person-remove' : 'person-add'}
                      size={18}
                      color="#F10505"
                    />
                    <Text style={styles.optionsSecondaryBtnText}>
                      {connectionOptionsMember?.isConnected
                        ? 'Disconnect / Remove Connection'
                        : 'Connect / Add Friend'}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.optionsCancelBtn}
                    onPress={() => setConnectionOptionsMember(null)}
                  >
                    <Text style={styles.optionsCancelBtnText}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>

          {/* E-Book Purchase Modal (Requirement #4) */}
          <Modal
            visible={Boolean(selectedEBook)}
            animationType="slide"
            onRequestClose={() => setSelectedEBook(null)}
          >
            <SafeAreaView style={styles.modalSafeArea}>
              {selectedEBook && (
                <>
                  <View style={styles.modalHeader}>
                    <Pressable onPress={() => setSelectedEBook(null)} style={styles.circleBtn}>
                      <Ionicons name="close" size={20} color="#0F172A" />
                    </Pressable>
                    <Text style={styles.modalHeaderTitle}>Purchase E-Book</Text>
                    <View style={{ width: 40 }} />
                  </View>

                  <ScrollView contentContainerStyle={styles.enrolContent}>
                    <View style={[styles.ebookModalHeaderCard, { backgroundColor: selectedEBook.coverBg }]}>
                      <Ionicons name="book" size={40} color="#FFFFFF" />
                      <Text style={styles.ebookModalTitle}>{selectedEBook.title}</Text>
                      <Text style={styles.ebookModalAuthor}>{selectedEBook.author}</Text>
                      <View style={styles.ebookModalPricePill}>
                        <Text style={styles.ebookModalPriceText}>
                          {formatKobo(selectedEBook.priceKobo)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.sectionGroup}>
                      <Text style={styles.modalSectionHeaderTitle}>Book Overview</Text>
                      <Text style={styles.detailOverviewText}>{selectedEBook.description}</Text>
                    </View>

                    <View style={styles.paystackNoticeBox}>
                      <Ionicons name="shield-checkmark" size={22} color="#F10505" />
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={styles.paystackNoticeTitle}>Verified Instant Access</Text>
                        <Text style={styles.paystackNoticeSub}>
                          E-book access is verified automatically server-side upon successful Paystack payment confirmation.
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      style={[styles.paystackLaunchBtn, isEnrolling && { opacity: 0.6 }]}
                      disabled={isEnrolling}
                      onPress={() => void handlePaystackEBookPurchase(selectedEBook)}
                    >
                      <Ionicons name="card-outline" size={18} color="#FFFFFF" />
                      <Text style={styles.paystackLaunchBtnText}>
                        {isEnrolling ? 'Initializing Paystack...' : 'Proceed to Paystack Payment'}
                      </Text>
                    </Pressable>
                  </ScrollView>
                </>
              )}
            </SafeAreaView>
          </Modal>
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
    backgroundColor: '#F10505',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    shadowColor: '#F10505',
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
    color: '#F10505',
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
    color: '#F10505',
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
    borderColor: '#F10505',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  storyAvatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FDF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAvatarInitial: {
    color: '#F10505',
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
    backgroundColor: '#F10505',
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
    backgroundColor: '#F10505',
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
    backgroundColor: '#F10505',
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
    backgroundColor: '#F10505',
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
    backgroundColor: '#FDF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAvatarInitial: {
    color: '#F10505',
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
    backgroundColor: '#F10505',
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
    backgroundColor: '#F10505',
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
    backgroundColor: '#FDF2F2',
  },
  connectionsCountText: {
    color: '#F10505',
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
    backgroundColor: '#F10505',
    marginTop: 8,
  },
  memberConnectBtnActive: {
    backgroundColor: '#FDF2F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  memberConnectText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  memberConnectTextActive: {
    color: '#F10505',
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
    backgroundColor: '#FDF2F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    gap: 12,
  },
  elevateHeaderTitle: {
    color: '#F10505',
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
    backgroundColor: '#FDF2F2',
  },
  enrolmentPillText: {
    color: '#F10505',
    fontSize: 10,
    fontWeight: '800',
  },
  cohortPrice: {
    color: '#F10505',
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
    backgroundColor: '#F10505',
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
    backgroundColor: '#F10505',
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
    backgroundColor: '#FDF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registeredAvatarInitial: {
    color: '#F10505',
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
    backgroundColor: '#F10505',
  },
  connectPillBtnActive: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#FDF2F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  connectPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  connectPillTextActive: {
    color: '#F10505',
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
    backgroundColor: '#F10505',
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
    color: '#F10505',
    fontSize: 22,
    fontWeight: '800',
  },
  paystackNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FDF2F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  paystackNoticeTitle: {
    color: '#F10505',
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
    backgroundColor: '#F10505',
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
    backgroundColor: '#F10505',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '800',
  },
  successRef: {
    color: '#F10505',
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
    backgroundColor: '#F10505',
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
    color: '#F10505',
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
    backgroundColor: '#F10505',
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
  ebooksList: {
    gap: 12,
  },
  ebookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  ebookCoverBox: {
    width: 64,
    height: 84,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    gap: 4,
  },
  ebookCoverTag: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  ebookTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  ebookAuthor: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  ebookDesc: {
    color: '#334155',
    fontSize: 12,
    lineHeight: 16,
  },
  ebookPrice: {
    color: '#F10505',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  purchaseEBookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F10505',
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  purchaseEBookBtnUnlocked: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  purchaseEBookBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  purchaseEBookBtnTextUnlocked: {
    color: '#059669',
  },
  modalOverlayDark: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  connectionOptionsCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  optionsAvatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FDF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  optionsAvatarText: {
    color: '#F10505',
    fontSize: 22,
    fontWeight: '800',
  },
  optionsMemberName: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  optionsMemberRole: {
    color: '#64748B',
    fontSize: 12,
  },
  optionsPrimaryBtn: {
    height: 48,
    borderRadius: 999,
    backgroundColor: '#F10505',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  optionsPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  optionsSecondaryBtn: {
    height: 48,
    borderRadius: 999,
    backgroundColor: '#FDF2F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  optionsSecondaryBtnText: {
    color: '#F10505',
    fontSize: 13,
    fontWeight: '700',
  },
  optionsCancelBtn: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsCancelBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  ebookModalHeaderCard: {
    padding: 20,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ebookModalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  ebookModalAuthor: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
  },
  ebookModalPricePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    marginTop: 4,
  },
  ebookModalPriceText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  bankDetailCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FDF2F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    gap: 10,
  },
  bankDetailTitle: {
    color: '#F10505',
    fontSize: 14,
    fontWeight: '800',
  },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankLabel: {
    color: '#64748B',
    fontSize: 12,
  },
  bankVal: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
  bankValHighlight: {
    color: '#F10505',
    fontSize: 14,
    fontWeight: '800',
  },
});
