CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL CHECK (char_length(nombre) BETWEEN 1 AND 256),
  sku TEXT DEFAULT NULL CHECK (sku IS NULL OR char_length(sku) <= 50),
  precio_venta NUMERIC(10,2) NOT NULL CHECK (precio_venta >= 0.01),
  costo NUMERIC(10,2) DEFAULT NULL CHECK (costo IS NULL OR costo >= 0),
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  unidad TEXT DEFAULT NULL CHECK (unidad IS NULL OR char_length(unidad) <= 50),
  paquete TEXT DEFAULT NULL CHECK (paquete IS NULL OR char_length(paquete) <= 100),
  descripcion TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_productos_nombre ON productos (nombre);
CREATE INDEX idx_productos_sku ON productos (sku);

CREATE TRIGGER set_productos_updated_at
  BEFORE UPDATE ON productos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
