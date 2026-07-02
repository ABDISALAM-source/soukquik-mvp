# Dashboard Prestataire de service

## Écran mobile
`mobile-app/src/screens/ProviderDashboardScreen.tsx`

Affiche :
- Nombre de réservations en attente
- Revenu estimé du jour (réservations `completed` aujourd'hui)
- Liste de ses services actifs
- Liste des réservations avec statut et action accepter/refuser/terminer

## Données consommées
- `GET /services` (filtré côté client sur `provider_id === me`) ou variante future `GET /services/mine`
- `GET /services/:serviceId/bookings`

## Actions disponibles
- Ajouter / modifier un service (prix, description, zone)
- Faire avancer le statut d'une réservation
