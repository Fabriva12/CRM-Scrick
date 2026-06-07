'use client';

interface DashboardCardsProps {
  totalClientes: number;
  ventasDelMes: number;
  ingresosTotales: number;
  pendientesTotal: number;
  cantidadPendientes: number;
  balanceNeto: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
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
}: DashboardCardsProps) {
  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {/* Clientes */}
      <div className="rounded-xl bg-[#FEA372]/15 p-5 ring-1 ring-[#FEA372]/30">
        <span className="text-2xl">👥</span>
        <p className="mt-2 text-3xl font-bold tabular-nums text-[#2F3031]">
          {formatNumber(totalClientes)}
        </p>
        <p className="mt-1 text-sm text-[#2F3031]/60">Clientes registrados</p>
      </div>

      {/* Ventas del mes */}
      <div className="rounded-xl bg-blue-50 p-5 ring-1 ring-blue-200">
        <span className="text-2xl">📈</span>
        <p className="mt-2 text-3xl font-bold tabular-nums text-[#2F3031]">
          {formatCurrency(ventasDelMes)}
        </p>
        <p className="mt-1 text-sm text-[#2F3031]/60">Ventas del mes</p>
      </div>

      {/* Ingresos totales */}
      <div className="rounded-xl bg-[#FEA372]/15 p-5 ring-1 ring-[#FEA372]/30">
        <span className="text-2xl">💰</span>
        <p className="mt-2 text-3xl font-bold tabular-nums text-[#2F3031]">
          {formatCurrency(ingresosTotales)}
        </p>
        <p className="mt-1 text-sm text-[#2F3031]/60">Ingresos totales</p>
      </div>

      {/* Por cobrar */}
      <div className="rounded-xl bg-amber-50 p-5 ring-1 ring-amber-200">
        <span className="text-2xl">🕐</span>
        <p className="mt-2 text-3xl font-bold tabular-nums text-[#2F3031]">
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
        className={`rounded-xl p-5 ring-1 ${
          balanceNeto >= 0
            ? 'bg-green-100 ring-green-200'
            : 'bg-red-100 ring-red-200'
        }`}
      >
        <span className="text-2xl">✅</span>
        <p
          className={`mt-2 text-3xl font-bold tabular-nums ${
            balanceNeto >= 0
              ? 'text-green-700'
              : 'text-red-700'
          }`}
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
