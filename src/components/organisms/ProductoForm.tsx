'use client';

import { useActionState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { Producto, ProductoActionResult } from '@/lib/types/productos';
import { cn } from '@/lib/utils';

interface ProductoFormProps {
  producto?: Producto;
  action: (
    prevState: ProductoActionResult | null,
    formData: FormData
  ) => Promise<ProductoActionResult>;
}

function FieldError({ error }: { error?: string[] | null }) {
  if (!error || error.length === 0) return null;
  return (
    <p className="mt-1 text-xs text-destructive" role="alert">
      {error[0]}
    </p>
  );
}

export function ProductoForm({ producto, action }: ProductoFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} key={producto?.id ?? 'create'}>
      <Card>
        <CardHeader>
          <CardTitle>
            {producto ? `Editar: ${producto.nombre}` : 'Nuevo Producto'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Server/network error */}
          {state?.errors?._form && (
            <div
              className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              {state.errors._form[0]}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Nombre */}
            <div className="sm:col-span-2">
              <Label htmlFor="nombre">
                Nombre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nombre"
                name="nombre"
                defaultValue={producto?.nombre ?? ''}
                placeholder="Nombre del producto"
                aria-invalid={!!state?.errors?.nombre}
                required
              />
              <FieldError error={state?.errors?.nombre} />
            </div>

            {/* SKU */}
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                name="sku"
                defaultValue={producto?.sku ?? ''}
                placeholder="Código SKU (opcional)"
                maxLength={50}
              />
              <FieldError error={state?.errors?.sku} />
            </div>

            {/* Unidad */}
            <div>
              <Label htmlFor="unidad">Unidad</Label>
              <Input
                id="unidad"
                name="unidad"
                defaultValue={producto?.unidad ?? ''}
                placeholder="Ej: pieza, kg, litro"
                maxLength={50}
              />
              <FieldError error={state?.errors?.unidad} />
            </div>

            {/* Precio de venta */}
            <div>
              <Label htmlFor="precio_venta">
                Precio de Venta <span className="text-destructive">*</span>
              </Label>
              <Input
                id="precio_venta"
                name="precio_venta"
                type="number"
                step="0.01"
                min="0.01"
                defaultValue={producto?.precio_venta ?? ''}
                placeholder="0.00"
                aria-invalid={!!state?.errors?.precio_venta}
                required
              />
              <FieldError error={state?.errors?.precio_venta} />
            </div>

            {/* Costo */}
            <div>
              <Label htmlFor="costo">Costo</Label>
              <Input
                id="costo"
                name="costo"
                type="number"
                step="0.01"
                min="0"
                defaultValue={producto?.costo ?? ''}
                placeholder="0.00"
              />
              <FieldError error={state?.errors?.costo} />
            </div>

            {/* Stock */}
            <div>
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                step="1"
                min="0"
                defaultValue={producto?.stock ?? 0}
                placeholder="0"
              />
              <FieldError error={state?.errors?.stock} />
            </div>

            {/* Paquete */}
            <div>
              <Label htmlFor="paquete">Paquete</Label>
              <Input
                id="paquete"
                name="paquete"
                defaultValue={producto?.paquete ?? ''}
                placeholder="Nombre del paquete (opcional)"
                maxLength={100}
              />
              <FieldError error={state?.errors?.paquete} />
            </div>

            {/* Descripción */}
            <div className="sm:col-span-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <textarea
                id="descripcion"
                name="descripcion"
                defaultValue={producto?.descripcion ?? ''}
                rows={4}
                placeholder="Descripción del producto..."
                className={cn(
                  'flex min-h-[80px] w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors',
                  'placeholder:text-muted-foreground',
                  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
                  'disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50',
                  'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20'
                )}
              />
              <FieldError error={state?.errors?.descripcion} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending
              ? 'Guardando...'
              : producto
                ? 'Actualizar Producto'
                : 'Crear Producto'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
