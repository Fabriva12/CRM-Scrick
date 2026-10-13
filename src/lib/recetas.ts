export interface RecipeIngredient {
  /** Nombre exacto del producto en el catálogo */
  nombre: string;
  /** Cantidad que se descuenta por cada galleta producida */
  cantidad: number;
}

export interface Recipe {
  id: string;
  /** Nombre mostrado en el selector de recetas */
  nombre: string;
  /** Nombre del producto terminado en el catálogo (se crea/actualiza al producir) */
  producto_nombre: string;
  /** Galletas que representan cada unidad vendida (1 = se vende por galleta, 4 = por paquete) */
  galletasPorUnidad: number;
  ingredientes: RecipeIngredient[];
}

export const RECETAS: Recipe[] = [
  {
    id: 'receta-1',
    nombre: 'Receta 1',
    producto_nombre: 'Galleta Receta 1',
    galletasPorUnidad: 1,
    ingredientes: [
      { nombre: 'Mantequilla de maní', cantidad: 2.46 },
      { nombre: 'Sirope', cantidad: 2.46 },
      { nombre: 'Margarina light', cantidad: 1.25 },
      { nombre: 'Esencia de vainilla', cantidad: 0.37 },
      { nombre: 'Leche', cantidad: 1.47 },
      { nombre: 'Chispas de chocolate', cantidad: 2.46 },
      { nombre: 'Polvo de hornear', cantidad: 0.45 },
      { nombre: 'Benzonato', cantidad: 0.01 },
      { nombre: 'Harina de almendra', cantidad: 3.68 },
      { nombre: 'Proteína', cantidad: 3.0 },
      { nombre: 'Harina de grillo', cantidad: 2.46 },
      { nombre: 'Avena', cantidad: 2.46 },
      { nombre: 'Huevo', cantidad: 2.25 },
    ],
  },
  {
    id: 'receta-2',
    nombre: 'Galleta Chocolate Blanco',
    producto_nombre: 'Galleta Chocolate Blanco',
    galletasPorUnidad: 4,
    ingredientes: [
      { nombre: 'Harina de almendra', cantidad: 9 },
      { nombre: 'Harina de grillo', cantidad: 2.5 },
      { nombre: 'Mantequilla de maní', cantidad: 3.75 },
      { nombre: 'Margarina light', cantidad: 1.75 },
      { nombre: 'Polvo de hornear', cantidad: 0.375 },
      { nombre: 'Esencia de vainilla', cantidad: 1.25 },
      { nombre: 'Huevo', cantidad: 4 },
      { nombre: 'Benzonato', cantidad: 0.011 },
      { nombre: 'Canela', cantidad: 0.075 },
      { nombre: 'Chocolate blanco', cantidad: 3 },
      { nombre: 'Empaque', cantidad: 0.25 }, // 1 empaque cada 4 galletas
    ],
  },
];

/** Busca la receta cuyo producto terminado coincide con el nombre. */
export function buscarRecetaPorProducto(
  nombreProducto: string
): Recipe | undefined {
  return RECETAS.find((r) => r.producto_nombre === nombreProducto);
}

/**
 * Unidad de venta de un producto con receta para mostrar en stock:
 * 'paq' si la receta se vende por paquete, 'galleta' si se vende por
 * galleta suelta. Si no hay receta, devuelve el fallback (ej: 'unid').
 */
export function sufijoStock(
  nombre: string | null | undefined,
  fallback: string
): string {
  const receta = buscarRecetaPorProducto(nombre ?? '');
  if (receta) return receta.galletasPorUnidad > 1 ? 'paq' : 'galleta';
  return fallback;
}

/**
 * Costo por unidad vendida de una receta: suma cantidad × costo de cada
 * ingrediente. Las cantidades de receta ya son por unidad vendida (receta-2
 * incluye empaque por paquete de 4 galletas).
 *
 * Devuelve null si algún ingrediente no tiene costo cargado: el margen no es
 * calculable de forma confiable, mejor no mostrarlo a medias.
 */
export function calcularCostoReceta(
  receta: Recipe,
  costosPorNombre: Record<string, number | null | undefined>
): number | null {
  const sinCosto = receta.ingredientes.filter(
    (ing) => costosPorNombre[ing.nombre] == null
  );
  if (sinCosto.length > 0) return null;
  return receta.ingredientes.reduce(
    (sum, ing) => sum + ing.cantidad * (costosPorNombre[ing.nombre] ?? 0),
    0
  );
}
