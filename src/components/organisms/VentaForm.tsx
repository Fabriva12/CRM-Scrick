'use client';

import { useState, useActionState, startTransition, useEffect, useMemo, useRef, type FormEvent } from 'react';
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
  Venta,
  VentaWithDetails,
  VentaActionResult,
} from '@/lib/types/ventas';
import { Plus, Trash2, AlertTriangle, CheckCircle, Package } from 'lucide-react';

interface ProductoRow {
  tempId: string;
  producto_id: string;
  cantidad: number;
  precio_venta: number;
  subtotal: number;
}

interface VentaFormProps {
  clientes: Cliente[];
  productos: Producto[];
  venta?: VentaWithDetails;
  action: (
    prevState: VentaActionResult | null,
    formData: FormData
  ) => Promise<VentaActionResult>;
}

let rowCounter = 0;
function nextRowId() {
  rowCounter += 1;
  return `row-${rowCounter}-${Date.now()}`;
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
  const [stockError, setStockError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const isEditMode = !!venta;

  const [productRows, setProductRows] = useState<ProductoRow[]>(
    venta?.venta_productos?.map((vp) => ({
      tempId: nextRowId(),
      producto_id: vp.producto_id,
      cantidad: vp.cantidad,
      precio_venta: vp.precio_unitario,
      subtotal: vp.subtotal,
    })) ?? []
  );

  function addProductRow() {
    setProductRows((prev) => [
      ...prev,
      {
        tempId: nextRowId(),
        producto_id: '',
        cantidad: 1,
        precio_venta: 0,
        subtotal: 0,
      },
    ]);
  }

  function removeProductRow(tempId: string) {
    setProductRows((prev) => prev.filter((r) => r.tempId !== tempId));
  }

  function updateRow(
    tempId: string,
    field: 'producto_id' | 'cantidad',
    value: string
  ) {
    setProductRows((prev) =>
      prev.map((row) => {
        if (row.tempId !== tempId) return row;

        const updated = { ...row };

        if (field === 'producto_id') {
          updated.producto_id = value;
          const prod = productos.find((p) => p.id === value);
          updated.precio_venta = prod?.precio_venta ?? 0;
        } else if (field === 'cantidad') {
          updated.cantidad = Number(value) || 0;
        }

        updated.subtotal = updated.cantidad * updated.precio_venta;
        return updated;
      })
    );
  }

  const total = useMemo(
    () => productRows.reduce((sum, row) => sum + row.subtotal, 0),
    [productRows]
  );

  // Reset stock error when product rows change (user adjusts quantities/products)
  const prevRowsRef = useRef(productRows);
  useEffect(() => {
    if (prevRowsRef.current !== productRows) {
      prevRowsRef.current = productRows;
      if (stockError) setStockError(null);
    }
  });

  // Stock alerts: check each product row against available stock
  const stockAlerts = useMemo(() => {
    return productRows
      .filter((row) => row.producto_id)
      .map((row) => {
        const prod = productos.find((p) => p.id === row.producto_id);
        if (!prod) return null;
        const disponible = prod.stock;
        const solicitado = row.cantidad;
        return {
          tempId: row.tempId,
          nombre: prod.nombre,
          stock: disponible,
          solicitado,
          suficiente: solicitado <= disponible,
          parcial: solicitado > 0 && disponible > 0 && solicitado > disponible,
          sinStock: disponible === 0 && solicitado > 0,
        };
      })
      .filter(Boolean) as {
      tempId: string;
      nombre: string;
      stock: number;
      solicitado: number;
      suficiente: boolean;
      parcial: boolean;
      sinStock: boolean;
    }[];
  }, [productRows, productos]);

  const hasStockIssues = stockAlerts.some((a) => !a.suficiente);
  const hasLowStock = stockAlerts.some((a) => a.parcial);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStockError(null);

    // Block if stock is insufficient
    if (hasStockIssues) {
      const items = stockAlerts
        .filter((a) => !a.suficiente)
        .map(
          (a) =>
            `• ${a.nombre}: solicitaste ${a.solicitado}, hay ${a.stock} en stock`
        )
        .join('\n');
      setStockError(
        `Stock insuficiente para completar la venta:\n${items}`
      );
      return;
    }

    const formData = new FormData(e.currentTarget);

    // Append product rows as repeated form fields
    productRows.forEach((row, index) => {
      formData.set(`producto_${index}_id`, row.producto_id);
      formData.set(`producto_${index}_cantidad`, String(row.cantidad));
    });

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
          {/* Stock error (blocks submit) */}
          {stockError && (
            <div
              className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              <p className="mb-1 font-medium">❌ No se puede crear la venta</p>
              <pre className="whitespace-pre-wrap text-xs">
                {stockError}
              </pre>
            </div>
          )}

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
            {/* Cliente selector */}
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

            {/* Estado (radio buttons) */}
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
          {productRows.some((r) => r.producto_id) && (
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
                          <li key={a.tempId}>
                            {a.nombre} — solicitaste{' '}
                            <span className="font-semibold">{a.solicitado}</span>, hay{' '}
                            <span className="font-semibold">{a.stock}</span> en stock
                          </li>
                        ))}
                    </ul>
                  </div>
                ) : (
                  <span>
                    Stock suficiente para todos los productos{' '}
                    <span className="text-xs opacity-70">
                      ({productos.length} producto{productos.length !== 1 ? 's' : ''} en catálogo)
                    </span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Product lines */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">
                Productos <span className="text-destructive">*</span>
              </h3>
              {!isEditMode && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addProductRow}
                >
                  <Plus className="size-4" />
                  Agregar producto
                </Button>
              )}
            </div>

            {productRows.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">
                {isEditMode
                  ? 'Esta venta no tiene productos asociados.'
                  : 'Agrega al menos un producto a la venta.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-2 font-medium">Producto</th>
                      <th className="py-2 px-2 font-medium">Precio</th>
                      <th className="py-2 px-2 font-medium">Cantidad</th>
                      <th className="py-2 px-2 font-medium text-right">
                        Subtotal
                      </th>
                      {!isEditMode && (
                        <th className="py-2 pl-2 w-10" />
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {productRows.map((row) => (
                      <tr key={row.tempId} className="border-b border-border/50">
                        <td className="py-2 pr-2">
                          {isEditMode ? (
                            <span className="font-medium">
                              {row.producto_id
                                ? productos.find(
                                    (p) => p.id === row.producto_id
                                  )?.nombre ?? 'Producto desconocido'
                                : '—'}
                            </span>
                          ) : (
                            <select
                              value={row.producto_id}
                              onChange={(e) =>
                                updateRow(row.tempId, 'producto_id', e.target.value)
                              }
                              className={cn(
                                'flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2 py-1 text-sm transition-colors sm:min-w-[180px]',
                                'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
                              )}
                            >
                              <option value="" disabled>
                                Seleccionar...
                              </option>
                              {productos.map((prod) => (
                                <option key={prod.id} value={prod.id}>
                                  {prod.nombre}
                                  {prod.sku ? ` (${prod.sku})` : ''} — $
                                  {prod.precio_venta.toFixed(2)}
                                  {prod.stock > 0
                                    ? ` — Stock: ${prod.stock}`
                                    : prod.stock === 0
                                      ? ' — Sin stock'
                                      : ''}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="py-2 px-2">
                          <span className="tabular-nums">
                            ${row.precio_venta.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-2 px-2">
                          {isEditMode ? (
                            <span className="tabular-nums">{row.cantidad}</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="1"
                                step="1"
                                value={row.cantidad}
                                onChange={(e) =>
                                  updateRow(row.tempId, 'cantidad', e.target.value)
                                }
                                className="h-9 w-20"
                              />
                              {(() => {
                                const alert = stockAlerts.find(
                                  (a) => a.tempId === row.tempId
                                );
                                if (!alert || !row.producto_id) return null;
                                if (alert.sinStock)
                                  return (
                                    <span
                                      className="shrink-0 text-xs text-red-600"
                                      title="Sin stock disponible"
                                    >
                                      <Package className="inline size-3.5 align-text-top" />
                                      <span className="ml-0.5">0</span>
                                    </span>
                                  );
                                if (alert.parcial)
                                  return (
                                    <span
                                      className="shrink-0 text-xs text-amber-600"
                                      title={`Stock disponible: ${alert.stock}`}
                                    >
                                      <Package className="inline size-3.5 align-text-top" />
                                      <span className="ml-0.5">{alert.stock}</span>
                                    </span>
                                  );
                                return (
                                  <span
                                    className="shrink-0 text-xs text-green-600"
                                    title="Stock suficiente"
                                  >
                                    <Package className="inline size-3.5 align-text-top" />
                                    <span className="ml-0.5">
                                      {alert.stock - alert.solicitado}
                                    </span>
                                  </span>
                                );
                              })()}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2 text-right tabular-nums">
                          ${row.subtotal.toFixed(2)}
                        </td>
                        {!isEditMode && (
                          <td className="py-2 pl-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => removeProductRow(row.tempId)}
                            >
                              <Trash2 className="size-4 text-destructive" />
                              <span className="sr-only">Eliminar producto</span>
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-medium">
                      <td
                        colSpan={3}
                        className="py-3 text-right text-sm"
                      >
                        Total:
                      </td>
                      <td className="py-3 px-2 text-right tabular-nums text-base">
                        ${total.toFixed(2)}
                      </td>
                      {!isEditMode && <td />}
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
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
            <FieldError error={state?.errors?.notas} />
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
          <Button type="submit" disabled={isPending}>
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
