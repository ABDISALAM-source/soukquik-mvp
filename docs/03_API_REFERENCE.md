# Référence API

Base URL locale : `http://localhost:4000/api`

Toutes les réponses suivent le format :
```json
{ "success": true, "data": { }, "error": null }
```

## Auth
| Méthode | Route | Rôle | Description |
|---|---|---|---|
| POST | /auth/register | public | créer un compte (client/vendor/provider) |
| POST | /auth/login | public | connexion, renvoie access+refresh token |
| POST | /auth/refresh | public | renouvelle l'access token |
| GET  | /auth/me | authentifié | profil courant |

## Users
| Méthode | Route | Rôle |
|---|---|---|
| GET | /users/:id | authentifié |
| PATCH | /users/me | authentifié |

## Categories
| Méthode | Route | Rôle |
|---|---|---|
| GET | /categories | public |

## Shops
| Méthode | Route | Rôle |
|---|---|---|
| GET | /shops | public (liste + filtres) |
| GET | /shops/:id | public |
| POST | /shops | vendor |
| PATCH | /shops/:id | vendor (owner) |
| DELETE | /shops/:id | vendor (owner) |
| GET | /shops/:id/analytics | vendor (owner) |

## Products
| Méthode | Route | Rôle |
|---|---|---|
| GET | /shops/:shopId/products | public |
| POST | /shops/:shopId/products | vendor (owner) |
| PATCH | /products/:id | vendor (owner) |
| DELETE | /products/:id | vendor (owner) |

## Services (prestataires)
| Méthode | Route | Rôle |
|---|---|---|
| GET | /services | public (liste + filtres) |
| GET | /services/:id | public |
| POST | /services | provider |
| PATCH | /services/:id | provider (owner) |
| DELETE | /services/:id | provider (owner) |

## Search
| Méthode | Route | Rôle |
|---|---|---|
| GET | /search?q=&type=&category=&sort= | public |

## Orders
| Méthode | Route | Rôle |
|---|---|---|
| POST | /orders | client |
| GET | /orders/me | client |
| GET | /shops/:shopId/orders | vendor (owner) |
| PATCH | /orders/:id/status | vendor (owner) |

## Bookings
| Méthode | Route | Rôle |
|---|---|---|
| POST | /bookings | client |
| GET | /bookings/me | client |
| GET | /services/:serviceId/bookings | provider (owner) |
| PATCH | /bookings/:id/status | provider (owner) |

## Chat
| Méthode | Route | Rôle |
|---|---|---|
| GET | /chats/me | authentifié |
| POST | /chats/:id/messages | authentifié |
| GET | /chats/:id/messages | authentifié |

## Admin
| Méthode | Route | Rôle |
|---|---|---|
| GET | /admin/users | admin |
| GET | /admin/stats | admin |
| PATCH | /admin/users/:id/status | admin |

## Codes d'erreur HTTP
- 400 : validation invalide
- 401 : non authentifié / token invalide
- 403 : rôle insuffisant
- 404 : ressource introuvable
- 409 : conflit (ex: email déjà utilisé)
- 500 : erreur serveur
