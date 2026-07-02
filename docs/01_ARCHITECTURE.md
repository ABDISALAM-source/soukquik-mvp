# Architecture globale

```
                        ┌─────────────────────┐
                        │   Mobile App         │
                        │  (React Native/Expo) │
                        └──────────┬───────────┘
                                   │ REST (HTTPS/JSON) + JWT
                                   ▼
                        ┌─────────────────────┐
                        │   Backend API         │
                        │ Node.js / Express /TS │
                        │  Modular architecture │
                        └──────────┬───────────┘
                                   │ SQL (pg)
                                   ▼
                        ┌─────────────────────┐
                        │   PostgreSQL          │
                        └─────────────────────┘
```

## Style d'architecture backend

Architecture **modulaire en couches**, inspirée de NestJS/Clean Architecture, mais implémentée en Express+TypeScript pour rester simple à lancer (aucun framework compilé lourd requis) :

```
module/
  <name>.routes.ts       -> déclare les endpoints Express
  <name>.controller.ts   -> reçoit req/res, valide les entrées, appelle le service
  <name>.service.ts      -> logique métier
  <name>.repository.ts   -> requêtes SQL (via pg)
  <name>.types.ts        -> types/interfaces du module
```

- **Routes** : uniquement du câblage HTTP → controller
- **Controller** : validation (zod), gestion des erreurs HTTP, pas de SQL
- **Service** : règles métier (ex: vérifier stock avant commande)
- **Repository** : la seule couche qui parle à PostgreSQL

## Flux d'une requête type (créer une commande)

1. Mobile envoie `POST /api/orders` avec JWT
2. `auth.guard` vérifie le token → attache `req.user`
3. `orders.routes` route vers `orders.controller.create`
4. Le controller valide le payload (zod schema)
5. `orders.service.createOrder()` vérifie le produit, le stock, calcule le total
6. `orders.repository.insertOrder()` écrit en base (transaction)
7. Réponse JSON standardisée renvoyée au mobile

## Principes

- **Stateless API** : toute l'état de session vit dans le JWT + la DB
- **RBAC centralisé** : un middleware `requireRole(['vendor'])` réutilisable
- **Réponses standardisées** : `{ success, data, error }`
- **Erreurs centralisées** : un error handler Express global (`common/filters`)
- **Séparation stricte** logique métier / accès données / HTTP

## Monorepo

```
/soukquik-mvp
  /mobile-app   -> app Expo (client, vendeur, prestataire, admin léger)
  /backend      -> API REST
  /database     -> schema.sql, migrations, seed
  /docs         -> toute la documentation (ce dossier)
  /scripts      -> setup.sh, seed.sh
  /config       -> .env.example, docker configs partagées
  /tests        -> tests basiques (Jest + supertest)
  /deployment   -> docker-compose, instructions prod
```
