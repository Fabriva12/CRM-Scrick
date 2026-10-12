import { unidadesDeVenta } from '@/lib/promedios';

/** Categoría de gasto con la que se registran los envíos que cubrimos. */
export const CATEGORIA_ENVIOS = 'Transporte';

interface LineaVenta {
  cantidad?: number | string | null;
}

interface FilaVenta {
  fecha?: string | null;
  monto_total?: number | string | null;
  venta_productos?: LineaVenta[] | null;
}

interface FilaGasto {
  fecha?: string | null;
  monto?: number | string | null;
  categoria?: string | null;
}

/** Resumen financiero de un mes para el dashboard. */
export interface ResumenMensualFila {
  /** Mes en formato YYYY-MM */
  mes: string;
  /** Ingresos del mes: Σ ventas pagadas (monto_total, incluye el envío que paga el cliente). */
  ingreso: number;
  /** Egresos del mes: Σ gastos (todas las categorías). */
  egreso: number;
  /** Envíos que cubrimos (Σ gastos de categoría Transporte). */
  envios: number;
  /** ingreso − envios. */
  ingresoNeto: number;
  /** Paquetes vendidos (reales + estimados sin detalle de productos). */
  paquetes: number;
}

/**
 * Agrupa ventas pagadas y gastos por mes (YYYY-MM) en un resumen financiero.
 * Ordena de más reciente a más antiguo. Los meses que solo tienen gastos
 * también aparecen (con ingreso 0).
 */
export function agruparResumenMensual(
  ventas: FilaVenta[],
  gastos: FilaGasto[],
  precioPromedio: number | null = null
): ResumenMensualFila[] {
  const porMes = new Map<string, ResumenMensualFila>();

  const asegurar = (mes: string): ResumenMensualFila => {
    const actual = porMes.get(mes);
    if (actual) return actual;
    const nueva: ResumenMensualFila = {
      mes,
      ingreso: 0,
      egreso: 0,
      envios: 0,
      ingresoNeto: 0,
      paquetes: 0,
    };
    porMes.set(mes, nueva);
    return nueva;
  };

  for (const venta of ventas) {
    const mes = venta.fecha?.slice(0, 7);
    if (!mes) continue;
    const fila = asegurar(mes);
    fila.ingreso += Number(venta.monto_total) || 0;
    fila.paquetes += unidadesDeVenta(venta, precioPromedio);
  }

  for (const gasto of gastos) {
    const mes = gasto.fecha?.slice(0, 7);
    if (!mes) continue;
    const fila = asegurar(mes);
    const monto = Number(gasto.monto) || 0;
    fila.egreso += monto;
    if (gasto.categoria === CATEGORIA_ENVIOS) {
      fila.envios += monto;
    }
  }

  return [...porMes.values()]
    .map((fila) => ({ ...fila, ingresoNeto: fila.ingreso - fila.envios }))
    .sort((a, b) => b.mes.localeCompare(a.mes));
}
