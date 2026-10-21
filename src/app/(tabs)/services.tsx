import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';

const servicesList = [
  {
    id: 'wound-care',
    title: 'Home-Service Wound Dressing',
    category: 'Home Nursing',
    price: '₦20,000 / session',
    description:
      'Professional clinical wound care, sterile dressing, and post-procedure management at your home.',
    icon: 'bandage-outline' as const,
    highlights: ['Sterile procedure', 'Registered Nurse', 'Post-op & chronic wounds'],
  },
  {
    id: 'elderly-care',
    title: 'Elderly & Recovery Care',
    category: 'Home Nursing',
    price: 'Custom Estimate',
    description:
      'Dedicated nursing assistance, vitals monitoring, medication support, and recovery companionship.',
    icon: 'heart-outline' as const,
    highlights: ['Personalized care plan', 'Vitals tracking', 'Medication management'],
  },
  {
    id: 'event-medical',
    title: 'Event Medical Coverage',
    category: 'Corporate & Events',
    price: 'Custom Quote',
    description:
      'On-site standby nurses, emergency response, and medical first-aid coverage for events and corporate functions.',
    icon: 'shield-checkmark-outline' as const,
    highlights: ['Rapid first-response', 'Equipped first-aid', 'Qualified medical staff'],
  },
  {
    id: 'production-medical',
    title: 'On-Set & Production Medical Coverage',
    category: 'Film & Media',
    price: 'Custom Quote',
    description:
      'Dedicated on-set medical personnel for film sets, TV productions, and high-activity creative projects.',
    icon: 'film-outline' as const,
    highlights: ['Continuous standby', 'Set safety compliance', 'Emergency triage'],
  },
  {
    id: 'health-outreach',
    title: 'Community & Corporate Health Outreaches',
    category: 'Organization',
    price: 'Custom Quote',
    description:
      'Structured health screenings, wellness checks, and corporate health outreaches tailored for groups.',
    icon: 'people-outline' as const,
    highlights: ['Group health screening', 'Corporate wellness', 'Detailed reporting'],
  },
];

export default function ServicesScreen() {
  const [selectedService, setSelectedService] = useState<typeof servicesList[0] | null>(null);

  const handleCallSupport = () => {
    void Linking.openURL('tel:+2348165335594');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>PILLAR 1 • HEALTHCARE SERVICES</Text>
        <Text style={styles.title}>Services & Care</Text>
        <Text style={styles.subtitle}>
          Request trusted home nursing, elderly care, and specialized medical coverage.
        </Text>

        <View style={styles.noticeCard}>
          <Ionicons name="sparkles" size={20} color="#761B36" />
          <View style={styles.noticeCopy}>
            <Text style={styles.noticeTitle}>How Service Requests Work</Text>
            <Text style={styles.noticeText}>
              Select a service below to review details, pricing guidance, and submit a request or speak directly with support.
            </Text>
          </View>
        </View>

        <View style={styles.list}>
          {servicesList.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              onPress={() => setSelectedService(item)}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.iconCircle}>
                  <Ionicons name={item.icon} size={22} color="#761B36" />
                </View>

                <View style={styles.headerInfo}>
                  <Text style={styles.cardCategory}>{item.category}</Text>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                </View>
              </View>

              <Text style={styles.cardDescription}>{item.description}</Text>

              <View style={styles.cardFooter}>
                <Text style={styles.cardPrice}>{item.price}</Text>
                <View style={styles.requestPill}>
                  <Text style={styles.requestPillText}>Request Care</Text>
                  <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Modal for Service Details */}
        <Modal
          visible={Boolean(selectedService)}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedService(null)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setSelectedService(null)}
          >
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              {selectedService && (
                <>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalIconBox}>
                      <Ionicons name={selectedService.icon} size={24} color="#761B36" />
                    </View>
                    <Pressable
                      onPress={() => setSelectedService(null)}
                      hitSlop={10}
                    >
                      <Ionicons name="close" size={22} color="#64748B" />
                    </Pressable>
                  </View>

                  <Text style={styles.modalCategory}>{selectedService.category}</Text>
                  <Text style={styles.modalTitle}>{selectedService.title}</Text>
                  <Text style={styles.modalPrice}>{selectedService.price}</Text>

                  <Text style={styles.modalDescription}>
                    {selectedService.description}
                  </Text>

                  <View style={styles.highlightsContainer}>
                    {selectedService.highlights.map((h) => (
                      <View key={h} style={styles.highlightRow}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={styles.highlightText}>{h}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.modalFooter}>
                    <Pressable
                      style={styles.modalPrimaryBtn}
                      onPress={handleCallSupport}
                    >
                      <Ionicons name="call" size={18} color="#FFFFFF" />
                      <Text style={styles.modalPrimaryText}>Call Support (+234 816 533 5594)</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </Pressable>
          </Pressable>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: 16,
  },
  eyebrow: {
    color: '#8A7045',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.6,
  },
  title: {
    color: '#0F172A',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 22,
  },
  noticeCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    alignItems: 'flex-start',
  },
  noticeCopy: {
    flex: 1,
    gap: 4,
  },
  noticeTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  noticeText: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
  },
  list: {
    gap: 14,
  },
  card: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  cardCategory: {
    color: '#8A7045',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
  },
  cardDescription: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cardPrice: {
    color: '#761B36',
    fontSize: 14,
    fontWeight: '700',
  },
  requestPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#111111',
  },
  requestPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 24,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalIconBox: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCategory: {
    color: '#8A7045',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '700',
  },
  modalPrice: {
    color: '#761B36',
    fontSize: 16,
    fontWeight: '700',
  },
  modalDescription: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 22,
  },
  highlightsContainer: {
    gap: 8,
    paddingVertical: 8,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  highlightText: {
    color: '#0F172A',
    fontSize: 13,
  },
  modalFooter: {
    paddingTop: 8,
  },
  modalPrimaryBtn: {
    height: 52,
    borderRadius: 999,
    backgroundColor: '#761B36',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
