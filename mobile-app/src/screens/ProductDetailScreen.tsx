import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';
import { EmptyState } from '../components/EmptyState';
import { BackButton } from '../components/BackButton';
import { api } from '../api/client';
import * as catalogApi from '../api/catalog';
import { useCart } from '../store/cart';

const fmt = (n: number) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n)} DJF`;

export function ProductDetailScreen() {
  const { colors, spacing, radius, shadow, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, radius, shadow, typography), [colors, spacing, radius, shadow, typography]);
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { productId, shopId } = route.params;
  const [product, setProduct] = useState<any>(null);
  const [qty, setQty] = useState(1);
  const addItem = useCart((s) => s.addItem);

  useEffect(() => {
    api.get(`/products/${productId}`).then((res) => setProduct(res.data.data));
    catalogApi.trackProductView(productId);
  }, [productId]);

  if (!product) return <EmptyState icon="cube-outline" message="Chargement…" />;

  const inStock = product.stock > 0;

  function handleAddToCart() {
    addItem({ productId: product.id, name: product.name, price: product.price, quantity: qty, shopId });
    Alert.alert('Ajouté au panier', `${qty} × ${product.name}`, [
      { text: 'Continuer mes achats' },
      { text: 'Voir le panier', onPress: () => navigation.navigate('Cart') },
    ]);
  }

  return (
    <View style={styles.container}>
      <BackButton />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* HÉRO IMAGE */}
        <View style={styles.hero}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={styles.heroImg} resizeMode="cover" />
          ) : (
            <ImageBackground source={require('../../assets/grad-blue.png')} style={styles.heroImg}>
              <View style={styles.heroPlaceholder}>
                <Text style={styles.heroInitial}>{product.name?.charAt(0).toUpperCase()}</Text>
              </View>
            </ImageBackground>
          )}
          <Image source={require('../../assets/scrim.png')} style={styles.scrim} resizeMode="stretch" />
        </View>

        {/* CARTE FLOTTANTE */}
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <View style={styles.titleRow}>
            <Text style={styles.name}>{product.name}</Text>
            <View style={[styles.stockPill, { backgroundColor: (inStock ? colors.success : colors.danger) + '1f' }]}>
              <Ionicons name={inStock ? 'checkmark-circle' : 'close-circle'} size={13} color={inStock ? colors.success : colors.danger} />
              <Text style={[styles.stockText, { color: inStock ? colors.success : colors.danger }]}>
                {inStock ? `${product.stock} en stock` : 'Rupture'}
              </Text>
            </View>
          </View>

          <Text style={styles.price}>{fmt(product.price)}</Text>

          {product.description ? (
            <View style={styles.descCard}>
              <Text style={styles.descTitle}>Description</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          ) : null}

          {/* Quantité */}
          <View style={styles.qtyRow}>
            <Text style={styles.qtyLabel}>Quantité</Text>
            <View style={styles.stepper}>
              <Pressable style={styles.stepBtn} onPress={() => setQty((q) => Math.max(1, q - 1))} hitSlop={6}>
                <Ionicons name="remove" size={18} color={colors.text} />
              </Pressable>
              <Text style={styles.qtyValue}>{qty}</Text>
              <Pressable
                style={styles.stepBtn}
                onPress={() => setQty((q) => Math.min(inStock ? product.stock : 1, q + 1))}
                hitSlop={6}
              >
                <Ionicons name="add" size={18} color={colors.text} />
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* BARRE D'ACHAT COLLÉE */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomLabel}>Total</Text>
          <Text style={styles.bottomTotal}>{fmt(product.price * qty)}</Text>
        </View>
        <Pressable
          style={[styles.cta, !inStock && styles.ctaDisabled]}
          onPress={handleAddToCart}
          disabled={!inStock}
        >
          <Ionicons name="cart" size={18} color="#fff" />
          <Text style={styles.ctaText}>{inStock ? 'Ajouter au panier' : 'Indisponible'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(
  theme: Palette,
  spacing: { xs: number; sm: number; md: number; lg: number },
  radius: { sm: number; md: number; lg: number; pill: number },
  shadow: { md: object; lg: object },
  typography: { fontFamily: Record<string, string>; size: Record<string, number> }
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    hero: { height: 340, backgroundColor: theme.surfaceAlt },
    heroImg: { width: '100%', height: '100%' },
    heroPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    heroInitial: { fontSize: 96, fontFamily: typography.fontFamily.headingBold, color: 'rgba(255,255,255,0.85)' },
    scrim: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 },
    sheet: {
      marginTop: -28,
      backgroundColor: theme.background,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: spacing.lg - 4,
      paddingTop: spacing.sm,
      paddingBottom: spacing.lg,
    },
    grabber: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: theme.border, marginBottom: spacing.md },
    titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
    name: { flex: 1, fontSize: 24, fontFamily: typography.fontFamily.headingBold, color: theme.text },
    stockPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
    stockText: { fontSize: typography.size.xs, fontFamily: typography.fontFamily.bodySemiBold },
    price: { fontSize: 28, fontFamily: typography.fontFamily.headingBold, color: theme.primary, marginTop: spacing.sm },
    descCard: {
      backgroundColor: theme.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.border,
      padding: spacing.md,
      marginTop: spacing.lg,
    },
    descTitle: { fontSize: typography.size.sm, fontFamily: typography.fontFamily.bodySemiBold, color: theme.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    description: { fontSize: typography.size.md, fontFamily: typography.fontFamily.body, color: theme.text, lineHeight: 22 },
    qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg },
    qtyLabel: { fontSize: typography.size.md, fontFamily: typography.fontFamily.bodySemiBold, color: theme.text },
    stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, backgroundColor: theme.surface, borderRadius: radius.pill, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 6, paddingVertical: 4 },
    stepBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surfaceAlt },
    qtyValue: { fontSize: typography.size.md, fontFamily: typography.fontFamily.headingBold, color: theme.text, minWidth: 20, textAlign: 'center' },
    bottomBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingHorizontal: spacing.lg - 4,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg + 6,
      backgroundColor: theme.surface,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      ...shadow.lg,
    },
    bottomLabel: { fontSize: typography.size.xs, fontFamily: typography.fontFamily.body, color: theme.muted },
    bottomTotal: { fontSize: typography.size.lg, fontFamily: typography.fontFamily.headingBold, color: theme.text },
    cta: { flex: 1, maxWidth: 220, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, height: 52, borderRadius: radius.md, backgroundColor: theme.primary },
    ctaDisabled: { backgroundColor: theme.muted },
    ctaText: { color: '#fff', fontSize: typography.size.md, fontFamily: typography.fontFamily.bodySemiBold },
  });
}
