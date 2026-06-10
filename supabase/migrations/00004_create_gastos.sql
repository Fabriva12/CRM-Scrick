CREATE TABLE gastos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria TEXT NOT NULL DEFAULT 'Produccion' CHECK (categoria IN ('Ingredientes', 'Produccion', 'Servicios', 'Renta', 'Nomina', 'Marketing', 'Transporte', 'Oficina', 'Impuestos', 'Mantenimiento', 'Comisiones', 'Otros')),
  descripcion TEXT NOT NULL CHECK (char_length(descripcion) BETWEEN 1 AND 500),
  monto NUMERIC(10,2) NOT NULL CHECK (monto > 0),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  notas TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_gastos_fecha ON gastos (fecha DESC);
CREATE INDEX idx_gastos_categoria ON gastos (categoria);

CREATE TRIGGER set_gastos_updated_at
  BEFORE UPDATE ON gastos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
