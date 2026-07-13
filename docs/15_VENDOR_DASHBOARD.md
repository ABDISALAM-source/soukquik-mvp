# Dashboard Vendeur

## Écran mobile
`mobile-app/src/screens/VendorDashboardScreen.tsx`

Affiche :
- Nombre de commandes du jour
- Revenu du jour
- Liste des produits actifs avec stock
- Liste des dernières commandes avec statut, et bouton pour changer le statut

## Données consommées
- `GET /shops/:id/analytics`
- `GET /shops/:shopId/orders`
- `GET /shops/:shopId/products`

## Actions disponibles
- Créer sa boutique (`CreateShopScreen.tsx`) — obligatoire avant de voir le dashboard, aucune boutique n'est créée à l'inscription
- Ajouter un produit (`ProductFormScreen.tsx`, sans `productId`)
- Modifier / désactiver un produit (`ProductFormScreen.tsx`, avec `productId` — le formulaire est prérempli ; la désactivation appelle `DELETE /products/:id`, qui est un soft delete)
- Faire avancer le statut d'une commande (`pending → accepted → preparing → delivered`)

## Limites connues
- "Revenu total" affiché (pas "revenu du jour" comme prévu à l'origine) : `GET /shops/:id/analytics` ne calcule pas encore de chiffre d'affaires journalier, seulement le total et le nombre de commandes du jour. À corriger.
- Un vendeur reste limité à une seule boutique (pas de multi-boutique).
