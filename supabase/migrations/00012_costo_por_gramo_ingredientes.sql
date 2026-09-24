-- Costo por gramo de ingredientes: el usuario carga cuánto le costó
-- (costo_total) y cuánto compró (cantidad_comprada). El sistema guarda
-- en `costo` el costo por gramo = costo_total / cantidad_comprada.
-- Se sube la precisión de costo a 4 decimales porque el costo por gramo
-- suele ser fraccionario.
      ALTER TABLE productos ALTER COLUMN costo TYPE NUMERIC(12,4);

      ALTER TABLE productos
        ADD COLUMN costo_total NUMERIC(12,2),
        ADD COLUMN cantidad_comprada NUMERIC(12,2);