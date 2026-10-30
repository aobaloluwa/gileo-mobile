import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdminChartJS } from '../AdminChartJS';
import { AdminDashboardSkeleton } from './AdminDashboardSkeleton';
import { apiRequest } from '../../services/api';
import { AuthUser, getStoredUser } from '../../services/auth';
import { formatKobo } from '../../theme/colors';

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

type TopProduct = {
  id: string;
  title: string;
  sold: string;
  revenue: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

type AdminDashboardStats = {
  totalUsers?: number;
  totalOrders?: number;
  totalRevenueKobo?: number;
  activeServices?: number;
  openTickets?: number;
  conversionRate?: string;
  revenueLabels?: string[];
  revenueDataPoints?: number[];
  stockAlerts?: StockAlert[];
  recentOrders?: RecentOrder[];
  customerSegments?: number[];
  topProducts?: TopProduct[];
};

type DateFilterOption =
  | 'Past 30 Days'
  | 'This Month'
  | 'Last Month'
  | 'Past 3 Months'
  | 'Past 6 Months'
  | 'All Time';

const DATE_OPTIONS: DateFilterOption[] = [
  'Past 30 Days',
  'This Month',
  'Last Month',
  'Past 3 Months',
  'Past 6 Months',
  'All Time',
];

export function AdminDashboardView() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [stats, setStats] = useState<AdminDashboardStats>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timePeriod, setTimePeriod] = useState<'Daily' | 'Weekly' | 'Monthly'>('Weekly');
  const [dateFilter, setDateFilter] = useState<DateFilterOption>('Past 30 Days');

  // Modals & Network States
  const [showDateModal, setShowDateModal] = useState(false);
  const [isNetworkError, setIsNetworkError] = useState(false);

  const calculateDateRange = (filter: DateFilterOption) => {
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date = now;

    if (filter === 'Past 30 Days') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (filter === 'This Month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (filter === 'Last Month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (filter === 'Past 3 Months') {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (filter === 'Past 6 Months') {
      startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    } else {
      // All Time
      startDate = null;
    }

    return {
      startStr: startDate ? startDate.toISOString() : undefined,
      endStr: endDate.toISOString(),
      labelStr: startDate
        ? `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        : 'All Time Metrics',
    };
  };

  const loadData = async (selectedPeriod = timePeriod, selectedDate = dateFilter) => {
    setLoading(true);
    setIsNetworkError(false);

    try {
      const u = await getStoredUser();
      setUser(u);

      const dates = calculateDateRange(selectedDate);
      let queryUrl = `/admin/dashboard?period=${selectedPeriod}`;
      if (dates.startStr) queryUrl += `&startDate=${encodeURIComponent(dates.startStr)}`;
      if (dates.endStr) queryUrl += `&endDate=${encodeURIComponent(dates.endStr)}`;

      const dashboardStats = await apiRequest<AdminDashboardStats>(queryUrl);
      setStats(dashboardStats || {});
    } catch {
      setIsNetworkError(true);
      setStats({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData(timePeriod, dateFilter);
  }, []);

  const handlePeriodChange = (newPeriod: 'Daily' | 'Weekly' | 'Monthly') => {
    setTimePeriod(newPeriod);
    void loadData(newPeriod, dateFilter);
  };

  const handleSelectDateFilter = (option: DateFilterOption) => {
    setDateFilter(option);
    setShowDateModal(false);
    void loadData(timePeriod, option);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData(timePeriod, dateFilter);
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

  const stockAlerts = stats.stockAlerts || [];
  const recentOrders = stats.recentOrders || [];
  const topProducts = stats.topProducts || [];
  const customerSegments = stats.customerSegments || [35, 45, 20];
  const revenueLabels = stats.revenueLabels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const revenueDataPoints = stats.revenueDataPoints || [0, 0, 0, 0, 0, 0, 0];
  const activeDateLabel = calculateDateRange(dateFilter).labelStr;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Network Disconnected / Error Banner */}
      {isNetworkError && (
        <View style={styles.networkErrorBanner}>
          <Ionicons name="wifi-outline" size={16} color="#FFFFFF" />
          <Text style={styles.networkErrorText} numberOfLines={1}>
            Network Disconnected. Please check your connection.
          </Text>
          <Pressable style={styles.retryBtn} onPress={() => loadData(timePeriod, dateFilter)}>
            <Ionicons name="refresh" size={12} color="#F10505" />
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {/* Top Header Section - Row 1: Title & Right Actions */}
      <View style={styles.topHeaderContainer}>
        <View style={styles.topHeaderMainRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerSubTitle}>Overview</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Gileo Operations
            </Text>
          </View>

          <View style={styles.headerRightActions}>
            <Pressable style={styles.notifBtn} onPress={() => router.push('/notifications')}>
              <Ionicons name="notifications-outline" size={20} color="#0F172A" />
              <View style={styles.notifDot} />
            </Pressable>

            <Pressable style={styles.avatarCircle} onPress={() => router.push('/(tabs)/profile')}>
              <Text style={styles.avatarText}>
                {(user?.displayName || 'O').charAt(0).toUpperCase()}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Row 2: Date Selector Pill moved down into a separate row */}
        <View style={styles.dateSubRow}>
          <Pressable style={styles.dateRangePill} onPress={() => setShowDateModal(true)}>
            <Ionicons name="calendar-outline" size={13} color="#64748B" />
            <Text style={styles.dateRangeText}>{activeDateLabel}</Text>
            <Ionicons name="chevron-down" size={12} color="#64748B" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F10505" />}
      >
        {loading ? (
          <AdminDashboardSkeleton />
        ) : (
          <View style={{ gap: 16 }}>
            {/* TOP METRIC CARDS GRID */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <View style={styles.metricHeaderRow}>
                  <Text style={styles.metricLabel} numberOfLines={1}>Total Revenue</Text>
                  <View style={[styles.iconCircle, { backgroundColor: '#FDF2F2' }]}>
                    <Ionicons name="cash-outline" size={16} color="#F10505" />
                  </View>
                </View>
                <Text style={styles.metricValue} numberOfLines={1}>
                  {formatKobo(stats.totalRevenueKobo || 0)}
                </Text>
                <View style={styles.growthBadgeRow}>
                  <Ionicons name="checkmark-circle" size={12} color="#059669" />
                  <Text style={styles.growthText} numberOfLines={1}>Paid Orders Only</Text>
                </View>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricHeaderRow}>
                  <Text style={styles.metricLabel} numberOfLines={1}>Total Orders</Text>
                  <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="bag-handle-outline" size={16} color="#3B82F6" />
                  </View>
                </View>
                <Text style={styles.metricValue} numberOfLines={1}>{stats.totalOrders ?? 0}</Text>
                <View style={styles.growthBadgeRow}>
                  <Ionicons name="checkmark-circle" size={12} color="#3B82F6" />
                  <Text style={styles.growthText} numberOfLines={1}>Store Orders</Text>
                </View>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricHeaderRow}>
                  <Text style={styles.metricLabel} numberOfLines={1}>Total Customers</Text>
                  <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
                    <Ionicons name="people-outline" size={16} color="#059669" />
                  </View>
                </View>
                <Text style={styles.metricValue} numberOfLines={1}>{stats.totalUsers ?? 0}</Text>
                <View style={styles.growthBadgeRow}>
                  <Ionicons name="person-add" size={12} color="#059669" />
                  <Text style={styles.growthText} numberOfLines={1}>Registered Users</Text>
                </View>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricHeaderRow}>
                  <Text style={styles.metricLabel} numberOfLines={1}>Conversion Rate</Text>
                  <View style={[styles.iconCircle, { backgroundColor: '#F3E8FF' }]}>
                    <Ionicons name="stats-chart-outline" size={16} color="#9333EA" />
                  </View>
                </View>
                <Text style={styles.metricValue} numberOfLines={1}>{stats.conversionRate || '0.00'}%</Text>
                <View style={styles.growthBadgeRow}>
                  <Ionicons name="flash" size={12} color="#9333EA" />
                  <Text style={styles.growthText} numberOfLines={1}>Paid / Started Ratio</Text>
                </View>
              </View>
            </View>

            {/* MIDDLE ROW: SALES OVERVIEW LINE CHART */}
            <View style={styles.middleRowCard}>
              <View style={styles.chartHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardSectionTitle}>Sales Overview</Text>
                  <Text style={styles.chartMainVal} numberOfLines={1}>
                    {formatKobo(stats.totalRevenueKobo || 0)}
                  </Text>
                </View>

                {/* Period Switcher */}
                <View style={styles.periodSwitcherPill}>
                  {(['Daily', 'Weekly', 'Monthly'] as const).map((p) => (
                    <Pressable
                      key={p}
                      onPress={() => handlePeriodChange(p)}
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
                labels={revenueLabels}
                dataPoints={revenueDataPoints}
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

              {stockAlerts.length === 0 ? (
                <Text style={styles.emptyText}>All products are well stocked in database.</Text>
              ) : (
                <View style={{ gap: 10 }}>
                  {stockAlerts.map((item) => (
                    <View key={item.id} style={styles.alertItemRow}>
                      <View style={[styles.alertIconSquare, { backgroundColor: item.color + '15' }]}>
                        <Ionicons name={item.icon} size={20} color={item.color} />
                      </View>

                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={styles.alertTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.alertSub}>Stock running low</Text>
                      </View>

                      <View style={styles.alertBadgePill}>
                        <Text style={styles.alertBadgeText}>{item.stockLeft} left</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* RECENT ORDERS TABLE CARD */}
            <View style={styles.cardSection}>
              <View style={styles.cardSectionHeader}>
                <Text style={styles.cardSectionTitle}>Recent Orders</Text>
                <Pressable onPress={() => router.push('/(tabs)/community')}>
                  <Text style={styles.seeAllText}>View all ›</Text>
                </Pressable>
              </View>

              {recentOrders.length === 0 ? (
                <Text style={styles.emptyText}>No recent orders recorded in database yet.</Text>
              ) : (
                <View style={{ gap: 10 }}>
                  {recentOrders.map((ord) => {
                    const b = getStatusBadgeStyle(ord.status);
                    return (
                      <View key={ord.id} style={styles.orderItemRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.orderRefText}>{ord.reference}</Text>
                          <Text style={styles.orderCustomerText} numberOfLines={1}>
                            {ord.customerName} • {ord.dateStr}
                          </Text>
                        </View>

                        <Text style={styles.orderAmountText}>{formatKobo(ord.totalKobo)}</Text>

                        <View style={[styles.orderStatusPill, { backgroundColor: b.bg }]}>
                          <Text style={[styles.orderStatusText, { color: b.text }]}>{b.label}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* CUSTOMER SEGMENTS DONUT CHART */}
            <View style={styles.cardSection}>
              <Text style={styles.cardSectionTitle}>Customer Segments</Text>

              <View style={styles.donutRow}>
                <View style={{ flex: 1, minWidth: 140 }}>
                  <AdminChartJS
                    type="doughnut"
                    labels={['New Customers', 'Returning Members', 'Loyal Members']}
                    dataPoints={customerSegments}
                    colorsList={['#F10505', '#3F0106', '#059669']}
                    centerLabel={String(stats.totalUsers ?? 0)}
                    height={180}
                  />
                </View>

                <View style={{ flex: 1, gap: 10, justifyContent: 'center' }}>
                  <View style={styles.segmentLegendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#F10505' }]} />
                    <Text style={styles.legendLabel} numberOfLines={1}>New ({customerSegments[0] || 0}%)</Text>
                  </View>

                  <View style={styles.segmentLegendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#3F0106' }]} />
                    <Text style={styles.legendLabel} numberOfLines={1}>Returning ({customerSegments[1] || 0}%)</Text>
                  </View>

                  <View style={styles.segmentLegendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#059669' }]} />
                    <Text style={styles.legendLabel} numberOfLines={1}>Loyal ({customerSegments[2] || 0}%)</Text>
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

              {topProducts.length === 0 ? (
                <Text style={styles.emptyText}>No products added to database yet.</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                  {topProducts.map((p) => (
                    <View key={p.id} style={styles.topProdCard}>
                      <View style={[styles.topProdIconBox, { backgroundColor: p.color + '15' }]}>
                        <Ionicons name={p.icon} size={28} color={p.color} />
                      </View>
                      <Text style={styles.topProdTitle} numberOfLines={1}>{p.title}</Text>
                      <Text style={styles.topProdSold}>{p.sold}</Text>
                      <Text style={styles.topProdRevenue}>{p.revenue}</Text>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Real Date Range Filter Modal */}
      <Modal visible={showDateModal} animationType="slide" onRequestClose={() => setShowDateModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF', padding: 20, gap: 16 }}>
          <View style={styles.dateModalHeader}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>Select Date Range</Text>
            <Pressable style={styles.circleBtn} onPress={() => setShowDateModal(false)}>
              <Ionicons name="close" size={20} color="#0F172A" />
            </Pressable>
          </View>

          <Text style={{ fontSize: 13, color: '#64748B' }}>Filter all analytics metrics across your selected timeframe:</Text>

          <View style={{ gap: 10 }}>
            {DATE_OPTIONS.map((opt) => {
              const isSelected = dateFilter === opt;
              return (
                <Pressable
                  key={opt}
                  onPress={() => handleSelectDateFilter(opt)}
                  style={[styles.dateOptionCard, isSelected && styles.dateOptionCardActive]}
                >
                  <Ionicons name="calendar-outline" size={18} color={isSelected ? '#F10505' : '#64748B'} />
                  <Text style={[styles.dateOptionText, isSelected && styles.dateOptionTextActive]}>{opt}</Text>
                  {isSelected && <Ionicons name="checkmark-circle" size={18} color="#F10505" />}
                </Pressable>
              );
            })}
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
  networkErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#3F0106',
    gap: 8,
  },
  networkErrorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  retryBtnText: {
    color: '#F10505',
    fontSize: 11,
    fontWeight: '800',
  },
  topHeaderContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  topHeaderMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    gap: 10,
  },
  dateSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateRangePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateRangeText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notifDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F10505',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 96,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    minWidth: 150,
    padding: 14,
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
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
  },
  growthBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  growthText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '700',
  },
  middleRowCard: {
    padding: 16,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardSectionTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  chartMainVal: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
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
    paddingHorizontal: 8,
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
    padding: 16,
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
    gap: 10,
  },
  alertIconSquare: {
    width: 36,
    height: 36,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FEF3C7',
  },
  alertBadgeText: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '800',
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
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
    fontSize: 12,
    fontWeight: '800',
  },
  orderStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  orderStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  segmentLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '600',
  },
  topProdCard: {
    width: 140,
    padding: 12,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    gap: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topProdIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
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
    fontSize: 10,
  },
  topProdRevenue: {
    color: '#F10505',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 16,
  },
  dateModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  dateOptionCardActive: {
    backgroundColor: '#FDF2F2',
    borderColor: '#F10505',
  },
  dateOptionText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  dateOptionTextActive: {
    color: '#F10505',
    fontWeight: '800',
  },
});
