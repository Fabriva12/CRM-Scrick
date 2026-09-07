ALTER TABLE clientes
  ADD COLUMN fuente TEXT DEFAULT NULL
  CHECK (fuente IS NULL OR fuente IN ('Instagram', 'Facebook', 'WhatsApp', 'Referido', 'Contacto Directo', 'Web', 'Otro'));

CREATE INDEX idx_clientes_fuente ON clientes (fuente);
