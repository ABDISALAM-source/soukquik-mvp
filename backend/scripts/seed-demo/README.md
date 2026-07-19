# Seed de démonstration (via API HTTPS)

Scripts qui peuplent une instance SoukQuik **par l'API** (et non en SQL direct),
ce qui déclenche aussi le calcul des empreintes d'image (dHash) côté serveur —
la recherche par photo indexe donc automatiquement les produits créés.

Les images sont de vraies photos par mot-clé, stables (loremflickr `?lock=N`).

## Utilisation

```bash
# Cible l'API (défaut = prod). Node 18+ requis (fetch global).
SEED_API=https://api-soukquik.katatia.com/api node backend/scripts/seed-demo/seed_demo.mjs
SEED_API=https://api-soukquik.katatia.com/api node backend/scripts/seed-demo/seed_more.mjs
```

- `seed_demo.mjs` — 10 boutiques + ~70 produits (photos + descriptions) + 12 services.
- `seed_more.mjs` — produits additionnels par boutique, avis/notes (10 comptes
  clients), et promotions créées par les vendeurs **puis validées par l'admin**
  (donc actives dans le bandeau sponsorisé).

Les deux scripts sont **idempotents** : ré-exécutables sans doublons
(login si le compte existe, produits dédupliqués par nom, avis protégés par la
contrainte « 1 avis / auteur / cible », promotions non recréées).

## Comptes créés (mot de passe `Demo1234!`)

- Vendeurs : `techno@soukquik.demo`, `chaussures@…`, `mode@…`, `maison@…`,
  `beaute@…`, `epicerie@…`, `quincaillerie@…`, `sport@…`, `bijoux@…`, `pharmacie@…`
- Prestataires : `electricien@…`, `plombier@…`, `menuisier@…`, etc.
- Clients : `client1@soukquik.demo` … `client10@soukquik.demo`

> Comptes/données de **démonstration** — à purger avant une vraie mise en production.
