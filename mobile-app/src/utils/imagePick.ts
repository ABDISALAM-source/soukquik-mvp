import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

// Choisit une image (galerie), la redimensionne et la renvoie en data-URI
// base64 prête à stocker/afficher. Pas d'infra de fichiers : l'image voyage
// et se stocke telle quelle (TEXT en base). `maxW` bridé pour rester léger.
export async function pickImageAsDataUri(maxW = 600, quality = 0.6): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Permission requise', "Autorise l'accès à tes photos pour ajouter une image.");
    return null;
  }
  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
  });
  if (picked.canceled || !picked.assets?.[0]) return null;

  const out = await ImageManipulator.manipulateAsync(picked.assets[0].uri, [{ resize: { width: maxW } }], {
    compress: quality,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });
  if (!out.base64) return null;
  return `data:image/jpeg;base64,${out.base64}`;
}
