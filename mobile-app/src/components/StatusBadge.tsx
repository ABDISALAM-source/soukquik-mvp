import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export function StatusBadge({ status }: { status: string }) {
  const { colors, spacing, radius, typography } = useTheme();
  const styles = useMemo(() => makeStyles(spacing, radius, typography), [spacing, radius, typography]);

  const colorsMap: Record<string, string> = {
    pending: colors.muted,
    accepted: colors.secondary,
    preparing: colors.secondary,
    delivered: colors.success,
    completed: colors.success,
    cancelled: colors.danger,
  };
  const color = colorsMap[status] || colors.muted;

  return (
    <View style={[styles.badge, { backgroundColor: color + '22' }]}>
      <Text style={[styles.text, { color }]}>{status}</Text>
    </View>
  );
}

function makeStyles(
  spacing: { xs: number; sm: number },
  radius: { pill: number },
  typography: { fontFamily: Record<string, string>; size: Record<string, number> }
) {
  return StyleSheet.create({
    badge: {
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      alignSelf: 'flex-start',
    },
    text: {
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.bodySemiBold,
      textTransform: 'capitalize',
    },
  });
}
