import { createServiceClient } from '@/lib/supabase/server';
import { DashboardCards } from '@/components/organisms/DashboardCards';
import { IngresosVsEgresos } from '@/components/organisms/IngresosVsEgresos';
import { UltimasVentas } from '@/components/organisms/UltimasVentas';
import { InventarioRapido } from '@/components/organisms/InventarioRapido';

export const dynamic = 'force-dynamic';

function firstDayOfMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

export default async function DashboardPage() {
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
    supabase.from('ventas').select('monto_total').gte('fecha', firstDayOfMonth()),
    supabase.from('ventas').select('monto_total').eq('estado', 'pagado'),
    supabase.from('ventas').select('monto_total').eq('estado', 'pendiente'),
    supabase.from('gastos').select('monto'),
    supabase
      .from('ventas')
      .select('*, clientes(nombre)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('productos')
      .select('nombre, sku, stock, unidad')
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

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-3xl tracking-wide text-foreground">
        Dashboard
      </h1>

      <DashboardCards
        totalClientes={totalClientes ?? 0}
        ventasDelMes={ventasDelMesTotal}
        ingresosTotales={ingresosTotal}
        pendientesTotal={pendientesTotal}
        cantidadPendientes={pendientes.data?.length ?? 0}
        balanceNeto={balanceNeto}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <IngresosVsEgresos ingresos={ingresosTotal} egresos={egresosTotal} />
        <UltimasVentas ventas={ultimasVentas ?? []} />
      </div>

      <InventarioRapido productos={productos ?? []} />
    </div>
  );
}
