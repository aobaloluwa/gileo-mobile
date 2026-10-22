import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';

const communityPosts = [
  {
    id: '1',
    title: 'Exploring Non-Traditional Nursing Pathways',
    category: 'Career Guidance',
    author: 'Gileo Community Lead',
    description:
      'Learn about nurse concierge roles, corporate healthcare coordination, and independent practice.',
    icon: 'compass-outline' as const,
  },
  {
    id: '2',
    title: 'How to Build a High-Impact Nursing Portfolio',
    category: 'Professional Growth',
    author: 'Gileo Learning Hub',
    description:
      'Key guidelines for structuring clinical experience, certifications, and leadership achievements.',
    icon: 'document-text-outline' as const,
  },
  {
    id: '3',
    title: 'Gileo Elevate Mentorship Cohorts',
    category: 'Cohort Announcement',
    author: 'Gileo Elevate Team',
    description:
      'Structured paid cohort programmes for nurses seeking clinical leadership and global opportunities.',
    icon: 'school-outline' as const,
  },
];

export default function CommunityScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const handleCallSupport = () => {
    void Linking.openURL('tel:+2348165335594');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#761B36"
            colors={['#761B36']}
          />
        }
      >
        <Text style={styles.eyebrow}>PILLAR 3 • NURSES COMMUNITY</Text>
        <Text style={styles.title}>Gileo Community</Text>
        <Text style={styles.subtitle}>
          A connected network for nurses to share insights, discover career pathways, and grow professionally.
        </Text>

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>FREE COMMUNITY ACCESS</Text>
            </View>
            <Ionicons name="people" size={20} color="#059669" />
          </View>

          <Text style={styles.heroTitle}>Empowering Nursing Leaders</Text>
          <Text style={styles.heroText}>
            Connect with fellow healthcare professionals, access practical career guides, and discover Gileo Elevate programmes.
          </Text>

          <Pressable style={styles.joinBtn} onPress={handleCallSupport}>
            <Text style={styles.joinBtnText}>Contact Community Support</Text>
            <Ionicons name="call" size={14} color="#0F172A" />
          </Pressable>
        </View>

        <Text style={styles.sectionHeader}>Resource Hub & Updates</Text>

        <View style={styles.postList}>
          {communityPosts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={styles.postIconBox}>
                  <Ionicons name={post.icon} size={20} color="#059669" />
                </View>
                <View style={styles.postHeaderInfo}>
                  <Text style={styles.postCategory}>{post.category}</Text>
                  <Text style={styles.postTitle}>{post.title}</Text>
                </View>
              </View>

              <Text style={styles.postDescription}>{post.description}</Text>

              <View style={styles.postFooter}>
                <Text style={styles.postAuthor}>By {post.author}</Text>
                <Pressable onPress={handleCallSupport} hitSlop={8}>
                  <Text style={styles.readMoreText}>Learn more →</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
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
  heroCard: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 12,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  badgeText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: '#065F46',
    fontSize: 20,
    fontWeight: '700',
  },
  heroText: {
    color: '#047857',
    fontSize: 13,
    lineHeight: 19,
  },
  joinBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },
  joinBtnText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginTop: 8,
  },
  postList: {
    gap: 12,
  },
  postCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  postIconBox: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postHeaderInfo: {
    flex: 1,
  },
  postCategory: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  postTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  postDescription: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  postAuthor: {
    color: '#94A3B8',
    fontSize: 11,
  },
  readMoreText: {
    color: '#761B36',
    fontSize: 12,
    fontWeight: '600',
  },
});
