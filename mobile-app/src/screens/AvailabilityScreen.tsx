import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import * as availabilityApi from '../api/availability';
import type { AvailabilityRule, AvailabilityException } from '../api/availability';
import { nextDays, WEEKDAY_NAMES } from '../utils/dates';

const UPCOMING_DAYS = nextDays(30);

export function AvailabilityScreen() {
  const { colors, spacing, radius, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, radius, typography), [colors, spacing, radius, typography]);

  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);

  const [ruleWeekday, setRuleWeekday] = useState(1);
  const [ruleStart, setRuleStart] = useState('09:00');
  const [ruleEnd, setRuleEnd] = useState('18:00');
  const [savingRule, setSavingRule] = useState(false);

  const [exceptionDate, setExceptionDate] = useState(UPCOMING_DAYS[0].date);
  const [exceptionClosed, setExceptionClosed] = useState(true);
  const [exceptionStart, setExceptionStart] = useState('09:00');
  const [exceptionEnd, setExceptionEnd] = useState('18:00');
  const [savingException, setSavingException] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    availabilityApi
      .fetchMyAvailability()
      .then((data) => {
        setRules(data.rules);
        setExceptions(data.exceptions);
      })
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function addRule() {
    if (ruleStart >= ruleEnd) {
      Alert.alert('Erreur', "L'heure de fin doit être après l'heure de début.");
      return;
    }
    setSavingRule(true);
    try {
      await availabilityApi.createRule({ weekday: ruleWeekday, startTime: ruleStart, endTime: ruleEnd });
      load();
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setSavingRule(false);
    }
  }

  async function removeRule(id: string) {
    setRules((prev) => prev.filter((r) => r.id !== id));
    try {
      await availabilityApi.deleteRule(id);
    } catch {
      load();
    }
  }

  async function addException() {
    if (!exceptionClosed && exceptionStart >= exceptionEnd) {
      Alert.alert('Erreur', "L'heure de fin doit être après l'heure de début.");
      return;
    }
    setSavingException(true);
    try {
      await availabilityApi.createException({
        date: exceptionDate,
        isClosed: exceptionClosed,
        startTime: exceptionClosed ? undefined : exceptionStart,
        endTime: exceptionClosed ? undefined : exceptionEnd,
      });
      load();
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setSavingException(false);
    }
  }

  async function removeException(id: string) {
    setExceptions((prev) => prev.filter((e) => e.id !== id));
    try {
      await availabilityApi.deleteException(id);
    } catch {
      load();
    }
  }

  if (loading) return <EmptyState message="Chargement..." />;

  const rulesByWeekday = WEEKDAY_NAMES.map((name, weekday) => ({
    weekday,
    name,
    rules: rules.filter((r) => r.weekday === weekday),
  }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Mes disponibilités</Text>
      <Text style={styles.intro}>
        Définis tes horaires hebdomadaires. Les clients ne pourront réserver un créneau précis que dans ces plages.
      </Text>

      <Text style={styles.sectionTitle}>Horaires hebdomadaires</Text>
      {rulesByWeekday.map(({ weekday, name, rules: dayRules }) => (
        <View key={weekday} style={styles.dayRow}>
          <Text style={styles.dayName}>{name}</Text>
          {dayRules.length === 0 ? (
            <Text style={styles.dayEmpty}>Fermé</Text>
          ) : (
            <View style={styles.dayChips}>
              {dayRules.map((r) => (
                <Pressable key={r.id} style={styles.timeChip} onPress={() => removeRule(r.id)}>
                  <Text style={styles.timeChipText}>
                    {r.startTime.slice(0, 5)}–{r.endTime.slice(0, 5)}
                  </Text>
                  <Ionicons name="close" size={12} color={colors.primary} />
                </Pressable>
              ))}
            </View>
          )}
        </View>
      ))}

      <View style={styles.form}>
        <Text style={styles.label}>Ajouter un créneau</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {WEEKDAY_NAMES.map((name, weekday) => (
            <Pressable
              key={weekday}
              style={[styles.chip, ruleWeekday === weekday && styles.chipActive]}
              onPress={() => setRuleWeekday(weekday)}
            >
              <Text style={[styles.chipText, ruleWeekday === weekday && styles.chipTextActive]}>{name.slice(0, 3)}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Début</Text>
            <TextInput style={styles.input} value={ruleStart} onChangeText={setRuleStart} placeholder="09:00" placeholderTextColor={colors.muted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Fin</Text>
            <TextInput style={styles.input} value={ruleEnd} onChangeText={setRuleEnd} placeholder="18:00" placeholderTextColor={colors.muted} />
          </View>
        </View>
        <Button label="Ajouter le créneau" onPress={addRule} loading={savingRule} />
      </View>

      <Text style={styles.sectionTitle}>Jours spéciaux</Text>
      <Text style={styles.intro}>Bloque une date précise (congé) ou donne-lui des horaires différents de ta semaine type.</Text>

      {exceptions.length === 0 ? (
        <Text style={styles.dayEmpty}>Aucune exception à venir.</Text>
      ) : (
        exceptions.map((e) => (
          <View key={e.id} style={styles.exceptionRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.dayName}>{e.date}</Text>
              <Text style={styles.dayEmpty}>
                {e.isClosed ? 'Fermé' : `${e.startTime?.slice(0, 5)}–${e.endTime?.slice(0, 5)}`}
              </Text>
            </View>
            <Pressable onPress={() => removeException(e.id)} hitSlop={8}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </Pressable>
          </View>
        ))
      )}

      <View style={styles.form}>
        <Text style={styles.label}>Ajouter une exception</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {UPCOMING_DAYS.map((d) => (
            <Pressable
              key={d.date}
              style={[styles.chip, exceptionDate === d.date && styles.chipActive]}
              onPress={() => setExceptionDate(d.date)}
            >
              <Text style={[styles.chipText, exceptionDate === d.date && styles.chipTextActive]}>{d.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Fermé toute la journée</Text>
          <Switch value={exceptionClosed} onValueChange={setExceptionClosed} trackColor={{ true: colors.primary }} />
        </View>

        {!exceptionClosed && (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Début</Text>
              <TextInput style={styles.input} value={exceptionStart} onChangeText={setExceptionStart} placeholder="09:00" placeholderTextColor={colors.muted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Fin</Text>
              <TextInput style={styles.input} value={exceptionEnd} onChangeText={setExceptionEnd} placeholder="18:00" placeholderTextColor={colors.muted} />
            </View>
          </View>
        )}

        <Button label="Ajouter l'exception" onPress={addException} loading={savingException} />
      </View>
    </ScrollView>
  );
}

function makeStyles(
  theme: Palette,
  spacing: { xs: number; sm: number; md: number; lg: number },
  radius: { sm: number; pill: number },
  typography: { fontFamily: Record<string, string>; size: Record<string, number> }
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    content: { padding: spacing.lg - 4, paddingTop: 60, paddingBottom: spacing.lg + 40 },
    title: { fontSize: 22, fontFamily: typography.fontFamily.headingBold, color: theme.text, marginBottom: spacing.xs },
    intro: { fontSize: typography.size.xs + 1, fontFamily: typography.fontFamily.body, color: theme.muted, marginBottom: spacing.md },
    sectionTitle: {
      fontSize: typography.size.md,
      fontFamily: typography.fontFamily.heading,
      color: theme.text,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    dayRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      gap: spacing.sm,
    },
    dayName: { width: 90, fontSize: typography.size.sm + 1, fontFamily: typography.fontFamily.bodySemiBold, color: theme.text },
    dayEmpty: { fontSize: typography.size.xs + 1, fontFamily: typography.fontFamily.body, color: theme.muted },
    dayChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, flex: 1 },
    timeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderWidth: 1,
      borderColor: theme.primary,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      backgroundColor: theme.primary + '14',
    },
    timeChipText: { fontSize: typography.size.xs, fontFamily: typography.fontFamily.bodySemiBold, color: theme.primary },
    form: {
      marginTop: spacing.md,
      padding: spacing.md,
      backgroundColor: theme.surface,
      borderRadius: radius.sm + 4,
      borderWidth: 1,
      borderColor: theme.border,
      gap: spacing.sm,
    },
    label: { fontSize: typography.size.sm, fontFamily: typography.fontFamily.bodySemiBold, color: theme.muted },
    chipRow: { flexDirection: 'row', marginBottom: spacing.xs },
    chip: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.sm + 4,
      paddingVertical: spacing.xs + 2,
      marginRight: spacing.sm,
      backgroundColor: theme.background,
    },
    chipActive: { borderColor: theme.primary, backgroundColor: theme.primary + '1a' },
    chipText: { fontSize: typography.size.xs + 1, fontFamily: typography.fontFamily.body, color: theme.muted },
    chipTextActive: { color: theme.primary, fontFamily: typography.fontFamily.bodySemiBold },
    row: { flexDirection: 'row', gap: spacing.sm + 4 },
    input: {
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radius.sm + 4,
      height: 44,
      paddingHorizontal: spacing.sm + 4,
      fontFamily: typography.fontFamily.body,
      color: theme.text,
    },
    switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    exceptionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm + 2,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
  });
}
