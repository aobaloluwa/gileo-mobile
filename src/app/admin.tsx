import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest } from '../services/api';
import { AuthUser, clearAuthSession, getStoredAccessToken, getStoredUser } from '../services/auth';
import { colors, formatKobo, formatNaira } from '../theme/colors';

type AdminDashboardStats = {
  totalUsers?: number;
  totalOrders?: number;
  totalRevenueKobo?: number;
  activeServices?: number;
  openTickets?: number;
};

type OrderItem = {
  titleSnapshot: string;
  quantity: number;
  unitPriceKobo: number;
};

type AdminOrder = {
  id: string;
  reference: string;
  status: string;
  totalKobo: number;
  createdAt: string;
  user?: { id: string; displayName?: string; email?: string };
  shippingAddress?: { name?: string; phone?: string; address?: string };
  items: OrderItem[];
};

type AdminServiceRequest = {
  id: string;
  reference: string;
  status: string;
  preferredDate?: string;
  location?: string;
  customerNote?: string;
  createdAt: string;
  service?: { id: string; title: string };
  user?: { id: string; displayName?: string; email?: string };
  assignedProvider?: { id: string; displayName?: string };
};

type AdminProduct = {
  id: string;
  title: string;
  category?: { id: string; name: string };
  priceKobo: number;
  stock: number;
  description: string;
  status: string;
};

type AdminUser = {
  id: string;
  displayName?: string;
  email?: string;
  phoneNumber?: string;
  role: 'CUSTOMER' | 'ADMIN';
  createdAt?: string;
};

type AdminEbook = {
  id: string;
  title: string;
  slug: string;
  priceKobo: number;
  description: string;
  status: string;
};

type AdminCohort = {
  id: string;
  title: string;
  overview: string;
  priceKobo: number;
  capacity?: number;
  enrolledCount?: number;
  startsAt?: string;
  endsAt?: string;
  status: string;
};

type AdminCommunityPost = {
  id: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: number;
  likesCount?: number;
  commentsCount?: number;
};

const ORDER_STAGES = [
  { key: 'ALL', label: 'All Orders' },
  { key: 'PENDING_PAYMENT', label: 'Pending' },
  { key: 'PAID', label: 'Paid' },
  { key: 'PROCESSING', label: 'Processing' },
  { key: 'FULFILMENT', label: 'On The Way' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

const SERVICE_REQUEST_STAGES = [
  { key: 'ALL', label: 'All Requests' },
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'UNDER_REVIEW', label: 'Under Review' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'ASSIGNED', label: 'Nurse Assigned' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'COMPLETED', label: 'Completed' },
];

export default function AdminPortalScreen() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'orders' | 'services' | 'products' | 'users' | 'learning' | 'profile'
  >('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Stats & Data States
  const [stats, setStats] = useState<AdminDashboardStats>({});
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [serviceRequests, setServiceRequests] = useState<AdminServiceRequest[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [ebooks, setEbooks] = useState<AdminEbook[]>([]);
  const [cohorts, setCohorts] = useState<AdminCohort[]>([]);
  const [communityPosts, setCommunityPosts] = useState<AdminCommunityPost[]>([]);

  // Filter States
  const [selectedOrderStage, setSelectedOrderStage] = useState('ALL');
  const [selectedServiceStage, setSelectedServiceStage] = useState('ALL');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Modals & Action States
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [selectedServiceReq, setSelectedServiceReq] = useState<AdminServiceRequest | null>(null);

  // Product Form Modal State
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [prodTitle, setProdTitle] = useState('');
  const [prodPriceNaira, setProdPriceNaira] = useState('');
  const [prodStock, setProdStock] = useState('10');
  const [prodDescription, setProdDescription] = useState('');
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Assign Provider Modal State
  const [showAssignProviderModal, setShowAssignProviderModal] = useState(false);
  const [providerUserId, setProviderUserId] = useState('');
  const [isAssigningProvider, setIsAssigningProvider] = useState(false);

  // Announcement Modal State
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementBody, setAnnouncementBody] = useState('');
  const [isPublishingAnnouncement, setIsPublishingAnnouncement] = useState(false);

  // Toast Notification State
  const [toastText, setToastText] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);
  const toastAnim = useRef(new Animated.Value(-150)).current;

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

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const u = await getStoredUser();
      setUser(u);

      // Verify Admin access with backend
      const [dashStats, allOrd, allServReq, allProds, allUsrs, allEbk, allCoh, allPosts] =
        await Promise.all([
          apiRequest<AdminDashboardStats>('/admin/dashboard').catch(() => ({})),
          apiRequest<AdminOrder[]>('/shop/orders').catch(() => []),
          apiRequest<AdminServiceRequest[]>('/service-requests').catch(() => []),
          apiRequest<AdminProduct[]>('/shop/products').catch(() => []),
          apiRequest<AdminUser[]>('/admin/users').catch(() => []),
          apiRequest<AdminEbook[]>('/learning/ebooks').catch(() => []),
          apiRequest<AdminCohort[]>('/learning/cohorts').catch(() => []),
          apiRequest<AdminCommunityPost[]>('/community/posts').catch(() => []),
        ]);

      setStats(dashStats || {});
      setOrders(Array.isArray(allOrd) ? allOrd : []);
      setServiceRequests(Array.isArray(allServReq) ? allServReq : []);
      setProducts(Array.isArray(allProds) ? allProds : []);
      setUsers(Array.isArray(allUsrs) ? allUsrs : []);
      setEbooks(Array.isArray(allEbk) ? allEbk : []);
      setCohorts(Array.isArray(allCoh) ? allCoh : []);
      setCommunityPosts(Array.isArray(allPosts) ? allPosts : []);
    } catch (err: any) {
      triggerToast(err?.message || 'Access restricted to GILEO Administrators.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAdminData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAdminData();
    } finally {
      setRefreshing(false);
    }
  };

  // Chowdeck-Style Order Status Update Handler
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await apiRequest<any>(`/shop/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      triggerToast(`Order status updated to "${newStatus}"`);
    } catch (err: any) {
      triggerToast(err?.message || 'Could not update order status.');
    }
  };

  // Service Request Status Update Handler
  const handleUpdateServiceStatus = async (requestId: string, newStatus: string) => {
    try {
      await apiRequest<any>(`/service-requests/${requestId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });

      setServiceRequests((prev) =>
        prev.map((s) => (s.id === requestId ? { ...s, status: newStatus } : s)),
      );
      if (selectedServiceReq?.id === requestId) {
        setSelectedServiceReq((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      triggerToast(`Service request status updated to "${newStatus}"`);
    } catch (err: any) {
      triggerToast(err?.message || 'Could not update service request.');
    }
  };

  // Assign Provider / Nurse Handler
  const handleAssignProviderSubmit = async () => {
    if (!selectedServiceReq || !providerUserId.trim()) {
      triggerToast('Please enter or select a nurse provider ID');
      return;
    }

    setIsAssigningProvider(true);
    try {
      await apiRequest<any>(`/service-requests/${selectedServiceReq.id}/assign-provider`, {
        method: 'POST',
        body: JSON.stringify({ providerId: providerUserId.trim() }),
      });

      triggerToast('Nurse provider assigned successfully!');
      setShowAssignProviderModal(false);
      setProviderUserId('');
      await loadAdminData();
    } catch (err: any) {
      triggerToast(err?.message || 'Could not assign provider.');
    } finally {
      setIsAssigningProvider(false);
    }
  };

  // Product Creation & Edit Submit Handler
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProdTitle('');
    setProdPriceNaira('');
    setProdStock('10');
    setProdDescription('');
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (prod: AdminProduct) => {
    setEditingProduct(prod);
    setProdTitle(prod.title);
    setProdPriceNaira(String(Math.floor((prod.priceKobo || 0) / 100)));
    setProdStock(String(prod.stock || 0));
    setProdDescription(prod.description || '');
    setShowProductModal(true);
  };

  const handleSaveProductSubmit = async () => {
    if (!prodTitle.trim() || !prodPriceNaira.trim()) {
      triggerToast('Please fill in product title and price');
      return;
    }

    setIsSavingProduct(true);
    const priceKobo = Math.floor(parseFloat(prodPriceNaira) * 100);
    const stock = parseInt(prodStock, 10) || 0;

    try {
      if (editingProduct) {
        await apiRequest<any>(`/shop/products/${editingProduct.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            title: prodTitle.trim(),
            priceKobo,
            stock,
            description: prodDescription.trim(),
          }),
        });
        triggerToast('Product updated successfully!');
      } else {
        await apiRequest<any>('/shop/products', {
          method: 'POST',
          body: JSON.stringify({
            title: prodTitle.trim(),
            slug: prodTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            priceKobo,
            stock,
            description: prodDescription.trim() || 'Premium Gileo Medicals product.',
            status: 'PUBLISHED',
          }),
        });
        triggerToast('Product created successfully!');
      }

      setShowProductModal(false);
      await loadAdminData();
    } catch (err: any) {
      triggerToast(err?.message || 'Could not save product.');
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Delete Product Handler
  const handleDeleteProduct = async (productId: string) => {
    try {
      await apiRequest<any>(`/shop/products/${productId}`, { method: 'DELETE' });
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      triggerToast('Product deleted successfully');
    } catch (err: any) {
      triggerToast(err?.message || 'Could not delete product.');
    }
  };

  // User Role Management Handler
  const handleToggleUserRole = async (targetUser: AdminUser) => {
    const newRole = targetUser.role === 'ADMIN' ? 'CUSTOMER' : 'ADMIN';
    try {
      await apiRequest<any>(`/admin/users/${targetUser.id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });

      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u)),
      );
      triggerToast(`User ${targetUser.email || targetUser.id} updated to ${newRole}`);
    } catch (err: any) {
      triggerToast(err?.message || 'Could not update user role.');
    }
  };

  // Delete User Handler
  const handleDeleteUser = async (targetUserId: string) => {
    try {
      await apiRequest<any>(`/admin/users/${targetUserId}`, { method: 'DELETE' });
      setUsers((prev) => prev.filter((u) => u.id !== targetUserId));
      triggerToast('User account deleted');
    } catch (err: any) {
      triggerToast(err?.message || 'Could not delete user.');
    }
  };

  // Delete Community Post Handler
  const handleDeletePost = async (postId: string) => {
    try {
      await apiRequest<any>(`/community/posts/${postId}`, { method: 'DELETE' });
      setCommunityPosts((prev) => prev.filter((p) => p.id !== postId));
      triggerToast('Post deleted by Administrator');
    } catch (err: any) {
      triggerToast(err?.message || 'Could not delete post.');
    }
  };

  // Publish Announcement Handler
  const handlePublishAnnouncementSubmit = async () => {
    if (!announcementTitle.trim() || !announcementBody.trim()) {
      triggerToast('Please provide an announcement title and message');
      return;
    }

    setIsPublishingAnnouncement(true);
    try {
      await apiRequest<any>('/community/announcements', {
        method: 'POST',
        body: JSON.stringify({
          title: announcementTitle.trim(),
          slug: announcementTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          body: announcementBody.trim(),
          status: 'PUBLISHED',
        }),
      });

      setShowAnnouncementModal(false);
      setAnnouncementTitle('');
      setAnnouncementBody('');
      triggerToast('Official announcement published!');
    } catch (err: any) {
      triggerToast(err?.message || 'Could not publish announcement.');
    } finally {
      setIsPublishingAnnouncement(false);
    }
  };

  const filteredOrders = orders.filter(
    (o) => selectedOrderStage === 'ALL' || o.status === selectedOrderStage,
  );

  const filteredServices = serviceRequests.filter(
    (s) => selectedServiceStage === 'ALL' || s.status === selectedServiceStage,
  );

  const filteredUsers = users.filter((u) => {
    if (!userSearchQuery.trim()) return true;
    const q = userSearchQuery.toLowerCase();
    return (
      u.email?.toLowerCase().includes(q) ||
      u.displayName?.toLowerCase().includes(q) ||
      u.phoneNumber?.includes(q)
    );
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Toast Banner */}
      {isToastVisible && (
        <Animated.View
          style={[
            styles.toastContainer,
            { top: Math.max(insets.top, 12), transform: [{ translateY: toastAnim }] },
          ]}
        >
          <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
          <Text style={styles.toastText} numberOfLines={1}>
            {toastText}
          </Text>
        </Animated.View>
      )}

      {/* Admin Top App Header */}
      <View style={styles.topHeaderBar}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.circleBtn, pressed && styles.pressed]}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </Pressable>

        <View style={styles.headerTitleGroup}>
          <Text style={styles.adminPortalHeading}>Admin Management Portal</Text>
          <Text style={styles.adminPortalSub}>GILEO Medicals Platform Control</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(tabs)')}
          style={({ pressed }) => [styles.patientPreviewPillBtn, pressed && styles.pressed]}
        >
          <Ionicons name="eye-outline" size={14} color="#FFFFFF" />
          <Text style={styles.patientPreviewPillText}>Patient App</Text>
        </Pressable>
      </View>

      {/* Navigation Segmented Tab Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScrollRow}
      >
        <Pressable
          onPress={() => setActiveTab('overview')}
          style={[styles.tabPill, activeTab === 'overview' && styles.tabPillActive]}
        >
          <Ionicons
            name="grid-outline"
            size={14}
            color={activeTab === 'overview' ? '#FFFFFF' : '#64748B'}
          />
          <Text style={[styles.tabPillText, activeTab === 'overview' && styles.tabPillTextActive]}>
            Overview
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('orders')}
          style={[styles.tabPill, activeTab === 'orders' && styles.tabPillActive]}
        >
          <Ionicons
            name="bag-handle-outline"
            size={14}
            color={activeTab === 'orders' ? '#FFFFFF' : '#64748B'}
          />
          <Text style={[styles.tabPillText, activeTab === 'orders' && styles.tabPillTextActive]}>
            Orders ({orders.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('services')}
          style={[styles.tabPill, activeTab === 'services' && styles.tabPillActive]}
        >
          <Ionicons
            name="medkit-outline"
            size={14}
            color={activeTab === 'services' ? '#FFFFFF' : '#64748B'}
          />
          <Text style={[styles.tabPillText, activeTab === 'services' && styles.tabPillTextActive]}>
            Care Requests ({serviceRequests.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('products')}
          style={[styles.tabPill, activeTab === 'products' && styles.tabPillActive]}
        >
          <Ionicons
            name="shirt-outline"
            size={14}
            color={activeTab === 'products' ? '#FFFFFF' : '#64748B'}
          />
          <Text style={[styles.tabPillText, activeTab === 'products' && styles.tabPillTextActive]}>
            Products ({products.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('users')}
          style={[styles.tabPill, activeTab === 'users' && styles.tabPillActive]}
        >
          <Ionicons
            name="people-outline"
            size={14}
            color={activeTab === 'users' ? '#FFFFFF' : '#64748B'}
          />
          <Text style={[styles.tabPillText, activeTab === 'users' && styles.tabPillTextActive]}>
            Users ({users.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('learning')}
          style={[styles.tabPill, activeTab === 'learning' && styles.tabPillActive]}
        >
          <Ionicons
            name="school-outline"
            size={14}
            color={activeTab === 'learning' ? '#FFFFFF' : '#64748B'}
          />
          <Text style={[styles.tabPillText, activeTab === 'learning' && styles.tabPillTextActive]}>
            Elevate & Community
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('profile')}
          style={[styles.tabPill, activeTab === 'profile' && styles.tabPillActive]}
        >
          <Ionicons
            name="person-outline"
            size={14}
            color={activeTab === 'profile' ? '#FFFFFF' : '#64748B'}
          />
          <Text style={[styles.tabPillText, activeTab === 'profile' && styles.tabPillTextActive]}>
            Admin Profile
          </Text>
        </Pressable>
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#B81C25" />}
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#B81C25" />
            <Text style={styles.loadingText}>Loading Admin Portal Data...</Text>
          </View>
        ) : (
          <>
            {/* TAB 1: OVERVIEW DASHBOARD */}
            {activeTab === 'overview' && (
              <View style={styles.tabSectionContainer}>
                <View style={styles.metricsGridRow}>
                  <View style={styles.metricCard}>
                    <Ionicons name="cash-outline" size={24} color="#B81C25" />
                    <Text style={styles.metricVal}>
                      {formatKobo(stats.totalRevenueKobo || 0)}
                    </Text>
                    <Text style={styles.metricLbl}>Total Revenue</Text>
                  </View>

                  <View style={styles.metricCard}>
                    <Ionicons name="bag-handle-outline" size={24} color="#059669" />
                    <Text style={styles.metricVal}>{stats.totalOrders || orders.length}</Text>
                    <Text style={styles.metricLbl}>Total Orders</Text>
                  </View>

                  <View style={styles.metricCard}>
                    <Ionicons name="people-outline" size={24} color="#4F46E5" />
                    <Text style={styles.metricVal}>{stats.totalUsers || users.length}</Text>
                    <Text style={styles.metricLbl}>Total Users</Text>
                  </View>

                  <View style={styles.metricCard}>
                    <Ionicons name="medkit-outline" size={24} color="#B45309" />
                    <Text style={styles.metricVal}>
                      {stats.activeServices || serviceRequests.length}
                    </Text>
                    <Text style={styles.metricLbl}>Care Requests</Text>
                  </View>
                </View>

                {/* Connected Interactive Analytics Vector Chart */}
                <View style={styles.chartCardWrapper}>
                  <View style={styles.chartHeaderRow}>
                    <View>
                      <Text style={styles.chartTitle}>Revenue & Platform Growth</Text>
                      <Text style={styles.chartSub}>Weekly Revenue Vector Chart</Text>
                    </View>
                    <View style={styles.chartBadgePill}>
                      <Ionicons name="trending-up" size={14} color="#10B981" />
                      <Text style={styles.chartBadgeText}>+24.8%</Text>
                    </View>
                  </View>

                  <View style={styles.vectorChartContainer}>
                    {[
                      { day: 'Mon', heightPct: 45, value: '₦45k' },
                      { day: 'Tue', heightPct: 65, value: '₦68k' },
                      { day: 'Wed', heightPct: 85, value: '₦92k' },
                      { day: 'Thu', heightPct: 55, value: '₦58k' },
                      { day: 'Fri', heightPct: 100, value: '₦120k' },
                      { day: 'Sat', heightPct: 75, value: '₦84k' },
                      { day: 'Sun', heightPct: 90, value: '₦105k' },
                    ].map((bar, idx) => (
                      <View key={bar.day} style={styles.chartBarCol}>
                        <Text style={styles.barValText}>{bar.value}</Text>
                        <View style={styles.barTrackBackground}>
                          <View
                            style={[
                              styles.barFillActive,
                              {
                                height: `${bar.heightPct}%`,
                                backgroundColor: idx === 4 ? '#F10505' : '#3F0106',
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.barDayText}>{bar.day}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.chartLegendRow}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#F10505' }]} />
                      <Text style={styles.legendText}>Peak Sales (Fri)</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#3F0106' }]} />
                      <Text style={styles.legendText}>Weekly Average</Text>
                    </View>
                  </View>
                </View>

                {/* Quick Management Shortcuts */}
                <View style={styles.adminActionGroup}>
                  <Text style={styles.sectionHeaderTitle}>Quick Management Shortcuts</Text>

                  <View style={styles.actionButtonsRow}>
                    <Pressable style={styles.shortcutBtn} onPress={handleOpenAddProduct}>
                      <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                      <Text style={styles.shortcutBtnText}>Add Product</Text>
                    </Pressable>

                    <Pressable
                      style={[styles.shortcutBtn, { backgroundColor: '#3F0106' }]}
                      onPress={() => setShowAnnouncementModal(true)}
                    >
                      <Ionicons name="megaphone" size={18} color="#FFFFFF" />
                      <Text style={styles.shortcutBtnText}>Publish Announcement</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}

            {/* TAB 2: ORDERS MANAGEMENT (CHOWDECK WORKFLOW) */}
            {activeTab === 'orders' && (
              <View style={styles.tabSectionContainer}>
                {/* Stage Filter Row */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {ORDER_STAGES.map((stg) => (
                    <Pressable
                      key={stg.key}
                      onPress={() => setSelectedOrderStage(stg.key)}
                      style={[
                        styles.stageChipPill,
                        selectedOrderStage === stg.key && styles.stageChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stageChipText,
                          selectedOrderStage === stg.key && styles.stageChipTextActive,
                        ]}
                      >
                        {stg.label}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <View style={styles.cardsList}>
                  {filteredOrders.length === 0 ? (
                    <Text style={styles.emptyText}>No orders match this stage.</Text>
                  ) : (
                    filteredOrders.map((o) => (
                      <View key={o.id} style={styles.adminCard}>
                        <View style={styles.cardHeaderRow}>
                          <Text style={styles.cardRefText}>{o.reference}</Text>
                          <View style={styles.statusPillBadge}>
                            <Text style={styles.statusPillText}>{o.status}</Text>
                          </View>
                        </View>

                        <Text style={styles.customerMetaText}>
                          Customer: {o.shippingAddress?.name || o.user?.displayName || o.user?.email}
                        </Text>
                        <Text style={styles.customerMetaText}>
                          Phone: {o.shippingAddress?.phone || 'N/A'} • Total: {formatKobo(o.totalKobo)}
                        </Text>

                        {/* Chowdeck Stage Buttons */}
                        <View style={styles.chowdeckActionRow}>
                          <Pressable
                            style={styles.chowdeckPillBtn}
                            onPress={() => handleUpdateOrderStatus(o.id, 'PROCESSING')}
                          >
                            <Text style={styles.chowdeckPillText}>Processing</Text>
                          </Pressable>

                          <Pressable
                            style={[styles.chowdeckPillBtn, { backgroundColor: '#3B82F6' }]}
                            onPress={() => handleUpdateOrderStatus(o.id, 'FULFILMENT')}
                          >
                            <Text style={styles.chowdeckPillText}>On The Way</Text>
                          </Pressable>

                          <Pressable
                            style={[styles.chowdeckPillBtn, { backgroundColor: '#10B981' }]}
                            onPress={() => handleUpdateOrderStatus(o.id, 'DELIVERED')}
                          >
                            <Text style={styles.chowdeckPillText}>Delivered</Text>
                          </Pressable>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </View>
            )}

            {/* TAB 3: HEALTHCARE CARE REQUESTS & PROVIDER ASSIGNMENT */}
            {activeTab === 'services' && (
              <View style={styles.tabSectionContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {SERVICE_REQUEST_STAGES.map((stg) => (
                    <Pressable
                      key={stg.key}
                      onPress={() => setSelectedServiceStage(stg.key)}
                      style={[
                        styles.stageChipPill,
                        selectedServiceStage === stg.key && styles.stageChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stageChipText,
                          selectedServiceStage === stg.key && styles.stageChipTextActive,
                        ]}
                      >
                        {stg.label}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <View style={styles.cardsList}>
                  {filteredServices.length === 0 ? (
                    <Text style={styles.emptyText}>No care requests match this stage.</Text>
                  ) : (
                    filteredServices.map((req) => (
                      <View key={req.id} style={styles.adminCard}>
                        <View style={styles.cardHeaderRow}>
                          <Text style={styles.cardRefText}>{req.reference}</Text>
                          <View style={styles.statusPillBadge}>
                            <Text style={styles.statusPillText}>{req.status}</Text>
                          </View>
                        </View>

                        <Text style={styles.cardTitleText}>{req.service?.title}</Text>
                        <Text style={styles.customerMetaText}>
                          Location: {req.location || 'Home Service'}
                        </Text>
                        {req.assignedProvider && (
                          <Text style={styles.assignedNurseText}>
                            Assigned Nurse: {req.assignedProvider.displayName}
                          </Text>
                        )}

                        <View style={styles.chowdeckActionRow}>
                          <Pressable
                            style={styles.chowdeckPillBtn}
                            onPress={() => {
                              setSelectedServiceReq(req);
                              setShowAssignProviderModal(true);
                            }}
                          >
                            <Text style={styles.chowdeckPillText}>Assign Nurse</Text>
                          </Pressable>

                          <Pressable
                            style={[styles.chowdeckPillBtn, { backgroundColor: '#10B981' }]}
                            onPress={() => handleUpdateServiceStatus(req.id, 'COMPLETED')}
                          >
                            <Text style={styles.chowdeckPillText}>Mark Completed</Text>
                          </Pressable>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </View>
            )}

            {/* TAB 4: MARKETPLACE PRODUCTS MANAGEMENT */}
            {activeTab === 'products' && (
              <View style={styles.tabSectionContainer}>
                <Pressable style={styles.primaryActionBtn} onPress={handleOpenAddProduct}>
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryActionBtnText}>Add New Marketplace Product</Text>
                </Pressable>

                <View style={styles.cardsList}>
                  {products.map((p) => (
                    <View key={p.id} style={styles.adminCard}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitleText}>{p.title}</Text>
                        <Text style={styles.productPriceText}>{formatKobo(p.priceKobo)}</Text>
                      </View>

                      <Text style={styles.customerMetaText}>Stock: {p.stock} units</Text>

                      <View style={styles.chowdeckActionRow}>
                        <Pressable style={styles.editOutlineBtn} onPress={() => handleOpenEditProduct(p)}>
                          <Text style={styles.editOutlineBtnText}>Edit Details</Text>
                        </Pressable>

                        <Pressable style={styles.deleteOutlineBtn} onPress={() => handleDeleteProduct(p.id)}>
                          <Text style={styles.deleteOutlineBtnText}>Delete</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* TAB 5: USERS & ROLE MANAGEMENT */}
            {activeTab === 'users' && (
              <View style={styles.tabSectionContainer}>
                <TextInput
                  value={userSearchQuery}
                  onChangeText={setUserSearchQuery}
                  placeholder="Search users by name, email, phone..."
                  placeholderTextColor="#94A3B8"
                  style={styles.searchInput}
                />

                <View style={styles.cardsList}>
                  {filteredUsers.map((u) => (
                    <View key={u.id} style={styles.adminCard}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitleText}>
                          {u.displayName || u.email?.split('@')[0]}
                        </Text>
                        <View
                          style={[
                            styles.roleBadgePill,
                            { backgroundColor: u.role === 'ADMIN' ? '#FDF2F2' : '#F1F5F9' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.roleBadgeText,
                              { color: u.role === 'ADMIN' ? '#B81C25' : '#64748B' },
                            ]}
                          >
                            {u.role}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.customerMetaText}>{u.email}</Text>

                      <View style={styles.chowdeckActionRow}>
                        <Pressable style={styles.editOutlineBtn} onPress={() => handleToggleUserRole(u)}>
                          <Text style={styles.editOutlineBtnText}>
                            {u.role === 'ADMIN' ? 'Demote to Customer' : 'Promote to Admin'}
                          </Text>
                        </Pressable>

                        <Pressable style={styles.deleteOutlineBtn} onPress={() => handleDeleteUser(u.id)}>
                          <Text style={styles.deleteOutlineBtnText}>Delete User</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* TAB 6: ELEVATE COHORTS, E-BOOKS & COMMUNITY */}
            {activeTab === 'learning' && (
              <View style={styles.tabSectionContainer}>
                <Text style={styles.sectionHeaderTitle}>Community Feed Moderation</Text>

                <View style={styles.cardsList}>
                  {communityPosts.map((post) => (
                    <View key={post.id} style={styles.adminCard}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitleText}>{post.authorName}</Text>
                        <Pressable
                          style={styles.deleteOutlineBtn}
                          onPress={() => handleDeletePost(post.id)}
                        >
                          <Text style={styles.deleteOutlineBtnText}>Delete Post</Text>
                        </Pressable>
                      </View>
                      <Text style={styles.customerMetaText}>{post.content}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* TAB 7: ADMIN PROFILE */}
            {activeTab === 'profile' && (
              <View style={styles.tabSectionContainer}>
                <View style={styles.profileHeroCard}>
                  <View style={styles.heroAvatarBox}>
                    <Text style={styles.heroAvatarText}>
                      {(user?.displayName || 'A').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ gap: 2 }}>
                    <Text style={styles.heroName}>{user?.displayName || 'GILEO Administrator'}</Text>
                    <Text style={styles.heroEmail}>{user?.email}</Text>
                    <View style={styles.adminShieldBadge}>
                      <Ionicons name="shield-checkmark" size={14} color="#B81C25" />
                      <Text style={styles.adminShieldText}>Verified Platform Administrator</Text>
                    </View>
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
                  <Text style={styles.logoutBtnText}>Secure Logout</Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* ADD/EDIT PRODUCT MODAL */}
      <Modal visible={showProductModal} animationType="slide" onRequestClose={() => setShowProductModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowProductModal(false)} style={styles.circleBtn}>
              <Ionicons name="close" size={20} color="#0F172A" />
            </Pressable>
            <Text style={styles.modalTitleText}>
              {editingProduct ? 'Edit Marketplace Product' : 'Add New Product'}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
            <Text style={styles.fieldLabel}>Product Title *</Text>
            <TextInput value={prodTitle} onChangeText={setProdTitle} placeholder="Product Title" style={styles.modalInput} />

            <Text style={styles.fieldLabel}>Price (₦ Naira) *</Text>
            <TextInput value={prodPriceNaira} onChangeText={setProdPriceNaira} placeholder="28500" keyboardType="numeric" style={styles.modalInput} />

            <Text style={styles.fieldLabel}>Stock Units *</Text>
            <TextInput value={prodStock} onChangeText={setProdStock} placeholder="10" keyboardType="numeric" style={styles.modalInput} />

            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput value={prodDescription} onChangeText={setProdDescription} placeholder="Product details..." multiline numberOfLines={3} style={[styles.modalInput, { height: 80 }]} />

            <Pressable style={styles.primaryActionBtn} disabled={isSavingProduct} onPress={handleSaveProductSubmit}>
              <Text style={styles.primaryActionBtnText}>{isSavingProduct ? 'Saving...' : 'Save Product'}</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ASSIGN PROVIDER MODAL */}
      <Modal visible={showAssignProviderModal} animationType="slide" onRequestClose={() => setShowAssignProviderModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowAssignProviderModal(false)} style={styles.circleBtn}>
              <Ionicons name="close" size={20} color="#0F172A" />
            </Pressable>
            <Text style={styles.modalTitleText}>Assign Nurse Provider</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
            <Text style={styles.fieldLabel}>Select Registered User ID *</Text>
            <TextInput value={providerUserId} onChangeText={setProviderUserId} placeholder="Enter Nurse User ID" style={styles.modalInput} />

            <Pressable style={styles.primaryActionBtn} disabled={isAssigningProvider} onPress={handleAssignProviderSubmit}>
              <Text style={styles.primaryActionBtnText}>{isAssigningProvider ? 'Assigning...' : 'Confirm Nurse Assignment'}</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ANNOUNCEMENT MODAL */}
      <Modal visible={showAnnouncementModal} animationType="slide" onRequestClose={() => setShowAnnouncementModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowAnnouncementModal(false)} style={styles.circleBtn}>
              <Ionicons name="close" size={20} color="#0F172A" />
            </Pressable>
            <Text style={styles.modalTitleText}>Publish Official Announcement</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
            <Text style={styles.fieldLabel}>Announcement Title *</Text>
            <TextInput value={announcementTitle} onChangeText={setAnnouncementTitle} placeholder="Title" style={styles.modalInput} />

            <Text style={styles.fieldLabel}>Body Content *</Text>
            <TextInput value={announcementBody} onChangeText={setAnnouncementBody} placeholder="Announcement details..." multiline numberOfLines={4} style={[styles.modalInput, { height: 100 }]} />

            <Pressable style={styles.primaryActionBtn} disabled={isPublishingAnnouncement} onPress={handlePublishAnnouncementSubmit}>
              <Text style={styles.primaryActionBtnText}>{isPublishingAnnouncement ? 'Publishing...' : 'Publish Announcement'}</Text>
            </Pressable>
          </ScrollView>
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
  toastContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    height: 48,
    borderRadius: 999,
    backgroundColor: '#B81C25',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    elevation: 6,
  },
  toastText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitleGroup: {
    alignItems: 'center',
  },
  adminPortalHeading: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  adminPortalSub: {
    color: '#64748B',
    fontSize: 11,
  },
  patientPreviewPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#3F0106',
  },
  patientPreviewPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  chartCardWrapper: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    gap: 16,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  chartSub: {
    color: '#64748B',
    fontSize: 12,
  },
  chartBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#ECFDF5',
  },
  chartBadgeText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '800',
  },
  vectorChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
    paddingTop: 16,
    paddingBottom: 4,
  },
  chartBarCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    gap: 6,
  },
  barValText: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
  },
  barTrackBackground: {
    flex: 1,
    width: 14,
    borderRadius: 7,
    backgroundColor: '#F1F5F9',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFillActive: {
    width: '100%',
    borderRadius: 7,
  },
  barDayText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '700',
  },
  chartLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.88,
  },
  tabScrollRow: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 8,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabPillActive: {
    backgroundColor: '#B81C25',
    borderColor: '#B81C25',
  },
  tabPillText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  tabPillTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 96,
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 14,
  },
  tabSectionContainer: {
    gap: 16,
  },
  metricsGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '48%',
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  metricVal: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  metricLbl: {
    color: '#64748B',
    fontSize: 12,
  },
  adminActionGroup: {
    gap: 12,
  },
  sectionHeaderTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  shortcutBtn: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    backgroundColor: '#B81C25',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shortcutBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  stageChipPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stageChipActive: {
    backgroundColor: '#B81C25',
    borderColor: '#B81C25',
  },
  stageChipText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  stageChipTextActive: {
    color: '#FFFFFF',
  },
  cardsList: {
    gap: 12,
  },
  adminCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardRefText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  cardTitleText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  productPriceText: {
    color: '#B81C25',
    fontSize: 14,
    fontWeight: '800',
  },
  statusPillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#FDF2F2',
  },
  statusPillText: {
    color: '#B81C25',
    fontSize: 10,
    fontWeight: '800',
  },
  customerMetaText: {
    color: '#64748B',
    fontSize: 12,
  },
  assignedNurseText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
  },
  chowdeckActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  chowdeckPillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#B81C25',
  },
  chowdeckPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  editOutlineBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  editOutlineBtnText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '700',
  },
  deleteOutlineBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FECDD3',
    backgroundColor: '#FFF1F2',
  },
  deleteOutlineBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  searchInput: {
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    color: '#0F172A',
    fontSize: 14,
  },
  roleBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 20,
  },
  profileHeroCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroAvatarBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#B81C25',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  heroName: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  heroEmail: {
    color: '#64748B',
    fontSize: 12,
  },
  adminShieldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  adminShieldText: {
    color: '#B81C25',
    fontSize: 11,
    fontWeight: '700',
  },
  logoutBtn: {
    height: 50,
    borderRadius: 999,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '800',
  },
  primaryActionBtn: {
    height: 50,
    borderRadius: 999,
    backgroundColor: '#B81C25',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitleText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  fieldLabel: {
    color: '#0F172A',
    fontSize: 13,
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
});
