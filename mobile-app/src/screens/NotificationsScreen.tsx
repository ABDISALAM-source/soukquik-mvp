import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import * as notificationsApi from '../api/notifications';
import type { AppNotification } from '../api/notifications';

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  order_status_changed: 'bag-check',
  booking_status_changed: 'calendar',
};

const LABELS: Record<string, (payload: any) => string> = {
  order_status_changed: (p) => `Ta commande chez ${p.shopName ?? 'la boutique'} est maintenant "${p.status}".`,
  booking_status_changed: (p) => `Ta réservation pour "${p.serviceTitle ?? 'ce service'}" est maintenant "${p.status}".`,
};

// Statuts qui déclenchent une proposition d'avis : la prestation/livraison est terminée.
const REVIEW_TRIGGERS: Record<string, string[]> = {
  order_status_changed: ['delivered'],
  booking_status_changed: ['completed'],
};

export function NotificationsScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, radius, typography), [colors, spacing, radius, typography]);
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    notificationsApi
      .fetchNotifications()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function openNotification(n: AppNotification) {
    if (!n.readAt) {
      notificationsApi.markNotificationRead(n.id).catch(() => {});
      setItems((prev) => prev.map((it) => (it.id === n.id ? { ...it, readAt: new Date().toISOString() } : it)));
    }

    const triggers = REVIEW_TRIGGERS[n.type];
    const shouldPromptReview = triggers?.includes(n.payload?.status);

    if (n.type === 'order_status_changed' && n.payload?.shopId) {
      if (shouldPromptReview) {
        Alert.alert('Commande livrée', 'Veux-tu laisser un avis sur cette boutique ?', [
          { text: 'Plus tard', style: 'cancel', onPress: () => navigation.navigate('Shop', { shopId: n.payload.shopId }) },
          { text: 'Laisser un avis', onPress: () => navigation.navigate('Shop', { shopId: n.payload.shopId }) },
        ]);
      } else {
        navigation.navigate('Shop', { shopId: n.payload.shopId });
      }
      return;
    }

    if (n.type === 'booking_status_changed' && n.payload?.serviceId) {
      if (shouldPromptReview) {
        Alert.alert('Service terminé', 'Veux-tu laisser un avis sur ce prestataire ?', [
          { text: 'Plus tard', style: 'cancel', onPress: () => navigation.navigate('Service', { serviceId: n.payload.serviceId }) },
          { text: 'Laisser un avis', onPress: () => navigation.navigate('Service', { serviceId: n.payload.serviceId }) },
        ]);
      } else {
        navigation.navigate('Service', { serviceId: n.payload.serviceId });
      }
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>

      {loading ? (
        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={64} />
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState message="Aucune notification pour le moment." />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          renderItem={({ item }) => {
            const label = LABELS[item.type]?.(item.payload) ?? item.type;
            const icon = ICONS[item.type] ?? 'notifications';
            return (
              <Pressable style={styles.row} onPress={() => openNotification(item)}>
                {!item.readAt && <View style={styles.unreadDot} />}
                <View style={styles.iconWrap}>
                  <Ionicons name={icon} size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, !item.readAt && styles.labelUnread]}>{label}</Text>
                  <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
                </View>
              </Pressable>
            );
          }}
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
    unreadDot: { position: 'absolute', left: 8, top: '50%', width: 6, height: 6, borderRadius: 3, backgroundColor: theme.primary },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: theme.primary + '1a',
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: { fontSize: typography.size.sm + 1, fontFamily: typography.fontFamily.body, color: theme.text },
    labelUnread: { fontFamily: typography.fontFamily.bodySemiBold },
    date: { fontSize: typography.size.xs, fontFamily: typography.fontFamily.body, color: theme.muted, marginTop: 2 },
  });
}
