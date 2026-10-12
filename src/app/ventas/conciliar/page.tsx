import { createServiceClient } from '@/lib/supabase/server';
import { ConciliarRedes } from '@/components/organisms/ConciliarRedes';
import type { VentaCandidataInput } from '@/lib/conciliar-redes';

export const dynamic = 'force-dynamic';

export default async function ConciliarRedesPage() {
  const supabase = createServiceClient();

  const [ventasResult, clientesResult] = await Promise.all([
    supabase
      .from('ventas')
      .select('id, fecha, monto_total, estado, clientes(nombre)'),
    supabase
      .from('clientes')
      .select('id, nombre')
      .order('nombre', { ascending: true }),
  ]);

  if (ventasResult.error) {
    throw new Error(`Error al cargar ventas: ${ventasResult.error.message}`);
  }

  if (clientesResult.error) {
    throw new Error(`Error al cargar clientes: ${clientesResult.error.message}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl tracking-wide">Conciliar redes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cargá la planilla de ventas por redes para actualizar ventas existentes
          o crear las que falten.
        </p>
      </div>
      <ConciliarRedes
        ventas={ventasResult.data as unknown as VentaCandidataInput[]}
        clientes={clientesResult.data as unknown as { id: string; nombre: string }[]}
      />
    </div>
  );
}
