import React from 'react';
import { FlatList, FlatListProps, StyleSheet } from 'react-native';
import { spacing } from '../theme/theme';

type CarouselProps<T> = Omit<
  FlatListProps<T>,
  'horizontal' | 'showsHorizontalScrollIndicator' | 'contentContainerStyle'
> & {
  contentPadding?: number;
};

/**
 * Fine surcouche FlatList horizontale pour les rangées défilantes
 * (Tendances / Boutiques / Services). Pas de pagination/snap : simple
 * défilement libre avec un espacement de bord cohérent.
 */
export function Carousel<T,>({ contentPadding = spacing.md, ...props }: CarouselProps<T>) {
  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.content, { paddingHorizontal: contentPadding }]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
});
