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

`GET /shops/:id/analytics` renvoie désormais `revenueToday` (somme des commandes créées aujourd'hui, hors annulées) en plus de `revenueTotal`.

## Limites connues
- Un vendeur reste limité à une seule boutique (pas de multi-boutique).
- Un produit désactivé disparaît de la liste (pas de vue "produits désactivés", pas de réactivation depuis l'app).
