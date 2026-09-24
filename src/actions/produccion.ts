'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { RECETAS } from '@/lib/recetas';
import { calcularCostoRecetaProducto } from '@/lib/costoReceta';
import { revalidatePath } from 'next/cache';
import type { ProduccionHistorial } from '@/lib/types/produccion';

function generarLote(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

export type ProducirResultado =
  | { success: true; message: string }
  | { success: false; error: string };

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

  // 1. Buscar ingredientes por nombre
  const { data: productos, error: prodError } = await supabase
    .from('productos')
    .select('id, nombre, stock, gramos_restantes')
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

  const faltantes = receta.ingredientes.filter(
    (ing) => !productos.some((p) => p.nombre === ing.nombre)
  );
  if (faltantes.length > 0) {
    return {
      success: false,
      error: `Faltan ingredientes en el catálogo: ${faltantes.map((i) => i.nombre).join(', ')}`,
    };
  }

  // 2. Verificar gramos suficientes
  const stockErrors: string[] = [];
  for (const ing of receta.ingredientes) {
    const prod = productos.find((p) => p.nombre === ing.nombre)!;
    const necesario = ing.cantidad * cantidad;
    const disponible = Number(prod.gramos_restantes ?? 0);
    if (disponible < necesario) {
      stockErrors.push(
        `"${ing.nombre}": tenés ${disponible.toFixed(2)}g, necesitás ${necesario.toFixed(2)}g`
      );
    }
  }

  if (stockErrors.length > 0) {
    return {
      success: false,
      error: `Gramos insuficientes:\n${stockErrors.join('\n')}`,
    };
  }

  // 3. Buscar o crear el producto terminado
  let productoId: string | undefined;

  // Costo automático: el paquete toma el costo por unidad de la receta
  // (suma de cantidad × costo por gramo de cada ingrediente).
  const costoUnidad = await calcularCostoRecetaProducto(
    receta.producto_nombre
  );

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

  if (prodExistente) {
    productoId = prodExistente.id;
    const nuevoStockProd = prodExistente.stock + cantidad;
    const updateData: Record<string, unknown> = { stock: nuevoStockProd };
    if (costoUnidad != null) updateData.costo = costoUnidad;

    const { error: updateProdError } = await supabase
      .from('productos')
      .update(updateData)
      .eq('id', productoId);

    if (updateProdError) {
      return {
        success: false,
        error: `Error al actualizar stock de "${receta.producto_nombre}": ${updateProdError.message}`,
      };
    }
  } else {
    const { data: nuevoProducto, error: insertProdError } = await supabase
      .from('productos')
      .insert({
        nombre: receta.producto_nombre,
        precio_venta: 1,
        costo: costoUnidad,
        stock: cantidad,
        unidad: 'unid',
      })
      .select('id')
      .single();

    if (insertProdError || !nuevoProducto) {
      return {
        success: false,
        error: `Error al crear "${receta.producto_nombre}": ${insertProdError?.message}`,
      };
    }

    productoId = nuevoProducto.id;
  }

  // 4. Descontar gramos de ingredientes
  for (const ing of receta.ingredientes) {
    const prod = productos.find((p) => p.nombre === ing.nombre)!;
    const descuento = ing.cantidad * cantidad;
    const nuevoStock = Math.round(
      (Number(prod.gramos_restantes ?? 0) - descuento) * 100
    ) / 100;

    const { error: updateError } = await supabase
      .from('productos')
      .update({ gramos_restantes: nuevoStock })
      .eq('id', prod.id);

    if (updateError) {
      return {
        success: false,
        error: `Error al actualizar gramos de "${ing.nombre}": ${updateError.message}`,
      };
    }
  }

  // 5. Guardar en historial
  const lote = generarLote();
  const { error: histError } = await supabase
    .from('produccion_historial')
    .insert({
      producto_id: productoId,
      receta_id: receta.id,
      receta_nombre: receta.nombre,
      cantidad,
      lote,
    });

  if (histError) {
    return {
      success: false,
      error: `Error al guardar historial de producción: ${histError.message}`,
    };
  }

  revalidatePath('/inventario');
  revalidatePath('/productos');
  const unidad = receta.galletasPorUnidad > 1 ? 'paquete' : 'galleta';
  return {
    success: true,
    message: `✅ Producidas ${cantidad} ${unidad}${cantidad === 1 ? '' : 's'} — ${receta.nombre}. Stock actualizado: ${receta.producto_nombre}`,
  };
}

export async function listHistorial(): Promise<ProduccionHistorial[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('produccion_historial')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al cargar historial de producción:', error.message);
    return [];
  }

  return data ?? [];
}
