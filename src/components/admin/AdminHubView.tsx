import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { apiRequest } from '../../services/api';
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
};

export function AdminHubView() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [posts, setPosts] = useState<AdminCommunityPost[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Announcement Modal State
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceBody, setAnnounceBody] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [toastText, setToastText] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const u = await getStoredUser();
      setUser(u);

      const [allUsrs, allPosts] = await Promise.all([
        apiRequest<AdminUser[]>('/admin/users').catch(() => []),
        apiRequest<AdminCommunityPost[]>('/community/posts').catch(() => []),
      ]);

      setUsers(Array.isArray(allUsrs) ? allUsrs : []);
      setPosts(Array.isArray(allPosts) ? allPosts : []);
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

  const handleToggleRole = async (u: AdminUser) => {
    const newRole = u.role === 'ADMIN' ? 'CUSTOMER' : 'ADMIN';
    try {
      await apiRequest<any>(`/admin/users/${u.id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      setUsers((prev) =>
        prev.map((usr) => (usr.id === u.id ? { ...usr, role: newRole } : usr)),
      );
      setToastText(`Role updated to ${newRole}`);
    } catch (err: any) {
      setToastText(err?.message || 'Could not update role');
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await apiRequest<any>(`/admin/users/${id}`, { method: 'DELETE' });
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setToastText('User account deleted');
    } catch (err: any) {
      setToastText(err?.message || 'Could not delete user');
    }
  };

  const handleDeletePost = async (id: string) => {
    try {
      await apiRequest<any>(`/community/posts/${id}`, { method: 'DELETE' });
      setPosts((prev) => prev.filter((p) => p.id !== id));
      setToastText('Community post removed');
    } catch (err: any) {
      setToastText(err?.message || 'Could not delete post');
    }
  };

  const handlePublishAnnounce = async () => {
    if (!announceTitle.trim() || !announceBody.trim()) return;
    setIsPublishing(true);
    try {
      await apiRequest<any>('/community/announcements', {
        method: 'POST',
        body: JSON.stringify({
          title: announceTitle.trim(),
          slug: announceTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          body: announceBody.trim(),
          status: 'PUBLISHED',
        }),
      });
      setShowAnnounceModal(false);
      setAnnounceTitle('');
      setAnnounceBody('');
      setToastText('Announcement published!');
    } catch (err: any) {
      setToastText(err?.message || 'Could not publish announcement');
    } finally {
      setIsPublishing(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.email?.toLowerCase().includes(q) ||
      u.displayName?.toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.topHeader}>
        <Text style={styles.headerSub}>Admin Operations Hub</Text>
        <Text style={styles.headerTitle}>Users & Control Center</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F10505" />}
      >
        {/* Admin Profile Hero Card */}
        <View style={styles.profileHero}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{(user?.displayName || 'A').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ gap: 2, flex: 1 }}>
            <Text style={styles.heroName}>{user?.displayName || 'Administrator'}</Text>
            <Text style={styles.heroEmail}>{user?.email}</Text>
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#F10505" />
              <Text style={styles.adminBadgeText}>Verified Administrator</Text>
            </View>
          </View>

          <Pressable
            style={styles.logoutBtn}
            onPress={async () => {
              await clearAuthSession();
              router.replace('/login');
            }}
          >
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          </Pressable>
        </View>

        {/* Quick Action Banner */}
        <Pressable style={styles.announceBtn} onPress={() => setShowAnnounceModal(true)}>
          <Ionicons name="megaphone" size={18} color="#FFFFFF" />
          <Text style={styles.announceBtnText}>Publish Platform Announcement</Text>
        </Pressable>

        {/* User Management Section */}
        <Text style={styles.sectionHeading}>User Account Management ({users.length})</Text>

        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search user name or email..."
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
        />

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#F10505" />
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {filteredUsers.map((u) => (
              <View key={u.id} style={styles.userCard}>
                <View style={styles.userHeader}>
                  <Text style={styles.userName}>{u.displayName || u.email?.split('@')[0]}</Text>
                  <View style={[styles.roleTag, { backgroundColor: u.role === 'ADMIN' ? '#FDF2F2' : '#F1F5F9' }]}>
                    <Text style={[styles.roleTagText, { color: u.role === 'ADMIN' ? '#F10505' : '#64748B' }]}>
                      {u.role}
                    </Text>
                  </View>
                </View>

                <Text style={styles.userEmailText}>{u.email}</Text>

                <View style={styles.actionRow}>
                  <Pressable style={styles.editBtn} onPress={() => handleToggleRole(u)}>
                    <Text style={styles.editBtnText}>
                      {u.role === 'ADMIN' ? 'Demote to Customer' : 'Promote to Admin'}
                    </Text>
                  </Pressable>

                  <Pressable style={styles.deleteBtn} onPress={() => handleDeleteUser(u.id)}>
                    <Text style={styles.deleteBtnText}>Delete User</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Community Moderation Section */}
        <Text style={[styles.sectionHeading, { marginTop: 14 }]}>Community Feed Moderation ({posts.length})</Text>

        <View style={{ gap: 10 }}>
          {posts.map((p) => (
            <View key={p.id} style={styles.userCard}>
              <View style={styles.userHeader}>
                <Text style={styles.userName}>{p.authorName}</Text>
                <Pressable style={styles.deleteBtn} onPress={() => handleDeletePost(p.id)}>
                  <Text style={styles.deleteBtnText}>Remove Post</Text>
                </Pressable>
              </View>
              <Text style={styles.userEmailText}>{p.content}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Publish Announcement Modal */}
      <Modal visible={showAnnounceModal} animationType="slide" onRequestClose={() => setShowAnnounceModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF', padding: 20, gap: 14 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>Publish Announcement</Text>

          <Text style={{ fontWeight: '700', color: '#0F172A' }}>Title *</Text>
          <TextInput value={announceTitle} onChangeText={setAnnounceTitle} placeholder="Announcement Title" style={styles.modalInput} />

          <Text style={{ fontWeight: '700', color: '#0F172A' }}>Content *</Text>
          <TextInput value={announceBody} onChangeText={setAnnounceBody} placeholder="Content details..." multiline numberOfLines={4} style={[styles.modalInput, { height: 100 }]} />

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 'auto' }}>
            <Pressable style={{ flex: 1, height: 48, borderRadius: 999, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' }} onPress={() => setShowAnnounceModal(false)}>
              <Text style={{ fontWeight: '700', color: '#0F172A' }}>Cancel</Text>
            </Pressable>
            <Pressable style={{ flex: 1, height: 48, borderRadius: 999, backgroundColor: '#F10505', alignItems: 'center', justifyContent: 'center' }} disabled={isPublishing} onPress={handlePublishAnnounce}>
              <Text style={{ fontWeight: '700', color: '#FFFFFF' }}>{isPublishing ? 'Publishing...' : 'Publish'}</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },
  topHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerSub: {
    color: '#64748B',
    fontSize: 12,
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 96,
    gap: 14,
  },
  profileHero: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F10505',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
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
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  adminBadgeText: {
    color: '#F10505',
    fontSize: 11,
    fontWeight: '700',
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  announceBtn: {
    height: 48,
    borderRadius: 999,
    backgroundColor: '#3F0106',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  announceBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeading: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  searchInput: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    color: '#0F172A',
    fontSize: 14,
  },
  userCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userName: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  roleTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  userEmailText: {
    color: '#64748B',
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  editBtnText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '700',
  },
  deleteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  modalInput: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    color: '#0F172A',
    fontSize: 14,
  },
  loadingBox: {
    paddingVertical: 30,
    alignItems: 'center',
  },
});
