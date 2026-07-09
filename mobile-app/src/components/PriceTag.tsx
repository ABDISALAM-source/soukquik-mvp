import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme, spacing, typography } from '../theme/theme';

interface PriceTagProps {
  price: number;
  originalPrice?: number;
  currency?: string;
  size?: 'sm' | 'md' | 'lg';
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount);
}

export function PriceTag({ price, originalPrice, currency = 'DJF', size = 'md' }: PriceTagProps) {
  const hasDiscount = originalPrice !== undefined && originalPrice > price;

  return (
    <View style={styles.row}>
      <Text style={[styles.price, styles[size], { color: hasDiscount ? theme.danger : theme.text }]}>
        {formatAmount(price)} {currency}
      </Text>
      {hasDiscount ? (
        <Text style={styles.original}>{formatAmount(originalPrice as number)} {currency}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  price: { fontFamily: typography.fontFamily.bodySemiBold },
  sm: { fontSize: typography.size.sm },
  md: { fontSize: typography.size.md },
  lg: { fontSize: typography.size.lg },
  original: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontFamily.body,
    color: theme.muted,
    textDecorationLine: 'line-through',
  },
});
