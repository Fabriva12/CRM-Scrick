ALTER TABLE produccion_historial
ADD COLUMN lote TEXT;

UPDATE produccion_historial
SET lote = TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYYMMDD')
WHERE lote IS NULL;

ALTER TABLE produccion_historial
ALTER COLUMN lote SET NOT NULL;

CREATE INDEX idx_produccion_historial_lote ON produccion_historial (lote);
