'use client';

import { useActionState, startTransition, type FormEvent, useRef } from 'react';
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
import { CATEGORIAS } from '@/lib/validations/gastos';
import type { Gasto, GastoActionResult } from '@/lib/types/gastos';

interface GastoFormProps {
  gasto?: Gasto;
  action: (
    prevState: GastoActionResult | null,
    formData: FormData
  ) => Promise<GastoActionResult>;
}

function FieldError({ error }: { error?: string[] | null }) {
  if (!error || error.length === 0) return null;
  return (
    <p className="mt-1 text-xs text-destructive" role="alert">
      {error[0]}
    </p>
  );
}

export function GastoForm({ gasto, action }: GastoFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);
  const isEditMode = !!gasto;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => {
      formAction(formData);
    });
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form ref={formRef} onSubmit={handleSubmit} key={gasto?.id ?? 'create'}>
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditMode
              ? `Editar Gasto #${gasto.id.slice(0, 8)}`
              : 'Nuevo Gasto'}
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
            {/* Categoría */}
            <div>
              <Label htmlFor="categoria">
                Categoría <span className="text-destructive">*</span>
              </Label>
              <select
                id="categoria"
                name="categoria"
                defaultValue={gasto?.categoria ?? CATEGORIAS[0]}
                aria-invalid={!!state?.errors?.categoria}
                required
                className={cn(
                  'flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors',
                  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20'
                )}
              >
                {CATEGORIAS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <FieldError error={state?.errors?.categoria} />
            </div>

            {/* Monto */}
            <div>
              <Label htmlFor="monto">
                Monto <span className="text-destructive">*</span>
              </Label>
              <Input
                id="monto"
                name="monto"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                defaultValue={gasto?.monto ?? ''}
                aria-invalid={!!state?.errors?.monto}
                required
              />
              <FieldError error={state?.errors?.monto} />
            </div>

            {/* Descripción */}
            <div className="sm:col-span-2">
              <Label htmlFor="descripcion">
                Descripción <span className="text-destructive">*</span>
              </Label>
              <Input
                id="descripcion"
                name="descripcion"
                type="text"
                placeholder="Describe el gasto..."
                defaultValue={gasto?.descripcion ?? ''}
                aria-invalid={!!state?.errors?.descripcion}
                required
              />
              <FieldError error={state?.errors?.descripcion} />
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
                  gasto?.fecha ? gasto.fecha.slice(0, 10) : today
                }
                aria-invalid={!!state?.errors?.fecha}
                required
              />
              <FieldError error={state?.errors?.fecha} />
            </div>
          </div>

          {/* Notas */}
          <div>
            <Label htmlFor="notas">Notas</Label>
            <textarea
              id="notas"
              name="notas"
              defaultValue={gasto?.notas ?? ''}
              rows={3}
              placeholder="Notas adicionales sobre el gasto..."
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
                ? 'Actualizar Gasto'
                : 'Crear Gasto'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
