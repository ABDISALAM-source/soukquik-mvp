-- ---------------------------------------------------------------
-- Phase 11 — Inscription pro : informations d'entreprise
-- ---------------------------------------------------------------
-- Champs collectés à l'inscription vendeur/prestataire pour valider le
-- dashboard. Les images (pièce d'identité, logo, photo) sont stockées en
-- data-URI (base64 redimensionné) dans des colonnes TEXT — pas d'infra de
-- stockage de fichiers dans cette version.

ALTER TABLE shops ADD COLUMN patente TEXT;            -- n° patente / registre de commerce
ALTER TABLE shops ADD COLUMN slogan TEXT;             -- slogan (optionnel)
ALTER TABLE shops ADD COLUMN id_document_url TEXT;    -- pièce d'identité du gérant (data-URI)

ALTER TABLE services ADD COLUMN patente TEXT;
ALTER TABLE services ADD COLUMN slogan TEXT;
ALTER TABLE services ADD COLUMN id_document_url TEXT;
ALTER TABLE services ADD COLUMN logo_url TEXT;        -- logo/photo du prestataire (les services n'en avaient pas)
