import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { ProductoDetailCard } from '@/components/organisms/ProductoDetailCard';
import type { Producto } from '@/lib/types/productos';

export const dynamic = 'force-dynamic';

export default async function ProductoDetailPage({
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

  return <ProductoDetailCard producto={producto as unknown as Producto} />;
}
