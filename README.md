# SoukQuik — MVP

Marché digital local : boutiques + prestataires de services, recherche unifiée, commandes et réservations.

## Démarrage rapide

```bash
# 1. Backend + base de données via Docker
cp config/.env.example config/.env
docker compose -f deployment/docker-compose.yml up --build -d
docker compose -f deployment/docker-compose.yml exec backend npm run db:migrate
docker compose -f deployment/docker-compose.yml exec backend npm run db:seed

# 2. Vérifier l'API
curl http://localhost:4000/api/health

# 3. App mobile
cd mobile-app
npm install
npx expo start
```

## Comptes de démo (mot de passe : `password123`)
| Email | Rôle |
|---|---|
| amina@example.com | client |
| farah@example.com | vendor |
| omar@example.com | provider |
| admin@soukquik.dj | admin |

## Documentation complète

Voir le dossier `/docs` — commencer par `docs/00_OVERVIEW.md` puis `docs/20_CLAUDE_CODE_GUIDE.md`.

## Structure

```
/mobile-app   -> app Expo (React Native)
/backend      -> API REST (Node/Express/TypeScript)
/database     -> schéma SQL + seed
/docs         -> documentation complète (21 fichiers .md)
/scripts      -> setup.sh, seed.sh
/config       -> variables d'environnement partagées
/tests        -> tests Jest + Supertest
/deployment   -> docker-compose.yml
```
