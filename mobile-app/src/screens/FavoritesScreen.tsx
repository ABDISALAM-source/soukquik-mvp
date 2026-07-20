import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { FormHeader } from '../components/FormHeader';
import { Skeleton } from '../components/Skeleton';
import * as likesApi from '../api/likes';
import * as catalogApi from '../api/catalog';

interface FavoriteItem {
  id: string;
  targetType: 'shop' | 'product';
  title: string;
  subtitle?: string;
  imageUrl?: string;
  shopId?: string;
}

export function FavoritesScreen() {
  const { colors, spacing, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, typography), [colors, spacing, typography]);
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Refetch à chaque focus : un like/unlike ailleurs (Home, ShopScreen) doit
  // se refléter ici sans qu'il faille relancer l'app.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      likesApi
        .fetchMyLikes()
        .then(async (liked) => {
          const shopLikes = liked.filter((l) => l.targetType === 'shop');
          const productLikes = liked.filter((l) => l.targetType === 'product');

          const [shops, products] = await Promise.all([
            Promise.all(shopLikes.map((l) => catalogApi.fetchShop(l.targetId).catch(() => null))),
            Promise.all(productLikes.map((l) => catalogApi.fetchProduct(l.targetId).catch(() => null))),
          ]);

          if (cancelled) return;
          const resolved: FavoriteItem[] = [
            ...shops.filter(Boolean).map((s: any) => ({ id: s.id, targetType: 'shop' as const, title: s.name, subtitle: s.address, imageUrl: s.logoUrl })),
            ...products.filter(Boolean).map((p: any) => ({ id: p.id, targetType: 'product' as const, title: p.name, subtitle: `${p.price} DJF`, imageUrl: p.imageUrl, shopId: p.shopId })),
          ];
          setItems(resolved);
        })
        .finally(() => !cancelled && setLoading(false));

      return () => {
        cancelled = true;
      };
    }, [])
  );

  function openItem(item: FavoriteItem) {
    if (item.targetType === 'shop') navigation.navigate('Shop', { shopId: item.id });
    else navigation.navigate('ProductDetail', { productId: item.id, shopId: item.shopId });
  }

  return (
    <View style={styles.container}>
      <FormHeader title="Favoris" subtitle="Tes boutiques et articles aimés" />

      {loading ? (
        <View style={styles.grid}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.gridItem}>
              <Skeleton height={160} />
            </View>
          ))}
        </View>
      ) : items.length === 0 ? (
        <EmptyState icon="heart-outline" title="Aucun favori" message="Appuie sur le cœur d'une boutique ou d'un article pour le retrouver ici." />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => `${item.targetType}-${item.id}`}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 12, paddingTop: spacing.md, paddingBottom: spacing.xxl }}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <Card title={item.title} subtitle={item.subtitle} imageUrl={item.imageUrl} onPress={() => openItem(item)} />
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
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
    gridItem: { width: '50%', marginBottom: 12, paddingHorizontal: 4 },
  });
}
