import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
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
import * as promotionsApi from '../api/promotions';
import type { Promotion } from '../api/promotions';
import { useSession } from '../store/session';

// NOTE MVP : on suppose ici une seule boutique par vendeur, récupérée via /shops?ownerId
// (simplification volontaire ; la gestion multi-boutiques est prévue mais pas branchée dans cet écran)
export function VendorDashboardScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, radius, typography), [colors, spacing, radius, typography]);
  const { user } = useSession();
  const navigation = useNavigation<any>();
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [shopProducts, setShopProducts] = useState<any[]>([]);
  const [myPromotions, setMyPromotions] = useState<Promotion[]>([]);
  const [promoTarget, setPromoTarget] = useState<{ type: 'shop' | 'product'; id: string } | null>(null);
  const [budget, setBudget] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [togglingOpen, setTogglingOpen] = useState(false);
  const listRef = useRef<FlatList>(null);

  // useFocusEffect (pas useEffect) : au retour de CreateShopScreen ou
  // ProductFormScreen, ce dashboard doit se recharger pour refléter la
  // boutique/le produit qui vient d'être créé ou modifié.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      api
        .get('/shops')
        .then(async (res) => {
          if (cancelled) return;
          const mine = res.data.data.find((s: any) => s.ownerId === user?.id);
          setShop(mine || null);
          if (mine) {
            setIsStoreOpen(mine.isOpen ?? true);
            const analyticsRes = await api.get(`/shops/${mine.id}/analytics`);
            if (cancelled) return;
            setAnalytics(analyticsRes.data.data);
            const ordersData = await ordersApi.fetchShopOrders(mine.id);
            if (cancelled) return;
            setOrders(ordersData);
            const products = await catalogApi.fetchShopProducts(mine.id);
            if (cancelled) return;
            setShopProducts(products);
            setPromoTarget({ type: 'shop', id: mine.id });
            const promos = await promotionsApi.fetchMyPromotions();
            if (cancelled) return;
            setMyPromotions(promos);
          }
        })
        .finally(() => !cancelled && setLoading(false));
      return () => {
        cancelled = true;
      };
    }, [user?.id])
  );

  async function advanceStatus(orderId: string, current: string) {
    const flow: Record<string, string> = { pending: 'accepted', accepted: 'preparing', preparing: 'delivered' };
    const next = flow[current];
    if (!next) return;
    await ordersApi.updateOrderStatus(orderId, next);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: next } : o)));
  }

  // Bascule ouvert/fermé, persistée côté serveur (optimiste + rollback).
  async function toggleStoreOpen(value: boolean) {
    if (!shop) return;
    setIsStoreOpen(value);
    setTogglingOpen(true);
    try {
      await catalogApi.updateShop(shop.id, { isOpen: value } as any);
      setShop((s: any) => ({ ...s, isOpen: value }));
    } catch (err: any) {
      setIsStoreOpen(!value); // rollback
      Alert.alert('Erreur', err.message ?? "Impossible de changer l'état de la boutique.");
    } finally {
      setTogglingOpen(false);
    }
  }

  async function submitPromotion() {
    const budgetNum = Number(budget);
    if (!promoTarget || !budgetNum || budgetNum <= 0) {
      Alert.alert('Erreur', 'Choisis une cible et un budget valide.');
      return;
    }
    setSubmitting(true);
    try {
      await promotionsApi.createPromotion({ targetType: promoTarget.type, targetId: promoTarget.id, budget: budgetNum });
      Alert.alert('Envoyé', 'Ta promotion est en attente de validation par un administrateur.');
      setBudget('');
      const promos = await promotionsApi.fetchMyPromotions();
      setMyPromotions(promos);
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <EmptyState message="Chargement..." />;

  if (!shop) {
    return (
      <View style={styles.noShop}>
        <EmptyState message="Tu n'as pas encore de boutique." />
        <Button label="Créer ma boutique" onPress={() => navigation.navigate('CreateShop')} />
      </View>
    );
  }

  // Commandes à traiter (nécessitent une action du vendeur), les plus
  // récentes d'abord. C'est ce qui alimente la rangée "Commandes urgentes".
  const urgentOrders = orders.filter((o) => ['pending', 'accepted', 'preparing'].includes(o.status));
  // Produits en stock faible (≤ 3), pour les alertes.
  const lowStock = shopProducts.filter((p) => p.stock <= 3);

  // Libellé + prochaine action du bouton selon le statut courant.
  const nextActionLabel: Record<string, string> = {
    pending: 'Accepter',
    accepted: 'Préparer',
    preparing: 'Marquer prête',
  };

  return (
    <FlatList
      ref={listRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      data={orders}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.orderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.orderAmount}>{item.totalAmount} DJF</Text>
            <StatusBadge status={item.status} />
          </View>
          {item.status !== 'delivered' && item.status !== 'cancelled' && (
            <Text style={styles.advance} onPress={() => advanceStatus(item.id, item.status)}>
              Faire avancer →
            </Text>
          )}
        </View>
      )}
      ListEmptyComponent={<EmptyState message="Aucune commande pour le moment." />}
      ListHeaderComponent={
        <>
          {/* HEADER : salutation, revenu du jour, tendance, ouvert/fermé */}
          <View style={styles.heroHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>Bonjour, {shop.name}</Text>
              <Text style={styles.revenue}>
                {analytics?.revenueToday ?? 0} <Text style={styles.revenueUnit}>DJF</Text>
              </Text>
              {analytics?.revenueTrendPct != null ? (
                <Text style={[styles.trend, { color: analytics.revenueTrendPct >= 0 ? colors.success : colors.danger }]}>
                  <Ionicons name={analytics.revenueTrendPct >= 0 ? 'trending-up' : 'trending-down'} size={13} />{' '}
                  {analytics.revenueTrendPct >= 0 ? '+' : ''}{analytics.revenueTrendPct}% vs hier
                </Text>
              ) : (
                <Text style={styles.trendMuted}>Revenu du jour</Text>
              )}
            </View>
            <View style={styles.statusContainer}>
              <Text style={[styles.statusText, { color: isStoreOpen ? colors.success : colors.muted }]}>
                {isStoreOpen ? 'Ouvert' : 'Fermé'}
              </Text>
              <Switch
                value={isStoreOpen}
                onValueChange={toggleStoreOpen}
                disabled={togglingOpen}
                trackColor={{ false: colors.surfaceAlt, true: colors.primary + '80' }}
                thumbColor={isStoreOpen ? colors.primary : colors.muted}
              />
            </View>
          </View>

          {/* ACTIONS RAPIDES */}
          <View style={styles.quickActions}>
            <QuickAction icon="add-circle-outline" tint={colors.primary} label="Ajouter" styles={styles} colors={colors}
              onPress={() => navigation.navigate('ProductForm', { shopId: shop.id })} />
            <QuickAction icon="eye-outline" tint={colors.success} label="Ma vitrine" styles={styles} colors={colors}
              onPress={() => navigation.navigate('Shop', { shopId: shop.id })} />
            <QuickAction icon="pricetag-outline" tint="#FF9500" label="Promo" styles={styles} colors={colors}
              onPress={() => listRef.current?.scrollToEnd({ animated: true })} />
          </View>

          {/* COMMANDES URGENTES (à traiter) */}
          {urgentOrders.length > 0 && (
            <View style={styles.blockSection}>
              <Text style={styles.sectionTitle}>Commandes à traiter</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {urgentOrders.map((o) => (
                  <View key={o.id} style={styles.orderCard}>
                    <View style={styles.orderCardHeader}>
                      <Text style={styles.orderCardId}>#{o.id.slice(0, 6).toUpperCase()}</Text>
                      <StatusBadge status={o.status} />
                    </View>
                    <Text style={styles.orderCardAmount}>{o.totalAmount} DJF</Text>
                    <Text style={styles.orderCardMeta} numberOfLines={1}>
                      {o.deliveryAddress ? `Livraison · ${o.deliveryAddress}` : 'Retrait en magasin'}
                    </Text>
                    {nextActionLabel[o.status] ? (
                      <Pressable style={styles.orderCardBtn} onPress={() => advanceStatus(o.id, o.status)}>
                        <Text style={styles.orderCardBtnText}>{nextActionLabel[o.status]}</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ALERTES DE STOCK */}
          {lowStock.length > 0 && (
            <View style={styles.blockSection}>
              <Text style={styles.sectionTitle}>Alertes de stock</Text>
              {lowStock.map((p) => (
                <View key={p.id} style={styles.stockItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stockName}>{p.name}</Text>
                    <Text style={[styles.stockCount, { color: p.stock === 0 ? colors.danger : '#FF9500' }]}>
                      {p.stock === 0 ? 'Rupture de stock' : `Il ne reste que ${p.stock} ${p.stock > 1 ? 'unités' : 'unité'}`}
                    </Text>
                  </View>
                  <Pressable onPress={() => navigation.navigate('ProductForm', { shopId: shop.id, productId: p.id })}>
                    <Ionicons name="add-circle" size={28} color={colors.primary} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* STATISTIQUES DÉTAILLÉES (conservées) */}
          {analytics && (
            <>
              <Text style={styles.sectionTitle}>Statistiques</Text>
              <View style={styles.statsRow}>
                <Stat label="Commandes du jour" value={analytics.ordersToday} styles={styles} />
                <Stat label="Visites (jour)" value={analytics.visitsToday ?? 0} styles={styles} />
                <Stat label="Visites (7 j)" value={analytics.visits7d ?? 0} styles={styles} />
                <Stat label="Revenu total" value={`${analytics.revenueTotal} DJF`} styles={styles} />
                <Stat label="Produits actifs" value={analytics.activeProducts} styles={styles} />
                <Stat label="Ventes totales" value={shop.salesCount ?? '—'} styles={styles} />
              </View>
              {analytics.series?.length ? <VisitsSparkline series={analytics.series} styles={styles} colors={colors} /> : null}
            </>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Produits</Text>
            <Pressable
              style={styles.addButton}
              onPress={() => navigation.navigate('ProductForm', { shopId: shop.id })}
            >
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={styles.addButtonText}>Ajouter</Text>
            </Pressable>
          </View>

          {shopProducts.length === 0 ? (
            <Text style={styles.emptyHint}>Aucun produit pour le moment.</Text>
          ) : (
            shopProducts.map((p) => (
              <Pressable
                key={p.id}
                style={styles.productRow}
                onPress={() => navigation.navigate('ProductForm', { shopId: shop.id, productId: p.id })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>{p.name}</Text>
                  <Text style={styles.productMeta}>
                    {p.price} DJF · Stock: {p.stock}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </Pressable>
            ))
          )}

          <Text style={styles.sectionTitle}>Commandes récentes</Text>
        </>
      }
      ListFooterComponent={
        <View style={styles.promoSection}>
          <Text style={styles.sectionTitle}>Publicité sponsorisée</Text>

          <Text style={styles.label}>Mettre en avant</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            <Pressable
              style={[styles.chip, promoTarget?.type === 'shop' && styles.chipActive]}
              onPress={() => setPromoTarget({ type: 'shop', id: shop.id })}
            >
              <Text style={[styles.chipText, promoTarget?.type === 'shop' && styles.chipTextActive]}>Ma boutique</Text>
            </Pressable>
            {shopProducts.map((p) => (
              <Pressable
                key={p.id}
                style={[styles.chip, promoTarget?.type === 'product' && promoTarget.id === p.id && styles.chipActive]}
                onPress={() => setPromoTarget({ type: 'product', id: p.id })}
              >
                <Text style={[styles.chipText, promoTarget?.type === 'product' && promoTarget.id === p.id && styles.chipTextActive]}>
                  {p.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.label}>Budget (DJF)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={budget}
            onChangeText={setBudget}
            placeholder="5000"
            placeholderTextColor={colors.muted}
          />

          <Button label="Soumettre pour validation" onPress={submitPromotion} loading={submitting} />

          {myPromotions.length > 0 && (
            <View style={styles.promoList}>
              <Text style={styles.label}>Mes promotions</Text>
              {myPromotions.map((p) => (
                <View key={p.id} style={styles.promoRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.promoName}>{p.targetName ?? p.targetType}</Text>
                    <Text style={styles.promoStats}>
                      {p.impressions} vues · {p.clicks} clics · {p.budget} DJF
                    </Text>
                  </View>
                  <StatusBadge status={p.status} />
                </View>
              ))}
            </View>
          )}
        </View>
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

function QuickAction({ icon, tint, label, onPress, styles, colors }: { icon: any; tint: string; label: string; onPress: () => void; styles: any; colors: any }) {
  return (
    <Pressable style={styles.actionBtn} onPress={onPress}>
      <View style={[styles.iconCircle, { backgroundColor: tint + '1a' }]}>
        <Ionicons name={icon} size={22} color={tint} />
      </View>
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

// Mini-graphe en barres (7 jours de visites), pur RN — pas de lib de charts.
// La hauteur de chaque barre est proportionnelle au max de la série.
function VisitsSparkline({ series, styles, colors }: { series: { day: string; count: number }[]; styles: any; colors: any }) {
  const max = Math.max(1, ...series.map((s) => s.count));
  return (
    <View style={styles.sparkCard}>
      <Text style={styles.sparkTitle}>Visites — 7 derniers jours</Text>
      <View style={styles.sparkBars}>
        {series.map((s) => (
          <View key={s.day} style={styles.sparkCol}>
            <View style={[styles.sparkBar, { height: 6 + (s.count / max) * 46, backgroundColor: colors.primary }]} />
            <Text style={styles.sparkDay}>{new Date(s.day).toLocaleDateString(undefined, { weekday: 'narrow' })}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function makeStyles(
  theme: Palette,
  spacing: { xs: number; sm: number; md: number; lg: number; xxl: number },
  radius: { sm: number; pill: number },
  typography: { fontFamily: Record<string, string>; size: Record<string, number> }
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    content: { padding: 20, paddingTop: 60, paddingBottom: spacing.xxl },
    title: { fontSize: 20, fontFamily: typography.fontFamily.headingBold, color: theme.text, marginBottom: 16 },
    // --- Header riche (Phase 10) ---
    heroHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg + 4 },
    greeting: { fontSize: typography.size.sm, fontFamily: typography.fontFamily.body, color: theme.muted, marginBottom: 4 },
    revenue: { fontSize: 32, fontFamily: typography.fontFamily.headingBold, color: theme.text },
    revenueUnit: { fontSize: 18, color: theme.primary, fontFamily: typography.fontFamily.bodySemiBold },
    trend: { fontSize: typography.size.xs + 1, fontFamily: typography.fontFamily.bodySemiBold, marginTop: 4 },
    trendMuted: { fontSize: typography.size.xs + 1, fontFamily: typography.fontFamily.body, color: theme.muted, marginTop: 4 },
    statusContainer: { alignItems: 'center' },
    statusText: { fontSize: typography.size.xs, fontFamily: typography.fontFamily.bodySemiBold, marginBottom: 5 },
    // --- Actions rapides ---
    quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg + 6 },
    actionBtn: { alignItems: 'center', justifyContent: 'center', width: '31%', paddingVertical: spacing.md - 2, borderRadius: 16, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
    iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    actionText: { fontSize: typography.size.xs + 1, fontFamily: typography.fontFamily.bodySemiBold, color: theme.text },
    // --- Blocs (commandes urgentes / stock) ---
    blockSection: { marginBottom: spacing.lg + 6 },
    horizontalScroll: { marginHorizontal: -4 },
    orderCard: { width: 250, borderRadius: 18, padding: spacing.md, marginRight: spacing.sm + 4, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
    orderCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    orderCardId: { fontSize: typography.size.sm + 1, fontFamily: typography.fontFamily.bodySemiBold, color: theme.text },
    orderCardAmount: { fontSize: typography.size.lg - 2, fontFamily: typography.fontFamily.headingBold, color: theme.primary },
    orderCardMeta: { fontSize: typography.size.xs, fontFamily: typography.fontFamily.body, color: theme.muted, marginTop: 2, marginBottom: spacing.md },
    orderCardBtn: { paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: theme.primary },
    orderCardBtnText: { color: '#090A0F', fontFamily: typography.fontFamily.bodySemiBold, fontSize: typography.size.sm },
    stockItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderRadius: 14, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, marginBottom: spacing.sm },
    stockName: { fontSize: typography.size.sm + 1, fontFamily: typography.fontFamily.bodySemiBold, color: theme.text, marginBottom: 3 },
    stockCount: { fontSize: typography.size.xs, fontFamily: typography.fontFamily.bodyMedium },
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
    sparkCard: {
      backgroundColor: theme.surface,
      borderRadius: radius.sm + 4,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      marginBottom: 24,
    },
    sparkTitle: { fontSize: typography.size.xs + 1, fontFamily: typography.fontFamily.bodySemiBold, color: theme.muted, marginBottom: 10 },
    sparkBars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 64 },
    sparkCol: { alignItems: 'center', flex: 1 },
    sparkBar: { width: 14, borderRadius: 4 },
    sparkDay: { fontSize: 9, fontFamily: typography.fontFamily.body, color: theme.muted, marginTop: 4 },
    sectionTitle: { fontSize: typography.size.md, fontFamily: typography.fontFamily.heading, color: theme.text, marginBottom: 12 },
    orderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    orderAmount: { fontSize: typography.size.sm + 1, fontFamily: typography.fontFamily.bodySemiBold, color: theme.text, marginBottom: 4 },
    advance: { fontSize: typography.size.xs, fontFamily: typography.fontFamily.bodySemiBold, color: theme.primary },
    noShop: { flex: 1, backgroundColor: theme.background, padding: 20, paddingTop: 100, gap: spacing.lg },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    addButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    addButtonText: { fontSize: typography.size.xs + 1, fontFamily: typography.fontFamily.bodySemiBold, color: theme.primary },
    emptyHint: { fontSize: typography.size.sm, fontFamily: typography.fontFamily.body, color: theme.muted, marginBottom: spacing.md },
    productRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm + 4,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    productName: { fontSize: typography.size.sm + 1, fontFamily: typography.fontFamily.bodySemiBold, color: theme.text },
    productMeta: { fontSize: typography.size.xs, fontFamily: typography.fontFamily.body, color: theme.muted, marginTop: 2 },
    promoSection: { marginTop: spacing.lg + 8 },
    label: {
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.bodySemiBold,
      color: theme.muted,
      marginTop: spacing.sm + 4,
      marginBottom: spacing.xs + 2,
    },
    chipRow: { flexDirection: 'row' },
    chip: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.sm + 4,
      paddingVertical: spacing.xs + 2,
      marginRight: spacing.sm,
      backgroundColor: theme.surface,
    },
    chipActive: { borderColor: theme.primary, backgroundColor: theme.primary + '1a' },
    chipText: { fontSize: typography.size.xs + 1, fontFamily: typography.fontFamily.body, color: theme.muted },
    chipTextActive: { color: theme.primary, fontFamily: typography.fontFamily.bodySemiBold },
    input: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radius.sm + 4,
      height: 44,
      paddingHorizontal: spacing.sm + 4,
      marginBottom: spacing.md,
      fontFamily: typography.fontFamily.body,
      color: theme.text,
    },
    promoList: { marginTop: spacing.lg },
    promoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm + 4,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    promoName: { fontSize: typography.size.sm + 1, fontFamily: typography.fontFamily.bodySemiBold, color: theme.text },
    promoStats: { fontSize: typography.size.xs, fontFamily: typography.fontFamily.body, color: theme.muted, marginTop: 2 },
  });
}
