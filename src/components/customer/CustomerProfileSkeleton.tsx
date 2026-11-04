import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

export function CustomerProfileSkeleton() {
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
      {/* Profile Hero Card Skeleton */}
      <View style={styles.heroSkeleton} />

      {/* Metrics Row Skeleton */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCardSkeleton} />
        <View style={styles.metricCardSkeleton} />
      </View>

      {/* Account Menu Items Skeleton */}
      <View style={styles.menuItemSkeleton} />
      <View style={styles.menuItemSkeleton} />
      <View style={styles.menuItemSkeleton} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingTop: 8,
  },
  heroSkeleton: {
    width: '100%',
    height: 110,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCardSkeleton: {
    flex: 1,
    height: 76,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
  },
  menuItemSkeleton: {
    width: '100%',
    height: 56,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
});
