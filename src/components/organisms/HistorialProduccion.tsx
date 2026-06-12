'use client';

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { HistorialConProducto } from '@/lib/types/produccion';
import { CookingPot, FileDown, Package } from 'lucide-react';
import * as XLSX from 'xlsx';

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

  function exportarExcel() {
    const data = historial.map((entry) => ({
      Fecha: new Intl.DateTimeFormat('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(entry.created_at)),
      Lote: entry.lote,
      Receta: entry.receta_nombre,
      Producto: entry.productos?.nombre ?? '—',
      Cantidad: entry.cantidad,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Historial');
    XLSX.writeFile(wb, `historial-produccion-${new Date().toISOString().slice(0, 10)}.xlsx`);
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
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={exportarExcel}>
          <FileDown className="mr-2 size-4" />
          Exportar Excel
        </Button>
      </div>
      <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Lote</TableHead>
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
                  <TableCell className="font-mono text-xs">{entry.lote}</TableCell>
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
      </div>
    );
  }
