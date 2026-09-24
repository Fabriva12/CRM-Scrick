'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { esIngrediente } from '@/lib/recetas';
import { calcularCostoRecetaProducto } from '@/lib/costoReceta';
import {
  productoCreateSchema,
  productoUpdateSchema,
  calcularCostoPorGramo,
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

  // Ingredientes: costo por gramo = costo_total / cantidad_comprada
  const costoPorGramo = calcularCostoPorGramo(
    result.data.costo_total,
    result.data.cantidad_comprada
  );
  if (costoPorGramo != null) {
    result.data.costo = costoPorGramo;
    // Al comprar una cantidad, esos gramos quedan disponibles.
    result.data.gramos_restantes ??= result.data.cantidad_comprada;
  }

  // Productos con receta: el costo sale de la fórmula, nunca del form.
  // El servidor lo recalcula y pisa cualquier valor manual.
  const costoReceta = await calcularCostoRecetaProducto(result.data.nombre);
  if (costoReceta != null) {
    result.data.costo = costoReceta;
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

  // Ingredientes: costo por gramo = costo_total / cantidad_comprada
  const costoPorGramo = calcularCostoPorGramo(
    result.data.costo_total,
    result.data.cantidad_comprada
  );
  if (costoPorGramo != null) {
    result.data.costo = costoPorGramo;
  }

  // Productos con receta: el costo sale de la fórmula (corrige valores
  // viejos pisando cualquier costo manual enviado por el formulario).
  const costoReceta = await calcularCostoRecetaProducto(
    result.data.nombre ?? ''
  );
  if (costoReceta != null) {
    result.data.costo = costoReceta;
  }

  // Al editar sin tocar gramos_restantes no se debe pisar el valor guardado:
  // si el formulario no lo envió (null), lo quitamos del update.
  if (result.data.gramos_restantes == null) {
    delete result.data.gramos_restantes;
  }

  // SKU y Unidad ya no se editan en el formulario: si vienen null los
  // quitamos del update para conservar los valores existentes.
  if (result.data.sku == null) {
    delete result.data.sku;
  }
  if (result.data.unidad == null) {
    delete result.data.unidad;
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
  if (cantidad <= 0) {
    return { success: false, error: 'La cantidad debe ser mayor a 0' };
  }

  const supabase = createServiceClient();

  const { data: producto, error: fetchError } = await supabase
    .from('productos')
    .select('id, nombre, stock, gramos_restantes')
    .eq('id', productoId)
    .single();

  if (fetchError || !producto) {
    return { success: false, error: 'Producto no encontrado' };
  }

  const esIngredienteProducto = esIngrediente(producto.nombre);
  const update: Record<string, unknown> = esIngredienteProducto
    ? {
        gramos_restantes:
          Math.round(
            ((Number(producto.gramos_restantes) || 0) + cantidad) * 100
          ) / 100,
      }
    : { stock: producto.stock + cantidad };

  const { error: updateError } = await supabase
    .from('productos')
    .update(update)
    .eq('id', productoId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath('/productos');
  return { success: true };
}
