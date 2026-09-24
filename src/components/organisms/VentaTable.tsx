"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VentaEstadoBadge } from "@/components/molecules/VentaEstadoBadge";
import { DeleteVentaDialog } from "@/components/organisms/DeleteVentaDialog";
import { formatCurrency } from "@/lib/format";
import type { Venta } from "@/lib/types/ventas";
import { Eye, Pencil, Trash2 } from "lucide-react";

interface VentaTableProps {
  ventas: Venta[];
}

export function VentaTable({ ventas }: VentaTableProps) {
  const [busqueda, setBusqueda] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: string;
    label: string;
  }>({ open: false, id: "", label: "" });

  const filtered = ventas.filter(
    (venta) =>
      !busqueda.trim() ||
      venta.clientes?.nombre
        .toLowerCase()
        .includes(busqueda.trim().toLowerCase())
  );

  function handleDeleteClick(venta: Venta) {
    const label = `Venta #${venta.id.slice(0, 8)}`;
    setDeleteDialog({ open: true, id: venta.id, label });
  }

  function formatDate(dateStr: string) {
    return new Intl.DateTimeFormat("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(dateStr));
  }

  function notaLegible(nota: string | null): string | null {
    if (!nota) return null;
    const clean = nota.replace(/^Venta:\s*/i, "").trim();
    return clean || null;
  }

  return (
    <>
      <div className="mb-4">
        <Input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por cliente..."
          className="h-9 sm:max-w-xs"
        />
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead className="hidden sm:table-cell">Fecha</TableHead>
              <TableHead className="hidden sm:table-cell">Estado</TableHead>
              <TableHead className="text-right">Monto Total</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((venta) => (
              <TableRow key={venta.id}>
                <TableCell className="min-w-0 font-medium">
                  <Link
                    href={`/ventas/${venta.id}`}
                    className="hover:text-primary transition-colors"
                  >
                    {venta.clientes?.nombre ?? "Cliente desconocido"}
                  </Link>
                  {notaLegible(venta.notas) && (
                    <p
                      className="mt-0.5 max-w-[320px] truncate text-xs font-normal text-muted-foreground"
                      title={notaLegible(venta.notas)!}
                    >
                      {notaLegible(venta.notas)}
                    </p>
                  )}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground whitespace-nowrap">
                  {formatDate(venta.fecha)}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <VentaEstadoBadge estado={venta.estado} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(venta.monto_total)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="max-sm:size-11"
                      render={<Link href={`/ventas/${venta.id}`} />}
                    >
                      <Eye className="size-4" />
                      <span className="sr-only">Ver</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="max-sm:size-11"
                      render={<Link href={`/ventas/${venta.id}/editar`} />}
                    >
                      <Pencil className="size-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="max-sm:size-11"
                      onClick={() => handleDeleteClick(venta)}
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">Eliminar</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  No hay ventas que coincidan con el filtro
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DeleteVentaDialog
        ventaId={deleteDialog.id}
        ventaLabel={deleteDialog.label}
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
      />
    </>
  );
}
