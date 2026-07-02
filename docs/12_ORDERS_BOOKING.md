# Commandes (produits) & Réservations (services)

## Commandes (orders)

Flux :
1. Client ajoute des produits au panier (côté mobile, état local)
2. `POST /orders` avec `{ shopId, items: [{productId, quantity}], deliveryAddress }`
3. Le service vérifie le stock de chaque produit, calcule `total_amount`
4. Transaction SQL : insert `orders` + `order_items`, décrémente le stock
5. Statuts : `pending → accepted → preparing → delivered` (ou `cancelled` à tout moment avant `delivered`)
6. Le vendeur change le statut via `PATCH /orders/:id/status`

## Réservations (bookings)

Flux :
1. Client choisit un service + une date/heure souhaitée
2. `POST /bookings` avec `{ serviceId, scheduledAt, notes }`
3. Statuts : `pending → accepted → completed` (ou `cancelled`)
4. Le prestataire accepte/refuse/termine via `PATCH /bookings/:id/status`

## Notifications (MVP)
Dans le MVP, pas de push notifications : le client et le vendeur/prestataire voient les changements de statut en rafraîchissant l'écran (polling léger côté mobile). Les push notifications (Expo Notifications) sont documentées comme amélioration V2.
