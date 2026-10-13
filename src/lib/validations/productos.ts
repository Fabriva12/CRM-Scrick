import { z } from 'zod';

/** Convierte costo total + cantidad comprada en costo por gramo. */
export function calcularCostoPorGramo(
  costoTotal: number | null | undefined,
  cantidadComprada: number | null | undefined
): number | null {
  if (
    costoTotal == null ||
    cantidadComprada == null ||
    cantidadComprada <= 0
  ) {
    return null;
  }
  return costoTotal / cantidadComprada;
}

const montoOpcional = z
  .string()
  .optional()
  .nullable()
  .transform((val) => {
    if (val === '' || val === null || val === undefined) return null;
    return parseFloat(val);
  })
  .pipe(
    z
      .number()
      .min(0, 'El monto no puede ser negativo')
      .nullable()
  )
  .default(null);

const gramosOpcional = z
  .string()
  .optional()
  .nullable()
  .transform((val) => {
    if (val === '' || val === null || val === undefined) return null;
    const parsed = parseFloat(val);
    return Number.isFinite(parsed) ? parsed : null;
  })
  .pipe(
    z
      .number()
      .min(0, 'Los gramos no pueden ser negativos')
      .nullable()
  )
  .default(null);

const productoBaseSchema = z.object({
  nombre: z.string().min(1, 'Nombre es requerido').max(256),
  tipo: z.enum(['ingrediente', 'paquete']),
  sku: z.string().max(50).optional().nullable().default(null),
  precio_venta: montoOpcional.pipe(
    z
      .number()
      .positive('Precio de venta debe ser mayor a 0')
      .nullable()
  ),
  costo: montoOpcional,
  costo_total: montoOpcional,
  cantidad_comprada: montoOpcional,
  stock: z
    .string()
    .optional()
    .nullable()
    .transform((val) => {
      if (val === '' || val === null || val === undefined) return 0;
      return parseInt(val, 10);
    })
    .pipe(
      z
        .number()
        .int('Stock debe ser un número entero')
        .min(0, 'Stock no puede ser negativo')
    )
    .default(0),
  gramos_restantes: gramosOpcional,
  unidad: z.string().max(50).optional().nullable().default(null),
});

function validarCostoTotal(
  val: {
    costo_total?: number | null | undefined;
    cantidad_comprada?: number | null | undefined;
  },
  ctx: z.RefinementCtx
): void {
  if (
    val.costo_total != null &&
    (val.cantidad_comprada == null || val.cantidad_comprada <= 0)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['cantidad_comprada'],
      message:
        'La cantidad comprada debe ser mayor a 0 para calcular el costo por gramo',
    });
  }
}

export const productoSchema = productoBaseSchema.superRefine(validarCostoTotal);
export const productoCreateSchema = productoSchema;
export const productoUpdateSchema = productoBaseSchema
  .partial()
  .superRefine(validarCostoTotal);
