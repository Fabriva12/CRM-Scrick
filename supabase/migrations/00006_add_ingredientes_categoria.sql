-- Agrega 'Ingredientes' al CHECK constraint de gastos.categoria
-- Ejecutar en SQL Editor de Supabase

ALTER TABLE gastos DROP CONSTRAINT IF EXISTS gastos_categoria_check;
ALTER TABLE gastos ADD CONSTRAINT gastos_categoria_check
  CHECK (categoria = ANY (ARRAY[
    'Ingredientes'::text,
    'Produccion'::text,
    'Servicios'::text,
    'Renta'::text,
    'Nomina'::text,
    'Marketing'::text,
    'Transporte'::text,
    'Oficina'::text,
    'Impuestos'::text,
    'Mantenimiento'::text,
    'Comisiones'::text,
    'Otros'::text
  ]));
