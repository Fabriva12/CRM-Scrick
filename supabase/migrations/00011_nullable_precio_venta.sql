-- Los ingredientes no se venden: precio_venta pasa a ser opcional.
-- Solo los productos de receta (productos terminados) llevan precio de venta.
ALTER TABLE productos ALTER COLUMN precio_venta DROP NOT NULL;

-- Backfill: ingredientes existentes de las recetas quedan sin precio de venta.
UPDATE productos
SET precio_venta = NULL
WHERE nombre IN (
  'Chispas de chocolate',
  'Avena',
  'Leche',
  'Sirope',
  'Proteína',
  'Harina de almendra',
  'Harina de grillo',
  'Mantequilla de maní',
  'Margarina light',
  'Polvo de hornear',
  'Esencia de vainilla',
  'Huevo',
  'Benzonato',
  'Canela',
  'Chocolate blanco',
  'Empaque'
);