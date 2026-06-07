export interface Producto {
  id: string;
  nombre: string;
  sku: string | null;
  precio_venta: number;
  costo: number | null;
  stock: number;
  unidad: string | null;
  paquete: string | null;
  descripcion: string | null;
  created_at: string;
  updated_at: string;
}

export type ProductoActionResult = {
  errors?: {
    nombre?: string[];
    sku?: string[];
    precio_venta?: string[];
    costo?: string[];
    stock?: string[];
    unidad?: string[];
    paquete?: string[];
    descripcion?: string[];
    _form?: string[];
  };
  data?: Producto;
  message?: string;
};
