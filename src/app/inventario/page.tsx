import { createServiceClient } from '@/lib/supabase/server';
import { HistorialProduccion } from '@/components/organisms/HistorialProduccion';
import { ProduccionActionButtons } from '@/components/organisms/ProduccionActionButtons';
import type { HistorialConProducto } from '@/lib/types/produccion';
import { CookingPot } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function InventarioPage() {
  const supabase = createServiceClient();
  const { data: productos, error: prodError } = await supabase
    .from('productos')
    .select('*')
    .in('unidad', ['unid'])
    .order('stock', { ascending: true });

  if (prodError) {
    throw new Error(`Error al cargar productos: ${prodError.message}`);
  }

  const { data: historial, error: histError } = await supabase
    .from('produccion_historial')
    .select('*, productos(nombre)')
    .order('created_at', { ascending: false });

  if (histError) {
    throw new Error(`Error al cargar historial: ${histError.message}`);
  }

  const typedHistorial = historial as unknown as HistorialConProducto[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl tracking-wide">Producción</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Producir galletas y ver historial
          </p>
        </div>
        <ProduccionActionButtons />
      </div>

      {/* Galletas en stock */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <CookingPot className="size-5 text-muted-foreground" />
            Galletas en Stock
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Producto</th>
                  <th className="pb-2 text-right font-medium">Stock</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2">{p.nombre}</td>
                    <td className={`py-2 text-right tabular-nums ${
                      p.stock === 0 ? 'text-red-500 font-medium' : ''
                    }`}>
                      {p.stock} unid
                    </td>
                  </tr>
                ))}
                {productos.length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-8 text-center text-muted-foreground">
                      No hay galletas producidas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Historial de producción */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <CookingPot className="size-5 text-muted-foreground" />
            Historial de Producción
          </h2>
          <HistorialProduccion historial={typedHistorial} />
        </CardContent>
      </Card>
    </div>
  );
}
