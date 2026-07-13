import React, { useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, Image, NativeScrollEvent, NativeSyntheticEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';

export interface HeroBannerItem {
  id: string;
  badge?: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  imageUrl?: string;
  accentColor?: string;
  onPress?: () => void;
}

interface HeroBannerProps {
  items: HeroBannerItem[];
  /** Fallback si un item n'a pas son propre onPress. */
  onPress?: (item: HeroBannerItem) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function HeroBanner({ items, onPress }: HeroBannerProps) {
  const { colors, spacing, radius, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, radius, typography), [colors, spacing, radius, typography]);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<HeroBannerItem>>(null);
  const slideWidth = SCREEN_WIDTH - spacing.lg * 2 + 4;

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(e.nativeEvent.contentOffset.x / slideWidth);
    if (index !== activeIndex) setActiveIndex(index);
  }

  if (items.length === 0) return null;

  return (
    <View>
      <FlatList
        ref={listRef}
        data={items}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        snapToInterval={slideWidth}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: spacing.lg - 4 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={item.onPress || (() => onPress?.(item))}
            style={[
              styles.slide,
              { width: slideWidth - spacing.sm, backgroundColor: item.accentColor || colors.secondary },
            ]}
          >
            {item.badge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            ) : null}
            <Text style={styles.title}>{item.title}</Text>
            {item.subtitle ? <Text style={styles.subtitle}>{item.subtitle}</Text> : null}
            {item.ctaLabel ? (
              <View style={styles.cta}>
                <Text style={styles.ctaText}>{item.ctaLabel}</Text>
              </View>
            ) : null}
            {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.image} /> : null}
          </Pressable>
        )}
      />
      {items.length > 1 ? (
        <View style={styles.dots}>
          {items.map((_, i) => (
            <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function makeStyles(
  theme: Palette,
  spacing: { xs: number; sm: number; md: number; lg: number },
  radius: { md: number; lg: number; pill: number },
  typography: { fontFamily: Record<string, string>; size: Record<string, number> }
) {
  return StyleSheet.create({
    slide: {
      minHeight: 150,
      borderRadius: radius.lg,
      padding: spacing.lg - 4,
      marginRight: spacing.sm,
      overflow: 'hidden',
      justifyContent: 'center',
    },
    badge: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      marginBottom: spacing.sm,
    },
    badgeText: { color: '#fff', fontSize: typography.size.xs, fontFamily: typography.fontFamily.bodySemiBold },
    title: {
      color: '#fff',
      fontSize: typography.size.xl - 4,
      fontFamily: typography.fontFamily.headingBold,
      maxWidth: '75%',
    },
    subtitle: {
      color: 'rgba(255,255,255,0.85)',
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.body,
      marginTop: spacing.xs,
      maxWidth: '70%',
    },
    cta: {
      alignSelf: 'flex-start',
      backgroundColor: '#fff',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      marginTop: spacing.md,
    },
    // Couleur fixe (pas theme.text) : le fond du bouton est toujours blanc,
    // qu'on soit en clair ou en sombre — theme.text devient presque blanc
    // en mode sombre, ce qui rendrait le texte illisible sur ce fond.
    ctaText: { color: '#1F1F1F', fontSize: typography.size.sm, fontFamily: typography.fontFamily.bodySemiBold },
    image: {
      position: 'absolute',
      right: -10,
      bottom: -10,
      width: 140,
      height: 140,
      opacity: 0.9,
    },
    dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs, marginTop: spacing.sm },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.border },
    dotActive: { backgroundColor: theme.primary, width: 16 },
  });
}
