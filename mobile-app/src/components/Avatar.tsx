import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { theme, typography } from '../theme/theme';

interface AvatarProps {
  imageUrl?: string;
  name: string;
  size?: number;
  /**
   * 0–1, optionnelle. Intensité de l'anneau "vague de présence" — le calcul
   * réel (ratio présence boutique / utilisateurs actifs) arrive en Phase 8 ;
   * ce composant est déjà prêt à le recevoir. Sans valeur (ou 0) : pas d'anneau.
   */
  pulseIntensity?: number;
}

export function Avatar({ imageUrl, name, size = 56, pulseIntensity = 0 }: AvatarProps) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (pulseIntensity > 0) {
      pulse.value = withRepeat(
        withTiming(1, { duration: 1400 - pulseIntensity * 600, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );
    } else {
      pulse.value = 0;
    }
  }, [pulseIntensity, pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.4 }],
    opacity: (1 - pulse.value) * Math.min(pulseIntensity, 1),
  }));

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      {pulseIntensity > 0 ? (
        <Animated.View
          style={[
            styles.ring,
            { width: size, height: size, borderRadius: size / 2, borderColor: theme.primary },
            ringStyle,
          ]}
        />
      ) : null}
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <View
          style={[
            styles.circle,
            styles.placeholder,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{name.charAt(0).toUpperCase()}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    borderWidth: 2,
  },
  circle: { backgroundColor: theme.surface },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary + '22',
  },
  initial: {
    fontFamily: typography.fontFamily.headingBold,
    color: theme.primary,
  },
});
