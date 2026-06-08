CREATE TABLE produccion_historial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  receta_id TEXT NOT NULL,
  receta_nombre TEXT NOT NULL,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_produccion_historial_producto ON produccion_historial (producto_id);
CREATE INDEX idx_produccion_historial_created ON produccion_historial (created_at DESC);
