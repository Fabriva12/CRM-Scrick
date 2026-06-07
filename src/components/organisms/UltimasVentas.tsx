'use client';

import { VentaEstadoBadge } from '@/components/molecules/VentaEstadoBadge';

interface UltimaVenta {
  id: string;
  fecha: string;
  estado: 'pagado' | 'pendiente' | 'cancelado';
  monto_total: number;
  clientes: { nombre: string } | null;
}

interface UltimasVentasProps {
  ventas: UltimaVenta[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(value);
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateStr));
}

export function UltimasVentas({ ventas }: UltimasVentasProps) {
  return (
    <div className="rounded-xl bg-white p-5 ring-1 ring-[#2F3031]/10">
      <h2 className="font-heading mb-4 text-lg tracking-wide text-[#2F3031]">
        🕐 Últimas ventas
      </h2>

      {ventas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-[#2F3031]/40">
          <span className="text-4xl">🦗</span>
          <p className="mt-2 text-sm">Sin ventas</p>
        </div>
      ) : (
        <ul className="divide-y divide-[#2F3031]/10">
          {ventas.map((venta) => (
            <li
              key={venta.id}
              className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#2F3031]">
                  {venta.clientes?.nombre ?? 'Cliente desconocido'}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <VentaEstadoBadge estado={venta.estado} />
                  <span className="text-xs text-[#2F3031]/40">
                    {formatDate(venta.fecha)}
                  </span>
                </div>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-[#2F3031]">
                {formatCurrency(venta.monto_total)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
