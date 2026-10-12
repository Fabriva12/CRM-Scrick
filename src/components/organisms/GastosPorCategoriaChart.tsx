import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import { PieChart } from 'lucide-react';
import type { GastoPorCategoria } from '@/lib/gastos-resumen';

const COLORES: Record<string, string> = {
  Ingredientes: '#EF4444',
  Produccion: '#F97316',
  Servicios: '#F59E0B',
  Renta: '#84CC16',
  Nomina: '#22C55E',
  Marketing: '#06B6D4',
  Transporte: '#3B82F6',
  Oficina: '#6366F1',
  Impuestos: '#8B5CF6',
  Mantenimiento: '#A855F7',
  Comisiones: '#EC4899',
  Otros: '#9CA3AF',
};

function color(categoria: string): string {
  return COLORES[categoria] ?? '#9CA3AF';
}

interface GastosPorCategoriaChartProps {
  datos: GastoPorCategoria[];
}

export function GastosPorCategoriaChart({
  datos,
}: GastosPorCategoriaChartProps) {
  const total = datos.reduce((sum, d) => sum + d.monto, 0);

  const segmentos: string[] = [];
  let acumulado = 0;
  for (const d of datos) {
    const inicio = total > 0 ? (acumulado / total) * 100 : 0;
    acumulado += d.monto;
    const fin = total > 0 ? (acumulado / total) * 100 : 0;
    segmentos.push(`${color(d.categoria)} ${inicio}% ${fin}%`);
  }
  const fondo = `conic-gradient(${segmentos.join(', ')})`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="size-5 text-muted-foreground" />
          Gasto por tipo
        </CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <PieChart className="size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Sin gastos en el período
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-center">
              <div
                className="relative size-40 rounded-full"
                style={{ background: fondo }}
              >
                <div className="absolute inset-[22%] rounded-full bg-card" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="px-2 text-center text-lg font-bold tabular-nums">
                    {formatCurrency(total)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    total gastado
                  </span>
                </div>
              </div>
            </div>
            <ul className="mt-4 space-y-2">
              {datos.map((d) => (
                <li
                  key={d.categoria}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="size-3 rounded-full"
                      style={{ backgroundColor: color(d.categoria) }}
                    />
                    {d.categoria}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatCurrency(d.monto)} ·{' '}
                    {Math.round((d.monto / total) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}