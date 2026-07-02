import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme/theme';

const COLORS: Record<string, string> = {
  pending: theme.muted,
  accepted: theme.secondary,
  preparing: theme.secondary,
  delivered: theme.success,
  completed: theme.success,
  cancelled: theme.danger,
};

export function StatusBadge({ status }: { status: string }) {
  const color = COLORS[status] || theme.muted;
  return (
    <View style={[styles.badge, { backgroundColor: color + '22' }]}>
      <Text style={[styles.text, { color }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start' },
  text: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
});
