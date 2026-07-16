import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { useCart } from '../store/cart';
import * as ordersApi from '../api/orders';

export function CartScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, radius, typography), [colors, spacing, radius, typography]);
  const navigation = useNavigation<any>();
  const { items, removeItem, clear } = useCart();
  // Choix explicite du mode : retrait en magasin (aucune adresse) ou livraison.
  const [mode, setMode] = useState<'pickup' | 'delivery'>('pickup');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  async function placeOrder() {
    if (items.length === 0) return;
    if (mode === 'delivery' && !address.trim()) {
      Alert.alert('Adresse requise', 'Indique une adresse de livraison, ou choisis le retrait en magasin.');
      return;
    }
    setLoading(true);
    try {
      const shopId = items[0].shopId;
      await ordersApi.createOrder({
        shopId,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        deliveryAddress: mode === 'delivery' ? address.trim() : undefined,
      });
      clear();
      Alert.alert(
        'Commande envoyée',
        mode === 'delivery'
          ? 'Le vendeur va confirmer et préparer la livraison.'
          : 'Le vendeur va confirmer. Tu pourras retirer ta commande en magasin.'
      );
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

      {/* Retrait vs Livraison */}
      <View style={styles.modeRow}>
        <Pressable style={[styles.modeCard, mode === 'pickup' && styles.modeCardActive]} onPress={() => setMode('pickup')}>
          <Ionicons name="storefront-outline" size={20} color={mode === 'pickup' ? colors.primary : colors.muted} />
          <Text style={[styles.modeLabel, mode === 'pickup' && styles.modeLabelActive]}>Retrait en magasin</Text>
        </Pressable>
        <Pressable style={[styles.modeCard, mode === 'delivery' && styles.modeCardActive]} onPress={() => setMode('delivery')}>
          <Ionicons name="bicycle-outline" size={20} color={mode === 'delivery' ? colors.primary : colors.muted} />
          <Text style={[styles.modeLabel, mode === 'delivery' && styles.modeLabelActive]}>Livraison</Text>
        </Pressable>
      </View>

      {mode === 'delivery' && (
        <TextInput
          style={styles.input}
          placeholder="Adresse de livraison"
          value={address}
          onChangeText={setAddress}
          placeholderTextColor={colors.muted}
        />
      )}

      <Button label={mode === 'delivery' ? 'Commander (livraison)' : 'Commander (retrait)'} onPress={placeOrder} loading={loading} />
    </View>
  );
}

function makeStyles(
  theme: Palette,
  spacing: { sm: number; md: number },
  radius: { sm: number },
  typography: { fontFamily: Record<string, string>; size: Record<string, number> }
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background, padding: 20, paddingTop: 60 },
    modeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    modeCard: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      borderRadius: radius.sm + 4,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
    },
    modeCardActive: { borderColor: theme.primary, backgroundColor: theme.primary + '1a' },
    modeLabel: { fontSize: typography.size.sm, fontFamily: typography.fontFamily.bodyMedium, color: theme.muted },
    modeLabelActive: { color: theme.primary, fontFamily: typography.fontFamily.bodySemiBold },
    title: { fontSize: 22, fontFamily: typography.fontFamily.headingBold, color: theme.text, marginBottom: 16 },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    itemName: { fontSize: typography.size.md - 2, fontFamily: typography.fontFamily.body, color: theme.text, flex: 1 },
    itemPrice: { fontSize: typography.size.md - 2, fontFamily: typography.fontFamily.bodySemiBold, color: theme.text, marginRight: 12 },
    remove: { color: theme.danger, fontSize: typography.size.xs, fontFamily: typography.fontFamily.body },
    total: { fontSize: typography.size.lg - 2, fontFamily: typography.fontFamily.bodySemiBold, color: theme.text, marginVertical: 16 },
    input: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radius.sm + 4,
      height: 48,
      paddingHorizontal: spacing.md - 2,
      marginBottom: spacing.md,
      fontFamily: typography.fontFamily.body,
      color: theme.text,
    },
  });
}
