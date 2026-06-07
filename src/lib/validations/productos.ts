import { z } from 'zod';

export const productoSchema = z.object({
  nombre: z.string().min(1, 'Nombre es requerido').max(256),
  sku: z.string().max(50).optional().nullable().default(null),
  precio_venta: z
    .string()
    .min(1, 'Precio de venta es requerido')
    .transform((val) => parseFloat(val))
    .pipe(
      z
        .number()
        .positive('Precio de venta debe ser mayor a 0')
        .min(0.01, 'Precio de venta debe ser al menos 0.01')
    ),
  costo: z
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
        .min(0, 'Costo no puede ser negativo')
        .nullable()
    )
    .default(null),
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
  unidad: z.string().max(50).optional().nullable().default(null),
  paquete: z.string().max(100).optional().nullable().default(null),
  descripcion: z.string().optional().nullable().default(null),
});

export const productoCreateSchema = productoSchema;
export const productoUpdateSchema = productoSchema.partial();
