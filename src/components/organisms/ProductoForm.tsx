'use client';

import { useActionState, useState } from 'react';
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
import { buscarRecetaPorProducto, calcularCostoReceta } from '@/lib/recetas';
import { calcularCostoPorGramo } from '@/lib/validations/productos';
import type {
  Producto,
  ProductoActionResult,
  TipoProducto,
} from '@/lib/types/productos';

interface ProductoFormProps {
  producto?: Producto;
  action: (
    prevState: ProductoActionResult | null,
    formData: FormData
  ) => Promise<ProductoActionResult>;
  /** Costo por gramo de cada ingrediente, para calcular el costo de paquetes con receta */
  costosIngredientes?: Record<string, number | null | undefined>;
}

function FieldError({ error }: { error?: string[] | null }) {
  if (!error || error.length === 0) return null;
  return (
    <p className="mt-1 text-xs text-destructive" role="alert">
      {error[0]}
    </p>
  );
}

export function ProductoForm({ producto, action, costosIngredientes }: ProductoFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);
  const [tipo, setTipo] = useState<TipoProducto>(
    producto?.tipo ?? 'ingrediente'
  );
  const esIngredienteProducto = tipo === 'ingrediente';

  // Paquete con receta: el costo sale de la fórmula (suma de cantidad ×
  // costo por gramo de cada ingrediente). Solo se muestra en edición, cuando
  // el nombre fijo permite saber la receta.
  const recetaProducto = buscarRecetaPorProducto(producto?.nombre ?? '');
  const costoReceta =
    recetaProducto && costosIngredientes
      ? calcularCostoReceta(recetaProducto, costosIngredientes)
      : null;
  const sinCostoIngredientes =
    recetaProducto && costosIngredientes
      ? recetaProducto.ingredientes.filter(
          (ing) => costosIngredientes[ing.nombre] == null
        )
      : [];

  const [costoTotal, setCostoTotal] = useState<string>(
    producto?.costo_total != null ? String(producto.costo_total) : ''
  );
  const [cantidadComprada, setCantidadComprada] = useState<string>(
    producto?.cantidad_comprada != null ? String(producto.cantidad_comprada) : ''
  );
  const costoPorGramo = calcularCostoPorGramo(
    Number(costoTotal),
    Number(cantidadComprada)
  );
  const formatoPorGramo = new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });

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

            {/* Tipo: define si es ingrediente o paquete producido */}
            <div>
              <Label htmlFor="tipo">
                Tipo <span className="text-destructive">*</span>
              </Label>
              <select
                id="tipo"
                name="tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoProducto)}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="ingrediente">Ingrediente</option>
                <option value="paquete">Paquete / Producto</option>
              </select>
              <FieldError error={state?.errors?.tipo} />
            </div>

            {/* Precio de venta: solo productos de receta, no ingredientes */}
            {!esIngredienteProducto && (
              <div>
                <Label htmlFor="precio_venta">
                  Precio de Venta <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="precio_venta"
                  name="precio_venta"
                  type="number"
                  step="1"
                  min="1"
                  defaultValue={producto?.precio_venta ?? ''}
                  placeholder="0"
                  aria-invalid={!!state?.errors?.precio_venta}
                  required
                />
                <FieldError error={state?.errors?.precio_venta} />
              </div>
            )}

            {/* Costo: ingredientes cargan costo total + cantidad comprada */}
            {esIngredienteProducto ? (
              <>
                <div>
                  <Label htmlFor="costo_total">Costo</Label>
                  <Input
                    id="costo_total"
                    name="costo_total"
                    type="number"
                    step="1"
                    min="0"
                    value={costoTotal}
                    onChange={(e) => setCostoTotal(e.target.value)}
                    placeholder="0"
                    aria-invalid={!!state?.errors?.costo_total}
                  />
                  <FieldError error={state?.errors?.costo_total} />
                </div>
                <div>
                  <Label htmlFor="cantidad_comprada">Cantidad</Label>
                  <Input
                    id="cantidad_comprada"
                    name="cantidad_comprada"
                    type="number"
                    step="0.01"
                    min="0"
                    value={cantidadComprada}
                    onChange={(e) => setCantidadComprada(e.target.value)}
                    placeholder="0"
                    aria-invalid={!!state?.errors?.cantidad_comprada}
                  />
                  <FieldError error={state?.errors?.cantidad_comprada} />
                </div>
                <div>
                  <Label>Costo por gramo</Label>
                  <p className="mt-1.5 rounded-lg bg-muted/50 px-3 py-2 text-sm font-medium tabular-nums">
                    {costoPorGramo != null
                      ? `${formatoPorGramo.format(costoPorGramo)} por gramo`
                      : 'Cargá ambos montos para calcularlo'}
                  </p>
                </div>
              </>
            ) : recetaProducto ? (
              <div>
                <Label>Costo</Label>
                <p className="mt-1.5 rounded-lg bg-muted/50 px-3 py-2 text-sm font-medium tabular-nums">
                  {costoReceta != null ? (
                    <>
                      {formatoPorGramo.format(costoReceta)} por unidad —{' '}
                      <span className="font-normal text-muted-foreground">
                        calculado con la receta
                      </span>
                    </>
                  ) : (
                    <span className="font-normal text-muted-foreground">
                      {sinCostoIngredientes.length > 0
                        ? `Falta cargar el costo de: ${sinCostoIngredientes
                            .map((ing) => ing.nombre)
                            .join(', ')}`
                        : 'No se puede calcular el costo por la receta'}
                    </span>
                  )}
                </p>
              </div>
            ) : (
              <div>
                <Label htmlFor="costo">Costo</Label>
                <Input
                  id="costo"
                  name="costo"
                  type="number"
                  step="1"
                  min="0"
                  defaultValue={producto?.costo ?? ''}
                  placeholder="0"
                />
                <FieldError error={state?.errors?.costo} />
              </div>
            )}

            {/* Cantidad disponible: gramos para ingredientes, stock para paquetes */}
            {esIngredienteProducto ? (
              <div>
                <Label htmlFor="gramos_restantes">Gramos restantes (g)</Label>
                <Input
                  id="gramos_restantes"
                  name="gramos_restantes"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={producto?.gramos_restantes ?? ''}
                  placeholder="0"
                />
                <FieldError error={state?.errors?.gramos_restantes} />
              </div>
            ) : (
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
            )}
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
              : producto
                ? 'Actualizar Producto'
                : 'Crear Producto'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
