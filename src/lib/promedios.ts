export interface ResumenMes {
  /** Mes en formato YYYY-MM */
  mes: string;
  ingresos: number;
  unidades: number;
  /** Unidades con líneas reales en venta_productos. */
  unidadesReales: number;
  /** Unidades estimadas (monto ÷ precio promedio) cuando no hay líneas. */
  unidadesEstimadas: number;
}

export interface PromediosPeriodo {
  meses: ResumenMes[];
  mesesConVentas: number;
  ingresosTotales: number;
  unidadesTotales: number;
  ingresoPromedioMensual: number | null;
  unidadesPromedioMensuales: number | null;
  /** true si el período incluye algún mes con unidades estimadas. */
  usandoEstimacion: boolean;
}

interface LineaVenta {
  cantidad?: number | string | null;
  precio_unitario?: number | string | null;
}

interface FilaVenta {
  /** Requerida solo para agrupar por mes (agruparPromediosPorMes). */
  fecha?: string | null;
  monto_total?: number | string | null;
  venta_productos?: LineaVenta[] | null;
}

/**
 * Precio promedio ponderado por cantidad de las líneas reales
 * (Σ precio_unitario × cantidad ÷ Σ cantidad). Devuelve null sin líneas reales.
 *
 * Se usa para estimar unidades de las ventas históricas que no tienen detalle:
 * el promedio se recalcula solo a medida que entran ventas reales nuevas.
 */
export function promedioPrecioUnitario(ventas: FilaVenta[]): number | null {
  let totalMonto = 0;
  let totalCantidad = 0;

  for (const venta of ventas) {
    for (const linea of venta.venta_productos ?? []) {
      const cantidad = Number(linea.cantidad) || 0;
      const precio = Number(linea.precio_unitario) || 0;
      totalCantidad += cantidad;
      totalMonto += precio * cantidad;
    }
  }

  return totalCantidad > 0 ? totalMonto / totalCantidad : null;
}

/**
 * Unidades de una sola venta: usa la suma real de sus líneas cuando existen,
 * o estima monto ÷ precioPromedio cuando no (ventas históricas sin detalle).
 */
export function unidadesDeVenta(
  venta: FilaVenta,
  precioPromedio: number | null
): number {
  const reales = (venta.venta_productos ?? []).reduce(
    (sum, vp) => sum + (Number(vp.cantidad) || 0),
    0
  );
  if (reales > 0) return reales;
  if (!precioPromedio) return 0;
  return Math.round((Number(venta.monto_total) || 0) / precioPromedio);
}

/**
 * Agrupa ventas pagadas por mes en ingresos y unidades vendidas.
 *
 * Las ventas con líneas reales aportan unidades exactas; las que no tienen
 * detalle (históricas importadas) se estiman con el precio promedio recibido.
 */
export function agruparPromediosPorMes(
  ventas: FilaVenta[],
  precioPromedio: number | null = null
): ResumenMes[] {
  const porMes = new Map<string, ResumenMes>();

  for (const venta of ventas) {
    const mes = venta.fecha?.slice(0, 7);
    if (!mes) continue;

    const ingresos = Number(venta.monto_total) || 0;
    const unidades = unidadesDeVenta(venta, precioPromedio);
    const unidadesReales = (venta.venta_productos ?? []).reduce(
      (sum, vp) => sum + (Number(vp.cantidad) || 0),
      0
    );
    const unidadesEstimadas = Math.max(unidades - unidadesReales, 0);

    const actual = porMes.get(mes);
    if (actual) {
      actual.ingresos += ingresos;
      actual.unidades += unidades;
      actual.unidadesReales += unidadesReales;
      actual.unidadesEstimadas += unidadesEstimadas;
    } else {
      porMes.set(mes, {
        mes,
        ingresos,
        unidades,
        unidadesReales,
        unidadesEstimadas,
      });
    }
  }

  return [...porMes.values()].sort((a, b) => a.mes.localeCompare(b.mes));
}

/**
 * Promedio mensual de ingresos y unidades en un período.
 *
 * @param meses Agrupación mensual (de agruparPromediosPorMes).
 * @param anio Año en formato YYYY para filtrar; null significa histórico.
 *
 * El promedio divide por los meses con ventas pagadas del período (no por
 * una cantidad fija de meses), y devuelve null si no hay ningún mes activo.
 */
export function calcularPromedios(
  meses: ResumenMes[],
  anio: string | null
): PromediosPeriodo {
  const filtrados = anio
    ? meses.filter((m) => m.mes.startsWith(anio))
    : meses;

  const conVentas = filtrados.filter(
    (m) => m.ingresos > 0 || m.unidades > 0
  );
  const mesesConVentas = conVentas.length;
  const ingresosTotales = conVentas.reduce((sum, m) => sum + m.ingresos, 0);
  const unidadesTotales = conVentas.reduce((sum, m) => sum + m.unidades, 0);
  const unidadesEstimadasTotales = conVentas.reduce(
    (sum, m) => sum + m.unidadesEstimadas,
    0
  );

  return {
    meses: filtrados,
    mesesConVentas,
    ingresosTotales,
    unidadesTotales,
    ingresoPromedioMensual:
      mesesConVentas > 0 ? ingresosTotales / mesesConVentas : null,
    unidadesPromedioMensuales:
      mesesConVentas > 0 ? unidadesTotales / mesesConVentas : null,
    usandoEstimacion: unidadesEstimadasTotales > 0,
  };
}