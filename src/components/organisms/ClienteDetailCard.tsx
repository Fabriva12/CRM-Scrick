'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClienteBadge } from '@/components/molecules/ClienteBadge';
import { DeleteClienteDialog } from '@/components/organisms/DeleteClienteDialog';
import { DetailRow } from '@/components/molecules/DetailRow';
import type { Cliente } from '@/lib/types/clientes';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';

interface ClienteDetailCardProps {
  cliente: Cliente;
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

export function ClienteDetailCard({ cliente }: ClienteDetailCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle>{cliente.nombre}</CardTitle>
              <ClienteBadge tipo={cliente.tipo} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-muted/30 p-4">
            <DetailRow label="Email" value={cliente.email} />
            <DetailRow label="Teléfono" value={cliente.telefono} />
            <DetailRow label="Ciudad" value={cliente.ciudad} />
            <DetailRow label="RFC" value={cliente.rfc} />
            <DetailRow label="Empresa" value={cliente.empresa} />
            <DetailRow label="Notas" value={cliente.notas} />
            <DetailRow
              label="Creado"
              value={formatDate(cliente.created_at)}
            />
            <DetailRow
              label="Actualizado"
              value={formatDate(cliente.updated_at)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col-reverse justify-between gap-4 sm:flex-row">
          <Button variant="outline" render={<Link href="/clientes" />}>
            <ArrowLeft className="size-4" />
            Volver
          </Button>
          <div className="flex gap-2">
            <Button
              variant="default"
              render={<Link href={`/clientes/${cliente.id}/editar`} />}
            >
              <Pencil className="size-4" />
              Editar
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-4" />
              Eliminar
            </Button>
          </div>
        </CardFooter>
      </Card>

      <DeleteClienteDialog
        clienteId={cliente.id}
        clienteNombre={cliente.nombre}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
