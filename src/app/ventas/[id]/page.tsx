import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { VentaDetailCard } from '@/components/organisms/VentaDetailCard';
import type { VentaWithDetails } from '@/lib/types/ventas';

export const dynamic = 'force-dynamic';

export default async function VentaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = createServiceClient();
  const { data: venta, error } = await supabase
    .from('ventas')
    .select(
      '*, clientes!inner(nombre), venta_productos(*, productos!inner(nombre, sku))'
    )
    .eq('id', id)
    .single();

  if (error || !venta) {
    notFound();
  }

  return (
    <VentaDetailCard venta={venta as unknown as VentaWithDetails} />
  );
}
