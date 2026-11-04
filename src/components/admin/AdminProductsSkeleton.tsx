import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

export function AdminProductsSkeleton() {
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
      {/* 3 Metrics Cards Skeleton Row */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCardSkeleton} />
        <View style={styles.metricCardSkeleton} />
        <View style={styles.metricCardSkeleton} />
      </View>

      {/* Search Bar Skeleton */}
      <View style={styles.searchSkeleton} />

      {/* Filter Chips Skeleton */}
      <View style={styles.chipsRow}>
        <View style={[styles.chipSkeleton, { width: 70 }]} />
        <View style={[styles.chipSkeleton, { width: 90 }]} />
        <View style={[styles.chipSkeleton, { width: 95 }]} />
        <View style={[styles.chipSkeleton, { width: 105 }]} />
      </View>

      {/* Primary Action Button Skeleton */}
      <View style={styles.addBtnSkeleton} />

      {/* Product Cards Skeletons */}
      <View style={styles.cardSkeleton}>
        <View style={styles.cardRowTop}>
          <View style={styles.imagePlaceholder} />
          <View style={styles.cardDetailsColumn}>
            <View style={styles.titleSkeleton} />
            <View style={styles.priceSkeleton} />
            <View style={styles.metaLineSkeleton} />
          </View>
        </View>
        <View style={styles.badgesRowSkeleton}>
          <View style={styles.badgeSkeleton} />
          <View style={styles.badgeSkeleton} />
          <View style={styles.badgeSkeleton} />
        </View>
        <View style={styles.actionRowSkeleton}>
          <View style={styles.btnSkeleton} />
          <View style={styles.btnSkeleton} />
        </View>
      </View>

      <View style={styles.cardSkeleton}>
        <View style={styles.cardRowTop}>
          <View style={styles.imagePlaceholder} />
          <View style={styles.cardDetailsColumn}>
            <View style={styles.titleSkeleton} />
            <View style={styles.priceSkeleton} />
            <View style={styles.metaLineSkeleton} />
          </View>
        </View>
        <View style={styles.badgesRowSkeleton}>
          <View style={styles.badgeSkeleton} />
          <View style={styles.badgeSkeleton} />
        </View>
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
    gap: 16,
    paddingTop: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCardSkeleton: {
    flex: 1,
    height: 84,
    borderRadius: 20,
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
  addBtnSkeleton: {
    width: '100%',
    height: 52,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
  },
  cardSkeleton: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardRowTop: {
    flexDirection: 'row',
    gap: 14,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  cardDetailsColumn: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  titleSkeleton: {
    width: '80%',
    height: 18,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  priceSkeleton: {
    width: '45%',
    height: 16,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  metaLineSkeleton: {
    width: '60%',
    height: 14,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  badgesRowSkeleton: {
    flexDirection: 'row',
    gap: 8,
  },
  badgeSkeleton: {
    width: 48,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  actionRowSkeleton: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 4,
  },
  btnSkeleton: {
    flex: 1,
    height: 38,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
  },
});
