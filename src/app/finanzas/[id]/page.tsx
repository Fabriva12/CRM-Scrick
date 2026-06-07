import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { GastoDetailCard } from '@/components/organisms/GastoDetailCard';
import type { Gasto } from '@/lib/types/gastos';

export const dynamic = 'force-dynamic';

export default async function GastoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = createServiceClient();
  const { data: gasto, error } = await supabase
    .from('gastos')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !gasto) {
    notFound();
  }

  return <GastoDetailCard gasto={gasto as unknown as Gasto} />;
}
