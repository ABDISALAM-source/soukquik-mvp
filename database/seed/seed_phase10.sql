-- Seed Phase 10 : sous-catégories + marques. Idempotent (ON CONFLICT / NOT EXISTS).

-- Sous-catégories rattachées aux catégories racines existantes (par nom).
-- Mode (type both/product selon seed) — on cible les catégories produit.
INSERT INTO categories (name, type, parent_id)
SELECT sub.name, 'product', c.id
FROM categories c
JOIN (VALUES
  ('Électronique', 'Téléphones'),
  ('Électronique', 'Accessoires'),
  ('Électronique', 'Audio'),
  ('Vêtements', 'Chemises'),
  ('Vêtements', 'Pantalons'),
  ('Vêtements', 'Chaussures'),
  ('Vêtements', 'Chapeaux'),
  ('Quincaillerie', 'Outillage'),
  ('Quincaillerie', 'Plomberie'),
  ('Quincaillerie', 'Électricité')
) AS sub(parent_name, name) ON sub.parent_name = c.name
WHERE c.parent_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM categories x WHERE x.name = sub.name AND x.parent_id = c.id
  );

-- Marques courantes (dédup par name UNIQUE).
INSERT INTO brands (name) VALUES
  ('Samsung'), ('Apple'), ('Xiaomi'), ('Nike'), ('Adidas'),
  ('Zara'), ('Bosch'), ('Stanley'), ('Sony'), ('HP')
ON CONFLICT (name) DO NOTHING;
