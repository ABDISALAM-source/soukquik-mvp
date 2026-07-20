import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';
import { Avatar } from './Avatar';
import { Carousel } from './Carousel';

export interface TrendingItem {
  id: string;
  name: string;
  imageUrl?: string;
  verified?: boolean;
  rating?: number;
  likes?: number;
  /** 0–1 : ratio de démo pour l'anneau de présence (vraie donnée = Phase 8). */
  presenceIntensity?: number;
  presenceCount?: number;
  onPress?: () => void;
}

interface TrendingRowProps {
  items: TrendingItem[];
}

/** Ligne "En ce moment" : logos avec anneau de présence, façon maquette. */
export function TrendingRow({ items }: TrendingRowProps) {
  const { colors, spacing, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, typography), [colors, spacing, typography]);

  return (
    <Carousel
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Pressable onPress={item.onPress} style={styles.item}>
          <Avatar imageUrl={item.imageUrl} name={item.name} size={64} pulseIntensity={item.presenceIntensity} />
          {item.presenceCount !== undefined ? (
            <View style={styles.presenceRow}>
              <Ionicons name="people" size={11} color={colors.muted} />
              <Text style={styles.presenceText}>{item.presenceCount} en ce moment</Text>
            </View>
          ) : null}
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            {item.verified ? <Ionicons name="checkmark-circle" size={13} color={colors.primary} /> : null}
          </View>
          <View style={styles.metaRow}>
            {item.rating !== undefined ? (
              <View style={styles.metaItem}>
                <Ionicons name="star" size={11} color={colors.primary} />
                <Text style={styles.metaText}>{item.rating.toFixed(1)}</Text>
              </View>
            ) : null}
            {item.likes !== undefined ? (
              <View style={styles.metaItem}>
                <Ionicons name="heart" size={11} color={colors.muted} />
                <Text style={styles.metaText}>{item.likes >= 1000 ? `${(item.likes / 1000).toFixed(1)}k` : item.likes}</Text>
              </View>
            ) : null}
          </View>
        </Pressable>
      )}
    />
  );
}

function makeStyles(
  theme: Palette,
  spacing: { xs: number; sm: number; md: number },
  typography: { fontFamily: Record<string, string>; size: Record<string, number> }
) {
  return StyleSheet.create({
    item: { width: 84, marginRight: spacing.md, alignItems: 'center' },
    presenceRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: spacing.xs },
    presenceText: { fontSize: 10, fontFamily: typography.fontFamily.body, color: theme.muted },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: spacing.xs, maxWidth: 84 },
    name: { fontSize: typography.size.xs, fontFamily: typography.fontFamily.bodySemiBold, color: theme.text, flexShrink: 1 },
    metaRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 2 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    metaText: { fontSize: 10, fontFamily: typography.fontFamily.body, color: theme.muted },
  });
}
