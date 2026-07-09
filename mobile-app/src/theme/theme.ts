import { Platform } from 'react-native';

export const light = {
  primary: '#E4572E',
  secondary: '#2E4057',
  background: '#FAF7F2',
  surface: '#FFFFFF',
  text: '#1F1F1F',
  muted: '#7A7A7A',
  success: '#2E9E5B',
  danger: '#D64545',
  border: '#EDE7DE',
};

export const dark = {
  primary: '#E4572E',
  secondary: '#8FA6C9',
  background: '#141414',
  surface: '#1F1F1F',
  text: '#F5F5F5',
  muted: '#A3A3A3',
  success: '#4CC57C',
  danger: '#E96666',
  border: '#2A2A2A',
};

export type Theme = typeof light;
export const theme = light;

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

export const shadow = {
  sm: makeShadow(3, 0.1, 6),
  md: makeShadow(6, 0.14, 10),
  lg: makeShadow(10, 0.18, 20),
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
