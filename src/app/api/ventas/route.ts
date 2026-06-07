import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { ventaCreateSchema } from '@/lib/validations/ventas';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('ventas')
    .select('*, clientes!inner(nombre)')
    .order('fecha', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { venta: ventaBody, productos: productosBody } = body as {
    venta?: Record<string, unknown>;
    productos?: Array<{
      producto_id: string;
      cantidad: number;
    }>;
  };

  const headerResult = ventaCreateSchema.safeParse(ventaBody);

  if (!headerResult.success) {
    return NextResponse.json(
      { errors: headerResult.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  if (!productosBody || productosBody.length === 0) {
    return NextResponse.json(
      { errors: { _form: ['Debe incluir al menos un producto'] } },
      { status: 422 }
    );
  }

  const supabase = createServiceClient();

  // Fetch product prices
  const productoIds = [...new Set(productosBody.map((p) => p.producto_id))];
  const { data: dbProductos, error: prodError } = await supabase
    .from('productos')
    .select('id, precio_venta')
    .in('id', productoIds);

  if (prodError || !dbProductos || dbProductos.length !== productoIds.length) {
    return NextResponse.json(
      { error: 'Uno o más productos no encontrados' },
      { status: 404 }
    );
  }

  const precioMap = new Map(dbProductos.map((p) => [p.id, p.precio_venta]));

  let montoTotal = 0;
  const ventaProductosData = productosBody.map((p) => {
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

  // Insert venta header
  const { data: venta, error: ventaError } = await supabase
    .from('ventas')
    .insert({ ...headerResult.data, monto_total: montoTotal })
    .select()
    .single();

  if (ventaError || !venta) {
    return NextResponse.json({ error: ventaError?.message ?? 'Error al crear venta' }, { status: 500 });
  }

  // Insert product lines
  const ventaProductosInsert = ventaProductosData.map((vp) => ({
    venta_id: venta.id,
    ...vp,
  }));

  const { error: linesError } = await supabase
    .from('venta_productos')
    .insert(ventaProductosInsert);

  if (linesError) {
    // Rollback: delete the venta header if lines fail
    await supabase.from('ventas').delete().eq('id', venta.id);
    return NextResponse.json({ error: linesError.message }, { status: 500 });
  }

  return NextResponse.json(venta, { status: 201 });
}
