import { createServiceClient } from '@/lib/supabase/server';
import { DashboardCards } from '@/components/organisms/DashboardCards';
import { IngresosPorMesChart } from '@/components/organisms/IngresosPorMesChart';
import { VentasPorFuenteChart } from '@/components/organisms/VentasPorFuenteChart';
import { ResumenMensualTable } from '@/components/organisms/ResumenMensualTable';
import { PromediosSection } from '@/components/organisms/PromediosSection';
import { FiltroMes } from '@/components/organisms/FiltroMes';
import {
  agruparPromediosPorMes,
  promedioPrecioUnitario,
  serieIngresosMensuales,
  unidadesDeVenta,
} from '@/lib/promedios';
import { agruparVentasPorFuente } from '@/lib/ventas';
import { agruparResumenMensual } from '@/lib/resumen-mensual';
import { calcularValorMateriales } from '@/lib/inventario';

export const dynamic = 'force-dynamic';

function firstDayOfMonth(mes: string): string {
  return `${mes}-01`;
}

function lastDayOfMonth(mes: string): string {
  const [year, month] = mes.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return `${mes}-${String(lastDay).padStart(2, '0')}`;
}

interface DashboardPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { mes } = await searchParams;
  const mesVal =
    typeof mes === 'string' && /^\d{4}-\d{2}$/.test(mes) ? mes : undefined;
  const first = mesVal ? firstDayOfMonth(mesVal) : '0001-01-01';
  const last = mesVal ? lastDayOfMonth(mesVal) : '9999-12-31';

  const supabase = createServiceClient();

  const [
    { data: ingresos },
    { data: gastos },
    { data: ventasPromedios },
    { data: productos },
  ] = await Promise.all([
    supabase
      .from('ventas')
      .select('fecha, monto_total, venta_productos(cantidad), clientes(fuente)')
      .eq('estado', 'pagado')
      .gte('fecha', first)
      .lte('fecha', last),
    supabase
      .from('gastos')
      .select('monto, fecha, categoria')
      .gte('fecha', first)
      .lte('fecha', last),
    supabase
      .from('ventas')
      .select('fecha, monto_total, venta_productos(cantidad, precio_unitario)')
      .eq('estado', 'pagado'),
    // Valor actual del inventario de ingredientes (no depende del mes).
    supabase
      .from('productos')
      .select('nombre, costo, costo_total, cantidad_comprada, gramos_restantes'),
  ]);

  const ingresosTotal =
    ingresos?.reduce((sum, v) => sum + Number(v.monto_total), 0) ?? 0;
  const egresosTotal = gastos?.reduce((sum, g) => sum + Number(g.monto), 0) ?? 0;
  const balanceNeto = ingresosTotal - egresosTotal;

  // Precio promedio por unidad desde las líneas reales; estima las unidades
  // de las ventas históricas que no tienen detalle (monto ÷ precio promedio).
  const precioPromedio = promedioPrecioUnitario(ventasPromedios ?? []);
  const unidadesVendidas =
    ingresos?.reduce((sum, v) => sum + unidadesDeVenta(v, precioPromedio), 0) ?? 0;

  // Promedios mensuales de ingresos y unidades (todo el histórico); la
  // sección filtra por año por su cuenta.
  const promediosPorMes = agruparPromediosPorMes(
    ventasPromedios ?? [],
    precioPromedio
  );

  // Serie del gráfico de barras: 12 meses del año filtrado, o los últimos
  // 12 meses con datos cuando no hay filtro de mes.
  const serieIngresos = serieIngresosMensuales(
    promediosPorMes,
    mesVal ? mesVal.slice(0, 4) : null
  );

  // Ventas pagadas del período agrupadas por fuente del cliente.
  const ventasPorFuente = agruparVentasPorFuente(
    (ingresos ?? []) as unknown as {
      clientes?: { fuente: string | null } | null;
    }[]
  );

  // Resumen financiero por mes (ingreso, egreso, envíos, paquetes) para la tabla.
  const resumenMensual = agruparResumenMensual(
    ingresos ?? [],
    gastos ?? [],
    precioPromedio
  );

  // Dinero invertido en materia prima disponible (stock actual, sin filtro de mes).
  const materiales = calcularValorMateriales(productos ?? []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-heading text-3xl tracking-wide text-foreground">
          Dashboard
        </h1>
        <FiltroMes basePath="/" mes={mesVal} />
      </div>

      <DashboardCards
        paquetesVendidos={unidadesVendidas}
        ingresosTotales={ingresosTotal}
        egresosTotales={egresosTotal}
        balanceNeto={balanceNeto}
        materialesValor={materiales.valor}
        materialesSinCosto={materiales.sinCosto}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <IngresosPorMesChart serie={serieIngresos} mesDestacado={mesVal ?? null} />
          <VentasPorFuenteChart datos={ventasPorFuente} />
        </div>
        <PromediosSection
          data={promediosPorMes}
          precioPromedio={precioPromedio}
        />
      </div>

      <ResumenMensualTable filas={resumenMensual} />
    </div>
  );
}
