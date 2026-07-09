import 'react-native-gesture-handler';
import React, { useCallback, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
// Import direct par sous-chemin (pas depuis l'index du package) : évite que
// Metro embarque les 18 poids de chaque famille alors qu'on n'en utilise que 5.
import Poppins_600SemiBold from '@expo-google-fonts/poppins/600SemiBold/Poppins_600SemiBold.ttf';
import Poppins_700Bold from '@expo-google-fonts/poppins/700Bold/Poppins_700Bold.ttf';
import Inter_400Regular from '@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf';
import Inter_500Medium from '@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf';
import Inter_600SemiBold from '@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf';
// Import direct du sous-module Ionicons (pas depuis l'index du package) :
// l'index @expo/vector-icons réexporte les 15 familles d'icônes, ce qui
// embarquerait ~3.5Mo de polices inutilisées (MaterialCommunityIcons seul
// pèse 1.3Mo) alors qu'on n'utilise qu'Ionicons.
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { RootNavigator } from './src/navigation/RootNavigator';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    // Précharge la police d'icônes explicitement (au lieu de compter sur le
    // chargement lazy interne du composant Ionicons) pour éviter le flash de
    // glyphe manquant ("rectangle vide") au premier rendu de la tab bar.
    ...Ionicons.font,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <StatusBar style="dark" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}
