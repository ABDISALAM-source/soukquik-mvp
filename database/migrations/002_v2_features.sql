-- SoukQuik V2 — extensions du modèle de données (Phase 1)
-- Ne modifie jamais 001_init.sql une fois appliqué : toute évolution du
-- schéma passe par une nouvelle migration numérotée, celle-ci ou la suivante.

-- ---------------------------------------------------------------
-- Marques (suggestion à l'ajout d'un article, Phase 5)
-- ---------------------------------------------------------------
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT
);

ALTER TABLE products ADD COLUMN brand_id UUID REFERENCES brands(id);
CREATE INDEX idx_products_brand ON products(brand_id);

-- Pas de product_variants (taille/couleur) : non demandé explicitement et
-- products reste volontairement simple pour l'instant ; brand_id suffit à
-- la Phase 5. À réévaluer si un besoin concret de variantes apparaît.

-- ---------------------------------------------------------------
-- Plusieurs photos par article (Phase 5 : réordonnables, une "principale")
-- ---------------------------------------------------------------
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_product_images_product ON product_images(product_id, position);

-- ---------------------------------------------------------------
-- Likes togglables (remplace un simple compteur) — un like par user/cible
-- ---------------------------------------------------------------
CREATE TABLE likes (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('shop','service','product')),
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, target_type, target_id)
);

CREATE INDEX idx_likes_target ON likes(target_type, target_id);

-- ---------------------------------------------------------------
-- Présence en boutique (Phase 8 : session ouverte = présence active)
-- ---------------------------------------------------------------
CREATE TABLE shop_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ
);

CREATE INDEX idx_shop_presence_shop ON shop_presence(shop_id);
-- Sessions actives = left_at IS NULL ; index partiel pour un comptage rapide
-- ("qui est actuellement dans la boutique") sans scanner l'historique.
CREATE INDEX idx_shop_presence_active ON shop_presence(shop_id) WHERE left_at IS NULL;

-- ---------------------------------------------------------------
-- Avis (Phase 3 : boutique/service/produit, après commande livrée)
-- ---------------------------------------------------------------
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('shop','service','product')),
  target_id UUID NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviews_target ON reviews(target_type, target_id);
CREATE INDEX idx_reviews_author ON reviews(author_id);

-- ---------------------------------------------------------------
-- Notifications in-app (Phase 7)
-- ---------------------------------------------------------------
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
-- Compteur "non lues" rapide, sans scanner tout l'historique.
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE read_at IS NULL;

-- ---------------------------------------------------------------
-- Publicité sponsorisée (Phase 9)
-- ---------------------------------------------------------------
CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('shop','service','product')),
  target_id UUID NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  budget NUMERIC(12,2) NOT NULL CHECK (budget > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','expired')),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_promotions_status ON promotions(status);
CREATE INDEX idx_promotions_owner ON promotions(owner_id);
-- Rotation pondérée par budget des promotions actives (Phase 2/9) : c'est
-- la requête la plus fréquente sur cette table, donc l'index cible pile ça.
CREATE INDEX idx_promotions_active ON promotions(status, target_type) WHERE status = 'active';

-- ---------------------------------------------------------------
-- Index géospatiaux (proximité) — déjà utilisés pour le tri, jamais indexés
-- ---------------------------------------------------------------
CREATE INDEX idx_shops_geo ON shops(latitude, longitude);
CREATE INDEX idx_services_geo ON services(latitude, longitude);
