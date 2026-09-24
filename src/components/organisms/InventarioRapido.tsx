'use client';

import { formatCurrency } from '@/lib/format';
import { esIngrediente, sufijoStock } from '@/lib/recetas';

interface ProductoInventario {
  id: string;
  nombre: string;
  stock: number;
  gramos_restantes: number | null;
  unidad: string | null;
  costo: number | null;
}

interface InventarioRapidoProps {
  productos: ProductoInventario[];
}

function formatGramos(value: number | null | undefined) {
  if (value == null) return '0';
  return value.toLocaleString('es-CR', { maximumFractionDigits: 2 });
}

export function InventarioRapido({ productos }: InventarioRapidoProps) {
  return (
    <div className="rounded-xl bg-white p-5 ring-1 ring-[#2F3031]/10">
      <h2 className="font-heading mb-4 text-lg tracking-wide text-[#2F3031]">
        📦 Inventario rápido
      </h2>

      {productos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-[#2F3031]/40">
          <span className="text-4xl">🦗</span>
          <p className="mt-2 text-sm">Sin productos registrados</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2F3031]/10 text-left text-xs text-[#2F3031]/50">
                <th className="pb-2 pr-4 font-medium">Producto</th>
                <th className="pb-2 pr-4 text-right font-medium">Costo</th>
                <th className="pb-2 text-right font-medium">Disponible</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2F3031]/10">
              {productos.map((producto) => {
                const esIng = esIngrediente(producto.nombre);
                const cantidad = esIng
                  ? Number(producto.gramos_restantes ?? 0)
                  : producto.stock;
                const unidad = esIng
                  ? ''
                  : sufijoStock(producto.nombre, producto.unidad || 'unid');
                return (
                  <tr key={producto.id} className="py-2">
                    <td className="py-2 pr-4 text-[#2F3031]">
                      {producto.nombre}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums text-[#2F3031]/50">
                      {formatCurrency(producto.costo)}
                      {esIng && (
                        <span className="ml-0.5 text-xs text-[#2F3031]/30">
                          /g
                        </span>
                      )}
                    </td>
                    <td
                      className={`py-2 text-right tabular-nums font-medium ${
                        cantidad === 0 ? 'text-red-600' : 'text-[#2F3031]'
                      }`}
                    >
                      {formatGramos(cantidad)}
                      {unidad && (
                        <span className="text-xs font-normal text-[#2F3031]/40">
                          {' '}{unidad}
                        </span>
                      )}
                      {cantidad === 0 && (
                        <span className="ml-1 text-xs" title="Sin disponible">
                          🔴
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}