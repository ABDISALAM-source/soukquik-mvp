import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { api } from '../api/client';
import * as catalogApi from '../api/catalog';
import { useCart } from '../store/cart';

export function ProductDetailScreen() {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, typography), [colors, typography]);
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { productId, shopId } = route.params;
  const [product, setProduct] = useState<any>(null);
  const addItem = useCart((s) => s.addItem);

  useEffect(() => {
    api.get(`/products/${productId}`).then((res) => setProduct(res.data.data));
    // Enregistre une vue produit (Phase 10) — alimente "les plus vus".
    catalogApi.trackProductView(productId);
  }, [productId]);

  if (!product) return <EmptyState message="Chargement..." />;

  function handleAddToCart() {
    addItem({ productId: product.id, name: product.name, price: product.price, quantity: 1, shopId });
    Alert.alert('Ajouté', `${product.name} ajouté au panier.`, [
      { text: 'Continuer' },
      { text: 'Voir le panier', onPress: () => navigation.navigate('Cart') },
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{product.name}</Text>
      <Text style={styles.price}>{product.price} DJF</Text>
      <Text style={styles.stock}>{product.stock > 0 ? `${product.stock} en stock` : 'Rupture de stock'}</Text>
      {product.description ? <Text style={styles.description}>{product.description}</Text> : null}

      <View style={{ marginTop: 32 }}>
        <Button label="Ajouter au panier" onPress={handleAddToCart} disabled={product.stock <= 0} />
      </View>
    </View>
  );
}

function makeStyles(theme: Palette, typography: { fontFamily: Record<string, string>; size: Record<string, number> }) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background, padding: 20, paddingTop: 60 },
    name: { fontSize: 22, fontFamily: typography.fontFamily.headingBold, color: theme.text },
    price: { fontSize: typography.size.lg - 2, fontFamily: typography.fontFamily.bodySemiBold, color: theme.primary, marginTop: 8 },
    stock: { fontSize: typography.size.sm - 1, fontFamily: typography.fontFamily.body, color: theme.muted, marginTop: 4 },
    description: { fontSize: typography.size.md - 2, fontFamily: typography.fontFamily.body, color: theme.text, marginTop: 16, lineHeight: 20 },
  });
}
