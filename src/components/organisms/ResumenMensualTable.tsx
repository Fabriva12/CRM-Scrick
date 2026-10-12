'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import { Coins } from 'lucide-react';

import { formatCurrency } from '@/lib/format';
import { Input } from '@/components/ui/input';
import type { ResumenMensualFila } from '@/lib/resumen-mensual';

const STORAGE_KEY = 'crm:precio-dolar';
const MEJORES = '__mejores__';

const oyentes = new Set<() => void>();

function leerPrecio(): string {
  return window.localStorage.getItem(STORAGE_KEY) ?? '';
}

function guardarPrecio(valor: string) {
  if (valor.trim() === '') {
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    window.localStorage.setItem(STORAGE_KEY, valor);
  }
  oyentes.forEach((notificar) => notificar());
}

function suscribir(notificar: () => void) {
  oyentes.add(notificar);
  return () => {
    oyentes.delete(notificar);
  };
}

function precioEnServidor(): string {
  return '';
}

const USD = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

function formatMes(mes: string): string {
  const [year, month] = mes.split('-').map(Number);
  return new Intl.DateTimeFormat('es-MX', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1));
}

interface ResumenMensualTableProps {
  filas: ResumenMensualFila[];
}

export function ResumenMensualTable({ filas }: ResumenMensualTableProps) {
  const tipoCambio = useSyncExternalStore(
    suscribir,
    leerPrecio,
    precioEnServidor
  );
  const [filtroMes, setFiltroMes] = useState('');

  const visible = useMemo(() => {
    if (filtroMes === MEJORES) {
      return [...filas].sort((a, b) => b.paquetes - a.paquetes).slice(0, 5);
    }
    if (filtroMes) return filas.filter((f) => f.mes === filtroMes);
    return filas.slice(0, 5);
  }, [filas, filtroMes]);

  const rate = Number(tipoCambio);
  const rateValido =
    tipoCambio.trim() !== '' && Number.isFinite(rate) && rate > 0;

  if (filas.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl bg-white p-5 ring-1 ring-[#2F3031]/10 dark:bg-card dark:ring-border">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="font-heading text-lg tracking-wide text-[#2F3031] dark:text-foreground">
          <Coins className="mr-2 inline size-4 text-[#FEA372]" />
          Resumen mensual
        </h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-[#2F3031]/50 dark:text-muted-foreground">
              Precio del dólar (₡/USD)
            </span>
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={tipoCambio}
              onChange={(e) => guardarPrecio(e.target.value)}
              placeholder="Ej: 510"
              className="w-36"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-[#2F3031]/50 dark:text-muted-foreground">
              Mes
            </span>
            <select
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              aria-label="Filtrar resumen por mes"
              className="h-8 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Últimos 5 meses</option>
              <option value={MEJORES}>Mejores 5 meses</option>
              {filas.map((f) => (
                <option key={f.mes} value={f.mes}>
                  {formatMes(f.mes)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2F3031]/10 text-left text-xs text-[#2F3031]/50 dark:border-border dark:text-muted-foreground">
              <th className="pb-2 pr-4 font-medium">Mes</th>
              <th className="pb-2 pr-4 text-right font-medium">Ingreso</th>
              <th className="pb-2 pr-4 text-right font-medium">Egreso</th>
              <th className="pb-2 pr-4 text-right font-medium">
                Ingreso − Envíos
              </th>
              <th className="pb-2 pr-4 text-right font-medium">Paquetes</th>
              <th className="pb-2 text-right font-medium">Ingreso USD</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2F3031]/10 dark:divide-border">
            {visible.map((f) => (
              <tr key={f.mes}>
                <td className="py-2.5 pr-4 font-medium capitalize text-[#2F3031] dark:text-foreground">
                  {formatMes(f.mes)}
                </td>
                <td className="py-2.5 pr-4 text-right tabular-nums text-[#2F3031] dark:text-foreground">
                  {formatCurrency(f.ingreso)}
                </td>
                <td className="py-2.5 pr-4 text-right tabular-nums text-[#2F3031]/70 dark:text-muted-foreground">
                  {formatCurrency(f.egreso)}
                </td>
                <td className="py-2.5 pr-4 text-right tabular-nums text-[#2F3031] dark:text-foreground">
                  {formatCurrency(f.ingresoNeto)}
                </td>
                <td className="py-2.5 pr-4 text-right tabular-nums text-[#2F3031]/70 dark:text-muted-foreground">
                  {f.paquetes}
                </td>
                <td className="py-2.5 text-right tabular-nums text-[#2F3031] dark:text-foreground">
                  {rateValido ? USD.format(f.ingreso / rate) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
