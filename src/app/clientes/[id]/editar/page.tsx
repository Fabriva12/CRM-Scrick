import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { ClienteForm } from '@/components/organisms/ClienteForm';
import { updateCliente } from '@/actions/clientes';
import type { Cliente } from '@/lib/types/clientes';

export const dynamic = 'force-dynamic';

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = createServiceClient();
  const { data: cliente, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !cliente) {
    notFound();
  }

  const updateClienteWithId = updateCliente.bind(null, id);

  return (
    <div className="space-y-6">
      <ClienteForm
        cliente={cliente as unknown as Cliente}
        action={updateClienteWithId}
      />
    </div>
  );
}
