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
import { DeleteProductoDialog } from '@/components/organisms/DeleteProductoDialog';
import type { Producto } from '@/lib/types/productos';
import { Eye, Pencil, Trash2 } from 'lucide-react';

interface ProductoTableProps {
  productos: Producto[];
}

export function ProductoTable({ productos }: ProductoTableProps) {
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: string;
    nombre: string;
  }>({ open: false, id: '', nombre: '' });

  function handleDeleteClick(producto: Producto) {
    setDeleteDialog({ open: true, id: producto.id, nombre: producto.nombre });
  }

  function formatDate(dateStr: string) {
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateStr));
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'CRC',
    }).format(value);
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden sm:table-cell">SKU</TableHead>
              <TableHead>Precio Venta</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="hidden sm:table-cell">Unidad</TableHead>
              <TableHead className="hidden sm:table-cell">Creado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productos.map((producto) => (
              <TableRow key={producto.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/productos/${producto.id}`}
                    className="hover:text-primary transition-colors"
                  >
                    {producto.nombre}
                  </Link>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {producto.sku || '—'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatCurrency(producto.precio_venta)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {producto.stock}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {producto.unidad || '—'}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground whitespace-nowrap">
                  {formatDate(producto.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="max-sm:size-11"
                      render={<Link href={`/productos/${producto.id}`} />}
                    >
                      <Eye className="size-4" />
                      <span className="sr-only">Ver</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="max-sm:size-11"
                      render={<Link href={`/productos/${producto.id}/editar`} />}
                    >
                      <Pencil className="size-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="max-sm:size-11"
                      onClick={() => handleDeleteClick(producto)}
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

      <DeleteProductoDialog
        productoId={deleteDialog.id}
        productoNombre={deleteDialog.nombre}
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog((prev) => ({ ...prev, open }))
        }
      />
    </>
  );
}
