import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme, spacing, typography } from '../theme/theme';

type StarName = 'star' | 'star-half' | 'star-outline';

interface RatingStarsProps {
  rating: number;
  count?: number;
  size?: number;
}

/** Étoiles en lecture seule (moyenne de notes). La variante interactive (laisser un avis) arrive en Phase 3. */
export function RatingStars({ rating, count, size = 14 }: RatingStarsProps) {
  const stars: StarName[] = [1, 2, 3, 4, 5].map((position) => {
    if (rating >= position) return 'star';
    if (rating >= position - 0.5) return 'star-half';
    return 'star-outline';
  });

  return (
    <View style={styles.row}>
      {stars.map((name, i) => (
        <Ionicons key={i} name={name} size={size} color={theme.primary} />
      ))}
      {count !== undefined ? <Text style={styles.count}>({count})</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  count: {
    marginLeft: spacing.xs,
    fontSize: typography.size.xs,
    fontFamily: typography.fontFamily.body,
    color: theme.muted,
  },
});
