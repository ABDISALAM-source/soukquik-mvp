# Guide UI/UX

## Direction visuelle
- Mobile-first, simple, lisible même pour des utilisateurs peu à l'aise avec la tech
- Palette : fond clair, une couleur d'accent principale (orange/terracotta, évoquant le "souk"), texte gris foncé
- Cartes arrondies pour boutiques/services/produits, avec image, titre, sous-info (catégorie/prix/distance)
- Typographie : Poppins (titres, `typography.fontFamily.heading`/`headingBold`) + Inter (corps, `body`/`bodyMedium`/`bodySemiBold`), chargées via `@expo-google-fonts` (import par sous-chemin, voir `App.tsx` — évite d'embarquer les poids de police non utilisés dans le bundle)
- Icônes : `@expo/vector-icons` (inclus dans le package `expo`, pas de dépendance séparée)

## Design system (`mobile-app/src/theme/theme.ts`)
En plus de la palette `light`/`dark`, le thème expose :
- `spacing` — grille 4/8px (`xs` à `xxl`)
- `radius` — rayons cohérents (`sm`/`md`/`lg`/`pill`)
- `shadow` — ombres douces cross-platform (`sm`/`md`/`lg`, iOS shadow* + Android elevation)
- `typography` — familles et échelle de tailles

## Composants réutilisables (`mobile-app/src/components`)
- `Card.tsx` — carte générique (boutique/service/produit), retour visuel scale/opacity au tap + apparition en fondu/décalage au montage (react-native-reanimated)
- `Button.tsx` — bouton primaire/secondaire animé (scale/opacity au tap)
- `SearchBar.tsx` — barre de recherche
- `StatusBadge.tsx` — badge coloré de statut (commande/réservation)
- `EmptyState.tsx` — état vide générique (vrais états vides uniquement, pas les chargements — voir `Skeleton`)
- `Skeleton.tsx` / `SkeletonCardRow` — placeholders shimmer animés pour les états de chargement
- `Carousel.tsx` — surcouche FlatList horizontale pour les rangées défilantes (pas de pagination/snap)
- `Badge.tsx` — pill générique (tags, "Sponsorisé"...), distinct de `StatusBadge`
- `Avatar.tsx` — image/initiales en cercle, avec une prop `pulseIntensity` optionnelle déjà câblée pour l'animation "vague de présence" (calcul réel branché en Phase 8)
- `PriceTag.tsx` — prix formaté, avec prix barré optionnel pour promo
- `RatingStars.tsx` — étoiles en lecture seule (moyenne de notes) ; variante interactive différée à la Phase 3 (avis)

## Animations
Transitions d'écran fluides via `@react-navigation/native-stack` (`animation: 'slide_from_right'`, voir `RootNavigator.tsx`). Micro-interactions (retour au tap, apparition des cartes, shimmer de chargement) via `react-native-reanimated`. L'animation "vague d'eau" dynamique liée à la présence temps réel est prête côté composant (`Avatar.pulseIntensity`) mais nécessite le flux de présence temps réel (Phase 8, `shop_presence` + WebSocket) pour être alimentée par de vraies données.

## Mode sombre
Prévu dans la structure du thème (`theme.ts` exporte `light` et `dark`), bascule manuelle via le profil. Non branché à un toggle dans les écrans pour rester focalisé sur les fonctionnalités coeur — facile à activer ensuite.

## Upload d'images
Le MVP stocke des `image_url` (string). Le formulaire mobile permet de choisir une image locale (`expo-image-picker`) mais l'upload vers un stockage réel (S3/Cloudinary) est un TODO documenté — en attendant, on peut coller une URL d'image directement.
