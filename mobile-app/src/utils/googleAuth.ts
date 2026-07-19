import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Connexion Google NATIVE (Play Services) — pas de navigateur, pas de
// redirect_uri, pas de schéma personnalisé : le sélecteur de compte Google
// s'ouvre nativement et renvoie directement dans l'app. C'est la méthode
// fiable (contrairement à expo-auth-session).
//
// webClientId = le client "Application Web" (nécessaire pour obtenir un
// idToken/accessToken utilisable côté serveur). Le client Android + SHA-1
// enregistrés servent à autoriser l'app.
const WEB_CLIENT_ID = '315459013363-aj25vof7bfj0br88h33aq4do8k5khvv5.apps.googleusercontent.com';

let configured = false;
function ensureConfigured() {
  if (configured) return;
  GoogleSignin.configure({ webClientId: WEB_CLIENT_ID, offlineAccess: false });
  configured = true;
}

// Lance la connexion et renvoie un accessToken Google (que le backend
// vérifie via l'API userinfo). Renvoie null si l'utilisateur annule.
export async function signInWithGoogleNative(): Promise<string | null> {
  ensureConfigured();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const result: any = await GoogleSignin.signIn();
  // v13+ renvoie { type: 'cancelled' } ou { type: 'success', data }.
  if (result?.type === 'cancelled') return null;
  const tokens = await GoogleSignin.getTokens();
  return tokens?.accessToken ?? null;
}
