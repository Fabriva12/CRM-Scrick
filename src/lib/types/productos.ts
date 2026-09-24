export interface Producto {
  id: string;
  nombre: string;
  sku: string | null;
  /** Precio de venta: solo aplica a productos de receta (los ingredientes no se venden) */
  precio_venta: number | null;
  /** Costo unitario. Para ingredientes es el costo por gramo calculado */
  costo: number | null;
  /** Ingredientes: cuánto pagó por la compra (₡) */
  costo_total: number | null;
  /** Ingredientes: cuánta cantidad compró (gramos) */
  cantidad_comprada: number | null;
  /** Stock: solo para paquetes producidos (unidades) */
  stock: number;
  /** Ingredientes: gramos que quedan disponibles */
  gramos_restantes: number | null;
  unidad: string | null;
  created_at: string;
  updated_at: string;
}

export type ProductoActionResult = {
  errors?: {
    nombre?: string[];
    sku?: string[];
    precio_venta?: string[];
    costo?: string[];
    costo_total?: string[];
    cantidad_comprada?: string[];
    stock?: string[];
    gramos_restantes?: string[];
    unidad?: string[];
    _form?: string[];
  };
  data?: Producto;
  message?: string;
};
