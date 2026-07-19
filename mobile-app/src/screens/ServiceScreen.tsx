import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';
import { EmptyState } from '../components/EmptyState';
import { ReviewSection } from '../components/ReviewSection';
import { GradientBanner } from '../components/GradientBanner';
import { BackButton } from '../components/BackButton';
import * as catalogApi from '../api/catalog';

const fmt = (n: number) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n)} DJF`;

export function ServiceScreen() {
  const { colors, spacing, radius, shadow, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, radius, shadow, typography), [colors, spacing, radius, shadow, typography]);
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { serviceId } = route.params;
  const [service, setService] = useState<any>(null);

  useEffect(() => {
    catalogApi.fetchService(serviceId).then(setService);
    catalogApi.trackServiceVisit(serviceId);
  }, [serviceId]);

  if (!service) return <EmptyState icon="construct-outline" message="Chargement…" />;

  const unit = service.priceUnit ? ` / ${service.priceUnit}` : '';

  return (
    <View style={styles.container}>
      <BackButton />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* BANNIÈRE HÉROS */}
        <GradientBanner style={styles.hero} radius={0}>
          <View style={styles.heroContent}>
            <View style={styles.logo}>
              {service.logoUrl ? (
                <Image source={{ uri: service.logoUrl }} style={styles.logoImg} />
              ) : (
                <Ionicons name="construct" size={30} color="#fff" />
              )}
            </View>
            <Text style={styles.title}>{service.title}</Text>
            {service.slogan ? <Text style={styles.slogan}>“{service.slogan}”</Text> : null}
            <View style={styles.pricePill}>
              <Text style={styles.priceText}>{fmt(service.price)}</Text>
              <Text style={styles.priceUnit}>{unit}</Text>
            </View>
          </View>
        </GradientBanner>

        <View style={styles.body}>
          {/* INFOS CLÉS */}
          <View style={styles.infoRow}>
            <View style={styles.infoCard}>
              <Ionicons name="navigate-outline" size={18} color={colors.primary} />
              <Text style={styles.infoValue}>{service.serviceAreaKm} km</Text>
              <Text style={styles.infoLabel}>Zone d'intervention</Text>
            </View>
            <View style={styles.infoCard}>
              <Ionicons name="pricetags-outline" size={18} color={colors.primary} />
              <Text style={styles.infoValue}>{service.priceUnit || 'forfait'}</Text>
              <Text style={styles.infoLabel}>Tarification</Text>
            </View>
            <View style={styles.infoCard}>
              <Ionicons name="shield-checkmark-outline" size={18} color={service.patente ? colors.success : colors.muted} />
              <Text style={styles.infoValue}>{service.patente ? 'Vérifié' : '—'}</Text>
              <Text style={styles.infoLabel}>Patente</Text>
            </View>
          </View>

          {service.description ? (
            <View style={styles.descCard}>
              <Text style={styles.descTitle}>À propos</Text>
              <Text style={styles.description}>{service.description}</Text>
            </View>
          ) : null}

          <ReviewSection targetType="service" targetId={serviceId} />
        </View>
      </ScrollView>

      {/* CTA COLLÉ */}
      <View style={styles.bottomBar}>
        <Pressable style={styles.cta} onPress={() => navigation.navigate('Booking', { serviceId: service.id })}>
          <Ionicons name="calendar" size={18} color="#fff" />
          <Text style={styles.ctaText}>Réserver ce service</Text>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(
  theme: Palette,
  spacing: { xs: number; sm: number; md: number; lg: number },
  radius: { sm: number; md: number; lg: number; pill: number },
  shadow: { md: object; lg: object },
  typography: { fontFamily: Record<string, string>; size: Record<string, number> }
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    hero: { paddingTop: 84, paddingBottom: spacing.lg, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
    heroContent: { alignItems: 'center', paddingHorizontal: spacing.lg },
    logo: {
      width: 76,
      height: 76,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.35)',
      overflow: 'hidden',
      marginBottom: spacing.md,
    },
    logoImg: { width: 76, height: 76 },
    title: { fontSize: 24, fontFamily: typography.fontFamily.headingBold, color: '#fff', textAlign: 'center' },
    slogan: { fontSize: typography.size.sm, fontFamily: typography.fontFamily.body, color: 'rgba(255,255,255,0.85)', marginTop: 4, fontStyle: 'italic', textAlign: 'center' },
    pricePill: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginTop: spacing.md,
      backgroundColor: 'rgba(255,255,255,0.18)',
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderRadius: radius.pill,
    },
    priceText: { fontSize: typography.size.lg, fontFamily: typography.fontFamily.headingBold, color: '#fff' },
    priceUnit: { fontSize: typography.size.sm, fontFamily: typography.fontFamily.bodyMedium, color: 'rgba(255,255,255,0.9)' },

    body: { padding: spacing.lg - 4 },
    infoRow: { flexDirection: 'row', gap: spacing.sm },
    infoCard: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.border,
      paddingVertical: spacing.md,
      gap: 4,
    },
    infoValue: { fontSize: typography.size.sm + 1, fontFamily: typography.fontFamily.bodySemiBold, color: theme.text, textTransform: 'capitalize' },
    infoLabel: { fontSize: typography.size.xs - 1, fontFamily: typography.fontFamily.body, color: theme.muted, textAlign: 'center' },

    descCard: {
      backgroundColor: theme.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.border,
      padding: spacing.md,
      marginTop: spacing.md,
    },
    descTitle: { fontSize: typography.size.sm, fontFamily: typography.fontFamily.bodySemiBold, color: theme.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    description: { fontSize: typography.size.md, fontFamily: typography.fontFamily.body, color: theme.text, lineHeight: 22 },

    bottomBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: spacing.lg - 4,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg + 6,
      backgroundColor: theme.surface,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      ...shadow.lg,
    },
    cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, height: 54, borderRadius: radius.md, backgroundColor: theme.primary },
    ctaText: { color: '#fff', fontSize: typography.size.md, fontFamily: typography.fontFamily.bodySemiBold },
  });
}
