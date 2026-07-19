import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';
import { Button } from '../components/Button';
import { FilterChips } from '../components/FilterChips';
import { FormHeader } from '../components/FormHeader';
import { pickImageAsDataUri } from '../utils/imagePick';
import * as catalogApi from '../api/catalog';

export function CreateShopScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, radius, typography), [colors, spacing, radius, typography]);
  const navigation = useNavigation<any>();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
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
        logoUrl: logoUrl ?? undefined,
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
    <View style={styles.screen}>
      <FormHeader title="Créer ma boutique" subtitle="Renseigne les informations principales" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <Pressable style={styles.logoRow} onPress={async () => { const uri = await pickImageAsDataUri(500); if (uri) setLogoUrl(uri); }}>
          <View style={styles.logoThumb}>
            {logoUrl ? <Image source={{ uri: logoUrl }} style={styles.logoImg} /> : <Ionicons name="image-outline" size={24} color={colors.muted} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.logoLabel}>Logo de la boutique</Text>
            <Text style={styles.logoHint}>{logoUrl ? 'Appuie pour changer' : 'Optionnel · appuie pour choisir'}</Text>
          </View>
          {logoUrl ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}
        </Pressable>

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

        <Text style={styles.label}>Catégorie</Text>
        <View style={{ marginHorizontal: -spacing.md }}>
          <FilterChips options={categoryOptions} value={categoryId} onChange={setCategoryId} />
        </View>

        <View style={{ marginTop: spacing.lg }}>
          <Button label="Créer ma boutique" icon="storefront-outline" onPress={submit} loading={submitting} />
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(
  theme: Palette,
  spacing: { xs: number; sm: number; md: number; lg: number },
  radius: { sm: number; md: number },
  typography: { fontFamily: Record<string, string>; size: Record<string, number> }
) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.background },
    content: { padding: spacing.md, paddingBottom: spacing.lg + 20 },
    logoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm + 2,
      backgroundColor: theme.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.border,
      padding: spacing.sm + 2,
      marginBottom: spacing.md,
    },
    logoThumb: { width: 54, height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.primary + '14', overflow: 'hidden' },
    logoImg: { width: 54, height: 54 },
    logoLabel: { fontSize: typography.size.md, fontFamily: typography.fontFamily.bodySemiBold, color: theme.text },
    logoHint: { fontSize: typography.size.sm, fontFamily: typography.fontFamily.body, color: theme.muted, marginTop: 2 },
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
      borderRadius: radius.md,
      height: 50,
      paddingHorizontal: spacing.md - 2,
      fontFamily: typography.fontFamily.body,
      color: theme.text,
    },
    textArea: { height: 96, paddingTop: spacing.sm + 2, textAlignVertical: 'top' },
  });
}
