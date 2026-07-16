-- ---------------------------------------------------------------
-- Phase 10 (dashboard vendeur) — état ouvert/fermé de la boutique
-- ---------------------------------------------------------------
-- Distinct de is_active (suppression logique) : is_open = le vendeur
-- accepte-t-il des commandes en ce moment (bascule rapide depuis le
-- dashboard). Une boutique fermée reste visible mais signalée fermée.
ALTER TABLE shops ADD COLUMN is_open BOOLEAN NOT NULL DEFAULT true;
