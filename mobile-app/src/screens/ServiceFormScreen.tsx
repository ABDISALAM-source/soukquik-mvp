import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';
import { Button } from '../components/Button';
import { FilterChips } from '../components/FilterChips';
import { EmptyState } from '../components/EmptyState';
import * as catalogApi from '../api/catalog';

export function ServiceFormScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, radius, typography), [colors, spacing, radius, typography]);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { serviceId } = (route.params ?? {}) as { serviceId?: string };
  const isEditing = !!serviceId;

  const [loading, setLoading] = useState(isEditing);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [priceUnit, setPriceUnit] = useState('forfait');
  const [serviceAreaKm, setServiceAreaKm] = useState('10');
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
      .fetchService(serviceId)
      .then((s: any) => {
        setTitle(s.title);
        setDescription(s.description || '');
        setPrice(String(s.price));
        setPriceUnit(s.priceUnit || 'forfait');
        setServiceAreaKm(String(s.serviceAreaKm ?? 10));
        setCategoryId(s.categoryId || '');
      })
      .finally(() => setLoading(false));
  }, [isEditing, serviceId]);

  async function submit() {
    const priceNum = Number(price);
    const areaNum = Number(serviceAreaKm);
    if (!title.trim() || !priceNum || priceNum <= 0) {
      Alert.alert('Erreur', 'Titre et prix valides requis.');
      return;
    }
    setSubmitting(true);
    try {
      const input = {
        title: title.trim(),
        description: description.trim() || undefined,
        price: priceNum,
        priceUnit: priceUnit.trim() || undefined,
        serviceAreaKm: Number.isFinite(areaNum) && areaNum > 0 ? areaNum : undefined,
        categoryId: categoryId || undefined,
      };
      if (isEditing) {
        await catalogApi.updateService(serviceId, input);
      } else {
        await catalogApi.createService(input);
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function confirmDeactivate() {
    if (!serviceId) return;
    const id = serviceId;
    Alert.alert('Désactiver ce service', 'Il ne sera plus visible dans les résultats. Continuer ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Désactiver',
        style: 'destructive',
        onPress: async () => {
          setDeactivating(true);
          try {
            await catalogApi.deactivateService(id);
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
      <Text style={styles.title}>{isEditing ? 'Modifier le service' : 'Ajouter un service'}</Text>

      <Text style={styles.label}>Titre</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Titre du service" placeholderTextColor={colors.muted} />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Décris le service"
        placeholderTextColor={colors.muted}
        multiline
      />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Prix (DJF)</Text>
          <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.muted} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Unité</Text>
          <TextInput style={styles.input} value={priceUnit} onChangeText={setPriceUnit} placeholder="forfait, heure..." placeholderTextColor={colors.muted} />
        </View>
      </View>

      <Text style={styles.label}>Zone d'intervention (km)</Text>
      <TextInput
        style={styles.input}
        value={serviceAreaKm}
        onChangeText={setServiceAreaKm}
        keyboardType="numeric"
        placeholder="10"
        placeholderTextColor={colors.muted}
      />

      <Text style={styles.label}>Catégorie</Text>
      <View style={{ marginHorizontal: -(spacing.lg - 4) }}>
        <FilterChips options={categoryOptions} value={categoryId} onChange={setCategoryId} />
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <Button label={isEditing ? 'Enregistrer' : 'Ajouter le service'} onPress={submit} loading={submitting} />
      </View>

      {isEditing && (
        <View style={{ marginTop: spacing.sm + 4 }}>
          <Button label="Désactiver ce service" variant="secondary" onPress={confirmDeactivate} loading={deactivating} />
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
