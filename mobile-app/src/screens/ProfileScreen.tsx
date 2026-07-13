import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useTheme, ThemePreference } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';
import { Button } from '../components/Button';
import { useSession } from '../store/session';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Clair' },
  { value: 'dark', label: 'Sombre' },
  { value: 'system', label: 'Système' },
];

export function ProfileScreen() {
  const { colors, spacing, radius, typography, preference, setPreference } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, radius, typography), [colors, spacing, radius, typography]);
  const { user, clearSession } = useSession();
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user?.fullName?.charAt(0).toUpperCase() || '?'}</Text>
      </View>
      <Text style={styles.name}>{user?.fullName}</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <Text style={styles.role}>{user?.role}</Text>

      <View style={styles.themeSection}>
        <Text style={styles.themeLabel}>Apparence</Text>
        <View style={styles.themeRow}>
          {OPTIONS.map((opt) => {
            const active = preference === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setPreference(opt.value)}
                style={[styles.themeChip, active && styles.themeChipActive]}
              >
                <Text style={[styles.themeChipText, active && styles.themeChipTextActive]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.menuSection}>
        <Pressable style={styles.menuRow} onPress={() => navigation.navigate('History')}>
          <Ionicons name="time-outline" size={20} color={colors.text} />
          <Text style={styles.menuLabel}>Historique</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>
        <Pressable style={styles.menuRow} onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={20} color={colors.text} />
          <Text style={styles.menuLabel}>Notifications</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>
      </View>

      <View style={{ marginTop: 24, width: '100%' }}>
        <Button label="Se déconnecter" variant="secondary" onPress={clearSession} />
      </View>
    </View>
  );
}

function makeStyles(
  theme: Palette,
  spacing: { xs: number; sm: number; md: number },
  radius: { sm: number; pill: number },
  typography: { fontFamily: Record<string, string>; size: Record<string, number> }
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background, padding: 20, paddingTop: 80, alignItems: 'center' },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.primary + '22',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    avatarText: { fontSize: 32, fontFamily: typography.fontFamily.headingBold, color: theme.primary },
    name: { fontSize: 20, fontFamily: typography.fontFamily.headingBold, color: theme.text },
    email: { fontSize: typography.size.md - 2, fontFamily: typography.fontFamily.body, color: theme.muted, marginTop: 4 },
    role: {
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.bodySemiBold,
      color: theme.primary,
      marginTop: 4,
      textTransform: 'uppercase',
    },
    themeSection: { width: '100%', marginTop: 32 },
    themeLabel: {
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.bodySemiBold,
      color: theme.muted,
      marginBottom: spacing.sm,
    },
    themeRow: { flexDirection: 'row', gap: spacing.sm },
    themeChip: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.sm + 2,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
    },
    themeChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
    themeChipText: { fontSize: typography.size.sm, fontFamily: typography.fontFamily.bodySemiBold, color: theme.text },
    themeChipTextActive: { color: '#fff' },
    menuSection: { width: '100%', marginTop: spacing.md + 8 },
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm + 4,
      paddingVertical: spacing.sm + 6,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    menuLabel: { flex: 1, fontSize: typography.size.sm + 1, fontFamily: typography.fontFamily.bodyMedium, color: theme.text },
  });
}
