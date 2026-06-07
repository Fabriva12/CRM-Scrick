'use client';

interface IngresosVsEgresosProps {
  ingresos: number;
  egresos: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'CRC',
  }).format(value);
}

export function IngresosVsEgresos({ ingresos, egresos }: IngresosVsEgresosProps) {
  const hasData = ingresos > 0 || egresos > 0;
  const max = Math.max(ingresos, egresos, 1);
  const ingresosWidth = (ingresos / max) * 100;
  const egresosWidth = (egresos / max) * 100;

  return (
    <div className="rounded-xl bg-white p-5 ring-1 ring-[#2F3031]/10">
      <h2 className="font-heading mb-4 text-lg tracking-wide text-[#2F3031]">
        📊 Ingresos vs Egresos
      </h2>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-8 text-[#2F3031]/40">
          <span className="text-4xl">🦗</span>
          <p className="mt-2 text-sm">Sin datos aún</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Ingresos */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-green-700">Ingresos</span>
              <span className="font-semibold tabular-nums text-green-700">
                {formatCurrency(ingresos)}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-green-100">
              <div
                className="h-full rounded-full bg-green-500 transition-all duration-500"
                style={{ width: `${Math.max(ingresosWidth, 2)}%` }}
              />
            </div>
          </div>

          {/* Egresos */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-red-700">Egresos</span>
              <span className="font-semibold tabular-nums text-red-700">
                {formatCurrency(egresos)}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-red-100">
              <div
                className="h-full rounded-full bg-red-500 transition-all duration-500"
                style={{ width: `${Math.max(egresosWidth, 2)}%` }}
              />
            </div>
          </div>

          {/* Diferencia */}
          <div className="border-t border-[#2F3031]/10 pt-3 text-xs text-[#2F3031]/50">
            {ingresos >= egresos
              ? 'Los ingresos superan a los egresos 💚'
              : 'Los egresos superan a los ingresos ❤️‍🩹'}
          </div>
        </div>
      )}
    </div>
  );
}
