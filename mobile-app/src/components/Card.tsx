import React, { useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
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
  // Fondu/décalage manuel (opacity + translateY) au montage, plutôt que le
  // prop `entering` de Reanimated : `entering` mesure/repositionne le layout
  // pendant la transition, ce qui perturbe le calcul de largeur d'une
  // FlatList horizontale et forçait les cartes à s'empiler verticalement.
  // Une animation purement transform+opacity n'affecte jamais le layout.
  const mountProgress = useSharedValue(0);

  useEffect(() => {
    mountProgress.value = withTiming(1, { duration: 350 });
  }, [mountProgress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: (1 - mountProgress.value) * 16 }],
    opacity: mountProgress.value,
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
      <Animated.View style={[styles.card, animatedStyle]}>
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
    backgroundColor: theme.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    paddingBottom: spacing.sm + 2,
    ...shadow.md,
  },
  image: {
    width: '100%',
    height: 100,
    borderRadius: radius.sm,
    backgroundColor: theme.background,
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
    marginTop: spacing.xs + 4,
    fontSize: typography.size.sm,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: theme.text,
  },
  subtitle: {
    marginTop: 2,
    fontSize: typography.size.xs,
    fontFamily: typography.fontFamily.body,
    color: theme.muted,
  },
});
