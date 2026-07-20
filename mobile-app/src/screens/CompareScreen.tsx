import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import * as catalogApi from '../api/catalog';
import type { CompareResult } from '../api/catalog';
import { useLocationStore } from '../store/location';
import { MAPS_ENABLED } from '../config/maps';

// Comparaison multi-boutiques (Phase 10 C1) : un même article à travers
// toutes les boutiques, avec prix + distance, triable, en liste ou sur carte.
// Réutilisé aussi pour afficher les résultats de la recherche par photo (C2).
export function CompareScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, radius, typography), [colors, spacing, radius, typography]);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { query, imageResults, title } = (route.params ?? {}) as {
    query?: string;
    imageResults?: CompareResult[];
    title?: string;
  };
  const coords = useLocationStore((s) => s.coords);

  const isPhotoMode = Array.isArray(imageResults);
  const [results, setResults] = useState<CompareResult[]>(imageResults ?? []);
  const [loading, setLoading] = useState(!isPhotoMode);
  const [sort, setSort] = useState<'price' | 'distance'>('price');
  const [view, setView] = useState<'list' | 'map'>('list');

  const load = useCallback(() => {
    if (isPhotoMode || !query) return;
    setLoading(true);
    catalogApi
      .compareProduct(query, { lat: coords?.latitude, lng: coords?.longitude, sort })
      .then(setResults)
      .finally(() => setLoading(false));
  }, [query, isPhotoMode, coords, sort]);

  useEffect(() => {
    load();
  }, [load]);

  const withCoords = results.filter((r) => r.shopLatitude != null && r.shopLongitude != null);

  function renderItem(item: CompareResult) {
    return (
      <Pressable
        style={styles.row}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id, shopId: item.shopId })}
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Text style={styles.thumbLetter}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.shop} numberOfLines={1}>
            {item.brandName ? `${item.brandName} · ` : ''}{item.shopName}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.price}>{item.price} DJF</Text>
            {item.distanceKm != null ? <Text style={styles.distance}>· {item.distanceKm.toFixed(1)} km</Text> : null}
            {item.similarity != null ? <Text style={styles.similarity}>· {item.similarity}% ressemblant</Text> : null}
          </View>
        </View>
        <Pressable
          style={styles.deliverBtn}
          onPress={() => navigation.navigate('ProductDetail', { productId: item.id, shopId: item.shopId })}
        >
          <Ionicons name="bicycle" size={14} color={colors.primary} />
          <Text style={styles.deliverText}>Livrer</Text>
        </Pressable>
      </Pressable>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.backInline}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {title ?? (isPhotoMode ? 'Résultats par photo' : `« ${query} »`)}
        </Text>
        {/* Bascule liste/carte masquée tant que Google Maps n'est pas configuré
            (une carte sans clé API fait planter l'app). */}
        {MAPS_ENABLED && (
          <View style={styles.toggleRow}>
            <Pressable onPress={() => setView('list')} style={[styles.toggle, view === 'list' && styles.toggleActive]}>
              <Ionicons name="list" size={16} color={view === 'list' ? colors.primary : colors.muted} />
            </Pressable>
            <Pressable onPress={() => setView('map')} style={[styles.toggle, view === 'map' && styles.toggleActive]}>
              <Ionicons name="map" size={16} color={view === 'map' ? colors.primary : colors.muted} />
            </Pressable>
          </View>
        )}
      </View>

      {/* Tri (mode texte uniquement — le mode photo est trié par similarité) */}
      {!isPhotoMode && (
        <View style={styles.sortRow}>
          <Pressable onPress={() => setSort('price')} style={[styles.sortChip, sort === 'price' && styles.sortChipActive]}>
            <Text style={[styles.sortText, sort === 'price' && styles.sortTextActive]}>Prix ↑</Text>
          </Pressable>
          <Pressable onPress={() => setSort('distance')} style={[styles.sortChip, sort === 'distance' && styles.sortChipActive]}>
            <Text style={[styles.sortText, sort === 'distance' && styles.sortTextActive]}>Proximité</Text>
          </Pressable>
        </View>
      )}

      {loading ? (
        <View style={{ paddingHorizontal: 16, gap: 12, marginTop: 12 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={72} />
          ))}
        </View>
      ) : results.length === 0 ? (
        <EmptyState message={isPhotoMode ? 'Aucun article visuellement proche trouvé.' : 'Aucune boutique ne propose cet article.'} />
      ) : MAPS_ENABLED && view === 'map' && withCoords.length > 0 ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: withCoords[0].shopLatitude!,
            longitude: withCoords[0].shopLongitude!,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
          }}
          showsUserLocation
        >
          {withCoords.map((r) => (
            <Marker
              key={r.id}
              coordinate={{ latitude: r.shopLatitude!, longitude: r.shopLongitude! }}
              title={`${r.name} — ${r.price} DJF`}
              description={r.shopName}
              onCalloutPress={() => navigation.navigate('ProductDetail', { productId: r.id, shopId: r.shopId })}
            />
          ))}
        </MapView>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          renderItem={({ item }) => renderItem(item)}
        />
      )}
    </View>
  );
}

function makeStyles(
  theme: Palette,
  spacing: { xs: number; sm: number; md: number; lg: number; xxl: number },
  radius: { sm: number; md: number; pill: number },
  typography: { fontFamily: Record<string, string>; size: Record<string, number> }
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingTop: 56, paddingBottom: spacing.sm },
    backInline: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginLeft: -6 },
    title: { flex: 1, fontSize: 20, fontFamily: typography.fontFamily.headingBold, color: theme.text },
    toggleRow: { flexDirection: 'row', gap: 4 },
    toggle: { padding: 8, borderRadius: radius.sm, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
    toggleActive: { borderColor: theme.primary, backgroundColor: theme.primary + '1a' },
    sortRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg - 4, marginBottom: spacing.sm },
    sortChip: { borderWidth: 1, borderColor: theme.border, borderRadius: radius.pill, paddingHorizontal: spacing.md - 2, paddingVertical: spacing.xs + 2, backgroundColor: theme.surface },
    sortChipActive: { borderColor: theme.primary, backgroundColor: theme.primary + '1a' },
    sortText: { fontSize: typography.size.xs + 1, fontFamily: typography.fontFamily.body, color: theme.muted },
    sortTextActive: { color: theme.primary, fontFamily: typography.fontFamily.bodySemiBold },
    map: { flex: 1 },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2, paddingHorizontal: spacing.lg - 4, paddingVertical: spacing.sm + 2, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
    thumb: { width: 52, height: 52, borderRadius: radius.sm, backgroundColor: theme.background },
    thumbPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: theme.primary + '22' },
    thumbLetter: { fontSize: 20, fontFamily: typography.fontFamily.headingBold, color: theme.primary },
    name: { fontSize: typography.size.sm + 1, fontFamily: typography.fontFamily.bodySemiBold, color: theme.text },
    shop: { fontSize: typography.size.xs, fontFamily: typography.fontFamily.body, color: theme.muted, marginTop: 1 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
    price: { fontSize: typography.size.sm, fontFamily: typography.fontFamily.bodySemiBold, color: theme.primary },
    distance: { fontSize: typography.size.xs, fontFamily: typography.fontFamily.body, color: theme.muted },
    similarity: { fontSize: typography.size.xs, fontFamily: typography.fontFamily.body, color: theme.success },
    deliverBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: theme.primary, borderRadius: radius.pill, paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs + 2 },
    deliverText: { fontSize: typography.size.xs, fontFamily: typography.fontFamily.bodySemiBold, color: theme.primary },
  });
}
