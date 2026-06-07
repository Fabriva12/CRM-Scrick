export interface Gasto {
  id: string;
  categoria: string;
  descripcion: string;
  monto: number;
  fecha: string;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export type GastoActionResult = {
  errors?: Record<string, string[]>;
  data?: Gasto;
  message?: string;
};

export interface ResumenFinanzas {
  ingresos_totales: number;
  cantidad_ventas: number;
  egresos_totales: number;
  cantidad_gastos: number;
  balance_neto: number;
}
