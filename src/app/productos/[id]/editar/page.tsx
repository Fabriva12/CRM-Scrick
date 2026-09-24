import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { ProductoForm } from '@/components/organisms/ProductoForm';
import { updateProducto } from '@/actions/productos';
import { buscarRecetaPorProducto } from '@/lib/recetas';
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

  // Para paquetes con receta, el form muestra el costo calculado: traemos
  // el costo por gramo de cada ingrediente.
  const receta = buscarRecetaPorProducto(producto.nombre ?? '');
  let costosIngredientes: Record<string, number | null | undefined> | undefined;
  if (receta) {
    const { data: ingredientes } = await supabase
      .from('productos')
      .select('nombre, costo')
      .in('nombre', receta.ingredientes.map((i) => i.nombre));
    costosIngredientes = {};
    for (const ing of ingredientes ?? []) {
      costosIngredientes[ing.nombre] =
        ing.costo != null ? Number(ing.costo) : null;
    }
  }

  const updateProductoWithId = updateProducto.bind(null, id);

  return (
    <div className="space-y-6">
      <ProductoForm
        producto={producto as unknown as Producto}
        action={updateProductoWithId}
        costosIngredientes={costosIngredientes}
      />
    </div>
  );
}
