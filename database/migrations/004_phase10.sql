-- ---------------------------------------------------------------
-- Phase 10 — Fidélité au prompt initial
-- ---------------------------------------------------------------

-- Vues produit (time-series) : permet de compter les articles "les plus vus"
-- sur une fenêtre glissante (24 h / 7 j / 30 j) au lieu d'un simple compteur.
-- viewer_id nullable : une vue peut être anonyme (client non connecté).
CREATE TABLE product_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_product_views_product ON product_views(product_id, created_at DESC);

-- Visites de boutique (time-series) : alimente les stats du dashboard vendeur
-- (visites du jour / 7 derniers jours) et le classement "les plus visités".
CREATE TABLE shop_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  visitor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_shop_visits_shop ON shop_visits(shop_id, created_at DESC);

-- Visites de fiche service : équivalent côté prestataire.
CREATE TABLE service_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  visitor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_service_visits_service ON service_visits(service_id, created_at DESC);

-- Sous-catégories : une catégorie peut avoir un parent (Mode -> Chemise).
-- parent_id NULL = catégorie racine.
ALTER TABLE categories ADD COLUMN parent_id UUID REFERENCES categories(id) ON DELETE CASCADE;
CREATE INDEX idx_categories_parent ON categories(parent_id);

-- Tags de recherche additionnels (couleur, taille, matière...) pour enrichir
-- la recherche texte et servir de repli à la recherche image.
ALTER TABLE products ADD COLUMN tags TEXT[] NOT NULL DEFAULT '{}';

-- Empreinte perceptuelle (dHash 64 bits, stockée en hex) de l'image produit,
-- pour la recherche par photo sans API externe : on compare par distance de
-- Hamming à l'empreinte de l'image requête.
ALTER TABLE products ADD COLUMN image_hash TEXT;
CREATE INDEX idx_products_image_hash ON products(image_hash) WHERE image_hash IS NOT NULL;

-- Notes détaillées (Phase 10) : en plus de l'étoile globale déjà dans reviews,
-- trois axes optionnels 1-5 pour comparer finement deux boutiques.
ALTER TABLE reviews ADD COLUMN rating_quality SMALLINT CHECK (rating_quality BETWEEN 1 AND 5);
ALTER TABLE reviews ADD COLUMN rating_value SMALLINT CHECK (rating_value BETWEEN 1 AND 5);
ALTER TABLE reviews ADD COLUMN rating_punctuality SMALLINT CHECK (rating_punctuality BETWEEN 1 AND 5);
