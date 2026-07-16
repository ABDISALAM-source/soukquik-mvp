import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Avatar } from '../components/Avatar';
import { RatingStars } from '../components/RatingStars';
import { ReviewSection } from '../components/ReviewSection';
import * as catalogApi from '../api/catalog';
import * as likesApi from '../api/likes';
import { usePresence } from '../hooks/usePresence';

export function ShopScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, radius, typography), [colors, spacing, radius, typography]);
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { shopId } = route.params;

  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [popularProducts, setPopularProducts] = useState<any[]>([]);
  const [query, setQuery] = useState('');

  const [likeState, setLikeState] = useState({ liked: false, count: 0 });
  const [reviewSummary, setReviewSummary] = useState({ count: 0, average: 0 });

  // Présence temps réel (Phase 8) : la WebSocket enregistre l'entrée à
  // l'arrivée et la sortie automatiquement au démontage de l'écran, et
  // pousse le compteur mis à jour dès qu'un autre visiteur entre/sort.
  const presence = usePresence(shopId);

  useEffect(() => {
    catalogApi.fetchShop(shopId).then(setShop);
    catalogApi.fetchShopProducts(shopId).then(setProducts);
    catalogApi.fetchShopPopularProducts(shopId, 8).then(setPopularProducts).catch(() => {});
    likesApi.fetchLikeCount('shop', shopId).then((r) => setLikeState((s) => ({ ...s, count: r.count }))).catch(() => {});
    likesApi.fetchMyLike('shop', shopId).then((r) => setLikeState((s) => ({ ...s, liked: r.liked }))).catch(() => {});
    // Enregistre une visite de la boutique (Phase 10) — alimente le
    // classement "les plus visités" et les stats du dashboard vendeur.
    catalogApi.trackShopVisit(shopId);
  }, [shopId]);

  async function toggleLike() {
    // Optimiste : bascule tout de suite, resynchronise avec la vraie réponse ensuite.
    setLikeState((s) => ({ liked: !s.liked, count: s.liked ? s.count - 1 : s.count + 1 }));
    try {
      const result = await likesApi.toggleLike('shop', shopId);
      setLikeState(result);
    } catch {
      likesApi.fetchLikeCount('shop', shopId).then((r) => setLikeState((s) => ({ ...s, count: r.count }))).catch(() => {});
    }
  }

  if (!shop) return <EmptyState message="Chargement..." />;

  const filteredProducts = query
    ? products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    : products;

  return (
    <FlatList
      style={styles.container}
      data={filteredProducts}
      keyExtractor={(item) => item.id}
      numColumns={2}
      contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: spacing.xxl }}
      renderItem={({ item }) => (
        <View style={styles.gridItem}>
          <Card
            title={item.name}
            price={`${item.price} DJF`}
            imageUrl={item.imageUrl}
            onPress={() => navigation.navigate('ProductDetail', { productId: item.id, shopId })}
          />
        </View>
      )}
      ListEmptyComponent={
        <EmptyState message={query ? 'Aucun produit ne correspond à ta recherche.' : 'Aucun produit disponible dans cette boutique.'} />
      }
      ListHeaderComponent={
        <>
          {/* EN-TÊTE */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Avatar imageUrl={shop.logoUrl} name={shop.name} size={72} pulseIntensity={presence.intensity} />
              <View style={styles.headerInfo}>
                <Text style={styles.name}>{shop.name}</Text>
                {shop.address ? <Text style={styles.address}>{shop.address}</Text> : null}
              </View>
              <Pressable onPress={toggleLike} style={styles.likeButton} hitSlop={8}>
                <Ionicons name={likeState.liked ? 'heart' : 'heart-outline'} size={22} color={likeState.liked ? colors.danger : colors.muted} />
                <Text style={styles.likeCount}>{likeState.count}</Text>
              </Pressable>
            </View>

            {shop.description ? <Text style={styles.description}>{shop.description}</Text> : null}

            {/* STATS */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="people" size={14} color={colors.primary} />
                <Text style={styles.statText}>{presence.count} en ce moment</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="bag-check" size={14} color={colors.primary} />
                <Text style={styles.statText}>{shop.salesCount ?? 0} ventes</Text>
              </View>
              <View style={styles.statItem}>
                <RatingStars rating={reviewSummary.average} count={reviewSummary.count} size={13} />
              </View>
            </View>
          </View>

          {/* LES PLUS VUS / VENDUS DE CETTE BOUTIQUE */}
          {popularProducts.length > 0 && !query ? (
            <>
              <Text style={styles.sectionTitle}>Les plus vus & vendus ici 🔥</Text>
              <FlatList
                horizontal
                data={popularProducts}
                keyExtractor={(item) => `pop-${item.id}`}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.popularRow}
                renderItem={({ item }) => (
                  <View style={styles.popularCard}>
                    <Card
                      title={item.name}
                      price={`${item.price} DJF`}
                      imageUrl={item.imageUrl}
                      onPress={() => navigation.navigate('ProductDetail', { productId: item.id, shopId })}
                    />
                  </View>
                )}
              />
            </>
          ) : null}

          {/* RECHERCHE SCOPÉE */}
          <View style={styles.searchWrapper}>
            <Ionicons name="search" size={16} color={colors.muted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder={`Chercher dans ${shop.name}...`}
              placeholderTextColor={colors.muted}
            />
          </View>

          <Text style={styles.sectionTitle}>Tous les produits</Text>
        </>
      }
      ListFooterComponent={
        <ReviewSection targetType="shop" targetId={shopId} onSummaryChange={setReviewSummary} />
      }
    />
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
    header: { padding: spacing.lg - 4, paddingTop: 60 },
    headerTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    headerInfo: { flex: 1 },
    name: { fontSize: 22, fontFamily: typography.fontFamily.headingBold, color: theme.text },
    address: { fontSize: typography.size.sm - 1, fontFamily: typography.fontFamily.body, color: theme.muted, marginTop: 2 },
    likeButton: { alignItems: 'center', gap: 2 },
    likeCount: { fontSize: typography.size.xs, fontFamily: typography.fontFamily.bodySemiBold, color: theme.muted },
    description: { fontSize: typography.size.md - 2, fontFamily: typography.fontFamily.body, color: theme.text, marginTop: spacing.md },
    statsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statText: { fontSize: typography.size.xs + 1, fontFamily: typography.fontFamily.bodyMedium, color: theme.muted },
    searchWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.border,
      marginHorizontal: spacing.lg - 4,
      paddingHorizontal: spacing.sm + 4,
      marginBottom: spacing.md,
    },
    searchIcon: { marginRight: spacing.xs + 2 },
    searchInput: {
      flex: 1,
      height: 42,
      fontSize: typography.size.sm + 1,
      fontFamily: typography.fontFamily.body,
      color: theme.text,
    },
    sectionTitle: {
      fontSize: typography.size.lg - 3,
      fontFamily: typography.fontFamily.heading,
      color: theme.text,
      marginLeft: 8,
      marginBottom: 12,
    },
    gridItem: { width: '50%', marginBottom: 12 },
    popularRow: { paddingLeft: 12, paddingRight: 4, paddingBottom: 8 },
    popularCard: { marginRight: 4 },
  });
}
