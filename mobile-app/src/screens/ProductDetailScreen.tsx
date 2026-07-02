import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { api } from '../api/client';
import { useCart } from '../store/cart';

export function ProductDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { productId, shopId } = route.params;
  const [product, setProduct] = useState<any>(null);
  const addItem = useCart((s) => s.addItem);

  useEffect(() => {
    api.get(`/products/${productId}`).then((res) => setProduct(res.data.data));
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, padding: 20, paddingTop: 60 },
  name: { fontSize: 22, fontWeight: '800', color: theme.text },
  price: { fontSize: 18, fontWeight: '700', color: theme.primary, marginTop: 8 },
  stock: { fontSize: 13, color: theme.muted, marginTop: 4 },
  description: { fontSize: 14, color: theme.text, marginTop: 16, lineHeight: 20 },
});
