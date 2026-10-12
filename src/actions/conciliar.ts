'use server';

import { createServiceClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  FUENTE_REDES,
  NOTAS_IMPORT,
  PRODUCTO_GALLETA,
  normalizarNombreCliente,
  type VentaRedesRow,
} from '@/lib/conciliar-redes';

/** Fila de la planilla ya resuelta por el usuario, lista para aplicar. */
export interface ConciliacionRow extends VentaRedesRow {
  /** Venta existente a actualizar, o null para crear una nueva. */
  ventaId: string | null;
  /** Nombre de cliente editado por el usuario (si difiere del de la planilla). */
  clienteNombre?: string;
}

export type ConciliacionResult =
  | {
      ok: true;
      creadas: number;
      actualizadas: number;
      clientesCreados: number;
      errores: string[];
    }
  | { ok: false; error: string };

/**
 * Validación mínima por fila. Tolerante a campos accesorios: solo exige lo
 * imprescindible para escribir la venta.
 */
const filaSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  numero: z.string().nullish(),
  cliente: z.string().min(1, 'Cliente requerido'),
  paquetes: z.number().int().min(1, 'Paquetes debe ser al menos 1'),
  precioUnitario: z.number().min(0),
  costoEnvio: z.number().min(0),
  cobroEnvio: z.number().min(0),
  totalConEnvio: z.number().min(0),
  ventaId: z.string().uuid().nullish(),
  clienteNombre: z.string().nullish(),
});

/** Entidades creadas durante el procesamiento de una fila, para poder revertirla. */
interface CreadosFila {
  nuevaVentaId?: string;
  ventaActualizadaId?: string;
  ventaPrevia?: { cliente_id: string; monto_total: number };
  ventaProductoId?: string;
  ventaEnvioId?: string;
  gastoId?: string;
  clienteId?: string;
  clienteKey?: string;
}

type ServiceClient = ReturnType<typeof createServiceClient>;

/**
 * Revierte los inserts de una sola fila que falló (y la restauración del header
 * si era una venta existente), sin tocar las filas ya procesadas con éxito.
 */
async function revertirFila(
  supabase: ServiceClient,
  creado: CreadosFila,
  clientePorClave: Map<string, string>
) {
  if (creado.gastoId) {
    await supabase.from('gastos').delete().eq('id', creado.gastoId);
  }
  if (creado.ventaEnvioId) {
    await supabase.from('venta_envios').delete().eq('id', creado.ventaEnvioId);
  }
  if (creado.ventaProductoId) {
    await supabase.from('venta_productos').delete().eq('id', creado.ventaProductoId);
  }
  if (creado.nuevaVentaId) {
    await supabase.from('ventas').delete().eq('id', creado.nuevaVentaId);
  } else if (creado.ventaActualizadaId && creado.ventaPrevia) {
    await supabase
      .from('ventas')
      .update({
        cliente_id: creado.ventaPrevia.cliente_id,
        monto_total: creado.ventaPrevia.monto_total,
      })
      .eq('id', creado.ventaActualizadaId);
  }
  if (creado.clienteId && creado.clienteKey) {
    // Solo se creó en esta fila: se elimina y se saca del mapa para que una fila
    // posterior con el mismo nombre lo vuelva a crear de forma consistente.
    await supabase.from('clientes').delete().eq('id', creado.clienteId);
    clientePorClave.delete(creado.clienteKey);
  }
}

/**
 * Aplica la conciliación de la planilla de redes: actualiza ventas existentes o
 * crea ventas nuevas con su producto y envío. No toca stock ni el estado de las
 * ventas existentes. Los errores se manejan fila a fila con limpieza parcial.
 */
export async function aplicarConciliacion(
  rows: ConciliacionRow[]
): Promise<ConciliacionResult> {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, error: 'No hay filas para conciliar.' };
  }

  // Guard: ninguna venta existente puede quedar asignada a dos filas.
  const usados = new Map<string, number>();
  for (let i = 0; i < rows.length; i++) {
    const ventaId = rows[i]?.ventaId ?? null;
    if (!ventaId) continue;
    const previo = usados.get(ventaId);
    if (previo !== undefined) {
      return {
        ok: false,
        error: `Conflicto: la venta ${ventaId.slice(0, 8)} está asignada a más de una fila (líneas ${previo + 1} y ${i + 1}). Resolvé las ambigüedades antes de aplicar.`,
      };
    }
    usados.set(ventaId, i);
  }

  const supabase = createServiceClient();

  // Producto de la planilla, una sola vez.
  const { data: producto, error: prodError } = await supabase
    .from('productos')
    .select('id')
    .eq('nombre', PRODUCTO_GALLETA)
    .maybeSingle();

  if (prodError) {
    return { ok: false, error: `Error al consultar el producto: ${prodError.message}` };
  }
  if (!producto) {
    return {
      ok: false,
      error: `No se encontró el producto "${PRODUCTO_GALLETA}" en el catálogo.`,
    };
  }

  // Clientes existentes, indexados por nombre normalizado (find-or-create).
  const { data: clientes, error: clientesError } = await supabase
    .from('clientes')
    .select('id, nombre');

  if (clientesError) {
    return { ok: false, error: `Error al consultar clientes: ${clientesError.message}` };
  }

  const clientePorClave = new Map<string, string>();
  for (const c of clientes ?? []) {
    clientePorClave.set(normalizarNombreCliente(c.nombre), c.id);
  }

  let creadas = 0;
  let actualizadas = 0;
  let clientesCreados = 0;
  const errores: string[] = [];

  for (let index = 0; index < rows.length; index++) {
    const raw = rows[index];
    const linea = raw?.lineaExcel ?? index + 1;

    const parsed = filaSchema.safeParse(raw);
    if (!parsed.success) {
      const detalle = parsed.error.issues.map((issue) => issue.message).join(', ');
      errores.push(`Línea ${linea}: ${detalle}`);
      continue;
    }
    const fila = parsed.data;

    const creado: CreadosFila = {};
    try {
      // 1) Resolver o crear cliente.
      const nombreBase = (fila.clienteNombre?.trim() || fila.cliente).trim();
      const clave = normalizarNombreCliente(nombreBase);
      let clienteId = clientePorClave.get(clave);

      if (!clienteId) {
        const { data: nuevoCliente, error: errCliente } = await supabase
          .from('clientes')
          .insert({
            nombre: nombreBase,
            tipo: 'B2C',
            telefono: fila.numero ?? null,
            email: null,
            fuente: FUENTE_REDES,
          })
          .select('id')
          .single();

        if (errCliente || !nuevoCliente?.id) {
          throw new Error(errCliente?.message ?? 'No se pudo crear el cliente');
        }
        clienteId = nuevoCliente.id;
        if (!clienteId) {
          throw new Error('No se pudo crear el cliente');
        }
        clientePorClave.set(clave, clienteId);
        creado.clienteId = clienteId;
        creado.clienteKey = clave;
        clientesCreados++;
      }

      // 2) Resolver la venta (actualizar existente o crear nueva).
      let ventaId: string;
      if (fila.ventaId) {
        const { data: previa } = await supabase
          .from('ventas')
          .select('cliente_id, monto_total')
          .eq('id', fila.ventaId)
          .maybeSingle();

        if (!previa?.cliente_id) {
          throw new Error(`La venta ${fila.ventaId.slice(0, 8)} no existe`);
        }
        creado.ventaPrevia = {
          cliente_id: previa.cliente_id,
          monto_total: Number(previa.monto_total),
        };

        const { error: errUpdate } = await supabase
          .from('ventas')
          .update({ cliente_id: clienteId, monto_total: fila.totalConEnvio })
          .eq('id', fila.ventaId);

        if (errUpdate) {
          throw new Error(`No se pudo actualizar la venta: ${errUpdate.message}`);
        }
        ventaId = fila.ventaId;
        creado.ventaActualizadaId = fila.ventaId;
      } else {
        // El origen "redes sociales" se atribuye vía clientes.fuente (la tabla
        // ventas no tiene columna fuente).
        const { data: nuevaVenta, error: errVenta } = await supabase
          .from('ventas')
          .insert({
            fecha: fila.fecha,
            cliente_id: clienteId,
            monto_total: fila.totalConEnvio,
            estado: 'pagado',
            notas: NOTAS_IMPORT,
          })
          .select('id')
          .single();

        if (errVenta || !nuevaVenta?.id) {
          throw new Error(errVenta?.message ?? 'No se pudo crear la venta');
        }
        ventaId = nuevaVenta.id;
        creado.nuevaVentaId = ventaId;
      }

      // 3) Línea de producto (siempre).
      const { data: ventaProducto, error: errProducto } = await supabase
        .from('venta_productos')
        .insert({
          venta_id: ventaId,
          producto_id: producto.id,
          cantidad: fila.paquetes,
          precio_unitario: fila.precioUnitario,
          subtotal: fila.paquetes * fila.precioUnitario,
        })
        .select('id')
        .single();

      if (errProducto || !ventaProducto?.id) {
        throw new Error(errProducto?.message ?? 'No se pudo guardar el producto de la venta');
      }
      creado.ventaProductoId = ventaProducto.id;

      // 4) Envío (si aplica).
      if (fila.costoEnvio > 0 || fila.cobroEnvio > 0) {
        const { data: envio, error: errEnvio } = await supabase
          .from('venta_envios')
          .insert({
            venta_id: ventaId,
            cubrimos: fila.costoEnvio,
            paga_cliente: fila.cobroEnvio,
          })
          .select('id')
          .single();

        if (errEnvio || !envio?.id) {
          throw new Error(errEnvio?.message ?? 'No se pudo guardar el envío');
        }
        creado.ventaEnvioId = envio.id;
      }

      // 5) Gasto de Transporte por el envío que cubrimos. `notas = ventaId` para
      // que deleteVenta pueda limpiarlo después.
      if (fila.costoEnvio > 0) {
        const { data: gasto, error: errGasto } = await supabase
          .from('gastos')
          .insert({
            categoria: 'Transporte',
            descripcion: `Envío — Venta #${ventaId.slice(0, 8)}`,
            monto: fila.costoEnvio,
            fecha: fila.fecha,
            notas: ventaId,
          })
          .select('id')
          .single();

        if (errGasto || !gasto?.id) {
          throw new Error(errGasto?.message ?? 'No se pudo guardar el gasto de envío');
        }
        creado.gastoId = gasto.id;
      }

      if (fila.ventaId) {
        actualizadas++;
      } else {
        creadas++;
      }
    } catch (err) {
      await revertirFila(supabase, creado, clientePorClave);
      const mensaje = err instanceof Error ? err.message : 'Error inesperado';
      errores.push(`Línea ${linea}: ${mensaje}`);
    }
  }

  revalidatePath('/');
  revalidatePath('/ventas');
  revalidatePath('/finanzas');

  return { ok: true, creadas, actualizadas, clientesCreados, errores };
}
