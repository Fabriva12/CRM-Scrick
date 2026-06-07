import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { ProductoForm } from '@/components/organisms/ProductoForm';
import { updateProducto } from '@/actions/productos';
import type { Producto } from '@/lib/types/productos';

export const dynamic = 'force-dynamic';

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = createServiceClient();
  const { data: producto, error } = await supabase
    .from('productos')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !producto) {
    notFound();
  }

  const updateProductoWithId = updateProducto.bind(null, id);

  return (
    <div className="space-y-6">
      <ProductoForm
        producto={producto as unknown as Producto}
        action={updateProductoWithId}
      />
    </div>
  );
}
