'use client';

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import type { HistorialConProducto } from '@/lib/types/produccion';
import { CookingPot, Package } from 'lucide-react';

interface HistorialProduccionProps {
  historial: HistorialConProducto[];
}

export function HistorialProduccion({ historial }: HistorialProduccionProps) {
  function formatDate(dateStr: string) {
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  }

  if (historial.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <CookingPot className="mb-4 size-12 text-muted-foreground/40" />
        <p className="mb-2 text-lg font-medium">No hay producción registrada</p>
        <p className="mb-6 text-sm text-muted-foreground">
          Producí galletas para ver el historial aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Receta</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead className="text-right">Cantidad</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {historial.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDate(entry.created_at)}
              </TableCell>
              <TableCell>{entry.receta_nombre}</TableCell>
              <TableCell>
                <span className="flex items-center gap-1.5">
                  <Package className="size-3.5 text-muted-foreground" />
                  {entry.productos?.nombre ?? '—'}
                </span>
              </TableCell>
              <TableCell className="text-right tabular-nums font-medium">
                {entry.cantidad}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
