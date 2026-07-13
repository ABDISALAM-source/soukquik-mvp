import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';
import { Button } from '../components/Button';
import { FilterChips } from '../components/FilterChips';
import { EmptyState } from '../components/EmptyState';
import * as catalogApi from '../api/catalog';

export function ProductFormScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, radius, typography), [colors, spacing, radius, typography]);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { shopId, productId } = route.params as { shopId: string; productId?: string };
  const isEditing = !!productId;

  const [loading, setLoading] = useState(isEditing);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [imageUrl, setImageUrl] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    catalogApi.fetchCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEditing) return;
    catalogApi
      .fetchProduct(productId)
      .then((p: any) => {
        setName(p.name);
        setDescription(p.description || '');
        setPrice(String(p.price));
        setStock(String(p.stock));
        setImageUrl(p.imageUrl || '');
        setCategoryId(p.categoryId || '');
      })
      .finally(() => setLoading(false));
  }, [isEditing, productId]);

  async function submit() {
    const priceNum = Number(price);
    const stockNum = Number(stock);
    if (!name.trim() || !priceNum || priceNum <= 0) {
      Alert.alert('Erreur', 'Nom et prix valides requis.');
      return;
    }
    setSubmitting(true);
    try {
      const input = {
        name: name.trim(),
        description: description.trim() || undefined,
        price: priceNum,
        stock: Number.isFinite(stockNum) ? stockNum : 0,
        imageUrl: imageUrl.trim() || undefined,
        categoryId: categoryId || undefined,
      };
      if (isEditing) {
        await catalogApi.updateProduct(productId, input);
      } else {
        await catalogApi.createProduct(shopId, input);
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function confirmDeactivate() {
    if (!productId) return;
    const id = productId;
    Alert.alert('Désactiver ce produit', 'Il ne sera plus visible dans la boutique. Continuer ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Désactiver',
        style: 'destructive',
        onPress: async () => {
          setDeactivating(true);
          try {
            await catalogApi.deactivateProduct(id);
            navigation.goBack();
          } catch (err: any) {
            Alert.alert('Erreur', err.message);
          } finally {
            setDeactivating(false);
          }
        },
      },
    ]);
  }

  if (loading) return <EmptyState message="Chargement..." />;

  const categoryOptions = [{ value: '', label: 'Aucune' }, ...categories.map((c) => ({ value: c.id, label: c.name }))];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{isEditing ? 'Modifier le produit' : 'Ajouter un produit'}</Text>

      <Text style={styles.label}>Nom</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nom du produit" placeholderTextColor={colors.muted} />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Décris le produit"
        placeholderTextColor={colors.muted}
        multiline
      />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Prix (DJF)</Text>
          <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.muted} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Stock</Text>
          <TextInput style={styles.input} value={stock} onChangeText={setStock} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.muted} />
        </View>
      </View>

      <Text style={styles.label}>Image (URL)</Text>
      <TextInput
        style={styles.input}
        value={imageUrl}
        onChangeText={setImageUrl}
        placeholder="https://..."
        autoCapitalize="none"
        placeholderTextColor={colors.muted}
      />

      <Text style={styles.label}>Catégorie</Text>
      <View style={{ marginHorizontal: -(spacing.lg - 4) }}>
        <FilterChips options={categoryOptions} value={categoryId} onChange={setCategoryId} />
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <Button label={isEditing ? 'Enregistrer' : 'Ajouter le produit'} onPress={submit} loading={submitting} />
      </View>

      {isEditing && (
        <View style={{ marginTop: spacing.sm + 4 }}>
          <Button label="Désactiver ce produit" variant="secondary" onPress={confirmDeactivate} loading={deactivating} />
        </View>
      )}
    </ScrollView>
  );
}

function makeStyles(
  theme: Palette,
  spacing: { xs: number; sm: number; md: number; lg: number },
  radius: { sm: number },
  typography: { fontFamily: Record<string, string>; size: Record<string, number> }
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    content: { padding: spacing.lg - 4, paddingTop: 60, paddingBottom: spacing.lg + 20 },
    title: { fontSize: 22, fontFamily: typography.fontFamily.headingBold, color: theme.text, marginBottom: spacing.lg },
    label: {
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.bodySemiBold,
      color: theme.muted,
      marginBottom: spacing.xs + 2,
      marginTop: spacing.sm + 4,
    },
    input: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radius.sm + 4,
      height: 48,
      paddingHorizontal: spacing.md - 2,
      fontFamily: typography.fontFamily.body,
      color: theme.text,
    },
    textArea: { height: 90, paddingTop: spacing.sm + 2, textAlignVertical: 'top' },
    row: { flexDirection: 'row', gap: spacing.sm + 4 },
  });
}
