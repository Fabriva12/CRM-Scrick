interface VentaEstadoBadgeProps {
  estado: 'pagado' | 'pendiente' | 'cancelado';
}

const badgeStyles: Record<'pagado' | 'pendiente' | 'cancelado', string> = {
  pagado:
    'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  pendiente:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  cancelado:
    'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};

const badgeLabels: Record<'pagado' | 'pendiente' | 'cancelado', string> = {
  pagado: 'Pagado',
  pendiente: 'Pendiente',
  cancelado: 'Cancelado',
};

export function VentaEstadoBadge({ estado }: VentaEstadoBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeStyles[estado]}`}
    >
      {badgeLabels[estado]}
    </span>
  );
}
