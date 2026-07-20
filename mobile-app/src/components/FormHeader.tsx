import React, { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { GradientBanner } from './GradientBanner';
import { BackButton } from './BackButton';

// En-tête de formulaire / écran secondaire : bannière dégradée à coins bas
// arrondis, avec bouton retour flottant + titre (et sous-titre optionnel).
// Pensé pour être posé en haut d'un écran, au-dessus d'un ScrollView.
export function FormHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { typography } = useTheme();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  return (
    <GradientBanner style={styles.hero}>
      <BackButton />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </GradientBanner>
  );
}

function makeStyles(typography: { fontFamily: Record<string, string>; size: Record<string, number> }) {
  return StyleSheet.create({
    hero: {
      paddingTop: 96,
      paddingBottom: 24,
      paddingHorizontal: 20,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
    },
    title: { fontSize: 24, fontFamily: typography.fontFamily.headingBold, color: '#fff' },
    subtitle: { fontSize: typography.size.sm, fontFamily: typography.fontFamily.body, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  });
}
