'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ajustarStock } from '@/actions/productos';
import { sufijoStock } from '@/lib/recetas';
import type { Producto } from '@/lib/types/productos';
import { PackagePlus } from 'lucide-react';

interface AjustarStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productos: Producto[];
}

function formatGramos(value: number | null | undefined) {
  if (value == null) return '0';
  return value.toLocaleString('es-CR', { maximumFractionDigits: 2 });
}

/** Parsea el texto del input: acepta coma decimal y espacios. Vacío o inválido → NaN. */
function parseCantidad(raw: string): number {
  const n = Number(raw.trim().replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
}

export function AjustarStockDialog({
  open,
  onOpenChange,
  productos,
}: AjustarStockDialogProps) {
  const [productoId, setProductoId] = useState<string>(productos[0]?.id ?? '');
  const [cantidad, setCantidad] = useState<string>('1');
  const [unidadGramos, setUnidadGramos] = useState<'g' | 'kg'>('g');
  const [isPending, setIsPending] = useState(false);

  const producto = productos.find((p) => p.id === productoId);
  const esIngredienteProducto = producto
    ? producto.tipo === 'ingrediente'
    : false;
  const unidad = esIngredienteProducto
    ? unidadGramos
    : sufijoStock(producto?.nombre, producto?.unidad || 'unid');
  const valorActual = esIngredienteProducto
    ? Number(producto?.gramos_restantes ?? 0)
    : producto?.stock ?? 0;

  const cantidadNum = parseCantidad(cantidad);
  const cantidadValida = Number.isFinite(cantidadNum) && cantidadNum > 0;
  // Valor en la unidad de entrada (g o kg) para el preview y el toast.
  const cantidadEnUnidad = cantidadValida ? cantidadNum : 0;
  const valorActualEnUnidad = esIngredienteProducto && unidadGramos === 'kg'
    ? valorActual / 1000
    : valorActual;

  async function handleSubmit() {
    if (!productoId || !cantidadValida) return;

    const cantidadAAplicar =
      esIngredienteProducto && unidadGramos === 'kg'
        ? Math.round(cantidadNum * 1000 * 100) / 100
        : cantidadNum;

    setIsPending(true);
    try {
      const result = await ajustarStock(productoId, cantidadAAplicar);
      if (result.success) {
        toast.success(
          `Añadido — ahora hay ${formatGramos(valorActualEnUnidad + cantidadEnUnidad)} ${unidad}`
        );
        onOpenChange(false);
        setCantidad('1');
      } else {
        toast.error(result.error);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('Error al ajustar cantidad:', msg);
      toast.error(`Error inesperado: ${msg}`);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <PackagePlus className="mr-2 inline size-5 align-text-top" />
            Ajustar cantidades
          </DialogTitle>
          <DialogDescription>
            Añadí gramos a un ingrediente o unidades a un paquete producido.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Producto */}
          <div>
            <Label htmlFor="producto">Producto</Label>
            <select
              id="producto"
              value={productoId}
              onChange={(e) => {
                setProductoId(e.target.value);
                setCantidad('1');
              }}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {productos.map((p) => {
                const esIng = p.tipo === 'ingrediente';
                const cantidadActual = esIng
                  ? formatGramos(p.gramos_restantes)
                  : String(p.stock);
                const suffix = esIng ? 'g restantes' : sufijoStock(p.nombre, p.unidad || 'unid');
                return (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({cantidadActual} {suffix})
                  </option>
                );
              })}
              {productos.length === 0 && (
                <option disabled>No hay productos disponibles</option>
              )}
            </select>
          </div>

          {/* Cantidad */}
          <div>
            <Label htmlFor="cantidad">
              Cantidad a añadir ({unidad})
            </Label>
            <div className="mt-1 flex gap-2">
              <Input
                id="cantidad"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="flex-1"
              />
              {esIngredienteProducto && (
                <div
                  role="group"
                  aria-label="Unidad de medida"
                  className="flex h-10 shrink-0 rounded-md border border-input p-0.5"
                >
                  {(['g', 'kg'] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUnidadGramos(u)}
                      aria-pressed={unidadGramos === u}
                      className={`rounded px-3 text-sm font-medium transition-colors ${
                        unidadGramos === u
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {cantidad !== '' && !cantidadValida && (
              <p className="mt-1 text-xs text-destructive">
                Ingresá un número mayor a 0
              </p>
            )}
          </div>

          {/* Preview */}
          {producto && (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
              Stock actual:{' '}
              <span className="font-medium tabular-nums">
                {formatGramos(valorActualEnUnidad)}
              </span>{' '}
              {unidad}
              {' → '}
              <span className="font-medium tabular-nums text-primary">
                {formatGramos(valorActualEnUnidad + cantidadEnUnidad)} {unidad}
              </span>
            </div>
          )}
        </div>

        <DialogFooter showCloseButton={false}>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !productoId || !cantidadValida}
          >
            {isPending
              ? 'Añadiendo...'
              : `Añadir ${formatGramos(cantidadValida ? cantidadNum : 0)} ${unidad}`}
          </Button>
          <DialogClose render={<Button variant="outline">Cancelar</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}