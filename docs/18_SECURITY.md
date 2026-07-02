# Sécurité

## Implémenté dans le MVP
- Mots de passe hashés avec bcrypt
- JWT signés (access + refresh), secrets via variables d'environnement
- Validation stricte des entrées avec `zod` sur chaque endpoint d'écriture
- RBAC (`auth.guard` + `role.guard`) sur toutes les routes sensibles
- Vérification systématique de propriété (`owner_id`) avant modification/suppression
- CORS configuré (whitelist d'origines via env)
- Helmet (headers HTTP sécurisés) activé sur l'app Express
- Paramétrage SQL via requêtes préparées (`pg` avec placeholders `$1, $2...`) — pas de concaténation de chaînes, protection anti-injection SQL

## Documenté pour V2 (non implémenté)
- Rate limiting par IP/utilisateur (ex: `express-rate-limit` + Redis)
- Détection d'abus (comptes créés en masse, spam de messages)
- Journalisation d'audit (`audit_logs`) des actions sensibles admin
- Rotation et révocation des refresh tokens (table dédiée + blacklist)
- 2FA pour les comptes admin
