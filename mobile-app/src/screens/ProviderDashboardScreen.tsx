import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';
import { api } from '../api/client';
import * as ordersApi from '../api/orders';
import * as catalogApi from '../api/catalog';
import { useSession } from '../store/session';

export function ProviderDashboardScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, radius, typography), [colors, spacing, radius, typography]);
  const { user } = useSession();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      api
        .get('/services')
        .then(async (res) => {
          if (cancelled) return;
          const mine = res.data.data.filter((s: any) => s.providerId === user?.id);
          setServices(mine);
          const perService = await Promise.all(
            mine.map((s: any) =>
              ordersApi.fetchServiceBookings(s.id).then((list: any[]) => list.map((b) => ({ ...b, serviceTitle: s.title })))
            )
          );
          if (cancelled) return;
          const merged = perService.flat().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setBookings(merged);
          if (mine.length > 0) {
            const data = await catalogApi.fetchProviderAnalytics();
            if (cancelled) return;
            setAnalytics(data);
          }
        })
        .finally(() => !cancelled && setLoading(false));
      return () => {
        cancelled = true;
      };
    }, [user?.id])
  );

  async function setStatus(bookingId: string, status: string) {
    await ordersApi.updateBookingStatus(bookingId, status);
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status } : b)));
  }

  if (loading) return <EmptyState message="Chargement..." />;

  if (services.length === 0) {
    return (
      <View style={styles.noService}>
        <EmptyState message="Tu n'as pas encore de service." />
        <Button label="Créer mon premier service" onPress={() => navigation.navigate('ServiceForm')} />
      </View>
    );
  }

  const pendingCount = analytics?.pendingBookings ?? bookings.filter((b) => b.status === 'pending').length;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={bookings}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bookingService}>{item.serviceTitle}</Text>
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
      ListEmptyComponent={<EmptyState message="Aucune réservation pour le moment." />}
      ListHeaderComponent={
        <>
          <Text style={styles.title}>Dashboard prestataire</Text>

          <View style={styles.statsRow}>
            <Stat label="En attente" value={pendingCount} styles={styles} />
            <Stat label="Revenu du jour" value={`${analytics?.revenueToday ?? 0} DJF`} styles={styles} />
            <Stat label="Revenu total" value={`${analytics?.revenueTotal ?? 0} DJF`} styles={styles} />
            <Stat label="Services actifs" value={analytics?.activeServices ?? services.length} styles={styles} />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mes services</Text>
            <Pressable style={styles.addButton} onPress={() => navigation.navigate('ServiceForm')}>
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={styles.addButtonText}>Ajouter</Text>
            </Pressable>
          </View>

          {services.map((s) => (
            <Pressable key={s.id} style={styles.serviceRow} onPress={() => navigation.navigate('ServiceForm', { serviceId: s.id })}>
              <View style={{ flex: 1 }}>
                <Text style={styles.serviceName}>{s.title}</Text>
                <Text style={styles.serviceMeta}>{s.price} DJF · {s.priceUnit}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          ))}

          <Text style={styles.sectionTitle}>Réservations</Text>
        </>
      }
    />
  );
}

function Stat({ label, value, styles }: { label: string; value: any; styles: any }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function makeStyles(
  theme: Palette,
  spacing: { xs: number; sm: number; md: number; lg: number; xxl: number },
  radius: { sm: number },
  typography: { fontFamily: Record<string, string>; size: Record<string, number> }
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    content: { padding: 20, paddingTop: 60, paddingBottom: spacing.xxl },
    noService: { flex: 1, backgroundColor: theme.background, padding: 20, paddingTop: 100, gap: spacing.lg },
    title: { fontSize: 20, fontFamily: typography.fontFamily.headingBold, color: theme.text, marginBottom: 16 },
    statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    stat: {
      flexBasis: '47%',
      flexGrow: 1,
      backgroundColor: theme.surface,
      borderRadius: radius.sm + 4,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    statValue: { fontSize: typography.size.lg - 2, fontFamily: typography.fontFamily.bodySemiBold, color: theme.primary },
    statLabel: { fontSize: typography.size.xs - 1, fontFamily: typography.fontFamily.body, color: theme.muted, marginTop: 4 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    sectionTitle: { fontSize: typography.size.md, fontFamily: typography.fontFamily.heading, color: theme.text, marginBottom: 12 },
    addButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    addButtonText: { fontSize: typography.size.xs + 1, fontFamily: typography.fontFamily.bodySemiBold, color: theme.primary },
    serviceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    serviceName: { fontSize: typography.size.sm + 1, fontFamily: typography.fontFamily.bodySemiBold, color: theme.text },
    serviceMeta: { fontSize: typography.size.xs, fontFamily: typography.fontFamily.body, color: theme.muted, marginTop: 2 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    bookingService: { fontSize: typography.size.xs, fontFamily: typography.fontFamily.bodySemiBold, color: theme.primary, marginBottom: 2 },
    notes: { fontSize: typography.size.md - 2, fontFamily: typography.fontFamily.body, color: theme.text, marginBottom: 4 },
    actions: { flexDirection: 'row', gap: 12 },
    accept: { fontSize: typography.size.xs, fontFamily: typography.fontFamily.bodySemiBold, color: theme.success },
    cancel: { fontSize: typography.size.xs, fontFamily: typography.fontFamily.bodySemiBold, color: theme.danger },
  });
}
