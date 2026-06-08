'use server';

import { createServiceClient } from '@/lib/supabase/server';
import {
  productoCreateSchema,
  productoUpdateSchema,
} from '@/lib/validations/productos';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { ProductoActionResult } from '@/lib/types/productos';

export async function createProducto(
  prevState: ProductoActionResult | null,
  formData: FormData
): Promise<ProductoActionResult> {
  const rawData = Object.fromEntries(formData);
  const result = productoCreateSchema.safeParse(rawData);

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('productos')
    .insert(result.data)
    .select()
    .single();

  if (error) {
    return { errors: { _form: [error.message] } };
  }

  revalidatePath('/productos');
  redirect('/productos');
}

export async function updateProducto(
  id: string,
  prevState: ProductoActionResult | null,
  formData: FormData
): Promise<ProductoActionResult> {
  const rawData = Object.fromEntries(formData);
  const result = productoUpdateSchema.safeParse(rawData);

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('productos')
    .update(result.data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { errors: { _form: [error.message] } };
  }

  revalidatePath('/productos');
  revalidatePath(`/productos/${id}`);
  redirect('/productos');
}

export async function deleteProducto(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();
  const { error } = await supabase.from('productos').delete().eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/productos');
  return { success: true };
}

export async function ajustarStock(
  productoId: string,
  cantidad: number
): Promise<{ success: boolean; error?: string }> {
  if (cantidad < 1) {
    return { success: false, error: 'La cantidad debe ser al menos 1' };
  }

  const supabase = createServiceClient();

  const { data: producto, error: fetchError } = await supabase
    .from('productos')
    .select('stock')
    .eq('id', productoId)
    .single();

  if (fetchError || !producto) {
    return { success: false, error: 'Producto no encontrado' };
  }

  const { error: updateError } = await supabase
    .from('productos')
    .update({ stock: producto.stock + cantidad })
    .eq('id', productoId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath('/productos');
  return { success: true };
}
