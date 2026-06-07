'use client';

import type { ResumenFinanzas } from '@/lib/types/gastos';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(value);
}

interface ResumenCardsProps {
  resumen: ResumenFinanzas;
}

export function ResumenCards({ resumen }: ResumenCardsProps) {
  const isPositive = resumen.balance_neto >= 0;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {/* Ingresos Totales */}
      <div className="rounded-xl bg-[#FEA372]/15 p-5 ring-1 ring-[#FEA372]/30">
        <p className="text-sm font-medium text-[#2F3031]/70">INGRESOS TOTALES</p>
        <p className="mt-2 text-2xl font-bold tabular-nums text-[#2F3031]">
          {formatCurrency(resumen.ingresos_totales)}
        </p>
        <p className="mt-1 text-xs text-[#2F3031]/60">
          {resumen.cantidad_ventas} venta{resumen.cantidad_ventas !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Egresos Totales */}
      <div className="rounded-xl bg-red-100 p-5 ring-1 ring-red-200 dark:bg-red-900/20 dark:ring-red-800/30">
        <p className="text-sm font-medium text-red-800/70 dark:text-red-200/70">EGRESOS TOTALES</p>
        <p className="mt-2 text-2xl font-bold tabular-nums text-red-700 dark:text-red-300">
          {formatCurrency(resumen.egresos_totales)}
        </p>
        <p className="mt-1 text-xs text-red-600/60 dark:text-red-300/60">
          {resumen.cantidad_gastos} registro{resumen.cantidad_gastos !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Balance Neto */}
      <div
        className={`rounded-xl p-5 ring-1 ${
          isPositive
            ? 'bg-green-100 ring-green-200 dark:bg-green-900/20 dark:ring-green-800/30'
            : 'bg-red-100 ring-red-200 dark:bg-red-900/20 dark:ring-red-800/30'
        }`}
      >
        <p className="text-sm font-medium text-muted-foreground">BALANCE NETO</p>
        <p
          className={`mt-2 text-2xl font-bold tabular-nums ${
            isPositive
              ? 'text-green-700 dark:text-green-300'
              : 'text-red-700 dark:text-red-300'
          }`}
        >
          {formatCurrency(resumen.balance_neto)}
        </p>
      </div>
    </div>
  );
}
