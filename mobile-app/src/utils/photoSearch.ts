import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as catalogApi from '../api/catalog';
import type { CompareResult } from '../api/catalog';

// Redimensionne à 512 px de large max + JPEG qualité 0.6 pour garder le
// payload base64 léger (l'empreinte dHash n'a pas besoin de haute résolution).
async function toCompactBase64(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 512 } }], {
    compress: 0.6,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });
  return result.base64 ?? '';
}

interface PhotoSearchOutcome {
  cancelled?: boolean;
  matched?: boolean;
  results?: CompareResult[];
}

// Demande caméra OU galerie, lance la recherche par image. Retourne les
// résultats (ou cancelled). Gère proprement les refus de permission.
export async function runPhotoSearch(
  source: 'camera' | 'library',
  coords?: { latitude: number; longitude: number } | null
): Promise<PhotoSearchOutcome> {
  const perm =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert(
      'Permission requise',
      source === 'camera'
        ? "Autorise l'accès à l'appareil photo pour rechercher par image."
        : "Autorise l'accès à la galerie pour rechercher par image."
    );
    return { cancelled: true };
  }

  const picked =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, mediaTypes: ImagePicker.MediaTypeOptions.Images });
  if (picked.canceled || !picked.assets?.[0]) return { cancelled: true };

  const base64 = await toCompactBase64(picked.assets[0].uri);
  if (!base64) {
    Alert.alert('Erreur', "Impossible de traiter l'image.");
    return { cancelled: true };
  }

  const res = await catalogApi.imageSearch(base64, coords ? { lat: coords.latitude, lng: coords.longitude } : undefined);
  return { matched: res.matched, results: res.results };
}
