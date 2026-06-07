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
import type { Cliente, ClienteActionResult } from '@/lib/types/clientes';
import { TIPOS } from '@/lib/validations/clientes';
import { cn } from '@/lib/utils';

interface ClienteFormProps {
  cliente?: Cliente;
  action: (
    prevState: ClienteActionResult | null,
    formData: FormData
  ) => Promise<ClienteActionResult>;
}

function FieldError({ error }: { error?: string[] | null }) {
  if (!error || error.length === 0) return null;
  return (
    <p className="mt-1 text-xs text-destructive" role="alert">
      {error[0]}
    </p>
  );
}

export function ClienteForm({ cliente, action }: ClienteFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} key={cliente?.id ?? 'create'}>
      <Card>
        <CardHeader>
          <CardTitle>
            {cliente ? `Editar: ${cliente.nombre}` : 'Nuevo Cliente'}
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
                defaultValue={cliente?.nombre ?? ''}
                placeholder="Nombre completo o razón social"
                aria-invalid={!!state?.errors?.nombre}
                required
              />
              <FieldError error={state?.errors?.nombre} />
            </div>

            {/* Tipo (radio group) */}
            <fieldset className="sm:col-span-2">
              <legend className="text-sm leading-none font-medium mb-2">
                Tipo <span className="text-destructive">*</span>
              </legend>
              <div className="flex gap-4">
                {TIPOS.map((tipo) => (
                  <label
                    key={tipo}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors',
                      'has-data-[checked]:border-primary has-data-[checked]:bg-primary/5',
                      'hover:bg-muted'
                    )}
                  >
                    <input
                      type="radio"
                      name="tipo"
                      value={tipo}
                      defaultChecked={cliente?.tipo === tipo}
                      className="size-4 accent-primary"
                    />
                    <span>{tipo === 'B2B' ? 'Empresa (B2B)' : 'Persona (B2C)'}</span>
                  </label>
                ))}
              </div>
              <FieldError error={state?.errors?.tipo} />
            </fieldset>

            {/* Email */}
            <div>
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={cliente?.email ?? ''}
                placeholder="correo@ejemplo.com"
                aria-invalid={!!state?.errors?.email}
                required
              />
              <FieldError error={state?.errors?.email} />
            </div>

            {/* Teléfono */}
            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                name="telefono"
                type="tel"
                defaultValue={cliente?.telefono ?? ''}
                placeholder="+52 55 1234 5678"
              />
              <FieldError error={state?.errors?.telefono} />
            </div>

            {/* Ciudad */}
            <div>
              <Label htmlFor="ciudad">Ciudad</Label>
              <Input
                id="ciudad"
                name="ciudad"
                defaultValue={cliente?.ciudad ?? ''}
                placeholder="Ciudad"
              />
              <FieldError error={state?.errors?.ciudad} />
            </div>

            {/* RFC */}
            <div>
              <Label htmlFor="rfc">RFC</Label>
              <Input
                id="rfc"
                name="rfc"
                defaultValue={cliente?.rfc ?? ''}
                placeholder="RFC (opcional)"
                maxLength={13}
              />
              <FieldError error={state?.errors?.rfc} />
            </div>

            {/* Empresa */}
            <div className="sm:col-span-2">
              <Label htmlFor="empresa">Empresa</Label>
              <Input
                id="empresa"
                name="empresa"
                defaultValue={cliente?.empresa ?? ''}
                placeholder="Nombre de la empresa"
              />
              <FieldError error={state?.errors?.empresa} />
            </div>

            {/* Notas */}
            <div className="sm:col-span-2">
              <Label htmlFor="notas">Notas</Label>
              <textarea
                id="notas"
                name="notas"
                defaultValue={cliente?.notas ?? ''}
                rows={4}
                placeholder="Notas adicionales..."
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
              : cliente
                ? 'Actualizar Cliente'
                : 'Crear Cliente'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
