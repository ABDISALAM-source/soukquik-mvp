import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { theme, spacing, radius, shadow, typography } from '../theme/theme';

interface CardProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  onPress?: () => void;
  index?: number;
}

export function Card({ title, subtitle, imageUrl, onPress, index = 0 }: CardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.96, { duration: 100 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 100 });
      }}
    >
      <Animated.View
        style={[styles.card, animatedStyle]}
        entering={FadeInDown.duration(350).delay(Math.min(index, 6) * 50)}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={styles.placeholderText}>{title.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    marginRight: spacing.md,
  },
  image: {
    width: 140,
    height: 100,
    borderRadius: radius.md,
    backgroundColor: theme.surface,
    ...shadow.sm,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary + '22',
  },
  placeholderText: {
    fontSize: typography.size.xl,
    fontFamily: typography.fontFamily.headingBold,
    color: theme.primary,
  },
  title: {
    marginTop: spacing.xs + 2,
    fontSize: typography.size.sm,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: theme.text,
  },
  subtitle: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontFamily.body,
    color: theme.muted,
  },
});
