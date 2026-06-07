CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE clientes (
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

CREATE INDEX idx_clientes_created_at ON clientes (created_at DESC);
CREATE INDEX idx_clientes_tipo ON clientes (tipo);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
