import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { Palette } from '../theme/theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  /** Icône Ionicons optionnelle, affichée avant le libellé. */
  icon?: keyof typeof Ionicons.glyphMap;
  size?: 'md' | 'lg';
}

export function Button({ label, onPress, variant = 'primary', loading, disabled, icon, size = 'md' }: Props) {
  const { colors, spacing, radius, shadow, typography } = useTheme();
  const styles = useMemo(() => makeStyles(colors, spacing, radius, typography), [colors, spacing, radius, typography]);
  const isPrimary = variant === 'primary';
  const isGhost = variant === 'ghost';
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const isInactive = disabled || loading;
  const fg = isPrimary ? '#fff' : colors.primary;

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
          size === 'lg' && styles.lg,
          isPrimary ? styles.primary : isGhost ? styles.ghost : styles.secondary,
          isPrimary && !isInactive && shadow.sm,
          isInactive && styles.disabled,
          animatedStyle,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={fg} />
        ) : (
          <View style={styles.content}>
            {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
            <Text style={[styles.text, { color: fg }]}>{label}</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

function makeStyles(
  theme: Palette,
  spacing: { sm: number; md: number },
  radius: { sm: number; md: number },
  typography: { fontFamily: Record<string, string>; size: Record<string, number> }
) {
  return StyleSheet.create({
    base: {
      height: 50,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
    },
    lg: { height: 56, borderRadius: radius.md + 2 },
    content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    primary: { backgroundColor: theme.primary },
    secondary: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.primary },
    ghost: { backgroundColor: theme.primary + '18' },
    disabled: { opacity: 0.5 },
    text: { fontSize: typography.size.md, fontFamily: typography.fontFamily.bodySemiBold },
  });
}
