-- Unifica Instagram/Facebook/WhatsApp en una sola fuente: 'Redes Sociales'.
-- Hosted Supabase only: este ALTER + UPDATE se debe ejecutar en el SQL Editor
-- de Supabase (el service_role por REST no corre DDL).
-- Nota: el UPDATE va ANTES del ADD CONSTRAINT; si se agrega el CHECK primero,
-- Postgres rechaza el ALTER porque hay filas con los valores viejos.
ALTER TABLE clientes DROP CONSTRAINT IF EXISTS clientes_fuente_check;

UPDATE clientes
  SET fuente = 'Redes Sociales'
  WHERE fuente IN ('Instagram', 'Facebook', 'WhatsApp');

ALTER TABLE clientes
  ADD CONSTRAINT clientes_fuente_check
  CHECK (
    fuente IS NULL
    OR fuente IN ('Redes Sociales', 'Referido', 'Contacto Directo', 'Web', 'Otro')
  );