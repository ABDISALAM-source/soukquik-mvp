import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';

// Animation de lancement : le logo "se construit" (anneaux qui jaillissent +
// logo qui se pose avec un léger rebond, puis le nom SoukQuik apparaît),
// enfin l'overlay se fond pour laisser place à l'app. Utilise l'API Animated
// native de React Native (aucune dépendance supplémentaire).
export function LogoMorph({ onDone }: { onDone: () => void }) {
  const logoScale = useRef(new Animated.Value(0.2)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const wordOpacity = useRef(new Animated.Value(0)).current;
  const wordShift = useRef(new Animated.Value(12)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // 1) Le logo se matérialise avec un rebond + une légère rotation.
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.timing(logoRotate, { toValue: 1, duration: 620, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      // 2) Deux anneaux jaillissent en écho.
      Animated.stagger(140, [
        Animated.timing(ring1, { toValue: 1, duration: 620, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(ring2, { toValue: 1, duration: 620, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
      // 3) Le nom apparaît en glissant.
      Animated.parallel([
        Animated.timing(wordOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.timing(wordShift, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.delay(420),
      // 4) L'overlay se fond.
      Animated.timing(overlayOpacity, { toValue: 0, duration: 420, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start(() => onDone());
  }, []);

  const spin = logoRotate.interpolate({ inputRange: [0, 1], outputRange: ['-90deg', '0deg'] });

  const ringStyle = (v: Animated.Value) => ({
    opacity: v.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.5, 0.25, 0] }),
    transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 2.6] }) }],
  });

  return (
    <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} pointerEvents="none">
      <View style={styles.center}>
        <Animated.View style={[styles.ring, ringStyle(ring1)]} />
        <Animated.View style={[styles.ring, ringStyle(ring2)]} />
        <Animated.View
          style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }, { rotate: spin }] }]}
        >
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="cover" />
        </Animated.View>
      </View>
      <Animated.Text style={[styles.word, { opacity: wordOpacity, transform: [{ translateY: wordShift }] }]}>
        Souk<Text style={styles.wordAccent}>Quik</Text>
      </Animated.Text>
    </Animated.View>
  );
}

const RING = 150;
const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#090A0F',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  center: { alignItems: 'center', justifyContent: 'center', width: RING, height: RING },
  ring: {
    position: 'absolute',
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: 2,
    borderColor: '#00BFFF',
  },
  logoWrap: {
    width: 108,
    height: 108,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(0,191,255,0.5)',
    shadowColor: '#00BFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 24,
    elevation: 12,
  },
  logo: { width: '100%', height: '100%' },
  word: { marginTop: 34, fontSize: 34, fontWeight: 'bold', color: '#FFFFFF', letterSpacing: 0.5 },
  wordAccent: { color: '#00BFFF' },
});
