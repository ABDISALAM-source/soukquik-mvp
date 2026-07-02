# Système de recherche

## MVP (implémenté)

Recherche unifiée sur `GET /api/search` :

Paramètres :
- `q` : texte libre (cherche dans `name`/`title` et `description`)
- `type` : `product` | `service` | `shop` | `all` (défaut)
- `category` : id de catégorie
- `sort` : `price_asc` | `price_desc` | `recent`

Implémentation : requêtes PostgreSQL avec `ILIKE '%q%'` sur les colonnes texte, combinées avec `UNION ALL` entre produits/services/boutiques, puis tri et pagination (`LIMIT`/`OFFSET`).

C'est volontairement simple mais fonctionnel pour un catalogue de quelques milliers d'entrées, ce qui couvre largement les besoins d'un MVP local.

## Évolution V2 (documentée, non implémentée)

Quand le volume de données grandira, brancher **Meilisearch** :
1. Indexer `products`, `services`, `shops` dans des index Meilisearch séparés à chaque écriture (hook dans les repositories)
2. Remplacer l'implémentation de `search.service.ts` par des appels à l'API Meilisearch (`/indexes/:index/search`)
3. Ajouter recherche floue (typo-tolerance, déjà native à Meilisearch), suggestions auto-complete, et facettes

Recherche par image (IA) : prévue comme une étape à part — upload d'image → génération d'embedding → recherche par similarité vectorielle (pgvector ou service dédié). Non implémentée dans le MVP.
