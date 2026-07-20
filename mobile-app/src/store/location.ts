import { create } from 'zustand';
import * as Location from 'expo-location';

export type LocationStatus = 'unknown' | 'requesting' | 'granted' | 'denied';

interface LocationState {
  coords: { latitude: number; longitude: number } | null;
  status: LocationStatus;
  /** Demande la permission puis récupère la position — ne relance pas une requête déjà en cours. */
  requestLocation: () => Promise<void>;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  coords: null,
  status: 'unknown',
  requestLocation: async () => {
    if (get().status === 'requesting') return;
    set({ status: 'requesting' });
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        set({ status: 'denied' });
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      set({
        coords: { latitude: position.coords.latitude, longitude: position.coords.longitude },
        status: 'granted',
      });
    } catch {
      // Pas de crash si le GPS est indisponible/désactivé : l'appli continue
      // sans distance/géoloc, l'appelant gère l'absence de coords.
      set({ status: 'denied' });
    }
  },
}));
