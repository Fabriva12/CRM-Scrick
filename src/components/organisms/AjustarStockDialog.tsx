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
import { esIngrediente, sufijoStock } from '@/lib/recetas';
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

export function AjustarStockDialog({
  open,
  onOpenChange,
  productos,
}: AjustarStockDialogProps) {
  const [productoId, setProductoId] = useState<string>(productos[0]?.id ?? '');
  const [cantidad, setCantidad] = useState<number>(1);
  const [isPending, setIsPending] = useState(false);

  const producto = productos.find((p) => p.id === productoId);
  const esIngredienteProducto = producto
    ? esIngrediente(producto.nombre)
    : false;
  const unidad = esIngredienteProducto
    ? 'g'
    : sufijoStock(producto?.nombre, producto?.unidad || 'unid');
  const valorActual = esIngredienteProducto
    ? Number(producto?.gramos_restantes ?? 0)
    : producto?.stock ?? 0;

  async function handleSubmit() {
    if (!productoId || cantidad <= 0) return;

    setIsPending(true);
    try {
      const result = await ajustarStock(productoId, cantidad);
      if (result.success) {
        toast.success(
          `${esIngredienteProducto ? 'Gramos añadidos' : 'Stock añadido'} — ahora hay ${formatGramos(valorActual + cantidad)} ${unidad}`
        );
        onOpenChange(false);
        setCantidad(1);
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
                setCantidad(1);
              }}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {productos.map((p) => {
                const esIng = esIngrediente(p.nombre);
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
            <Input
              id="cantidad"
              type="number"
              min={0.01}
              step={esIngredienteProducto ? 0.01 : 1}
              value={cantidad}
              onChange={(e) =>
                setCantidad(Math.max(0.01, Number(e.target.value) || 0))
              }
              className="mt-1"
            />
          </div>

          {/* Preview */}
          {producto && (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
              {esIngredienteProducto ? 'Gramos restantes actuales' : 'Stock actual'}:{' '}
              <span className="font-medium tabular-nums">
                {formatGramos(valorActual)}
              </span>{' '}
              {unidad}
              {' → '}
              <span className="font-medium tabular-nums text-primary">
                {formatGramos(valorActual + cantidad)} {unidad}
              </span>
            </div>
          )}
        </div>

        <DialogFooter showCloseButton={false}>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !productoId || cantidad <= 0}
          >
            {isPending
              ? 'Añadiendo...'
              : `Añadir ${formatGramos(cantidad)} ${unidad}`}
          </Button>
          <DialogClose render={<Button variant="outline">Cancelar</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}