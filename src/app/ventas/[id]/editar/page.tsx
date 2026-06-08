import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { VentaForm } from '@/components/organisms/VentaForm';
import { updateVenta } from '@/actions/ventas';
import type { Cliente } from '@/lib/types/clientes';
import type { Producto } from '@/lib/types/productos';
import type { VentaWithDetails } from '@/lib/types/ventas';

export const dynamic = 'force-dynamic';

const NOMBRES_RECETAS = ['Galleta Proteica Receta 1', 'Galleta Proteica Receta 2'];

export default async function EditarVentaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = createServiceClient();

  const [ventaResult, clientesResult, productosResult] = await Promise.all([
    supabase
      .from('ventas')
      .select(
        '*, clientes!inner(nombre), venta_productos(*, productos!inner(nombre, sku))'
      )
      .eq('id', id)
      .single(),
    supabase
      .from('clientes')
      .select('*')
      .order('nombre', { ascending: true }),
    supabase
      .from('productos')
      .select('*')
      .in('nombre', NOMBRES_RECETAS),
  ]);

  if (ventaResult.error || !ventaResult.data) {
    notFound();
  }

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

  const updateVentaWithId = updateVenta.bind(null, id);

  return (
    <div className="space-y-6">
      <VentaForm
        clientes={clientesResult.data as unknown as Cliente[]}
        productos={productosResult.data as unknown as Producto[]}
        venta={ventaResult.data as unknown as VentaWithDetails}
        action={updateVentaWithId}
      />
    </div>
  );
}
