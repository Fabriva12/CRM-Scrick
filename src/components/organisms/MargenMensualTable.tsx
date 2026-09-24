'use client';

import { useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';

import { formatCurrency, formatPercent } from '@/lib/format';
import type { MargenMensual } from '@/lib/types/ventas';

interface MargenMensualTableProps {
  months: MargenMensual[];
  /** Ingredientes sin costo cargado (bloquean el margen por receta) */
  faltantes?: string[];
}

function formatMes(mes: string): string {
  const [year, month] = mes.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat('es-MX', {
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function MargenMensualTable({ months, faltantes }: MargenMensualTableProps) {
  const [filtroMes, setFiltroMes] = useState<string>('');

  const visible = useMemo(() => {
    if (filtroMes) {
      return months.filter((m) => m.mes === filtroMes);
    }
    return months.slice(0, 5);
  }, [months, filtroMes]);

  if (months.length === 0) {
    return null;
  }

  const margenColor = (margenPct: number | null) => {
    if (margenPct == null) return 'text-muted-foreground';
    if (margenPct >= 0.5) return 'text-green-700 dark:text-green-300';
    if (margenPct >= 0.35) return 'text-amber-600 dark:text-amber-300';
    return 'text-red-700 dark:text-red-300';
  };

  return (
    <div className="rounded-xl bg-white p-5 ring-1 ring-[#2F3031]/10 dark:bg-card dark:ring-border">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-heading text-lg tracking-wide text-[#2F3031] dark:text-foreground">
          <TrendingUp className="mr-2 inline size-4 text-[#FEA372]" />
          Margen mensual
        </h2>
        <select
          value={filtroMes}
          onChange={(e) => setFiltroMes(e.target.value)}
          aria-label="Filtrar margen por mes"
          className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Últimos 5 meses</option>
          {months.map((m) => (
            <option key={m.mes} value={m.mes}>
              {formatMes(m.mes)}
            </option>
          ))}
        </select>
      </div>

      {faltantes && faltantes.length > 0 && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          Faltan costos de ingredientes para calcular el margen por receta:{' '}
          {faltantes.join(', ')}. Cargá el costo de cada uno desde la sección
          Productos.
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2F3031]/10 text-left text-xs text-[#2F3031]/50 dark:border-border dark:text-muted-foreground">
              <th className="pb-2 pr-4 font-medium">Mes</th>
              <th className="pb-2 pr-4 text-right font-medium">Paquetes</th>
              <th className="pb-2 pr-4 text-right font-medium">
                Total facturado (sin envío)
              </th>
              <th className="pb-2 pr-4 text-right font-medium">
                Precio promedio
              </th>
              <th className="pb-2 text-right font-medium">Margen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2F3031]/10 dark:divide-border">
            {visible.map((m) => (
              <tr key={m.mes}>
                <td className="py-2.5 pr-4 font-medium capitalize text-[#2F3031] dark:text-foreground">
                  {formatMes(m.mes)}
                </td>
                <td className="py-2.5 pr-4 text-right tabular-nums text-[#2F3031]/70 dark:text-muted-foreground">
                  {m.paquetes}
                  {m.paquetesEstimados && m.paquetes > 0 ? ' *' : ''}
                </td>
                <td className="py-2.5 pr-4 text-right tabular-nums text-[#2F3031] dark:text-foreground">
                  {formatCurrency(m.totalFacturado)}
                </td>
                <td className="py-2.5 pr-4 text-right tabular-nums text-[#2F3031]/70 dark:text-muted-foreground">
                  {formatCurrency(m.precioPromedio)}
                </td>
                <td
                  className={`py-2.5 text-right font-semibold tabular-nums ${margenColor(m.margenPct)}`}
                >
                  {formatPercent(m.margenPct)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {visible.some((m) => m.paquetesEstimados && m.paquetes > 0) && (
        <p className="mt-3 text-xs text-muted-foreground">
          * Paquetes estimados (monto total ÷ precio promedio) para ventas sin
          detalle de productos.
        </p>
      )}
    </div>
  );
}