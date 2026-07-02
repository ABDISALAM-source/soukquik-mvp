# Module Services (Prestataires)

## Fonctionnalités MVP
- Créer un profil de service (un `provider` peut proposer plusieurs services)
- Définir prix, unité de prix, zone d'intervention (rayon en km autour d'un point GPS)
- Modifier / supprimer son service
- Lister les services (public, filtre catégorie + texte)
- Voir le détail d'un service

## Endpoints
Voir `03_API_REFERENCE.md` section Services.

## Règles métier
- Seul le `provider_id` propriétaire peut modifier/supprimer
- Un service désactivé n'apparaît plus publiquement
- Le calcul de proximité utilise la formule haversine côté SQL pour trier par distance quand `lat`/`lng` client sont fournis

## Réservation
Voir `12_ORDERS_BOOKING.md`. Le calendrier de disponibilité détaillé (`service_schedules`) est schématisé mais simplifié dans le MVP à un simple champ `scheduled_at` choisi librement par le client à la réservation ; le prestataire accepte ou refuse ensuite.
