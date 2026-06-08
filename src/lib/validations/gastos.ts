import { z } from 'zod';

export const CATEGORIAS = [
  'Ingredientes',
  'Produccion',
  'Servicios',
  'Renta',
  'Nomina',
  'Marketing',
  'Transporte',
  'Oficina',
  'Impuestos',
  'Mantenimiento',
  'Comisiones',
  'Otros',
] as const;
export type GastoCategoria = (typeof CATEGORIAS)[number];

export const gastoSchema = z.object({
  categoria: z.enum(CATEGORIAS, { error: 'Categoría inválida' }),
  descripcion: z
    .string()
    .min(1, 'Descripción es requerida')
    .max(500, 'La descripción no puede exceder 500 caracteres'),
  monto: z
    .string()
    .min(1, 'Monto es requerido')
    .transform((val) => parseFloat(val))
    .pipe(
      z
        .number()
        .positive('El monto debe ser mayor a 0')
        .min(0.01, 'El monto debe ser al menos 0.01')
    ),
  fecha: z.string().min(1, 'Fecha es requerida'),
  notas: z.string().optional().nullable().default(null),
});

export const gastoCreateSchema = gastoSchema;
export const gastoUpdateSchema = gastoSchema.partial();
