'use client';

import { useActionState } from 'react';
import { signIn } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { LogIn } from 'lucide-react';

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, undefined);

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-6">
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@scrick.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-red-500">{state.error}</p>
          )}

          <Button
            type="submit"
            disabled={pending}
            className="w-full bg-scrick-salmon text-scrick-charcoal hover:bg-scrick-salmon/90"
          >
            <LogIn className="size-4" />
            {pending ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
