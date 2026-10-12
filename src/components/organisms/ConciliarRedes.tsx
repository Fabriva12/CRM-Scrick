'use client';

import { useMemo, useState, useTransition, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';
import { aplicarConciliacion, type ConciliacionRow } from '@/actions/conciliar';
import {
  clasificarFilas,
  parsePlanillaRedes,
  type FilaClasificada,
  type PlanillaRedes,
  type VentaCandidataInput,
} from '@/lib/conciliar-redes';
import { AlertTriangle, Upload } from 'lucide-react';

interface ConciliarRedesProps {
  ventas: VentaCandidataInput[];
  clientes: { id: string; nombre: string }[];
}

interface Resolucion {
  ventaId: string | null;
  clienteNombre: string;
}

const DATALIST_CLIENTES = 'conciliar-clientes';

function Badge({
  tone,
  children,
}: {
  tone: 'nueva' | 'existente' | 'ambigua';
  children: React.ReactNode;
}) {
  const styles: Record<'nueva' | 'existente' | 'ambigua', string> = {
    nueva:
      'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    existente:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    ambigua:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

function candidataLabel(fecha: string | null, cliente: string | null): string {
  const partes = [fecha ?? 'sin fecha', cliente ?? 'sin cliente'];
  return partes.join(' · ');
}

/** Detalle (fecha · monto) de una venta en conflicto, tomado de sus candidatas. */
function ventaDetalle(filas: FilaClasificada[], ventaId: string): string {
  for (const fila of filas) {
    const candidata = fila.candidatas.find((c) => c.ventaId === ventaId);
    if (candidata) {
      return ` (${candidata.fecha} · ${formatCurrency(candidata.montoTotal)})`;
    }
  }
  return '';
}

export function ConciliarRedes({ ventas, clientes }: ConciliarRedesProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fileName, setFileName] = useState<string | null>(null);
  const [planilla, setPlanilla] = useState<PlanillaRedes | null>(null);
  const [clasificadas, setClasificadas] = useState<FilaClasificada[]>([]);
  const [resoluciones, setResoluciones] = useState<Record<string, Resolucion>>(
    {}
  );

  // Grupos de filas que apuntan a la MISMA venta: [ventaId, filas]. Si hay algún
  // grupo con 2+ filas, Aplicar queda bloqueado hasta resolverlo.
  const conflictos = useMemo(() => {
    const porVenta = new Map<string, FilaClasificada[]>();
    for (const fila of clasificadas) {
      const ventaId = resoluciones[fila.fila.clave]?.ventaId;
      if (!ventaId) continue;
      const grupo = porVenta.get(ventaId) ?? [];
      grupo.push(fila);
      porVenta.set(ventaId, grupo);
    }
    return [...porVenta.entries()].filter(([, filas]) => filas.length > 1);
  }, [clasificadas, resoluciones]);

  const ventasEnConflicto = useMemo(
    () => new Set(conflictos.map(([ventaId]) => ventaId)),
    [conflictos]
  );

  const hayConflicto = conflictos.length > 0;

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) {
        toast.error('El archivo no contiene hojas.');
        return;
      }
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        raw: true,
      });
      const parsed = parsePlanillaRedes(rows);
      const resultado = clasificarFilas(parsed.filas, ventas, 2);

      const inicial: Record<string, Resolucion> = {};
      for (const fila of resultado) {
        inicial[fila.fila.clave] = {
          // Solo la candidata única se auto-selecciona; las ambiguas arrancan en
          // "Crear nueva" para no actualizar una venta equivocada sin decisión explícita.
          ventaId:
            fila.resolucion === 'existente' ? fila.candidatas[0]?.ventaId ?? null : null,
          clienteNombre: fila.fila.cliente,
        };
      }

      setPlanilla(parsed);
      setClasificadas(resultado);
      setResoluciones(inicial);
    } catch {
      toast.error('No se pudo leer la planilla. Verificá que sea un archivo .xlsx válido.');
    }
  }

  function setResolucion(clave: string, parcial: Partial<Resolucion>) {
    setResoluciones((prev) => ({
      ...prev,
      [clave]: { ...prev[clave], ...parcial },
    }));
  }

  function handleAplicar() {
    const payload: ConciliacionRow[] = clasificadas.map((fila) => {
      const resolucion = resoluciones[fila.fila.clave];
      return {
        ...fila.fila,
        ventaId: resolucion?.ventaId ?? null,
        clienteNombre: resolucion?.clienteNombre,
      };
    });

    startTransition(async () => {
      try {
        const result = await aplicarConciliacion(payload);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        const resumen = `${result.creadas} creadas, ${result.actualizadas} actualizadas, ${result.clientesCreados} clientes nuevos`;
        if (result.errores.length > 0) {
          toast.warning(`${resumen}. ${result.errores.length} fila(s) con error.`);
        } else {
          toast.success(resumen);
        }
        router.push('/ventas');
      } catch {
        toast.error('Error inesperado al aplicar la conciliación.');
      }
    });
  }

  const totalDetectadas = planilla
    ? planilla.filas.length + planilla.duplicadas.length
    : 0;
  const aplicables = clasificadas.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Planilla de ventas por redes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFile}
              className="h-auto max-w-sm py-1.5"
              aria-label="Seleccionar planilla .xlsx"
            />
            {fileName && (
              <span className="text-sm text-muted-foreground">{fileName}</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Se comparan las filas contra las ventas existentes por fecha (±2 días)
            y monto total. Las filas sin coincidencia se crean como nuevas ventas.
          </p>
          {planilla && (
            <p className="text-sm text-muted-foreground">
              {aplicables} filas listas · {planilla.duplicadas.length} duplicadas ·{' '}
              {planilla.omitidas.length} omitidas
            </p>
          )}
        </CardContent>
      </Card>

      {hayConflicto && (
        <div
          className="flex items-start gap-3 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-900 dark:border-yellow-900/50 dark:bg-yellow-900/20 dark:text-yellow-200"
          role="alert"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div className="space-y-1">
            <span className="font-medium">
              No se puede aplicar: hay ventas asignadas a más de una fila.
            </span>
            {conflictos.map(([ventaId, filas]) => (
              <p key={ventaId} className="mt-0.5">
                Las líneas {filas.map((f) => f.fila.lineaExcel).join(' y ')} apuntan
                a la venta #{ventaId.slice(0, 8)}
                {ventaDetalle(filas, ventaId)}. Elegí &quot;Crear nueva&quot; o cambiá
                la resolución en una de ellas.
              </p>
            ))}
          </div>
        </div>
      )}

      {aplicables === 0 && planilla && !hayConflicto && (
        <div
          className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200"
          role="alert"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            No se puede aplicar: la planilla no tiene filas válidas para conciliar
            {planilla.omitidas.length > 0
              ? ` (${planilla.omitidas.length} omitida(s) sin fecha, cliente o paquetes).`
              : '.'}
          </span>
        </div>
      )}

      {clasificadas.length > 0 && (
        <Card>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Paquetes</TableHead>
                    <TableHead className="text-right">Precio unitario</TableHead>
                    <TableHead className="text-right">Total con envío</TableHead>
                    <TableHead>Resolución</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clasificadas.map((fila) => {
                    const resolucion = resoluciones[fila.fila.clave];
                    return (
                      <TableRow
                        key={fila.fila.clave}
                        className={
                          resolucion?.ventaId &&
                          ventasEnConflicto.has(resolucion.ventaId)
                            ? 'bg-yellow-50 dark:bg-yellow-900/10'
                            : undefined
                        }
                      >
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {fila.fila.fecha}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            list={DATALIST_CLIENTES}
                            value={resolucion?.clienteNombre ?? fila.fila.cliente}
                            onChange={(e) =>
                              setResolucion(fila.fila.clave, {
                                clienteNombre: e.target.value,
                              })
                            }
                            className="h-8 min-w-[180px]"
                            aria-label={`Cliente de la línea ${fila.fila.lineaExcel}`}
                          />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {fila.fila.paquetes}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(fila.fila.precioUnitario)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(fila.fila.totalConEnvio)}
                        </TableCell>
                        <TableCell>
                          {fila.resolucion === 'nueva' && (
                            <Badge tone="nueva">Nueva</Badge>
                          )}
                          {fila.resolucion !== 'nueva' && (
                            <div className="flex flex-col gap-1">
                              <Badge tone={fila.resolucion}>
                                {fila.resolucion === 'existente'
                                  ? 'Existente'
                                  : 'Ambigua'}
                              </Badge>
                              <select
                                value={resolucion?.ventaId ?? ''}
                                onChange={(e) =>
                                  setResolucion(fila.fila.clave, {
                                    ventaId: e.target.value || null,
                                  })
                                }
                                className="h-8 min-w-[220px] rounded-lg border border-input bg-transparent px-2 text-sm"
                                aria-label={`Resolución de la línea ${fila.fila.lineaExcel}`}
                              >
                                {fila.candidatas.map((candidata) => (
                                  <option
                                    key={candidata.ventaId}
                                    value={candidata.ventaId}
                                  >
                                    {candidataLabel(
                                      candidata.fecha,
                                      candidata.clienteNombre
                                    )}{' '}
                                    · {formatCurrency(candidata.montoTotal)}
                                  </option>
                                ))}
                                <option value="">Crear nueva</option>
                              </select>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleAplicar}
                disabled={isPending || hayConflicto || aplicables === 0}
              >
                <Upload className="size-4" />
                {isPending
                  ? 'Aplicando...'
                  : `Aplicar ${aplicables} de ${totalDetectadas} ventas`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <datalist id={DATALIST_CLIENTES}>
        {clientes.map((cliente) => (
          <option key={cliente.id} value={cliente.nombre} />
        ))}
      </datalist>
    </div>
  );
}
