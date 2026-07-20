# Configurer la connexion Google (pour que TOUT LE MONDE puisse se connecter)

Objectif : publier l'app OAuth en **Production** (aucune liste d'emails à
gérer) et récupérer le `webClientId` à coller dans `AuthScreen.tsx`.

Rappel important : une simple connexion demande seulement les permissions
`email` / `profile` / `openid` — **non sensibles**. Donc **aucune vérification
Google**, la publication est **instantanée**.

---

## Étape 1 — Créer (ou choisir) un projet

1. Va sur https://console.cloud.google.com
2. Tout en haut, à côté du logo « Google Cloud », clique sur le **sélecteur de
   projet** (ça affiche le nom du projet courant ou « Sélectionner un projet »).
3. Bouton **« NOUVEAU PROJET »** → Nom : `SoukQuik` → **CRÉER**.
4. Attends quelques secondes, puis re-sélectionne le projet `SoukQuik` dans le
   sélecteur en haut.

---

## Étape 2 — Configurer l'écran de consentement

1. Menu ☰ (en haut à gauche) → **« APIs et services »** → **« Écran de
   consentement OAuth »**.
   (Sur la nouvelle interface, ça s'appelle **« Google Auth Platform »**.)
2. Si on te demande de commencer : clique **« COMMENCER »** / « Get started ».
3. Remplis les champs demandés :
   - **Nom de l'application** : `SoukQuik`
   - **E-mail d'assistance utilisateur** : ton email (`abdisalamhoussein771@gmail.com`)
   - **Type d'utilisateur / Audience** : choisis **« Externe »** (External).
   - **Coordonnées du développeur** : ton email à nouveau.
4. Enregistre / continue jusqu'au bout. (Tu peux ignorer le logo pour l'instant.)
5. Pour les **scopes/permissions** : ne rien ajouter de spécial. Par défaut
   `email`, `profile`, `openid` suffisent. **Ne prends aucun scope « sensible »**
   (Gmail, Drive, etc.) — sinon Google exigerait une vérification.

---

## Étape 3 — PUBLIER (le point clé : plus aucune liste d'emails)

1. Toujours dans **« Écran de consentement OAuth »**, va sur l'onglet/section
   **« Audience »** (ou reste sur la page principale de l'écran de consentement).
2. Tu verras **« État de publication : Test »** (Publishing status: Testing).
3. Clique le bouton **« PUBLIER L'APPLICATION »** (Publish app).
4. Une fenêtre « Passer en production ? » apparaît → clique **« CONFIRMER »**.
5. L'état passe à **« En production »** (In production).

✅ À partir de là, **n'importe qui avec un compte Google peut se connecter**,
sans que tu aies à ajouter le moindre email. Pas de revue, pas d'attente.

> Comme tu n'utilises que des scopes non sensibles, Google n'affiche pas de
> demande de vérification. (Au pire un écran « application non vérifiée » avec
> un bouton « Continuer » — jamais un blocage.)

---

## Étape 4 — Créer l'ID client « Application Web »

C'est le `webClientId` qui manque actuellement (celui utilisé par Expo Go).

1. Menu ☰ → **« APIs et services »** → **« Identifiants »** (Credentials).
2. Bouton **« + CRÉER DES IDENTIFIANTS »** → **« ID client OAuth »**.
3. **Type d'application** : **« Application Web »** (Web application).
4. Nom : `SoukQuik Web`.
5. **URI de redirection autorisés** → **« + AJOUTER UN URI »**, et ajoute :
   ```
   https://auth.expo.io/@khayali/soukquik
   ```
   (C'est l'URL qu'Expo Go utilise pour te ramener dans l'app après Google.)
6. Clique **« CRÉER »**.
7. Une fenêtre affiche ton **« ID client »** — c'est une longue chaîne qui finit
   par `.apps.googleusercontent.com`. **Copie-la.**

---

## Étape 5 — Coller l'ID dans l'app

Ouvre `mobile-app/src/screens/AuthScreen.tsx`, trouve le bloc :

```js
const [request, response, promptAsync] = Google.useAuthRequest({
  androidClientId: '315459013363-...apps.googleusercontent.com',
  iosClientId: '',
  webClientId: 'VOTRE_ID_WEB_ICI.apps.googleusercontent.com',
});
```

Remplace `VOTRE_ID_WEB_ICI.apps.googleusercontent.com` par l'**ID client Web**
copié à l'étape 4. Enregistre, relance `npx expo start`, et réessaie « Google ».

---

## Notes

- **Android en build réel** : l'`androidClientId` déjà présent ne marche que dans
  un vrai build signé (pas Expo Go). Pour un build EAS Android, il faudra créer
  un client OAuth « Android » avec le package `com.soukquik.app` + l'empreinte
  SHA‑1 de la clé de signature.
- **Expo SDK 54** : le proxy `auth.expo.io` est en fin de vie. Si le login
  échoue encore dans Expo Go après cette config, la solution fiable est un
  **build de développement** (`eas build --profile development`) au lieu d'Expo
  Go — le flux Google natif y fonctionne sans proxy.
- Le reste de l'app ne dépend pas de Google : l'**inscription par email**
  fonctionne directement.
