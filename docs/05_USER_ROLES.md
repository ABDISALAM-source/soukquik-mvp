# Rôles utilisateurs (RBAC)

| Rôle | Description | Accès principaux |
|---|---|---|
| `client` | utilisateur final | recherche, commande, réservation, chat |
| `vendor` | propriétaire de boutique | CRUD sa/ses boutique(s), produits, commandes reçues |
| `provider` | prestataire de service | CRUD son/ses service(s), réservations reçues |
| `admin` | administrateur plateforme | modération, stats, gestion utilisateurs |

## Extension future (documentée, non implémentée dans le MVP)
- `delivery` (livreur) : accès au module de livraison/tracking
- `super_admin` : gestion des admins eux-mêmes
- `support` : accès aux tickets/chats support uniquement

## Règles d'accès clés

- Un `vendor` ne peut modifier que **ses propres** boutiques/produits (vérification `owner_id === req.user.id`)
- Un `provider` ne peut modifier que **ses propres** services
- Un `client` ne peut voir que **ses propres** commandes/réservations
- Un `admin` a un accès large mais en lecture seule sur le contenu métier (modération = changement de statut, pas d'édition de contenu tiers)

## Implémentation

Le rôle est stocké dans la table `users.role` et encodé dans le JWT au login. Le middleware `requireRole` (voir `backend/src/common/guards`) filtre les routes ; les vérifications de propriété (`owner_id`) se font au niveau des `service.ts` de chaque module.
