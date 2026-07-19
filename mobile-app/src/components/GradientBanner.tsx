import React from 'react';
import { ImageBackground, StyleProp, StyleSheet, ViewStyle } from 'react-native';

// Bannière à dégradé de marque (bleu -> navy). Rendue via une image PNG de
// dégradé étirée : vrai dégradé lisse sans dépendance native (pas de
// expo-linear-gradient, donc aucun prebuild requis).
export function GradientBanner({
  children,
  style,
  radius = 0,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
}) {
  return (
    <ImageBackground
      source={require('../../assets/grad-blue.png')}
      style={[styles.bg, style]}
      imageStyle={{ borderRadius: radius }}
    >
      {children}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { overflow: 'hidden' },
});
