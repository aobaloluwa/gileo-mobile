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
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiRequest } from '../../services/api';
import { AuthUser, getStoredAccessToken, getStoredUser } from '../../services/auth';
import { getFirstName } from './profile';
import { colors, spacing } from '../../theme';

type FeedPost = {
  id: string;
  authorName: string;
  authorRole: string;
  timeAgo: string;
  content: string;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  category: string;
};

type CommunityMember = {
  id: string;
  name: string;
  role: string;
  isFollowing?: boolean;
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

const memberStories: CommunityMember[] = [
  { id: '1', name: 'Nurse Laila', role: 'Concierge Lead' },
  { id: '2', name: 'Nurse Gia', role: 'ICU Specialist' },
  { id: '3', name: 'Nurse Jeanne', role: 'Clinical Educator' },
  { id: '4', name: 'Nurse Keanu', role: 'Pediatric Care' },
  { id: '5', name: 'Nurse Valerie', role: 'Health Tech' },
];

const initialFeedPosts: FeedPost[] = [
  {
    id: 'post-1',
    authorName: 'Nurse Laila Gibson',
    authorRole: 'Concierge Nurse Lead',
    timeAgo: '2 hr ago',
    category: 'Career Growth',
    content:
      'Taking that first step into independent nursing practice is powerful! Explore new ideas, build your executive portfolio, and see where your clinical expertise can take you. The best time to start is now! 🩺🚀',
    likesCount: 172,
    commentsCount: 28,
    repostsCount: 12,
    isLiked: false,
  },
  {
    id: 'post-2',
    authorName: 'Nurse Valerie Azer',
    authorRole: 'Clinical Operations Specialist',
    timeAgo: '4 hr ago',
    category: 'Clinical Practice',
    content:
      'Hands-on experience combined with continuous learning creates excellence in healthcare. Always stay curious and never stop expanding your clinical knowledge! 💡✨',
    likesCount: 245,
    commentsCount: 42,
    repostsCount: 18,
    isLiked: true,
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
  const [activeTab, setActiveTab] = useState<'for_you' | 'following' | 'elevate'>('for_you');
  const [posts, setPosts] = useState<FeedPost[]>(initialFeedPosts);
  const [members, setMembers] = useState<CommunityMember[]>(memberStories);
  const [cohorts, setCohorts] = useState<Cohort[]>(initialCohorts);
  const [refreshing, setRefreshing] = useState(false);

  // New Post State
  const [newPostText, setNewPostText] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Comment Modal State
  const [selectedPostForComments, setSelectedPostForComments] = useState<FeedPost | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [postComments, setPostComments] = useState<string[]>([
    'Great insight! Thank you for sharing. 🩺',
    'So inspiring! Excited for the future of nursing.',
  ]);

  // Selected Cohort Modal State
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
      const fetchedCohorts = await apiRequest<Cohort[]>('/learning/cohorts').catch(() => null);
      if (Array.isArray(fetchedCohorts) && fetchedCohorts.length > 0) {
        setCohorts(fetchedCohorts);
      }
    } catch {
      // Keep initial demo data
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

  const handleCallSupport = () => {
    void Linking.openURL('tel:+2348165335594');
  };

  const toggleLikePost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isLiked = !p.isLiked;
          return {
            ...p,
            isLiked,
            likesCount: isLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1),
          };
        }
        return p;
      }),
    );
  };

  const toggleSavePost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isSaved = !p.isSaved;
          if (isSaved) triggerToast('Post saved to your bookmarks');
          return { ...p, isSaved };
        }
        return p;
      }),
    );
  };

  const toggleFollowMember = (memberId: string) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === memberId) {
          const isFollowing = !m.isFollowing;
          triggerToast(isFollowing ? `Connected with ${m.name}` : `Unfollowed ${m.name}`);
          return { ...m, isFollowing };
        }
        return m;
      }),
    );
  };

  const handleCreatePost = () => {
    if (!newPostText.trim()) {
      triggerToast('Please write something before publishing');
      return;
    }

    setIsPosting(true);
    const firstNameStr = getFirstName(user);

    const newPost: FeedPost = {
      id: `post-${Date.now()}`,
      authorName: user?.displayName || `Nurse ${firstNameStr}`,
      authorRole: 'Gileo Community Member',
      timeAgo: 'Just now',
      category: 'Community Share',
      content: newPostText.trim(),
      likesCount: 1,
      commentsCount: 0,
      repostsCount: 0,
      isLiked: true,
    };

    setPosts([newPost, ...posts]);
    setNewPostText('');
    setIsPosting(false);
    triggerToast('Post published to Gileo Community Feed!');
  };

  const handleAddComment = () => {
    if (!commentInput.trim()) return;
    setPostComments([...postComments, commentInput.trim()]);
    if (selectedPostForComments) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === selectedPostForComments.id
            ? { ...p, commentsCount: p.commentsCount + 1 }
            : p,
        ),
      );
    }
    setCommentInput('');
    triggerToast('Comment added');
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
            gap: 16,
            opacity: pageFadeAnim,
            transform: [{ translateY: pageSlideAnim }],
          }}
        >
          {/* Top Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greetingSubTitle}>Hello, {firstName} 👋</Text>
              <Text style={styles.headerTitle}>Gileo Community</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={handleCallSupport}
              style={({ pressed }) => [styles.circleIconBtn, pressed && styles.pressed]}
            >
              <Ionicons name="notifications-outline" size={20} color="#0F172A" />
              <View style={styles.notifBadgeDot} />
            </Pressable>
          </View>

          {/* Member Stories Carousel */}
          <View style={styles.storiesContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesRow}>
              {members.map((member) => (
                <Pressable
                  key={member.id}
                  onPress={() => toggleFollowMember(member.id)}
                  style={styles.storyItem}
                >
                  <View style={[styles.storyAvatarRing, member.isFollowing && styles.storyAvatarRingActive]}>
                    <View style={styles.storyAvatarCircle}>
                      <Text style={styles.storyAvatarInitial}>{member.name.charAt(6) || 'N'}</Text>
                    </View>
                  </View>
                  <Text style={styles.storyNameText} numberOfLines={1}>{member.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Segmented Sub-Navigation Pills */}
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
              onPress={() => setActiveTab('following')}
              style={[styles.segmentedItem, activeTab === 'following' && styles.segmentedItemActive]}
            >
              <Text style={[styles.segmentedLabel, activeTab === 'following' && styles.segmentedLabelActive]}>
                Network
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

          {/* Feed Content */}
          {activeTab !== 'elevate' ? (
            <>
              {/* Share New Post Box */}
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
                    <Pressable style={styles.publishPillBtn} onPress={handleCreatePost}>
                      <Text style={styles.publishPillBtnText}>Post Update</Text>
                      <Ionicons name="send" size={14} color="#FFFFFF" />
                    </Pressable>
                  </View>
                )}
              </View>

              {/* Feed Posts List */}
              <View style={styles.feedList}>
                {posts.map((post) => (
                  <View key={post.id} style={styles.feedPostCard}>
                    {/* Post Author Header */}
                    <View style={styles.postHeaderRow}>
                      <View style={styles.authorAvatarCircle}>
                        <Text style={styles.authorAvatarInitial}>{post.authorName.charAt(6) || 'N'}</Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.authorNameText}>{post.authorName}</Text>
                        <Text style={styles.authorRoleText}>{post.authorRole} • {post.timeAgo}</Text>
                      </View>

                      <View style={styles.categoryPillTag}>
                        <Text style={styles.categoryPillTagText}>{post.category}</Text>
                      </View>
                    </View>

                    {/* Post Content Body */}
                    <Text style={styles.postContentText}>{post.content}</Text>

                    {/* Interactive Social Action Row */}
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
                        onPress={() => setSelectedPostForComments(post)}
                        hitSlop={8}
                      >
                        <Ionicons name="chatbubble-outline" size={18} color="#64748B" />
                        <Text style={styles.actionCountText}>{post.commentsCount}</Text>
                      </Pressable>

                      <Pressable
                        style={styles.actionItem}
                        onPress={() => triggerToast('Post link copied')}
                        hitSlop={8}
                      >
                        <Ionicons name="repeat-outline" size={20} color="#64748B" />
                        <Text style={styles.actionCountText}>{post.repostsCount}</Text>
                      </Pressable>

                      <Pressable
                        style={[styles.actionItem, { marginLeft: 'auto' }]}
                        onPress={() => toggleSavePost(post.id)}
                        hitSlop={8}
                      >
                        <Ionicons
                          name={post.isSaved ? 'bookmark' : 'bookmark-outline'}
                          size={19}
                          color={post.isSaved ? '#761B36' : '#64748B'}
                        />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>

              {/* Suggested Members Section */}
              <View style={styles.suggestedSectionCard}>
                <Text style={styles.suggestedTitle}>Suggested Nurses to Connect</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                  {members.map((m) => (
                    <View key={m.id} style={styles.suggestedMemberCard}>
                      <View style={styles.suggestedAvatarCircle}>
                        <Text style={styles.suggestedAvatarInitial}>{m.name.charAt(6) || 'N'}</Text>
                      </View>
                      <Text style={styles.suggestedMemberName}>{m.name}</Text>
                      <Text style={styles.suggestedMemberRole}>{m.role}</Text>

                      <Pressable
                        style={[styles.connectPillBtn, m.isFollowing && styles.connectPillBtnActive]}
                        onPress={() => toggleFollowMember(m.id)}
                      >
                        <Text style={[styles.connectPillText, m.isFollowing && styles.connectPillTextActive]}>
                          {m.isFollowing ? 'Connected' : 'Connect'}
                        </Text>
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </>
          ) : (
            /* Tab Content: Gileo Elevate Paid Cohorts */
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

          {/* Comments Modal Drawer */}
          <Modal
            visible={Boolean(selectedPostForComments)}
            animationType="slide"
            onRequestClose={() => setSelectedPostForComments(null)}
          >
            <SafeAreaView style={styles.modalSafeArea}>
              <View style={styles.modalHeader}>
                <Pressable onPress={() => setSelectedPostForComments(null)} style={styles.circleBtn}>
                  <Ionicons name="close" size={20} color="#0F172A" />
                </Pressable>
                <Text style={styles.modalHeaderTitle}>Comments</Text>
                <View style={{ width: 40 }} />
              </View>

              <ScrollView contentContainerStyle={styles.commentsListContent}>
                {postComments.map((c, idx) => (
                  <View key={idx} style={styles.commentItemCard}>
                    <Ionicons name="person-circle-outline" size={24} color="#761B36" />
                    <Text style={styles.commentText}>{c}</Text>
                  </View>
                ))}
              </ScrollView>

              <View style={styles.commentInputRow}>
                <TextInput
                  value={commentInput}
                  onChangeText={setCommentInput}
                  placeholder="Write a comment..."
                  placeholderTextColor="#94A3B8"
                  style={styles.commentInputField}
                />
                <Pressable style={styles.sendCommentBtn} onPress={handleAddComment}>
                  <Ionicons name="send" size={16} color="#FFFFFF" />
                </Pressable>
              </View>
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
    marginHorizontal: -20,
  },
  storiesRow: {
    paddingHorizontal: 20,
    gap: 16,
  },
  storyItem: {
    alignItems: 'center',
    gap: 4,
    width: 68,
  },
  storyAvatarRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#EAECEF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  storyAvatarRingActive: {
    borderColor: '#761B36',
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
    fontSize: 13,
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
  categoryPillTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FFF1F2',
  },
  categoryPillTagText: {
    color: '#761B36',
    fontSize: 10,
    fontWeight: '800',
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
  suggestedSectionCard: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    gap: 14,
  },
  suggestedTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  suggestedMemberCard: {
    width: 140,
    padding: 14,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EAECEF',
    alignItems: 'center',
    gap: 6,
  },
  suggestedAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestedAvatarInitial: {
    color: '#761B36',
    fontSize: 18,
    fontWeight: '800',
  },
  suggestedMemberName: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  suggestedMemberRole: {
    color: '#64748B',
    fontSize: 10,
    textAlign: 'center',
  },
  connectPillBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#111111',
    marginTop: 4,
  },
  connectPillBtnActive: {
    backgroundColor: '#FFF1F2',
  },
  connectPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  connectPillTextActive: {
    color: '#761B36',
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
  commentsListContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  commentItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#EAECEF',
  },
  commentText: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
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
  footerNote: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
    paddingTop: 8,
  },
});
