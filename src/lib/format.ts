const CURRENCY = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Formatea un monto en colones sin decimales (₡1.400). */
export function formatCurrency(value: number | null): string {
  if (value === null) return '—';
  return CURRENCY.format(value);
}

/** Formatea un porcentaje (0.6 → "60%"). */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${Math.round(value * 100)}%`;
}