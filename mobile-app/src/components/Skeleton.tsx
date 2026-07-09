import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { theme, radius } from '../theme/theme';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = radius.sm, style }: SkeletonProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: theme.border },
        animatedStyle,
        style,
      ]}
    />
  );
}

interface SkeletonCardProps {
  count?: number;
}

/** Rangée de skeletons imitant la mise en page de Card, pour les listes horizontales en chargement. */
export function SkeletonCardRow({ count = 4 }: SkeletonCardProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.cardWrapper}>
          <Skeleton width={140} height={100} borderRadius={radius.md} />
          <Skeleton width={100} height={12} style={styles.spacingTop} />
          <Skeleton width={70} height={10} style={styles.spacingTopSmall} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  cardWrapper: { marginRight: 12 },
  spacingTop: { marginTop: 8 },
  spacingTopSmall: { marginTop: 4 },
});
