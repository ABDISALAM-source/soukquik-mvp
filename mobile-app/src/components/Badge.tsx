import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme, spacing, radius, typography } from '../theme/theme';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'accent' | 'sponsored';
}

/** Pill générique (tags catégorie, "Sponsorisé"...). Distinct de StatusBadge qui reste dédié aux statuts commande/réservation. */
export function Badge({ label, variant = 'default' }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[variant]]}>
      <Text style={[styles.text, variant !== 'default' && styles.textOnColor]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  default: { backgroundColor: theme.border },
  accent: { backgroundColor: theme.primary },
  sponsored: { backgroundColor: theme.secondary },
  text: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontFamily.bodySemiBold,
    color: theme.text,
  },
  textOnColor: { color: '#fff' },
});
