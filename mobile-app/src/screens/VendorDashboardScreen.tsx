import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { api } from '../api/client';
import * as ordersApi from '../api/orders';
import { useSession } from '../store/session';

// NOTE MVP : on suppose ici une seule boutique par vendeur, récupérée via /shops?ownerId
// (simplification volontaire ; la gestion multi-boutiques est prévue mais pas branchée dans cet écran)
export function VendorDashboardScreen() {
  const { colors, radius, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, radius, typography), [colors, radius, typography]);
  const { user } = useSession();
  const [shop, setShop] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    api.get('/shops').then(async (res) => {
      const mine = res.data.data.find((s: any) => s.ownerId === user?.id);
      setShop(mine || null);
      if (mine) {
        const analyticsRes = await api.get(`/shops/${mine.id}/analytics`);
        setAnalytics(analyticsRes.data.data);
        const ordersData = await ordersApi.fetchShopOrders(mine.id);
        setOrders(ordersData);
      }
    });
  }, []);

  async function advanceStatus(orderId: string, current: string) {
    const flow: Record<string, string> = { pending: 'accepted', accepted: 'preparing', preparing: 'delivered' };
    const next = flow[current];
    if (!next) return;
    await ordersApi.updateOrderStatus(orderId, next);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: next } : o)));
  }

  if (!shop) return <EmptyState message="Créez d'abord votre boutique pour voir le dashboard." />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard — {shop.name}</Text>

      {analytics && (
        <View style={styles.statsRow}>
          <Stat label="Commandes du jour" value={analytics.ordersToday} />
          <Stat label="Revenu total" value={`${analytics.revenueTotal} DJF`} />
          <Stat label="Produits actifs" value={analytics.activeProducts} />
        </View>
      )}

      <Text style={styles.sectionTitle}>Commandes récentes</Text>
      {orders.length === 0 ? (
        <EmptyState message="Aucune commande pour le moment." />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.orderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderAmount}>{item.totalAmount} DJF</Text>
                <StatusBadge status={item.status} />
              </View>
              {item.status !== 'delivered' && item.status !== 'cancelled' && (
                <Text style={styles.advance} onPress={() => advanceStatus(item.id, item.status)}>
                  Faire avancer →
                </Text>
              )}
            </View>
          )}
        />
      )}
    </View>
  );

  function Stat({ label, value }: { label: string; value: any }) {
    return (
      <View style={styles.stat}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    );
  }
}

function makeStyles(
  theme: Palette,
  radius: { sm: number },
  typography: { fontFamily: Record<string, string>; size: Record<string, number> }
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background, padding: 20, paddingTop: 60 },
    title: { fontSize: 20, fontFamily: typography.fontFamily.headingBold, color: theme.text, marginBottom: 16 },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    stat: {
      flex: 1,
      backgroundColor: theme.surface,
      borderRadius: radius.sm + 4,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    statValue: { fontSize: typography.size.lg - 2, fontFamily: typography.fontFamily.bodySemiBold, color: theme.primary },
    statLabel: { fontSize: typography.size.xs - 1, fontFamily: typography.fontFamily.body, color: theme.muted, marginTop: 4 },
    sectionTitle: { fontSize: typography.size.md, fontFamily: typography.fontFamily.heading, color: theme.text, marginBottom: 12 },
    orderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    orderAmount: { fontSize: typography.size.sm + 1, fontFamily: typography.fontFamily.bodySemiBold, color: theme.text, marginBottom: 4 },
    advance: { fontSize: typography.size.xs, fontFamily: typography.fontFamily.bodySemiBold, color: theme.primary },
  });
}
