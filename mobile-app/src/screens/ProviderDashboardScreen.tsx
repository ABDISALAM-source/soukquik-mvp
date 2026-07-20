import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';
import { GradientBanner } from '../components/GradientBanner';
import { StatTile } from '../components/StatTile';
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
          {/* HÉRO : revenu du jour + réservations en attente */}
          <GradientBanner style={styles.heroCard} radius={22}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>Tableau de bord</Text>
              <Text style={styles.revenue}>
                {analytics?.revenueToday ?? 0} <Text style={styles.revenueUnit}>DJF</Text>
              </Text>
              <Text style={styles.trendMuted}>Revenu du jour</Text>
            </View>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingValue}>{pendingCount}</Text>
              <Text style={styles.pendingLabel}>en attente</Text>
            </View>
          </GradientBanner>

          <View style={styles.statsRow}>
            <StatTile icon="eye-outline" label="Vues fiche (jour)" value={analytics?.visitsToday ?? 0} tint={colors.success} />
            <StatTile icon="trending-up-outline" label="Vues fiche (7 j)" value={analytics?.visits7d ?? 0} tint={colors.success} />
            <StatTile icon="cash-outline" label="Revenu total" value={`${analytics?.revenueTotal ?? 0} DJF`} />
            <StatTile icon="construct-outline" label="Services actifs" value={analytics?.activeServices ?? services.length} tint="#FF9500" />
          </View>

          <Pressable style={styles.availabilityLink} onPress={() => navigation.navigate('Availability')}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <Text style={styles.availabilityLinkText}>Gérer mes disponibilités</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>

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
    heroCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md + 2, marginBottom: spacing.md + 2 },
    greeting: { fontSize: typography.size.sm, fontFamily: typography.fontFamily.body, color: 'rgba(255,255,255,0.85)', marginBottom: 4 },
    revenue: { fontSize: 32, fontFamily: typography.fontFamily.headingBold, color: '#fff' },
    revenueUnit: { fontSize: 18, color: 'rgba(255,255,255,0.9)', fontFamily: typography.fontFamily.bodySemiBold },
    trendMuted: { fontSize: typography.size.xs + 1, fontFamily: typography.fontFamily.body, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
    pendingBadge: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 16, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2 },
    pendingValue: { fontSize: 26, fontFamily: typography.fontFamily.headingBold, color: '#fff' },
    pendingLabel: { fontSize: typography.size.xs, fontFamily: typography.fontFamily.body, color: 'rgba(255,255,255,0.9)' },
    statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
    availabilityLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.surface,
      borderRadius: radius.sm + 4,
      borderWidth: 1,
      borderColor: theme.border,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginBottom: 24,
    },
    availabilityLinkText: { flex: 1, fontSize: typography.size.sm + 1, fontFamily: typography.fontFamily.bodySemiBold, color: theme.text },
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
