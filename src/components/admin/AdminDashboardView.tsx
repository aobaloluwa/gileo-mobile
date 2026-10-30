import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdminChartJS } from '../AdminChartJS';
import { apiRequest } from '../../services/api';
import { AuthUser, getStoredUser } from '../../services/auth';
import { formatKobo, formatNaira } from '../../theme/colors';

type AdminDashboardStats = {
  totalUsers?: number;
  totalOrders?: number;
  totalRevenueKobo?: number;
  activeServices?: number;
  openTickets?: number;
};

type RecentOrder = {
  id: string;
  reference: string;
  customerName: string;
  dateStr: string;
  totalKobo: number;
  status: string;
};

type StockAlert = {
  id: string;
  title: string;
  stockLeft: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

const mockStockAlerts: StockAlert[] = [
  { id: '1', title: 'Gileo Dri-FIT Premium Scrubs', stockLeft: 12, icon: 'shirt-outline', color: '#F10505' },
  { id: '2', title: 'Clinical Dual-Head Stethoscope', stockLeft: 18, icon: 'fitness-outline', color: '#B45309' },
  { id: '3', title: 'Digital Automatic BP Monitor', stockLeft: 25, icon: 'pulse-outline', color: '#4F46E5' },
];

const mockRecentOrders: RecentOrder[] = [
  { id: 'o-1045', reference: '#ORD-1045', customerName: 'Emma Johnson', dateStr: 'Jun 11, 2026', totalKobo: 1299900, status: 'DELIVERED' },
  { id: 'o-1044', reference: '#ORD-1044', customerName: 'Liam Williams', dateStr: 'Jun 11, 2026', totalKobo: 890000, status: 'PROCESSING' },
  { id: 'o-1043', reference: '#ORD-1043', customerName: 'Sophia Brown', dateStr: 'Jun 10, 2026', totalKobo: 599900, status: 'FULFILMENT' },
  { id: 'o-1042', reference: '#ORD-1042', customerName: 'Noah Davis', dateStr: 'Jun 10, 2026', totalKobo: 1990000, status: 'DELIVERED' },
];

const mockTopProducts = [
  { id: 'p-1', title: 'Dri-FIT Scrubs Set', sold: '1,245 sold', revenue: '₦28,420,000', icon: 'shirt-outline' as const, color: '#F10505' },
  { id: 'p-2', title: 'Dual-Head Stethoscope', sold: '982 sold', revenue: '₦19,640,000', icon: 'fitness-outline' as const, color: '#059669' },
  { id: 'p-3', title: 'Automatic BP Monitor', sold: '876 sold', revenue: '₦17,520,000', icon: 'pulse-outline' as const, color: '#4F46E5' },
];

export function AdminDashboardView() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [stats, setStats] = useState<AdminDashboardStats>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timePeriod, setTimePeriod] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');

  const loadData = async () => {
    setLoading(true);
    try {
      const u = await getStoredUser();
      setUser(u);

      const dashboardStats = await apiRequest<AdminDashboardStats>('/admin/dashboard').catch(() => ({}));
      setStats(dashboardStats || {});
    } catch {
      setStats({});
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

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return { bg: '#ECFDF5', text: '#059669', label: 'Delivered' };
      case 'PROCESSING':
        return { bg: '#EFF6FF', text: '#3B82F6', label: 'Processing' };
      case 'FULFILMENT':
        return { bg: '#F0F9FF', text: '#0284C7', label: 'On The Way' };
      case 'CANCELLED':
        return { bg: '#FEF2F2', text: '#EF4444', label: 'Cancelled' };
      default:
        return { bg: '#FEF3C7', text: '#B45309', label: status };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header Bar */}
      <View style={styles.topHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSubTitle}>Overview</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Gileo Operations
          </Text>
        </View>

        <View style={styles.headerRightActions}>
          <View style={styles.dateRangePill}>
            <Ionicons name="calendar-outline" size={14} color="#64748B" />
            <Text style={styles.dateRangeText}>May 12 – Jun 11, 2026</Text>
          </View>

          <Pressable
            style={styles.notifBtn}
            onPress={() => router.push('/notifications')}
          >
            <Ionicons name="notifications-outline" size={18} color="#0F172A" />
            <View style={styles.notifDot} />
          </Pressable>

          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {(user?.displayName || 'O').charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F10505" />}
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#F10505" />
            <Text style={styles.loadingText}>Loading Gileo Analytics Dashboard...</Text>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {/* TOP METRIC CARDS ROW (4 CARDS GRID) */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <View style={styles.metricHeaderRow}>
                  <Text style={styles.metricLabel}>Total Revenue</Text>
                  <View style={[styles.iconCircle, { backgroundColor: '#FDF2F2' }]}>
                    <Ionicons name="cash-outline" size={18} color="#F10505" />
                  </View>
                </View>
                <Text style={styles.metricValue}>
                  {formatKobo(stats.totalRevenueKobo || 12843000)}
                </Text>
                <View style={styles.growthBadgeRow}>
                  <Ionicons name="arrow-up" size={12} color="#059669" />
                  <Text style={styles.growthText}>+18.6% vs last month</Text>
                </View>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricHeaderRow}>
                  <Text style={styles.metricLabel}>Total Orders</Text>
                  <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="bag-handle-outline" size={18} color="#3B82F6" />
                  </View>
                </View>
                <Text style={styles.metricValue}>{stats.totalOrders || 1245}</Text>
                <View style={styles.growthBadgeRow}>
                  <Ionicons name="arrow-up" size={12} color="#059669" />
                  <Text style={styles.growthText}>+12.4% vs last month</Text>
                </View>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricHeaderRow}>
                  <Text style={styles.metricLabel}>Total Customers</Text>
                  <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
                    <Ionicons name="people-outline" size={18} color="#059669" />
                  </View>
                </View>
                <Text style={styles.metricValue}>{stats.totalUsers || 8426}</Text>
                <View style={styles.growthBadgeRow}>
                  <Ionicons name="arrow-up" size={12} color="#059669" />
                  <Text style={styles.growthText}>+9.2% new users</Text>
                </View>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricHeaderRow}>
                  <Text style={styles.metricLabel}>Conversion Rate</Text>
                  <View style={[styles.iconCircle, { backgroundColor: '#F3E8FF' }]}>
                    <Ionicons name="stats-chart-outline" size={18} color="#9333EA" />
                  </View>
                </View>
                <Text style={styles.metricValue}>3.42%</Text>
                <View style={styles.growthBadgeRow}>
                  <Ionicons name="arrow-up" size={12} color="#059669" />
                  <Text style={styles.growthText}>+6.7% efficiency</Text>
                </View>
              </View>
            </View>

            {/* MIDDLE ROW: SALES OVERVIEW LINE CHART & INVENTORY ALERTS */}
            <View style={styles.middleRowCard}>
              <View style={styles.chartHeaderRow}>
                <View>
                  <Text style={styles.cardSectionTitle}>Sales Overview</Text>
                  <View style={styles.chartSubRow}>
                    <Text style={styles.chartMainVal}>
                      {formatKobo(stats.totalRevenueKobo || 12843000)}
                    </Text>
                    <View style={styles.chartPillGrowth}>
                      <Ionicons name="arrow-up" size={12} color="#059669" />
                      <Text style={styles.chartPillGrowthText}>18.6% vs previous period</Text>
                    </View>
                  </View>
                </View>

                {/* Daily/Weekly Filter Switcher */}
                <View style={styles.periodSwitcherPill}>
                  {(['Daily', 'Weekly', 'Monthly'] as const).map((p) => (
                    <Pressable
                      key={p}
                      onPress={() => setTimePeriod(p)}
                      style={[styles.periodBtn, timePeriod === p && styles.periodBtnActive]}
                    >
                      <Text style={[styles.periodBtnText, timePeriod === p && styles.periodBtnTextActive]}>
                        {p}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Chart.js Embedded Vector Line Chart */}
              <AdminChartJS
                type="line"
                labels={['May 12', 'May 19', 'May 26', 'Jun 2', 'Jun 8', 'Jun 11']}
                dataPoints={[45000, 68000, 92000, 58000, 120000, 105000]}
                chartTitle="Revenue (₦)"
                height={210}
              />
            </View>

            {/* INVENTORY STOCK ALERTS CARD */}
            <View style={styles.cardSection}>
              <View style={styles.cardSectionHeader}>
                <Text style={styles.cardSectionTitle}>Inventory Alerts</Text>
                <Pressable onPress={() => router.push('/(tabs)/marketplace')}>
                  <Text style={styles.seeAllText}>View all alerts ›</Text>
                </Pressable>
              </View>

              <View style={{ gap: 10 }}>
                {mockStockAlerts.map((item) => (
                  <View key={item.id} style={styles.alertItemRow}>
                    <View style={[styles.alertIconSquare, { backgroundColor: item.color + '15' }]}>
                      <Ionicons name={item.icon} size={22} color={item.color} />
                    </View>

                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.alertTitle}>{item.title}</Text>
                      <Text style={styles.alertSub}>Stock running low</Text>
                    </View>

                    <View style={styles.alertBadgePill}>
                      <Text style={styles.alertBadgeText}>{item.stockLeft} left</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* RECENT ORDERS TABLE CARD & CUSTOMER SEGMENTS DONUT CHART */}
            <View style={styles.cardSection}>
              <View style={styles.cardSectionHeader}>
                <Text style={styles.cardSectionTitle}>Recent Orders</Text>
                <Pressable onPress={() => router.push('/(tabs)/community')}>
                  <Text style={styles.seeAllText}>View all ›</Text>
                </Pressable>
              </View>

              <View style={{ gap: 10 }}>
                {mockRecentOrders.map((ord) => {
                  const b = getStatusBadgeStyle(ord.status);
                  return (
                    <View key={ord.id} style={styles.orderItemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.orderRefText}>{ord.reference}</Text>
                        <Text style={styles.orderCustomerText}>{ord.customerName} • {ord.dateStr}</Text>
                      </View>

                      <Text style={styles.orderAmountText}>{formatKobo(ord.totalKobo)}</Text>

                      <View style={[styles.orderStatusPill, { backgroundColor: b.bg }]}>
                        <Text style={[styles.orderStatusText, { color: b.text }]}>{b.label}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* CUSTOMER SEGMENTS DONUT CHART */}
            <View style={styles.cardSection}>
              <Text style={styles.cardSectionTitle}>Customer Segments</Text>

              <View style={styles.donutRow}>
                <View style={{ flex: 1 }}>
                  <AdminChartJS
                    type="doughnut"
                    labels={['New Customers', 'Returning Members', 'Loyal Nurses']}
                    dataPoints={[35, 45, 20]}
                    colorsList={['#F10505', '#3F0106', '#059669']}
                    centerLabel="8,426"
                    height={180}
                  />
                </View>

                <View style={{ flex: 1, gap: 10, justifyContent: 'center' }}>
                  <View style={styles.segmentLegendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#F10505' }]} />
                    <Text style={styles.legendLabel}>New Customers (35%)</Text>
                  </View>

                  <View style={styles.segmentLegendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#3F0106' }]} />
                    <Text style={styles.legendLabel}>Returning Members (45%)</Text>
                  </View>

                  <View style={styles.segmentLegendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#059669' }]} />
                    <Text style={styles.legendLabel}>Loyal Members (20%)</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* TOP SELLING PRODUCTS CAROUSEL */}
            <View style={styles.cardSection}>
              <View style={styles.cardSectionHeader}>
                <Text style={styles.cardSectionTitle}>Top Selling Products</Text>
                <Pressable onPress={() => router.push('/(tabs)/marketplace')}>
                  <Text style={styles.seeAllText}>View all products ›</Text>
                </Pressable>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {mockTopProducts.map((p) => (
                  <View key={p.id} style={styles.topProdCard}>
                    <View style={[styles.topProdIconBox, { backgroundColor: p.color + '15' }]}>
                      <Ionicons name={p.icon} size={32} color={p.color} />
                    </View>
                    <Text style={styles.topProdTitle} numberOfLines={1}>{p.title}</Text>
                    <Text style={styles.topProdSold}>{p.sold}</Text>
                    <Text style={styles.topProdRevenue}>{p.revenue}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
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
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerSubTitle: {
    color: '#64748B',
    fontSize: 12,
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateRangePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateRangeText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  notifBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F10505',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 96,
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 13,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricCard: {
    width: '48%',
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    gap: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  metricHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  growthBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  growthText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '700',
  },
  middleRowCard: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    gap: 14,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardSectionTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  chartSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  chartMainVal: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  chartPillGrowth: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#ECFDF5',
  },
  chartPillGrowthText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
  },
  periodSwitcherPill: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 999,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  periodBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  periodBtnActive: {
    backgroundColor: '#3F0106',
  },
  periodBtnText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  periodBtnTextActive: {
    color: '#FFFFFF',
  },
  cardSection: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  cardSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seeAllText: {
    color: '#F10505',
    fontSize: 12,
    fontWeight: '800',
  },
  alertItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    gap: 12,
  },
  alertIconSquare: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  alertSub: {
    color: '#64748B',
    fontSize: 11,
  },
  alertBadgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FEF3C7',
  },
  alertBadgeText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '800',
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  orderRefText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  orderCustomerText: {
    color: '#64748B',
    fontSize: 11,
  },
  orderAmountText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  orderStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  orderStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  segmentLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '600',
  },
  topProdCard: {
    width: 150,
    padding: 14,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topProdIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  topProdTitle: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
  },
  topProdSold: {
    color: '#64748B',
    fontSize: 11,
  },
  topProdRevenue: {
    color: '#F10505',
    fontSize: 12,
    fontWeight: '800',
  },
});
