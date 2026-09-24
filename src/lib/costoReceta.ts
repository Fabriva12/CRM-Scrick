import { createServiceClient } from '@/lib/supabase/server';
import { buscarRecetaPorProducto, calcularCostoReceta } from '@/lib/recetas';

/**
 * Costo por unidad vendida de un producto con receta, calculado con la
 * fórmula: suma de (cantidad × costo por gramo) de sus ingredientes,
 * leyendo los costos vigentes desde la base.
 *
 * Devuelve null si el producto no tiene receta o si falta el costo de al
 * menos un ingrediente (el costo no se puede calcular de forma confiable).
 *
 * Este módulo usa createServiceClient: solo importarlo desde código de
 * servidor (acciones, páginas), nunca desde componentes cliente.
 */
export async function calcularCostoRecetaProducto(
  nombreProducto: string
): Promise<number | null> {
  const receta = buscarRecetaPorProducto(nombreProducto);
  if (!receta) return null;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('productos')
    .select('nombre, costo')
    .in('nombre', receta.ingredientes.map((i) => i.nombre));

  if (error || !data) return null;

  const costosPorNombre: Record<string, number | null | undefined> = {};
  for (const ing of data) {
    // PostgREST devuelve NUMERIC como string: normalizamos a número.
    costosPorNombre[ing.nombre] =
      ing.costo != null ? Number(ing.costo) : null;
  }

  return calcularCostoReceta(receta, costosPorNombre);
}