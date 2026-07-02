# SoukQuik — Vue d'ensemble du MVP

## Qu'est-ce que SoukQuik ?

SoukQuik est un **marché digital local** qui combine :
- Un annuaire/marketplace de **magasins** (produits)
- Un annuaire/marketplace de **prestataires de services** (électriciens, profs, mécaniciens, etc.)
- Une **recherche unifiée** produits + services + boutiques
- Un système de **commande** (produits) et de **réservation** (services)

Ce n'est pas un e-commerce classique : c'est une plateforme qui connecte l'offre locale (magasins et artisans) à la demande locale (clients), avec géolocalisation, chat et dashboards simples.

## Portée de ce MVP

Le MVP livré est **fonctionnel de bout en bout** :
- Backend API REST (Node.js / Express / TypeScript, architecture modulaire)
- Base de données PostgreSQL avec schéma complet + migrations + seed
- Authentification JWT (register/login/refresh) + RBAC (rôles)
- Recherche texte + filtres (catégorie, type, prix)
- CRUD produits & services
- Commandes (produits) et réservations (services)
- Dashboards vendeur / prestataire (endpoints + écrans mobiles simples)
- App mobile React Native (Expo) avec les écrans clés
- Docker Compose (API + PostgreSQL)
- Tests de base (auth, produits, services)

## Ce qui est documenté mais pas branché "en dur" dans ce MVP

Pour rester livrable et testable, certaines briques avancées de la vision long-terme sont **prévues dans l'architecture et documentées**, mais pas connectées à un service externe payant dans le code du MVP :
- Recherche full-text avancée type Meilisearch (le MVP utilise la recherche PostgreSQL `ILIKE`/full-text ; Meilisearch reste un plug-in futur, voir `09_SEARCH_SYSTEM.md`)
- Redis / BullMQ pour queues (voir `19_DEPLOYMENT.md`)
- Stockage S3 pour images (le MVP stocke des URLs d'images ; upload réel à brancher)
- Paiement en ligne (le MVP gère "cash on delivery" + statut wallet basique)
- Tracking GPS live livreur (schéma et statuts existent, la socket temps réel est simplifiée)

## Utilisateurs cibles du MVP

| Rôle | Peut faire |
|---|---|
| Client | s'inscrire, chercher, voir boutiques/services, commander, réserver, chatter |
| Vendeur | gérer sa boutique, ses produits, voir ses commandes |
| Prestataire | gérer son profil service, ses tarifs, ses réservations |
| Admin | voir les utilisateurs, modérer, stats simples |

## Comment démarrer

Voir `19_DEPLOYMENT.md` pour le lancement rapide via Docker, et `20_CLAUDE_CODE_GUIDE.md` pour naviguer dans le code.
