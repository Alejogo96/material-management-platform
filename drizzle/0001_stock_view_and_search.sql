-- Extensiones para la búsqueda tolerante a jerga y errores (pipe 3/4 ≈ tubo EMT 3/4).
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS unaccent;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS material_aliases_alias_trgm ON material_aliases USING gin (alias gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS materials_name_trgm ON materials USING gin (name gin_trgm_ops);--> statement-breakpoint
-- Stock por ubicación: se calcula sumando movimientos (nunca se edita a mano).
CREATE OR REPLACE VIEW stock_by_location AS
SELECT material_id, location_id, SUM(qty) AS qty
FROM (
  SELECT material_id, to_location_id AS location_id, qty FROM movements WHERE to_location_id IS NOT NULL
  UNION ALL
  SELECT material_id, from_location_id AS location_id, -qty FROM movements WHERE from_location_id IS NOT NULL
) m
GROUP BY material_id, location_id;
