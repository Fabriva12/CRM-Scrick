'use server';

import { createServiceClient } from '@/lib/supabase/server';
import {
  ventaCreateSchema,
  ventaUpdateSchema,
} from '@/lib/validations/ventas';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { VentaActionResult, Venta } from '@/lib/types/ventas';

const RECETAS_PRODUCTOS = [
  { key: 'receta1', nombre: 'Galleta Proteica Receta 1', galletasPorUnidad: 1 },
  { key: 'receta2', nombre: 'Galleta Proteica Receta 2', galletasPorUnidad: 4 },
] as const;

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

    const stockNecesario = item.cantidad * receta.galletasPorUnidad;

    if (stockNecesario > prod.stock) {
      stockErrors.push(
        `"${receta.nombre}": solicitaste ${item.cantidad} ${item.key === 'receta2' ? 'paquete(s)' : 'unidad(es)'} (${stockNecesario} galletas), hay ${prod.stock} en stock`
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
    await supabase.from('ventas').delete().eq('id', venta.id);
    return { errors: { _form: [linesError.message] } };
  }

  // Decrement stock (using the multiplier)
  for (const vp of ventaProductosData) {
    const prod = productoMap.get(
      [...productoMap.keys()].find((k) => productoMap.get(k)!.id === vp.producto_id)!
    )!;

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

const RECETA_MULTIPLIER = new Map(
  RECETAS_PRODUCTOS.map((r) => [r.nombre, r.galletasPorUnidad])
);

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
        const nombre = (vp as unknown as { productos: { nombre: string } }).productos.nombre;
        const multiplier = RECETA_MULTIPLIER.get(nombre as 'Galleta Proteica Receta 1' | 'Galleta Proteica Receta 2') ?? 1;
        await supabase
          .from('productos')
          .update({ stock: prod.stock + vp.cantidad * multiplier })
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
