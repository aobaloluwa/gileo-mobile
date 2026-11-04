import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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

type AdminAnnouncement = {
  id: string;
  title: string;
  body: string;
  status: string;
  imageUrl?: string;
  createdAt?: string;
};

export function AdminHubView() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [posts, setPosts] = useState<AdminCommunityPost[]>([]);
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastText, setToastText] = useState('');

  // Modals visibility states
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showPostsModal, setShowPostsModal] = useState(false);
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);

  // User Management State
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'ADMIN' | 'CUSTOMER'>('ALL');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Community Moderation State
  const [postSearch, setPostSearch] = useState('');

  // Announcement Form State
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceBody, setAnnounceBody] = useState('');
  const [announceImages, setAnnounceImages] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const u = await getStoredUser();
      setUser(u);

      const [allUsrs, allPosts, annRes] = await Promise.all([
        apiRequest<AdminUser[]>('/admin/users').catch(() => []),
        apiRequest<AdminCommunityPost[]>('/community/posts').catch(() => []),
        apiRequest<any>('/community/resources').catch(() => null),
      ]);

      setUsers(Array.isArray(allUsrs) ? allUsrs : []);
      setPosts(Array.isArray(allPosts) ? allPosts : []);

      if (annRes && Array.isArray(annRes.announcements)) {
        setAnnouncements(annRes.announcements);
      }
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
            try {
              await apiRequest<any>(`/admin/users/${u.id}`, { method: 'DELETE' });
              setUsers((prev) => prev.filter((usr) => usr.id !== u.id));
              showToast('User account deleted');
            } catch (err: any) {
              showToast(err?.message || 'Could not delete user');
            }
          },
        },
      ],
    );
  };

  const handleDeletePost = (p: AdminCommunityPost) => {
    Alert.alert(
      'Remove Post',
      'Are you sure you want to remove this post from community feed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove Post',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiRequest<any>(`/community/posts/${p.id}`, { method: 'DELETE' });
              setPosts((prev) => prev.filter((post) => post.id !== p.id));
              showToast('Community post removed');
            } catch (err: any) {
              showToast(err?.message || 'Could not delete post');
            }
          },
        },
      ],
    );
  };

  // Upload Announcement Banner Image
  const handleUploadBannerImage = async (source: 'gallery' | 'camera') => {
    try {
      let result: ImagePicker.ImagePickerResult;
      if (source === 'gallery') {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission Required', 'Please grant photo library access.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.85,
        });
      } else {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission Required', 'Please grant camera access.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
      }

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setIsUploadingBanner(true);
        showToast('Uploading banner photo...');

        try {
          const uploaded = await uploadImageApi(result.assets[0].uri);
          const finalUrl = uploaded?.url || result.assets[0].uri;
          setAnnounceImages((prev) => [...prev, finalUrl]);
          showToast('Image attached to broadcast!');
        } catch {
          setAnnounceImages((prev) => [...prev, result.assets[0].uri]);
          showToast('Image attached');
        }
      }
    } catch (err: any) {
      showToast(`Upload failed: ${err?.message || 'Could not upload image'}`);
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handlePublishAnnounce = async () => {
    if (!announceTitle.trim() || !announceBody.trim()) {
      showToast('Please enter announcement title and content.');
      return;
    }
    setIsPublishing(true);
    try {
      await apiRequest<any>('/community/announcements', {
        method: 'POST',
        body: JSON.stringify({
          title: announceTitle.trim(),
          slug: announceTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          body: announceBody.trim(),
          status: 'PUBLISHED',
        }),
      });
      setShowAnnounceModal(false);
      setAnnounceTitle('');
      setAnnounceBody('');
      setAnnounceImages([]);
      showToast('Announcement published successfully!');
      await loadData();
    } catch (err: any) {
      showToast(err?.message || 'Could not publish announcement');
    } finally {
      setIsPublishing(false);
    }
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
            hitSlop={8}
          >
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          </Pressable>
        </View>

        {/* Overview Metrics Row */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: '#FDF2F2' }]}>
              <Ionicons name="people" size={16} color="#F10505" />
            </View>
            <View style={styles.metricCardTextContent}>
              <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
                {totalUsersCount}
              </Text>
              <Text style={styles.metricLabel} numberOfLines={1}>
                Total Users
              </Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="shield-half" size={16} color="#4F46E5" />
            </View>
            <View style={styles.metricCardTextContent}>
              <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
                {adminCount}
              </Text>
              <Text style={styles.metricLabel} numberOfLines={1}>
                Admins
              </Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="newspaper" size={16} color="#10B981" />
            </View>
            <View style={styles.metricCardTextContent}>
              <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
                {totalPostsCount}
              </Text>
              <Text style={styles.metricLabel} numberOfLines={1}>
                Feed Posts
              </Text>
            </View>
          </View>
        </View>

        {/* Operation Modules List */}
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
                <Ionicons name="person-circle" size={24} color="#F10505" />
              </View>
              <View style={styles.moduleTextContainer}>
                <View style={styles.moduleTitleRow}>
                  <Text style={styles.moduleTitle} numberOfLines={1}>
                    User Account Management
                  </Text>
                  <View style={styles.moduleBadge}>
                    <Text style={styles.moduleBadgeText}>{users.length}</Text>
                  </View>
                </View>

                <Text style={styles.moduleSub} numberOfLines={2}>
                  Manage user credentials, promote/demote administrator roles, and audit account access.
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

            {/* Module 3: Announcements & Broadcasts */}
            <Pressable
              style={({ pressed }) => [styles.moduleCard, pressed && styles.pressed]}
              onPress={() => setShowAnnounceModal(true)}
            >
              <View style={[styles.moduleIconCircle, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="megaphone" size={22} color="#10B981" />
              </View>
              <View style={styles.moduleTextContainer}>
                <View style={styles.moduleTitleRow}>
                  <Text style={styles.moduleTitle} numberOfLines={1}>
                    Broadcast Announcements
                  </Text>
                  <View style={[styles.moduleBadge, { backgroundColor: '#ECFDF5' }]}>
                    <Text style={[styles.moduleBadgeText, { color: '#10B981' }]}>
                      {announcements.length}
                    </Text>
                  </View>
                </View>

                <Text style={styles.moduleSub} numberOfLines={2}>
                  Publish platform-wide announcements, push update notifications, and upload banner graphics.
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
          {/* Header */}
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
            {/* Search Input */}
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

            {/* Role Filter Chips */}
            <View style={styles.roleFilterRow}>
              {(['ALL', 'ADMIN', 'CUSTOMER'] as const).map((r) => {
                const isActive = userRoleFilter === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setUserRoleFilter(r)}
                    style={[styles.roleChip, isActive && styles.roleChipActive]}
                  >
                    <Text style={[styles.roleChipText, isActive && styles.roleChipTextActive]}>
                      {r === 'ALL' ? 'All Roles' : r === 'ADMIN' ? 'Admins Only' : 'Customers'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Users List */}
            <ScrollView
              contentContainerStyle={[
                styles.modalScrollContent,
                { paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom + 20, 40) : 24 },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {filteredUsersList.length === 0 ? (
                <Text style={styles.emptyModalText}>No users matched your search criteria.</Text>
              ) : (
                filteredUsersList.map((u) => {
                  const isAdmin = u.role === 'ADMIN';
                  return (
                    <View key={u.id} style={styles.userCard}>
                      <View style={styles.userCardHeader}>
                        <View style={styles.userAvatarSquare}>
                          <Text style={styles.userAvatarText}>
                            {(u.displayName || u.email || 'U').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.userNameText} numberOfLines={1}>
                            {u.displayName || u.email?.split('@')[0]}
                          </Text>
                          <Text style={styles.userEmailText} numberOfLines={1}>
                            {u.email}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.roleBadge,
                            isAdmin ? styles.roleBadgeAdmin : styles.roleBadgeCustomer,
                          ]}
                        >
                          <Text
                            style={[
                              styles.roleBadgeText,
                              isAdmin ? styles.roleBadgeTextAdmin : styles.roleBadgeTextCustomer,
                            ]}
                          >
                            {u.role}
                          </Text>
                        </View>
                      </View>

                      {/* Action buttons */}
                      <View style={styles.userActionRow}>
                        <Pressable
                          style={({ pressed }) => [styles.roleToggleBtn, pressed && styles.pressed]}
                          disabled={updatingUserId === u.id}
                          onPress={() => handleToggleRole(u)}
                        >
                          {updatingUserId === u.id ? (
                            <ActivityIndicator size="small" color="#0F172A" />
                          ) : (
                            <>
                              <Ionicons name="shield-outline" size={14} color="#0F172A" />
                              <Text style={styles.roleToggleBtnText}>
                                {isAdmin ? 'Demote to Customer' : 'Promote to Admin'}
                              </Text>
                            </>
                          )}
                        </Pressable>

                        <Pressable
                          style={({ pressed }) => [styles.deleteUserBtn, pressed && styles.pressed]}
                          onPress={() => handleDeleteUser(u)}
                        >
                          <Ionicons name="trash-outline" size={14} color="#EF4444" />
                          <Text style={styles.deleteUserBtnText}>Delete</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* =========================================
          MODAL 2: COMMUNITY MODERATION
      ========================================= */}
      <Modal
        visible={showPostsModal}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => setShowPostsModal(false)}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={['top', 'bottom', 'left', 'right']}>
          {/* Header */}
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
            {/* Search Input */}
            <View style={styles.searchBarContainer}>
              <Ionicons name="search" size={18} color="#64748B" style={styles.searchIcon} />
              <TextInput
                value={postSearch}
                onChangeText={setPostSearch}
                placeholder="Search post content or author..."
                placeholderTextColor="#94A3B8"
                style={styles.searchInput}
              />
              {postSearch.length > 0 && (
                <Pressable onPress={() => setPostSearch('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </Pressable>
              )}
            </View>

            {/* Posts List */}
            <ScrollView
              contentContainerStyle={[
                styles.modalScrollContent,
                { paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom + 20, 40) : 24 },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {filteredPostsList.length === 0 ? (
                <Text style={styles.emptyModalText}>No community posts found.</Text>
              ) : (
                filteredPostsList.map((p) => (
                  <View key={p.id} style={styles.postCard}>
                    <View style={styles.postHeaderRow}>
                      <View style={styles.authorBadgeBox}>
                        <Ionicons name="person-circle-outline" size={16} color="#4F46E5" />
                        <Text style={styles.postAuthorText} numberOfLines={1}>
                          {p.authorName || 'Community Member'}
                        </Text>
                      </View>

                      <Pressable
                        style={({ pressed }) => [styles.deletePostBtn, pressed && styles.pressed]}
                        onPress={() => handleDeletePost(p)}
                      >
                        <Ionicons name="trash-outline" size={14} color="#EF4444" />
                        <Text style={styles.deletePostBtnText}>Remove Post</Text>
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
          MODAL 3: PUBLISH BROADCAST ANNOUNCEMENT
      ========================================= */}
      <Modal
        visible={showAnnounceModal}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => setShowAnnounceModal(false)}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={['top', 'bottom', 'left', 'right']}>
          {/* Header */}
          <View style={[styles.modalHeader, { paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 16) : 12 }]}>
            <Pressable
              onPress={() => setShowAnnounceModal(false)}
              style={styles.modalCloseCircle}
              hitSlop={12}
            >
              <Ionicons name="close" size={20} color="#0F172A" />
            </Pressable>
            <Text style={styles.modalHeaderTitle} numberOfLines={1}>
              Broadcast Announcement
            </Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.modalScrollContent,
              { paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom + 20, 40) : 24 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Title Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Announcement Title *</Text>
              <TextInput
                value={announceTitle}
                onChangeText={setAnnounceTitle}
                placeholder="e.g. Gileo Mobile v2.0 Platform Update"
                placeholderTextColor="#94A3B8"
                style={styles.textInput}
              />
            </View>

            {/* Body Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Broadcast Details *</Text>
              <TextInput
                value={announceBody}
                onChangeText={setAnnounceBody}
                placeholder="Write the full broadcast message for all Gileo users..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={5}
                style={[styles.textInput, { height: 110, textAlignVertical: 'top', paddingTop: 12 }]}
              />
            </View>

            {/* Banner Image Uploads */}
            <View style={styles.inputGroup}>
              <Text style={styles.fieldLabel}>Attach Announcement Graphic</Text>
              <Text style={styles.fieldSubLabel}>
                Upload promotional banner from device gallery or capture photo.
              </Text>

              <View style={styles.uploadCardsRow}>
                <Pressable
                  style={({ pressed }) => [styles.uploadCard, pressed && styles.pressed]}
                  disabled={isUploadingBanner}
                  onPress={() => handleUploadBannerImage('gallery')}
                >
                  <Ionicons name="images" size={18} color="#10B981" />
                  <Text style={styles.uploadCardTitle} numberOfLines={1}>
                    Device Gallery
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.uploadCard, pressed && styles.pressed]}
                  disabled={isUploadingBanner}
                  onPress={() => handleUploadBannerImage('camera')}
                >
                  <Ionicons name="camera" size={18} color="#4F46E5" />
                  <Text style={styles.uploadCardTitle} numberOfLines={1}>
                    Camera Photo
                  </Text>
                </Pressable>
              </View>

              {isUploadingBanner && (
                <View style={styles.uploadingBox}>
                  <ActivityIndicator size="small" color="#10B981" />
                  <Text style={styles.uploadingText}>Uploading graphic banner...</Text>
                </View>
              )}

              {announceImages.length > 0 && (
                <View style={styles.thumbsGrid}>
                  {announceImages.map((uri, idx) => (
                    <View key={idx} style={styles.thumbWrapper}>
                      <Image source={{ uri }} style={styles.thumbImage} resizeMode="cover" />
                      <Pressable
                        style={styles.thumbRemoveBtn}
                        onPress={() => setAnnounceImages((prev) => prev.filter((_, i) => i !== idx))}
                        hitSlop={8}
                      >
                        <Ionicons name="close-circle" size={18} color="#EF4444" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Bottom Actions */}
            <View style={styles.modalActionsRow}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowAnnounceModal(false)}>
                <Text style={styles.cancelBtnText} numberOfLines={1}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.publishBtn, pressed && styles.pressed]}
                disabled={isPublishing || isUploadingBanner}
                onPress={handlePublishAnnounce}
              >
                {isPublishing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={16} color="#FFFFFF" />
                    <Text style={styles.publishBtnText} numberOfLines={1}>
                      Publish Broadcast
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
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
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 96,
    gap: 14,
  },
  profileHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F10505',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  heroTextContainer: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  heroName: {
    color: '#0F172A',
    fontSize: 15,
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  metricIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  metricCardTextContent: {
    flex: 1,
    minWidth: 0,
  },
  metricValue: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },
  modulesContainer: {
    gap: 12,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  moduleIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  moduleTextContainer: {
    flex: 1,
    minWidth: 0,
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
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  moduleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#FDF2F2',
  },
  moduleBadgeText: {
    color: '#F10505',
    fontSize: 10,
    fontWeight: '800',
  },
  moduleSub: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 16,
  },

  /* Modal Base Styles */
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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
    paddingTop: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  modalScrollContent: {
    gap: 12,
    paddingTop: 4,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 14,
  },
  roleFilterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  roleChipActive: {
    backgroundColor: '#3F0106',
    borderColor: '#3F0106',
  },
  roleChipText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  roleChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  emptyModalText: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 32,
  },

  /* User Card */
  userCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  userCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userAvatarSquare: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#3F0106',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
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
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    flexShrink: 0,
  },
  roleBadgeAdmin: {
    backgroundColor: '#FDF2F2',
  },
  roleBadgeCustomer: {
    backgroundColor: '#E2E8F0',
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  roleBadgeTextAdmin: {
    color: '#F10505',
  },
  roleBadgeTextCustomer: {
    color: '#475569',
  },
  userActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleToggleBtn: {
    flex: 1,
    height: 36,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  roleToggleBtnText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '700',
  },
  deleteUserBtn: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteUserBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },

  /* Post Card */
  postCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  postHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  authorBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  deletePostBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  postContentText: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 18,
  },

  /* Form & Uploads */
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
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    color: '#0F172A',
    fontSize: 14,
  },
  uploadCardsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  uploadCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
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
    paddingVertical: 6,
  },
  uploadingText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  thumbsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  thumbWrapper: {
    position: 'relative',
    width: 72,
    height: 72,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbRemoveBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  publishBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: 999,
    backgroundColor: '#F10505',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#F10505',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  publishBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
});
