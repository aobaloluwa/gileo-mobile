import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminHubSkeleton } from './AdminHubSkeleton';
import { apiRequest, uploadImageApi } from '../../services/api';
import { AuthUser, clearAuthSession, getStoredUser } from '../../services/auth';
import { formatKobo } from '../../theme/colors';

type AdminUser = {
  id: string;
  displayName?: string;
  email?: string;
  phoneNumber?: string;
  role: 'CUSTOMER' | 'ADMIN';
};

type AdminCommunityPost = {
  id: string;
  authorName: string;
  content: string;
  createdAt?: string;
};

type AdminCohort = {
  id: string;
  title: string;
  slug?: string;
  overview: string;
  learningOutcomes: string[];
  eligibility?: string;
  schedule?: string;
  startsAt?: string;
  endsAt?: string;
  priceKobo: number;
  capacity?: number;
  enrolledCount?: number;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  createdAt?: string;
};

type AdminEbook = {
  id: string;
  title: string;
  slug?: string;
  author?: string;
  description: string;
  priceKobo: number;
  priceLabel?: string;
  coverImage?: string;
  fileKey?: string;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  createdAt?: string;
};

export function AdminHubView() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [posts, setPosts] = useState<AdminCommunityPost[]>([]);
  const [cohorts, setCohorts] = useState<AdminCohort[]>([]);
  const [ebooks, setEbooks] = useState<AdminEbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastText, setToastText] = useState('');

  // Modals visibility states
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showPostsModal, setShowPostsModal] = useState(false);
  const [showElevateModal, setShowElevateModal] = useState(false);

  // User Management State
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'ADMIN' | 'CUSTOMER'>('ALL');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Community Moderation State
  const [postSearch, setPostSearch] = useState('');

  // Elevate & E-Books Modal State
  const [elevateTab, setElevateTab] = useState<'COHORTS' | 'EBOOKS'>('COHORTS');

  // Cohort Form & View State
  const [showCohortFormModal, setShowCohortFormModal] = useState(false);
  const [showCohortDetailModal, setShowCohortDetailModal] = useState(false);
  const [editingCohort, setEditingCohort] = useState<AdminCohort | null>(null);
  const [viewingCohort, setViewingCohort] = useState<AdminCohort | null>(null);

  const [cohortTitle, setCohortTitle] = useState('');
  const [cohortOverview, setCohortOverview] = useState('');
  const [cohortOutcomes, setCohortOutcomes] = useState('');
  const [cohortEligibility, setCohortEligibility] = useState('');
  const [cohortSchedule, setCohortSchedule] = useState('');
  const [cohortPriceNaira, setCohortPriceNaira] = useState('');
  const [cohortCapacity, setCohortCapacity] = useState('50');
  const [cohortStatus, setCohortStatus] = useState<'PUBLISHED' | 'DRAFT'>('PUBLISHED');
  const [isSavingCohort, setIsSavingCohort] = useState(false);
  const [deletingCohortId, setDeletingCohortId] = useState<string | null>(null);

  // E-Book Form & View State
  const [showEbookFormModal, setShowEbookFormModal] = useState(false);
  const [showEbookDetailModal, setShowEbookDetailModal] = useState(false);
  const [editingEbook, setEditingEbook] = useState<AdminEbook | null>(null);
  const [viewingEbook, setViewingEbook] = useState<AdminEbook | null>(null);

  const [ebookTitle, setEbookTitle] = useState('');
  const [ebookAuthor, setEbookAuthor] = useState('');
  const [ebookDescription, setEbookDescription] = useState('');
  const [ebookPriceNaira, setEbookPriceNaira] = useState('');
  const [ebookCoverImage, setEbookCoverImage] = useState('');
  const [ebookFileKey, setEbookFileKey] = useState('');
  const [ebookStatus, setEbookStatus] = useState<'PUBLISHED' | 'DRAFT'>('PUBLISHED');
  const [isSavingEbook, setIsSavingEbook] = useState(false);
  const [isUploadingEbookCover, setIsUploadingEbookCover] = useState(false);
  const [deletingEbookId, setDeletingEbookId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const u = await getStoredUser();
      setUser(u);

      const [allUsrs, allPosts, cohortsRes, ebooksRes] = await Promise.all([
        apiRequest<AdminUser[]>('/admin/users').catch(() => []),
        apiRequest<AdminCommunityPost[]>('/community/posts').catch(() => []),
        apiRequest<AdminCohort[]>('/learning/cohorts').catch(() => []),
        apiRequest<AdminEbook[]>('/learning/ebooks').catch(() => []),
      ]);

      setUsers(Array.isArray(allUsrs) ? allUsrs : []);
      setPosts(Array.isArray(allPosts) ? allPosts : []);
      setCohorts(Array.isArray(cohortsRes) ? cohortsRes : []);
      setEbooks(Array.isArray(ebooksRes) ? ebooksRes : []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  };

  const showToast = (msg: string) => {
    setToastText(msg);
    setTimeout(() => {
      setToastText((prev) => (prev === msg ? '' : prev));
    }, 4500);
  };

  const handleToggleRole = async (u: AdminUser) => {
    const newRole = u.role === 'ADMIN' ? 'CUSTOMER' : 'ADMIN';
    setUpdatingUserId(u.id);
    try {
      await apiRequest<any>(`/admin/users/${u.id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      setUsers((prev) =>
        prev.map((usr) => (usr.id === u.id ? { ...usr, role: newRole } : usr)),
      );
      showToast(`User role changed to ${newRole}`);
    } catch (err: any) {
      showToast(err?.message || 'Could not update role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = (u: AdminUser) => {
    Alert.alert(
      'Delete User Account',
      `Are you sure you want to permanently delete user account "${u.displayName || u.email}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete User',
          style: 'destructive',
          onPress: async () => {
            setUpdatingUserId(u.id);
            try {
              await apiRequest<any>(`/admin/users/${u.id}`, { method: 'DELETE' });
              setUsers((prev) => prev.filter((usr) => usr.id !== u.id));
              showToast('User account deleted');
            } catch (err: any) {
              showToast(err?.message || 'Could not delete user');
            } finally {
              setUpdatingUserId(null);
            }
          },
        },
      ],
    );
  };

  const handleDeletePost = (p: AdminCommunityPost) => {
    Alert.alert(
      'Remove Community Post',
      `Are you sure you want to remove post by "${p.authorName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove Post',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiRequest<any>(`/community/posts/${p.id}`, { method: 'DELETE' });
              setPosts((prev) => prev.filter((item) => item.id !== p.id));
              showToast('Post removed from community feed');
            } catch (err: any) {
              showToast(err?.message || 'Could not delete post');
            }
          },
        },
      ],
    );
  };

  // ==========================================
  // COHORT HANDLERS
  // ==========================================
  const handleOpenAddCohort = () => {
    setEditingCohort(null);
    setCohortTitle('');
    setCohortOverview('');
    setCohortOutcomes('Independent Practice & Concierge Nursing Setup\nExecutive Leadership & Business Mastery\nClient Retention & High-Value Care Delivery');
    setCohortEligibility('Registered Nurses, Midwives & Healthcare Leaders');
    setCohortSchedule('Saturdays 10:00 AM WAT via Gileo Elevate');
    setCohortPriceNaira('50000');
    setCohortCapacity('50');
    setCohortStatus('PUBLISHED');
    setShowCohortFormModal(true);
  };

  const handleOpenEditCohort = (c: AdminCohort) => {
    setEditingCohort(c);
    setCohortTitle(c.title);
    setCohortOverview(c.overview || '');
    setCohortOutcomes(Array.isArray(c.learningOutcomes) ? c.learningOutcomes.join('\n') : '');
    setCohortEligibility(c.eligibility || '');
    setCohortSchedule(c.schedule || '');
    setCohortPriceNaira(String(Math.floor((c.priceKobo || 0) / 100)));
    setCohortCapacity(String(c.capacity || 50));
    setCohortStatus(c.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT');
    setShowCohortFormModal(true);
  };

  const handleSaveCohort = async () => {
    if (!cohortTitle.trim() || !cohortOverview.trim()) {
      showToast('Please fill in cohort title and overview.');
      return;
    }
    setIsSavingCohort(true);
    try {
      const priceKobo = Math.round((parseFloat(cohortPriceNaira) || 0) * 100);
      const outcomes = cohortOutcomes.split('\n').map((l) => l.trim()).filter(Boolean);
      const payload = {
        title: cohortTitle.trim(),
        slug: cohortTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        overview: cohortOverview.trim(),
        learningOutcomes: outcomes.length > 0 ? outcomes : ['Professional clinical nursing development'],
        eligibility: cohortEligibility.trim() || undefined,
        schedule: cohortSchedule.trim() || undefined,
        priceKobo,
        capacity: parseInt(cohortCapacity, 10) || 50,
        status: cohortStatus,
      };

      if (editingCohort) {
        await apiRequest<any>(`/learning/cohorts/${editingCohort.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        showToast('Elevate Cohort updated successfully!');
      } else {
        await apiRequest<any>('/learning/cohorts', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showToast('New Elevate Cohort created successfully!');
      }
      setShowCohortFormModal(false);
      await loadData();
    } catch (err: any) {
      showToast(err?.message || 'Could not save cohort');
    } finally {
      setIsSavingCohort(false);
    }
  };

  const handleDeleteCohort = (c: AdminCohort) => {
    Alert.alert('Delete Elevate Cohort', `Are you sure you want to delete cohort "${c.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete Cohort',
        style: 'destructive',
        onPress: async () => {
          setDeletingCohortId(c.id);
          try {
            await apiRequest<any>(`/learning/cohorts/${c.id}`, { method: 'DELETE' });
            setCohorts((prev) => prev.filter((item) => item.id !== c.id));
            showToast('Elevate Cohort removed');
          } catch (err: any) {
            showToast(err?.message || 'Could not delete cohort');
          } finally {
            setDeletingCohortId(null);
          }
        },
      },
    ]);
  };

  // ==========================================
  // E-BOOK HANDLERS
  // ==========================================
  const handleOpenAddEbook = () => {
    setEditingEbook(null);
    setEbookTitle('');
    setEbookAuthor('Gileo Medicals Global Limited');
    setEbookDescription('');
    setEbookPriceNaira('5000');
    setEbookCoverImage('');
    setEbookFileKey('');
    setEbookStatus('PUBLISHED');
    setShowEbookFormModal(true);
  };

  const handleOpenEditEbook = (e: AdminEbook) => {
    setEditingEbook(e);
    setEbookTitle(e.title);
    setEbookAuthor(e.author || 'Gileo Medicals Global Limited');
    setEbookDescription(e.description || '');
    setEbookPriceNaira(String(Math.floor((e.priceKobo || 0) / 100)));
    setEbookCoverImage(e.coverImage || '');
    setEbookFileKey(e.fileKey || '');
    setEbookStatus(e.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT');
    setShowEbookFormModal(true);
  };

  const handlePickEbookCoverPhoto = async (source: 'gallery' | 'camera') => {
    try {
      let result: ImagePicker.ImagePickerResult;
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          showToast('Camera permission is required.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          quality: 0.8,
          allowsEditing: true,
          aspect: [3, 4],
        });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          showToast('Gallery permission is required.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          quality: 0.8,
          allowsEditing: true,
          aspect: [3, 4],
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsUploadingEbookCover(true);
        const uploaded = await uploadImageApi(result.assets[0].uri);
        setEbookCoverImage(uploaded.url);
        showToast('Cover photo uploaded successfully!');
      }
    } catch {
      showToast('Could not upload e-book cover photo.');
    } finally {
      setIsUploadingEbookCover(false);
    }
  };

  const handleSaveEbook = async () => {
    if (!ebookTitle.trim() || !ebookDescription.trim()) {
      showToast('Please fill in e-book title and description.');
      return;
    }
    setIsSavingEbook(true);
    try {
      const priceKobo = Math.round((parseFloat(ebookPriceNaira) || 0) * 100);
      const payload = {
        title: ebookTitle.trim(),
        slug: ebookTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        author: ebookAuthor.trim() || 'Gileo Medicals Global Limited',
        description: ebookDescription.trim(),
        priceKobo,
        priceLabel: formatKobo(priceKobo),
        coverImage: ebookCoverImage.trim() || undefined,
        fileKey: ebookFileKey.trim() || undefined,
        status: ebookStatus,
      };

      if (editingEbook) {
        await apiRequest<any>(`/learning/ebooks/${editingEbook.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        showToast('E-Book updated successfully!');
      } else {
        await apiRequest<any>('/learning/ebooks', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showToast('New E-Book added to library!');
      }
      setShowEbookFormModal(false);
      await loadData();
    } catch (err: any) {
      showToast(err?.message || 'Could not save e-book');
    } finally {
      setIsSavingEbook(false);
    }
  };

  const handleDeleteEbook = (e: AdminEbook) => {
    Alert.alert('Delete E-Book', `Are you sure you want to delete e-book "${e.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete E-Book',
        style: 'destructive',
        onPress: async () => {
          setDeletingEbookId(e.id);
          try {
            await apiRequest<any>(`/learning/ebooks/${e.id}`, { method: 'DELETE' });
            setEbooks((prev) => prev.filter((item) => item.id !== e.id));
            showToast('E-Book removed from library');
          } catch (err: any) {
            showToast(err?.message || 'Could not delete e-book');
          } finally {
            setDeletingEbookId(null);
          }
        },
      },
    ]);
  };

  // Filtered lists
  const filteredUsersList = users.filter((u) => {
    const q = userSearch.toLowerCase().trim();
    const nameMatch = u.displayName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    if (!nameMatch) return false;
    if (userRoleFilter === 'ALL') return true;
    return u.role === userRoleFilter;
  });

  const filteredPostsList = posts.filter((p) => {
    const q = postSearch.toLowerCase().trim();
    if (!q) return true;
    return p.authorName?.toLowerCase().includes(q) || p.content?.toLowerCase().includes(q);
  });

  const totalUsersCount = users.length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const totalPostsCount = posts.length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Toast Notification Banner */}
      {toastText.length > 0 && (
        <View style={styles.toastBanner}>
          <Ionicons name="sparkles" size={16} color="#FFFFFF" />
          <Text style={styles.toastBannerText} numberOfLines={1}>
            {toastText}
          </Text>
          <Pressable onPress={() => setToastText('')} hitSlop={8}>
            <Ionicons name="close" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      )}

      {/* Screen Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.topHeaderTitleBox}>
          <Text style={styles.headerSub} numberOfLines={1}>
            Platform Control & Users
          </Text>
          <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            Admin Operations Hub
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.headerRefreshBtn, pressed && styles.pressed]}
          onPress={loadData}
        >
          <Ionicons name="refresh" size={18} color="#0F172A" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F10505" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Admin Profile Hero Card */}
        <View style={styles.profileHeroCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{(user?.displayName || 'A').charAt(0).toUpperCase()}</Text>
          </View>

          <View style={styles.heroTextContainer}>
            <Text style={styles.heroName} numberOfLines={1}>
              {user?.displayName || 'System Administrator'}
            </Text>
            <Text style={styles.heroEmail} numberOfLines={1}>
              {user?.email || 'admin@gileo.com'}
            </Text>
            <View style={styles.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={12} color="#F10505" />
              <Text style={styles.verifiedBadgeText}>Verified Administrator</Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}
            onPress={async () => {
              await clearAuthSession();
              router.replace('/login');
            }}
          >
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          </Pressable>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricVal}>{totalUsersCount}</Text>
            <Text style={styles.metricLabel}>Total Users</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricVal}>{adminCount}</Text>
            <Text style={styles.metricLabel}>Admins</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricVal}>{cohorts.length + ebooks.length}</Text>
            <Text style={styles.metricLabel}>Elevate & Books</Text>
          </View>
        </View>

        {loading ? (
          <AdminHubSkeleton />
        ) : (
          <View style={styles.modulesContainer}>
            {/* Module 1: User Account Management */}
            <Pressable
              style={({ pressed }) => [styles.moduleCard, pressed && styles.pressed]}
              onPress={() => setShowUsersModal(true)}
            >
              <View style={[styles.moduleIconCircle, { backgroundColor: '#FDF2F2' }]}>
                <Ionicons name="people" size={22} color="#F10505" />
              </View>
              <View style={styles.moduleTextContainer}>
                <View style={styles.moduleTitleRow}>
                  <Text style={styles.moduleTitle} numberOfLines={1}>
                    User Account Management
                  </Text>
                  <View style={[styles.moduleBadge, { backgroundColor: '#FDF2F2' }]}>
                    <Text style={[styles.moduleBadgeText, { color: '#F10505' }]}>{totalUsersCount}</Text>
                  </View>
                </View>

                <Text style={styles.moduleSub} numberOfLines={2}>
                  Manage user roles (CUSTOMER vs ADMIN), review user profiles, and delete accounts.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </Pressable>

            {/* Module 2: Community Feed Moderation */}
            <Pressable
              style={({ pressed }) => [styles.moduleCard, pressed && styles.pressed]}
              onPress={() => setShowPostsModal(true)}
            >
              <View style={[styles.moduleIconCircle, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="chatbubbles" size={22} color="#4F46E5" />
              </View>
              <View style={styles.moduleTextContainer}>
                <View style={styles.moduleTitleRow}>
                  <Text style={styles.moduleTitle} numberOfLines={1}>
                    Community Feed Moderation
                  </Text>
                  <View style={[styles.moduleBadge, { backgroundColor: '#EEF2FF' }]}>
                    <Text style={[styles.moduleBadgeText, { color: '#4F46E5' }]}>{posts.length}</Text>
                  </View>
                </View>

                <Text style={styles.moduleSub} numberOfLines={2}>
                  Review community discussions, remove non-compliant posts, and moderate public comments.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </Pressable>

            {/* Module 3: Gileo Elevate Cohorts & E-Books Management */}
            <Pressable
              style={({ pressed }) => [styles.moduleCard, pressed && styles.pressed]}
              onPress={() => {
                setElevateTab('COHORTS');
                setShowElevateModal(true);
              }}
            >
              <View style={[styles.moduleIconCircle, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="school" size={22} color="#10B981" />
              </View>
              <View style={styles.moduleTextContainer}>
                <View style={styles.moduleTitleRow}>
                  <Text style={styles.moduleTitle} numberOfLines={1}>
                    Gileo Elevate & E-Books
                  </Text>
                  <View style={[styles.moduleBadge, { backgroundColor: '#ECFDF5' }]}>
                    <Text style={[styles.moduleBadgeText, { color: '#10B981' }]}>
                      {cohorts.length + ebooks.length}
                    </Text>
                  </View>
                </View>

                <Text style={styles.moduleSub} numberOfLines={2}>
                  Manage Elevate Cohorts, Masterclasses, and Digital E-Books library for modern nurses.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* =========================================
          MODAL 1: USER ACCOUNT MANAGEMENT
      ========================================= */}
      <Modal
        visible={showUsersModal}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => setShowUsersModal(false)}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={['top', 'bottom', 'left', 'right']}>
          <View style={[styles.modalHeader, { paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 16) : 12 }]}>
            <Pressable
              onPress={() => setShowUsersModal(false)}
              style={styles.modalCloseCircle}
              hitSlop={12}
            >
              <Ionicons name="close" size={20} color="#0F172A" />
            </Pressable>
            <Text style={styles.modalHeaderTitle} numberOfLines={1}>
              User Account Management ({filteredUsersList.length})
            </Text>
            <View style={{ width: 36 }} />
          </View>

          <View style={styles.modalBody}>
            <View style={styles.searchBarContainer}>
              <Ionicons name="search" size={18} color="#64748B" style={styles.searchIcon} />
              <TextInput
                value={userSearch}
                onChangeText={setUserSearch}
                placeholder="Search user by name or email..."
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
              />
              {userSearch.length > 0 && (
                <Pressable onPress={() => setUserSearch('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </Pressable>
              )}
            </View>

            <View style={styles.filterChipsRow}>
              {(['ALL', 'ADMIN', 'CUSTOMER'] as const).map((rFilter) => (
                <Pressable
                  key={rFilter}
                  onPress={() => setUserRoleFilter(rFilter)}
                  style={[
                    styles.filterChipBtn,
                    userRoleFilter === rFilter && styles.filterChipBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipBtnText,
                      userRoleFilter === rFilter && styles.filterChipBtnTextActive,
                    ]}
                  >
                    {rFilter}
                  </Text>
                </Pressable>
              ))}
            </View>

            <ScrollView contentContainerStyle={styles.modalListContent} showsVerticalScrollIndicator={false}>
              {filteredUsersList.length === 0 ? (
                <Text style={styles.emptyModalText}>No user accounts match your search.</Text>
              ) : (
                filteredUsersList.map((u) => (
                  <View key={u.id} style={styles.userCardItem}>
                    <View style={styles.userAvatarCircle}>
                      <Text style={styles.userAvatarText}>
                        {(u.displayName || u.email || 'U').charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.userInfoCol}>
                      <Text style={styles.userNameText} numberOfLines={1}>
                        {u.displayName || 'Gileo User'}
                      </Text>
                      <Text style={styles.userEmailText} numberOfLines={1}>
                        {u.email}
                      </Text>
                      <View style={styles.roleTagBox}>
                        <Text style={[styles.roleTagText, u.role === 'ADMIN' && styles.roleTagTextAdmin]}>
                          ROLE: {u.role}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.userActionsCol}>
                      <Pressable
                        style={({ pressed }) => [styles.toggleRoleBtn, pressed && styles.pressed]}
                        disabled={updatingUserId === u.id}
                        onPress={() => handleToggleRole(u)}
                      >
                        <Text style={styles.toggleRoleBtnText} numberOfLines={1}>
                          {u.role === 'ADMIN' ? 'Demote' : 'Make Admin'}
                        </Text>
                      </Pressable>

                      <Pressable
                        style={({ pressed }) => [styles.deleteUserBtn, pressed && styles.pressed]}
                        disabled={updatingUserId === u.id}
                        onPress={() => handleDeleteUser(u)}
                      >
                        <Ionicons name="trash-outline" size={14} color="#EF4444" />
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* =========================================
          MODAL 2: COMMUNITY FEED MODERATION
      ========================================= */}
      <Modal
        visible={showPostsModal}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => setShowPostsModal(false)}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={['top', 'bottom', 'left', 'right']}>
          <View style={[styles.modalHeader, { paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 16) : 12 }]}>
            <Pressable
              onPress={() => setShowPostsModal(false)}
              style={styles.modalCloseCircle}
              hitSlop={12}
            >
              <Ionicons name="close" size={20} color="#0F172A" />
            </Pressable>
            <Text style={styles.modalHeaderTitle} numberOfLines={1}>
              Community Moderation ({filteredPostsList.length})
            </Text>
            <View style={{ width: 36 }} />
          </View>

          <View style={styles.modalBody}>
            <View style={styles.searchBarContainer}>
              <Ionicons name="search" size={18} color="#64748B" style={styles.searchIcon} />
              <TextInput
                value={postSearch}
                onChangeText={setPostSearch}
                placeholder="Search posts by author or keyword..."
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
              />
              {postSearch.length > 0 && (
                <Pressable onPress={() => setPostSearch('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </Pressable>
              )}
            </View>

            <ScrollView contentContainerStyle={styles.modalListContent} showsVerticalScrollIndicator={false}>
              {filteredPostsList.length === 0 ? (
                <Text style={styles.emptyModalText}>No community posts found.</Text>
              ) : (
                filteredPostsList.map((p) => (
                  <View key={p.id} style={styles.postCardItem}>
                    <View style={styles.postHeaderRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                        <Ionicons name="person-circle" size={20} color="#0F172A" />
                        <Text style={styles.postAuthorText} numberOfLines={1}>
                          {p.authorName || 'Community Member'}
                        </Text>
                      </View>

                      <Pressable
                        style={({ pressed }) => [styles.deletePostBtn, pressed && styles.pressed]}
                        onPress={() => handleDeletePost(p)}
                      >
                        <Ionicons name="trash-outline" size={14} color="#EF4444" />
                        <Text style={styles.deletePostBtnText} numberOfLines={1}>Remove Post</Text>
                      </Pressable>
                    </View>

                    <Text style={styles.postContentText}>{p.content}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* =========================================
          MODAL 3: GILEO ELEVATE COHORTS & E-BOOKS
      ========================================= */}
      <Modal
        visible={showElevateModal}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => setShowElevateModal(false)}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={['top', 'bottom', 'left', 'right']}>
          <View style={[styles.modalHeader, { paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 16) : 12 }]}>
            <Pressable
              onPress={() => setShowElevateModal(false)}
              style={styles.modalCloseCircle}
              hitSlop={12}
            >
              <Ionicons name="close" size={20} color="#0F172A" />
            </Pressable>
            <Text style={styles.modalHeaderTitle} numberOfLines={1}>
              Gileo Elevate & E-Books Management
            </Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Sub Nav Tabs inside Modal */}
          <View style={styles.modalTabRow}>
            <Pressable
              style={[styles.modalTabBtn, elevateTab === 'COHORTS' && styles.modalTabBtnActive]}
              onPress={() => setElevateTab('COHORTS')}
            >
              <Ionicons
                name="school"
                size={16}
                color={elevateTab === 'COHORTS' ? '#FFFFFF' : '#64748B'}
              />
              <Text
                style={[styles.modalTabText, elevateTab === 'COHORTS' && styles.modalTabTextActive]}
                numberOfLines={1}
              >
                Elevate Cohorts ({cohorts.length})
              </Text>
            </Pressable>

            <Pressable
              style={[styles.modalTabBtn, elevateTab === 'EBOOKS' && styles.modalTabBtnActive]}
              onPress={() => setElevateTab('EBOOKS')}
            >
              <Ionicons
                name="book"
                size={16}
                color={elevateTab === 'EBOOKS' ? '#FFFFFF' : '#64748B'}
              />
              <Text
                style={[styles.modalTabText, elevateTab === 'EBOOKS' && styles.modalTabTextActive]}
                numberOfLines={1}
              >
                E-Books Library ({ebooks.length})
              </Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.modalScrollContent,
              { paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom + 30, 48) : 24 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {elevateTab === 'COHORTS' ? (
              /* ELEVATE COHORTS SECTION */
              <View style={{ gap: 16 }}>
                <Pressable style={styles.createItemBtn} onPress={handleOpenAddCohort}>
                  <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.createItemBtnText}>+ Create New Elevate Cohort</Text>
                </Pressable>

                {cohorts.length === 0 ? (
                  <Text style={styles.emptyModalText}>No Elevate Cohorts created yet.</Text>
                ) : (
                  cohorts.map((c) => (
                    <View key={c.id} style={styles.itemManageCard}>
                      <View style={styles.itemCardHeaderRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemCardTitle} numberOfLines={2}>
                            {c.title}
                          </Text>
                          <Text style={styles.itemCardSub}>
                            {formatKobo(c.priceKobo)} • {c.enrolledCount || 0} Enrolled
                          </Text>
                        </View>
                        <View
                          style={
                            c.status === 'PUBLISHED'
                              ? styles.statusTagPublished
                              : styles.statusTagDraft
                          }
                        >
                          <Text
                            style={
                              c.status === 'PUBLISHED'
                                ? styles.statusTagTextPublished
                                : styles.statusTagTextDraft
                            }
                          >
                            {c.status || 'PUBLISHED'}
                          </Text>
                        </View>
                      </View>

                      {c.overview ? (
                        <Text style={styles.itemCardDescText} numberOfLines={2}>
                          {c.overview}
                        </Text>
                      ) : null}

                      <View style={styles.itemCardActionRow}>
                        <Pressable
                          style={styles.itemDetailBtn}
                          onPress={() => {
                            setViewingCohort(c);
                            setShowCohortDetailModal(true);
                          }}
                        >
                          <Ionicons name="eye-outline" size={14} color="#0F172A" />
                          <Text style={styles.itemDetailBtnText}>View Details</Text>
                        </Pressable>

                        <Pressable style={styles.itemEditBtn} onPress={() => handleOpenEditCohort(c)}>
                          <Ionicons name="create-outline" size={14} color="#0F172A" />
                          <Text style={styles.itemEditBtnText}>Edit</Text>
                        </Pressable>

                        <Pressable
                          style={styles.itemDeleteBtn}
                          disabled={deletingCohortId === c.id}
                          onPress={() => handleDeleteCohort(c)}
                        >
                          {deletingCohortId === c.id ? (
                            <ActivityIndicator size="small" color="#EF4444" />
                          ) : (
                            <>
                              <Ionicons name="trash-outline" size={14} color="#EF4444" />
                              <Text style={styles.itemDeleteBtnText}>Delete</Text>
                            </>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  ))
                )}
              </View>
            ) : (
              /* DIGITAL E-BOOKS SECTION */
              <View style={{ gap: 16 }}>
                <Pressable style={styles.createItemBtn} onPress={handleOpenAddEbook}>
                  <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.createItemBtnText}>+ Create & Upload New E-Book</Text>
                </Pressable>

                {ebooks.length === 0 ? (
                  <Text style={styles.emptyModalText}>No E-Books uploaded to library yet.</Text>
                ) : (
                  ebooks.map((e) => (
                    <View key={e.id} style={styles.itemManageCard}>
                      <View style={{ flexDirection: 'row', gap: 12 }}>
                        {e.coverImage ? (
                          <Image source={{ uri: e.coverImage }} style={styles.ebookCardThumb} resizeMode="cover" />
                        ) : (
                          <View style={styles.ebookCardThumbFallback}>
                            <Ionicons name="book" size={24} color="#F10505" />
                          </View>
                        )}

                        <View style={{ flex: 1, gap: 4 }}>
                          <View style={styles.itemCardHeaderRow}>
                            <Text style={[styles.itemCardTitle, { flex: 1 }]} numberOfLines={1}>
                              {e.title}
                            </Text>
                            <View
                              style={
                                e.status === 'PUBLISHED'
                                  ? styles.statusTagPublished
                                  : styles.statusTagDraft
                              }
                            >
                              <Text
                                style={
                                  e.status === 'PUBLISHED'
                                    ? styles.statusTagTextPublished
                                    : styles.statusTagTextDraft
                                }
                              >
                                {e.status || 'PUBLISHED'}
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.itemCardSub}>
                            {e.author || 'Gileo Medicals Global Limited'} • {formatKobo(e.priceKobo)}
                          </Text>

                          {e.description ? (
                            <Text style={styles.itemCardDescText} numberOfLines={2}>
                              {e.description}
                            </Text>
                          ) : null}
                        </View>
                      </View>

                      <View style={styles.itemCardActionRow}>
                        <Pressable
                          style={styles.itemDetailBtn}
                          onPress={() => {
                            setViewingEbook(e);
                            setShowEbookDetailModal(true);
                          }}
                        >
                          <Ionicons name="eye-outline" size={14} color="#0F172A" />
                          <Text style={styles.itemDetailBtnText}>View Details</Text>
                        </Pressable>

                        <Pressable style={styles.itemEditBtn} onPress={() => handleOpenEditEbook(e)}>
                          <Ionicons name="create-outline" size={14} color="#0F172A" />
                          <Text style={styles.itemEditBtnText}>Edit</Text>
                        </Pressable>

                        <Pressable
                          style={styles.itemDeleteBtn}
                          disabled={deletingEbookId === e.id}
                          onPress={() => handleDeleteEbook(e)}
                        >
                          {deletingEbookId === e.id ? (
                            <ActivityIndicator size="small" color="#EF4444" />
                          ) : (
                            <>
                              <Ionicons name="trash-outline" size={14} color="#EF4444" />
                              <Text style={styles.itemDeleteBtnText}>Delete</Text>
                            </>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* =========================================
          COHORT CREATE / EDIT FORM MODAL
      ========================================= */}
      <Modal
        visible={showCohortFormModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowCohortFormModal(false)}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={['top', 'bottom', 'left', 'right']}>
          <View style={[styles.modalHeader, { paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 16) : 12 }]}>
            <Pressable onPress={() => setShowCohortFormModal(false)} style={styles.modalCloseCircle} hitSlop={12}>
              <Ionicons name="close" size={20} color="#0F172A" />
            </Pressable>
            <Text style={styles.modalHeaderTitle} numberOfLines={1}>
              {editingCohort ? 'Edit Elevate Cohort' : 'Create New Elevate Cohort'}
            </Text>
            <View style={{ width: 36 }} />
          </View>

          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
              contentContainerStyle={[
                styles.modalScrollContent,
                { paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom + 30, 48) : 24 },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={{ gap: 16 }}>
                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Cohort Title *</Text>
                  <TextInput
                    value={cohortTitle}
                    onChangeText={setCohortTitle}
                    placeholder="e.g. Nurse Concierge & Executive Leadership Cohort"
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Overview & Description *</Text>
                  <TextInput
                    value={cohortOverview}
                    onChangeText={setCohortOverview}
                    placeholder="Write detailed cohort overview, curriculum summary and benefits..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={4}
                    style={[styles.textInput, { height: 100, textAlignVertical: 'top' }]}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Learning Outcomes (One per line) *</Text>
                  <TextInput
                    value={cohortOutcomes}
                    onChangeText={setCohortOutcomes}
                    placeholder="Type key learning outcomes (each new line is a bullet item)"
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={4}
                    style={[styles.textInput, { height: 100, textAlignVertical: 'top' }]}
                  />
                </View>

                <View style={styles.twoColumnRow}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Price (₦ Naira) *</Text>
                    <TextInput
                      value={cohortPriceNaira}
                      onChangeText={setCohortPriceNaira}
                      placeholder="50000"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      style={styles.textInput}
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>Capacity *</Text>
                    <TextInput
                      value={cohortCapacity}
                      onChangeText={setCohortCapacity}
                      placeholder="50"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      style={styles.textInput}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Eligibility & Target Audience</Text>
                  <TextInput
                    value={cohortEligibility}
                    onChangeText={setCohortEligibility}
                    placeholder="e.g. Registered Nurses, Midwives & Healthcare Leaders"
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Schedule & Timing</Text>
                  <TextInput
                    value={cohortSchedule}
                    onChangeText={setCohortSchedule}
                    placeholder="e.g. Saturdays 10:00 AM WAT via Gileo Elevate"
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Status</Text>
                  <View style={styles.statusToggleRow}>
                    <Pressable
                      style={[styles.statusToggleOption, cohortStatus === 'PUBLISHED' && styles.statusToggleOptionActive]}
                      onPress={() => setCohortStatus('PUBLISHED')}
                    >
                      <Text style={[styles.statusToggleText, cohortStatus === 'PUBLISHED' && styles.statusToggleTextActive]}>
                        PUBLISHED
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[styles.statusToggleOption, cohortStatus === 'DRAFT' && styles.statusToggleOptionActive]}
                      onPress={() => setCohortStatus('DRAFT')}
                    >
                      <Text style={[styles.statusToggleText, cohortStatus === 'DRAFT' && styles.statusToggleTextActive]}>
                        DRAFT
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.modalActionsRow}>
                  <Pressable style={styles.cancelBtn} onPress={() => setShowCohortFormModal(false)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </Pressable>

                  <Pressable
                    style={styles.publishBtn}
                    disabled={isSavingCohort}
                    onPress={handleSaveCohort}
                  >
                    {isSavingCohort ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                        <Text style={styles.publishBtnText}>
                          {editingCohort ? 'Save Changes' : 'Publish Cohort'}
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* =========================================
          E-BOOK CREATE / EDIT FORM MODAL
      ========================================= */}
      <Modal
        visible={showEbookFormModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowEbookFormModal(false)}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={['top', 'bottom', 'left', 'right']}>
          <View style={[styles.modalHeader, { paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 16) : 12 }]}>
            <Pressable onPress={() => setShowEbookFormModal(false)} style={styles.modalCloseCircle} hitSlop={12}>
              <Ionicons name="close" size={20} color="#0F172A" />
            </Pressable>
            <Text style={styles.modalHeaderTitle} numberOfLines={1}>
              {editingEbook ? 'Edit Digital E-Book' : 'Create & Upload New E-Book'}
            </Text>
            <View style={{ width: 36 }} />
          </View>

          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
              contentContainerStyle={[
                styles.modalScrollContent,
                { paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom + 30, 48) : 24 },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={{ gap: 16 }}>
                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>E-Book Title *</Text>
                  <TextInput
                    value={ebookTitle}
                    onChangeText={setEbookTitle}
                    placeholder="e.g. How to Build an Independent Concierge Nursing Practice"
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Author Name</Text>
                  <TextInput
                    value={ebookAuthor}
                    onChangeText={setEbookAuthor}
                    placeholder="Gileo Medicals Global Limited"
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Price (₦ Naira) *</Text>
                  <TextInput
                    value={ebookPriceNaira}
                    onChangeText={setEbookPriceNaira}
                    placeholder="5000"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    style={styles.textInput}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>E-Book Description *</Text>
                  <TextInput
                    value={ebookDescription}
                    onChangeText={setEbookDescription}
                    placeholder="Detailed handbook overview and what readers will learn..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={4}
                    style={[styles.textInput, { height: 90, textAlignVertical: 'top' }]}
                  />
                </View>

                {/* Cover Photo Upload */}
                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Cover Image Attachment</Text>
                  <Text style={styles.fieldSubLabel}>
                    Upload cover photo from phone gallery or camera.
                  </Text>

                  <View style={styles.uploadCardsRow}>
                    <Pressable
                      style={({ pressed }) => [styles.uploadCard, pressed && styles.pressed]}
                      disabled={isUploadingEbookCover}
                      onPress={() => handlePickEbookCoverPhoto('gallery')}
                    >
                      <Ionicons name="images" size={18} color="#10B981" />
                      <Text style={styles.uploadCardTitle}>Gallery</Text>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [styles.uploadCard, pressed && styles.pressed]}
                      disabled={isUploadingEbookCover}
                      onPress={() => handlePickEbookCoverPhoto('camera')}
                    >
                      <Ionicons name="camera" size={18} color="#4F46E5" />
                      <Text style={styles.uploadCardTitle}>Camera</Text>
                    </Pressable>
                  </View>

                  {isUploadingEbookCover && (
                    <View style={styles.uploadingBox}>
                      <ActivityIndicator size="small" color="#10B981" />
                      <Text style={styles.uploadingText}>Uploading cover image...</Text>
                    </View>
                  )}

                  <TextInput
                    value={ebookCoverImage}
                    onChangeText={setEbookCoverImage}
                    placeholder="Or paste cover image URL (e.g. https://res.cloudinary.com/...)"
                    placeholderTextColor="#94A3B8"
                    style={[styles.textInput, { marginTop: 8 }]}
                  />

                  {ebookCoverImage.length > 0 && (
                    <View style={{ marginTop: 8, alignItems: 'center' }}>
                      <Image source={{ uri: ebookCoverImage }} style={{ width: 100, height: 130, borderRadius: 12 }} resizeMode="cover" />
                    </View>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>E-Book PDF Link / Key</Text>
                  <TextInput
                    value={ebookFileKey}
                    onChangeText={setEbookFileKey}
                    placeholder="e.g. https://.../handbook.pdf or pdf-key"
                    placeholderTextColor="#94A3B8"
                    style={styles.textInput}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Status</Text>
                  <View style={styles.statusToggleRow}>
                    <Pressable
                      style={[styles.statusToggleOption, ebookStatus === 'PUBLISHED' && styles.statusToggleOptionActive]}
                      onPress={() => setEbookStatus('PUBLISHED')}
                    >
                      <Text style={[styles.statusToggleText, ebookStatus === 'PUBLISHED' && styles.statusToggleTextActive]}>
                        PUBLISHED
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[styles.statusToggleOption, ebookStatus === 'DRAFT' && styles.statusToggleOptionActive]}
                      onPress={() => setEbookStatus('DRAFT')}
                    >
                      <Text style={[styles.statusToggleText, ebookStatus === 'DRAFT' && styles.statusToggleTextActive]}>
                        DRAFT
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.modalActionsRow}>
                  <Pressable style={styles.cancelBtn} onPress={() => setShowEbookFormModal(false)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </Pressable>

                  <Pressable
                    style={styles.publishBtn}
                    disabled={isSavingEbook}
                    onPress={handleSaveEbook}
                  >
                    {isSavingEbook ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                        <Text style={styles.publishBtnText}>
                          {editingEbook ? 'Save Changes' : 'Publish E-Book'}
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* =========================================
          COHORT FULL DETAIL VIEW MODAL
      ========================================= */}
      <Modal
        visible={showCohortDetailModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCohortDetailModal(false)}
      >
        <Pressable style={styles.modalOverlayDark} onPress={() => setShowCohortDetailModal(false)}>
          <Pressable style={styles.detailModalCard} onPress={(e) => e.stopPropagation()}>
            {viewingCohort && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
                <View style={styles.detailHeaderRow}>
                  <Text style={styles.detailTitleText}>{viewingCohort.title}</Text>
                  <Pressable onPress={() => setShowCohortDetailModal(false)} hitSlop={10}>
                    <Ionicons name="close" size={20} color="#64748B" />
                  </Pressable>
                </View>

                <View style={styles.detailTagRow}>
                  <View style={styles.pricePill}>
                    <Text style={styles.pricePillText}>{formatKobo(viewingCohort.priceKobo)}</Text>
                  </View>
                  <Text style={styles.detailMetaText}>
                    Enroled: {viewingCohort.enrolledCount || 0} / {viewingCohort.capacity || 'Unlimited'}
                  </Text>
                </View>

                <View style={styles.detailGroup}>
                  <Text style={styles.detailHeading}>Overview</Text>
                  <Text style={styles.detailBodyText}>{viewingCohort.overview}</Text>
                </View>

                {viewingCohort.learningOutcomes && viewingCohort.learningOutcomes.length > 0 && (
                  <View style={styles.detailGroup}>
                    <Text style={styles.detailHeading}>Learning Outcomes</Text>
                    {viewingCohort.learningOutcomes.map((item, idx) => (
                      <View key={idx} style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
                        <Ionicons name="checkmark-circle" size={14} color="#10B981" style={{ marginTop: 2 }} />
                        <Text style={[styles.detailBodyText, { flex: 1 }]}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {viewingCohort.schedule ? (
                  <View style={styles.detailGroup}>
                    <Text style={styles.detailHeading}>Schedule</Text>
                    <Text style={styles.detailBodyText}>{viewingCohort.schedule}</Text>
                  </View>
                ) : null}

                {viewingCohort.eligibility ? (
                  <View style={styles.detailGroup}>
                    <Text style={styles.detailHeading}>Eligibility</Text>
                    <Text style={styles.detailBodyText}>{viewingCohort.eligibility}</Text>
                  </View>
                ) : null}

                <Pressable
                  style={styles.detailCloseBtn}
                  onPress={() => setShowCohortDetailModal(false)}
                >
                  <Text style={styles.detailCloseBtnText}>Close</Text>
                </Pressable>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* =========================================
          E-BOOK FULL DETAIL VIEW MODAL
      ========================================= */}
      <Modal
        visible={showEbookDetailModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEbookDetailModal(false)}
      >
        <Pressable style={styles.modalOverlayDark} onPress={() => setShowEbookDetailModal(false)}>
          <Pressable style={styles.detailModalCard} onPress={(e) => e.stopPropagation()}>
            {viewingEbook && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
                <View style={styles.detailHeaderRow}>
                  <Text style={styles.detailTitleText}>{viewingEbook.title}</Text>
                  <Pressable onPress={() => setShowEbookDetailModal(false)} hitSlop={10}>
                    <Ionicons name="close" size={20} color="#64748B" />
                  </Pressable>
                </View>

                {viewingEbook.coverImage && (
                  <Image source={{ uri: viewingEbook.coverImage }} style={{ width: '100%', height: 160, borderRadius: 16 }} resizeMode="cover" />
                )}

                <Text style={styles.detailMetaText}>
                  By {viewingEbook.author || 'Gileo Medicals Global Limited'} • {formatKobo(viewingEbook.priceKobo)}
                </Text>

                <View style={styles.detailGroup}>
                  <Text style={styles.detailHeading}>Description & Summary</Text>
                  <Text style={styles.detailBodyText}>{viewingEbook.description}</Text>
                </View>

                <View style={styles.detailGroup}>
                  <Text style={styles.detailHeading}>PDF File Attachment</Text>
                  <Text style={styles.detailBodyText}>
                    {viewingEbook.fileKey ? `Attached Key: ${viewingEbook.fileKey}` : 'No PDF attached yet.'}
                  </Text>
                </View>

                <Pressable
                  style={styles.detailCloseBtn}
                  onPress={() => setShowEbookDetailModal(false)}
                >
                  <Text style={styles.detailCloseBtnText}>Close</Text>
                </Pressable>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#3F0106',
    gap: 8,
  },
  toastBannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  topHeaderTitleBox: {
    flex: 1,
    marginRight: 10,
    minWidth: 0,
  },
  headerSub: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerRefreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 40,
    gap: 16,
  },
  profileHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 12,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F10505',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  heroTextContainer: {
    flex: 1,
    gap: 2,
  },
  heroName: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  heroEmail: {
    color: '#64748B',
    fontSize: 12,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  verifiedBadgeText: {
    color: '#F10505',
    fontSize: 11,
    fontWeight: '700',
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  metricVal: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  modulesContainer: {
    gap: 12,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 14,
  },
  moduleIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleTextContainer: {
    flex: 1,
    gap: 4,
  },
  moduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  moduleTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  moduleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  moduleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  moduleSub: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
  },
  pressed: {
    opacity: 0.75,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalCloseCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 12,
    gap: 12,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  searchIcon: {
    marginRight: 2,
  },
  searchInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipBtnActive: {
    backgroundColor: '#F10505',
    borderColor: '#F10505',
  },
  filterChipBtnText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  filterChipBtnTextActive: {
    color: '#FFFFFF',
  },
  modalListContent: {
    gap: 10,
    paddingBottom: 40,
  },
  emptyModalText: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 32,
  },
  userCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  userAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  userInfoCol: {
    flex: 1,
    gap: 2,
  },
  userNameText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  userEmailText: {
    color: '#64748B',
    fontSize: 12,
  },
  roleTagBox: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  roleTagText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
  },
  roleTagTextAdmin: {
    color: '#F10505',
  },
  userActionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleRoleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#0F172A',
  },
  toggleRoleBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  deleteUserBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postCardItem: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  postHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  postAuthorText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  deletePostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FEF2F2',
  },
  deletePostBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  postContentText: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
  },
  modalTabRow: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#F8FAFC',
  },
  modalTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalTabBtnActive: {
    backgroundColor: '#F10505',
    borderColor: '#F10505',
  },
  modalTabText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  modalTabTextActive: {
    color: '#FFFFFF',
  },
  modalScrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  createItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F10505',
  },
  createItemBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  itemManageCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  itemCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemCardTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  itemCardSub: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  itemCardDescText: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 17,
  },
  itemCardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  itemDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  itemDetailBtnText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '700',
  },
  itemEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  itemEditBtnText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '700',
  },
  itemDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FEF2F2',
    marginLeft: 'auto',
  },
  itemDeleteBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  ebookCardThumb: {
    width: 60,
    height: 80,
    borderRadius: 10,
  },
  ebookCardThumbFallback: {
    width: 60,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputGroup: {
    gap: 6,
  },
  fieldLabel: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  fieldSubLabel: {
    color: '#64748B',
    fontSize: 11,
  },
  textInput: {
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    color: '#0F172A',
    fontSize: 13,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statusToggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusToggleOption: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusToggleOptionActive: {
    backgroundColor: '#F10505',
    borderColor: '#F10505',
  },
  statusToggleText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  statusToggleTextActive: {
    color: '#FFFFFF',
  },
  modalActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  publishBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F10505',
  },
  publishBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  uploadCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  uploadCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  uploadCardTitle: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
  uploadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  uploadingText: {
    color: '#64748B',
    fontSize: 12,
  },
  statusTagPublished: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#ECFDF5',
  },
  statusTagTextPublished: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
  },
  statusTagDraft: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#FEF3C7',
  },
  statusTagTextDraft: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '800',
  },
  modalOverlayDark: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  detailModalCard: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
  },
  detailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailTitleText: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
  },
  detailTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pricePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FEF2F2',
  },
  pricePillText: {
    color: '#F10505',
    fontSize: 12,
    fontWeight: '800',
  },
  detailMetaText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  detailGroup: {
    gap: 4,
  },
  detailHeading: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  detailBodyText: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 19,
  },
  detailCloseBtn: {
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  detailCloseBtnText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
});
