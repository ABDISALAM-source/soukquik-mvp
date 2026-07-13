import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import * as catalogApi from '../api/catalog';

export function ShopScreen() {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, typography), [colors, typography]);
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { shopId } = route.params;
  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    catalogApi.fetchShop(shopId).then(setShop);
    catalogApi.fetchShopProducts(shopId).then(setProducts);
  }, [shopId]);

  if (!shop) return <EmptyState message="Chargement..." />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{shop.name}</Text>
        {shop.address ? <Text style={styles.address}>{shop.address}</Text> : null}
        {shop.description ? <Text style={styles.description}>{shop.description}</Text> : null}
      </View>

      <Text style={styles.sectionTitle}>Produits</Text>
      {products.length === 0 ? (
        <EmptyState message="Aucun produit disponible dans cette boutique." />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 12 }}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <Card
                title={item.name}
                subtitle={`${item.price} DJF`}
                imageUrl={item.imageUrl}
                onPress={() => navigation.navigate('ProductDetail', { productId: item.id, shopId })}
              />
            </View>
          )}
        />
      )}
    </View>
  );
}

function makeStyles(theme: Palette, typography: { fontFamily: Record<string, string>; size: Record<string, number> }) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { padding: 20, paddingTop: 60 },
    name: { fontSize: 24, fontFamily: typography.fontFamily.headingBold, color: theme.text },
    address: { fontSize: typography.size.sm - 1, fontFamily: typography.fontFamily.body, color: theme.muted, marginTop: 4 },
    description: { fontSize: typography.size.md - 2, fontFamily: typography.fontFamily.body, color: theme.text, marginTop: 12 },
    sectionTitle: {
      fontSize: typography.size.lg - 3,
      fontFamily: typography.fontFamily.heading,
      color: theme.text,
      marginLeft: 20,
      marginBottom: 12,
    },
    gridItem: { width: '50%', marginBottom: 12 },
  });
}
