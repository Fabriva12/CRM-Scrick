import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import { LineChart } from 'lucide-react';
import type { PuntoGastoMes } from '@/lib/gastos-resumen';

const W = 600;
const H = 164;
const PAD_X = 10;
const PAD_TOP = 14;
const PAD_BOTTOM = 22;
const baseY = H - PAD_BOTTOM;
const innerH = H - PAD_TOP - PAD_BOTTOM;

interface GastoPorMesChartProps {
  serie: PuntoGastoMes[];
  mesDestacado?: string | null;
}

export function GastoPorMesChart({ serie, mesDestacado }: GastoPorMesChartProps) {
  const max = Math.max(...serie.map((p) => p.gastos), 1);
  const hayDatos = serie.some((p) => p.gastos > 0);

  const puntos = serie.map((p, i) => {
    const x =
      serie.length === 1
        ? W / 2
        : PAD_X + (i / (serie.length - 1)) * (W - PAD_X * 2);
    const y = p.gastos > 0 ? baseY - (p.gastos / max) * innerH : baseY;
    return { ...p, x, y };
  });

  const linePath = puntos
    .map(
      (pt, i) =>
        `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`
    )
    .join(' ');
  const areaPath =
    puntos.length > 0
      ? `${linePath} L ${puntos[puntos.length - 1].x.toFixed(2)} ${baseY} L ${puntos[0].x.toFixed(2)} ${baseY} Z`
      : '';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LineChart className="size-5 text-muted-foreground" />
          Gasto por mes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hayDatos ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <LineChart className="size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Sin datos aún</p>
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            style={{ aspectRatio: `${W} / ${H}` }}
            role="img"
            aria-label="Gasto por mes"
          >
            {/* línea base */}
            <line
              x1={PAD_X}
              x2={W - PAD_X}
              y1={baseY}
              y2={baseY}
              className="stroke-muted-foreground/20"
              strokeWidth={1}
            />

            {/* área bajo la línea */}
            <path d={areaPath} fill="#EF4444" fillOpacity={0.08} />

            {/* línea de gastos */}
            <path
              d={linePath}
              fill="none"
              stroke="#EF4444"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* puntos y etiquetas */}
            {puntos.map((pt) => {
              const destacado = mesDestacado === pt.mes;
              return (
                <g key={pt.mes}>
                  <title>
                    {`${pt.etiqueta} ${pt.mes.slice(0, 4)} · ${formatCurrency(pt.gastos)}`}
                  </title>
                  {pt.gastos > 0 && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={destacado ? 4.5 : 3}
                      fill={destacado ? '#FEE2E2' : '#EF4444'}
                      stroke="#EF4444"
                      strokeWidth={destacado ? 2 : 0}
                    />
                  )}
                  <text
                    x={pt.x}
                    y={H - 6}
                    textAnchor="middle"
                    fontSize={10}
                    className={
                      destacado
                        ? 'fill-foreground font-semibold'
                        : 'fill-muted-foreground'
                    }
                  >
                    {pt.etiqueta}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </CardContent>
    </Card>
  );
}