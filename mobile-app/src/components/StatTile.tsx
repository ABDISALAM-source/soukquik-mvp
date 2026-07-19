import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';

// Tuile de statistique : icône teintée + valeur en gros + libellé. Utilisée
// dans les dashboards vendeur / prestataire pour un rendu premium homogène.
export function StatTile({
  icon,
  value,
  label,
  tint,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  tint?: string;
}) {
  const { colors, spacing, radius, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, radius, typography), [colors, spacing, radius, typography]);
  const c = tint ?? colors.primary;
  return (
    <View style={styles.tile}>
      <View style={[styles.iconWrap, { backgroundColor: c + '1e' }]}>
        <Ionicons name={icon} size={17} color={c} />
      </View>
      <Text style={styles.value} numberOfLines={1}>{value}</Text>
      <Text style={styles.label} numberOfLines={2}>{label}</Text>
    </View>
  );
}

function makeStyles(
  theme: Palette,
  spacing: { xs: number; sm: number; md: number },
  radius: { md: number },
  typography: { fontFamily: Record<string, string>; size: Record<string, number> }
) {
  return StyleSheet.create({
    tile: {
      flexBasis: '47%',
      flexGrow: 1,
      backgroundColor: theme.surface,
      borderRadius: radius.md,
      padding: spacing.md - 2,
      borderWidth: 1,
      borderColor: theme.border,
    },
    iconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
    value: { fontSize: typography.size.lg, fontFamily: typography.fontFamily.headingBold, color: theme.text },
    label: { fontSize: typography.size.xs, fontFamily: typography.fontFamily.body, color: theme.muted, marginTop: 2 },
  });
}
