# Dashboard Prestataire de service

## Écran mobile
`mobile-app/src/screens/ProviderDashboardScreen.tsx`

Affiche :
- Nombre de réservations en attente, revenu du jour, revenu total, nombre de services actifs (via `GET /services/analytics/mine`)
- Liste de tous ses services actifs (plus de limitation à un seul), chacun tappable pour éditer
- Liste des réservations de tous ses services (triées, avec le titre du service concerné), statut et action accepter/refuser/terminer

## Données consommées
- `GET /services` (filtré côté client sur `provider_id === me`) ou variante future `GET /services/mine`
- `GET /services/:serviceId/bookings` (une requête par service, fusionnées côté client)
- `GET /services/analytics/mine` (nouveau) — agrégé sur tous les services du prestataire, pas un seul : `{totalServices, activeServices, totalBookings, pendingBookings, revenueToday, revenueTotal}`

## Actions disponibles
- Ajouter un service (`ServiceFormScreen.tsx`, sans `serviceId`), accessible depuis le dashboard ou l'état vide si aucun service n'existe encore
- Modifier / désactiver un service (`ServiceFormScreen.tsx`, avec `serviceId` — formulaire prérempli ; désactivation via `DELETE /services/:id`, soft delete)
- Faire avancer le statut d'une réservation

## Limites connues
- Le revenu est calculé à partir du prix *actuel* du service (`services.price`), pas d'un instantané pris à la réservation — contrairement aux commandes (`order_items.unit_price`), les réservations ne gardent pas de trace du prix au moment de la réservation. Si un prestataire change son prix, le revenu des réservations passées se recalcule rétroactivement avec le nouveau prix. Corriger nécessiterait une colonne `price` sur `bookings`, hors scope de ce lot.
- "Revenu du jour" = réservations `completed` créées aujourd'hui (`created_at`), pas terminées aujourd'hui — il n'y a pas de colonne `completed_at`, même limite que `revenueToday` côté boutique.
- Un service désactivé disparaît de la liste (même limite que les produits côté vendeur).
