import { MESES_ABREV } from '@/lib/promedios';

export interface PuntoGastoMes {
  /** Mes en formato YYYY-MM */
  mes: string;
  /** Etiqueta corta del mes (ej: "ene"). */
  etiqueta: string;
  gastos: number;
}

export interface GastoPorCategoria {
  categoria: string;
  monto: number;
}

interface FilaGasto {
  fecha?: string | null;
  monto?: number | string | null;
  categoria?: string | null;
}

/** Suma los gastos agrupados por mes (YYYY-MM), ordenados ascendentemente. */
export function agruparGastosPorMes(
  gastos: FilaGasto[]
): { mes: string; total: number }[] {
  const porMes = new Map<string, number>();
  for (const g of gastos) {
    const mes = g.fecha?.slice(0, 7);
    if (!mes) continue;
    porMes.set(mes, (porMes.get(mes) ?? 0) + (Number(g.monto) || 0));
  }
  return [...porMes.entries()]
    .map(([mes, total]) => ({ mes, total }))
    .sort((a, b) => a.mes.localeCompare(b.mes));
}

/**
 * Serie mensual continua de gastos para el gráfico de línea.
 * Con `anio` devuelve los 12 meses de ese año; sin `anio`, los últimos
 * `ultimos` meses anclados al último mes con datos (o al mes actual).
 */
export function serieGastosMensuales(
  gastos: FilaGasto[],
  anio: string | null,
  ultimos = 12
): PuntoGastoMes[] {
  const porMes = new Map<string, number>();
  for (const g of gastos) {
    const mes = g.fecha?.slice(0, 7);
    if (!mes) continue;
    porMes.set(mes, (porMes.get(mes) ?? 0) + (Number(g.monto) || 0));
  }

  if (anio) {
    return Array.from({ length: 12 }, (_, i) => {
      const mes = `${anio}-${String(i + 1).padStart(2, '0')}`;
      return { mes, etiqueta: MESES_ABREV[i], gastos: porMes.get(mes) ?? 0 };
    });
  }

  const ultimoMes =
    porMes.size > 0
      ? [...porMes.keys()].sort((a, b) => b.localeCompare(a))[0]
      : new Date().toISOString().slice(0, 7);
  const [year, month] = ultimoMes.split('-').map(Number);

  return Array.from({ length: ultimos }, (_, idx) => {
    const offset = ultimos - 1 - idx;
    const d = new Date(year, month - 1 - offset, 1);
    const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return {
      mes,
      etiqueta: MESES_ABREV[d.getMonth()],
      gastos: porMes.get(mes) ?? 0,
    };
  });
}

/** Agrupa gastos por categoría (mayor monto primero); sin categoría va a "Otros". */
export function agruparGastosPorCategoria(
  gastos: FilaGasto[]
): GastoPorCategoria[] {
  const porCat = new Map<string, number>();
  for (const g of gastos) {
    const categoria = g.categoria && g.categoria.length > 0 ? g.categoria : 'Otros';
    const monto = Number(g.monto) || 0;
    if (monto <= 0) continue;
    porCat.set(categoria, (porCat.get(categoria) ?? 0) + monto);
  }
  return [...porCat.entries()]
    .map(([categoria, monto]) => ({ categoria, monto }))
    .sort((a, b) => b.monto - a.monto);
}