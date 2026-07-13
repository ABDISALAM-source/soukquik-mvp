import React, { useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';
import { Button } from '../components/Button';
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
    text: "Suis tes commandes et réservations, et reçois une notification à chaque étape.",
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
            <View style={styles.iconCircle}>
              <Ionicons name={item.icon} size={48} color={colors.primary} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.text}>{item.text}</Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && { backgroundColor: colors.primary, width: 18 }]} />
        ))}
      </View>

      <View style={styles.footer}>
        <Button label={index === SLIDES.length - 1 ? 'Commencer' : 'Suivant'} onPress={next} />
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
    container: { flex: 1, backgroundColor: theme.background },
    slide: { width, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
    iconCircle: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: theme.primary + '1f',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: 22,
      fontFamily: typography.fontFamily.headingBold,
      color: theme.text,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    text: {
      fontSize: typography.size.md - 1,
      fontFamily: typography.fontFamily.body,
      color: theme.muted,
      textAlign: 'center',
      lineHeight: 20,
    },
    dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: spacing.lg },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.border },
    footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, alignItems: 'center', gap: spacing.sm },
    skip: {
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.bodyMedium,
      color: theme.muted,
      marginTop: spacing.xs,
    },
  });
}
