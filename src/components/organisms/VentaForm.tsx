'use client';

import { useState, useActionState, startTransition, useRef, useMemo, type FormEvent } from 'react';
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
import { cn } from '@/lib/utils';
import { ESTADOS } from '@/lib/validations/ventas';
import type { Cliente } from '@/lib/types/clientes';
import type { Producto } from '@/lib/types/productos';
import type {
  VentaWithDetails,
  VentaActionResult,
} from '@/lib/types/ventas';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface VentaFormProps {
  clientes: Cliente[];
  productos: Producto[];
  venta?: VentaWithDetails;
  action: (
    prevState: VentaActionResult | null,
    formData: FormData
  ) => Promise<VentaActionResult>;
}

function FieldError({ error }: { error?: string[] | null }) {
  if (!error || error.length === 0) return null;
  return (
    <p className="mt-1 text-xs text-destructive" role="alert">
      {error[0]}
    </p>
  );
}

export function VentaForm({
  clientes,
  productos,
  venta,
  action,
}: VentaFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);
  const isEditMode = !!venta;

  const [receta1Cantidad, setReceta1Cantidad] = useState(
    venta?.venta_productos?.find(
      (vp) => vp.productos?.nombre === 'Galleta Proteica Receta 1'
    )?.cantidad ?? 0
  );
  const [receta1Precio, setReceta1Precio] = useState(
    venta?.venta_productos?.find(
      (vp) => vp.productos?.nombre === 'Galleta Proteica Receta 1'
    )?.precio_unitario ?? 0
  );
  const [receta2Cantidad, setReceta2Cantidad] = useState(
    venta?.venta_productos?.find(
      (vp) => vp.productos?.nombre === 'Galleta Proteica Receta 2'
    )?.cantidad ?? 0
  );
  const [receta2Precio, setReceta2Precio] = useState(
    venta?.venta_productos?.find(
      (vp) => vp.productos?.nombre === 'Galleta Proteica Receta 2'
    )?.precio_unitario ?? 0
  );

  const productoReceta1 = useMemo(
    () => productos.find((p) => p.nombre === 'Galleta Proteica Receta 1'),
    [productos]
  );
  const productoReceta2 = useMemo(
    () => productos.find((p) => p.nombre === 'Galleta Proteica Receta 2'),
    [productos]
  );

  const subtotalReceta1 = receta1Cantidad * receta1Precio;
  const subtotalReceta2 = receta2Cantidad * receta2Precio;
  const total = subtotalReceta1 + subtotalReceta2;

  const stockAlerts = useMemo(() => {
    const alerts: {
      id: string;
      nombre: string;
      stock: number;
      solicitado: number;
      suficiente: boolean;
    }[] = [];

    if (productoReceta1 && receta1Cantidad > 0) {
      alerts.push({
        id: 'receta-1',
        nombre: productoReceta1.nombre,
        stock: productoReceta1.stock,
        solicitado: receta1Cantidad * 1,
        suficiente: receta1Cantidad * 1 <= productoReceta1.stock,
      });
    }

    if (productoReceta2 && receta2Cantidad > 0) {
      alerts.push({
        id: 'receta-2',
        nombre: productoReceta2.nombre,
        stock: productoReceta2.stock,
        solicitado: receta2Cantidad * 4,
        suficiente: receta2Cantidad * 4 <= productoReceta2.stock,
      });
    }

    return alerts;
  }, [productoReceta1, productoReceta2, receta1Cantidad, receta2Cantidad]);

  const hasStockIssues = stockAlerts.some((a) => !a.suficiente);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (receta1Cantidad < 1 && receta2Cantidad < 1) {
      return;
    }

    if (!isEditMode && hasStockIssues) {
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set('receta1_cantidad', String(receta1Cantidad));
    formData.set('receta1_precio', String(receta1Precio));
    formData.set('receta2_cantidad', String(receta2Cantidad));
    formData.set('receta2_precio', String(receta2Precio));

    startTransition(() => {
      formAction(formData);
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} key={venta?.id ?? 'create'}>
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditMode
              ? `Editar Venta #${venta.id.slice(0, 8)}`
              : 'Nueva Venta'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Server/network error */}
          {state?.errors?._form && (
            <div
              className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              {state.errors._form.join('; ')}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Cliente */}
            <div className="sm:col-span-2">
              <Label htmlFor="cliente_id">
                Cliente <span className="text-destructive">*</span>
              </Label>
              <select
                id="cliente_id"
                name="cliente_id"
                defaultValue={venta?.cliente_id ?? ''}
                aria-invalid={!!state?.errors?.cliente_id}
                required
                className={cn(
                  'flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors',
                  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20'
                )}
              >
                <option value="" disabled>
                  Seleccionar cliente...
                </option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                    {cliente.empresa ? ` — ${cliente.empresa}` : ''}
                  </option>
                ))}
              </select>
              <FieldError error={state?.errors?.cliente_id} />
            </div>

            {/* Fecha */}
            <div>
              <Label htmlFor="fecha">
                Fecha <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fecha"
                name="fecha"
                type="date"
                defaultValue={
                  venta?.fecha
                    ? venta.fecha.slice(0, 10)
                    : new Date().toISOString().slice(0, 10)
                }
                aria-invalid={!!state?.errors?.fecha}
                required
              />
              <FieldError error={state?.errors?.fecha} />
            </div>

            {/* Estado */}
            <fieldset>
              <legend className="text-sm leading-none font-medium mb-2">
                Estado <span className="text-destructive">*</span>
              </legend>
              <div className="flex gap-4">
                {ESTADOS.map((estado) => (
                  <label
                    key={estado}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors',
                      'has-data-[checked]:border-primary has-data-[checked]:bg-primary/5',
                      'hover:bg-muted'
                    )}
                  >
                    <input
                      type="radio"
                      name="estado"
                      value={estado}
                      defaultChecked={venta?.estado === estado}
                      className="size-4 accent-primary"
                    />
                    <span className="capitalize">{estado}</span>
                  </label>
                ))}
              </div>
              <FieldError error={state?.errors?.estado} />
            </fieldset>
          </div>

          {/* Stock banner */}
          {(receta1Cantidad > 0 || receta2Cantidad > 0) && (
            <div
              className={cn(
                'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm',
                hasStockIssues
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : 'border-green-200 bg-green-50 text-green-800'
              )}
            >
              {hasStockIssues ? (
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-500" />
              ) : (
                <CheckCircle className="mt-0.5 size-4 shrink-0 text-green-500" />
              )}
              <div className="flex-1">
                {hasStockIssues ? (
                  <div>
                    <span className="font-medium">Stock insuficiente</span>
                    <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs">
                      {stockAlerts
                        .filter((a) => !a.suficiente)
                        .map((a) => (
                          <li key={a.id}>
                            {a.nombre} — solicitaste{' '}
                            <span className="font-semibold">{a.solicitado}</span>{' '}
                            unidades, hay{' '}
                            <span className="font-semibold">{a.stock}</span>{' '}
                            en stock
                          </li>
                        ))}
                    </ul>
                  </div>
                ) : (
                  <span>Stock suficiente para completar la venta</span>
                )}
              </div>
            </div>
          )}

          {/* Productos */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">
              Productos <span className="text-destructive">*</span>
            </h3>

            {/* Receta 1 */}
            <div className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-medium">Receta 1</span>
                <span className="text-xs text-muted-foreground">
                  Stock:{' '}
                  <span className="tabular-nums font-medium">
                    {productoReceta1?.stock ?? 0}
                  </span>{' '}
                  unid
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="r1-cant">Cantidad</Label>
                  <Input
                    id="r1-cant"
                    type="number"
                    min={0}
                    step={1}
                    value={receta1Cantidad || ''}
                    onChange={(e) =>
                      setReceta1Cantidad(Math.max(0, Number(e.target.value) || 0))
                    }
                    disabled={isEditMode}
                    className="mt-1"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="r1-precio">Precio x unid (₡)</Label>
                  <Input
                    id="r1-precio"
                    type="number"
                    min={0}
                    step={0.01}
                    value={receta1Precio || ''}
                    onChange={(e) =>
                      setReceta1Precio(Math.max(0, Number(e.target.value) || 0))
                    }
                    className="mt-1"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground">Subtotal</Label>
                  <p className="mt-1.5 text-right text-lg font-semibold tabular-nums">
                    ₡{subtotalReceta1.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Receta 2 */}
            <div className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-medium">Receta 2</span>
                <span className="text-xs text-muted-foreground">
                  Stock:{' '}
                  <span className="tabular-nums font-medium">
                    {productoReceta2?.stock ?? 0}
                  </span>{' '}
                  unid (
                  {Math.floor((productoReceta2?.stock ?? 0) / 4)} paq)
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="r2-cant">Paquetes</Label>
                  <Input
                    id="r2-cant"
                    type="number"
                    min={0}
                    step={1}
                    value={receta2Cantidad || ''}
                    onChange={(e) =>
                      setReceta2Cantidad(Math.max(0, Number(e.target.value) || 0))
                    }
                    disabled={isEditMode}
                    className="mt-1"
                    placeholder="0"
                  />
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    1 paquete = 4 galletas
                  </p>
                </div>
                <div>
                  <Label htmlFor="r2-precio">Precio x paq (₡)</Label>
                  <Input
                    id="r2-precio"
                    type="number"
                    min={0}
                    step={0.01}
                    value={receta2Precio || ''}
                    onChange={(e) =>
                      setReceta2Precio(Math.max(0, Number(e.target.value) || 0))
                    }
                    className="mt-1"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground">Subtotal</Label>
                  <p className="mt-1.5 text-right text-lg font-semibold tabular-nums">
                    ₡{subtotalReceta2.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-end gap-4 rounded-lg border bg-muted/30 px-4 py-3">
              <span className="text-sm font-medium">Total:</span>
              <span className="text-xl font-bold tabular-nums">
                ₡{total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Notas */}
          <div>
            <Label htmlFor="notas">Notas</Label>
            <textarea
              id="notas"
              name="notas"
              defaultValue={venta?.notas ?? ''}
              rows={3}
              placeholder="Notas adicionales sobre la venta..."
              className={cn(
                'flex min-h-[80px] w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors',
                'placeholder:text-muted-foreground',
                'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
                'disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50',
                'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20'
              )}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col-reverse justify-between gap-4 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isPending || (receta1Cantidad < 1 && receta2Cantidad < 1) || (!isEditMode && hasStockIssues)}
          >
            {isPending
              ? 'Guardando...'
              : isEditMode
                ? 'Actualizar Venta'
                : 'Crear Venta'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
