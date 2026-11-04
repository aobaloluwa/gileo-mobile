import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

export function AdminOrdersSkeleton() {
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  return (
    <Animated.View style={[styles.container, { opacity: pulseAnim }]}>
      {/* 4 Metric Overview Cards Skeleton */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCardSkeleton} />
        <View style={styles.metricCardSkeleton} />
        <View style={styles.metricCardSkeleton} />
        <View style={styles.metricCardSkeleton} />
      </View>

      {/* Search Input Skeleton */}
      <View style={styles.searchSkeleton} />

      {/* Stage Filter Chips Skeleton */}
      <View style={styles.chipsRow}>
        <View style={[styles.chipSkeleton, { width: 80 }]} />
        <View style={[styles.chipSkeleton, { width: 70 }]} />
        <View style={[styles.chipSkeleton, { width: 95 }]} />
        <View style={[styles.chipSkeleton, { width: 90 }]} />
      </View>

      {/* Order Cards Skeletons */}
      <View style={styles.cardSkeleton}>
        <View style={styles.cardHeaderSkeleton}>
          <View style={styles.refSkeleton} />
          <View style={styles.badgeSkeleton} />
        </View>
        <View style={styles.customerLineSkeleton} />
        <View style={styles.metaLineSkeleton} />
        <View style={styles.itemsBoxSkeleton} />
        <View style={styles.actionRowSkeleton}>
          <View style={styles.btnSkeleton} />
          <View style={styles.btnSkeleton} />
          <View style={styles.btnSkeleton} />
        </View>
      </View>

      <View style={styles.cardSkeleton}>
        <View style={styles.cardHeaderSkeleton}>
          <View style={styles.refSkeleton} />
          <View style={styles.badgeSkeleton} />
        </View>
        <View style={styles.customerLineSkeleton} />
        <View style={styles.metaLineSkeleton} />
        <View style={styles.itemsBoxSkeleton} />
        <View style={styles.actionRowSkeleton}>
          <View style={styles.btnSkeleton} />
          <View style={styles.btnSkeleton} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingTop: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCardSkeleton: {
    flex: 1,
    height: 76,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
  },
  searchSkeleton: {
    width: '100%',
    height: 48,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chipSkeleton: {
    height: 34,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
  },
  cardSkeleton: {
    width: '100%',
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeaderSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  refSkeleton: {
    width: 120,
    height: 18,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  badgeSkeleton: {
    width: 70,
    height: 22,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
  },
  customerLineSkeleton: {
    width: '75%',
    height: 16,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  metaLineSkeleton: {
    width: '50%',
    height: 14,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  itemsBoxSkeleton: {
    width: '100%',
    height: 64,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  actionRowSkeleton: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 4,
  },
  btnSkeleton: {
    flex: 1,
    height: 36,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
  },
});
