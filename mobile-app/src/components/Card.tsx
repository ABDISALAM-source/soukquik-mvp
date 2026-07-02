import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../theme/theme';

interface CardProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  onPress?: () => void;
}

export function Card({ title, subtitle, imageUrl, onPress }: CardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text style={styles.placeholderText}>{title.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
    marginRight: 12,
  },
  image: {
    width: 140,
    height: 100,
    borderRadius: 14,
    backgroundColor: theme.surface,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary + '22',
  },
  placeholderText: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.primary,
  },
  title: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  subtitle: {
    fontSize: 12,
    color: theme.muted,
  },
});
