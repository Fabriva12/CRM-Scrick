'use client';

import { formatCurrency } from '@/lib/format';

interface DashboardCardsProps {
  paquetesVendidos: number;
  ingresosTotales: number;
  egresosTotales: number;
  balanceNeto: number;
  materialesValor: number;
  materialesSinCosto: number;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('es-MX').format(value);
}

export function DashboardCards({
  paquetesVendidos,
  ingresosTotales,
  egresosTotales,
  balanceNeto,
  materialesValor,
  materialesSinCosto,
}: DashboardCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {/* Paquetes vendidos */}
      <div className="min-w-0 overflow-hidden rounded-xl bg-purple-50 p-5 ring-1 ring-purple-200">
        <p className="text-base font-bold tabular-nums text-[#2F3031] break-all sm:text-xl lg:text-2xl">
          {formatNumber(paquetesVendidos)}
        </p>
        <p className="mt-1 text-sm text-[#2F3031]/60">Paquetes vendidos</p>
      </div>

      {/* Ingresos */}
      <div className="min-w-0 overflow-hidden rounded-xl bg-[#FEA372]/15 p-5 ring-1 ring-[#FEA372]/30">
        <p className="text-base font-bold tabular-nums text-[#2F3031] break-all sm:text-xl lg:text-2xl">
          {formatCurrency(ingresosTotales)}
        </p>
        <p className="mt-1 text-sm text-[#2F3031]/60">Ingresos</p>
      </div>

      {/* Egresos */}
      <div className="min-w-0 overflow-hidden rounded-xl bg-red-50 p-5 ring-1 ring-red-200">
        <p className="text-base font-bold tabular-nums text-red-700 break-all sm:text-xl lg:text-2xl">
          {formatCurrency(egresosTotales)}
        </p>
        <p className="mt-1 text-sm text-[#2F3031]/60">Egresos</p>
      </div>

      {/* Balance neto */}
      <div
        className={`min-w-0 overflow-hidden rounded-xl p-5 ring-1 ${
          balanceNeto >= 0
            ? 'bg-green-100 ring-green-200'
            : 'bg-red-100 ring-red-200'
        }`}
      >
        <p
          className={`text-base font-bold tabular-nums break-all sm:text-xl lg:text-2xl ${
            balanceNeto >= 0 ? 'text-green-700' : 'text-red-700'
          }`}
        >
          {formatCurrency(balanceNeto)}
        </p>
        <p
          className={`mt-1 text-sm ${
            balanceNeto >= 0 ? 'text-green-600/60' : 'text-red-600/60'
          }`}
        >
          Balance neto
        </p>
      </div>

      {/* Dinero en materiales */}
      <div className="min-w-0 overflow-hidden rounded-xl bg-amber-50 p-5 ring-1 ring-amber-200">
        <p className="text-base font-bold tabular-nums text-[#2F3031] break-all sm:text-xl lg:text-2xl">
          {formatCurrency(materialesValor)}
        </p>
        <p className="mt-1 text-sm text-[#2F3031]/60">Dinero en materiales</p>
        {materialesSinCosto > 0 && (
          <p className="mt-1 text-xs text-amber-700/70">
            {materialesSinCosto} sin costo
          </p>
        )}
      </div>
    </div>
  );
}