import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';

interface DiscoveryCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  linkLabel?: string;
  onPress?: () => void;
  /** Aperçu visuel en haut de carte : mini carte, pile d'avatars, ou vignette produit. Sans valeur : juste l'icône (comportement d'origine). */
  layout?: 'map' | 'avatars' | 'product';
  imageUrl?: string;
}

const AVATAR_TINTS = ['#8B5CF6', '#2563EB', '#F59E0B'];

/** Carte compacte de découverte ("Près de chez toi", "Pour toi"...). */
export function DiscoveryCard({ icon, title, subtitle, linkLabel, onPress, layout, imageUrl }: DiscoveryCardProps) {
  const { colors, spacing, radius, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, radius, typography), [colors, spacing, radius, typography]);

  return (
    <Pressable onPress={onPress} style={styles.card}>
      {layout === 'map' ? (
        <View style={styles.mapPreview}>
          {Array.from({ length: 9 }).map((_, i) => (
            <View key={i} style={styles.mapCell} />
          ))}
          <View style={styles.mapPin}>
            <Ionicons name="location" size={12} color="#fff" />
          </View>
        </View>
      ) : layout === 'avatars' ? (
        <View style={styles.avatarStack}>
          {AVATAR_TINTS.map((tint, i) => (
            <View key={i} style={[styles.avatarDot, { backgroundColor: tint, marginLeft: i === 0 ? 0 : -8 }]} />
          ))}
          <View style={[styles.avatarDot, styles.avatarMore, { marginLeft: -8 }]}>
            <Text style={styles.avatarMoreText}>+12</Text>
          </View>
        </View>
      ) : layout === 'product' ? (
        <View style={styles.productThumb}>
          {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.productImage} /> : <Ionicons name={icon} size={20} color={colors.primary} />}
        </View>
      ) : (
        <Ionicons name={icon} size={18} color={colors.primary} />
      )}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {linkLabel ? (
        <View style={styles.linkRow}>
          <Text style={styles.link}>{linkLabel}</Text>
          <Ionicons name="chevron-forward" size={12} color={colors.primary} />
        </View>
      ) : null}
    </Pressable>
  );
}

function makeStyles(
  theme: Palette,
  spacing: { xs: number; sm: number; md: number },
  radius: { md: number },
  typography: { fontFamily: Record<string, string>; size: Record<string, number> }
) {
  return StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: theme.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.border,
      padding: spacing.sm + 4,
      minHeight: 100,
    },
    title: {
      marginTop: spacing.xs + 2,
      fontSize: typography.size.xs + 1,
      fontFamily: typography.fontFamily.bodySemiBold,
      color: theme.text,
    },
    subtitle: {
      marginTop: 2,
      fontSize: 10,
      fontFamily: typography.fontFamily.body,
      color: theme.muted,
    },
    linkRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: spacing.xs + 2 },
    link: { fontSize: 10, fontFamily: typography.fontFamily.bodySemiBold, color: theme.primary },
    mapPreview: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      width: 36,
      height: 36,
      borderRadius: 6,
      overflow: 'hidden',
      backgroundColor: theme.background,
    },
    mapCell: { width: 12, height: 12, borderWidth: 0.5, borderColor: theme.border },
    mapPin: {
      position: 'absolute',
      top: 8,
      left: 8,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarStack: { flexDirection: 'row', alignItems: 'center' },
    avatarDot: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 2,
      borderColor: theme.surface,
    },
    avatarMore: { backgroundColor: theme.border, alignItems: 'center', justifyContent: 'center' },
    avatarMoreText: { fontSize: 8, fontFamily: typography.fontFamily.bodySemiBold, color: theme.text },
    productThumb: {
      width: 36,
      height: 36,
      borderRadius: radius.md - 6,
      backgroundColor: theme.primary + '18',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    productImage: { width: '100%', height: '100%' },
  });
}
