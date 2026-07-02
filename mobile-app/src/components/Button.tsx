import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { theme } from '../theme/theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
}

export function Button({ label, onPress, variant = 'primary', loading, disabled }: Props) {
  const isPrimary = variant === 'primary';
  return (
    <TouchableOpacity
      style={[styles.base, isPrimary ? styles.primary : styles.secondary, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#fff' : theme.primary} />
      ) : (
        <Text style={[styles.text, isPrimary ? styles.textPrimary : styles.textSecondary]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primary: { backgroundColor: theme.primary },
  secondary: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.primary },
  disabled: { opacity: 0.5 },
  text: { fontSize: 15, fontWeight: '700' },
  textPrimary: { color: '#fff' },
  textSecondary: { color: theme.primary },
});
