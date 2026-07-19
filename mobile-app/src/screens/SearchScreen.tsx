import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { SearchBar } from '../components/SearchBar';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';
import * as catalogApi from '../api/catalog';
import { useLocationStore } from '../store/location';
import { haversineKm, formatDistanceKm } from '../utils/geo';
import { runPhotoSearch } from '../utils/photoSearch';

type Kind = 'shop' | 'product' | 'service';
type Filter = 'all' | 'shop' | 'product' | 'service';
type Sort = 'relevance' | 'price_asc' | 'price_desc' | 'distance';

interface Row {
  id: string;
  kind: Kind;
  label: string;
  price?: number;
  imageUrl?: string | null;
  lat?: number | null;
  lng?: number | null;
  distanceKm?: number;
  priceUnit?: string;
}

const RECENT_KEY = 'recent_searches';
const RECENT_MAX = 8;

const TYPE_FILTERS: { key: Filter; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all', label: 'Tout', icon: 'apps-outline' },
  { key: 'shop', label: 'Boutiques', icon: 'storefront-outline' },
  { key: 'product', label: 'Produits', icon: 'cube-outline' },
  { key: 'service', label: 'Services', icon: 'construct-outline' },
];

const KIND_META: Record<Kind, { icon: keyof typeof Ionicons.glyphMap; tag: string }> = {
  shop: { icon: 'storefront', tag: 'Boutique' },
  product: { icon: 'cube', tag: 'Produit' },
  service: { icon: 'construct', tag: 'Service' },
};

export function SearchScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, radius, typography), [colors, spacing, radius, typography]);
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const coords = useLocationStore((s) => s.coords);
  const requestLocation = useLocationStore((s) => s.requestLocation);

  const [query, setQuery] = useState(route.params?.initialQuery || '');
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('relevance');
  const [nearMe, setNearMe] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [trending, setTrending] = useState<Row[]>([]);
  const [recent, setRecent] = useState<string[]>([]);

  const [raw, setRaw] = useState<{ shops: Row[]; products: Row[]; services: Row[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const reqId = useRef(0);

  // --- Chargements initiaux (catégories, tendances, récents) ---
  useEffect(() => {
    catalogApi.fetchCategories().then((c: any[]) => setCategories(c.filter((x) => !x.parentId))).catch(() => {});
    Promise.all([catalogApi.fetchTrendingShops(6), catalogApi.fetchTrendingServices(6)])
      .then(([shops, services]: any[]) => {
        const rows: Row[] = [
          ...shops.map((s: any) => ({ id: s.id, kind: 'shop' as Kind, label: s.name, imageUrl: s.logoUrl, lat: s.latitude, lng: s.longitude })),
          ...services.map((s: any) => ({ id: s.id, kind: 'service' as Kind, label: s.title, price: s.price, priceUnit: s.priceUnit, lat: s.latitude, lng: s.longitude })),
        ];
        setTrending(rows);
      })
      .catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecent().then(setRecent);
    }, [])
  );

  // --- Recherche live (débounced) ---
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setRaw(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      try {
        const data = await catalogApi.search({ q, type: 'all', category: categoryId ?? undefined });
        if (id !== reqId.current) return; // réponse périmée
        setRaw({
          shops: (data.shops ?? []).map((s: any) => ({ id: s.id, kind: 'shop', label: s.name, imageUrl: s.logoUrl, lat: s.latitude, lng: s.longitude })),
          products: (data.products ?? []).map((p: any) => ({ id: p.id, kind: 'product', label: p.name, price: p.price, imageUrl: p.imageUrl, lat: p.shopLatitude, lng: p.shopLongitude, __shopId: p.shopId } as any)),
          services: (data.services ?? []).map((s: any) => ({ id: s.id, kind: 'service', label: s.title, price: s.price, priceUnit: s.priceUnit, lat: s.latitude, lng: s.longitude })),
        });
      } catch {
        if (id === reqId.current) setRaw({ shops: [], products: [], services: [] });
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, categoryId]);

  // --- Enrichit + trie + filtre côté client ---
  const sections = useMemo(() => {
    if (!raw) return [];
    const q = query.trim().toLowerCase();

    const withDistance = (rows: Row[]) =>
      rows.map((r) => {
        const d = coords && r.lat != null && r.lng != null ? haversineKm(coords.latitude, coords.longitude, r.lat, r.lng) : undefined;
        return { ...r, distanceKm: d };
      });

    const sortRows = (rows: Row[]) => {
      const arr = [...rows];
      if (sort === 'price_asc') arr.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
      else if (sort === 'price_desc') arr.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
      else if (sort === 'distance') arr.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
      else {
        // Pertinence : préfixe exact d'abord, puis position du terme, puis alpha.
        const score = (r: Row) => {
          const l = r.label.toLowerCase();
          if (l === q) return 0;
          if (l.startsWith(q)) return 1;
          if (l.includes(q)) return 2;
          return 3;
        };
        arr.sort((a, b) => score(a) - score(b) || a.label.localeCompare(b.label));
      }
      return arr;
    };

    const prep = (rows: Row[]) => {
      let out = withDistance(rows);
      if (nearMe) out = out.filter((r) => r.distanceKm != null);
      return sortRows(out);
    };

    const built: { key: Kind; title: string; icon: keyof typeof Ionicons.glyphMap; data: Row[] }[] = [];
    if (filter === 'all' || filter === 'shop') built.push({ key: 'shop', title: 'Boutiques', icon: 'storefront', data: prep(raw.shops) });
    if (filter === 'all' || filter === 'product') built.push({ key: 'product', title: 'Produits', icon: 'cube', data: prep(raw.products) });
    if (filter === 'all' || filter === 'service') built.push({ key: 'service', title: 'Services', icon: 'construct', data: prep(raw.services) });
    return built.filter((s) => s.data.length > 0);
  }, [raw, filter, sort, nearMe, coords, query]);

  const totalCount = sections.reduce((n, s) => n + s.data.length, 0);

  function openRow(r: Row & { __shopId?: string }) {
    commitRecent(query.trim());
    if (r.kind === 'shop') navigation.navigate('Shop', { shopId: r.id });
    else if (r.kind === 'service') navigation.navigate('Service', { serviceId: r.id });
    else navigation.navigate('ProductDetail', { productId: r.id, shopId: r.__shopId });
  }

  async function commitRecent(q: string) {
    if (!q) return;
    const next = [q, ...recent.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, RECENT_MAX);
    setRecent(next);
    SecureStore.setItemAsync(RECENT_KEY, JSON.stringify(next)).catch(() => {});
  }

  function clearRecent() {
    setRecent([]);
    SecureStore.deleteItemAsync(RECENT_KEY).catch(() => {});
  }

  function toggleNearMe() {
    if (!nearMe && !coords) requestLocation();
    setNearMe((v) => !v);
  }

  async function onPhoto() {
    try {
      const outcome = await runPhotoSearch('library', coords);
      if (outcome.cancelled) return;
      if (!outcome.matched) {
        navigation.navigate('Compare', { imageResults: [], title: 'Articles similaires 📸' });
        return;
      }
      navigation.navigate('Compare', { imageResults: outcome.results ?? [], title: 'Articles similaires 📸' });
    } catch {
      /* runPhotoSearch gère déjà les alertes de permission */
    }
  }

  // --- Rendus ---

  function highlight(label: string) {
    const q = query.trim();
    if (!q) return <Text style={styles.rowTitle}>{label}</Text>;
    const i = label.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return <Text style={styles.rowTitle} numberOfLines={1}>{label}</Text>;
    return (
      <Text style={styles.rowTitle} numberOfLines={1}>
        {label.slice(0, i)}
        <Text style={styles.rowTitleHit}>{label.slice(i, i + q.length)}</Text>
        {label.slice(i + q.length)}
      </Text>
    );
  }

  function renderRow(r: Row & { __shopId?: string }) {
    const meta = KIND_META[r.kind];
    return (
      <Pressable style={styles.row} onPress={() => openRow(r)}>
        <View style={styles.rowThumb}>
          {r.imageUrl ? (
            <Image source={{ uri: r.imageUrl }} style={styles.rowThumbImg} />
          ) : (
            <Ionicons name={meta.icon} size={22} color={colors.primary} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          {highlight(r.label)}
          <View style={styles.rowMeta}>
            <Text style={styles.rowTag}>{meta.tag}</Text>
            {r.price != null && (
              <Text style={styles.rowPrice}>
                · {new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(r.price)} DJF
                {r.priceUnit ? `/${r.priceUnit}` : ''}
              </Text>
            )}
            {r.distanceKm != null && (
              <Text style={styles.rowDist}>
                {' '}· <Ionicons name="location" size={11} color={colors.primary} /> {formatDistanceKm(r.distanceKm)}
              </Text>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </Pressable>
    );
  }

  function renderDiscovery() {
    return (
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }} keyboardShouldPersistTaps="handled">
        {recent.length > 0 && (
          <View style={styles.block}>
            <View style={styles.blockHead}>
              <Text style={styles.blockTitle}>Recherches récentes</Text>
              <Pressable onPress={clearRecent} hitSlop={8}>
                <Text style={styles.clearText}>Effacer</Text>
              </Pressable>
            </View>
            <View style={styles.wrapRow}>
              {recent.map((r) => (
                <Pressable key={r} style={styles.recentChip} onPress={() => setQuery(r)}>
                  <Ionicons name="time-outline" size={14} color={colors.muted} />
                  <Text style={styles.recentText}>{r}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {categories.length > 0 && (
          <View style={styles.block}>
            <Text style={styles.blockTitle}>Explorer par catégorie</Text>
            <View style={styles.wrapRow}>
              {categories.slice(0, 12).map((c) => (
                <Pressable
                  key={c.id}
                  style={styles.catChip}
                  onPress={() => {
                    setCategoryId(c.id);
                    setQuery(c.name);
                  }}
                >
                  <Ionicons name={((c.icon || 'pricetag') + '-outline') as any} size={15} color={colors.primary} />
                  <Text style={styles.catText}>{c.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {trending.length > 0 && (
          <View style={styles.block}>
            <Text style={styles.blockTitle}>🔥 Tendances près de toi</Text>
            {trending.map((r) => (
              <View key={`${r.kind}-${r.id}`}>{renderRow(r)}</View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  }

  const showDiscovery = !query.trim();

  return (
    <View style={styles.container}>
      {/* En-tête fixe */}
      <View style={styles.header}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          onSubmit={() => commitRecent(query.trim())}
          onPressCamera={onPhoto}
          rightIcon={showFilters ? 'options' : 'options-outline'}
          onPressRightIcon={() => setShowFilters((v) => !v)}
          placeholder="Produit, service, boutique…"
        />

        {/* Chips de type */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
          {TYPE_FILTERS.map((t) => {
            const active = filter === t.key;
            return (
              <Pressable key={t.key} style={[styles.typeChip, active && styles.typeChipActive]} onPress={() => setFilter(t.key)}>
                <Ionicons name={t.icon} size={14} color={active ? '#090A0F' : colors.muted} />
                <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Filtres avancés (tri + proximité + catégorie active) */}
        {showFilters && (
          <View style={styles.filters}>
            <View style={styles.wrapRow}>
              {([
                ['relevance', 'Pertinence'],
                ['price_asc', 'Prix ↑'],
                ['price_desc', 'Prix ↓'],
                ['distance', 'Proximité'],
              ] as [Sort, string][]).map(([s, label]) => (
                <Pressable key={s} style={[styles.sortChip, sort === s && styles.sortChipActive]} onPress={() => setSort(s)}>
                  <Text style={[styles.sortText, sort === s && styles.sortTextActive]}>{label}</Text>
                </Pressable>
              ))}
              <Pressable style={[styles.sortChip, nearMe && styles.sortChipActive]} onPress={toggleNearMe}>
                <Ionicons name="navigate" size={12} color={nearMe ? colors.primary : colors.muted} />
                <Text style={[styles.sortText, nearMe && styles.sortTextActive]}> Près de moi</Text>
              </Pressable>
            </View>
            {categoryId && (
              <Pressable style={styles.activeCat} onPress={() => setCategoryId(null)}>
                <Text style={styles.activeCatText}>
                  Catégorie : {categories.find((c) => c.id === categoryId)?.name ?? '—'}
                </Text>
                <Ionicons name="close-circle" size={16} color={colors.primary} />
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Corps */}
      {showDiscovery ? (
        renderDiscovery()
      ) : loading ? (
        <View style={{ padding: spacing.md, gap: spacing.sm }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={64} borderRadius={14} />
          ))}
        </View>
      ) : totalCount === 0 ? (
        <EmptyState message={`Aucun résultat pour « ${query.trim()} ».\nEssaie un autre mot ou la recherche par photo 📸.`} />
      ) : (
        <SectionList
          sections={sections as any}
          keyExtractor={(item: any, idx) => `${item.kind}-${item.id}-${idx}`}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.xs }}
          stickySectionHeadersEnabled={false}
          keyboardShouldPersistTaps="handled"
          renderSectionHeader={({ section }: any) => (
            <View style={styles.sectionHead}>
              <Ionicons name={section.icon} size={15} color={colors.primary} />
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionCount}>{section.data.length}</Text>
            </View>
          )}
          renderItem={({ item }: any) => renderRow(item)}
          ListHeaderComponent={
            <Text style={styles.resultSummary}>
              {totalCount} résultat{totalCount > 1 ? 's' : ''}
            </Text>
          }
        />
      )}
    </View>
  );
}

async function loadRecent(): Promise<string[]> {
  try {
    const s = await SecureStore.getItemAsync(RECENT_KEY);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

function makeStyles(
  theme: Palette,
  spacing: { xs: number; sm: number; md: number; lg: number; xxl: number },
  radius: { sm: number; md: number; pill: number },
  typography: { fontFamily: Record<string, string>; size: Record<string, number> }
) {
  const semi = typography.fontFamily.bodySemiBold;
  const body = typography.fontFamily.body;
  const med = typography.fontFamily.bodyMedium;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { paddingHorizontal: spacing.md, paddingTop: 56, paddingBottom: spacing.sm, backgroundColor: theme.background, borderBottomWidth: 1, borderBottomColor: theme.border },

    typeRow: { gap: spacing.xs, paddingTop: spacing.sm },
    typeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: radius.pill,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    typeChipActive: { backgroundColor: theme.primary, borderColor: theme.primary },
    typeChipText: { fontSize: typography.size.sm, fontFamily: med, color: theme.muted },
    typeChipTextActive: { color: '#090A0F', fontFamily: semi },

    filters: { marginTop: spacing.sm, gap: spacing.sm },
    wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    sortChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 11,
      borderRadius: radius.pill,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    sortChipActive: { borderColor: theme.primary, backgroundColor: theme.primarySoft },
    sortText: { fontSize: typography.size.sm, fontFamily: med, color: theme.muted },
    sortTextActive: { color: theme.primary, fontFamily: semi },
    activeCat: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 11,
      borderRadius: radius.pill,
      backgroundColor: theme.primarySoft,
    },
    activeCatText: { fontSize: typography.size.sm, fontFamily: med, color: theme.primary },

    resultSummary: { fontSize: typography.size.sm, fontFamily: body, color: theme.muted, marginBottom: spacing.xs },

    sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md, marginBottom: spacing.xs },
    sectionTitle: { fontSize: typography.size.md, fontFamily: semi, color: theme.text },
    sectionCount: {
      fontSize: typography.size.xs,
      fontFamily: semi,
      color: theme.muted,
      backgroundColor: theme.surfaceAlt,
      paddingHorizontal: 7,
      paddingVertical: 1,
      borderRadius: radius.pill,
      overflow: 'hidden',
    },

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
    rowThumb: {
      width: 46,
      height: 46,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primarySoft,
      overflow: 'hidden',
    },
    rowThumbImg: { width: 46, height: 46 },
    rowTitle: { fontSize: typography.size.md, fontFamily: semi, color: theme.text },
    rowTitleHit: { color: theme.primary },
    rowMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2, flexWrap: 'wrap' },
    rowTag: { fontSize: typography.size.xs + 1, fontFamily: med, color: theme.muted },
    rowPrice: { fontSize: typography.size.xs + 1, fontFamily: med, color: theme.text },
    rowDist: { fontSize: typography.size.xs + 1, fontFamily: med, color: theme.primary },

    block: { marginBottom: spacing.lg },
    blockHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
    blockTitle: { fontSize: typography.size.md, fontFamily: semi, color: theme.text, marginBottom: spacing.sm },
    clearText: { fontSize: typography.size.sm, fontFamily: med, color: theme.primary },
    recentChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: radius.pill,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    recentText: { fontSize: typography.size.sm, fontFamily: med, color: theme.text },
    catChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: radius.pill,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    catText: { fontSize: typography.size.sm, fontFamily: med, color: theme.text },
  });
}
