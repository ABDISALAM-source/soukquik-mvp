import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';

export function EmptyState({ message }: { message: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.wrapper}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

function makeStyles(theme: Palette) {
  return StyleSheet.create({
    wrapper: { padding: 32, alignItems: 'center', justifyContent: 'center' },
    text: { color: theme.muted, fontSize: 14, textAlign: 'center' },
  });
}
