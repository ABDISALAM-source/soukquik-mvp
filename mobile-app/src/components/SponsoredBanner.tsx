import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';
import { Badge } from './Badge';

interface SponsoredBannerProps {
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  imageUrl?: string;
  onPress?: () => void;
  badge?: string;
}

/**
 * Bandeau publicité sponsorisée. Alimenté par la table `promotions`
 * (Phase 1) une fois le flux réel branché en Phase 9 — pour l'instant,
 * l'appelant lui passe un item statique/démo.
 */
export function SponsoredBanner({ title, subtitle, ctaLabel, imageUrl, onPress, badge = 'SPONSORISÉ' }: SponsoredBannerProps) {
  const { colors, spacing, radius, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, radius, typography), [colors, spacing, radius, typography]);

  return (
    <Pressable onPress={onPress} style={styles.wrapper}>
      <View style={styles.content}>
        <Badge label={badge} variant="sponsored" />
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {ctaLabel ? <Text style={styles.cta}>{ctaLabel}</Text> : null}
      </View>
      {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.image} /> : null}
    </Pressable>
  );
}

function makeStyles(
  theme: Palette,
  spacing: { xs: number; sm: number; md: number; lg: number },
  radius: { lg: number },
  typography: { fontFamily: Record<string, string>; size: Record<string, number> }
) {
  return StyleSheet.create({
    wrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surfaceAlt,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginHorizontal: spacing.lg - 4,
      overflow: 'hidden',
    },
    content: { flex: 1, gap: spacing.xs },
    title: { fontSize: typography.size.md, fontFamily: typography.fontFamily.headingBold, color: theme.text, marginTop: spacing.xs },
    subtitle: { fontSize: typography.size.xs, fontFamily: typography.fontFamily.body, color: theme.muted },
    cta: {
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.bodySemiBold,
      color: theme.primary,
      marginTop: spacing.xs,
    },
    image: { width: 72, height: 72, borderRadius: radius.lg, marginLeft: spacing.sm },
  });
}
