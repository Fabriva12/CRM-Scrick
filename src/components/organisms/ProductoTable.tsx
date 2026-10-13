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
import { formatCurrency } from '@/lib/format';
import { sufijoStock } from '@/lib/recetas';
import type { Producto } from '@/lib/types/productos';
import { Eye, Pencil } from 'lucide-react';

function formatGramos(value: number | null | undefined) {
  if (value == null) return '—';
  return value.toLocaleString('es-CR', { maximumFractionDigits: 2 });
}

interface ProductoTableProps {
  productos: Producto[];
  /** Sección de ingredientes: el encabezado y el valor usan gramos restantes. */
  esSeccionIngredientes?: boolean;
}

export function ProductoTable({
  productos,
  esSeccionIngredientes,
}: ProductoTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>
              {esSeccionIngredientes ? 'Gramos restantes' : 'Stock'}
            </TableHead>
            <TableHead className="hidden sm:table-cell">Costo</TableHead>
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
              <TableCell
                className={cn(
                  'tabular-nums whitespace-nowrap',
                  esSeccionIngredientes
                    ? Number(producto.gramos_restantes ?? 0) < 50
                      ? 'font-medium text-red-600'
                      : 'text-muted-foreground'
                    : producto.stock < 50
                      ? 'font-medium text-red-600'
                      : 'text-muted-foreground'
                )}
              >
                {esSeccionIngredientes
                  ? formatGramos(producto.gramos_restantes)
                  : producto.stock}
                {!esSeccionIngredientes && (
                  <span className="ml-1 text-xs text-muted-foreground/50">
                    {sufijoStock(producto.nombre, producto.unidad || 'unid')}
                  </span>
                )}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-muted-foreground tabular-nums">
                {producto.costo != null ? (
                  <>
                    {formatCurrency(producto.costo)}
                    {producto.tipo === 'ingrediente' && (
                      <span className="ml-0.5 text-xs text-muted-foreground/50">
                        /g
                      </span>
                    )}
                  </>
                ) : (
                  '—'
                )}
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
