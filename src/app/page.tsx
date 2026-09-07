import { createServiceClient } from '@/lib/supabase/server';
import { DashboardCards } from '@/components/organisms/DashboardCards';
import { IngresosVsEgresos } from '@/components/organisms/IngresosVsEgresos';
import { UltimasVentas } from '@/components/organisms/UltimasVentas';
import { InventarioRapido } from '@/components/organisms/InventarioRapido';
import { FiltroMes } from '@/components/organisms/FiltroMes';

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

  // Fetch all data in parallel
  const [
    { count: totalClientes },
    ventasDelMes,
    ingresos,
    pendientes,
    { data: gastos },
    { data: ultimasVentas },
    { data: productos },
  ] = await Promise.all([
    supabase.from('clientes').select('*', { count: 'exact', head: true }),
    supabase
      .from('ventas')
      .select('monto_total')
      .gte('fecha', first)
      .lte('fecha', last),
    supabase
      .from('ventas')
      .select('monto_total')
      .eq('estado', 'pagado')
      .gte('fecha', first)
      .lte('fecha', last),
    supabase
      .from('ventas')
      .select('monto_total')
      .eq('estado', 'pendiente')
      .gte('fecha', first)
      .lte('fecha', last),
    supabase
      .from('gastos')
      .select('monto')
      .gte('fecha', first)
      .lte('fecha', last),
    supabase
      .from('ventas')
      .select('*, clientes(nombre)')
      .gte('fecha', first)
      .lte('fecha', last)
      .order('fecha', { ascending: false })
      .limit(5),
    supabase
      .from('productos')
      .select('id, nombre, sku, stock, unidad, costo')
      .order('stock', { ascending: true }),
  ]);

  // Compute metrics
  const ventasDelMesTotal =
    ventasDelMes.data?.reduce((sum, v) => sum + Number(v.monto_total), 0) ?? 0;
  const ingresosTotal =
    ingresos.data?.reduce((sum, v) => sum + Number(v.monto_total), 0) ?? 0;
  const pendientesTotal =
    pendientes.data?.reduce((sum, v) => sum + Number(v.monto_total), 0) ?? 0;
  const egresosTotal =
    gastos?.reduce((sum, g) => sum + Number(g.monto), 0) ?? 0;
  const balanceNeto = ingresosTotal - egresosTotal;
  const unidadesVendidas = ingresosTotal > 0 ? Math.round(ingresosTotal / 1400) : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-heading text-3xl tracking-wide text-foreground">
          Dashboard
        </h1>
        <FiltroMes basePath="/" mes={mesVal} />
      </div>

      <DashboardCards
        totalClientes={totalClientes ?? 0}
        ventasDelMes={ventasDelMesTotal}
        ingresosTotales={ingresosTotal}
        pendientesTotal={pendientesTotal}
        cantidadPendientes={pendientes.data?.length ?? 0}
        balanceNeto={balanceNeto}
        unidadesVendidas={unidadesVendidas}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <IngresosVsEgresos ingresos={ingresosTotal} egresos={egresosTotal} />
        <UltimasVentas ventas={ultimasVentas ?? []} />
      </div>

      <InventarioRapido productos={productos ?? []} />
    </div>
  );
}
