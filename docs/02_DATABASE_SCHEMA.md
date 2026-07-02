# Schéma de base de données (PostgreSQL)

Le SQL complet exécutable est dans `/database/migrations/001_init.sql`.
Les données de démo sont dans `/database/seed/seed.sql`.

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

## Notes MVP → Vision long-terme

Le schéma complet de la vision (payments, wallets, transactions, reviews, promotions, analytics_events, shop_visits, delivery_tracking, service_schedules) est **documenté ci-dessous** et partiellement présent en base (colonnes de statut prêtes), pour extension facile sans migration cassante :

- `payments`, `wallets`, `transactions` → prévues pour la phase paiement en ligne
- `reviews` → notation boutique/service/produit
- `promotions` → codes promo
- `analytics_events`, `shop_visits` → tracking visiteurs temps réel
- `delivery_tracking` → position GPS livreur
- `service_schedules` → calendrier de disponibilité du prestataire

Voir les `TODO` en fin de `001_init.sql` pour les `CREATE TABLE` prêts à activer.
