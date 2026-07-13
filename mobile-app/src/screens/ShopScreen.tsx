import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Avatar } from '../components/Avatar';
import { RatingStars } from '../components/RatingStars';
import { Button } from '../components/Button';
import { useSession } from '../store/session';
import * as catalogApi from '../api/catalog';
import * as likesApi from '../api/likes';
import * as reviewsApi from '../api/reviews';
import * as presenceApi from '../api/presence';
import { Review } from '../api/reviews';

export function ShopScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, radius, typography), [colors, spacing, radius, typography]);
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { shopId } = route.params;
  const { user } = useSession();

  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [query, setQuery] = useState('');

  const [presence, setPresence] = useState({ count: 0, intensity: 0 });
  const [likeState, setLikeState] = useState({ liked: false, count: 0 });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSummary, setReviewSummary] = useState({ count: 0, average: 0 });
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    catalogApi.fetchShop(shopId).then(setShop);
    catalogApi.fetchShopProducts(shopId).then(setProducts);
    refreshStats();

    // Présence en direct : signale l'entrée à l'arrivée sur la page, la
    // sortie au départ — alimente le compteur "X en ce moment" en temps réel.
    presenceApi.enterShopPresence(shopId).catch(() => {});
    return () => {
      presenceApi.leaveShopPresence(shopId).catch(() => {});
    };
  }, [shopId]);

  function refreshStats() {
    presenceApi.fetchShopPresence(shopId).then(setPresence).catch(() => {});
    likesApi.fetchLikeCount('shop', shopId).then((r) => setLikeState((s) => ({ ...s, count: r.count }))).catch(() => {});
    likesApi.fetchMyLike('shop', shopId).then((r) => setLikeState((s) => ({ ...s, liked: r.liked }))).catch(() => {});
    reviewsApi.fetchReviews('shop', shopId).then((r) => {
      setReviews(r.reviews);
      setReviewSummary(r.summary);
    }).catch(() => {});
  }

  async function toggleLike() {
    // Optimiste : bascule tout de suite, resynchronise avec la vraie réponse ensuite.
    setLikeState((s) => ({ liked: !s.liked, count: s.liked ? s.count - 1 : s.count + 1 }));
    try {
      const result = await likesApi.toggleLike('shop', shopId);
      setLikeState(result);
    } catch {
      refreshStats();
    }
  }

  async function submitReview() {
    if (newRating === 0) {
      Alert.alert('Note requise', 'Choisis une note de 1 à 5 étoiles.');
      return;
    }
    setSubmittingReview(true);
    try {
      await reviewsApi.createReview({ targetType: 'shop', targetId: shopId, rating: newRating, comment: newComment || undefined });
      setNewRating(0);
      setNewComment('');
      refreshStats();
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setSubmittingReview(false);
    }
  }

  if (!shop) return <EmptyState message="Chargement..." />;

  const myReview = reviews.find((r) => r.authorId === user?.id);
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
                <RatingStars rating={reviewSummary.average} count={reviewSummary.count} size={13} />
              </View>
            </View>
          </View>

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

          <Text style={styles.sectionTitle}>Produits</Text>
        </>
      }
      ListFooterComponent={
        <View style={styles.reviewsSection}>
          <Text style={styles.sectionTitle}>Avis ({reviewSummary.count})</Text>

          {reviews.length === 0 ? (
            <Text style={styles.noReviews}>Aucun avis pour le moment.</Text>
          ) : (
            reviews.map((r) => (
              <View key={r.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewAuthor}>{r.authorName}</Text>
                  <RatingStars rating={r.rating} size={11} />
                </View>
                {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
              </View>
            ))
          )}

          {myReview ? (
            <Text style={styles.alreadyReviewed}>Tu as déjà laissé un avis sur cette boutique.</Text>
          ) : (
            <View style={styles.reviewForm}>
              <Text style={styles.reviewFormLabel}>Laisser un avis</Text>
              <RatingStars rating={newRating} size={22} onChange={setNewRating} />
              <TextInput
                style={styles.reviewInput}
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Ton commentaire (optionnel)"
                placeholderTextColor={colors.muted}
                multiline
              />
              <Button label="Publier l'avis" onPress={submitReview} loading={submittingReview} />
            </View>
          )}
        </View>
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
    reviewsSection: { paddingHorizontal: spacing.lg - 4, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
    noReviews: { fontSize: typography.size.sm, fontFamily: typography.fontFamily.body, color: theme.muted },
    reviewCard: {
      backgroundColor: theme.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.border,
      padding: spacing.sm + 4,
      marginBottom: spacing.sm,
    },
    reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    reviewAuthor: { fontSize: typography.size.sm, fontFamily: typography.fontFamily.bodySemiBold, color: theme.text },
    reviewComment: { fontSize: typography.size.sm - 1, fontFamily: typography.fontFamily.body, color: theme.muted, marginTop: 6 },
    alreadyReviewed: {
      fontSize: typography.size.xs + 1,
      fontFamily: typography.fontFamily.body,
      color: theme.muted,
      marginTop: spacing.sm,
      fontStyle: 'italic',
    },
    reviewForm: { marginTop: spacing.md, gap: spacing.sm },
    reviewFormLabel: { fontSize: typography.size.sm, fontFamily: typography.fontFamily.bodySemiBold, color: theme.text },
    reviewInput: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radius.sm + 4,
      padding: spacing.sm + 4,
      minHeight: 70,
      textAlignVertical: 'top',
      fontFamily: typography.fontFamily.body,
      color: theme.text,
    },
  });
}
