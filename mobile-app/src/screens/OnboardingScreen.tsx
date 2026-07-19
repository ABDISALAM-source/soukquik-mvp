import React, { useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, Image, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';
import { Button } from '../components/Button';
import { GradientBanner } from '../components/GradientBanner';
import { useSession } from '../store/session';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'storefront' as const,
    title: 'Découvre le marché local',
    text: 'Boutiques et prestataires de ton quartier, réunis en un seul endroit.',
  },
  {
    icon: 'heart' as const,
    title: 'Garde tes favoris à portée de main',
    text: 'Aime une boutique ou un produit pour le retrouver facilement plus tard.',
  },
  {
    icon: 'notifications' as const,
    title: 'Reste informé',
    text: 'Suis tes commandes et réservations, et reçois une notification à chaque étape.',
  },
];

export function OnboardingScreen() {
  const { colors, spacing, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, typography), [colors, spacing, typography]);
  const consumeJustRegistered = useSession((s) => s.consumeJustRegistered);
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  function next() {
    if (index < SLIDES.length - 1) {
      const nextIndex = index + 1;
      setIndex(nextIndex);
      listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    } else {
      consumeJustRegistered();
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <Image source={require('../../assets/logo.png')} style={styles.brandLogo} />
        <Text style={styles.brand}>
          Souk<Text style={{ color: colors.primary }}>Quik</Text>
        </Text>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.title}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <GradientBanner style={styles.iconBadge} radius={44}>
              <Ionicons name={item.icon} size={52} color="#fff" />
            </GradientBanner>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.text}>{item.text}</Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.footer}>
        <Button
          label={index === SLIDES.length - 1 ? 'Commencer' : 'Suivant'}
          icon={index === SLIDES.length - 1 ? 'rocket-outline' : 'arrow-forward'}
          size="lg"
          onPress={next}
        />
        {index < SLIDES.length - 1 && (
          <Text style={styles.skip} onPress={consumeJustRegistered}>
            Passer
          </Text>
        )}
      </View>
    </View>
  );
}

function makeStyles(
  theme: Palette,
  spacing: { xs: number; sm: number; md: number; lg: number; xl: number },
  typography: { fontFamily: Record<string, string>; size: Record<string, number> }
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background, paddingTop: 72 },
    brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: spacing.md },
    brandLogo: { width: 30, height: 30, borderRadius: 9 },
    brand: { fontSize: 22, fontFamily: typography.fontFamily.headingBold, color: theme.text },
    slide: { width, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
    iconBadge: {
      width: 132,
      height: 132,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xl,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 26,
      elevation: 12,
    },
    title: {
      fontSize: 24,
      fontFamily: typography.fontFamily.headingBold,
      color: theme.text,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    text: {
      fontSize: typography.size.md,
      fontFamily: typography.fontFamily.body,
      color: theme.muted,
      textAlign: 'center',
      lineHeight: 22,
      paddingHorizontal: spacing.md,
    },
    dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: spacing.lg },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.border },
    dotActive: { backgroundColor: theme.primary, width: 20 },
    footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, gap: spacing.sm },
    skip: {
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.bodyMedium,
      color: theme.muted,
      marginTop: spacing.xs,
      textAlign: 'center',
    },
  });
}
