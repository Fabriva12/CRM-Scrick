import { createServiceClient } from '@/lib/supabase/server';
import { ProductoTable } from '@/components/organisms/ProductoTable';
import { AjustarStockButton } from '@/components/organisms/AjustarStockButton';
import { ExportButton } from '@/components/molecules/ExportButton';
import { esIngrediente } from '@/lib/recetas';
import type { Producto } from '@/lib/types/productos';
import { Package, Wheat } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function ProductosPage() {
  const supabase = createServiceClient();
  const { data: productos, error } = await supabase
    .from('productos')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) {
    throw new Error(`Error al cargar productos: ${error.message}`);
  }

  const typedProductos = productos as unknown as Producto[];
  const ingredientes = typedProductos
    .filter((p) => esIngrediente(p.nombre))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
  const paquetes = typedProductos
    .filter((p) => !esIngrediente(p.nombre))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const sinDatos = typedProductos.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl tracking-wide">Inventario</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ingredientes y paquetes producidos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AjustarStockButton productos={typedProductos} />
          {!sinDatos && (
            <ExportButton
              data={typedProductos as unknown as Record<string, unknown>[]}
              columns={[
                { key: 'nombre', label: 'Nombre' },
                { key: 'precio_venta', label: 'Precio Venta', format: 'currency' },
                { key: 'costo', label: 'Costo', format: 'currency' },
                { key: 'costo_total', label: 'Costo Total', format: 'currency' },
                { key: 'cantidad_comprada', label: 'Cantidad Comprada' },
                { key: 'stock', label: 'Stock', format: 'number' },
                { key: 'gramos_restantes', label: 'Gramos Restantes' },
              ]}
              filename="productos-scrick"
            />
          )}
        </div>
      </div>

      {sinDatos ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="mb-4 size-12 text-muted-foreground/40" />
            <p className="mb-2 text-lg font-medium">No hay productos registrados</p>
            <p className="mb-6 text-sm text-muted-foreground">
              Creá los ingredientes con el nombre exacto de cada receta; los
              paquetes se crean al producir galletas.
            </p>
            <Button render={<Link href="/productos/nuevo" />}>
              <Plus className="size-4" />
              Nuevo producto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Paquetes producidos */}
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <Package className="size-5 text-muted-foreground" />
                  Paquetes producidos
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {paquetes.length}
                  </span>
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href="/productos/nuevo" />}
                >
                  <Plus className="size-4" />
                  Nuevo
                </Button>
              </div>
              {paquetes.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Los paquetes se crean al producir galletas
                </p>
              ) : (
                <ProductoTable productos={paquetes} />
              )}
            </CardContent>
          </Card>

          {/* Ingredientes */}
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <Wheat className="size-5 text-muted-foreground" />
                  Ingredientes
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {ingredientes.length}
                  </span>
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href="/productos/nuevo" />}
                >
                  <Plus className="size-4" />
                  Nuevo
                </Button>
              </div>
              {ingredientes.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No hay ingredientes registrados
                </p>
              ) : (
                <ProductoTable
                  productos={ingredientes}
                  esSeccionIngredientes
                />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}