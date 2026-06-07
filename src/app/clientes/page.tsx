import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import { ClienteTable } from '@/components/organisms/ClienteTable';
import { Button } from '@/components/ui/button';
import { ExportButton } from '@/components/molecules/ExportButton';
import type { Cliente } from '@/lib/types/clientes';
import { Plus, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function ClientesPage() {
  const supabase = createServiceClient();
  const { data: clientes, error } = await supabase
    .from('clientes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error al cargar clientes: ${error.message}`);
  }

  const typedClientes = clientes as unknown as Cliente[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl tracking-wide">Clientes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona tus contactos y empresas
          </p>
        </div>
        <div className="flex items-center gap-2">
          {typedClientes.length > 0 && (
            <ExportButton
              data={typedClientes as unknown as Record<string, unknown>[]}
              columns={[
                { key: 'nombre', label: 'Nombre' },
                { key: 'tipo', label: 'Tipo' },
                { key: 'email', label: 'Email' },
                { key: 'telefono', label: 'Teléfono' },
                { key: 'ciudad', label: 'Ciudad' },
                { key: 'rfc', label: 'RFC' },
                { key: 'empresa', label: 'Empresa' },
                { key: 'notas', label: 'Notas' },
                { key: 'created_at', label: 'Creado', format: 'date' },
              ]}
              filename="clientes-scrick"
            />
          )}
          <Button render={<Link href="/clientes/nuevo" />}>
            <Plus className="size-4" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {typedClientes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="mb-4 size-12 text-muted-foreground/40" />
            <p className="mb-2 text-lg font-medium">No hay clientes registrados</p>
            <p className="mb-6 text-sm text-muted-foreground">
              Crea tu primer cliente para empezar a gestionar tu CRM.
            </p>
            <Button render={<Link href="/clientes/nuevo" />}>
              <Plus className="size-4" />
              Crear primer cliente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ClienteTable clientes={typedClientes} />
      )}
    </div>
  );
}
