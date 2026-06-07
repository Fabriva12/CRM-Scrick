import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { ventaUpdateSchema } from '@/lib/validations/ventas';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('ventas')
    .select('*, clientes!inner(nombre), venta_productos(*, productos!inner(nombre, sku))')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'Venta no encontrada' },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const result = ventaUpdateSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { errors: result.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('ventas')
    .update(result.data)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'Venta no encontrada' },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();

  // Delete related product lines first, then the venta header
  const { error: linesError } = await supabase
    .from('venta_productos')
    .delete()
    .eq('venta_id', id);

  if (linesError) {
    return NextResponse.json({ error: linesError.message }, { status: 500 });
  }

  const { error } = await supabase.from('ventas').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
