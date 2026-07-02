# Structure du backend

```
backend/
  src/
    server.ts               -> point d'entrée, démarre Express
    app.ts                  -> configuration de l'app Express (middlewares, routes)
    config/
      env.ts                -> lecture et validation des variables d'environnement
      db.ts                 -> pool de connexion PostgreSQL (pg)
    common/
      guards/auth.guard.ts       -> vérifie le JWT
      guards/role.guard.ts       -> vérifie le rôle
      filters/error.filter.ts    -> gestion centralisée des erreurs
      interceptors/response.ts   -> formate les réponses { success, data, error }
      decorators/                -> helpers (asyncHandler, etc.)
    modules/
      auth/        -> register, login, refresh
      users/       -> profil utilisateur
      categories/  -> liste des catégories
      shops/       -> CRUD boutiques + analytics simple
      products/    -> CRUD produits (sous une boutique)
      services/    -> CRUD services (prestataires)
      orders/      -> commandes de produits
      bookings/    -> réservations de services
      chat/        -> chats/messages
      search/      -> recherche unifiée
```

Chaque module suit le même patron (`*.routes.ts`, `*.controller.ts`, `*.service.ts`, `*.repository.ts`, `*.types.ts`) — voir `01_ARCHITECTURE.md`.

## Démarrer le backend en local

```bash
cd backend
cp .env.example .env
npm install
npm run db:migrate   # crée les tables
npm run db:seed      # insère des données de démo
npm run dev           # démarre en mode watch (ts-node-dev)
```

API disponible sur `http://localhost:4000/api`.
