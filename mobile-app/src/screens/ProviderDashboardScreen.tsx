import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme/theme';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { api } from '../api/client';
import * as ordersApi from '../api/orders';
import { useSession } from '../store/session';

// NOTE MVP : on suppose un seul service principal par prestataire pour cet écran
// (simplification volontaire, voir docs/16_SERVICE_PROVIDER_DASHBOARD.md)
export function ProviderDashboardScreen() {
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
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, padding: 20, paddingTop: 60 },
  title: { fontSize: 20, fontWeight: '800', color: theme.text, marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  stat: { flex: 1, backgroundColor: theme.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.border },
  statValue: { fontSize: 18, fontWeight: '800', color: theme.primary },
  statLabel: { fontSize: 11, color: theme.muted, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  notes: { fontSize: 14, color: theme.text, marginBottom: 4 },
  actions: { flexDirection: 'row', gap: 12 },
  accept: { fontSize: 12, color: theme.success, fontWeight: '700' },
  cancel: { fontSize: 12, color: theme.danger, fontWeight: '700' },
});
