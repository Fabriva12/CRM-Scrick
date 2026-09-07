'use client';

interface DashboardCardsProps {
  totalClientes: number;
  ventasDelMes: number;
  ingresosTotales: number;
  pendientesTotal: number;
  cantidadPendientes: number;
  balanceNeto: number;
  unidadesVendidas: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'CRC',
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('es-MX').format(value);
}

export function DashboardCards({
  totalClientes,
  ventasDelMes,
  ingresosTotales,
  pendientesTotal,
  cantidadPendientes,
  balanceNeto,
  unidadesVendidas,
}: DashboardCardsProps) {
  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
      {/* Clientes */}
      <div className="min-w-0 overflow-hidden rounded-xl bg-[#FEA372]/15 p-5 ring-1 ring-[#FEA372]/30">
        <span className="text-2xl">👥</span>
        <p className="mt-2 text-lg font-bold tabular-nums sm:text-2xl lg:text-3xl text-[#2F3031] break-all">
          {formatNumber(totalClientes)}
        </p>
        <p className="mt-1 text-sm text-[#2F3031]/60">Clientes registrados</p>
      </div>

      {/* Unidades vendidas */}
      <div className="min-w-0 overflow-hidden rounded-xl bg-purple-50 p-5 ring-1 ring-purple-200">
        <span className="text-2xl">📦</span>
        <p className="mt-2 text-lg font-bold tabular-nums sm:text-2xl lg:text-3xl text-[#2F3031] break-all">
          {formatNumber(unidadesVendidas)}
        </p>
        <p className="mt-1 text-sm text-[#2F3031]/60">
          Paquetes vendidos
        </p>
      </div>

      {/* Ventas del mes */}
      <div className="min-w-0 overflow-hidden rounded-xl bg-blue-50 p-5 ring-1 ring-blue-200">
        <span className="text-2xl">📈</span>
        <p className="mt-2 text-lg font-bold tabular-nums sm:text-2xl lg:text-3xl text-[#2F3031] break-all">
          {formatCurrency(ventasDelMes)}
        </p>
        <p className="mt-1 text-sm text-[#2F3031]/60">Ventas</p>
      </div>

      {/* Ingresos */}
      <div className="min-w-0 overflow-hidden rounded-xl bg-[#FEA372]/15 p-5 ring-1 ring-[#FEA372]/30">
        <span className="text-2xl">💰</span>
        <p className="mt-2 text-lg font-bold tabular-nums sm:text-2xl lg:text-3xl text-[#2F3031] break-all">
          {formatCurrency(ingresosTotales)}
        </p>
        <p className="mt-1 text-sm text-[#2F3031]/60">Ingresos</p>
      </div>

      {/* Por cobrar */}
      <div className="min-w-0 overflow-hidden rounded-xl bg-amber-50 p-5 ring-1 ring-amber-200">
        <span className="text-2xl">🕐</span>
        <p className="mt-2 text-lg font-bold tabular-nums sm:text-2xl lg:text-3xl text-[#2F3031] break-all">
          {formatCurrency(pendientesTotal)}
        </p>
        <p className="mt-1 text-sm text-[#2F3031]/60">
          Por cobrar{cantidadPendientes > 0 && (
            <span className="ml-1.5 text-xs text-amber-600">
              ({cantidadPendientes} pendiente{cantidadPendientes !== 1 ? 's' : ''})
            </span>
          )}
        </p>
      </div>

      {/* Balance Neto */}
      <div
        className={`min-w-0 overflow-hidden rounded-xl p-5 ring-1 ${
          balanceNeto >= 0
            ? 'bg-green-100 ring-green-200'
            : 'bg-red-100 ring-red-200'
        }`}
      >
        <span className="text-2xl">✅</span>
        <p
          className={`mt-2 text-lg font-bold tabular-nums sm:text-2xl lg:text-3xl ${
            balanceNeto >= 0
              ? 'text-green-700'
              : 'text-red-700'
          } break-all`}
        >
          {formatCurrency(balanceNeto)}
        </p>
        <p
          className={`mt-1 text-sm ${
            balanceNeto >= 0
              ? 'text-green-600/60'
              : 'text-red-600/60'
          }`}
        >
          Balance neto
        </p>
      </div>

    </div>
  );
}
