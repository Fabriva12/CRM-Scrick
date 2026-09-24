'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import { calcularPromedios, type ResumenMes } from '@/lib/promedios';
import { cn } from '@/lib/utils';
import { TrendingUp, BarChart3 } from 'lucide-react';

const formatearUnidades = new Intl.NumberFormat('es-CR', {
  maximumFractionDigits: 1,
});

interface PromediosSectionProps {
  /** Agrupación mensual de ventas pagadas (ingresos y unidades). */
  data: ResumenMes[];
  /** Precio promedio por unidad usado para estimar ventas sin detalle. */
  precioPromedio: number | null;
}

export function PromediosSection({ data, precioPromedio }: PromediosSectionProps) {
  const anios = useMemo(
    () =>
      [...new Set(data.map((m) => m.mes.slice(0, 4)))]
        .sort()
        .reverse(),
    [data]
  );
  const [anio, setAnio] = useState<string | null>(null);

  const promedios = useMemo(
    () => calcularPromedios(data, anio),
    [data, anio]
  );

  const sinVentas =
    promedios.mesesConVentas === 0 ||
    promedios.ingresoPromedioMensual == null;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="size-5 text-muted-foreground" />
          Promedios
        </CardTitle>
        <div className="flex flex-wrap justify-end gap-1.5">
          <button
            type="button"
            onClick={() => setAnio(null)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              anio === null
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/70'
            )}
          >
            Histórico
          </button>
          {anios.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAnio(a)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                anio === a
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70'
              )}
            >
              {a}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {sinVentas ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <BarChart3 className="size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No hay ventas pagadas en el período
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="min-w-0 overflow-hidden rounded-xl bg-green-50 p-5 ring-1 ring-green-200">
                <span className="text-2xl">💰</span>
                <p className="mt-2 text-lg font-bold tabular-nums sm:text-2xl text-green-700 break-all">
                  {formatCurrency(promedios.ingresoPromedioMensual)}
                </p>
                <p className="mt-1 text-sm text-green-700/60">
                  Ingreso promedio mensual
                </p>
              </div>
              <div className="min-w-0 overflow-hidden rounded-xl bg-purple-50 p-5 ring-1 ring-purple-200">
                <span className="text-2xl">📦</span>
                <p className="mt-2 text-lg font-bold tabular-nums sm:text-2xl text-[#2F3031] break-all">
                  {formatearUnidades.format(
                    promedios.unidadesPromedioMensuales ?? 0
                  )}
                </p>
                <p className="mt-1 text-sm text-[#2F3031]/60">
                  Unidades promedio por mes
                  {promedios.usandoEstimacion ? ' (estimado)' : ''}
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              {promedios.mesesConVentas}{' '}
              {promedios.mesesConVentas === 1 ? 'mes' : 'meses'} con ventas en
              el período · {formatCurrency(promedios.ingresosTotales)} totales
              y {formatearUnidades.format(promedios.unidadesTotales)}{' '}
              unidades
              {promedios.usandoEstimacion && precioPromedio != null
                ? ` · estimadas con un precio promedio de ${formatCurrency(precioPromedio)}`
                : ''}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}