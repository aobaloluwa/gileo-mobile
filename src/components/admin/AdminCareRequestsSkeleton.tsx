import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

export function AdminCareRequestsSkeleton() {
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
      {/* Stats Summary Skeletons */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard} />
        <View style={styles.metricCard} />
        <View style={styles.metricCard} />
      </View>

      {/* Filter Chips Skeleton */}
      <View style={styles.chipsRow}>
        <View style={styles.chipSkeleton} />
        <View style={styles.chipSkeleton} />
        <View style={styles.chipSkeleton} />
        <View style={styles.chipSkeleton} />
      </View>

      {/* Request Cards Skeletons */}
      <View style={styles.cardSkeleton} />
      <View style={styles.cardSkeleton} />
      <View style={styles.cardSkeleton} />
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
    gap: 12,
  },
  metricCard: {
    flex: 1,
    height: 84,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  chipSkeleton: {
    width: 90,
    height: 32,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
  },
  cardSkeleton: {
    width: '100%',
    height: 180,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
});
