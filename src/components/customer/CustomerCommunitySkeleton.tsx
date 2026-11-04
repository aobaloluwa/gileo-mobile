import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

export function CustomerCommunitySkeleton() {
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
      {/* Sub Tabs Skeleton */}
      <View style={styles.tabsRow}>
        <View style={styles.tabSkeleton} />
        <View style={styles.tabSkeleton} />
        <View style={styles.tabSkeleton} />
      </View>

      {/* Post Creator Box Skeleton */}
      <View style={styles.creatorSkeleton} />

      {/* Post Cards Skeletons */}
      <View style={styles.postCardSkeleton} />
      <View style={styles.postCardSkeleton} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingTop: 8,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabSkeleton: {
    flex: 1,
    height: 38,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
  },
  creatorSkeleton: {
    width: '100%',
    height: 90,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
  },
  postCardSkeleton: {
    width: '100%',
    height: 150,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
});
