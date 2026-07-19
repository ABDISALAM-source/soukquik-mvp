import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useTheme, ThemePreference } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';
import { Button } from '../components/Button';
import { useSession } from '../store/session';

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'light', label: 'Clair', icon: 'sunny-outline' },
  { value: 'dark', label: 'Sombre', icon: 'moon-outline' },
  { value: 'system', label: 'Système', icon: 'phone-portrait-outline' },
];

const ROLE_LABEL: Record<string, string> = {
  client: 'Client', vendor: 'Vendeur', provider: 'Prestataire', admin: 'Administrateur',
};

export function ProfileScreen() {
  const { colors, spacing, radius, shadow, typography, preference, setPreference } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, radius, shadow, typography), [colors, spacing, radius, shadow, typography]);
  const { user, clearSession } = useSession();
  const navigation = useNavigation<any>();

  const role = user?.role ?? 'client';
  const dashTarget =
    role === 'vendor' ? 'VendorDashboard' : role === 'provider' ? 'ProviderDashboard' : role === 'admin' ? 'AdminDashboard' : null;

  type Item = { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void };
  const account: Item[] = [
    { icon: 'time-outline', label: 'Historique', onPress: () => navigation.navigate('History') },
    { icon: 'notifications-outline', label: 'Notifications', onPress: () => navigation.navigate('Notifications') },
  ];
  if (dashTarget) account.unshift({ icon: 'grid-outline', label: 'Mon tableau de bord', onPress: () => navigation.navigate(dashTarget as string) });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Carte de profil */}
      <View style={styles.profileCard}>
        <View style={styles.avatarRing}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.fullName?.charAt(0).toUpperCase() || '?'}</Text>
          </View>
        </View>
        <Text style={styles.name}>{user?.fullName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Ionicons name="ribbon-outline" size={13} color={colors.primary} />
          <Text style={styles.roleText}>{ROLE_LABEL[role] ?? role}</Text>
        </View>
      </View>

      {/* Apparence */}
      <Text style={styles.sectionLabel}>Apparence</Text>
      <View style={styles.themeRow}>
        {THEME_OPTIONS.map((opt) => {
          const active = preference === opt.value;
          return (
            <Pressable key={opt.value} onPress={() => setPreference(opt.value)} style={[styles.themeChip, active && styles.themeChipActive]}>
              <Ionicons name={opt.icon} size={18} color={active ? '#fff' : colors.muted} />
              <Text style={[styles.themeChipText, active && styles.themeChipTextActive]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Compte */}
      <Text style={styles.sectionLabel}>Compte</Text>
      <View style={styles.menuCard}>
        {account.map((it, i) => (
          <Pressable key={it.label} style={[styles.menuRow, i < account.length - 1 && styles.menuDivider]} onPress={it.onPress}>
            <View style={styles.menuIcon}>
              <Ionicons name={it.icon} size={18} color={colors.primary} />
            </View>
            <Text style={styles.menuLabel}>{it.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        ))}
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <Button label="Se déconnecter" variant="secondary" icon="log-out-outline" onPress={clearSession} />
      </View>

      <Text style={styles.version}>SoukQuik · v0.1.0</Text>
    </ScrollView>
  );
}

function makeStyles(
  theme: Palette,
  spacing: { xs: number; sm: number; md: number; lg: number; xl: number },
  radius: { sm: number; md: number; lg: number; pill: number },
  shadow: { sm: object; md: object },
  typography: { fontFamily: Record<string, string>; size: Record<string, number> }
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    content: { padding: spacing.md, paddingTop: 64, paddingBottom: spacing.xl },
    profileCard: {
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.md,
      ...shadow.md,
    },
    avatarRing: {
      width: 96,
      height: 96,
      borderRadius: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.primary,
      marginBottom: spacing.md,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.primary + '22',
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { fontSize: 32, fontFamily: typography.fontFamily.headingBold, color: theme.primary },
    name: { fontSize: typography.size.lg, fontFamily: typography.fontFamily.headingBold, color: theme.text },
    email: { fontSize: typography.size.sm, fontFamily: typography.fontFamily.body, color: theme.muted, marginTop: 3 },
    roleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: spacing.sm,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 5,
      borderRadius: radius.pill,
      backgroundColor: theme.primary + '18',
    },
    roleText: { fontSize: typography.size.xs, fontFamily: typography.fontFamily.bodySemiBold, color: theme.primary, textTransform: 'uppercase', letterSpacing: 0.5 },

    sectionLabel: {
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.bodySemiBold,
      color: theme.muted,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
      marginLeft: spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    themeRow: { flexDirection: 'row', gap: spacing.sm },
    themeChip: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: spacing.sm + 3,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
    },
    themeChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
    themeChipText: { fontSize: typography.size.sm, fontFamily: typography.fontFamily.bodySemiBold, color: theme.text },
    themeChipTextActive: { color: '#fff' },

    menuCard: {
      backgroundColor: theme.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
    },
    menuRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2, paddingVertical: spacing.md - 2, paddingHorizontal: spacing.md },
    menuDivider: { borderBottomWidth: 1, borderBottomColor: theme.border },
    menuIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primary + '14',
    },
    menuLabel: { flex: 1, fontSize: typography.size.md, fontFamily: typography.fontFamily.bodyMedium, color: theme.text },
    version: { textAlign: 'center', color: theme.muted, fontSize: typography.size.xs, marginTop: spacing.lg, fontFamily: typography.fontFamily.body },
  });
}
