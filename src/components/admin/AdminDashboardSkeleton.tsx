import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

export function AdminDashboardSkeleton() {
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
      {/* 4 Metric Cards Skeleton Grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCardSkeleton} />
        <View style={styles.metricCardSkeleton} />
        <View style={styles.metricCardSkeleton} />
        <View style={styles.metricCardSkeleton} />
      </View>

      {/* Chart Skeleton Box */}
      <View style={styles.chartSkeletonBox} />

      {/* Inventory Alerts Skeleton Box */}
      <View style={styles.cardSectionSkeleton}>
        <View style={styles.skeletonTitleBar} />
        <View style={styles.skeletonRowItem} />
        <View style={styles.skeletonRowItem} />
        <View style={styles.skeletonRowItem} />
      </View>

      {/* Recent Orders Skeleton Box */}
      <View style={styles.cardSectionSkeleton}>
        <View style={styles.skeletonTitleBar} />
        <View style={styles.skeletonRowItem} />
        <View style={styles.skeletonRowItem} />
      </View>

      {/* Customer Segments Skeleton Box */}
      <View style={styles.cardSectionSkeleton}>
        <View style={styles.skeletonTitleBar} />
        <View style={styles.skeletonDonutRow}>
          <View style={styles.skeletonCircleDonut} />
          <View style={{ flex: 1, gap: 10 }}>
            <View style={styles.skeletonLine} />
            <View style={styles.skeletonLine} />
            <View style={styles.skeletonLine} />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingTop: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  metricCardSkeleton: {
    flex: 1,
    minWidth: 150,
    height: 94,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  chartSkeletonBox: {
    width: '100%',
    height: 240,
    borderRadius: 24,
    backgroundColor: '#E2E8F0',
  },
  cardSectionSkeleton: {
    width: '100%',
    padding: 18,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  skeletonTitleBar: {
    width: 140,
    height: 20,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  skeletonRowItem: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  skeletonDonutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  skeletonCircleDonut: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E2E8F0',
  },
  skeletonLine: {
    width: '80%',
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
});
