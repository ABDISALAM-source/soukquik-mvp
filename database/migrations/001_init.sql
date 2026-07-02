-- SoukQuik MVP — schema initial
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client','vendor','provider','admin')),
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('product','service','both')),
  icon TEXT
);

CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  address TEXT,
  opening_hours JSONB,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id),
  price NUMERIC(12,2) NOT NULL,
  price_unit TEXT DEFAULT 'forfait',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  service_area_km NUMERIC(6,2) DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id),
  price NUMERIC(12,2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES users(id),
  shop_id UUID NOT NULL REFERENCES shops(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','preparing','delivered','cancelled')),
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  delivery_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL
);

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES users(id),
  service_id UUID NOT NULL REFERENCES services(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','completed','cancelled')),
  scheduled_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES users(id),
  target_type TEXT NOT NULL CHECK (target_type IN ('shop','service')),
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_shops_category ON shops(category_id);
CREATE INDEX idx_services_category ON services(category_id);
CREATE INDEX idx_products_shop ON products(shop_id);
CREATE INDEX idx_orders_client ON orders(client_id);
CREATE INDEX idx_orders_shop ON orders(shop_id);
CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_bookings_service ON bookings(service_id);
CREATE INDEX idx_products_name_trgm ON products USING gin (name gin_trgm_ops);

-- =========================================================
-- TODO V2 (schema prêt, non activé par défaut dans le MVP) :
-- CREATE TABLE payments (...);
-- CREATE TABLE wallets (...);
-- CREATE TABLE transactions (...);
-- CREATE TABLE reviews (...);
-- CREATE TABLE promotions (...);
-- CREATE TABLE service_schedules (...);
-- CREATE TABLE shop_visits (...);
-- CREATE TABLE analytics_events (...);
-- CREATE TABLE delivery_tracking (...);
-- Voir docs/02_DATABASE_SCHEMA.md pour le détail de chacune.
-- =========================================================
