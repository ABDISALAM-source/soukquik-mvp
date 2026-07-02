# Application mobile (React Native / Expo)

## Stack
- Expo (managed workflow)
- TypeScript
- React Navigation (stack + bottom tabs)
- Zustand (state global : session utilisateur, panier)
- Axios (client API)
- Expo SecureStore (stockage des tokens)

## Écrans livrés dans le MVP

| Écran | Fichier | Rôle |
|---|---|---|
| Login / Register | `screens/AuthScreen.tsx` | tous |
| Home (recherche + listes) | `screens/HomeScreen.tsx` | client |
| Résultats de recherche | `screens/SearchScreen.tsx` | client |
| Détail boutique | `screens/ShopScreen.tsx` | client |
| Détail service | `screens/ServiceScreen.tsx` | client |
| Détail produit / commande | `screens/ProductDetailScreen.tsx` | client |
| Panier | `screens/CartScreen.tsx` | client |
| Réservation service | `screens/BookingScreen.tsx` | client |
| Profil | `screens/ProfileScreen.tsx` | tous |
| Dashboard vendeur | `screens/VendorDashboardScreen.tsx` | vendor |
| Dashboard prestataire | `screens/ProviderDashboardScreen.tsx` | provider |

## Navigation

```
AuthStack (si non connecté)
  - Login
  - Register

MainTabs (si connecté, rôle client)
  - Home
  - Search
  - Cart
  - Profile

VendorTabs (si connecté, rôle vendor)
  - Dashboard
  - Products
  - Orders
  - Profile

ProviderTabs (si connecté, rôle provider)
  - Dashboard
  - Services
  - Bookings
  - Profile
```

Le routeur (`src/navigation/RootNavigator.tsx`) choisit la pile selon `session.role`.

## Lancer l'app

```bash
cd mobile-app
npm install
npx expo start
```

Scanner le QR code avec Expo Go, ou lancer un simulateur iOS/Android.

## Configuration de l'API

`src/api/client.ts` lit `EXPO_PUBLIC_API_URL` (par défaut `http://localhost:4000/api`). Sur un téléphone physique, remplacer par l'IP locale de la machine qui fait tourner le backend.
