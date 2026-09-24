'use server';

import { createServiceClient } from '@/lib/supabase/server';
import {
  ventaCreateSchema,
  ventaUpdateSchema,
} from '@/lib/validations/ventas';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { VentaActionResult, Venta } from '@/lib/types/ventas';
import { RECETAS } from '@/lib/recetas';

const RECETAS_PRODUCTOS = RECETAS.map((r) => ({
  key: r.id,
  nombre: r.producto_nombre,
  galletasPorUnidad: r.galletasPorUnidad,
}));

export async function createVenta(
  prevState: VentaActionResult | null,
  formData: FormData
): Promise<VentaActionResult> {
  // Parse header fields
  const headerResult = ventaCreateSchema.safeParse({
    cliente_id: formData.get('cliente_id'),
    fecha: formData.get('fecha'),
    estado: formData.get('estado'),
    notas: formData.get('notas') || null,
    envio_paga_cliente: formData.get('envio_paga_cliente') ?? '0',
    envio_cubrimos: formData.get('envio_cubrimos') ?? '0',
  });

  if (!headerResult.success) {
    return { errors: headerResult.error.flatten().fieldErrors };
  }

  const envioPaga = headerResult.data.envio_paga_cliente ?? 0;
  const envioCubre = headerResult.data.envio_cubrimos ?? 0;

  // Read receta quantities and prices
  const lineItems: { key: string; cantidad: number; precio: number }[] = [];
  for (const r of RECETAS_PRODUCTOS) {
    const cantidad = parseInt(formData.get(`${r.key}_cantidad`) as string, 10) || 0;
    const precio = parseFloat(formData.get(`${r.key}_precio`) as string) || 0;
    if (cantidad > 0 && precio > 0) {
      lineItems.push({ key: r.key, cantidad, precio });
    }
  }

  if (lineItems.length === 0) {
    return { errors: { _form: ['Debe agregar al menos un producto a la venta'] } };
  }

  const supabase = createServiceClient();

  // Fetch products by nombre
  const nombres = RECETAS_PRODUCTOS.map((r) => r.nombre);
  const { data: dbProductos, error: prodError } = await supabase
    .from('productos')
    .select('id, nombre, stock')
    .in('nombre', nombres);

  if (prodError) {
    return { errors: { _form: ['Error al consultar productos'] } };
  }

  if (!dbProductos || dbProductos.length === 0) {
    return { errors: { _form: ['No hay productos de recetas en el catálogo'] } };
  }

  // Build product map
  const productoMap = new Map(dbProductos.map((p) => [p.nombre, p]));

  // Verify stock (with multipliers)
  const stockErrors: string[] = [];
  const ventaProductosData: {
    producto_id: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    stockDescuento: number;
  }[] = [];

  let montoTotal = 0;

  for (const item of lineItems) {
    const receta = RECETAS_PRODUCTOS.find((r) => r.key === item.key)!;
    const prod = productoMap.get(receta.nombre);
    if (!prod) {
      return { errors: { _form: [`"${receta.nombre}" no encontrado en el catálogo`] } };
    }

    const stockNecesario = item.cantidad;

    if (stockNecesario > prod.stock) {
      const unidad =
        receta.galletasPorUnidad === 1 ? 'unidad' : 'paquete';
      stockErrors.push(
        `"${receta.nombre}": solicitaste ${item.cantidad} ${unidad}${item.cantidad === 1 ? '' : 's'}, hay ${prod.stock} en stock`
      );
      continue;
    }

    const subtotal = item.cantidad * item.precio;
    montoTotal += subtotal;

    ventaProductosData.push({
      producto_id: prod.id,
      cantidad: item.cantidad,
      precio_unitario: item.precio,
      subtotal,
      stockDescuento: stockNecesario,
    });
  }

  if (stockErrors.length > 0) {
    return { errors: { _form: [`Stock insuficiente:\n${stockErrors.join('\n')}`] } };
  }

  // Insert venta (header)
  const { data: venta, error: ventaError } = await supabase
    .from('ventas')
    .insert({
      cliente_id: headerResult.data.cliente_id,
      fecha: headerResult.data.fecha,
      estado: headerResult.data.estado,
      notas: headerResult.data.notas,
      monto_total: montoTotal + envioPaga,
    })
    .select()
    .single();

  if (ventaError) {
    return { errors: { _form: [ventaError.message] } };
  }

  // Insert product lines
  const { error: linesError } = await supabase.from('venta_productos').insert(
    ventaProductosData.map((vp) => ({
      venta_id: venta.id,
      producto_id: vp.producto_id,
      cantidad: vp.cantidad,
      precio_unitario: vp.precio_unitario,
      subtotal: vp.subtotal,
    }))
  );

  if (linesError) {
    await supabase.from('ventas').delete().eq('id', venta.id);
    return { errors: { _form: [linesError.message] } };
  }

  // Decrement stock (using the multiplier)
  for (const vp of ventaProductosData) {
    const prod = [...productoMap.values()].find((p) => p.id === vp.producto_id)!;

    const { error: updateError } = await supabase
      .from('productos')
      .update({ stock: prod.stock - vp.stockDescuento })
      .eq('id', vp.producto_id);

    if (updateError) {
      await supabase.from('venta_productos').delete().eq('venta_id', venta.id);
      await supabase.from('ventas').delete().eq('id', venta.id);
      return { errors: { _form: [`Error al actualizar stock: ${updateError.message}`] } };
    }
  }

  // Envío: insertar fila en venta_envios y gasto de transporte si aplica
  if (envioPaga > 0 || envioCubre > 0) {
    const { error: envioError } = await supabase
      .from('venta_envios')
      .insert({ venta_id: venta.id, paga_cliente: envioPaga, cubrimos: envioCubre });

    if (envioError) {
      await supabase.from('ventas').delete().eq('id', venta.id);
      return { errors: { _form: [`Error al guardar el envío: ${envioError.message}`] } };
    }

    if (envioCubre > 0) {
      const { error: gastoError } = await supabase.from('gastos').insert({
        categoria: 'Transporte',
        descripcion: `Envío — Venta #${venta.id.slice(0, 8)}`,
        monto: envioCubre,
        fecha: headerResult.data.fecha,
        notas: venta.id,
      });

      if (gastoError) {
        await supabase.from('ventas').delete().eq('id', venta.id);
        return { errors: { _form: [`Error al guardar gasto de envío: ${gastoError.message}`] } };
      }
    }
  }

  revalidatePath('/ventas');
  revalidatePath('/finanzas');
  redirect('/ventas');
}

export async function updateVenta(
  id: string,
  prevState: VentaActionResult | null,
  formData: FormData
): Promise<VentaActionResult> {
  const headerResult = ventaUpdateSchema.safeParse({
    cliente_id: formData.get('cliente_id'),
    fecha: formData.get('fecha'),
    estado: formData.get('estado'),
    notas: formData.get('notas') || null,
  });

  if (!headerResult.success) {
    return { errors: headerResult.error.flatten().fieldErrors };
  }

  const supabase = createServiceClient();
  const ventaData = { ...headerResult.data };
  delete ventaData.envio_paga_cliente;
  delete ventaData.envio_cubrimos;
  const { error } = await supabase
    .from('ventas')
    .update(ventaData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { errors: { _form: [error.message] } };
  }

  revalidatePath('/ventas');
  revalidatePath(`/ventas/${id}`);
  redirect('/ventas');
}

export async function deleteVenta(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();

  const { data: productosVenta, error: fetchError } = await supabase
    .from('venta_productos')
    .select('producto_id, cantidad, productos!inner(nombre)')
    .eq('venta_id', id);

  if (fetchError) {
    return { success: false, error: fetchError.message };
  }

  // Borrar gasto de envío asociado si existe (notas = venta.id)
  const { data: envios } = await supabase
    .from('venta_envios')
    .select('id')
    .eq('venta_id', id);

  if (envios && envios.length > 0) {
    await supabase
      .from('gastos')
      .delete()
      .eq('notas', id)
      .eq('categoria', 'Transporte');
  }

  const { error } = await supabase.from('ventas').delete().eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  if (productosVenta) {
    for (const vp of productosVenta) {
      const { data: prod } = await supabase
        .from('productos')
        .select('stock')
        .eq('id', vp.producto_id)
        .single();

      if (prod) {
        await supabase
          .from('productos')
          .update({ stock: prod.stock + vp.cantidad })
          .eq('id', vp.producto_id);
      }
    }
  }

  revalidatePath('/ventas');
  revalidatePath('/finanzas');
  return { success: true };
}

export async function getVentaWithDetails(
  id: string
): Promise<{ data?: Venta; error?: string }> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('ventas')
    .select(
      '*, clientes!inner(nombre), venta_productos(*, productos!inner(nombre, sku)), venta_envios(*)'
    )
    .eq('id', id)
    .single();

  if (error) {
    return { error: error.message };
  }

  const raw = data as unknown as Venta & { venta_envios?: Venta['envio'][] };
  const { venta_envios, ...rest } = raw;
  return {
    data: { ...rest, envio: venta_envios?.[0] ?? null } as unknown as Venta,
  };
}
