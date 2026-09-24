-- El stock de productos con receta pasa a unidades vendidas.
-- Receta 1 (se vende por galleta, 1:1) no cambia.
-- Galleta Chocolate Blanco (paquete de 4 galletas) pasa de galletas a
-- paquetes completos: 66 galletas -> 16 paquetes (floor).
    UPDATE productos
    SET stock = floor(stock / 4)
    WHERE nombre = 'Galleta Chocolate Blanco';