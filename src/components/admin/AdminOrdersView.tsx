import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiRequest } from '../../services/api';
import { formatKobo } from '../../theme/colors';

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

const STAGES = [
  { key: 'ALL', label: 'All Orders' },
  { key: 'PENDING_PAYMENT', label: 'Pending' },
  { key: 'PAID', label: 'Paid' },
  { key: 'PROCESSING', label: 'Processing' },
  { key: 'FULFILMENT', label: 'On The Way' },
  { key: 'DELIVERED', label: 'Delivered' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

export function AdminOrdersView() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastText, setToastText] = useState('');

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

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await apiRequest<any>(`/shop/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)),
      );
      setToastText(`Order updated to ${newStatus}`);
    } catch (err: any) {
      setToastText(err?.message || 'Could not update order status.');
    }
  };

  const filtered = orders.filter(
    (o) => selectedStage === 'ALL' || o.status === selectedStage,
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.topHeader}>
        <Text style={styles.headerSub}>Chowdeck Workflow</Text>
        <Text style={styles.headerTitle}>Orders & Fulfilment</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F10505" />}
      >
        {/* Stage Filter Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
          {STAGES.map((stg) => (
            <Pressable
              key={stg.key}
              onPress={() => setSelectedStage(stg.key)}
              style={[styles.stageChip, selectedStage === stg.key && styles.stageChipActive]}
            >
              <Text style={[styles.stageChipText, selectedStage === stg.key && styles.stageChipTextActive]}>
                {stg.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#F10505" />
            <Text style={styles.loadingText}>Loading orders...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <Text style={styles.emptyText}>No orders match this stage.</Text>
        ) : (
          <View style={{ gap: 12 }}>
            {filtered.map((o) => (
              <View key={o.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardRef}>{o.reference}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{o.status}</Text>
                  </View>
                </View>

                <Text style={styles.customerText}>
                  Recipient: {o.shippingAddress?.name || o.user?.displayName || o.user?.email}
                </Text>
                <Text style={styles.metaText}>Phone: {o.shippingAddress?.phone || 'N/A'}</Text>
                <Text style={styles.metaText}>Address: {o.shippingAddress?.address || 'N/A'}</Text>

                <View style={styles.itemsBox}>
                  {o.items?.map((it, idx) => (
                    <Text key={idx} style={styles.itemText}>
                      • {it.quantity}x {it.titleSnapshot} ({formatKobo(it.unitPriceKobo)})
                    </Text>
                  ))}
                  <Text style={styles.totalPrice}>Total: {formatKobo(o.totalKobo)}</Text>
                </View>

                {/* Chowdeck Status Action Buttons */}
                {o.status === 'CANCELLED' || o.status === 'REFUNDED' ? (
                  <View style={styles.disabledActionBadge}>
                    <Ionicons name="close-circle-outline" size={14} color="#EF4444" />
                    <Text style={styles.disabledActionText}>Order Cancelled / Closed (No Actions Allowed)</Text>
                  </View>
                ) : o.status === 'PENDING_PAYMENT' ? (
                  <View style={[styles.disabledActionBadge, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                    <Ionicons name="time-outline" size={14} color="#B45309" />
                    <Text style={[styles.disabledActionText, { color: '#B45309' }]}>Pending Payment (Awaiting Verification)</Text>
                  </View>
                ) : (
                  <View style={styles.actionRow}>
                    <Pressable style={styles.chowdeckPill} onPress={() => handleUpdateStatus(o.id, 'PROCESSING')}>
                      <Text style={styles.chowdeckPillText}>Processing</Text>
                    </Pressable>

                    <Pressable style={[styles.chowdeckPill, { backgroundColor: '#3B82F6' }]} onPress={() => handleUpdateStatus(o.id, 'FULFILMENT')}>
                      <Text style={styles.chowdeckPillText}>On The Way</Text>
                    </Pressable>

                    <Pressable style={[styles.chowdeckPill, { backgroundColor: '#10B981' }]} onPress={() => handleUpdateStatus(o.id, 'DELIVERED')}>
                      <Text style={styles.chowdeckPillText}>Delivered</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
  },
  stageChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stageChipActive: {
    backgroundColor: '#F10505',
    borderColor: '#F10505',
  },
  stageChipText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  stageChipTextActive: {
    color: '#FFFFFF',
  },
  card: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardRef: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#FDF2F2',
  },
  badgeText: {
    color: '#F10505',
    fontSize: 10,
    fontWeight: '800',
  },
  customerText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  metaText: {
    color: '#64748B',
    fontSize: 12,
  },
  itemsBox: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    gap: 4,
    marginTop: 4,
  },
  itemText: {
    color: '#334155',
    fontSize: 12,
  },
  totalPrice: {
    color: '#F10505',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  chowdeckPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F10505',
  },
  chowdeckPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  disabledActionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    marginTop: 4,
  },
  disabledActionText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 13,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 30,
  },
});
