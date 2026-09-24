import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import { FiltroMes } from '@/components/organisms/FiltroMes';
import { Button } from '@/components/ui/button';
import { ClienteBadge } from '@/components/molecules/ClienteBadge';
import { formatCurrency } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { ArrowLeft, ReceiptText } from 'lucide-react';

export const dynamic = 'force-dynamic';

function firstDayOfMonth(mes: string): string {
  return `${mes}-01`;
}

function lastDayOfMonth(mes: string): string {
  const [year, month] = mes.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return `${mes}-${String(lastDay).padStart(2, '0')}`;
}

interface VentasPorClientePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

interface FilaCliente {
  id: string;
  nombre: string;
  tipo: string;
  cantidad: number;
  total: number;
}

interface VentaConCliente {
  monto_total: number | string;
  clientes?: { id: string; nombre: string; tipo: string } | null;
}

export default async function VentasPorClientePage({
  searchParams,
}: VentasPorClientePageProps) {
  const { mes } = await searchParams;
  const mesVal =
    typeof mes === 'string' && /^\d{4}-\d{2}$/.test(mes) ? mes : undefined;
  const first = mesVal ? firstDayOfMonth(mesVal) : '0001-01-01';
  const last = mesVal ? lastDayOfMonth(mesVal) : '9999-12-31';

  const supabase = createServiceClient();
  const { data: ventas, error } = await supabase
    .from('ventas')
    .select('id, fecha, monto_total, clientes!inner(nombre, tipo, id)')
    .gte('fecha', first)
    .lte('fecha', last);

  if (error) {
    throw new Error('Error al cargar ventas por cliente: ' + error.message);
  }

  const ventasTyped = ventas as unknown as VentaConCliente[] | null;

  const porCliente = new Map<string, FilaCliente>();
  for (const venta of ventasTyped ?? []) {
    const cliente = Array.isArray(venta.clientes)
      ? venta.clientes[0]
      : venta.clientes;
    if (!cliente) continue;
    const fila = porCliente.get(cliente.id);
    if (fila) {
      fila.cantidad += 1;
      fila.total += Number(venta.monto_total);
    } else {
      porCliente.set(cliente.id, {
        id: cliente.id,
        nombre: cliente.nombre,
        tipo: cliente.tipo,
        cantidad: 1,
        total: Number(venta.monto_total),
      });
    }
  }

  const rows = [...porCliente.values()].sort(
    (a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre)
  );

  const totalVentas = rows.reduce((sum, fila) => sum + fila.cantidad, 0);
  const totalMonto = rows.reduce((sum, fila) => sum + fila.total, 0);

  const subtitulo = mesVal
    ? new Intl.DateTimeFormat('es-MX', {
        month: 'long',
        year: 'numeric',
      }).format(new Date(`${mesVal}-01T12:00:00`))
    : 'Todas las ventas';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl tracking-wide">
            Ventas por Cliente
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitulo}</p>
        </div>
        <div className="flex items-center gap-2">
          <FiltroMes basePath="/clientes/ventas" mes={mesVal} />
          <Button variant="outline" render={<Link href="/clientes" />}>
            <ArrowLeft className="size-4" />
            Volver
          </Button>
        </div>
      </div>

      <Card>
        {rows.length === 0 ? (
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ReceiptText className="mb-4 size-12 text-muted-foreground/40" />
            <p className="mb-2 text-lg font-medium">
              No hay ventas en este periodo.
            </p>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Ventas</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((fila) => (
                <TableRow key={fila.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/clientes/${fila.id}`}
                      className="hover:text-primary transition-colors"
                    >
                      {fila.nombre}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <ClienteBadge
                      tipo={fila.tipo as 'B2B' | 'B2C' | 'PDV'}
                    />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {fila.cantidad}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(fila.total)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/30 font-medium">
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell className="text-right tabular-nums">
                  {totalVentas}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(totalMonto)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}