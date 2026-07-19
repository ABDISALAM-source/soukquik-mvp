import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';
import { EmptyState } from '../components/EmptyState';
import { FormHeader } from '../components/FormHeader';
import { Skeleton } from '../components/Skeleton';
import { StatusBadge } from '../components/StatusBadge';
import * as promotionsApi from '../api/promotions';
import type { Promotion } from '../api/promotions';

const STATUS_ORDER: Record<string, number> = { pending: 0, active: 1, expired: 2 };

export function AdminDashboardScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, radius, typography), [colors, spacing, radius, typography]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    promotionsApi
      .fetchAllPromotions()
      .then((rows) => setPromotions([...rows].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function decide(promo: Promotion, status: 'active' | 'expired') {
    setBusyId(promo.id);
    try {
      await promotionsApi.updatePromotionStatus(promo.id, status);
      setPromotions((prev) => prev.map((p) => (p.id === promo.id ? { ...p, status } : p)));
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setBusyId(null);
    }
  }

  const pendingCount = promotions.filter((p) => p.status === 'pending').length;

  return (
    <View style={styles.container}>
      <FormHeader title="Modération" subtitle={`${pendingCount} promotion${pendingCount > 1 ? 's' : ''} en attente`} />

      {loading ? (
        <View style={{ padding: spacing.md, gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={84} />
          ))}
        </View>
      ) : promotions.length === 0 ? (
        <EmptyState icon="megaphone-outline" title="Aucune promotion" message="Les demandes de promotion des vendeurs apparaîtront ici." />
      ) : (
        <FlatList
          data={promotions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl }}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.rowTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.targetName ?? item.targetType}</Text>
                  <Text style={styles.meta}>
                    {item.targetType} · {item.budget} DJF · par {item.ownerName ?? 'inconnu'}
                  </Text>
                  <Text style={styles.meta}>
                    {item.impressions} vues · {item.clicks} clics
                  </Text>
                </View>
                <StatusBadge status={item.status} />
              </View>

              {item.status === 'pending' && (
                <View style={styles.actions}>
                  <Pressable
                    style={[styles.actionButton, styles.approve]}
                    disabled={busyId === item.id}
                    onPress={() => decide(item, 'active')}
                  >
                    <Text style={styles.approveText}>Valider</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionButton, styles.reject]}
                    disabled={busyId === item.id}
                    onPress={() => decide(item, 'expired')}
                  >
                    <Text style={styles.rejectText}>Refuser</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

function makeStyles(
  theme: Palette,
  spacing: { xs: number; sm: number; md: number; lg: number; xxl: number },
  radius: { sm: number; md: number },
  typography: { fontFamily: Record<string, string>; size: Record<string, number> }
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    title: {
      fontSize: 22,
      fontFamily: typography.fontFamily.headingBold,
      color: theme.text,
      paddingHorizontal: spacing.lg - 4,
      paddingTop: 60,
      paddingBottom: spacing.md,
    },
    row: {
      padding: spacing.md,
      backgroundColor: theme.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.border,
    },
    rowTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
    name: { fontSize: typography.size.sm + 1, fontFamily: typography.fontFamily.bodySemiBold, color: theme.text },
    meta: { fontSize: typography.size.xs, fontFamily: typography.fontFamily.body, color: theme.muted, marginTop: 2 },
    actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm + 4 },
    actionButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 4,
      borderRadius: radius.sm,
      borderWidth: 1,
    },
    approve: { borderColor: theme.success, backgroundColor: theme.success + '1a' },
    approveText: { fontSize: typography.size.xs + 1, fontFamily: typography.fontFamily.bodySemiBold, color: theme.success },
    reject: { borderColor: theme.danger, backgroundColor: theme.danger + '1a' },
    rejectText: { fontSize: typography.size.xs + 1, fontFamily: typography.fontFamily.bodySemiBold, color: theme.danger },
  });
}
