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
  ingredientes: RecipeIngredient[];
}

export const RECETAS: Recipe[] = [
  {
    id: 'receta-1',
    nombre: 'Receta 1',
    producto_nombre: 'Galleta Proteica Receta 1',
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
    nombre: 'Receta 2',
    producto_nombre: 'Galleta Proteica Receta 2',
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
