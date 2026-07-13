import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';

interface NotificationBellProps {
  count?: number;
  onPress?: () => void;
}

/** Icône cloche + badge de compteur. Le vrai comptage (table `notifications`, Phase 1) est branché en Phase 7. */
export function NotificationBell({ count = 0, onPress }: NotificationBellProps) {
  const { colors, radius, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, radius, typography), [colors, radius, typography]);

  return (
    <Pressable onPress={onPress} hitSlop={8} style={styles.wrapper}>
      <Ionicons name="notifications-outline" size={24} color={colors.text} />
      {count > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function makeStyles(theme: Palette, radius: { pill: number }, typography: { fontFamily: Record<string, string> }) {
  return StyleSheet.create({
    wrapper: { position: 'relative' },
    badge: {
      position: 'absolute',
      top: -4,
      right: -6,
      minWidth: 16,
      height: 16,
      paddingHorizontal: 3,
      borderRadius: radius.pill,
      backgroundColor: theme.danger,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: { fontSize: 9, fontFamily: typography.fontFamily.bodySemiBold, color: '#fff' },
  });
}
