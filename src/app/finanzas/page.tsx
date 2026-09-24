import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import { ResumenCards } from '@/components/organisms/ResumenCards';
import { GastosTable } from '@/components/organisms/GastosTable';
import { FiltroMes } from '@/components/organisms/FiltroMes';
import { Button } from '@/components/ui/button';
import { ExportButton } from '@/components/molecules/ExportButton';
import { Card, CardContent } from '@/components/ui/card';
import { MargenMensualTable } from '@/components/organisms/MargenMensualTable';
import type { Gasto, ResumenFinanzas } from '@/lib/types/gastos';
import type { MargenMensual } from '@/lib/types/ventas';
import { RECETAS, buscarRecetaPorProducto, calcularCostoReceta } from '@/lib/recetas';
import { promedioPrecioUnitario, unidadesDeVenta } from '@/lib/promedios';
import { Plus, Wallet } from 'lucide-react';

export const dynamic = 'force-dynamic';

function firstDayOfMonth(mes: string): string {
  return `${mes}-01`;
}

function lastDayOfMonth(mes: string): string {
  const [year, month] = mes.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return `${mes}-${String(lastDay).padStart(2, '0')}`;
}

interface FinanzasPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function FinanzasPage({ searchParams }: FinanzasPageProps) {
  const { mes } = await searchParams;
  const mesVal =
    typeof mes === 'string' && /^\d{4}-\d{2}$/.test(mes) ? mes : undefined;
  const first = mesVal ? firstDayOfMonth(mesVal) : '0001-01-01';
  const last = mesVal ? lastDayOfMonth(mesVal) : '9999-12-31';

  const supabase = createServiceClient();

  // Fetch income from ventas where estado = 'pagado'
  const { data: ventasData } = await supabase
    .from('ventas')
    .select('monto_total')
    .eq('estado', 'pagado')
    .gte('fecha', first)
    .lte('fecha', last);

  const ingresos_totales =
    ventasData?.reduce((sum, v) => sum + Number(v.monto_total), 0) ?? 0;
  const cantidad_ventas = ventasData?.length ?? 0;

  // Fetch expenses from gastos
  const { data: gastosData, error: gastosError } = await supabase
    .from('gastos')
    .select('*')
    .gte('fecha', first)
    .lte('fecha', last)
    .order('fecha', { ascending: false });

  if (gastosError) {
    throw new Error(`Error al cargar gastos: ${gastosError.message}`);
  }

  const egresos_totales =
    gastosData?.reduce((sum, g) => sum + Number(g.monto), 0) ?? 0;
  const cantidad_gastos = gastosData?.length ?? 0;

  const resumen: ResumenFinanzas = {
    ingresos_totales,
    cantidad_ventas,
    egresos_totales,
    cantidad_gastos,
    balance_neto: ingresos_totales - egresos_totales,
  };

  // Fetch paid sales with products + costs for monthly margin
  const { data: ventasMargen } = await supabase
    .from('ventas')
    .select(
      'fecha, monto_total, venta_productos(cantidad, subtotal, precio_unitario, productos(nombre, costo))'
    )
    .eq('estado', 'pagado');

  // Costos de todo el catálogo: costo directo del producto o de ingredientes de receta
  const { data: productosCosto } = await supabase
    .from('productos')
    .select('nombre, costo');

  const costosPorNombre: Record<string, number | null> = {};
  for (const p of productosCosto ?? []) {
    costosPorNombre[p.nombre] = p.costo == null ? null : Number(p.costo);
  }

  // Ingredientes sin costo cargado: bloquean el margen calculado por receta
  const faltantesSet = new Set<string>();
  for (const receta of RECETAS) {
    for (const ing of receta.ingredientes) {
      if (costosPorNombre[ing.nombre] == null) faltantesSet.add(ing.nombre);
    }
  }

  // Precio promedio ponderado de las líneas reales; se usa para estimar los
  // paquetes de las ventas históricas que no tienen detalle (mismo criterio
  // que la sección Promedios del dashboard) y se recalcula con cada venta real.
  const precioPromedio = promedioPrecioUnitario(ventasMargen ?? []);

  const margenPorMes = new Map<string, MargenMensual>();
  for (const venta of ventasMargen ?? []) {
    const mes = venta.fecha.slice(0, 7);
    const lineas = venta.venta_productos ?? [];
    const conDetalle = lineas.length > 0;

    let paquetes = 0;
    let totalFacturado = 0;
    let costoIngredientes: number | null = 0;

    if (conDetalle) {
      for (const vp of lineas) {
        const cantidad = Number(vp.cantidad) || 0;
        // venta_productos.producto_id → productos es muchos-a-uno: PostgREST
        // devuelve objeto aunque el tipado infiere array. Soporta ambas formas.
        const prod = vp.productos as unknown as
          | { nombre?: string | null; costo?: number | null }
          | ({ nombre?: string | null; costo?: number | null } | null)[];
        const p = Array.isArray(prod) ? prod[0] : prod;

        // Costo por unidad: costo manual del producto; si no tiene, receta
        let costoUnidad: number | null =
          p?.costo == null ? null : Number(p.costo);
        if (costoUnidad == null && p?.nombre) {
          const receta = buscarRecetaPorProducto(p.nombre);
          if (receta) costoUnidad = calcularCostoReceta(receta, costosPorNombre);
        }

        paquetes += cantidad;
        totalFacturado += Number(vp.subtotal) || 0;
        if (costoIngredientes !== null) {
          costoIngredientes =
            costoUnidad == null
              ? null
              : costoIngredientes + cantidad * costoUnidad;
        }
      }
    } else {
      // Ventas históricas sin detalle de productos: se estima el total de
      // paquetes con monto ÷ precio promedio. Sin líneas no hay costo por
      // receta, así que el margen del mes con estas ventas queda sin calcular.
      paquetes += unidadesDeVenta(venta, precioPromedio);
      totalFacturado += Number(venta.monto_total) || 0;
      costoIngredientes = null;
    }

    const prev = margenPorMes.get(mes);
    if (prev) {
      prev.paquetes += paquetes;
      prev.totalFacturado += totalFacturado;
      prev.paquetesEstimados = prev.paquetesEstimados || !conDetalle;
      prev.costoIngredientes =
        prev.costoIngredientes != null && costoIngredientes != null
          ? prev.costoIngredientes + costoIngredientes
          : null;
    } else {
      margenPorMes.set(mes, {
        mes,
        paquetes,
        totalFacturado,
        costoIngredientes,
        paquetesEstimados: !conDetalle,
        precioPromedio: 0,
        margenPct: null,
      });
    }
  }

  const margenes: MargenMensual[] = [...margenPorMes.values()]
    .sort((a, b) => b.mes.localeCompare(a.mes))
    .map((m) => ({
      ...m,
      precioPromedio: m.paquetes > 0 ? m.totalFacturado / m.paquetes : 0,
      margenPct:
        m.totalFacturado > 0 && m.costoIngredientes != null
          ? (m.totalFacturado - m.costoIngredientes) / m.totalFacturado
          : null,
    }));

  const typedGastos = gastosData as unknown as Gasto[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl tracking-wide">Finanzas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Resumen de ingresos, egresos y balance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FiltroMes basePath="/finanzas" mes={mesVal} />
          {typedGastos.length > 0 && (
            <ExportButton
              data={typedGastos as unknown as Record<string, unknown>[]}
              columns={[
                { key: 'categoria', label: 'Categoría' },
                { key: 'descripcion', label: 'Descripción' },
                { key: 'monto', label: 'Monto', format: 'currency' },
                { key: 'fecha', label: 'Fecha', format: 'date' },
                { key: 'notas', label: 'Notas' },
              ]}
              filename="gastos-scrick"
            />
          )}
          <Button render={<Link href="/finanzas/nuevo" />}>
            <Plus className="size-4" />
            Nuevo Gasto
          </Button>
        </div>
      </div>

      {/* Resumen Cards */}
      <ResumenCards resumen={resumen} />

      {/* Margen mensual */}
      <MargenMensualTable
        months={margenes}
        faltantes={[...faltantesSet].sort()}
      />

      {/* Gastos Section */}
      <div>
        <h2 className="font-heading mb-4 text-xl tracking-wide">Gastos</h2>

        {typedGastos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Wallet className="mb-4 size-12 text-muted-foreground/40" />
              <p className="mb-2 text-lg font-medium">No hay gastos registrados</p>
              <p className="mb-6 text-sm text-muted-foreground">
                Registra tu primer gasto para empezar a llevar control financiero.
              </p>
              <Button render={<Link href="/finanzas/nuevo" />}>
                <Plus className="size-4" />
                Registrar primer gasto
              </Button>
            </CardContent>
          </Card>
        ) : (
          <GastosTable gastos={typedGastos} />
        )}
      </div>
    </div>
  );
}