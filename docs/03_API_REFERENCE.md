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
| GET | /shops/nearby?lat=&lng=&radiusKm=&limit= | public — triées par distance croissante, `radiusKm` défaut 10 (max 200), `limit` défaut 20 (max 50). Chaque résultat porte `distanceKm`. |
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
| GET | /services/nearby?lat=&lng=&radiusKm=&limit= | public — triés par distance croissante, plafonnée en plus par la zone d'intervention du prestataire (`LEAST(radiusKm, serviceAreaKm)`). Chaque résultat porte `distanceKm`. |
| GET | /services/analytics/mine | provider — agrégé sur tous ses services : `{totalServices, activeServices, totalBookings, pendingBookings, revenueToday, revenueTotal}` |
| GET | /services/:id | public |
| POST | /services | provider |
| PATCH | /services/:id | provider (owner) |
| DELETE | /services/:id | provider (owner) |

## Search
| Méthode | Route | Rôle |
|---|---|---|
| GET | /search?q=&type=&category=&sort= | public |

Depuis la Phase 4, les résultats portent leurs coordonnées pour permettre au client de calculer une distance réelle (le endpoint ne connaît pas la position de l'utilisateur, donc ne calcule pas lui-même de distance ici — contrairement à `/shops/nearby` et `/services/nearby`) : `products[].shopLatitude`/`shopLongitude` (jointure vers la boutique), `services[].latitude`/`longitude`, `shops[].latitude`/`longitude`.

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
| POST | /bookings | client — si `scheduledAt` est fourni, rejeté en 400 si le créneau n'est pas disponible (voir Availability) |
| GET | /bookings/me | client |
| GET | /services/:serviceId/bookings | provider (owner) |
| PATCH | /bookings/:id/status | provider (owner) |

## Availability (Phase 6 — disponibilités des prestataires)
Modèle : horaires hebdomadaires récurrents (`availability_rules`, un ou plusieurs créneaux par jour de semaine) + exceptions ponctuelles (`availability_exceptions`, remplacent entièrement les règles hebdo pour leur date — fermeture complète ou horaire différent). Si un prestataire n'a **aucune** règle configurée, il est considéré sans contrainte d'horaire (comportement rétrocompatible avec les réservations d'avant cette fonctionnalité).

| Méthode | Route | Rôle |
|---|---|---|
| GET | /availability/mine | provider — `{rules, exceptions}` |
| POST | /availability/rules | provider — body `{weekday(0-6, 0=dimanche), startTime, endTime}` (format `HH:MM`) |
| DELETE | /availability/rules/:id | provider (owner) |
| POST | /availability/exceptions | provider — body `{date(YYYY-MM-DD), isClosed, startTime?, endTime?}` ; upsert (une seule exception par date, la recréer la remplace) |
| DELETE | /availability/exceptions/:id | provider (owner) |
| GET | /services/:id/availability?date=YYYY-MM-DD | public — résout la disponibilité du prestataire de ce service pour cette date : `{date, closed, windows:[{startTime,endTime}], hasAnyRule}` |

Limite connue : le modèle ne gère pas les fuseaux horaires — les horaires sont traités comme des heures d'horloge "nominales" (UTC par convention interne), cohérent avec le reste de l'app qui ne gère aucun fuseau horaire ailleurs non plus.

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

## Likes (Phase 1/7 — togglable, un like par user/cible)
| Méthode | Route | Rôle |
|---|---|---|
| POST | /likes/toggle | authentifié — body `{targetType, targetId}`, renvoie `{liked, count}` |
| GET | /likes/count?targetType=&targetId= | public |
| GET | /likes/mine?targetType=&targetId= | authentifié |
| GET | /likes/mine-list?targetType= | authentifié — tous les likes de l'utilisateur (targetType optionnel), utilisé par l'écran Favoris |

## Reviews (Phase 1/3 — avis boutique/service/produit)
| Méthode | Route | Rôle |
|---|---|---|
| POST | /reviews | authentifié — body `{targetType, targetId, rating(1-5), comment?}`, un seul avis par user/cible (409 sinon) |
| GET | /reviews?targetType=&targetId= | public — renvoie `{reviews, summary:{count,average}}` |
| DELETE | /reviews/:id | authentifié (auteur) |

## Notifications (Phase 1/7)
| Méthode | Route | Rôle |
|---|---|---|
| GET | /notifications | authentifié — 50 dernières, plus récentes en premier |
| GET | /notifications/unread-count | authentifié |
| PATCH | /notifications/:id/read | authentifié (propriétaire) |
| PATCH | /notifications/read-all | authentifié |

Déclenchées en interne par d'autres modules (pas d'endpoint de création publique) — ex: changement de statut d'une commande notifie le client (`orders.service.ts`).

## Promotions (Phase 1/9 — publicité sponsorisée)
| Méthode | Route | Rôle |
|---|---|---|
| POST | /promotions | vendor/provider — body `{targetType, targetId, budget, startsAt?, endsAt?}`, statut initial `pending`. Le serveur vérifie que `targetId` appartient bien à l'appelant (403 sinon) |
| GET | /promotions/mine | vendor/provider (propriétaire) |
| GET | /promotions/active?limit= | public — actives uniquement, rotation pondérée par budget restant |
| GET | /promotions | admin — toutes, pour validation, avec `ownerName` (nom du vendeur/prestataire) |
| PATCH | /promotions/:id/status | admin — `pending`/`active`/`expired` |
| POST | /promotions/:id/impression | public — incrémente le compteur |
| POST | /promotions/:id/click | public — incrémente le compteur |

Chaque promotion renvoyée (sur toutes les routes `GET`) est enrichie de `targetName`/`targetImage` (repris du nom/logo/visuel de la boutique, du service ou du produit ciblé — les promotions n'ont pas de copie publicitaire propre) et de `targetShopId` (uniquement pour `targetType: 'product'`, utile pour naviguer vers la fiche produit qui exige un `shopId`).

## Presence (Phase 1/8 — présence boutique, sous-ressource de Shops)
| Méthode | Route | Rôle |
|---|---|---|
| GET | /shops/:shopId/presence | public — `{count, appWideCount, intensity}` (intensité = ratio présence boutique / utilisateurs actifs, données réelles actuelles ; le flux temps réel complet via WebSocket est la Phase 8) |
| POST | /shops/:shopId/presence/enter | authentifié |
| POST | /shops/:shopId/presence/leave | authentifié |

## Codes d'erreur HTTP
- 400 : validation invalide
- 401 : non authentifié / token invalide
- 403 : rôle insuffisant
- 404 : ressource introuvable
- 409 : conflit (ex: email déjà utilisé)
- 500 : erreur serveur
