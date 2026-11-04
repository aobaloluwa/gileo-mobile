import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

export function CustomerServicesSkeleton() {
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
      {/* Search Input Skeleton */}
      <View style={styles.searchSkeleton} />

      {/* Active Request Banner Skeleton */}
      <View style={styles.activeRequestSkeleton} />

      {/* Service Item Cards Skeletons */}
      <View style={styles.serviceCardSkeleton} />
      <View style={styles.serviceCardSkeleton} />
      <View style={styles.serviceCardSkeleton} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingTop: 8,
  },
  searchSkeleton: {
    width: '100%',
    height: 48,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  activeRequestSkeleton: {
    width: '100%',
    height: 90,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  serviceCardSkeleton: {
    width: '100%',
    height: 140,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
});
