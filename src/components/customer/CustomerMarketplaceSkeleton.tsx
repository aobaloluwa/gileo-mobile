import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

export function CustomerMarketplaceSkeleton() {
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
      {/* Search & Cart Header Skeleton */}
      <View style={styles.searchBarSkeleton} />

      {/* Category Filter Chips Skeleton */}
      <View style={styles.chipsRow}>
        <View style={[styles.chipSkeleton, { width: 90 }]} />
        <View style={[styles.chipSkeleton, { width: 110 }]} />
        <View style={[styles.chipSkeleton, { width: 85 }]} />
        <View style={[styles.chipSkeleton, { width: 100 }]} />
      </View>

      {/* 2-Column Product Grid Skeleton */}
      <View style={styles.gridRow}>
        <View style={styles.productCardSkeleton} />
        <View style={styles.productCardSkeleton} />
      </View>

      <View style={styles.gridRow}>
        <View style={styles.productCardSkeleton} />
        <View style={styles.productCardSkeleton} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingTop: 8,
  },
  searchBarSkeleton: {
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
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  productCardSkeleton: {
    flex: 1,
    height: 220,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
});
