import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme/theme';

export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { padding: 32, alignItems: 'center', justifyContent: 'center' },
  text: { color: theme.muted, fontSize: 14, textAlign: 'center' },
});
