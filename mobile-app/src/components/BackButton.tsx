import React from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/build/Ionicons';

// Bouton retour circulaire flottant, pensé pour se poser sur une bannière /
// une photo (fond translucide sombre, icône blanche). Position absolue par
// défaut, en haut à gauche.
export function BackButton({ style, tint = '#fff' }: { style?: StyleProp<ViewStyle>; tint?: string }) {
  const navigation = useNavigation<any>();
  if (!navigation.canGoBack?.()) return null;
  return (
    <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={[styles.btn, style]}>
      <Ionicons name="chevron-back" size={22} color={tint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: 'absolute',
    top: 48,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(9,10,15,0.45)',
  },
});
