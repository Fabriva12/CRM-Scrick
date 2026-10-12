/** Costo fijo por paquete vendido (colones). */
export const COSTO_PAQUETE = 1045;

/** Costo total de un lote de paquetes al costo fijo por unidad. */
export function calcularCostoPaquetes(paquetes: number): number {
  return paquetes * COSTO_PAQUETE;
}

/**
 * Margen como fracción (0.6 = 60%) entre el facturado y el costo total.
 * Devuelve null si el total facturado no es mayor a 0.
 */
export function calcularMargen(
  totalFacturado: number,
  costoTotal: number
): number | null {
  if (totalFacturado <= 0) return null;
  return (totalFacturado - costoTotal) / totalFacturado;
}