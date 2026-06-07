import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import { ResumenCards } from '@/components/organisms/ResumenCards';
import { GastosTable } from '@/components/organisms/GastosTable';
import { Button } from '@/components/ui/button';
import { ExportButton } from '@/components/molecules/ExportButton';
import { Card, CardContent } from '@/components/ui/card';
import type { Gasto, ResumenFinanzas } from '@/lib/types/gastos';
import { Plus, Wallet } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function FinanzasPage() {
  const supabase = createServiceClient();

  // Fetch income from ventas where estado = 'pagado'
  const { data: ventasData } = await supabase
    .from('ventas')
    .select('monto_total')
    .eq('estado', 'pagado');

  const ingresos_totales =
    ventasData?.reduce((sum, v) => sum + Number(v.monto_total), 0) ?? 0;
  const cantidad_ventas = ventasData?.length ?? 0;

  // Fetch expenses from gastos
  const { data: gastosData, error: gastosError } = await supabase
    .from('gastos')
    .select('*')
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

  const typedGastos = gastosData as unknown as Gasto[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl tracking-wide">Finanzas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Resumen de ingresos, egresos y balance general
          </p>
        </div>
        <div className="flex items-center gap-2">
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
