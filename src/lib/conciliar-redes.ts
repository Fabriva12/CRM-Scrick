/**
 * Conciliación de la planilla "ventas por redes" (Excel) contra ventas existentes.
 *
 * La planilla tiene 16 columnas (header en la fila donde B = "Fecha"):
 *   A: serial de fecha repetido | B: Fecha | C: Número | D: Cliente | E: Canal |
 *   F: Distribuidor | G: Paquetes | H: Precio unitario ₡ | I: Costo de envío |
 *   J: Cobro de envío | K: Total por galletas | L: Total con envío |
 *   M: Costo total de la venta | N: Margen | O: Estado entrega | P: Pago
 *
 * Semántica de envío:
 *   - "Costo de envío" (I) = lo que el negocio paga -> venta_envios.cubrimos + gasto Transporte.
 *   - "Cobro de envío" (J) = lo que paga el cliente -> venta_envios.paga_cliente (sube monto_total).
 *   - "Total con envío" (L) = Total por galletas + Cobro de envío -> venta.monto_total.
 */

export const PRODUCTO_GALLETA = 'Galleta Chocolate Blanco';
export const FUENTE_REDES = 'Redes Sociales';
export const NOTAS_IMPORT = 'Importada — ventas por redes';

/** Una fila única de la planilla, lista para conciliar. */
export interface VentaRedesRow {
  /** Clave de deduplicación: fecha|número|cliente|paquetes|precio */
  clave: string;
  /** Número de fila en la planilla (1-based) para trazabilidad */
  lineaExcel: number;
  fecha: string; // YYYY-MM-DD
  numero: string | null;
  cliente: string;
  canal: string | null;
  distribuidor: string | null;
  paquetes: number;
  precioUnitario: number;
  costoEnvio: number;
  cobroEnvio: number;
  totalGalletas: number;
  totalConEnvio: number;
  costoTotal: number | null;
  margen: number | null;
  estadoEntrega: string | null;
  pago: string | null;
}

export interface PlanillaRedes {
  filas: VentaRedesRow[];
  duplicadas: VentaRedesRow[];
  omitidas: { lineaExcel: number; motivo: string }[];
}

const MS_DIA = 86_400_000;

/** Convierte una celda de fecha del Excel (serial o "YYYY-MM-DD") a "YYYY-MM-DD". */
export function faFechaDeCelda(valor: unknown): string | null {
  if (valor == null || valor === '') return null;
  if (typeof valor === 'number' && Number.isFinite(valor)) {
    const fecha = new Date(Date.UTC(1899, 11, 30) + Math.round(valor) * MS_DIA);
    return fecha.toISOString().slice(0, 10);
  }
  const s = String(valor).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const serial = Number(s);
  if (Number.isFinite(serial) && serial > 10_000) {
    const fecha = new Date(Date.UTC(1899, 11, 30) + Math.round(serial) * MS_DIA);
    return fecha.toISOString().slice(0, 10);
  }
  return null;
}

/** Nombre normalizado para find-or-create: minúsculas, sin espacios y sin tildes. */
export function normalizarNombreCliente(nombre: string): string {
  return nombre
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const H = {
  f: 1,
  num: 2,
  cli: 3,
  canal: 4,
  dist: 5,
  paq: 6,
  pre: 7,
  cenv: 8,
  cob: 9,
  tg: 10,
  tc: 11,
  costo: 12,
  margen: 13,
  entrega: 14,
  pago: 15,
} as const;

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function str(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

/**
 * Parsea las filas crudas de `sheet_to_json(header:1, raw:true)`:
 * detecta el header, calcula totales y descarta duplicados por clave.
 */
export function parsePlanillaRedes(rows: unknown[][]): PlanillaRedes {
  let hdr = -1;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (r && r[H.f] === 'Fecha') {
      hdr = i;
      break;
    }
  }
  if (hdr === -1) {
    return { filas: [], duplicadas: [], omitidas: [{ lineaExcel: 0, motivo: 'No se encontró la columna Fecha' }] };
  }

  const filas: VentaRedesRow[] = [];
  const duplicadas: VentaRedesRow[] = [];
  const omitidas: { lineaExcel: number; motivo: string }[] = [];
  const vistas = new Set<string>();

  for (let i = hdr + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;

    const fecha = faFechaDeCelda(r[H.f]);
    if (!fecha) {
      omitidas.push({ lineaExcel: i + 1, motivo: 'Sin fecha válida' });
      continue;
    }
    const cliente = str(r[H.cli]);
    if (!cliente) {
      omitidas.push({ lineaExcel: i + 1, motivo: 'Sin cliente' });
      continue;
    }
    const paquetes = Math.round(num(r[H.paq]));
    if (paquetes <= 0) {
      omitidas.push({ lineaExcel: i + 1, motivo: 'Sin paquetes' });
      continue;
    }

    const precioUnitario = num(r[H.pre]);
    const costoEnvio = num(r[H.cenv]);
    const cobroEnvio = num(r[H.cob]);
    const totalGalletas = num(r[H.tg]) > 0 ? num(r[H.tg]) : paquetes * precioUnitario;
    const totalConEnvio = num(r[H.tc]) > 0 ? num(r[H.tc]) : totalGalletas + cobroEnvio;

    const fila: VentaRedesRow = {
      clave: [fecha, str(r[H.num]), cliente, paquetes, precioUnitario].join('|'),
      lineaExcel: i + 1,
      fecha,
      numero: str(r[H.num]),
      cliente,
      canal: str(r[H.canal]),
      distribuidor: str(r[H.dist]),
      paquetes,
      precioUnitario,
      costoEnvio,
      cobroEnvio,
      totalGalletas,
      totalConEnvio,
      costoTotal: num(r[H.costo]) > 0 ? num(r[H.costo]) : null,
      margen: r[H.margen] != null && num(r[H.margen]) !== 0 ? num(r[H.margen]) : null,
      estadoEntrega: str(r[H.entrega]),
      pago: str(r[H.pago]),
    };

    if (vistas.has(fila.clave)) {
      duplicadas.push(fila);
    } else {
      vistas.add(fila.clave);
      filas.push(fila);
    }
  }

  return { filas, duplicadas, omitidas };
}

/** Venta cargada que puede servir como candidata de la planilla. */
export interface VentaCandidataInput {
  id: string;
  fecha: string | null;
  monto_total: number | null;
  estado?: string | null;
  clientes?: { nombre: string } | null;
}

/** Candidata ya resuelta para presentar al usuario. */
export interface VentaCandidata {
  ventaId: string;
  fecha: string | null;
  montoTotal: number;
  clienteNombre: string | null;
  estado: string | null;
}

export type TipoResolucion = 'existente' | 'ambigua' | 'nueva';

/** Fila con su auto-clasificación: cuántas ventas existentes podrían corresponderle. */
export interface FilaClasificada {
  fila: VentaRedesRow;
  resolucion: TipoResolucion;
  candidatas: VentaCandidata[];
}

/**
 * Clasifica cada fila contra las ventas existentes: candidata si la fecha difiere
 * hasta `toleranciaDias` (default 2) Y el monto_total es exactamente el total con envío.
 */
export function clasificarFilas(
  filas: VentaRedesRow[],
  ventas: VentaCandidataInput[],
  toleranciaDias = 2
): FilaClasificada[] {
  const candidatos = ventas
    .filter((v) => v.id && v.fecha && v.monto_total != null)
    .map((v) => {
      const [y, m, d] = v.fecha!.split('-').map(Number);
      return {
        id: v.id,
        ms: Date.UTC(y, m - 1, d),
        fecha: v.fecha,
        montoTotal: Number(v.monto_total),
        clienteNombre: v.clientes?.nombre ?? null,
        estado: v.estado ?? null,
      };
    });

  const tol = Math.max(0, toleranciaDias) * MS_DIA;

  return filas.map((fila) => {
    const [y, m, d] = fila.fecha.split('-').map(Number);
    const ms = Date.UTC(y, m - 1, d);

    const candidatas = candidatos
      .filter((c) => Math.abs(c.ms - ms) <= tol && c.montoTotal === fila.totalConEnvio)
      .sort((a, b) => Math.abs(a.ms - ms) - Math.abs(b.ms - ms))
      .map((c) => ({
        ventaId: c.id,
        fecha: c.fecha,
        montoTotal: c.montoTotal,
        clienteNombre: c.clienteNombre,
        estado: c.estado,
      }));

    const resolucion: TipoResolucion =
      candidatas.length === 0 ? 'nueva' : candidatas.length === 1 ? 'existente' : 'ambigua';

    return { fila, resolucion, candidatas };
  });
}