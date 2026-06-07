'use server';

import { createServiceClient } from '@/lib/supabase/server';
import {
  ventaCreateSchema,
  ventaUpdateSchema,
  ventaProductoRowSchema,
} from '@/lib/validations/ventas';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { VentaActionResult, Venta } from '@/lib/types/ventas';

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
  });

  if (!headerResult.success) {
    return { errors: headerResult.error.flatten().fieldErrors };
  }

  // Parse product rows from repeated form fields
  const products: Array<{ producto_id: string; cantidad: number }> = [];
  const productErrors: string[] = [];

  for (const [key] of formData.entries()) {
    const match = key.match(/^producto_(\d+)_id$/);
    if (match) {
      const index = match[1];
      const cantidadStr = formData.get(`producto_${index}_cantidad`);
      const value = formData.get(key);

      const productResult = ventaProductoRowSchema.safeParse({
        producto_id: value,
        cantidad: cantidadStr,
      });

      if (!productResult.success) {
        const fieldErrors = productResult.error.flatten().fieldErrors;
        const msgs: string[] = [];
        if (fieldErrors.producto_id) msgs.push(fieldErrors.producto_id[0]);
        if (fieldErrors.cantidad) msgs.push(fieldErrors.cantidad[0]);
        productErrors.push(
          `Producto #${Number(index) + 1}: ${msgs.join(', ')}`
        );
      } else {
        products.push(productResult.data);
      }
    }
  }

  if (productErrors.length > 0) {
    return { errors: { _form: productErrors } };
  }

  if (products.length === 0) {
    return { errors: { _form: ['Debe agregar al menos un producto a la venta'] } };
  }

  const supabase = createServiceClient();

  // Fetch current prices AND stock from DB
  const productoIds = [...new Set(products.map((p) => p.producto_id))];

  const { data: dbProductos, error: prodError } = await supabase
    .from('productos')
    .select('id, nombre, precio_venta, stock')
    .in('id', productoIds);

  if (prodError) {
    return { errors: { _form: ['Error al consultar productos'] } };
  }

  if (!dbProductos || dbProductos.length !== productoIds.length) {
    return { errors: { _form: ['Uno o más productos no encontrados'] } };
  }

  // Verify stock BEFORE creating anything
  const stockErrors: string[] = [];
  for (const p of products) {
    const prod = dbProductos.find((dp) => dp.id === p.producto_id);
    if (prod && p.cantidad > prod.stock) {
      stockErrors.push(
        `"${prod.nombre}" (${prod.stock} en stock): solicitaste ${p.cantidad}`
      );
    }
  }
  if (stockErrors.length > 0) {
    return {
      errors: {
        _form: [
          `Stock insuficiente:\n${stockErrors.join('\n')}`,
        ],
      },
    };
  }

  const precioMap = new Map(
    dbProductos.map((p) => [p.id, p.precio_venta])
  );

  // Calculate subtotals and total
  let montoTotal = 0;
  const ventaProductosData = products.map((p) => {
    const precioUnitario = precioMap.get(p.producto_id) ?? 0;
    const subtotal = precioUnitario * p.cantidad;
    montoTotal += subtotal;
    return {
      producto_id: p.producto_id,
      cantidad: p.cantidad,
      precio_unitario: precioUnitario,
      subtotal,
    };
  });

  // Insert venta (header)
  const { data: venta, error: ventaError } = await supabase
    .from('ventas')
    .insert({
      cliente_id: headerResult.data.cliente_id,
      fecha: headerResult.data.fecha,
      estado: headerResult.data.estado,
      notas: headerResult.data.notas,
      monto_total: montoTotal,
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
    // Attempt cleanup: remove the venta we just created
    await supabase.from('ventas').delete().eq('id', venta.id);
    return { errors: { _form: [linesError.message] } };
  }

  // Decrement stock for each product
  for (const vp of ventaProductosData) {
    const { error: updateError } = await supabase
      .from('productos')
      .update({ stock: dbProductos.find((p) => p.id === vp.producto_id)!.stock - vp.cantidad })
      .eq('id', vp.producto_id);

    if (updateError) {
      // Attempt cleanup: remove venta and lines
      await supabase.from('venta_productos').delete().eq('venta_id', venta.id);
      await supabase.from('ventas').delete().eq('id', venta.id);
      return { errors: { _form: [`Error al actualizar stock: ${updateError.message}`] } };
    }
  }

  revalidatePath('/ventas');
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
  const { data, error } = await supabase
    .from('ventas')
    .update(headerResult.data)
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

  // Fetch venta_productos to restore stock
  const { data: productosVenta, error: fetchError } = await supabase
    .from('venta_productos')
    .select('producto_id, cantidad')
    .eq('venta_id', id);

  if (fetchError) {
    return { success: false, error: fetchError.message };
  }

  // Delete the venta (cascades to venta_productos if FK constraint has CASCADE,
  // otherwise delete manually)
  const { error } = await supabase.from('ventas').delete().eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  // Restore stock for each product
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
  return { success: true };
}

export async function getVentaWithDetails(
  id: string
): Promise<{ data?: Venta; error?: string }> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('ventas')
    .select(
      '*, clientes!inner(nombre), venta_productos(*, productos!inner(nombre, sku))'
    )
    .eq('id', id)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: data as unknown as Venta };
}
