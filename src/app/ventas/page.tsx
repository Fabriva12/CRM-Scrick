import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import { VentaTable } from '@/components/organisms/VentaTable';
import { FiltroMes } from '@/components/organisms/FiltroMes';
import { Button } from '@/components/ui/button';
import { ExportButton } from '@/components/molecules/ExportButton';
import type { Venta } from '@/lib/types/ventas';
import { Plus, Receipt } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

function firstDayOfMonth(mes: string): string {
  return `${mes}-01`;
}

function lastDayOfMonth(mes: string): string {
  const [year, month] = mes.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return `${mes}-${String(lastDay).padStart(2, '0')}`;
}

interface VentasPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function VentasPage({ searchParams }: VentasPageProps) {
  const { mes } = await searchParams;
  const mesVal =
    typeof mes === 'string' && /^\d{4}-\d{2}$/.test(mes) ? mes : undefined;
  const first = mesVal ? firstDayOfMonth(mesVal) : '0001-01-01';
  const last = mesVal ? lastDayOfMonth(mesVal) : '9999-12-31';

  const supabase = createServiceClient();
  const { data: ventas, error } = await supabase
    .from('ventas')
    .select('*, clientes!inner(nombre)')
    .gte('fecha', first)
    .lte('fecha', last)
    .order('fecha', { ascending: false });

  if (error) {
    throw new Error(`Error al cargar ventas: ${error.message}`);
  }

  const typedVentas = ventas as unknown as Venta[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl tracking-wide">Ventas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona las ventas realizadas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FiltroMes basePath="/ventas" mes={mesVal} />
          {typedVentas.length > 0 && (
            <ExportButton
              data={typedVentas as unknown as Record<string, unknown>[]}
              columns={[
                { key: 'clientes.nombre', label: 'Cliente' },
                { key: 'fecha', label: 'Fecha', format: 'date' },
                { key: 'estado', label: 'Estado' },
                { key: 'monto_total', label: 'Monto', format: 'currency' },
                { key: 'notas', label: 'Notas' },
              ]}
              filename="ventas-scrick"
            />
          )}
          <Button render={<Link href="/ventas/nuevo" />}>
            <Plus className="size-4" />
            Nueva Venta
          </Button>
        </div>
      </div>

      {typedVentas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Receipt className="mb-4 size-12 text-muted-foreground/40" />
            <p className="mb-2 text-lg font-medium">No hay ventas registradas</p>
            <p className="mb-6 text-sm text-muted-foreground">
              Crea tu primera venta para empezar a registrar transacciones.
            </p>
            <Button render={<Link href="/ventas/nuevo" />}>
              <Plus className="size-4" />
              Crear primera venta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <VentaTable ventas={typedVentas} />
      )}
    </div>
  );
}