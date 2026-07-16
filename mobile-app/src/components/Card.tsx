import React, { useEffect, useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';

interface CardProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  onPress?: () => void;
  index?: number;
  likable?: boolean;
  liked?: boolean;
  onToggleLike?: () => void;
  /** Nom de marque, affiché au-dessus du titre (petit texte). */
  brand?: string;
  /** Prix déjà formaté (ex: "295 000 DJF"), affiché en gras sous le titre. Prend le pas sur `subtitle`. */
  price?: string;
  /** Distance déjà formatée (ex: "1.2 km"), avec icône de localisation. */
  distance?: string;
  /** Badge de livraison (ex: "Livraison 30 min" / "En magasin"), pill verte. */
  deliveryBadge?: string;
}

export function Card({
  title,
  subtitle,
  imageUrl,
  onPress,
  index = 0,
  likable,
  liked,
  onToggleLike,
  brand,
  price,
  distance,
  deliveryBadge,
}: CardProps) {
  const { colors, spacing, radius, shadow, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, radius, shadow, typography), [colors, spacing, radius, shadow, typography]);
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

  // Micro-interaction "cœur qui pulse" au like : petit rebond d'échelle.
  const heartScale = useSharedValue(1);
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }] }));
  function pulseHeart() {
    heartScale.value = withTiming(1.4, { duration: 120 }, () => {
      heartScale.value = withTiming(1, { duration: 140 });
    });
  }

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
        <View>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.placeholder]}>
              <Text style={styles.placeholderText}>{title.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          {likable ? (
            <Pressable
              hitSlop={8}
              onPress={(e) => {
                e.stopPropagation();
                pulseHeart();
                onToggleLike?.();
              }}
              style={styles.likeButton}
            >
              <Animated.View style={heartStyle}>
                <Ionicons name={liked ? 'heart' : 'heart-outline'} size={16} color={liked ? colors.danger : '#fff'} />
              </Animated.View>
            </Pressable>
          ) : null}
        </View>
        {brand ? <Text style={styles.brand} numberOfLines={1}>{brand}</Text> : null}
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {price ? (
          <Text style={styles.price} numberOfLines={1}>{price}</Text>
        ) : subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
        ) : null}
        {distance ? (
          <View style={styles.distanceRow}>
            <Ionicons name="location-outline" size={11} color={colors.muted} />
            <Text style={styles.distanceText}>{distance}</Text>
          </View>
        ) : null}
        {deliveryBadge ? (
          <View style={styles.deliveryBadge}>
            <Ionicons name="flash" size={10} color={colors.success} />
            <Text style={styles.deliveryText} numberOfLines={1}>{deliveryBadge}</Text>
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

function makeStyles(
  theme: Palette,
  spacing: { xs: number; sm: number; md: number },
  radius: { sm: number; md: number; pill: number },
  shadow: { md: object },
  typography: { fontFamily: Record<string, string>; size: Record<string, number> }
) {
  return StyleSheet.create({
    card: {
      width: 148,
      marginRight: spacing.md,
      backgroundColor: theme.surface,
      borderRadius: radius.md,
      padding: spacing.sm,
      paddingBottom: spacing.sm + 2,
      ...shadow.md,
    },
    image: {
      width: '100%',
      height: 104,
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
    likeButton: {
      position: 'absolute',
      top: spacing.xs,
      right: spacing.xs,
      width: 26,
      height: 26,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.35)',
    },
    brand: {
      marginTop: spacing.xs + 4,
      fontSize: 10,
      fontFamily: typography.fontFamily.bodyMedium,
      color: theme.muted,
    },
    title: {
      marginTop: 2,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.bodySemiBold,
      color: theme.text,
    },
    price: {
      marginTop: 2,
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
    distanceRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: spacing.xs },
    distanceText: { fontSize: 10, fontFamily: typography.fontFamily.body, color: theme.muted },
    deliveryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 3,
      marginTop: spacing.xs,
      paddingHorizontal: spacing.xs + 2,
      paddingVertical: 2,
      borderRadius: radius.pill,
      backgroundColor: theme.success + '1F',
    },
    deliveryText: { fontSize: 9, fontFamily: typography.fontFamily.bodySemiBold, color: theme.success },
  });
}
