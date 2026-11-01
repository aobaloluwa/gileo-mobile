import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
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
import { AdminCareRequestsSkeleton } from './AdminCareRequestsSkeleton';
import { apiRequest } from '../../services/api';

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
  assignedProvider?: { id: string; displayName?: string; email?: string };
};

type AdminUser = {
  id: string;
  displayName?: string;
  email?: string;
  role: string;
};

const STAGES = [
  { key: 'ALL', label: 'All Requests' },
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'UNDER_REVIEW', label: 'Under Review' },
  { key: 'ACCEPTED', label: 'Accepted' },
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'COMPLETED', label: 'Completed' },
];

export function AdminCareRequestsView() {
  const [requests, setRequests] = useState<AdminServiceRequest[]>([]);
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Assign Provider Modal
  const [selectedReq, setSelectedReq] = useState<AdminServiceRequest | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [providerId, setProviderId] = useState('');
  const [providerSearch, setProviderSearch] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [toastText, setToastText] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [allReqs, usrs] = await Promise.all([
        apiRequest<AdminServiceRequest[]>('/service-requests').catch(() => []),
        apiRequest<AdminUser[]>('/admin/users').catch(() => []),
      ]);
      setRequests(Array.isArray(allReqs) ? allReqs : []);
      setUsersList(Array.isArray(usrs) ? usrs : []);
    } catch {
      setRequests([]);
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

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await apiRequest<any>(`/service-requests/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)),
      );
      setToastText(`Status successfully updated to ${newStatus}`);
      setTimeout(() => setToastText(''), 4000);
    } catch (err: any) {
      setToastText(err?.message || 'Could not update status');
      setTimeout(() => setToastText(''), 4000);
    }
  };

  const handleAssignProviderSubmit = async () => {
    if (!selectedReq || !providerId.trim()) return;
    setIsAssigning(true);
    try {
      await apiRequest<any>(`/service-requests/${selectedReq.id}/assign-provider`, {
        method: 'POST',
        body: JSON.stringify({ providerId: providerId.trim() }),
      });
      setToastText('Nurse provider assigned successfully!');
      setShowAssignModal(false);
      setProviderId('');
      await loadData();
      setTimeout(() => setToastText(''), 4000);
    } catch (err: any) {
      setToastText(err?.message || 'Could not assign nurse provider.');
      setTimeout(() => setToastText(''), 4000);
    } finally {
      setIsAssigning(false);
    }
  };

  const totalCount = requests.length;
  const pendingCount = requests.filter(r => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW').length;
  const completedCount = requests.filter(r => r.status === 'COMPLETED').length;

  const filtered = requests.filter((r) => {
    const matchesStage = selectedStage === 'ALL' || r.status === selectedStage;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesStage;
    const refMatch = r.reference?.toLowerCase().includes(query);
    const titleMatch = r.service?.title?.toLowerCase().includes(query);
    const userMatch = r.user?.displayName?.toLowerCase().includes(query) || r.user?.email?.toLowerCase().includes(query);
    const locMatch = r.location?.toLowerCase().includes(query);
    return matchesStage && (refMatch || titleMatch || userMatch || locMatch);
  });

  const filteredUsers = usersList.filter(u => {
    const q = providerSearch.toLowerCase().trim();
    if (!q) return true;
    return (u.displayName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.id.toLowerCase().includes(q));
  });

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' };
      case 'ACCEPTED':
      case 'IN_PROGRESS':
        return { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' };
      case 'ASSIGNED':
        return { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' };
      case 'UNDER_REVIEW':
        return { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' };
      default:
        return { bg: '#FEF2F2', text: '#F10505', border: '#FECACA' };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Toast Notification Banner */}
      {Boolean(toastText) && (
        <View style={styles.toastBanner}>
          <Ionicons name="information-circle" size={18} color="#FFFFFF" />
          <Text style={styles.toastText}>{toastText}</Text>
        </View>
      )}

      {/* Top Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.headerSub}>Care Management Portal</Text>
          <Text style={styles.headerTitle}>Patient Care Requests</Text>
        </View>
        <Pressable style={styles.refreshIconBtn} onPress={() => void loadData()} disabled={loading}>
          <Ionicons name="refresh" size={18} color="#0F172A" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F10505" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Metric Cards */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: '#FFFFFF' }]}>
            <View style={[styles.metricIconBox, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="medical" size={18} color="#F10505" />
            </View>
            <Text style={styles.metricValue}>{totalCount}</Text>
            <Text style={styles.metricLabel}>Total Requests</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: '#FFFFFF' }]}>
            <View style={[styles.metricIconBox, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="time" size={18} color="#D97706" />
            </View>
            <Text style={styles.metricValue}>{pendingCount}</Text>
            <Text style={styles.metricLabel}>Pending Review</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: '#FFFFFF' }]}>
            <View style={[styles.metricIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="checkmark-circle" size={18} color="#059669" />
            </View>
            <Text style={styles.metricValue}>{completedCount}</Text>
            <Text style={styles.metricLabel}>Completed</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by reference, patient, service, location..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {Boolean(searchQuery) && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </Pressable>
          )}
        </View>

        {/* Stage Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
          {STAGES.map((stg) => {
            const isActive = selectedStage === stg.key;
            return (
              <Pressable
                key={stg.key}
                onPress={() => setSelectedStage(stg.key)}
                style={[styles.stageChip, isActive && styles.stageChipActive]}
              >
                <Text style={[styles.stageChipText, isActive && styles.stageChipTextActive]}>
                  {stg.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {loading ? (
          <AdminCareRequestsSkeleton />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No care requests found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search query or filter stage.</Text>
          </View>
        ) : (
          <View style={styles.cardsList}>
            {filtered.map((req) => {
              const badge = getStatusBadgeStyle(req.status);
              return (
                <View key={req.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.refRow}>
                      <Ionicons name="receipt-outline" size={15} color="#64748B" />
                      <Text style={styles.cardRef}>{req.reference}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                      <Text style={[styles.badgeText, { color: badge.text }]}>{req.status}</Text>
                    </View>
                  </View>

                  <Text style={styles.serviceTitle}>{req.service?.title || 'Healthcare Service Request'}</Text>

                  <View style={styles.metaRow}>
                    <Ionicons name="person-outline" size={14} color="#64748B" />
                    <Text style={styles.metaText}>Patient: <Text style={styles.metaBold}>{req.user?.displayName || req.user?.email || 'Guest Patient'}</Text></Text>
                  </View>

                  <View style={styles.metaRow}>
                    <Ionicons name="location-outline" size={14} color="#64748B" />
                    <Text style={styles.metaText}>Location: <Text style={styles.metaBold}>{req.location || 'Home Service'}</Text></Text>
                  </View>

                  {Boolean(req.preferredDate) && (
                    <View style={styles.metaRow}>
                      <Ionicons name="calendar-outline" size={14} color="#64748B" />
                      <Text style={styles.metaText}>Preferred Date: <Text style={styles.metaBold}>{new Date(req.preferredDate!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text></Text>
                    </View>
                  )}

                  {Boolean(req.customerNote) && (
                    <View style={styles.noteBox}>
                      <Text style={styles.noteText}>"{req.customerNote}"</Text>
                    </View>
                  )}

                  {req.assignedProvider ? (
                    <View style={styles.assignedBox}>
                      <Ionicons name="shield-checkmark" size={14} color="#059669" />
                      <Text style={styles.assignedText}>Assigned Nurse: {req.assignedProvider.displayName || req.assignedProvider.email}</Text>
                    </View>
                  ) : (
                    <View style={styles.unassignedBox}>
                      <Ionicons name="alert-circle-outline" size={14} color="#D97706" />
                      <Text style={styles.unassignedText}>No nurse assigned yet</Text>
                    </View>
                  )}

                  {/* Actions Row */}
                  <View style={styles.actionRow}>
                    <Pressable
                      style={styles.primaryActionBtn}
                      onPress={() => {
                        setSelectedReq(req);
                        setProviderId('');
                        setProviderSearch('');
                        setShowAssignModal(true);
                      }}
                    >
                      <Ionicons name="person-add-outline" size={13} color="#FFFFFF" />
                      <Text style={styles.primaryActionText}>Assign Nurse</Text>
                    </Pressable>

                    <Pressable
                      style={styles.secondaryActionBtn}
                      onPress={() => void handleUpdateStatus(req.id, 'ACCEPTED')}
                    >
                      <Ionicons name="checkmark-outline" size={13} color="#059669" />
                      <Text style={[styles.secondaryActionText, { color: '#059669' }]}>Accept</Text>
                    </Pressable>

                    <Pressable
                      style={[styles.secondaryActionBtn, { backgroundColor: '#0F172A', borderColor: '#0F172A' }]}
                      onPress={() => void handleUpdateStatus(req.id, 'COMPLETED')}
                    >
                      <Ionicons name="flag-outline" size={13} color="#FFFFFF" />
                      <Text style={[styles.secondaryActionText, { color: '#FFFFFF' }]}>Complete</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Assign Nurse Modal */}
      <Modal visible={showAssignModal} animationType="slide" transparent onRequestClose={() => setShowAssignModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Assign Care Provider</Text>
                <Text style={styles.modalSubtitle}>Request #{selectedReq?.reference}</Text>
              </View>
              <Pressable onPress={() => setShowAssignModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={18} color="#0F172A" />
              </Pressable>
            </View>

            <View style={styles.modalSearchBox}>
              <Ionicons name="search" size={16} color="#64748B" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search registered staff / nurses..."
                placeholderTextColor="#94A3B8"
                value={providerSearch}
                onChangeText={setProviderSearch}
              />
            </View>

            <ScrollView style={styles.modalUsersList} contentContainerStyle={{ gap: 8, paddingBottom: 16 }}>
              {filteredUsers.length === 0 ? (
                <Text style={{ textAlign: 'center', color: '#94A3B8', paddingVertical: 20 }}>No staff users found.</Text>
              ) : (
                filteredUsers.map((u) => {
                  const isSelected = providerId === u.id;
                  return (
                    <Pressable
                      key={u.id}
                      onPress={() => setProviderId(u.id)}
                      style={[styles.userSelectItem, isSelected && styles.userSelectItemActive]}
                    >
                      <View style={styles.userAvatar}>
                        <Ionicons name="person" size={16} color={isSelected ? '#F10505' : '#64748B'} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.userName, isSelected && { color: '#F10505' }]}>{u.displayName || 'Unnamed User'}</Text>
                        <Text style={styles.userEmail}>{u.email} • Role: {u.role}</Text>
                      </View>
                      {isSelected && <Ionicons name="checkmark-circle" size={20} color="#F10505" />}
                    </Pressable>
                  );
                })
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setShowAssignModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalConfirmBtn, (!providerId.trim() || isAssigning) && { opacity: 0.6 }]}
                disabled={!providerId.trim() || isAssigning}
                onPress={() => void handleAssignProviderSubmit()}
              >
                <Text style={styles.modalConfirmText}>{isAssigning ? 'Assigning...' : 'Confirm Assignment'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },
  toastBanner: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    zIndex: 999,
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  topHeader: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  },
  refreshIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 96,
    gap: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    padding: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  metricIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
  },
  chipsContainer: {
    gap: 8,
    paddingVertical: 2,
  },
  stageChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  cardsList: {
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardRef: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  serviceTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    color: '#64748B',
    fontSize: 13,
  },
  metaBold: {
    color: '#0F172A',
    fontWeight: '700',
  },
  noteBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#F10505',
  },
  noteText: {
    color: '#334155',
    fontSize: 12,
    fontStyle: 'italic',
  },
  assignedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  assignedText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
  },
  unassignedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  unassignedText: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  primaryActionBtn: {
    flex: 1.2,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F10505',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '80%',
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
  modalSearchInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
  },
  modalUsersList: {
    maxHeight: 280,
  },
  userSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 12,
  },
  userSelectItemActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  userEmail: {
    color: '#64748B',
    fontSize: 11,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  modalConfirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    backgroundColor: '#F10505',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
