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
import { RECETAS } from '@/lib/recetas';
import { formatCurrency } from '@/lib/format';
import type { Cliente } from '@/lib/types/clientes';
import type { Producto } from '@/lib/types/productos';
import type {
  VentaWithDetails,
  VentaActionResult,
} from '@/lib/types/ventas';
import { AlertTriangle, CheckCircle, Truck, ChevronDown, ChevronUp } from 'lucide-react';

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

  const [cantidades, setCantidades] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const r of RECETAS) {
      init[r.id] =
        venta?.venta_productos?.find(
          (vp) => vp.productos?.nombre === r.producto_nombre
        )?.cantidad ?? 0;
    }
    return init;
  });
  const [precios, setPrecios] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const r of RECETAS) {
      init[r.id] =
        venta?.venta_productos?.find(
          (vp) => vp.productos?.nombre === r.producto_nombre
        )?.precio_unitario ?? 0;
    }
    return init;
  });

  const [envioOpen, setEnvioOpen] = useState(false);
  const [envioPaga, setEnvioPaga] = useState(0);
  const [envioCubre, setEnvioCubre] = useState(0);

  const productosRecetas = useMemo(() => {
    const map: Record<string, Producto | undefined> = {};
    for (const r of RECETAS) {
      map[r.id] = productos.find((p) => p.nombre === r.producto_nombre);
    }
    return map;
  }, [productos]);

  const subtotales = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const r of RECETAS) {
      totals[r.id] = (cantidades[r.id] ?? 0) * (precios[r.id] ?? 0);
    }
    return totals;
  }, [cantidades, precios]);

  const total = RECETAS.reduce((acc, r) => acc + (subtotales[r.id] ?? 0), 0);

  const stockAlerts = useMemo(() => {
    const alerts: {
      id: string;
      nombre: string;
      stock: number;
      solicitado: number;
      suficiente: boolean;
    }[] = [];

    for (const r of RECETAS) {
      const cantidad = cantidades[r.id] ?? 0;
      const producto = productosRecetas[r.id];
      if (producto && cantidad > 0) {
        const solicitado = cantidad;
        alerts.push({
          id: r.id,
          nombre: producto.nombre,
          stock: producto.stock,
          solicitado,
          suficiente: solicitado <= producto.stock,
        });
      }
    }

    return alerts;
  }, [productosRecetas, cantidades]);

  const hasStockIssues = stockAlerts.some((a) => !a.suficiente);
  const tieneProductos = RECETAS.some((r) => (cantidades[r.id] ?? 0) >= 1);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!tieneProductos) {
      return;
    }

    if (!isEditMode && hasStockIssues) {
      return;
    }

    const formData = new FormData(e.currentTarget);
    for (const r of RECETAS) {
      formData.set(`${r.id}_cantidad`, String(cantidades[r.id] ?? 0));
      formData.set(`${r.id}_precio`, String(precios[r.id] ?? 0));
    }
    formData.set('envio_paga_cliente', String(envioPaga));
    formData.set('envio_cubrimos', String(envioCubre));

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
          {tieneProductos && (
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
                        .map((a) => {
                          const receta = RECETAS.find((r) => r.id === a.id);
                          const esPaquete = receta
                            ? receta.galletasPorUnidad > 1
                            : false;
                          const unidad = esPaquete
                            ? a.solicitado === 1
                              ? 'paquete'
                              : 'paquetes'
                            : a.solicitado === 1
                              ? 'unidad'
                              : 'unidades';
                          return (
                            <li key={a.id}>
                              {a.nombre} — solicitaste{' '}
                              <span className="font-semibold">
                                {a.solicitado}
                              </span>{' '}
                              {unidad}, hay{' '}
                              <span className="font-semibold">{a.stock}</span>{' '}
                              en stock
                            </li>
                          );
                        })}
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

            {/* Receta blocks */}
            {RECETAS.map((r) => {
              const producto = productosRecetas[r.id];
              const esPaquete = r.galletasPorUnidad > 1;
              const cantidad = cantidades[r.id] ?? 0;
              const precio = precios[r.id] ?? 0;
              return (
                <div key={r.id} className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-medium">{r.producto_nombre}</span>
                    <span className="text-xs text-muted-foreground">
                      Stock:{' '}
                      <span className="tabular-nums font-medium">
                        {producto?.stock ?? 0}
                      </span>{' '}
                      {esPaquete ? 'paq' : 'unid'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor={`${r.id}-cant`}>
                        {esPaquete ? 'Paquetes' : 'Cantidad'}
                      </Label>
                      <Input
                        id={`${r.id}-cant`}
                        type="number"
                        min={0}
                        step={1}
                        value={cantidad || ''}
                        onChange={(e) =>
                          setCantidades((prev) => ({
                            ...prev,
                            [r.id]: Math.max(0, Number(e.target.value) || 0),
                          }))
                        }
                        disabled={isEditMode}
                        className="mt-1"
                        placeholder="0"
                      />
                      {esPaquete && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          1 paquete = {r.galletasPorUnidad} galletas
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor={`${r.id}-precio`}>
                        Precio x {esPaquete ? 'paq' : 'unid'} (₡)
                      </Label>
                      <Input
                        id={`${r.id}-precio`}
                        type="number"
                        min={0}
                        step={1}
                        value={precio || ''}
                        onChange={(e) =>
                          setPrecios((prev) => ({
                            ...prev,
                            [r.id]: Math.max(0, Math.round(Number(e.target.value) || 0)),
                          }))
                        }
                        className="mt-1"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Subtotal</Label>
                      <p className="mt-1.5 text-right text-lg font-semibold tabular-nums">
                        {formatCurrency(subtotales[r.id] ?? 0)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Total */}
            <div className="flex items-center justify-end gap-4 rounded-lg border bg-muted/30 px-4 py-3">
              <div className="text-right">
                {envioPaga > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Sin envío: {formatCurrency(total)}
                  </p>
                )}
                <span className="text-sm font-medium">
                  Total{envioPaga > 0 ? ' con envío' : ''}:
                </span>
              </div>
              <span className="text-xl font-bold tabular-nums">
                {formatCurrency(total + envioPaga)}
              </span>
            </div>
          </div>

          {!isEditMode && (
            <div className="rounded-lg border">
              <button
                type="button"
                onClick={() => setEnvioOpen((o) => !o)}
                className="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/40"
              >
                <span className="flex items-center gap-2">
                  <Truck className="size-4 text-muted-foreground" />
                  Envío
                  {(envioPaga > 0 || envioCubre > 0) && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      Activado
                    </span>
                  )}
                </span>
                {envioOpen ? (
                  <ChevronUp className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="size-4 text-muted-foreground" />
                )}
              </button>
              {envioOpen && (
                <div className="grid gap-4 border-t p-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="envio-paga">Paga cliente (₡)</Label>
                    <Input
                      id="envio-paga"
                      type="number"
                      min={0}
                      step={1}
                      value={envioPaga || ''}
                      onChange={(e) =>
                        setEnvioPaga(
                          Math.max(0, Math.round(Number(e.target.value) || 0))
                        )
                      }
                      className="mt-1"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="envio-cubre">Cubrimos (₡)</Label>
                    <Input
                      id="envio-cubre"
                      type="number"
                      min={0}
                      step={1}
                      value={envioCubre || ''}
                      onChange={(e) =>
                        setEnvioCubre(
                          Math.max(0, Math.round(Number(e.target.value) || 0))
                        )
                      }
                      className="mt-1"
                      placeholder="0"
                    />
                  </div>
                  {(envioPaga > 0 || envioCubre > 0) && (
                    <p className="text-xs text-muted-foreground sm:col-span-2">
                      Envío: cliente paga{' '}
                      <span className="font-medium tabular-nums">
                        {formatCurrency(envioPaga)}
                      </span>
                      , cubrimos{' '}
                      <span className="font-medium tabular-nums">
                        {formatCurrency(envioCubre)}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

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
            disabled={isPending || !tieneProductos || (!isEditMode && hasStockIssues)}
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
