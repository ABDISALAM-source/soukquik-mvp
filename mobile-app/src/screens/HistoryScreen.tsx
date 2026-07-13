import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { StatusBadge } from '../components/StatusBadge';
import * as ordersApi from '../api/orders';

interface HistoryItem {
  id: string;
  kind: 'order' | 'booking';
  title: string;
  status: string;
  createdAt: string;
  navTarget: { screen: string; params: Record<string, string> };
}

export function HistoryScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, radius, typography), [colors, spacing, radius, typography]);
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      Promise.all([ordersApi.fetchMyOrders(), ordersApi.fetchMyBookings()])
        .then(([orders, bookings]) => {
          if (cancelled) return;
          const orderItems: HistoryItem[] = orders.map((o: any) => ({
            id: o.id,
            kind: 'order' as const,
            title: `Commande · ${o.shopName ?? 'Boutique'}`,
            status: o.status,
            createdAt: o.createdAt,
            navTarget: { screen: 'Shop', params: { shopId: o.shopId } },
          }));
          const bookingItems: HistoryItem[] = bookings.map((b: any) => ({
            id: b.id,
            kind: 'booking' as const,
            title: `Réservation · ${b.serviceTitle ?? 'Service'}`,
            status: b.status,
            createdAt: b.createdAt,
            navTarget: { screen: 'Service', params: { serviceId: b.serviceId } },
          }));
          const merged = [...orderItems, ...bookingItems].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setItems(merged);
        })
        .finally(() => !cancelled && setLoading(false));
      return () => {
        cancelled = true;
      };
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historique</Text>

      {loading ? (
        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={72} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState message="Aucune commande ou réservation pour le moment." />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => `${item.kind}-${item.id}`}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => navigation.navigate(item.navTarget.screen, item.navTarget.params)}
            >
              <View style={styles.iconWrap}>
                <Ionicons name={item.kind === 'order' ? 'bag' : 'calendar'} size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
              <StatusBadge status={item.status} />
            </Pressable>
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
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm + 4,
      paddingHorizontal: spacing.lg - 4,
      paddingVertical: spacing.sm + 4,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: theme.primary + '1a',
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemTitle: { fontSize: typography.size.sm + 1, fontFamily: typography.fontFamily.bodySemiBold, color: theme.text },
    date: { fontSize: typography.size.xs, fontFamily: typography.fontFamily.body, color: theme.muted, marginTop: 2 },
  });
}
