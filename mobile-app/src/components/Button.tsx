import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
}

export function Button({ label, onPress, variant = 'primary', loading, disabled }: Props) {
  const { colors, spacing, radius, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, radius, typography), [colors, spacing, radius, typography]);
  const isPrimary = variant === 'primary';
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const isInactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isInactive}
      onPressIn={() => {
        if (isInactive) return;
        scale.value = withTiming(0.97, { duration: 100 });
        opacity.value = withTiming(0.85, { duration: 100 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 100 });
        opacity.value = withTiming(1, { duration: 100 });
      }}
    >
      <Animated.View
        style={[
          styles.base,
          isPrimary ? styles.primary : styles.secondary,
          isInactive && styles.disabled,
          animatedStyle,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={isPrimary ? '#fff' : colors.primary} />
        ) : (
          <Text style={[styles.text, isPrimary ? styles.textPrimary : styles.textSecondary]}>{label}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

function makeStyles(
  theme: Palette,
  spacing: { md: number },
  radius: { sm: number },
  typography: { fontFamily: Record<string, string>; size: Record<string, number> }
) {
  return StyleSheet.create({
    base: {
      height: 48,
      borderRadius: radius.sm + 4,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
    },
    primary: { backgroundColor: theme.primary },
    secondary: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.primary },
    disabled: { opacity: 0.5 },
    text: { fontSize: typography.size.sm + 1, fontFamily: typography.fontFamily.bodySemiBold },
    textPrimary: { color: '#fff' },
    textSecondary: { color: theme.primary },
  });
}
