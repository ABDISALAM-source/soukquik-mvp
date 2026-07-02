# Guide pour Claude Code (ou tout dev reprenant ce projet)

Ce fichier explique comment comprendre, lancer et étendre le projet SoukQuik MVP.

## 1. Comprendre le projet en 2 minutes
- Lire `docs/00_OVERVIEW.md` (vision + périmètre du MVP)
- Lire `docs/01_ARCHITECTURE.md` (comment le code est organisé)
- Lire `docs/02_DATABASE_SCHEMA.md` (les tables)
- Parcourir `backend/src/modules/shops` comme **module de référence** : tous les autres modules (`products`, `services`, `orders`, `bookings`) suivent exactement le même patron.

## 2. Lancer le backend
```bash
cd backend
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```
API sur `http://localhost:4000/api`. Voir `docs/19_DEPLOYMENT.md` pour la version Docker.

## 3. Lancer l'app mobile
```bash
cd mobile-app
npm install
npx expo start
```

## 4. Comment ajouter une nouvelle fonctionnalité (exemple : ajouter les "avis" / reviews)

1. **Base de données** : ajouter la table dans `database/migrations/002_reviews.sql` (nouvelle migration, ne jamais modifier `001_init.sql` directement une fois appliqué)
2. **Backend** : créer `backend/src/modules/reviews/` avec les 5 fichiers standards (`routes`, `controller`, `service`, `repository`, `types`) en copiant le patron de `modules/products`
3. **Brancher les routes** dans `backend/src/app.ts` (`app.use('/api/reviews', reviewsRoutes)`)
4. **Mobile** : ajouter les appels API dans `mobile-app/src/api/reviews.ts`, puis un composant `ReviewList.tsx` et l'intégrer dans `ShopScreen.tsx`/`ServiceScreen.tsx`
5. **Documenter** : ajouter/mettre à jour un fichier `docs/XX_REVIEWS.md`
6. **Tester** : ajouter un test dans `tests/` suivant le patron de `tests/products.test.ts`

## 5. Conventions strictes de code

- **TypeScript strict** partout (backend et mobile), pas de `any` sauf cas exceptionnel justifié en commentaire
- **Validation** : chaque endpoint d'écriture valide son body avec un schéma `zod` dédié dans le fichier `*.controller.ts` ou `*.types.ts`
- **SQL** : toujours via requêtes paramétrées (`$1, $2...`), jamais de concaténation de string
- **Erreurs** : lever des `AppError(statusCode, message)` (voir `common/filters`) plutôt que `throw new Error()` brut, pour un mapping HTTP cohérent
- **Nommage** : fichiers en `kebab-case` ou `camelCase.type.ts` selon le patron du module ; tables et colonnes SQL en `snake_case` ; JSON API en `camelCase` (mapping fait dans le repository)
- **Un commit = un sujet** : ne pas mélanger une migration DB avec une feature mobile sans rapport
- **Pas de logique métier dans les controllers ni dans les écrans mobiles** : elle vit dans `*.service.ts` (backend) ou dans les hooks/`store` (mobile)

## 6. Où sont les choses "documentées mais pas codées" ?

Toute fonctionnalité de la vision long-terme non implémentée dans ce MVP est explicitement marquée **"documenté / non implémenté"** dans le fichier `docs/` correspondant (paiement en ligne, Meilisearch, tracking GPS live, animations trafic temps réel, push notifications). Chercher ces mentions avant de supposer qu'une fonctionnalité existe déjà.

## 7. Tests
```bash
cd backend
npm test
```
Voir `tests/` — tests Jest + Supertest sur l'auth, les produits et les services, contre une base PostgreSQL de test (variable `DATABASE_URL_TEST`).
