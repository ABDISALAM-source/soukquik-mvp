import React, { useMemo } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';

interface Props {
  value: string;
  onChangeText: (v: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  /** Icône appareil photo (recherche par image) — visuelle pour l'instant, branchée en Phase 4. */
  onPressCamera?: () => void;
  /** Icône de droite (filtres), avec séparateur vertical. */
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onPressRightIcon?: () => void;
}

export function SearchBar({ value, onChangeText, onSubmit, placeholder, onPressCamera, rightIcon, onPressRightIcon }: Props) {
  const { colors, spacing, radius, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, radius, typography), [colors, spacing, radius, typography]);

  return (
    <View style={styles.wrapper}>
      {onPressCamera ? (
        <Pressable hitSlop={8} onPress={onPressCamera} style={styles.iconButton}>
          <Ionicons name="camera-outline" size={20} color={colors.muted} />
        </Pressable>
      ) : null}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder || 'Chercher un produit, un service, une boutique...'}
        placeholderTextColor={colors.muted}
        returnKeyType="search"
      />
      {rightIcon ? (
        <>
          <View style={styles.divider} />
          <Pressable hitSlop={8} onPress={onPressRightIcon} style={styles.iconButtonRight}>
            <Ionicons name={rightIcon} size={20} color={colors.muted} />
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

function makeStyles(
  theme: Palette,
  spacing: { md: number },
  radius: { md: number },
  typography: { fontFamily: Record<string, string>; size: Record<string, number> }
) {
  return StyleSheet.create({
    wrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: spacing.md - 2,
    },
    iconButton: { marginRight: spacing.md - 8 },
    iconButtonRight: { marginLeft: spacing.md - 8 },
    divider: { width: 1, height: 22, backgroundColor: theme.border },
    input: {
      flex: 1,
      height: 46,
      fontSize: typography.size.md - 1,
      fontFamily: typography.fontFamily.body,
      color: theme.text,
    },
  });
}
