interface ClienteBadgeProps {
  tipo: 'B2B' | 'B2C';
}

const badgeStyles: Record<'B2B' | 'B2C', string> = {
  B2B: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  B2C: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
};

const badgeLabels: Record<'B2B' | 'B2C', string> = {
  B2B: 'Empresa',
  B2C: 'Persona',
};

export function ClienteBadge({ tipo }: ClienteBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeStyles[tipo]}`}
    >
      {badgeLabels[tipo]}
    </span>
  );
}
