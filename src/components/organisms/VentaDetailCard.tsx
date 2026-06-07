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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { VentaEstadoBadge } from '@/components/molecules/VentaEstadoBadge';
import { DeleteVentaDialog } from '@/components/organisms/DeleteVentaDialog';
import type { VentaWithDetails } from '@/lib/types/ventas';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';

interface VentaDetailCardProps {
  venta: VentaWithDetails;
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2 py-2 text-sm border-b border-border/50 last:border-0">
      <span className="font-medium text-muted-foreground">{label}</span>
      <span>{value || '—'}</span>
    </div>
  );
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateStr));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(value);
}

export function VentaDetailCard({ venta }: VentaDetailCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  const subtotalSum =
    venta.venta_productos?.reduce((sum, vp) => sum + vp.subtotal, 0) ?? 0;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle>Venta #{venta.id.slice(0, 8)}</CardTitle>
              <VentaEstadoBadge estado={venta.estado} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Información general */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <DetailRow
              label="Cliente"
              value={venta.clientes?.nombre ?? null}
            />
            <DetailRow label="Fecha" value={formatDate(venta.fecha)} />
            <DetailRow
              label="Total"
              value={formatCurrency(venta.monto_total)}
            />
            <DetailRow label="Notas" value={venta.notas} />
            <DetailRow
              label="Creado"
              value={formatDate(venta.created_at)}
            />
            <DetailRow
              label="Actualizado"
              value={formatDate(venta.updated_at)}
            />
          </div>

          {/* Tabla de productos */}
          <div>
            <h3 className="text-sm font-medium mb-3">Productos</h3>
            {venta.venta_productos && venta.venta_productos.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">
                        Precio Unitario
                      </TableHead>
                      <TableHead className="text-right">Cantidad</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {venta.venta_productos.map((vp) => (
                      <TableRow key={vp.id}>
                        <TableCell className="font-medium">
                          {vp.productos?.nombre ?? 'Producto desconocido'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {vp.productos?.sku || '—'}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(vp.precio_unitario)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {vp.cantidad}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(vp.subtotal)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <tfoot>
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-right font-medium"
                      >
                        Total:
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums">
                        {formatCurrency(subtotalSum)}
                      </TableCell>
                    </TableRow>
                  </tfoot>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-lg">
                Esta venta no tiene productos registrados.
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between gap-4">
          <Button variant="outline" render={<Link href="/ventas" />}>
            <ArrowLeft className="size-4" />
            Volver
          </Button>
          <div className="flex gap-2">
            <Button
              variant="default"
              render={<Link href={`/ventas/${venta.id}/editar`} />}
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

      <DeleteVentaDialog
        ventaId={venta.id}
        ventaLabel={`Venta #${venta.id.slice(0, 8)}`}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
