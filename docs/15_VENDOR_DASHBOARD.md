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
- Ajouter un produit
- Modifier / désactiver un produit
- Faire avancer le statut d'une commande (`pending → accepted → preparing → delivered`)
