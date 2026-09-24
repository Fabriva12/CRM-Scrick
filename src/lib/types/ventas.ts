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
  envio?: VentaEnvio;
}

export interface VentaEnvio {
  id: string;
  venta_id: string;
  paga_cliente: number;
  cubrimos: number;
  created_at: string;
  updated_at: string;
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

/** Resumen mensual de ventas para la sección "Margen mensual" de Finanzas. */
export interface MargenMensual {
  /** Mes en formato YYYY-MM */
  mes: string;
  /** Cantidad total de paquetes vendidos */
  paquetes: number;
  /** true si el mes incluye paquetes estimados (ventas históricas sin detalle) */
  paquetesEstimados: boolean;
  /** Total facturado sin envío (suma de subtotales de productos) */
  totalFacturado: number;
  /** Costo total (producto directo o receta); null = faltan costos de ingredientes */
  costoIngredientes: number | null;
  /** Precio promedio por paquete */
  precioPromedio: number;
  /** Margen como fracción (0.6 = 60%); null = no calculable por falta de costos */
  margenPct: number | null;
}
