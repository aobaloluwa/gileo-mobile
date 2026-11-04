import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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
import { AdminOrdersSkeleton } from './AdminOrdersSkeleton';
import { apiRequest, uploadImageApi } from '../../services/api';
import { formatKobo } from '../../theme/colors';

type OrderItem = {
  id?: string;
  titleSnapshot: string;
  quantity: number;
  unitPriceKobo: number;
  lineTotalKobo?: number;
};

type AdminOrder = {
  id: string;
  reference: string;
  status: string;
  totalKobo: number;
  subtotalKobo?: number;
  deliveryKobo?: number;
  createdAt: string;
  user?: { id: string; displayName?: string; email?: string; phoneNumber?: string };
  shippingAddress?: { name?: string; phone?: string; address?: string };
  items: OrderItem[];
  proofImages?: string[];
};

type StageFilter =
  | 'ALL'
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'FULFILMENT'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

const STAGES: { key: StageFilter; label: string }[] = [
  { key: 'ALL', label: 'All Orders' },
  { key: 'PAID', label: 'Paid' },
  { key: 'PROCESSING', label: 'Processing' },
  { key: 'FULFILMENT', label: 'On The Way' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'PENDING_PAYMENT', label: 'Pending' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

function getStatusTheme(status: string) {
  switch (status) {
    case 'PAID':
      return { bg: '#EFF6FF', border: '#BFDBFE', text: '#2563EB', label: 'Paid' };
    case 'PROCESSING':
      return { bg: '#EEF2FF', border: '#C7D2FE', text: '#4F46E5', label: 'Processing' };
    case 'FULFILMENT':
      return { bg: '#F0FDF4', border: '#BBF7D0', text: '#16A34A', label: 'On The Way' };
    case 'SHIPPED':
      return { bg: '#ECFDF5', border: '#A7F3D0', text: '#059669', label: 'Shipped' };
    case 'DELIVERED':
      return { bg: '#F0FDF4', border: '#86EFAC', text: '#15803D', label: 'Delivered' };
    case 'PENDING_PAYMENT':
      return { bg: '#FFFBEB', border: '#FDE68A', text: '#D97706', label: 'Pending Payment' };
    case 'CANCELLED':
    case 'REFUNDED':
      return { bg: '#FEF2F2', border: '#FECDD3', text: '#EF4444', label: status };
    default:
      return { bg: '#F8FAFC', border: '#E2E8F0', text: '#64748B', label: status };
  }
}

export function AdminOrdersView() {
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [selectedStage, setSelectedStage] = useState<StageFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toastText, setToastText] = useState('');

  // Selected Order Details & Proof Upload Modal State
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [proofsMap, setProofsMap] = useState<Record<string, string[]>>({});
  const [isUploadingProof, setIsUploadingProof] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<AdminOrder[]>('/shop/orders');
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadOrders();
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

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      await apiRequest<any>(`/shop/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)),
      );
      if (selectedOrder?.id === id) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      showToast(`Order status updated to ${newStatus}`);
    } catch (err: any) {
      showToast(err?.message || 'Could not update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Proof of Delivery Image Picker
  const handleUploadProofOfDelivery = async (orderId: string, source: 'gallery' | 'camera') => {
    try {
      let result: ImagePicker.ImagePickerResult;
      if (source === 'gallery') {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission Required', 'Library permission is needed to upload delivery proofs.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsMultipleSelection: true,
          quality: 0.85,
        });
      } else {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission Required', 'Camera permission is needed to take proof photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsUploadingProof(true);
        showToast('Uploading delivery proof...');

        const uploadedUrls: string[] = [];
        for (const asset of result.assets) {
          try {
            const uploaded = await uploadImageApi(asset.uri);
            uploadedUrls.push(uploaded?.url || asset.uri);
          } catch {
            uploadedUrls.push(asset.uri);
          }
        }

        setProofsMap((prev) => ({
          ...prev,
          [orderId]: [...(prev[orderId] || []), ...uploadedUrls],
        }));
        showToast('Delivery proof image attached!');
      }
    } catch (err: any) {
      showToast(`Upload failed: ${err?.message || 'Could not attach image'}`);
    } finally {
      setIsUploadingProof(false);
    }
  };

  const handleRemoveProof = (orderId: string, index: number) => {
    setProofsMap((prev) => ({
      ...prev,
      [orderId]: (prev[orderId] || []).filter((_, i) => i !== index),
    }));
    showToast('Delivery proof removed');
  };

  const handleOpenDetails = (order: AdminOrder) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  // Calculate Metrics
  const totalOrdersCount = orders.length;
  const activeOrdersCount = orders.filter((o) =>
    ['PAID', 'PROCESSING', 'FULFILMENT', 'SHIPPED'].includes(o.status),
  ).length;
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;
  const totalRevenueKobo = orders
    .filter((o) => o.status !== 'CANCELLED' && o.status !== 'PENDING_PAYMENT')
    .reduce((acc, o) => acc + (o.totalKobo || 0), 0);

  // Filter Orders
  const filteredOrders = orders.filter((o) => {
    const query = searchQuery.toLowerCase().trim();
    const recipientName =
      o.shippingAddress?.name || o.user?.displayName || o.user?.email || '';
    const recipientPhone = o.shippingAddress?.phone || o.user?.phoneNumber || '';
    const recipientAddress = o.shippingAddress?.address || '';
    const itemsMatch = o.items?.some((it) =>
      it.titleSnapshot?.toLowerCase().includes(query),
    );

    const matchesQuery =
      !query ||
      o.reference?.toLowerCase().includes(query) ||
      recipientName.toLowerCase().includes(query) ||
      recipientPhone.toLowerCase().includes(query) ||
      recipientAddress.toLowerCase().includes(query) ||
      itemsMatch;

    if (!matchesQuery) return false;

    if (selectedStage === 'ALL') return true;
    return o.status === selectedStage;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Toast Notification Banner */}
      {toastText.length > 0 && (
        <View style={styles.toastBanner}>
          <Ionicons name="information-circle" size={16} color="#FFFFFF" />
          <Text style={styles.toastBannerText} numberOfLines={1}>
            {toastText}
          </Text>
          <Pressable onPress={() => setToastText('')} hitSlop={8}>
            <Ionicons name="close" size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      )}

      {/* Screen Top Header - Fully Responsive */}
      <View style={styles.topHeader}>
        <View style={styles.topHeaderTitleBox}>
          <Text style={styles.headerSub} numberOfLines={1}>
            Fulfilment & Store Orders
          </Text>
          <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            Orders Management
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.headerRefreshBtn, pressed && styles.pressed]}
          onPress={loadOrders}
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
        {/* Metric Cards Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: '#FDF2F2' }]}>
              <Ionicons name="receipt" size={16} color="#F10505" />
            </View>
            <View style={styles.metricCardTextContent}>
              <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
                {totalOrdersCount}
              </Text>
              <Text style={styles.metricLabel} numberOfLines={1}>
                Total Orders
              </Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="time" size={16} color="#4F46E5" />
            </View>
            <View style={styles.metricCardTextContent}>
              <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
                {activeOrdersCount}
              </Text>
              <Text style={styles.metricLabel} numberOfLines={1}>
                Active
              </Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="checkmark-done" size={16} color="#10B981" />
            </View>
            <View style={styles.metricCardTextContent}>
              <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
                {deliveredCount}
              </Text>
              <Text style={styles.metricLabel} numberOfLines={1}>
                Delivered
              </Text>
            </View>
          </View>
        </View>

        {/* Revenue Banner */}
        <View style={styles.revenueBanner}>
          <View style={styles.revenueBannerLeft}>
            <Ionicons name="cash-outline" size={18} color="#3F0106" />
            <Text style={styles.revenueBannerTitle} numberOfLines={1}>
              Total Orders Revenue
            </Text>
          </View>
          <Text style={styles.revenueBannerAmount} numberOfLines={1}>
            {formatKobo(totalRevenueKobo)}
          </Text>
        </View>

        {/* Search Input Bar */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={18} color="#64748B" style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by ref, customer name, phone, address..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </Pressable>
          )}
        </View>

        {/* Horizontal Stage Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsRow}
        >
          {STAGES.map((stg) => {
            const isActive = selectedStage === stg.key;
            return (
              <Pressable
                key={stg.key}
                onPress={() => setSelectedStage(stg.key)}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {stg.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Orders Content Area */}
        {loading ? (
          <AdminOrdersSkeleton />
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="receipt-outline" size={36} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>No Orders Found</Text>
            <Text style={styles.emptySub}>
              {searchQuery
                ? `No orders matched "${searchQuery}"`
                : 'There are no orders matching this stage filter.'}
            </Text>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {filteredOrders.map((o) => {
              const theme = getStatusTheme(o.status);
              const recipientName =
                o.shippingAddress?.name || o.user?.displayName || o.user?.email || 'Valued Customer';
              const recipientPhone = o.shippingAddress?.phone || 'No phone provided';
              const recipientAddress = o.shippingAddress?.address || 'Pickup / Standard Delivery';
              const attachedProofs = proofsMap[o.id] || [];

              return (
                <View key={o.id} style={styles.orderCard}>
                  {/* Card Top Row: Ref & Status Badge */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.refBox}>
                      <Ionicons name="pricetag" size={14} color="#F10505" />
                      <Text style={styles.cardRefText} numberOfLines={1}>
                        {o.reference}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: theme.bg, borderColor: theme.border },
                      ]}
                    >
                      <Text style={[styles.statusBadgeText, { color: theme.text }]} numberOfLines={1}>
                        {theme.label}
                      </Text>
                    </View>
                  </View>

                  {/* Customer / Recipient Info */}
                  <View style={styles.customerBlock}>
                    <Text style={styles.customerNameText} numberOfLines={1}>
                      {recipientName}
                    </Text>
                    <View style={styles.metaRow}>
                      <Ionicons name="call-outline" size={12} color="#64748B" />
                      <Text style={styles.metaText} numberOfLines={1}>
                        {recipientPhone}
                      </Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Ionicons name="location-outline" size={12} color="#64748B" />
                      <Text style={styles.metaText} numberOfLines={1}>
                        {recipientAddress}
                      </Text>
                    </View>
                  </View>

                  {/* Purchased Items Box */}
                  <View style={styles.itemsContainer}>
                    <Text style={styles.itemsBoxHeader}>Order Line Items ({o.items?.length || 0})</Text>
                    {o.items?.map((it, idx) => (
                      <View key={idx} style={styles.itemRow}>
                        <Text style={styles.itemTitleText} numberOfLines={1}>
                          • {it.quantity}x {it.titleSnapshot}
                        </Text>
                        <Text style={styles.itemPriceText}>
                          {formatKobo(it.unitPriceKobo * it.quantity)}
                        </Text>
                      </View>
                    ))}
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Grand Total</Text>
                      <Text style={styles.totalAmount}>{formatKobo(o.totalKobo)}</Text>
                    </View>
                  </View>

                  {/* Proof Thumbnails preview if attached */}
                  {attachedProofs.length > 0 && (
                    <View style={styles.proofsPreviewRow}>
                      <Ionicons name="attach" size={14} color="#059669" />
                      <Text style={styles.proofsPreviewText}>
                        {attachedProofs.length} delivery proof(s) attached
                      </Text>
                    </View>
                  )}

                  {/* Action Bar */}
                  <View style={styles.cardActionsRow}>
                    <Pressable
                      style={({ pressed }) => [styles.detailsBtn, pressed && styles.pressed]}
                      onPress={() => handleOpenDetails(o)}
                    >
                      <Ionicons name="eye-outline" size={15} color="#0F172A" />
                      <Text style={styles.detailsBtnText} numberOfLines={1}>
                        View Details & Proofs
                      </Text>
                    </Pressable>

                    {/* Quick Progression Buttons */}
                    {updatingId === o.id ? (
                      <ActivityIndicator size="small" color="#F10505" style={{ paddingHorizontal: 12 }} />
                    ) : o.status === 'PAID' ? (
                      <Pressable
                        style={({ pressed }) => [styles.quickActionBtn, { backgroundColor: '#4F46E5' }, pressed && styles.pressed]}
                        onPress={() => handleUpdateStatus(o.id, 'PROCESSING')}
                      >
                        <Text style={styles.quickActionBtnText} numberOfLines={1}>
                          Process Order
                        </Text>
                      </Pressable>
                    ) : o.status === 'PROCESSING' ? (
                      <Pressable
                        style={({ pressed }) => [styles.quickActionBtn, { backgroundColor: '#2563EB' }, pressed && styles.pressed]}
                        onPress={() => handleUpdateStatus(o.id, 'FULFILMENT')}
                      >
                        <Text style={styles.quickActionBtnText} numberOfLines={1}>
                          Mark On The Way
                        </Text>
                      </Pressable>
                    ) : o.status === 'FULFILMENT' || o.status === 'SHIPPED' ? (
                      <Pressable
                        style={({ pressed }) => [styles.quickActionBtn, { backgroundColor: '#10B981' }, pressed && styles.pressed]}
                        onPress={() => handleUpdateStatus(o.id, 'DELIVERED')}
                      >
                        <Text style={styles.quickActionBtnText} numberOfLines={1}>
                          Mark Delivered
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Order Details & Proofs Upload Modal - Fully Safe Area Guarded */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={['top', 'bottom', 'left', 'right']}>
          {/* Modal Top Nav Header */}
          <View style={[styles.modalHeader, { paddingTop: Platform.OS === 'ios' ? Math.max(insets.top, 16) : 12 }]}>
            <Pressable
              onPress={() => setShowDetailsModal(false)}
              style={styles.modalCloseCircle}
              hitSlop={12}
            >
              <Ionicons name="close" size={20} color="#0F172A" />
            </Pressable>
            <Text style={styles.modalHeaderTitle} numberOfLines={1}>
              Order #{selectedOrder?.reference}
            </Text>
            <View style={{ width: 36 }} />
          </View>

          {selectedOrder && (
            <ScrollView
              contentContainerStyle={[
                styles.modalScrollContent,
                { paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom + 20, 40) : 24 },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {/* Order Status Summary */}
              <View style={styles.modalStatusBanner}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalStatusSub}>Current Status</Text>
                  <Text style={styles.modalStatusTitle}>{selectedOrder.status}</Text>
                </View>
                <Text style={styles.modalTotalText}>{formatKobo(selectedOrder.totalKobo)}</Text>
              </View>

              {/* Customer & Address Details */}
              <View style={styles.modalSectionCard}>
                <Text style={styles.modalSectionTitle}>Delivery Recipient</Text>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Name:</Text>
                  <Text style={styles.modalDetailValue}>
                    {selectedOrder.shippingAddress?.name ||
                      selectedOrder.user?.displayName ||
                      selectedOrder.user?.email}
                  </Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Phone:</Text>
                  <Text style={styles.modalDetailValue}>
                    {selectedOrder.shippingAddress?.phone || selectedOrder.user?.phoneNumber || 'N/A'}
                  </Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Address:</Text>
                  <Text style={[styles.modalDetailValue, { flex: 1 }]}>
                    {selectedOrder.shippingAddress?.address || 'Pickup / Store Standard'}
                  </Text>
                </View>
              </View>

              {/* Order Items List */}
              <View style={styles.modalSectionCard}>
                <Text style={styles.modalSectionTitle}>Items Ordered</Text>
                {selectedOrder.items?.map((it, idx) => (
                  <View key={idx} style={styles.modalItemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalItemName}>{it.titleSnapshot}</Text>
                      <Text style={styles.modalItemSub}>
                        Qty: {it.quantity} × {formatKobo(it.unitPriceKobo)}
                      </Text>
                    </View>
                    <Text style={styles.modalItemLineTotal}>
                      {formatKobo(it.unitPriceKobo * it.quantity)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Proof of Delivery / Attachment Uploads Section */}
              <View style={styles.modalSectionCard}>
                <Text style={styles.modalSectionTitle}>Delivery Proof & Receipts</Text>
                <Text style={styles.fieldSubLabel}>
                  Upload courier waybill, signed delivery receipt, or package photos from device gallery or camera.
                </Text>

                {/* Upload Action Buttons */}
                <View style={styles.uploadCardsRow}>
                  <Pressable
                    style={({ pressed }) => [styles.uploadCard, pressed && styles.pressed]}
                    disabled={isUploadingProof}
                    onPress={() => handleUploadProofOfDelivery(selectedOrder.id, 'gallery')}
                  >
                    <Ionicons name="images" size={20} color="#F10505" />
                    <Text style={styles.uploadCardTitle} numberOfLines={1}>
                      Phone Gallery
                    </Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [styles.uploadCard, pressed && styles.pressed]}
                    disabled={isUploadingProof}
                    onPress={() => handleUploadProofOfDelivery(selectedOrder.id, 'camera')}
                  >
                    <Ionicons name="camera" size={20} color="#10B981" />
                    <Text style={styles.uploadCardTitle} numberOfLines={1}>
                      Take Photo
                    </Text>
                  </Pressable>
                </View>

                {isUploadingProof && (
                  <View style={styles.uploadingBox}>
                    <ActivityIndicator size="small" color="#F10505" />
                    <Text style={styles.uploadingText}>Uploading proof photo...</Text>
                  </View>
                )}

                {/* Attached Proof Photos Grid */}
                {(proofsMap[selectedOrder.id] || []).length > 0 && (
                  <View style={styles.proofsGrid}>
                    {(proofsMap[selectedOrder.id] || []).map((uri, idx) => (
                      <View key={idx} style={styles.proofThumbWrapper}>
                        <Image source={{ uri }} style={styles.proofImage} resizeMode="cover" />
                        <Pressable
                          style={styles.proofRemoveBtn}
                          onPress={() => handleRemoveProof(selectedOrder.id, idx)}
                          hitSlop={8}
                        >
                          <Ionicons name="close-circle" size={18} color="#EF4444" />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Transition Actions */}
              <View style={styles.modalSectionCard}>
                <Text style={styles.modalSectionTitle}>Update Order Workflow</Text>
                <View style={styles.modalStatusButtonsRow}>
                  <Pressable
                    style={[styles.statusBtn, selectedOrder.status === 'PROCESSING' && styles.statusBtnActive]}
                    onPress={() => handleUpdateStatus(selectedOrder.id, 'PROCESSING')}
                  >
                    <Text style={[styles.statusBtnText, selectedOrder.status === 'PROCESSING' && styles.statusBtnTextActive]}>
                      Processing
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.statusBtn, selectedOrder.status === 'FULFILMENT' && styles.statusBtnActive]}
                    onPress={() => handleUpdateStatus(selectedOrder.id, 'FULFILMENT')}
                  >
                    <Text style={[styles.statusBtnText, selectedOrder.status === 'FULFILMENT' && styles.statusBtnTextActive]}>
                      On The Way
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.statusBtn, selectedOrder.status === 'DELIVERED' && styles.statusBtnActiveGreen]}
                    onPress={() => handleUpdateStatus(selectedOrder.id, 'DELIVERED')}
                  >
                    <Text style={[styles.statusBtnText, selectedOrder.status === 'DELIVERED' && styles.statusBtnTextActive]}>
                      Delivered
                    </Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          )}
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
  revenueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  revenueBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  revenueBannerTitle: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  revenueBannerAmount: {
    color: '#F10505',
    fontSize: 14,
    fontWeight: '800',
    flexShrink: 0,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#3F0106',
    borderColor: '#3F0106',
  },
  filterChipText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  emptySub: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 260,
  },
  ordersList: {
    gap: 14,
  },
  orderCard: {
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  refBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  cardRefText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    flexShrink: 0,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  customerBlock: {
    gap: 3,
  },
  customerNameText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: '#64748B',
    fontSize: 12,
    flex: 1,
  },
  itemsContainer: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 6,
  },
  itemsBoxHeader: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemTitleText: {
    color: '#334155',
    fontSize: 12,
    flex: 1,
  },
  itemPriceText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 4,
  },
  totalLabel: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
  totalAmount: {
    color: '#F10505',
    fontSize: 14,
    fontWeight: '800',
  },
  proofsPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  proofsPreviewText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
  },
  detailsBtn: {
    flex: 1,
    height: 38,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
  },
  detailsBtnText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
  quickActionBtn: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  /* Modal Styles */
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
  modalScrollContent: {
    padding: 18,
    gap: 16,
  },
  modalStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3F0106',
    padding: 16,
    borderRadius: 18,
  },
  modalStatusSub: {
    color: '#F8FAFC',
    fontSize: 11,
    opacity: 0.8,
  },
  modalStatusTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  modalTotalText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  modalSectionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  modalSectionTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  modalDetailRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modalDetailLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    width: 65,
  },
  modalDetailValue: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  modalItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  modalItemName: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  modalItemSub: {
    color: '#64748B',
    fontSize: 11,
  },
  modalItemLineTotal: {
    color: '#F10505',
    fontSize: 13,
    fontWeight: '800',
  },
  fieldSubLabel: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 15,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
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
    color: '#F10505',
    fontSize: 12,
    fontWeight: '600',
  },
  proofsGrid: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 6,
  },
  proofThumbWrapper: {
    position: 'relative',
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  proofImage: {
    width: '100%',
    height: '100%',
  },
  proofRemoveBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  modalStatusButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBtnActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  statusBtnActiveGreen: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  statusBtnText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '700',
  },
  statusBtnTextActive: {
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.85,
  },
});
