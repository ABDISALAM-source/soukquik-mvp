# Phase 10 — Fidélité au prompt initial (spec v3)

Les 9 phases du roadmap V2 sont livrées et déployées. Cette phase comble les
écarts entre le **prompt produit initial** (repris et enrichi dans la spec v3)
et le code réel, identifiés lors de l'audit. Objectif : que l'app corresponde
réellement à la vision décrite, pas juste au roadmap technique exécuté.

Chaque lot suit le même protocole que les phases précédentes :
`tsc` propre (backend + mobile) → tests backend au vert → migration appliquée
en prod si besoin → smoke-test → doc à jour → commit dédié → déploiement.

---

## Lot A — Popularité réelle (vues, ventes, classements)

**Problème** : la rangée « En ce moment » n'est pas triée par popularité, la
page boutique n'affiche pas le nombre de ventes ni les articles les plus
vus/vendus, et aucun compteur de vues produit n'existe.

**Backend**
- Migration `004` : table `product_views(id, product_id, viewer_id?, created_at)`
  et `shop_visits(id, shop_id, visitor_id?, created_at)` (time-series, pour
  pouvoir compter sur 24 h / 7 j / 30 j).
- Enregistrement d'une vue à l'ouverture de la fiche produit / page boutique
  (dédup léger : une vue par utilisateur et par fenêtre courte, pour ne pas
  gonfler artificiellement).
- Agrégation des ventes depuis `order_items` (quantité vendue par produit, par
  boutique), hors commandes annulées.
- Endpoints :
  - `GET /shops/:id/products?sort=popular` → tri par (ventes + vues) récentes.
  - `GET /shops/trending` et `GET /services/trending` → classement global par
    popularité récente (ventes + présence + vues), pour la rangée d'accueil.
  - `GET /shops/:id` enrichi : `salesCount`, `viewsCount`.
  - Analytics vendeur enrichi : `visitsToday`, `visits7d`, série pour le graphe.

**Mobile**
- `ProductDetailScreen` / `ShopScreen` : déclenchent l'enregistrement de vue.
- `HomeScreen` : rangée « En ce moment » réellement classée par popularité.
- `ShopScreen` : en-tête avec **nombre de ventes** + rangée horizontale
  « Les plus vus / vendus de cette boutique » en tête de page.
- `VendorDashboardScreen` : cartes visites (jour / 7 j) + mini-graphe de tendance.
- `ProviderDashboardScreen` : vues de la fiche service.

---

## Lot B — Ajout d'article intelligent (marque, sous-catégories, prix suggéré)

**Problème** : le formulaire produit est plat — pas de marque (alors que la
table `brands` existe), pas de sous-catégories (« chapeau vs basket »
impossible), pas d'aide au prix.

**Backend**
- Migration `004` (même fichier) : `categories.parent_id` (sous-catégories) ;
  `products.tags TEXT[]` (couleur/taille/matière pour enrichir la recherche).
- Seed : sous-catégories réalistes (Mode → Chemise, Pantalon, Chaussures… ;
  Électronique → Téléphones, Accessoires…) + quelques marques.
- Endpoints :
  - `GET /categories?parentId=` → sous-catégories d'une catégorie.
  - `GET /brands?q=` → autocomplétion marque (insensible à la casse, dédup
    « Nike / nike / NIKE »).
  - `POST /brands` → crée une marque si elle n'existe pas (au fil de l'ajout).
  - `GET /products/price-hint?categoryId=` → fourchette de prix observée
    (min / médiane / max) pour aider le vendeur à se situer.

**Mobile**
- `ProductFormScreen` refondu en **flux guidé en cascade** : catégorie →
  sous-catégorie suggérée → marque (autocomplétion + création à la volée) →
  prix (avec indice de fourchette moyenne affiché) → stock → tags → photos.

---

## Lot C — Comparaison multi-boutiques + recherche par photo

**Problème** : deux fonctionnalités phares du prompt totalement absentes.

### C1 — Comparaison multi-boutiques par article précis
Distincte du « boutiques proches » (Phase 4). Le client cherche un article →
l'app liste **toutes les boutiques qui ont un produit correspondant**, chacune
avec son prix (différent d'une boutique à l'autre), sa distance, un lien direct
vers la fiche.
- Backend : `GET /products/compare?q=&lat=&lng=&sort=price|distance` →
  produits correspondants groupés/triables par prix ou distance, avec
  `shopName`, `shopDistanceKm`, `price`.
- Mobile : `CompareScreen` avec bascule **Liste / Carte**, tri prix ↔ proximité,
  bouton « Se faire livrer » qui mène au tunnel de commande de la boutique.

### C2 — Recherche par photo (sans API payante)
Contrainte du roadmap : **stop avant toute intégration payante**. Solution
créative respectant ça : **empreinte perceptuelle (dHash) 100 % locale**, aucun
service externe, aucune clé.
- À l'enregistrement d'un produit avec image : le backend calcule un hash
  perceptuel (dHash 64 bits) de l'image et le stocke (`products.image_hash`).
- Recherche photo : le client prend/importe une image → le backend calcule son
  hash → classe les produits par **distance de Hamming** (similarité visuelle) →
  renvoie les meilleurs matchs + « articles similaires ».
- Dégradation propre : si aucune image exploitable / hash proche, repli sur la
  recherche texte. Limite documentée : le dHash reconnaît des visuels proches
  (même photo, recadrages, teintes proches), pas la sémantique fine d'un vrai
  modèle d'embedding — c'est le compromis assumé du « sans API ». Le point de
  bascule vers un vrai modèle de vision (payant) est isolé et documenté.

---

## Lot D — Répertoires, design & animations, extras

**Répertoires distincts** (accueil) : sections **Magasins** et **Services**
comme deux vrais annuaires navigables par catégorie, distincts de la rangée de
popularité « En ce moment » (aujourd'hui c'est une grille de catégories mixte).
- `BrowseScreen` paramétrable (`kind: 'shops' | 'services'`), accessible depuis
  l'accueil (« Voir tout »).

**Design & animations** (élément signature + polish) :
- Vérifier/ajuster l'anneau de vague = présence boutique ÷ utilisateurs actifs
  app (conforme à la vision — clarification section 7 de la spec).
- Micro-interaction « cœur qui pulse » au like, transitions fluides accueil →
  boutique, fades/slides d'apparition cohérents.
- Cohérence stricte palette/typo entre client et dashboards.

**Extras section 9 retenus** (haut rapport valeur/effort) :
- Choix explicite **Retrait / Livraison** au moment de la commande (le tunnel
  existant ne le formalise pas).
- **Notes détaillées** (qualité, rapport qualité-prix, ponctualité) en plus de
  l'étoile globale, plus utile pour comparer deux boutiques.
- **Alerte retour en stock / baisse de prix** sur un produit favori
  (notification via le système existant).

**Reportés (assumés, hors périmètre raisonnable de cette phase)** — nécessitent
une infra ou un produit à part entière, documentés comme évolutions futures :
programme de fidélité, itinéraire multi-boutiques optimisé (« liste de
courses »), recherche vocale, partage social profond, stats comparatives
anonymisées inter-quartiers. Notés ici pour ne pas les perdre.

---

## Ordre d'exécution
A → B → C → D, chacun committé et déployé avant le suivant. Un lot ne démarre
qu'une fois le précédent vert (tsc + tests + smoke). La doc `03_API_REFERENCE`
et `19_DEPLOYMENT` sont mises à jour au fil de l'eau.
