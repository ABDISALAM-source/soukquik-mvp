import React, { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { useCart } from '../store/cart';
import * as ordersApi from '../api/orders';

export function CartScreen() {
  const navigation = useNavigation<any>();
  const { items, removeItem, clear } = useCart();
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  async function placeOrder() {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const shopId = items[0].shopId;
      await ordersApi.createOrder({
        shopId,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        deliveryAddress: address,
      });
      clear();
      Alert.alert('Commande envoyée', 'Le vendeur va confirmer votre commande.');
      navigation.navigate('Home');
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) return <EmptyState message="Votre panier est vide." />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mon panier</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.productId}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.itemName}>{item.name} × {item.quantity}</Text>
            <Text style={styles.itemPrice}>{item.price * item.quantity} DJF</Text>
            <Text style={styles.remove} onPress={() => removeItem(item.productId)}>Retirer</Text>
          </View>
        )}
      />
      <Text style={styles.total}>Total : {total} DJF</Text>
      <TextInput
        style={styles.input}
        placeholder="Adresse de livraison"
        value={address}
        onChangeText={setAddress}
        placeholderTextColor={theme.muted}
      />
      <Button label="Commander" onPress={placeOrder} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, padding: 20, paddingTop: 60 },
  title: { fontSize: 22, fontWeight: '800', color: theme.text, marginBottom: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  itemName: { fontSize: 14, color: theme.text, flex: 1 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: theme.text, marginRight: 12 },
  remove: { color: theme.danger, fontSize: 12 },
  total: { fontSize: 18, fontWeight: '800', color: theme.text, marginVertical: 16 },
  input: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    marginBottom: 16,
    color: theme.text,
  },
});
