import { Platform } from 'react-native';

export const light = {
  primary: '#E4572E',
  primarySoft: '#E4572E22',
  secondary: '#2E4057',
  background: '#FAF7F2',
  surface: '#FFFFFF',
  surfaceAlt: '#F1ECE3',
  text: '#1F1F1F',
  muted: '#7A7A7A',
  success: '#2E9E5B',
  warning: '#D98A0B',
  danger: '#D64545',
  border: '#EDE7DE',
};

export const dark = {
  primary: '#00BFFF',
  primarySoft: '#00BFFF26',
  secondary: '#8FA6C9',
  background: '#090A0F',
  surface: '#171A21',
  surfaceAlt: '#1E222B',
  text: '#FFFFFF',
  muted: '#8E8E93',
  success: '#4CC57C',
  warning: '#F5B455',
  danger: '#F2726B',
  border: '#262B35',
};

export type Palette = typeof light;

// Grille d'espacement 4/8px
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
};

function makeShadow(elevation: number, opacity: number, blur: number) {
  return Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: Math.ceil(elevation / 2) },
      shadowOpacity: opacity,
      shadowRadius: blur,
    },
    android: { elevation },
    default: {},
  }) as object;
}

// En clair : ombre noire classique. En sombre : le noir sur noir est
// invisible, donc on simule une profondeur par une légère lueur de la
// couleur d'accent (façon "glow"), cohérent avec la maquette de référence.
function makeGlow(color: string, elevation: number, opacity: number, blur: number) {
  return Platform.select({
    ios: {
      shadowColor: color,
      shadowOffset: { width: 0, height: Math.ceil(elevation / 2) },
      shadowOpacity: opacity,
      shadowRadius: blur,
    },
    android: { elevation },
    default: {},
  }) as object;
}

export const lightShadow = {
  sm: makeShadow(3, 0.1, 6),
  md: makeShadow(6, 0.14, 10),
  lg: makeShadow(10, 0.18, 20),
};

export const darkShadow = {
  sm: makeGlow(dark.primary, 3, 0.18, 8),
  md: makeGlow(dark.primary, 6, 0.22, 14),
  lg: makeGlow(dark.primary, 10, 0.28, 24),
};

export const typography = {
  fontFamily: {
    heading: 'Poppins_600SemiBold',
    headingBold: 'Poppins_700Bold',
    body: 'Inter_400Regular',
    bodyMedium: 'Inter_500Medium',
    bodySemiBold: 'Inter_600SemiBold',
  },
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 28,
  },
};
