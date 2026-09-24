  CREATE TABLE venta_envios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE UNIQUE,
    paga_cliente NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (paga_cliente >= 0),
    cubrimos NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (cubrimos >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE INDEX idx_venta_envios_venta ON venta_envios (venta_id);

  CREATE TRIGGER set_venta_envios_updated_at
    BEFORE UPDATE ON venta_envios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
