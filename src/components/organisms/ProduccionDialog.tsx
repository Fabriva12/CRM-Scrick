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
import { RECETAS } from '@/lib/recetas';
import { producir } from '@/actions/produccion';
import { cn } from '@/lib/utils';
import { CookingPot, Package, AlertTriangle } from 'lucide-react';

interface ProduccionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProduccionDialog({
  open,
  onOpenChange,
}: ProduccionDialogProps) {
  const [recetaId, setRecetaId] = useState<string>(RECETAS[0]?.id ?? '');
  const [cantidad, setCantidad] = useState<number>(1);
  const [isPending, setIsPending] = useState(false);

  const receta = RECETAS.find((r) => r.id === recetaId);

  function handleRecetaChange(id: string) {
    setRecetaId(id);
    setCantidad(1);
  }

  async function handleSubmit() {
    if (!receta || cantidad < 1) return;

    setIsPending(true);
    try {
      const result = await producir(receta.id, cantidad);
      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
        setCantidad(1);
      } else {
        toast.error(result.error);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('Error al producir:', msg);
      toast.error(`Error inesperado: ${msg}`);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            <CookingPot className="mr-2 inline size-5 align-text-top" />
            Producir Galletas
          </DialogTitle>
          <DialogDescription>
            Seleccioná la receta y la cantidad de galletas a producir. Se
            descontará el stock de los ingredientes automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 overflow-y-auto px-1 py-1">
          {/* Selector de receta */}
          <fieldset>
            <legend className="text-sm font-medium mb-2">Receta</legend>
            <div className="flex gap-3">
              {RECETAS.map((r) => (
                <label
                  key={r.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors flex-1',
                    'has-data-[checked]:border-primary has-data-[checked]:bg-primary/5',
                    'hover:bg-muted'
                  )}
                >
                  <input
                    type="radio"
                    name="receta"
                    value={r.id}
                    checked={recetaId === r.id}
                    onChange={() => handleRecetaChange(r.id)}
                    className="size-4 accent-primary"
                  />
                  {r.nombre}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Cantidad */}
          <div>
            <Label htmlFor="cantidad">
              Cantidad de galletas
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

          {/* Resumen de ingredientes */}
          {receta && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="font-medium text-muted-foreground">
                  <Package className="mr-1 inline size-4 align-text-top" />
                  Se descontará del stock
                </span>
                <span className="text-xs text-muted-foreground">
                  por galleta → total
                </span>
              </div>
              <ul className="space-y-1.5 text-sm">
                {receta.ingredientes.map((ing) => {
                  const total = ing.cantidad * cantidad;
                  return (
                    <li
                      key={ing.nombre}
                      className="flex items-center justify-between border-b border-border/30 pb-1 last:border-0"
                    >
                      <span className="text-muted-foreground">
                        {ing.nombre}
                      </span>
                      <span className="tabular-nums font-medium">
                        {ing.cantidad.toFixed(2)}g{' '}
                        <span className="text-muted-foreground">→</span>{' '}
                        <span className={total > 100 ? 'text-amber-600' : ''}>
                          {total.toFixed(2)}g
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {!receta && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="size-4 shrink-0" />
              No hay recetas configuradas.
            </div>
          )}
        </div>

        <DialogFooter showCloseButton={false}>
          <Button
            onClick={handleSubmit}
            disabled={isPending || !receta || cantidad < 1}
          >
            {isPending
              ? 'Produciendo...'
              : `Producir ${cantidad} ${cantidad === 1 ? 'galleta' : 'galletas'}`}
          </Button>
          <DialogClose render={<Button variant="outline">Cancelar</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
