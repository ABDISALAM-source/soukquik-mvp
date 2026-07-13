import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';

export interface FilterChipOption {
  value: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface FilterChipsProps {
  options: FilterChipOption[];
  value: string;
  onChange: (value: string) => void;
}

export function FilterChips({ options, value, onChange }: FilterChipsProps) {
  const { colors, spacing, radius, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, radius, typography), [colors, spacing, radius, typography]);

  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable key={opt.value} onPress={() => onChange(opt.value)} style={[styles.chip, active && styles.chipActive]}>
            {opt.icon ? (
              <Ionicons name={opt.icon} size={13} color={active ? colors.primary : colors.muted} style={styles.chipIcon} />
            ) : null}
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function makeStyles(
  theme: Palette,
  spacing: { xs: number; sm: number; md: number; lg: number },
  radius: { pill: number },
  typography: { fontFamily: Record<string, string>; size: Record<string, number> }
) {
  return StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.lg - 4 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md - 2,
      paddingVertical: spacing.xs + 3,
    },
    chipActive: { borderColor: theme.primary, backgroundColor: theme.primarySoft },
    chipIcon: { marginRight: 4 },
    chipText: { fontSize: typography.size.xs + 1, fontFamily: typography.fontFamily.bodyMedium, color: theme.muted },
    chipTextActive: { color: theme.primary, fontFamily: typography.fontFamily.bodySemiBold },
  });
}
