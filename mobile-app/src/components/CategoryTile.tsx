import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';

// Palette cyclique : la table categories n'a pas de champ couleur, donc on
// dérive une teinte par position pour un rendu varié façon maquette.
const TILE_COLORS = ['#8B5CF6', '#2563EB', '#F59E0B', '#4C1D95', '#B45309', '#DB2777', '#0F766E'];

export interface CategoryTileProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  index?: number;
  onPress?: () => void;
}

export function CategoryTile({ label, icon, index = 0, onPress }: CategoryTileProps) {
  const { colors, spacing, radius, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, radius, typography), [colors, spacing, radius, typography]);
  const tileColor = TILE_COLORS[index % TILE_COLORS.length];

  return (
    <Pressable onPress={onPress} style={styles.wrapper}>
      <View style={[styles.tile, { backgroundColor: tileColor }]}>
        <Ionicons name={icon} size={22} color="#fff" />
      </View>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

function makeStyles(
  theme: Palette,
  spacing: { xs: number; sm: number },
  radius: { md: number },
  typography: { fontFamily: Record<string, string>; size: Record<string, number> }
) {
  return StyleSheet.create({
    wrapper: { width: 72, alignItems: 'center', marginRight: spacing.sm + 4 },
    tile: {
      width: 56,
      height: 56,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      marginTop: spacing.xs + 2,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.bodyMedium,
      color: theme.text,
      textAlign: 'center',
    },
  });
}
