-- Données de démo SoukQuik
-- Mot de passe pour tous les comptes de démo : "password123"
-- Hash bcrypt correspondant (10 rounds) :
-- $2a$10$WZpqHqPHizK54dcnWD9.luCPAQPDtxbxVsPMVumxFBGZMe/fRA9JW

INSERT INTO categories (id, name, type, icon) VALUES
  (gen_random_uuid(), 'Électronique', 'product', 'zap'),
  (gen_random_uuid(), 'Vêtements', 'product', 'shirt'),
  (gen_random_uuid(), 'Quincaillerie', 'product', 'hammer'),
  (gen_random_uuid(), 'Électricité', 'service', 'plug'),
  (gen_random_uuid(), 'Plomberie', 'service', 'wrench'),
  (gen_random_uuid(), 'Cours particuliers', 'service', 'book'),
  (gen_random_uuid(), 'Mécanique auto', 'service', 'car'),
  (gen_random_uuid(), 'Coiffure', 'both', 'scissors');

-- Utilisateurs de démo
INSERT INTO users (id, full_name, email, phone, password_hash, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Amina Client', 'amina@example.com', '+25377000001', '$2a$10$WZpqHqPHizK54dcnWD9.luCPAQPDtxbxVsPMVumxFBGZMe/fRA9JW', 'client'),
  ('22222222-2222-2222-2222-222222222222', 'Farah Vendeuse', 'farah@example.com', '+25377000002', '$2a$10$WZpqHqPHizK54dcnWD9.luCPAQPDtxbxVsPMVumxFBGZMe/fRA9JW', 'vendor'),
  ('33333333-3333-3333-3333-333333333333', 'Omar Électricien', 'omar@example.com', '+25377000003', '$2a$10$WZpqHqPHizK54dcnWD9.luCPAQPDtxbxVsPMVumxFBGZMe/fRA9JW', 'provider'),
  ('44444444-4444-4444-4444-444444444444', 'Admin SoukQuik', 'admin@soukquik.dj', '+25377000004', '$2a$10$WZpqHqPHizK54dcnWD9.luCPAQPDtxbxVsPMVumxFBGZMe/fRA9JW', 'admin');

-- Boutique de démo
INSERT INTO shops (id, owner_id, name, description, category_id, latitude, longitude, address)
SELECT '55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222',
  'Electro Farah', 'Vente de matériel électronique et accessoires', c.id, 11.5721, 43.1456, 'Djibouti Ville, quartier 1'
FROM categories c WHERE c.name = 'Électronique' LIMIT 1;

-- Produits de démo
INSERT INTO products (shop_id, name, description, category_id, price, stock, image_url)
SELECT '55555555-5555-5555-5555-555555555555', 'Chargeur USB-C rapide', 'Chargeur 20W compatible tous smartphones', c.id, 1500, 40, 'https://images.example.com/charger.jpg'
FROM categories c WHERE c.name = 'Électronique' LIMIT 1;

INSERT INTO products (shop_id, name, description, category_id, price, stock, image_url)
SELECT '55555555-5555-5555-5555-555555555555', 'Écouteurs Bluetooth', 'Autonomie 8h, résistants à l''eau', c.id, 8500, 15, 'https://images.example.com/earbuds.jpg'
FROM categories c WHERE c.name = 'Électronique' LIMIT 1;

-- Boutiques supplémentaires (Phase 4 — géoloc/nearby a besoin de plusieurs
-- points à des distances variées pour être testable/démontrable ; une
-- seule boutique ne permet pas de vérifier un tri par distance).
INSERT INTO shops (id, owner_id, name, description, category_id, latitude, longitude, address)
SELECT '55555555-5555-5555-5555-555555555556', '22222222-2222-2222-2222-222222222222',
  'Quincaillerie Djibouti', 'Outillage et matériaux de construction', c.id, 11.5810, 43.1500, 'Djibouti Ville, quartier 3'
FROM categories c WHERE c.name = 'Quincaillerie' LIMIT 1;

INSERT INTO shops (id, owner_id, name, description, category_id, latitude, longitude, address)
SELECT '55555555-5555-5555-5555-555555555557', '22222222-2222-2222-2222-222222222222',
  'Mode Balbala', 'Vêtements et accessoires pour toute la famille', c.id, 11.6400, 43.1800, 'Balbala, Djibouti'
FROM categories c WHERE c.name = 'Vêtements' LIMIT 1;

INSERT INTO products (shop_id, name, description, category_id, price, stock, image_url)
SELECT '55555555-5555-5555-5555-555555555556', 'Perceuse sans fil', 'Batterie 18V incluse', c.id, 12000, 8, 'https://images.example.com/drill.jpg'
FROM categories c WHERE c.name = 'Quincaillerie' LIMIT 1;

-- Service de démo
INSERT INTO services (id, provider_id, title, description, category_id, price, price_unit, latitude, longitude, service_area_km)
SELECT '66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333',
  'Électricien à domicile', 'Installation, dépannage et mise aux normes électriques', c.id, 3000, 'par intervention', 11.5850, 43.1480, 15
FROM categories c WHERE c.name = 'Électricité' LIMIT 1;

INSERT INTO services (id, provider_id, title, description, category_id, price, price_unit, latitude, longitude, service_area_km)
SELECT '66666666-6666-6666-6666-666666666667', '33333333-3333-3333-3333-333333333333',
  'Plombier rapide', 'Débouchage, fuites, installation sanitaire', c.id, 2500, 'par intervention', 11.6000, 43.1700, 20
FROM categories c WHERE c.name = 'Plomberie' LIMIT 1;

-- Commande de démo
INSERT INTO orders (client_id, shop_id, status, total_amount, delivery_address)
VALUES ('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'pending', 1500, 'Quartier 4, Djibouti Ville');

-- Réservation de démo
INSERT INTO bookings (client_id, service_id, status, scheduled_at, notes)
VALUES ('11111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', 'pending', now() + interval '2 days', 'Panne de courant dans la cuisine');
