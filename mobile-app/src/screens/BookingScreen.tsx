import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';
import { Button } from '../components/Button';
import * as ordersApi from '../api/orders';

export function BookingScreen() {
  const { colors, radius, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, radius, typography), [colors, radius, typography]);
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { serviceId } = route.params;
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      await ordersApi.createBooking({ serviceId, notes });
      Alert.alert('Réservation envoyée', 'Le prestataire va confirmer votre réservation.');
      navigation.navigate('Home');
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Réserver ce service</Text>
      <Text style={styles.label}>Décrivez votre besoin</Text>
      <TextInput
        style={styles.textarea}
        multiline
        numberOfLines={4}
        value={notes}
        onChangeText={setNotes}
        placeholder="Ex: panne de courant dans la cuisine..."
        placeholderTextColor={colors.muted}
      />
      <Button label="Confirmer la réservation" onPress={submit} loading={loading} />
    </View>
  );
}

function makeStyles(
  theme: Palette,
  radius: { sm: number },
  typography: { fontFamily: Record<string, string>; size: Record<string, number> }
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background, padding: 20, paddingTop: 60 },
    title: { fontSize: 22, fontFamily: typography.fontFamily.headingBold, color: theme.text, marginBottom: 24 },
    label: {
      fontSize: typography.size.md - 2,
      fontFamily: typography.fontFamily.bodySemiBold,
      color: theme.text,
      marginBottom: 8,
    },
    textarea: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radius.sm + 4,
      padding: 14,
      marginBottom: 24,
      fontFamily: typography.fontFamily.body,
      color: theme.text,
      textAlignVertical: 'top',
      minHeight: 100,
    },
  });
}
