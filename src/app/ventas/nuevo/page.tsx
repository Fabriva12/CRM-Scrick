import { createServiceClient } from '@/lib/supabase/server';
import { VentaForm } from '@/components/organisms/VentaForm';
import { createVenta } from '@/actions/ventas';
import type { Cliente } from '@/lib/types/clientes';
import type { Producto } from '@/lib/types/productos';

export const dynamic = 'force-dynamic';

export default async function NuevaVentaPage() {
  const supabase = createServiceClient();

  const [clientesResult, productosResult] = await Promise.all([
    supabase
      .from('clientes')
      .select('*')
      .order('nombre', { ascending: true }),
    supabase
      .from('productos')
      .select('*')
      .order('nombre', { ascending: true }),
  ]);

  if (clientesResult.error) {
    throw new Error(
      `Error al cargar clientes: ${clientesResult.error.message}`
    );
  }

  if (productosResult.error) {
    throw new Error(
      `Error al cargar productos: ${productosResult.error.message}`
    );
  }

  return (
    <div className="space-y-6">
      <VentaForm
        clientes={clientesResult.data as unknown as Cliente[]}
        productos={productosResult.data as unknown as Producto[]}
        action={createVenta}
      />
    </div>
  );
}
