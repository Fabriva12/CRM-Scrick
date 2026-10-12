import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart } from 'lucide-react';
import type { FuenteResumen } from '@/lib/ventas';

const COLORES: Record<string, string> = {
  'Redes Sociales': '#FEA372',
  Referido: '#60A5FA',
  'Contacto Directo': '#34D399',
  Web: '#A78BFA',
  Otro: '#9CA3AF',
  Desconocido: '#6B7280',
};

function color(fuente: string): string {
  return COLORES[fuente] ?? '#9CA3AF';
}

interface VentasPorFuenteChartProps {
  datos: FuenteResumen[];
}

export function VentasPorFuenteChart({ datos }: VentasPorFuenteChartProps) {
  const total = datos.reduce((sum, d) => sum + d.cantidad, 0);

  const segmentos: string[] = [];
  let acumulado = 0;
  for (const d of datos) {
    const inicio = total > 0 ? (acumulado / total) * 100 : 0;
    acumulado += d.cantidad;
    const fin = total > 0 ? (acumulado / total) * 100 : 0;
    segmentos.push(`${color(d.fuente)} ${inicio}% ${fin}%`);
  }
  const fondo = `conic-gradient(${segmentos.join(', ')})`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="size-5 text-muted-foreground" />
          Ventas por fuente
        </CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <PieChart className="size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Sin ventas en el período
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
                  <span className="text-2xl font-bold tabular-nums">{total}</span>
                  <span className="text-xs text-muted-foreground">
                    venta{total !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
            <ul className="mt-4 space-y-2">
              {datos.map((d) => (
                <li
                  key={d.fuente}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="size-3 rounded-full"
                      style={{ backgroundColor: color(d.fuente) }}
                    />
                    {d.fuente}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {d.cantidad} · {Math.round((d.cantidad / total) * 100)}%
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
