# Module Boutiques (Shops)

## Fonctionnalités MVP
- Créer une boutique (un `vendor` peut avoir plusieurs boutiques)
- Modifier / supprimer sa boutique
- Lister les boutiques (public, avec filtre catégorie et recherche texte)
- Voir le détail d'une boutique (avec ses produits)
- Analytics simple : nombre de produits actifs, nombre de commandes, revenu total

## Endpoints
Voir `03_API_REFERENCE.md` section Shops.

## Règles métier
- Seul le `owner_id` (le vendeur créateur) peut modifier/supprimer sa boutique
- Une boutique désactivée (`is_active=false`) n'apparaît plus dans les résultats publics
- La suppression est un "soft delete" logique via `is_active=false` (pas de DELETE physique) pour préserver l'historique des commandes

## Analytics simple (MVP)
`GET /shops/:id/analytics` retourne :
```json
{
  "totalProducts": 12,
  "activeProducts": 10,
  "totalOrders": 34,
  "revenueTotal": 154000,
  "ordersToday": 3
}
```
Calculé à la volée via des requêtes SQL agrégées (`COUNT`, `SUM`). Le tracking "visiteurs en temps réel" et les heatmaps de la vision long-terme nécessitent une table `shop_visits` + événements — schéma prêt (voir `02_DATABASE_SCHEMA.md`), collecte non implémentée dans le MVP.
