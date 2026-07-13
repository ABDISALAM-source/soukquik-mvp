# Dashboard Prestataire de service

## Écran mobile
`mobile-app/src/screens/ProviderDashboardScreen.tsx`

Affiche :
- Nombre de réservations en attente
- Total réservations, nombre de services actifs
- Liste de tous ses services actifs (plus de limitation à un seul), chacun tappable pour éditer
- Liste des réservations de tous ses services (triées, avec le titre du service concerné), statut et action accepter/refuser/terminer

## Données consommées
- `GET /services` (filtré côté client sur `provider_id === me`) ou variante future `GET /services/mine`
- `GET /services/:serviceId/bookings` (une requête par service, fusionnées côté client)

## Actions disponibles
- Ajouter un service (`ServiceFormScreen.tsx`, sans `serviceId`), accessible depuis le dashboard ou l'état vide si aucun service n'existe encore
- Modifier / désactiver un service (`ServiceFormScreen.tsx`, avec `serviceId` — formulaire prérempli ; désactivation via `DELETE /services/:id`, soft delete)
- Faire avancer le statut d'une réservation

## Limites connues
- Pas de "revenu du jour" : `GET /services` n'a pas d'équivalent de `GET /shops/:id/analytics`, aucun endpoint d'analytics n'existe pour les services/réservations (prévu dans un lot suivant).
- Un service désactivé disparaît de la liste (même limite que les produits côté vendeur).
