'use client';

interface ProductoInventario {
  id: string;
  nombre: string;
  sku: string | null;
  stock: number;
  unidad: string | null;
  costo: number | null;
}

interface InventarioRapidoProps {
  productos: ProductoInventario[];
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
                <th className="pb-2 pr-4 font-medium">SKU</th>
                <th className="pb-2 pr-4 text-right font-medium">Costo</th>
                <th className="pb-2 text-right font-medium">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2F3031]/10">
              {productos.map((producto) => (
                <tr key={producto.id} className="py-2">
                  <td className="py-2 pr-4 text-[#2F3031]">
                    {producto.nombre}
                  </td>
                  <td className="py-2 pr-4 text-[#2F3031]/50">
                    {producto.sku || '—'}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums text-[#2F3031]/50">
                    {producto.costo
                      ? `₡${Number(producto.costo).toLocaleString('es-CR')}`
                      : '—'}
                  </td>
                  <td
                    className={`py-2 text-right tabular-nums font-medium ${
                      producto.stock === 0
                        ? 'text-red-600'
                        : 'text-[#2F3031]'
                    }`}
                  >
                    {producto.stock}{' '}
                    <span className="text-xs font-normal text-[#2F3031]/40">
                      {producto.unidad || 'unid'}
                    </span>
                    {producto.stock === 0 && (
                      <span className="ml-1 text-xs" title="Sin stock">
                        🔴
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
