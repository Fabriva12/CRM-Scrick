-- Distingue ingredientes de paquetes producidos con una columna persistida.
-- Antes se deducía por nombre contra las recetas hardcodeadas, lo que
-- clasificaba como "paquete" a cualquier ingrediente nuevo.
ALTER TABLE productos
  ADD COLUMN tipo TEXT NOT NULL DEFAULT 'paquete'
  CHECK (tipo IN ('ingrediente', 'paquete'));

-- Backfill: los nombres que hoy son ingredientes de alguna receta (RECETAS).
UPDATE productos
  SET tipo = 'ingrediente'
  WHERE nombre IN (
    'Mantequilla de maní','Sirope','Margarina light','Esencia de vainilla',
    'Leche','Chispas de chocolate','Polvo de hornear','Benzonato',
    'Harina de almendra','Proteína','Harina de grillo','Avena','Huevo',
    'Canela','Chocolate blanco','Empaque'
  );
