-- ────────────────────────────────────────────
-- SCRICK CRM — Esquema completo + Auth setup
-- Pegar en SQL Editor de Supabase y ejecutar
-- ────────────────────────────────────────────

-- 1. Extensiones
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Trigger function (reusable)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Tabla: clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL CHECK (char_length(nombre) BETWEEN 1 AND 256),
  tipo TEXT NOT NULL CHECK (tipo IN ('B2B', 'B2C')),
  email TEXT NOT NULL,
  telefono TEXT DEFAULT NULL,
  ciudad TEXT DEFAULT NULL CHECK (ciudad IS NULL OR char_length(ciudad) <= 128),
  rfc TEXT DEFAULT NULL CHECK (rfc IS NULL OR char_length(rfc) <= 13),
  empresa TEXT DEFAULT NULL CHECK (empresa IS NULL OR char_length(empresa) <= 256),
  notas TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clientes_created_at ON clientes (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clientes_tipo ON clientes (tipo);

DROP TRIGGER IF EXISTS set_clientes_updated_at ON clientes;
CREATE TRIGGER set_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Tabla: productos
CREATE TABLE IF NOT EXISTS productos (
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

CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos (nombre);
CREATE INDEX IF NOT EXISTS idx_productos_sku ON productos (sku);

DROP TRIGGER IF EXISTS set_productos_updated_at ON productos;
CREATE TRIGGER set_productos_updated_at
  BEFORE UPDATE ON productos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Tabla: ventas
CREATE TABLE IF NOT EXISTS ventas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pagado', 'pendiente', 'cancelado')),
  monto_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  notas TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON ventas (cliente_id);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas (fecha DESC);
CREATE INDEX IF NOT EXISTS idx_ventas_estado ON ventas (estado);

DROP TRIGGER IF EXISTS set_ventas_updated_at ON ventas;
CREATE TRIGGER set_ventas_updated_at
  BEFORE UPDATE ON ventas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Tabla: venta_productos
CREATE TABLE IF NOT EXISTS venta_productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC(10,2) NOT NULL CHECK (precio_unitario >= 0),
  subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS idx_venta_productos_venta ON venta_productos (venta_id);
CREATE INDEX IF NOT EXISTS idx_venta_productos_producto ON venta_productos (producto_id);

-- 7. Tabla: gastos
CREATE TABLE IF NOT EXISTS gastos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria TEXT NOT NULL DEFAULT 'Produccion' CHECK (categoria IN ('Produccion')),
  descripcion TEXT NOT NULL CHECK (char_length(descripcion) BETWEEN 1 AND 500),
  monto NUMERIC(10,2) NOT NULL CHECK (monto > 0),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  notas TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos (fecha DESC);
CREATE INDEX IF NOT EXISTS idx_gastos_categoria ON gastos (categoria);

DROP TRIGGER IF EXISTS set_gastos_updated_at ON gastos;
CREATE TRIGGER set_gastos_updated_at
  BEFORE UPDATE ON gastos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. RLS: habilitar row-level security en todas las tablas
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE venta_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies: permitir todo a usuarios autenticados
CREATE POLICY "auth_all_clientes" ON clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_productos" ON productos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_ventas" ON ventas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_venta_productos" ON venta_productos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_gastos" ON gastos FOR ALL TO authenticated USING (true) WITH CHECK (true);
