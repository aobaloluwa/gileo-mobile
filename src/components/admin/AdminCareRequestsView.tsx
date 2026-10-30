import { Ionicons } from '@expo/vector-icons';
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
import { colors, formatKobo } from '../../theme/colors';

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
  { key: 'ASSIGNED', label: 'Nurse Assigned' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'COMPLETED', label: 'Completed' },
];

export function AdminCareRequestsView() {
  const [requests, setRequests] = useState<AdminServiceRequest[]>([]);
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Assign Provider Modal
  const [selectedReq, setSelectedReq] = useState<AdminServiceRequest | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [providerId, setProviderId] = useState('');
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
      setToastText(`Status updated to ${newStatus}`);
    } catch (err: any) {
      setToastText(err?.message || 'Could not update status');
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
      setToastText('Nurse assigned successfully!');
      setShowAssignModal(false);
      setProviderId('');
      await loadData();
    } catch (err: any) {
      setToastText(err?.message || 'Could not assign nurse provider.');
    } finally {
      setIsAssigning(false);
    }
  };

  const filtered = requests.filter(
    (r) => selectedStage === 'ALL' || r.status === selectedStage,
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.topHeader}>
        <Text style={styles.headerSub}>Admin Controls</Text>
        <Text style={styles.headerTitle}>Care Requests Management</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F10505" />}
      >
        {/* Stage Pills Row */}
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
            <Text style={styles.loadingText}>Loading care requests...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <Text style={styles.emptyText}>No care requests in this stage.</Text>
        ) : (
          <View style={{ gap: 12 }}>
            {filtered.map((req) => (
              <View key={req.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardRef}>{req.reference}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{req.status}</Text>
                  </View>
                </View>

                <Text style={styles.serviceTitle}>{req.service?.title || 'Healthcare Care Request'}</Text>
                <Text style={styles.metaText}>Patient: {req.user?.displayName || req.user?.email}</Text>
                <Text style={styles.metaText}>Location: {req.location || 'Home Service'}</Text>
                {req.customerNote && <Text style={styles.noteText}>Note: "{req.customerNote}"</Text>}

                {req.assignedProvider && (
                  <Text style={styles.assignedNurse}>
                    Assigned Nurse: {req.assignedProvider.displayName}
                  </Text>
                )}

                {/* Status Action Buttons */}
                <View style={styles.actionRow}>
                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => {
                      setSelectedReq(req);
                      setShowAssignModal(true);
                    }}
                  >
                    <Text style={styles.actionBtnText}>Assign Nurse</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: '#059669' }]}
                    onPress={() => handleUpdateStatus(req.id, 'ACCEPTED')}
                  >
                    <Text style={styles.actionBtnText}>Accept</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: '#3F0106' }]}
                    onPress={() => handleUpdateStatus(req.id, 'COMPLETED')}
                  >
                    <Text style={styles.actionBtnText}>Mark Completed</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Assign Nurse Modal */}
      <Modal visible={showAssignModal} animationType="slide" onRequestClose={() => setShowAssignModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF', padding: 20, gap: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>Assign Nurse Provider</Text>
          <Text style={{ fontSize: 13, color: '#64748B' }}>Enter registered Nurse User ID or select below:</Text>

          <TextInput
            value={providerId}
            onChangeText={setProviderId}
            placeholder="Enter Provider User ID"
            style={{ height: 48, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 16 }}
          />

          <ScrollView style={{ maxHeight: 200 }}>
            {usersList.map((u) => (
              <Pressable
                key={u.id}
                onPress={() => setProviderId(u.id)}
                style={{ padding: 12, borderRadius: 12, backgroundColor: '#F8FAFC', marginBottom: 8 }}
              >
                <Text style={{ fontWeight: '700', color: '#0F172A' }}>{u.displayName || u.email}</Text>
                <Text style={{ fontSize: 11, color: '#64748B' }}>ID: {u.id}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 'auto' }}>
            <Pressable style={{ flex: 1, height: 48, borderRadius: 999, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' }} onPress={() => setShowAssignModal(false)}>
              <Text style={{ fontWeight: '700', color: '#0F172A' }}>Cancel</Text>
            </Pressable>
            <Pressable style={{ flex: 1, height: 48, borderRadius: 999, backgroundColor: '#F10505', alignItems: 'center', justifyContent: 'center' }} disabled={isAssigning} onPress={handleAssignProviderSubmit}>
              <Text style={{ fontWeight: '700', color: '#FFFFFF' }}>{isAssigning ? 'Assigning...' : 'Confirm Assignment'}</Text>
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
  serviceTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  metaText: {
    color: '#64748B',
    fontSize: 12,
  },
  noteText: {
    color: '#334155',
    fontSize: 12,
    fontStyle: 'italic',
  },
  assignedNurse: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F10505',
  },
  actionBtnText: {
    color: '#FFFFFF',
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
