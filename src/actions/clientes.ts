'use server';

import { createServiceClient } from '@/lib/supabase/server';
import {
  clienteCreateSchema,
  clienteUpdateSchema,
} from '@/lib/validations/clientes';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { ClienteActionResult } from '@/lib/types/clientes';

export async function createCliente(
  prevState: ClienteActionResult | null,
  formData: FormData
): Promise<ClienteActionResult> {
  const rawData = Object.fromEntries(formData);
  const result = clienteCreateSchema.safeParse(rawData);

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('clientes')
    .insert(result.data)
    .select()
    .single();

  if (error) {
    return { errors: { _form: [error.message] } };
  }

  revalidatePath('/clientes');
  redirect('/clientes');
}

export async function updateCliente(
  id: string,
  prevState: ClienteActionResult | null,
  formData: FormData
): Promise<ClienteActionResult> {
  const rawData = Object.fromEntries(formData);
  const result = clienteUpdateSchema.safeParse(rawData);

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('clientes')
    .update(result.data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { errors: { _form: [error.message] } };
  }

  revalidatePath('/clientes');
  revalidatePath(`/clientes/${id}`);
  redirect('/clientes');
}

export async function deleteCliente(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();

  const { data: cliente } = await supabase
    .from('clientes')
    .select('nombre')
    .eq('id', id)
    .single();

  if (!cliente) {
    return { success: false, error: 'Cliente no encontrado' };
  }

  const { count, error: countError } = await supabase
    .from('ventas')
    .select('*', { count: 'exact', head: true })
    .eq('cliente_id', id);

  if (countError) {
    return { success: false, error: 'Error al verificar ventas del cliente' };
  }

  if (count && count > 0) {
    return {
      success: false,
      error: `No se puede eliminar "${cliente.nombre}" porque tiene ${count} venta${count === 1 ? '' : 's'} asociada${count === 1 ? '' : 's'}.`,
    };
  }

  const { error } = await supabase.from('clientes').delete().eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/clientes');
  return { success: true };
}
