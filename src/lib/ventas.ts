import type { Venta } from '@/lib/types/ventas';
import { FUENTES, type ClienteFuente } from '@/lib/validations/clientes';

export interface ResumenVentas {
  /** Total facturado del período (Σ monto_total). */
  totalFacturado: number;
  /** Cantidad de ventas del período. */
  cantidad: number;
  /** Monto total de ventas pagadas. */
  cobrado: number;
  /** Cantidad de ventas pagadas. */
  cantidadPagadas: number;
  /** Monto total por cobrar (ventas pendientes). */
  porCobrar: number;
  /** Cantidad de ventas pendientes. */
  cantidadPendientes: number;
}

/** Resume un conjunto de ventas: total facturado, cobrado y por cobrar. */
export function resumirVentas(ventas: Venta[]): ResumenVentas {
  const resumen: ResumenVentas = {
    totalFacturado: 0,
    cantidad: ventas.length,
    cobrado: 0,
    cantidadPagadas: 0,
    porCobrar: 0,
    cantidadPendientes: 0,
  };

  for (const venta of ventas) {
    const monto = Number(venta.monto_total) || 0;
    resumen.totalFacturado += monto;

    if (venta.estado === 'pagado') {
      resumen.cobrado += monto;
      resumen.cantidadPagadas += 1;
    } else if (venta.estado === 'pendiente') {
      resumen.porCobrar += monto;
      resumen.cantidadPendientes += 1;
    }
  }

  return resumen;
}

/** Fuente de cliente o "Desconocido" cuando no hay dato válido registrado. */
export type FuenteVenta = ClienteFuente | 'Desconocido';

export interface FuenteResumen {
  fuente: FuenteVenta;
  cantidad: number;
}

interface VentaConFuente {
  clientes?: { fuente: string | null } | null;
}

/**
 * Cuenta ventas por fuente del cliente. Sin fuente registrada (nula o valor
 * no reconocido) cae en "Desconocido"; "Otro" solo si se eligió explícitamente.
 */
export function agruparVentasPorFuente(ventas: VentaConFuente[]): FuenteResumen[] {
  const conteo = new Map<FuenteVenta, number>();

  for (const venta of ventas) {
    const raw = venta.clientes?.fuente ?? null;
    const fuente: FuenteVenta =
      raw && (FUENTES as readonly string[]).includes(raw)
        ? (raw as ClienteFuente)
        : 'Desconocido';
    conteo.set(fuente, (conteo.get(fuente) ?? 0) + 1);
  }

  return [...conteo.entries()]
    .map(([fuente, cantidad]) => ({ fuente, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad);
}
