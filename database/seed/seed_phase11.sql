-- Seed Phase 11 : catalogue complet des types de boutique et de service,
-- pour le choix à l'inscription. Idempotent (NOT EXISTS par nom+type).

-- Types de BOUTIQUE (type 'product') : ce que vend un magasin.
INSERT INTO categories (name, type, icon)
SELECT v.name, 'product', v.icon FROM (VALUES
  ('Magasin général', 'storefront'),
  ('Électronique', 'phone-portrait'),
  ('Électroménager', 'tv'),
  ('Quincaillerie', 'construct'),
  ('Mobilier', 'bed'),
  ('Mode & Vêtements', 'shirt'),
  ('Chaussures', 'footsteps'),
  ('Alimentation', 'fast-food'),
  ('Beauté & Cosmétiques', 'flower'),
  ('Pharmacie', 'medkit'),
  ('Téléphonie', 'phone-portrait'),
  ('Librairie & Papeterie', 'book'),
  ('Sport', 'football'),
  ('Bijouterie', 'diamond'),
  ('Jouets & Enfants', 'happy')
) AS v(name, icon)
WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.name = v.name AND c.type = 'product' AND c.parent_id IS NULL);

-- Types de SERVICE (type 'service') : le métier du prestataire.
INSERT INTO categories (name, type, icon)
SELECT v.name, 'service', v.icon FROM (VALUES
  ('Électricien', 'flash'),
  ('Plombier', 'water'),
  ('Menuisier', 'hammer'),
  ('Maçon', 'business'),
  ('Peintre', 'color-palette'),
  ('Mécanicien auto', 'car-sport'),
  ('Coiffeur / Barbier', 'cut'),
  ('Couturier', 'shirt'),
  ('Cours particuliers', 'school'),
  ('Traiteur / Cuisine', 'restaurant'),
  ('Ménage & Nettoyage', 'sparkles'),
  ('Jardinier', 'leaf'),
  ('Photographe', 'camera'),
  ('Déménagement', 'cube'),
  ('Climatisation / Froid', 'snow'),
  ('Soudeur', 'flame')
) AS v(name, icon)
WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.name = v.name AND c.type = 'service' AND c.parent_id IS NULL);
