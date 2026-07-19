import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { FormHeader } from '../components/FormHeader';
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
  const [stock, setStock] = useState('1');
  const [imageUrl, setImageUrl] = useState('');
  const [tagsText, setTagsText] = useState('');

  // Cascade catégorie -> sous-catégorie
  const [rootCategories, setRootCategories] = useState<any[]>([]);
  const [rootId, setRootId] = useState('');
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [subId, setSubId] = useState('');

  // Marque (autocomplétion + création à la volée)
  const [brandQuery, setBrandQuery] = useState('');
  const [brandId, setBrandId] = useState('');
  const [brandSuggestions, setBrandSuggestions] = useState<{ id: string; name: string }[]>([]);

  // Indice de prix (fourchette de la catégorie)
  const [priceHint, setPriceHint] = useState<{ count: number; min: number | null; median: number | null; max: number | null } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    catalogApi.fetchRootCategories().then(setRootCategories).catch(() => {});
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
        setTagsText((p.tags || []).join(', '));
        if (p.brandId) setBrandId(p.brandId);
        // On repositionne au moins la sélection de catégorie de tête si elle
        // correspond à une racine (le pré-remplissage fin de la sous-catégorie
        // se fait à l'ouverture si l'utilisateur re-parcourt).
        if (p.categoryId) setSubId(p.categoryId);
      })
      .finally(() => setLoading(false));
  }, [isEditing, productId]);

  // Charge les sous-catégories quand une catégorie racine est choisie.
  useEffect(() => {
    if (!rootId) {
      setSubcategories([]);
      return;
    }
    catalogApi.fetchSubcategories(rootId).then(setSubcategories).catch(() => setSubcategories([]));
  }, [rootId]);

  // La catégorie effective du produit = sous-catégorie si choisie, sinon racine.
  const effectiveCategoryId = subId || rootId;

  // Indice de prix : recalculé quand la catégorie effective change.
  useEffect(() => {
    if (!effectiveCategoryId) {
      setPriceHint(null);
      return;
    }
    catalogApi.fetchPriceHint(effectiveCategoryId).then(setPriceHint).catch(() => setPriceHint(null));
  }, [effectiveCategoryId]);

  // Autocomplétion marque (déclenchée à la frappe).
  useEffect(() => {
    const q = brandQuery.trim();
    if (q.length < 1) {
      setBrandSuggestions([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      catalogApi.searchBrands(q).then((r) => !cancelled && setBrandSuggestions(r)).catch(() => {});
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [brandQuery]);

  function pickBrand(b: { id: string; name: string }) {
    setBrandId(b.id);
    setBrandQuery(b.name);
    setBrandSuggestions([]);
  }

  async function submit() {
    const priceNum = Number(price);
    const stockNum = Number(stock);
    if (!name.trim() || !priceNum || priceNum <= 0) {
      Alert.alert('Erreur', 'Nom et prix valides requis.');
      return;
    }
    setSubmitting(true);
    try {
      // Résout la marque : si un nom est tapé sans id sélectionné, on la
      // crée/retrouve (dédup insensible à la casse côté serveur).
      let resolvedBrandId = brandId || undefined;
      const typedBrand = brandQuery.trim();
      if (typedBrand && !resolvedBrandId) {
        const brand = await catalogApi.findOrCreateBrand(typedBrand);
        resolvedBrandId = brand.id;
      }
      const tags = tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const input = {
        name: name.trim(),
        description: description.trim() || undefined,
        price: priceNum,
        stock: Number.isFinite(stockNum) ? stockNum : 0,
        imageUrl: imageUrl.trim() || undefined,
        categoryId: effectiveCategoryId || undefined,
        brandId: resolvedBrandId,
        tags: tags.length ? tags : undefined,
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

  return (
    <View style={styles.screen}>
      <FormHeader title={isEditing ? 'Modifier le produit' : 'Ajouter un produit'} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* 1. CATÉGORIE */}
      <Text style={styles.step}>1 · Catégorie</Text>
      <View style={styles.chipWrap}>
        {rootCategories.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => {
              setRootId(c.id);
              setSubId('');
            }}
            style={[styles.chip, rootId === c.id && styles.chipActive]}
          >
            <Text style={[styles.chipText, rootId === c.id && styles.chipTextActive]}>{c.name}</Text>
          </Pressable>
        ))}
      </View>

      {/* 2. SOUS-CATÉGORIE (si la catégorie en a) */}
      {subcategories.length > 0 && (
        <>
          <Text style={styles.step}>2 · Précise (sous-catégorie)</Text>
          <View style={styles.chipWrap}>
            {subcategories.map((c) => (
              <Pressable key={c.id} onPress={() => setSubId(c.id)} style={[styles.chip, subId === c.id && styles.chipActive]}>
                <Text style={[styles.chipText, subId === c.id && styles.chipTextActive]}>{c.name}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {/* 3. MARQUE (autocomplétion + création) */}
      <Text style={styles.step}>{subcategories.length > 0 ? '3' : '2'} · Marque</Text>
      <TextInput
        style={styles.input}
        value={brandQuery}
        onChangeText={(t) => {
          setBrandQuery(t);
          setBrandId(''); // toute frappe annule la sélection précédente
        }}
        placeholder="Ex: Nike, Samsung..."
        placeholderTextColor={colors.muted}
        autoCapitalize="words"
      />
      {brandSuggestions.length > 0 && (
        <View style={styles.suggestBox}>
          {brandSuggestions.map((b) => (
            <Pressable key={b.id} onPress={() => pickBrand(b)} style={styles.suggestItem}>
              <Text style={styles.suggestText}>{b.name}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* 4. NOM */}
      <Text style={styles.step}>{subcategories.length > 0 ? '4' : '3'} · Nom de l'article</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nom du produit" placeholderTextColor={colors.muted} />

      {/* 5. PRIX + STOCK */}
      <Text style={styles.step}>{subcategories.length > 0 ? '5' : '4'} · Prix & stock</Text>
      {priceHint && priceHint.count > 0 && priceHint.median != null && (
        <Text style={styles.hint}>
          💡 Dans cette catégorie : {priceHint.min}–{priceHint.max} DJF (médiane {priceHint.median})
        </Text>
      )}
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Prix (DJF)</Text>
          <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.muted} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Exemplaires en stock</Text>
          <TextInput style={styles.input} value={stock} onChangeText={setStock} keyboardType="numeric" placeholder="1" placeholderTextColor={colors.muted} />
        </View>
      </View>

      {/* 6. DÉTAILS */}
      <Text style={styles.step}>{subcategories.length > 0 ? '6' : '5'} · Détails</Text>
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Décris le produit"
        placeholderTextColor={colors.muted}
        multiline
      />
      <Text style={styles.label}>Tags (couleur, taille, matière…) séparés par des virgules</Text>
      <TextInput
        style={styles.input}
        value={tagsText}
        onChangeText={setTagsText}
        placeholder="rouge, XL, coton"
        placeholderTextColor={colors.muted}
      />
      <Text style={styles.label}>Image (URL)</Text>
      <TextInput
        style={styles.input}
        value={imageUrl}
        onChangeText={setImageUrl}
        placeholder="https://..."
        autoCapitalize="none"
        placeholderTextColor={colors.muted}
      />

      <View style={{ marginTop: spacing.lg }}>
        <Button label={isEditing ? 'Enregistrer' : 'Ajouter le produit'} onPress={submit} loading={submitting} />
      </View>

      {isEditing && (
        <View style={{ marginTop: spacing.sm + 4 }}>
          <Button label="Désactiver ce produit" variant="secondary" onPress={confirmDeactivate} loading={deactivating} />
        </View>
      )}
      </ScrollView>
    </View>
  );
}

function makeStyles(
  theme: Palette,
  spacing: { xs: number; sm: number; md: number; lg: number },
  radius: { sm: number; pill: number },
  typography: { fontFamily: Record<string, string>; size: Record<string, number> }
) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.background },
    container: { flex: 1, backgroundColor: theme.background },
    content: { padding: spacing.lg - 4, paddingTop: spacing.md, paddingBottom: spacing.lg + 20 },
    step: {
      fontSize: typography.size.sm + 1,
      fontFamily: typography.fontFamily.bodySemiBold,
      color: theme.primary,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    label: {
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.bodySemiBold,
      color: theme.muted,
      marginBottom: spacing.xs + 2,
      marginTop: spacing.sm,
    },
    hint: {
      fontSize: typography.size.xs + 1,
      fontFamily: typography.fontFamily.body,
      color: theme.muted,
      marginBottom: spacing.sm,
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
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md - 2,
      paddingVertical: spacing.xs + 3,
      backgroundColor: theme.surface,
    },
    chipActive: { borderColor: theme.primary, backgroundColor: theme.primary + '1a' },
    chipText: { fontSize: typography.size.xs + 1, fontFamily: typography.fontFamily.body, color: theme.muted },
    chipTextActive: { color: theme.primary, fontFamily: typography.fontFamily.bodySemiBold },
    suggestBox: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radius.sm + 4,
      marginTop: 4,
      overflow: 'hidden',
    },
    suggestItem: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
    suggestText: { fontSize: typography.size.sm, fontFamily: typography.fontFamily.body, color: theme.text },
  });
}
