import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';
import { Button } from '../components/Button';
import { FilterChips } from '../components/FilterChips';
import * as catalogApi from '../api/catalog';

export function CreateShopScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, radius, typography), [colors, spacing, radius, typography]);
  const navigation = useNavigation<any>();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    catalogApi.fetchCategories().then(setCategories).catch(() => {});
  }, []);

  async function submit() {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom de la boutique est requis.');
      return;
    }
    setSubmitting(true);
    try {
      await catalogApi.createShop({
        name: name.trim(),
        description: description.trim() || undefined,
        address: address.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
        categoryId: categoryId || undefined,
      });
      Alert.alert('Boutique créée', 'Ta boutique est en ligne.');
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const categoryOptions = [{ value: '', label: 'Aucune' }, ...categories.map((c) => ({ value: c.id, label: c.name }))];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Créer ma boutique</Text>

      <Text style={styles.label}>Nom</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nom de la boutique" placeholderTextColor={colors.muted} />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder="Décris ta boutique"
        placeholderTextColor={colors.muted}
        multiline
      />

      <Text style={styles.label}>Adresse</Text>
      <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Adresse" placeholderTextColor={colors.muted} />

      <Text style={styles.label}>Logo (URL)</Text>
      <TextInput
        style={styles.input}
        value={logoUrl}
        onChangeText={setLogoUrl}
        placeholder="https://..."
        autoCapitalize="none"
        placeholderTextColor={colors.muted}
      />

      <Text style={styles.label}>Catégorie</Text>
      <View style={{ marginHorizontal: -(spacing.lg - 4) }}>
        <FilterChips options={categoryOptions} value={categoryId} onChange={setCategoryId} />
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <Button label="Créer ma boutique" onPress={submit} loading={submitting} />
      </View>
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
  });
}
