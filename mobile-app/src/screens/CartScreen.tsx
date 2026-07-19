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

const fmt = (n: number) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n)} DJF`;

export function CartScreen() {
  const { colors, spacing, radius, shadow, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, radius, shadow, typography), [colors, spacing, radius, shadow, typography]);
  const navigation = useNavigation<any>();
  const { items, removeItem, setQuantity, clear } = useCart();
  const [mode, setMode] = useState<'pickup' | 'delivery'>('pickup');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((n, i) => n + i.quantity, 0);

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

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Mon panier</Text>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState
            icon="cart-outline"
            title="Ton panier est vide"
            message="Ajoute des articles depuis les boutiques pour passer commande."
            actionLabel="Découvrir des boutiques"
            onAction={() => navigation.navigate('Home')}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mon panier</Text>
        <Text style={styles.count}>{count} article{count > 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.productId}
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemThumb}>
              <Ionicons name="cube-outline" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.itemUnit}>{fmt(item.price)} / unité</Text>
              <View style={styles.stepper}>
                <Pressable style={styles.stepBtn} onPress={() => setQuantity(item.productId, item.quantity - 1)} hitSlop={6}>
                  <Ionicons name="remove" size={16} color={colors.text} />
                </Pressable>
                <Text style={styles.stepQty}>{item.quantity}</Text>
                <Pressable style={styles.stepBtn} onPress={() => setQuantity(item.productId, item.quantity + 1)} hitSlop={6}>
                  <Ionicons name="add" size={16} color={colors.text} />
                </Pressable>
              </View>
            </View>
            <View style={styles.itemRight}>
              <Pressable onPress={() => removeItem(item.productId)} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </Pressable>
              <Text style={styles.itemTotal}>{fmt(item.price * item.quantity)}</Text>
            </View>
          </View>
        )}
      />

      {/* Récap + mode + commande */}
      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryTotal}>{fmt(total)}</Text>
        </View>

        <View style={styles.modeRow}>
          <Pressable style={[styles.modeCard, mode === 'pickup' && styles.modeCardActive]} onPress={() => setMode('pickup')}>
            <Ionicons name="storefront-outline" size={18} color={mode === 'pickup' ? colors.primary : colors.muted} />
            <Text style={[styles.modeLabel, mode === 'pickup' && styles.modeLabelActive]}>Retrait</Text>
          </Pressable>
          <Pressable style={[styles.modeCard, mode === 'delivery' && styles.modeCardActive]} onPress={() => setMode('delivery')}>
            <Ionicons name="bicycle-outline" size={18} color={mode === 'delivery' ? colors.primary : colors.muted} />
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

        <Button label={`Commander · ${fmt(total)}`} icon="bag-check-outline" onPress={placeOrder} loading={loading} />
      </View>
    </View>
  );
}

function makeStyles(
  theme: Palette,
  spacing: { xs: number; sm: number; md: number; lg: number },
  radius: { sm: number; md: number; lg: number; pill: number },
  shadow: { md: object },
  typography: { fontFamily: Record<string, string>; size: Record<string, number> }
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background, padding: spacing.md, paddingTop: 60 },
    header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: spacing.md },
    title: { fontSize: 22, fontFamily: typography.fontFamily.headingBold, color: theme.text },
    count: { fontSize: typography.size.sm, fontFamily: typography.fontFamily.bodyMedium, color: theme.muted },

    itemCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm + 2,
      backgroundColor: theme.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.border,
      padding: spacing.sm + 2,
    },
    itemThumb: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primary + '16',
    },
    itemName: { fontSize: typography.size.md, fontFamily: typography.fontFamily.bodySemiBold, color: theme.text },
    itemUnit: { fontSize: typography.size.xs, fontFamily: typography.fontFamily.body, color: theme.muted, marginTop: 1 },
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: spacing.md,
      marginTop: spacing.sm,
      backgroundColor: theme.surfaceAlt,
      borderRadius: radius.pill,
      paddingHorizontal: 6,
      paddingVertical: 3,
    },
    stepBtn: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface },
    stepQty: { fontSize: typography.size.sm, fontFamily: typography.fontFamily.bodySemiBold, color: theme.text, minWidth: 16, textAlign: 'center' },
    itemRight: { alignItems: 'flex-end', justifyContent: 'space-between', alignSelf: 'stretch' },
    itemTotal: { fontSize: typography.size.md, fontFamily: typography.fontFamily.bodySemiBold, color: theme.text },

    summary: {
      backgroundColor: theme.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: theme.border,
      padding: spacing.md,
      gap: spacing.sm + 2,
      ...shadow.md,
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryLabel: { fontSize: typography.size.md, fontFamily: typography.fontFamily.bodyMedium, color: theme.muted },
    summaryTotal: { fontSize: typography.size.lg, fontFamily: typography.fontFamily.headingBold, color: theme.text },
    modeRow: { flexDirection: 'row', gap: spacing.sm },
    modeCard: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 11,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.background,
    },
    modeCardActive: { borderColor: theme.primary, backgroundColor: theme.primary + '1a' },
    modeLabel: { fontSize: typography.size.sm, fontFamily: typography.fontFamily.bodyMedium, color: theme.muted },
    modeLabelActive: { color: theme.primary, fontFamily: typography.fontFamily.bodySemiBold },
    input: {
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radius.md,
      height: 48,
      paddingHorizontal: spacing.md - 2,
      fontFamily: typography.fontFamily.body,
      color: theme.text,
    },
  });
}
