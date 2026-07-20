import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';

interface Props {
  message: string;
  /** Icône Ionicons illustrative. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Titre court au-dessus du message. */
  title?: string;
  /** Bouton d'action optionnel (ex: "Réessayer"). */
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ message, icon = 'sad-outline', title, actionLabel, onAction }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.wrapper}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={30} color={colors.primary} />
      </View>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Text style={styles.text}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable style={styles.action} onPress={onAction} hitSlop={8}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function makeStyles(theme: Palette) {
  return StyleSheet.create({
    wrapper: { padding: 40, alignItems: 'center', justifyContent: 'center', gap: 6 },
    iconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primary + '18',
      marginBottom: 6,
    },
    title: { color: theme.text, fontSize: 17, fontWeight: '700', textAlign: 'center' },
    text: { color: theme.muted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
    action: {
      marginTop: 14,
      paddingVertical: 10,
      paddingHorizontal: 22,
      borderRadius: 999,
      backgroundColor: theme.primary,
    },
    actionText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  });
}
