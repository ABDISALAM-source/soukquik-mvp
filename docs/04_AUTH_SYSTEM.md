# Système d'authentification

## Principe

- JWT **access token** (courte durée, 15 min) + **refresh token** (longue durée, 7 jours)
- Mots de passe hashés avec `bcrypt` (10 rounds)
- Le refresh token est stocké côté client (SecureStore Expo) ; en MVP il n'est pas révoqué en base (amélioration future : table `refresh_tokens` avec révocation)

## Flux register

1. `POST /auth/register` avec `{ full_name, email, phone, password, role }`
2. Validation zod (email valide, password ≥ 6 caractères, role ∈ [client, vendor, provider])
3. Vérifie l'unicité email/téléphone
4. Hash du mot de passe, insertion en base
5. Retourne `{ user, accessToken, refreshToken }`

## Flux login

1. `POST /auth/login` avec `{ email, password }`
2. Vérifie l'utilisateur + compare le hash
3. Retourne `{ user, accessToken, refreshToken }`

## Flux refresh

1. `POST /auth/refresh` avec `{ refreshToken }`
2. Vérifie la signature et l'expiration
3. Retourne un nouvel `accessToken`

## Middleware `auth.guard`

- Lit le header `Authorization: Bearer <token>`
- Vérifie et décode le JWT
- Attache `req.user = { id, role }`
- Renvoie 401 si absent/invalide

## Middleware `requireRole(['vendor'])`

- À utiliser après `auth.guard`
- Renvoie 403 si `req.user.role` n'est pas dans la liste autorisée

## Variables d'environnement liées

```
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
```
