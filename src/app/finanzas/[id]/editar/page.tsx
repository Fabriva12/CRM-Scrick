import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { GastoForm } from '@/components/organisms/GastoForm';
import { updateGasto } from '@/actions/gastos';
import type { Gasto } from '@/lib/types/gastos';

export const dynamic = 'force-dynamic';

export default async function EditarGastoPage({
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

  const editAction = updateGasto.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl">
      <GastoForm gasto={gasto as unknown as Gasto} action={editAction} />
    </div>
  );
}
