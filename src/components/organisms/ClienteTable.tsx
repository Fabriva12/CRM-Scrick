'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ClienteBadge } from '@/components/molecules/ClienteBadge';
import { DeleteClienteDialog } from '@/components/organisms/DeleteClienteDialog';
import type { Cliente } from '@/lib/types/clientes';
import { Eye, Pencil, Trash2 } from 'lucide-react';

interface ClienteTableProps {
  clientes: Cliente[];
}

export function ClienteTable({ clientes }: ClienteTableProps) {
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: string;
    nombre: string;
  }>({ open: false, id: '', nombre: '' });

  function handleDeleteClick(cliente: Cliente) {
    setDeleteDialog({ open: true, id: cliente.id, nombre: cliente.nombre });
  }

  function formatDate(dateStr: string) {
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateStr));
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.map((cliente) => (
              <TableRow key={cliente.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/clientes/${cliente.id}`}
                    className="hover:text-primary transition-colors"
                  >
                    {cliente.nombre}
                  </Link>
                </TableCell>
                <TableCell>
                  <ClienteBadge tipo={cliente.tipo} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {cliente.email}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {cliente.ciudad || '—'}
                </TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {formatDate(cliente.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      render={<Link href={`/clientes/${cliente.id}`} />}
                    >
                      <Eye className="size-4" />
                      <span className="sr-only">Ver</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      render={<Link href={`/clientes/${cliente.id}/editar`} />}
                    >
                      <Pencil className="size-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDeleteClick(cliente)}
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">Eliminar</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DeleteClienteDialog
        clienteId={deleteDialog.id}
        clienteNombre={deleteDialog.nombre}
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog((prev) => ({ ...prev, open }))
        }
      />
    </>
  );
}
