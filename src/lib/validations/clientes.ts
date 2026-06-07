import { z } from 'zod';

export const TIPOS = ['B2B', 'B2C'] as const;
export type ClienteTipo = (typeof TIPOS)[number];

export const clienteSchema = z.object({
  nombre: z.string().min(1, 'Nombre es requerido').max(256),
  tipo: z.enum(TIPOS, { error: 'Tipo debe ser B2B o B2C' }),
  email: z.string().min(1, 'Email es requerido').email('Email inválido'),
  telefono: z.string().optional().nullable().default(null),
  ciudad: z.string().max(128).optional().nullable().default(null),
  rfc: z.string().max(13).optional().nullable().default(null),
  empresa: z.string().max(256).optional().nullable().default(null),
  notas: z.string().optional().nullable().default(null),
});

export const clienteCreateSchema = clienteSchema;
export const clienteUpdateSchema = clienteSchema.partial();
