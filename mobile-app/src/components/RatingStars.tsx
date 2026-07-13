import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';

type StarName = 'star' | 'star-half' | 'star-outline';

interface RatingStarsProps {
  rating: number;
  count?: number;
  size?: number;
  /** Rend les étoiles tapables (formulaire d'avis, Phase 3) — lecture seule par défaut. */
  onChange?: (rating: number) => void;
}

export function RatingStars({ rating, count, size = 14, onChange }: RatingStarsProps) {
  const { colors, spacing, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, typography), [colors, spacing, typography]);

  const stars: StarName[] = [1, 2, 3, 4, 5].map((position) => {
    if (rating >= position) return 'star';
    if (rating >= position - 0.5) return 'star-half';
    return 'star-outline';
  });

  return (
    <View style={styles.row}>
      {stars.map((name, i) =>
        onChange ? (
          <Pressable key={i} hitSlop={6} onPress={() => onChange(i + 1)}>
            <Ionicons name={name} size={size} color={colors.primary} />
          </Pressable>
        ) : (
          <Ionicons key={i} name={name} size={size} color={colors.primary} />
        )
      )}
      {count !== undefined ? <Text style={styles.count}>({count})</Text> : null}
    </View>
  );
}

function makeStyles(
  theme: Palette,
  spacing: { xs: number },
  typography: { fontFamily: Record<string, string>; size: Record<string, number> }
) {
  return StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    count: {
      marginLeft: spacing.xs,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.body,
      color: theme.muted,
    },
  });
}
