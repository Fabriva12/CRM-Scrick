'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { gastoCreateSchema, gastoUpdateSchema } from '@/lib/validations/gastos';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { GastoActionResult } from '@/lib/types/gastos';

export async function createGasto(
  prevState: GastoActionResult | null,
  formData: FormData
): Promise<GastoActionResult> {
  const result = gastoCreateSchema.safeParse({
    categoria: formData.get('categoria'),
    descripcion: formData.get('descripcion'),
    monto: formData.get('monto'),
    fecha: formData.get('fecha'),
    notas: formData.get('notas') || null,
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('gastos')
    .insert({
      categoria: result.data.categoria,
      descripcion: result.data.descripcion,
      monto: result.data.monto,
      fecha: result.data.fecha,
      notas: result.data.notas,
    })
    .select()
    .single();

  if (error) {
    return { errors: { _form: [error.message] } };
  }

  revalidatePath('/finanzas');
  redirect('/finanzas');
}

export async function updateGasto(
  id: string,
  prevState: GastoActionResult | null,
  formData: FormData
): Promise<GastoActionResult> {
  const result = gastoUpdateSchema.safeParse({
    categoria: formData.get('categoria'),
    descripcion: formData.get('descripcion'),
    monto: formData.get('monto'),
    fecha: formData.get('fecha'),
    notas: formData.get('notas') || null,
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('gastos')
    .update(result.data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { errors: { _form: [error.message] } };
  }

  revalidatePath('/finanzas');
  revalidatePath(`/finanzas/${id}`);
  redirect('/finanzas');
}

export async function deleteGasto(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();
  const { error } = await supabase.from('gastos').delete().eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/finanzas');
  return { success: true };
}
