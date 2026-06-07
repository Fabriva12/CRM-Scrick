import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import { ProductoTable } from '@/components/organisms/ProductoTable';
import { Button } from '@/components/ui/button';
import { ExportButton } from '@/components/molecules/ExportButton';
import { ProduccionActionButtons } from '@/components/organisms/ProduccionActionButtons';
import type { Producto } from '@/lib/types/productos';
import { Plus, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function ProductosPage() {
  const supabase = createServiceClient();
  const { data: productos, error } = await supabase
    .from('productos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error al cargar productos: ${error.message}`);
  }

  const typedProductos = productos as unknown as Producto[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl tracking-wide">Productos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona tu catálogo de productos
          </p>
        </div>
        <div className="flex items-center gap-2">
          {typedProductos.length > 0 && (
            <ExportButton
              data={typedProductos as unknown as Record<string, unknown>[]}
              columns={[
                { key: 'nombre', label: 'Nombre' },
                { key: 'sku', label: 'SKU' },
                { key: 'precio_venta', label: 'Precio Venta', format: 'currency' },
                { key: 'costo', label: 'Costo', format: 'currency' },
                { key: 'stock', label: 'Stock', format: 'number' },
                { key: 'unidad', label: 'Unidad' },
                { key: 'paquete', label: 'Paquete' },
                { key: 'descripcion', label: 'Descripción' },
              ]}
              filename="productos-scrick"
            />
          )}
          <ProduccionActionButtons />
          <Button render={<Link href="/productos/nuevo" />}>
            <Plus className="size-4" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      {typedProductos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="mb-4 size-12 text-muted-foreground/40" />
            <p className="mb-2 text-lg font-medium">No hay productos registrados</p>
            <p className="mb-6 text-sm text-muted-foreground">
              Crea tu primer producto para empezar a gestionar tu catálogo.
            </p>
            <Button render={<Link href="/productos/nuevo" />}>
              <Plus className="size-4" />
              Crear primer producto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ProductoTable productos={typedProductos} />
      )}
    </div>
  );
}
