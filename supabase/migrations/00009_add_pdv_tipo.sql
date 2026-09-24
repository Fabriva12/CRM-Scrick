ALTER TABLE clientes DROP CONSTRAINT IF EXISTS clientes_tipo_check;
ALTER TABLE clientes ADD CONSTRAINT clientes_tipo_check CHECK (tipo IN ('B2B', 'B2C', 'PDV'));