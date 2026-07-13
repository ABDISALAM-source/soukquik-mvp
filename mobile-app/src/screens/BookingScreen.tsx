import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import * as ordersApi from '../api/orders';
import * as availabilityApi from '../api/availability';
import { nextDays } from '../utils/dates';

const UPCOMING_DAYS = nextDays(14);
const DEFAULT_WINDOW = [{ startTime: '08:00:00', endTime: '20:00:00' }];

function generateSlots(windows: { startTime: string; endTime: string }[]): string[] {
  const slots: string[] = [];
  for (const w of windows) {
    let [h, m] = w.startTime.slice(0, 5).split(':').map(Number);
    const [endH, endM] = w.endTime.slice(0, 5).split(':').map(Number);
    while (h < endH || (h === endH && m < endM)) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      m += 30;
      if (m >= 60) {
        m -= 60;
        h += 1;
      }
    }
  }
  return slots;
}

export function BookingScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, radius, typography), [colors, spacing, radius, typography]);
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { serviceId } = route.params;
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const [date, setDate] = useState(UPCOMING_DAYS[0].date);
  const [time, setTime] = useState<string | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(true);
  const [closed, setClosed] = useState(false);
  const [slots, setSlots] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    setCheckingAvailability(true);
    setTime(null);
    availabilityApi
      .fetchServiceAvailability(serviceId, date)
      .then((resolved) => {
        if (cancelled) return;
        setClosed(resolved.closed);
        const windows = !resolved.hasAnyRule ? DEFAULT_WINDOW : resolved.windows;
        setSlots(resolved.closed ? [] : generateSlots(windows));
      })
      .finally(() => !cancelled && setCheckingAvailability(false));
    return () => {
      cancelled = true;
    };
  }, [serviceId, date]);

  async function submit() {
    if (!time) {
      Alert.alert('Erreur', 'Choisis une date et un horaire disponibles.');
      return;
    }
    setLoading(true);
    try {
      await ordersApi.createBooking({ serviceId, scheduledAt: `${date}T${time}:00.000Z`, notes });
      Alert.alert('Réservation envoyée', 'Le prestataire va confirmer votre réservation.');
      navigation.navigate('Home');
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Réserver ce service</Text>

      <Text style={styles.label}>Date</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {UPCOMING_DAYS.map((d) => (
          <Chip key={d.date} label={d.label} active={date === d.date} onPress={() => setDate(d.date)} />
        ))}
      </ScrollView>

      <Text style={styles.label}>Horaire</Text>
      {checkingAvailability ? (
        <Text style={styles.hint}>Vérification des disponibilités...</Text>
      ) : closed ? (
        <Text style={styles.hint}>Le prestataire n'est pas disponible ce jour-là. Choisis une autre date.</Text>
      ) : slots.length === 0 ? (
        <Text style={styles.hint}>Aucun créneau disponible ce jour-là.</Text>
      ) : (
        <View style={styles.slotGrid}>
          {slots.map((s) => (
            <Chip key={s} label={s} active={time === s} onPress={() => setTime(s)} />
          ))}
        </View>
      )}

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
      <Button label="Confirmer la réservation" onPress={submit} loading={loading} disabled={!time} />
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
    content: { padding: 20, paddingTop: 60, paddingBottom: spacing.lg + 20 },
    title: { fontSize: 22, fontFamily: typography.fontFamily.headingBold, color: theme.text, marginBottom: 24 },
    label: {
      fontSize: typography.size.md - 2,
      fontFamily: typography.fontFamily.bodySemiBold,
      color: theme.text,
      marginBottom: 8,
      marginTop: spacing.md,
    },
    chipRow: { flexDirection: 'row' },
    hint: { fontSize: typography.size.sm, fontFamily: typography.fontFamily.body, color: theme.muted },
    slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    textarea: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radius.sm + 4,
      padding: 14,
      marginTop: 8,
      marginBottom: 24,
      fontFamily: typography.fontFamily.body,
      color: theme.text,
      textAlignVertical: 'top',
      minHeight: 100,
    },
  });
}
