export interface Venta {
  id: string;
  cliente_id: string;
  fecha: string;
  estado: 'pagado' | 'pendiente' | 'cancelado';
  monto_total: number;
  notas: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  clientes?: { nombre: string };
  venta_productos?: VentaProducto[];
}

export interface VentaProducto {
  id: string;
  venta_id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  // Joined fields
  productos?: { nombre: string; sku: string | null };
}

export type VentaWithDetails = Venta & {
  clientes: { nombre: string };
  venta_productos: (VentaProducto & { productos: { nombre: string; sku: string | null } })[];
};

export type VentaActionResult = {
  errors?: Record<string, string[]>;
  data?: Venta;
  message?: string;
};
