# Schéma de base de données (PostgreSQL)

Le SQL complet exécutable est dans `/database/migrations/` (`001_init.sql`
pour le socle MVP, `002_v2_features.sql` pour les extensions V2 — voir plus
bas). Les données de démo sont dans `/database/seed/seed.sql`.

`npm run db:migrate` (`backend/scripts/run-sql.js`) suit les fichiers déjà
appliqués via une table `schema_migrations` — relancer la commande ne
rejoue que les nouvelles migrations.

## Tables principales du MVP

### users
| colonne | type | notes |
|---|---|---|
| id | uuid PK | |
| full_name | text | |
| email | text unique | |
| phone | text unique | |
| password_hash | text | |
| role | text | client / vendor / provider / admin |
| avatar_url | text | nullable |
| created_at | timestamptz | |

### shops
| colonne | type | notes |
|---|---|---|
| id | uuid PK | |
| owner_id | uuid FK → users | |
| name | text | |
| description | text | |
| category_id | uuid FK → categories | |
| latitude / longitude | double precision | |
| address | text | |
| opening_hours | jsonb | |
| logo_url | text | |
| is_active | boolean | |
| created_at | timestamptz | |

### services (prestataires)
| colonne | type | notes |
|---|---|---|
| id | uuid PK | |
| provider_id | uuid FK → users | |
| title | text | ex: "Électricien à domicile" |
| description | text | |
| category_id | uuid FK → categories | |
| price | numeric | |
| price_unit | text | "par heure", "forfait", etc. |
| latitude / longitude | double precision | |
| service_area_km | numeric | rayon d'intervention |
| is_active | boolean | |
| created_at | timestamptz | |

### products
| colonne | type | notes |
|---|---|---|
| id | uuid PK | |
| shop_id | uuid FK → shops | |
| name | text | |
| description | text | |
| category_id | uuid FK → categories | |
| price | numeric | |
| stock | integer | |
| image_url | text | |
| is_active | boolean | |
| created_at | timestamptz | |

### categories
`id, name, type (product/service/both), icon`

### orders
`id, client_id, shop_id, status(pending/accepted/preparing/delivered/cancelled), total_amount, delivery_address, created_at`

### order_items
`id, order_id, product_id, quantity, unit_price`

### bookings (réservations de service)
`id, client_id, service_id, status(pending/accepted/completed/cancelled), scheduled_at, notes, created_at`

### chats / messages
`chats: id, client_id, target_type(shop/service), target_id, created_at`
`messages: id, chat_id, sender_id, content, created_at`

## Diagramme relationnel (simplifié)

```
users (1)───(N) shops
users (1)───(N) services
users (1)───(N) orders (as client)
shops (1)───(N) products
shops (1)───(N) orders
services (1)───(N) bookings
orders (1)───(N) order_items
products (1)───(N) order_items
categories (1)───(N) shops / services / products
chats (1)───(N) messages
```

## Extensions V2 (`002_v2_features.sql`, Phase 1)

### brands
`id, name (unique), logo_url` — suggestion de marque à l'ajout d'un article (Phase 5). `products.brand_id` (nullable, FK) ajouté par la même migration. Pas de `product_variants` (taille/couleur) : non demandé explicitement, à réévaluer si un besoin concret apparaît.

### product_images
`id, product_id FK, url, position` — plusieurs photos par article, réordonnables (Phase 5).

### likes
`user_id, target_type(shop/service/product), target_id, created_at` — PK composite `(user_id, target_type, target_id)` : un like par user/cible, togglable (remplace un compteur simple).

### shop_presence
`id, shop_id FK, user_id FK, entered_at, left_at nullable` — session ouverte (`left_at IS NULL`) = présence active. Index partiel dédié pour compter les présences actives sans scanner l'historique (Phase 8).

### reviews
`id, author_id FK, target_type(shop/service/product), target_id, rating(1-5), comment, created_at` (Phase 3).

### notifications
`id, user_id FK, type, payload jsonb, read_at nullable, created_at` — centre de notifications in-app (Phase 7).

### promotions
`id, target_type(shop/service/product), target_id, owner_id FK, budget, status(pending/active/expired), starts_at, ends_at, impressions, clicks` — publicité sponsorisée (Phase 9).

### Index géospatiaux
`shops(latitude, longitude)` et `services(latitude, longitude)` — déjà utilisés pour le tri par proximité, jamais indexés jusqu'ici.

## Notes MVP → Vision long-terme

Reste à venir (pas encore de migration) : `payments`, `wallets`, `transactions` (paiement en ligne), `delivery_tracking` (position GPS livreur), `service_schedules` (calendrier de disponibilité prestataire, Phase 6).
