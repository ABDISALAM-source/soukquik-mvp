# Déploiement

## Démarrage rapide (local, recommandé pour tester le MVP)

Prérequis : Docker + Docker Compose installés.

```bash
cd soukquik-mvp
cp config/.env.example config/.env
docker compose -f deployment/docker-compose.yml up --build
```

Cela démarre :
- `postgres` sur le port `5432`
- `backend` (API) sur le port `4000`

Puis, pour appliquer le schéma et les données de démo (première fois) :
```bash
docker compose -f deployment/docker-compose.yml exec backend npm run db:migrate
docker compose -f deployment/docker-compose.yml exec backend npm run db:seed
```

Vérifier : `curl http://localhost:4000/api/health` → `{ "success": true, "data": { "status": "ok" } }`

## App mobile
```bash
cd mobile-app
npm install
npx expo start
```
Sur un appareil physique, définir `EXPO_PUBLIC_API_URL=http://<IP-locale>:4000/api` dans `mobile-app/.env`.

## Déploiement "production" (documenté, à adapter)
- Backend : conteneuriser l'image `backend/Dockerfile`, déployer sur un service comme Render/Railway/Fly.io/VPS + reverse proxy (Nginx) + HTTPS (Let's Encrypt)
- Base de données : PostgreSQL managé (ex: Neon, Supabase, RDS)
- Variables d'environnement : ne jamais commiter `.env`, utiliser les secrets du provider
- Redis (queues, cache) et Meilisearch (recherche avancée) : à ajouter comme services supplémentaires dans `docker-compose.yml` quand le besoin se présente (sections commentées prêtes dans le fichier)
- Mobile : build via `eas build` (Expo Application Services) pour générer les binaires iOS/Android à publier sur les stores

## CI/CD (documenté)
Un exemple de pipeline GitHub Actions (lint + test + build) est à ajouter dans `.github/workflows/ci.yml` — non inclus dans ce MVP pour rester focalisé sur le code applicatif, mais la commande `npm test` et `npm run build` du backend sont déjà prêtes à être branchées telles quelles.
