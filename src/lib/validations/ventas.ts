import { z } from 'zod';

export const ESTADOS = ['pagado', 'pendiente', 'cancelado'] as const;
export type VentaEstado = (typeof ESTADOS)[number];

export const ventaHeaderSchema = z.object({
  cliente_id: z
    .string()
    .min(1, 'Cliente es requerido')
    .uuid('Selecciona un cliente válido'),
  fecha: z.string().min(1, 'Fecha es requerida'),
  estado: z.enum(ESTADOS, { error: 'Estado inválido' }),
  notas: z.string().optional().nullable().default(null),
  envio_paga_cliente: z
    .string()
    .optional()
    .default('0')
    .transform((v) => Math.max(0, Math.round(parseFloat(v) || 0))),
  envio_cubrimos: z
    .string()
    .optional()
    .default('0')
    .transform((v) => Math.max(0, Math.round(parseFloat(v) || 0))),
});

export const ventaProductoRowSchema = z.object({
  producto_id: z
    .string()
    .min(1, 'Producto es requerido'),
  cantidad: z
    .string()
    .min(1, 'Cantidad es requerida')
    .transform((val) => parseInt(val, 10))
    .pipe(
      z
        .number()
        .int('Cantidad debe ser un número entero')
        .positive('Cantidad debe ser mayor a 0')
    ),
});

export const ventaCreateSchema = ventaHeaderSchema;

export const ventaUpdateSchema = ventaHeaderSchema.partial();
