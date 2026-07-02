# Système de livraison (schéma prêt, hors scope exécution MVP)

## Dans le MVP
La commande a un statut `delivered` géré manuellement par le vendeur (pas d'assignation automatique de livreur, pas de tracking GPS live). C'est volontaire : un vrai système de dispatch + tracking temps réel nécessite des livreurs réels inscrits, une queue de matching, et une connexion WebSocket persistante — hors du périmètre "MVP testable seul".

## Schéma prévu pour V2
Table `delivery_tracking` (déjà documentée en `02_DATABASE_SCHEMA.md`) :
`id, order_id, delivery_person_id, status(pending/accepted/picked_up/in_transit/delivered/cancelled), current_lat, current_lng, updated_at`

## Flux cible V2
1. Commande validée par le vendeur → recherche d'un livreur disponible à proximité (requête géospatiale)
2. Livreur accepte → statut `accepted`
3. Livreur scanne/valide le retrait → `picked_up`
4. Le livreur pousse sa position via WebSocket toutes les X secondes → `in_transit`
5. Livraison confirmée (signature ou code) → `delivered`

## Rôle `delivery`
Prévu dans `05_USER_ROLES.md`, non activé dans le MVP (pas d'écran mobile livreur livré).
