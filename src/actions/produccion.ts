'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { RECETAS } from '@/lib/recetas';
import { revalidatePath } from 'next/cache';

export type ProducirResultado =
  | { success: true; message: string }
  | { success: false; error: string };

/**
 * Produce galletas: descuenta el stock de los ingredientes y crea/aumenta
 * el stock del producto terminado en el catálogo.
 */
export async function producir(
  recetaId: string,
  cantidad: number
): Promise<ProducirResultado> {
  const receta = RECETAS.find((r) => r.id === recetaId);
  if (!receta) {
    return { success: false, error: 'Receta no encontrada' };
  }

  if (cantidad < 1) {
    return { success: false, error: 'La cantidad debe ser al menos 1' };
  }

  const supabase = createServiceClient();

  // 1. Buscar todos los productos (ingredientes) por nombre
  const { data: productos, error: prodError } = await supabase
    .from('productos')
    .select('id, nombre, stock')
    .in('nombre', receta.ingredientes.map((i) => i.nombre));

  if (prodError) {
    return { success: false, error: `Error al consultar productos: ${prodError.message}` };
  }

  if (!productos || productos.length === 0) {
    return {
      success: false,
      error: 'No se encontraron productos en el catálogo. Primero creá los ingredientes manualmente.',
    };
  }

  // Verificar que todos los ingredientes existen
  const faltantes = receta.ingredientes.filter(
    (ing) => !productos.some((p) => p.nombre === ing.nombre)
  );
  if (faltantes.length > 0) {
    return {
      success: false,
      error: `Faltan ingredientes en el catálogo: ${faltantes.map((i) => i.nombre).join(', ')}`,
    };
  }

  // 2. Verificar stock suficiente
  const stockErrors: string[] = [];
  for (const ing of receta.ingredientes) {
    const prod = productos.find((p) => p.nombre === ing.nombre)!;
    const necesario = ing.cantidad * cantidad;
    if (prod.stock < necesario) {
      stockErrors.push(
        `"${ing.nombre}": tenés ${prod.stock}${prod.stock === 1 ? '' : ''}, necesitás ${necesario.toFixed(2)}`
      );
    }
  }

  if (stockErrors.length > 0) {
    return {
      success: false,
      error: `Stock insuficiente:\n${stockErrors.join('\n')}`,
    };
  }

  // 3. Buscar o crear el producto terminado en el catálogo
  const { data: prodExistente, error: prodExistError } = await supabase
    .from('productos')
    .select('id, stock')
    .eq('nombre', receta.producto_nombre)
    .maybeSingle();

  if (prodExistError) {
    return {
      success: false,
      error: `Error al buscar producto terminado: ${prodExistError.message}`,
    };
  }

  const productoId = prodExistente?.id;

  if (productoId) {
    // Ya existe — aumentar stock
    const nuevoStockProd = prodExistente.stock + cantidad;
    const { error: updateProdError } = await supabase
      .from('productos')
      .update({ stock: nuevoStockProd })
      .eq('id', productoId);

    if (updateProdError) {
      return {
        success: false,
        error: `Error al actualizar stock de "${receta.producto_nombre}": ${updateProdError.message}`,
      };
    }
  } else {
    // No existe — crearlo
    const { error: insertProdError } = await supabase
      .from('productos')
      .insert({
        nombre: receta.producto_nombre,
        precio_venta: 1,
        costo: null,
        stock: cantidad,
        unidad: 'unid',
      });

    if (insertProdError) {
      return {
        success: false,
        error: `Error al crear "${receta.producto_nombre}": ${insertProdError.message}`,
      };
    }
  }

  // 4. Descontar stock de cada ingrediente
  for (const ing of receta.ingredientes) {
    const prod = productos.find((p) => p.nombre === ing.nombre)!;
    const descuento = ing.cantidad * cantidad;
    const nuevoStock = Math.round(prod.stock - descuento);

    const { error: updateError } = await supabase
      .from('productos')
      .update({ stock: nuevoStock })
      .eq('id', prod.id);

    if (updateError) {
      return {
        success: false,
        error: `Error al actualizar stock de "${ing.nombre}": ${updateError.message}`,
      };
    }
  }

  revalidatePath('/productos');
  return {
    success: true,
    message: `✅ Producidas ${cantidad} ${cantidad === 1 ? 'galleta' : 'galletas'} — ${receta.nombre}. Stock actualizado: ${receta.producto_nombre}`,
  };
}
