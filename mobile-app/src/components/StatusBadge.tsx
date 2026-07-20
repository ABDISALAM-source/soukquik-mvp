import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useTheme } from '../theme/ThemeContext';

// Métadonnées par statut : libellé FR + icône + tonalité de couleur. Couvre les
// statuts commandes ET réservations. Un statut inconnu retombe sur un affichage
// neutre (le statut brut) plutôt que de casser l'UI.
type Meta = { label: string; icon: keyof typeof Ionicons.glyphMap; tone: 'muted' | 'warning' | 'info' | 'success' | 'danger' };

const MAP: Record<string, Meta> = {
  pending: { label: 'En attente', icon: 'time-outline', tone: 'warning' },
  confirmed: { label: 'Confirmée', icon: 'checkmark-circle-outline', tone: 'info' },
  accepted: { label: 'Acceptée', icon: 'checkmark-circle-outline', tone: 'info' },
  preparing: { label: 'En préparation', icon: 'construct-outline', tone: 'info' },
  ready: { label: 'Prête', icon: 'bag-check-outline', tone: 'info' },
  delivering: { label: 'En livraison', icon: 'bicycle-outline', tone: 'info' },
  delivered: { label: 'Livrée', icon: 'checkmark-done-outline', tone: 'success' },
  completed: { label: 'Terminée', icon: 'checkmark-done-outline', tone: 'success' },
  cancelled: { label: 'Annulée', icon: 'close-circle-outline', tone: 'danger' },
  rejected: { label: 'Refusée', icon: 'close-circle-outline', tone: 'danger' },
  // Statuts de promotion (dashboard admin)
  active: { label: 'Active', icon: 'megaphone-outline', tone: 'success' },
  expired: { label: 'Expirée', icon: 'time-outline', tone: 'muted' },
};

export function StatusBadge({ status }: { status: string }) {
  const { colors, spacing, radius, typography } = useTheme();
  const styles = useMemo(() => makeStyles(spacing, radius, typography), [spacing, radius, typography]);

  const meta = MAP[status];
  const toneColor: Record<Meta['tone'], string> = {
    muted: colors.muted,
    warning: colors.warning,
    info: colors.secondary,
    success: colors.success,
    danger: colors.danger,
  };
  const color = meta ? toneColor[meta.tone] : colors.muted;
  const label = meta?.label ?? status;

  return (
    <View style={[styles.badge, { backgroundColor: color + '1F', borderColor: color + '40' }]}>
      {meta ? (
        <Ionicons name={meta.icon} size={12} color={color} />
      ) : (
        <View style={[styles.dot, { backgroundColor: color }]} />
      )}
      <Text style={[styles.text, { color }]}>{label}</Text>
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
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      borderWidth: 1,
      alignSelf: 'flex-start',
    },
    dot: { width: 6, height: 6, borderRadius: 3 },
    text: {
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.bodySemiBold,
      textTransform: 'capitalize',
    },
  });
}
