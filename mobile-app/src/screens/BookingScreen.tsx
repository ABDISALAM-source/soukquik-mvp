import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';
import { Button } from '../components/Button';
import { Chip } from '../components/Chip';
import { FormHeader } from '../components/FormHeader';
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
  const { colors, spacing, radius, shadow, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, radius, shadow, typography), [colors, spacing, radius, shadow, typography]);
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

  const selectedLabel = UPCOMING_DAYS.find((d) => d.date === date)?.label;

  return (
    <View style={styles.screen}>
      <FormHeader title="Réserver ce service" subtitle="Choisis une date et un créneau" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* DATE */}
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>Date</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {UPCOMING_DAYS.map((d) => (
              <Chip key={d.date} label={d.label} active={date === d.date} onPress={() => setDate(d.date)} />
            ))}
          </ScrollView>
        </View>

        {/* HORAIRE */}
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>Horaire {selectedLabel ? `· ${selectedLabel}` : ''}</Text>
          </View>
          {checkingAvailability ? (
            <Text style={styles.hint}>Vérification des disponibilités…</Text>
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
        </View>

        {/* BESOIN */}
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Ionicons name="document-text-outline" size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>Décris ton besoin</Text>
          </View>
          <TextInput
            style={styles.textarea}
            multiline
            value={notes}
            onChangeText={setNotes}
            placeholder="Ex : panne de courant dans la cuisine…"
            placeholderTextColor={colors.muted}
          />
        </View>
      </ScrollView>

      {/* CTA COLLÉ */}
      <View style={styles.bottomBar}>
        {time ? <Text style={styles.recap}>{selectedLabel} · {time}</Text> : <Text style={styles.recapMuted}>Sélectionne un créneau</Text>}
        <Button label="Confirmer la réservation" icon="checkmark-circle-outline" onPress={submit} loading={loading} disabled={!time} />
      </View>
    </View>
  );
}

function makeStyles(
  theme: Palette,
  spacing: { xs: number; sm: number; md: number; lg: number },
  radius: { sm: number; md: number },
  shadow: { lg: object },
  typography: { fontFamily: Record<string, string>; size: Record<string, number> }
) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.background },
    content: { padding: spacing.md, paddingBottom: 140, gap: spacing.md },
    card: {
      backgroundColor: theme.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.border,
      padding: spacing.md,
    },
    cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm + 2 },
    cardTitle: { fontSize: typography.size.md, fontFamily: typography.fontFamily.bodySemiBold, color: theme.text },
    chipRow: { gap: spacing.sm, paddingRight: spacing.md },
    hint: { fontSize: typography.size.sm, fontFamily: typography.fontFamily.body, color: theme.muted },
    slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    textarea: {
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radius.md,
      padding: 14,
      fontFamily: typography.fontFamily.body,
      color: theme.text,
      textAlignVertical: 'top',
      minHeight: 96,
    },
    bottomBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm + 2,
      paddingBottom: spacing.lg + 6,
      backgroundColor: theme.surface,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      gap: spacing.sm,
      ...shadow.lg,
    },
    recap: { fontSize: typography.size.sm, fontFamily: typography.fontFamily.bodySemiBold, color: theme.primary, textAlign: 'center' },
    recapMuted: { fontSize: typography.size.sm, fontFamily: typography.fontFamily.body, color: theme.muted, textAlign: 'center' },
  });
}
