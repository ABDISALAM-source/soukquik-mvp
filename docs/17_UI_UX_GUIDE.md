# Guide UI/UX (MVP)

## Direction visuelle
- Mobile-first, simple, lisible même pour des utilisateurs peu à l'aise avec la tech
- Palette : fond clair, une couleur d'accent principale (orange/terracotta, évoquant le "souk"), texte gris foncé
- Cartes arrondies pour boutiques/services/produits, avec image, titre, sous-info (catégorie/prix/distance)
- Icônes simples et cohérentes (lucide/expo vector icons)

## Composants réutilisables (`mobile-app/src/components`)
- `Card.tsx` — carte générique (boutique/service/produit)
- `SearchBar.tsx` — barre de recherche avec filtre rapide
- `Button.tsx` — bouton primaire/secondaire
- `StatusBadge.tsx` — badge coloré de statut (commande/réservation)
- `EmptyState.tsx` — état vide générique

## Palette (voir `mobile-app/src/theme/theme.ts`)
```
primary:    #E4572E   (terracotta)
secondary:  #2E4057   (bleu nuit)
background: #FAF7F2
surface:    #FFFFFF
text:       #1F1F1F
muted:      #7A7A7A
success:    #2E9E5B
danger:     #D64545
```

## Animations (MVP vs vision)
Le MVP utilise des transitions standard de React Navigation et de simples animations `LayoutAnimation`/`Animated` sur l'apparition des cartes. L'animation "vague d'eau" dynamique liée au trafic live (vision long-terme) nécessite le tracking visiteurs temps réel (`shop_visits`) non implémenté dans ce MVP — elle est documentée comme amélioration V2 dans `10_SHOPS_MODULE.md`.

## Mode sombre
Prévu dans la structure du thème (`theme.ts` exporte `light` et `dark`), bascule manuelle via le profil. Non branché à un toggle dans les écrans du MVP pour rester focalisé sur les fonctionnalités coeur — facile à activer ensuite (`ThemeProvider` déjà scaffoldé).

## Upload d'images
Le MVP stocke des `image_url` (string). Le formulaire mobile permet de choisir une image locale (`expo-image-picker`) mais l'upload vers un stockage réel (S3/Cloudinary) est un TODO documenté — en attendant, on peut coller une URL d'image directement.
