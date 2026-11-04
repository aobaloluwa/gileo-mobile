import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

export function CustomerHomeSkeleton() {
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
      {/* Header Profile Skeleton */}
      <View style={styles.headerSkeleton}>
        <View style={styles.avatarSkeleton} />
        <View style={styles.headerTextColumn}>
          <View style={styles.greetingSkeleton} />
          <View style={styles.subGreetingSkeleton} />
        </View>
        <View style={styles.iconBtnSkeleton} />
      </View>

      {/* Hero Banner Skeleton */}
      <View style={styles.heroBannerSkeleton} />

      {/* Quick Services Row Skeleton */}
      <View style={styles.chipsRow}>
        <View style={[styles.chipSkeleton, { width: 90 }]} />
        <View style={[styles.chipSkeleton, { width: 100 }]} />
        <View style={[styles.chipSkeleton, { width: 85 }]} />
        <View style={[styles.chipSkeleton, { width: 110 }]} />
      </View>

      {/* Featured Care Services Section */}
      <View style={styles.sectionHeaderSkeleton}>
        <View style={styles.sectionTitleSkeleton} />
        <View style={styles.sectionLinkSkeleton} />
      </View>
      <View style={styles.serviceCardSkeleton} />
      <View style={styles.serviceCardSkeleton} />

      {/* Store Highlights Section */}
      <View style={styles.sectionHeaderSkeleton}>
        <View style={styles.sectionTitleSkeleton} />
        <View style={styles.sectionLinkSkeleton} />
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
    gap: 16,
    paddingTop: 8,
  },
  headerSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarSkeleton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E2E8F0',
  },
  headerTextColumn: {
    flex: 1,
    gap: 6,
  },
  greetingSkeleton: {
    width: 140,
    height: 18,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  subGreetingSkeleton: {
    width: 100,
    height: 14,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  iconBtnSkeleton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E2E8F0',
  },
  heroBannerSkeleton: {
    width: '100%',
    height: 140,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chipSkeleton: {
    height: 36,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
  },
  sectionHeaderSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  sectionTitleSkeleton: {
    width: 160,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  sectionLinkSkeleton: {
    width: 60,
    height: 16,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  serviceCardSkeleton: {
    width: '100%',
    height: 110,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  productCardSkeleton: {
    flex: 1,
    height: 180,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
});
