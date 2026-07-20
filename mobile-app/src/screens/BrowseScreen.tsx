import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import * as catalogApi from '../api/catalog';

// Répertoire de navigation (Phase 10 Lot D) : annuaire des Magasins OU des
// Services, filtrable par catégorie. Distinct de la rangée de popularité de
// l'accueil — ici on parcourt tout le catalogue par métier/rayon.
export function BrowseScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, radius, typography), [colors, spacing, radius, typography]);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const kind: 'shops' | 'services' = route.params?.kind === 'services' ? 'services' : 'shops';

  const [categories, setCategories] = useState<{ id: string; name: string; type: string }[]>([]);
  const [categoryId, setCategoryId] = useState<string>('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    catalogApi
      .fetchRootCategories()
      .then((cats) => {
        // Magasins -> catégories produit/both ; Services -> service/both.
        const wanted = kind === 'shops' ? ['product', 'both'] : ['service', 'both'];
        setCategories(cats.filter((c) => wanted.includes(c.type)));
      })
      .catch(() => {});
  }, [kind]);

  useEffect(() => {
    setLoading(true);
    const params = categoryId ? { category: categoryId } : undefined;
    const p = kind === 'shops' ? catalogApi.fetchShops(params) : catalogApi.fetchServices(params);
    p.then(setItems).finally(() => setLoading(false));
  }, [kind, categoryId]);

  const heading = kind === 'shops' ? 'Magasins' : 'Services';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{heading}</Text>

      {/* Filtre par catégorie */}
      <View style={styles.chipRow}>
        <Pressable onPress={() => setCategoryId('')} style={[styles.chip, categoryId === '' && styles.chipActive]}>
          <Text style={[styles.chipText, categoryId === '' && styles.chipTextActive]}>Tout</Text>
        </Pressable>
        {categories.map((c) => (
          <Pressable key={c.id} onPress={() => setCategoryId(c.id)} style={[styles.chip, categoryId === c.id && styles.chipActive]}>
            <Text style={[styles.chipText, categoryId === c.id && styles.chipTextActive]}>{c.name}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.grid}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.gridItem}>
              <Skeleton height={150} />
            </View>
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState message={`Aucun ${kind === 'shops' ? 'magasin' : 'service'} dans cette catégorie.`} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: spacing.xxl }}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              {kind === 'shops' ? (
                <Card
                  title={item.name}
                  subtitle={item.address}
                  imageUrl={item.logoUrl}
                  onPress={() => navigation.navigate('Shop', { shopId: item.id })}
                />
              ) : (
                <Card
                  title={item.title}
                  price={`${item.price} DJF`}
                  onPress={() => navigation.navigate('Service', { serviceId: item.id })}
                />
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

function makeStyles(
  theme: Palette,
  spacing: { xs: number; sm: number; md: number; lg: number; xxl: number },
  radius: { pill: number },
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
      paddingBottom: spacing.sm,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.lg - 4, marginBottom: spacing.sm },
    chip: { borderWidth: 1, borderColor: theme.border, borderRadius: radius.pill, paddingHorizontal: spacing.md - 2, paddingVertical: spacing.xs + 2, backgroundColor: theme.surface },
    chipActive: { borderColor: theme.primary, backgroundColor: theme.primary + '1a' },
    chipText: { fontSize: typography.size.xs + 1, fontFamily: typography.fontFamily.body, color: theme.muted },
    chipTextActive: { color: theme.primary, fontFamily: typography.fontFamily.bodySemiBold },
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
    gridItem: { width: '50%', marginBottom: 12, paddingHorizontal: 4 },
  });
}
