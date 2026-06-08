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
import type { Producto } from '@/lib/types/productos';
import { PackagePlus } from 'lucide-react';

interface AjustarStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productos: Producto[];
}

export function AjustarStockDialog({
  open,
  onOpenChange,
  productos,
}: AjustarStockDialogProps) {
  const [productoId, setProductoId] = useState<string>(productos[0]?.id ?? '');
  const [cantidad, setCantidad] = useState<number>(1);
  const [isPending, setIsPending] = useState(false);

  const ingredientes = productos.filter(
    (p) => !p.nombre.startsWith('Galleta Proteica Receta')
  );
  const producto = productos.find((p) => p.id === productoId);

  async function handleSubmit() {
    if (!productoId || cantidad < 1) return;

    setIsPending(true);
    try {
      const result = await ajustarStock(productoId, cantidad);
      if (result.success) {
        toast.success(`Stock añadido — ahora hay ${producto!.stock + cantidad}`);
        onOpenChange(false);
        setCantidad(1);
      } else {
        toast.error(result.error);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('Error al ajustar stock:', msg);
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
            Añadir Stock
          </DialogTitle>
          <DialogDescription>
            Seleccioná el producto y la cantidad a añadir al inventario.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Producto */}
          <div>
            <Label htmlFor="producto">Producto</Label>
            <select
              id="producto"
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {ingredientes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} ({p.stock} en stock)
                </option>
              ))}
              {ingredientes.length === 0 && (
                <option disabled>No hay ingredientes disponibles</option>
              )}
            </select>
          </div>

          {/* Cantidad */}
          <div>
            <Label htmlFor="cantidad">
              Cantidad a añadir
            </Label>
            <Input
              id="cantidad"
              type="number"
              min={1}
              step={1}
              value={cantidad}
              onChange={(e) =>
                setCantidad(Math.max(1, Number(e.target.value) || 1))
              }
              className="mt-1"
            />
          </div>

          {/* Preview */}
          {producto && (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
              Stock actual: <span className="font-medium tabular-nums">{producto.stock}</span>
              {' '}→{' '}
              <span className="font-medium tabular-nums text-primary">
                {producto.stock + cantidad}
              </span>
            </div>
          )}
        </div>

        <DialogFooter showCloseButton={false}>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !productoId || cantidad < 1}
          >
            {isPending
              ? 'Añadiendo...'
              : `Añadir ${cantidad} ${producto?.unidad ?? 'unidades'}`}
          </Button>
          <DialogClose render={<Button variant="outline">Cancelar</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
