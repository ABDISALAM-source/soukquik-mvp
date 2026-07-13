import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { api } from '../api/client';
import * as ordersApi from '../api/orders';
import { useSession } from '../store/session';

// NOTE MVP : on suppose un seul service principal par prestataire pour cet écran
// (simplification volontaire, voir docs/16_SERVICE_PROVIDER_DASHBOARD.md)
export function ProviderDashboardScreen() {
  const { colors, radius, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, radius, typography), [colors, radius, typography]);
  const { user } = useSession();
  const [service, setService] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    api.get('/services').then(async (res) => {
      const mine = res.data.data.find((s: any) => s.providerId === user?.id);
      setService(mine || null);
      if (mine) {
        const data = await ordersApi.fetchServiceBookings(mine.id);
        setBookings(data);
      }
    });
  }, []);

  async function setStatus(bookingId: string, status: string) {
    await ordersApi.updateBookingStatus(bookingId, status);
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status } : b)));
  }

  if (!service) return <EmptyState message="Créez d'abord votre service pour voir le dashboard." />;

  const pendingCount = bookings.filter((b) => b.status === 'pending').length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard — {service.title}</Text>

      <View style={styles.statsRow}>
        <Stat label="En attente" value={pendingCount} />
        <Stat label="Total réservations" value={bookings.length} />
        <Stat label="Prix" value={`${service.price} DJF`} />
      </View>

      <Text style={styles.sectionTitle}>Réservations</Text>
      {bookings.length === 0 ? (
        <EmptyState message="Aucune réservation pour le moment." />
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.notes} numberOfLines={2}>{item.notes || 'Sans précision'}</Text>
                <StatusBadge status={item.status} />
              </View>
              {item.status === 'pending' && (
                <View style={styles.actions}>
                  <Text style={styles.accept} onPress={() => setStatus(item.id, 'accepted')}>Accepter</Text>
                  <Text style={styles.cancel} onPress={() => setStatus(item.id, 'cancelled')}>Refuser</Text>
                </View>
              )}
              {item.status === 'accepted' && (
                <Text style={styles.accept} onPress={() => setStatus(item.id, 'completed')}>Terminer</Text>
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
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    notes: { fontSize: typography.size.md - 2, fontFamily: typography.fontFamily.body, color: theme.text, marginBottom: 4 },
    actions: { flexDirection: 'row', gap: 12 },
    accept: { fontSize: typography.size.xs, fontFamily: typography.fontFamily.bodySemiBold, color: theme.success },
    cancel: { fontSize: typography.size.xs, fontFamily: typography.fontFamily.bodySemiBold, color: theme.danger },
  });
}
