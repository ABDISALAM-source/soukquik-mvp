import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { theme } from '../theme/theme';

interface Props {
  value: string;
  onChangeText: (v: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, onSubmit, placeholder }: Props) {
  return (
    <View style={styles.wrapper}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder || 'Chercher un produit, un service, une boutique...'}
        placeholderTextColor={theme.muted}
        returnKeyType="search"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: theme.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 14,
  },
  input: {
    height: 46,
    fontSize: 15,
    color: theme.text,
  },
});
