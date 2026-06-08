'use client';

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
import { cn } from '@/lib/utils';
import type { Producto } from '@/lib/types/productos';
import { Eye, Pencil } from 'lucide-react';

const currency = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  minimumFractionDigits: 0,
});

interface ProductoTableProps {
  productos: Producto[];
}

export function ProductoTable({ productos }: ProductoTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead className="hidden sm:table-cell">SKU</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead className="hidden sm:table-cell">Costo</TableHead>
            <TableHead className="hidden sm:table-cell">Unidad</TableHead>
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
              <TableCell
                className={cn(
                  'tabular-nums',
                  producto.stock < 50 ? 'font-medium text-red-600' : 'text-muted-foreground'
                )}
              >
                {producto.stock}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-muted-foreground tabular-nums">
                {producto.costo ? currency.format(producto.costo) : '—'}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-muted-foreground">
                {producto.unidad || '—'}
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
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
