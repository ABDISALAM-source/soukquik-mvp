-- ---------------------------------------------------------------
-- Disponibilités des prestataires (Phase 6)
-- ---------------------------------------------------------------

-- Horaires récurrents par jour de semaine (0=dimanche ... 6=samedi,
-- convention JS Date#getDay()). Un prestataire peut avoir plusieurs
-- plages le même jour (ex: 9h-12h et 14h-18h).
CREATE TABLE availability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);
CREATE INDEX idx_availability_rules_provider ON availability_rules(provider_id, weekday);

-- Exceptions ponctuelles à une date précise : soit une fermeture complète
-- (is_closed = true, ex: jour férié/congé), soit des horaires différents
-- des règles hebdo pour ce jour-là (is_closed = false + start/end_time).
-- Une exception remplace entièrement les règles hebdo pour sa date, elle
-- ne s'y ajoute pas.
CREATE TABLE availability_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_closed BOOLEAN NOT NULL DEFAULT true,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider_id, date),
  CHECK (is_closed = true OR (start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time))
);
CREATE INDEX idx_availability_exceptions_provider_date ON availability_exceptions(provider_id, date);
