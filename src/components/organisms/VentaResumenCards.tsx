import { formatCurrency } from '@/lib/format';
import type { ResumenVentas } from '@/lib/ventas';

interface VentaResumenCardsProps {
  resumen: ResumenVentas;
}

export function VentaResumenCards({ resumen }: VentaResumenCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {/* Total facturado */}
      <div className="min-w-0 overflow-hidden rounded-xl bg-[#FEA372]/15 p-5 ring-1 ring-[#FEA372]/30">
        <p className="text-sm font-medium text-[#2F3031]/70">TOTAL FACTURADO</p>
        <p className="mt-2 text-2xl font-bold tabular-nums text-[#2F3031] break-all">
          {formatCurrency(resumen.totalFacturado)}
        </p>
        <p className="mt-1 text-xs text-[#2F3031]/60">
          {resumen.cantidad} venta{resumen.cantidad !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Cobrado */}
      <div className="min-w-0 overflow-hidden rounded-xl bg-green-100 p-5 ring-1 ring-green-200">
        <p className="text-sm font-medium text-green-800/70">COBRADO</p>
        <p className="mt-2 text-2xl font-bold tabular-nums text-green-700 break-all">
          {formatCurrency(resumen.cobrado)}
        </p>
        <p className="mt-1 text-xs text-green-600/60">
          {resumen.cantidadPagadas} pagada{resumen.cantidadPagadas !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Por cobrar */}
      <div className="min-w-0 overflow-hidden rounded-xl bg-amber-50 p-5 ring-1 ring-amber-200">
        <p className="text-sm font-medium text-amber-800/70">POR COBRAR</p>
        <p className="mt-2 text-2xl font-bold tabular-nums text-amber-700 break-all">
          {formatCurrency(resumen.porCobrar)}
        </p>
        <p className="mt-1 text-xs text-amber-600/60">
          {resumen.cantidadPendientes} pendiente
          {resumen.cantidadPendientes !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
