# Panneau Admin (MVP)

Le MVP n'inclut pas d'interface web admin dédiée, mais expose les endpoints nécessaires (`/api/admin/*`) que l'on peut consommer via Postman, un futur mini frontend, ou directement dans l'app mobile pour un compte `role=admin`.

## Endpoints
- `GET /admin/users` — liste paginée des utilisateurs, filtrable par rôle
- `PATCH /admin/users/:id/status` — activer/suspendre un utilisateur
- `GET /admin/stats` — `{ totalUsers, totalShops, totalServices, totalOrders, totalBookings }`

## V2 (documenté)
- Interface web (React) dédiée à la modération de contenu (signalements, avis abusifs)
- Logs d'audit consultables (table `audit_logs`, à créer)
- Gestion des catégories (CRUD) depuis l'admin plutôt qu'en base directement
