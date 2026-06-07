import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { ClienteDetailCard } from '@/components/organisms/ClienteDetailCard';
import type { Cliente } from '@/lib/types/clientes';

export const dynamic = 'force-dynamic';

export default async function ClienteDetailPage({
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

  return <ClienteDetailCard cliente={cliente as unknown as Cliente} />;
}
