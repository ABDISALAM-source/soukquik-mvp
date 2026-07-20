import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import * as catalogApi from '../api/catalog';
import { useLocationStore } from '../store/location';
import { MAPS_ENABLED } from '../config/maps';

const RADIUS_KM = 15;
const DEFAULT_DELTA = 0.05;

export function MapScreen() {
  const { colors, spacing, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, typography), [colors, spacing, typography]);
  const navigation = useNavigation<any>();
  const coords = useLocationStore((s) => s.coords);
  const status = useLocationStore((s) => s.status);
  const requestLocation = useLocationStore((s) => s.requestLocation);

  const [shops, setShops] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (status === 'unknown') requestLocation();
    }, [status, requestLocation])
  );

  useFocusEffect(
    useCallback(() => {
      if (!coords) return;
      let cancelled = false;
      setLoading(true);
      Promise.all([
        catalogApi.fetchNearbyShops(coords.latitude, coords.longitude, RADIUS_KM),
        catalogApi.fetchNearbyServices(coords.latitude, coords.longitude, RADIUS_KM),
      ])
        .then(([s, sv]) => {
          if (cancelled) return;
          setShops(s);
          setServices(sv);
        })
        .finally(() => !cancelled && setLoading(false));
      return () => {
        cancelled = true;
      };
    }, [coords])
  );

  if (status === 'unknown' || status === 'requesting') {
    return <EmptyState message="Localisation en cours..." />;
  }

  if (status === 'denied') {
    return (
      <View style={styles.center}>
        <Ionicons name="location-outline" size={40} color={colors.muted} />
        <Text style={styles.deniedTitle}>Localisation désactivée</Text>
        <Text style={styles.deniedText}>
          Active la localisation dans les réglages de ton téléphone pour voir les boutiques et prestataires près de toi sur la carte.
        </Text>
        <View style={{ marginTop: spacing.md, width: '60%' }}>
          <Button label="Réessayer" onPress={requestLocation} />
        </View>
      </View>
    );
  }

  if (!coords) return <EmptyState message="Chargement..." />;

  // Repli SANS carte (clé Google Maps absente) : liste des boutiques/services
  // à proximité, triés par distance. Évite le crash natif du MapView.
  if (!MAPS_ENABLED) {
    const items = [
      ...shops.map((s) => ({
        key: `shop-${s.id}`,
        kind: 'shop' as const,
        title: s.name,
        subtitle: s.address ?? 'Boutique',
        distanceKm: s.distanceKm,
        icon: 'storefront' as const,
        onPress: () => navigation.navigate('Shop', { shopId: s.id }),
      })),
      ...services.map((sv) => ({
        key: `service-${sv.id}`,
        kind: 'service' as const,
        title: sv.title,
        subtitle: `${sv.price} DJF · ${sv.priceUnit}`,
        distanceKm: sv.distanceKm,
        icon: 'construct' as const,
        onPress: () => navigation.navigate('Service', { serviceId: sv.id }),
      })),
    ].sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9));

    return (
      <View style={styles.container}>
        <View style={styles.fallbackHeader}>
          <Ionicons name="location" size={18} color={colors.primary} />
          <Text style={styles.fallbackHeaderText}>À proximité ({RADIUS_KM} km)</Text>
        </View>
        {!loading && items.length === 0 ? (
          <EmptyState message={`Rien à proximité dans un rayon de ${RADIUS_KM} km.`} />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(i) => i.key}
            contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
            renderItem={({ item }) => (
              <Pressable style={styles.row} onPress={item.onPress}>
                <View style={styles.rowIcon}>
                  <Ionicons name={item.icon} size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.rowSub} numberOfLines={1}>{item.subtitle}</Text>
                </View>
                {item.distanceKm != null && (
                  <Text style={styles.rowDist}>{item.distanceKm.toFixed(1)} km</Text>
                )}
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </Pressable>
            )}
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: DEFAULT_DELTA,
          longitudeDelta: DEFAULT_DELTA,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {shops.map((s) => (
          <Marker
            key={`shop-${s.id}`}
            coordinate={{ latitude: s.latitude, longitude: s.longitude }}
            title={s.name}
            description={s.address ?? undefined}
            pinColor={colors.primary}
            onPress={() => navigation.navigate('Shop', { shopId: s.id })}
          />
        ))}
        {services.map((sv) => (
          <Marker
            key={`service-${sv.id}`}
            coordinate={{ latitude: sv.latitude, longitude: sv.longitude }}
            title={sv.title}
            description={`${sv.price} DJF · ${sv.priceUnit}`}
            pinColor={colors.secondary}
            onPress={() => navigation.navigate('Service', { serviceId: sv.id })}
          />
        ))}
      </MapView>

      {loading && (
        <View style={styles.loadingBadge}>
          <Text style={styles.loadingText}>Recherche à proximité...</Text>
        </View>
      )}

      {!loading && shops.length === 0 && services.length === 0 && (
        <View style={styles.emptyBadge}>
          <Text style={styles.loadingText}>Rien à proximité dans un rayon de {RADIUS_KM} km.</Text>
        </View>
      )}
    </View>
  );
}

function makeStyles(
  theme: Palette,
  spacing: { xs: number; sm: number; md: number; lg: number },
  typography: { fontFamily: Record<string, string>; size: Record<string, number> }
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    map: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, backgroundColor: theme.background },
    deniedTitle: { fontSize: typography.size.md + 1, fontFamily: typography.fontFamily.bodySemiBold, color: theme.text, marginTop: spacing.md },
    deniedText: {
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.body,
      color: theme.muted,
      textAlign: 'center',
      marginTop: spacing.xs + 2,
    },
    loadingBadge: {
      position: 'absolute',
      top: 60,
      alignSelf: 'center',
      backgroundColor: theme.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
    },
    emptyBadge: {
      position: 'absolute',
      bottom: 30,
      alignSelf: 'center',
      backgroundColor: theme.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
    },
    loadingText: { fontSize: typography.size.xs + 1, fontFamily: typography.fontFamily.bodyMedium, color: theme.text },
    fallbackHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.xs,
    },
    fallbackHeaderText: { fontSize: typography.size.md, fontFamily: typography.fontFamily.bodySemiBold, color: theme.text },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      padding: spacing.sm + 2,
    },
    rowIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primary + '1a',
    },
    rowTitle: { fontSize: typography.size.md, fontFamily: typography.fontFamily.bodySemiBold, color: theme.text },
    rowSub: { fontSize: typography.size.sm, fontFamily: typography.fontFamily.body, color: theme.muted, marginTop: 1 },
    rowDist: { fontSize: typography.size.xs + 1, fontFamily: typography.fontFamily.bodyMedium, color: theme.primary },
  });
}
