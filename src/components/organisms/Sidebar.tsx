'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from '@/actions/auth';
import { cn } from '@/lib/utils';

const links = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/clientes', label: 'Clientes', icon: '👥' },
  { href: '/productos', label: 'Productos', icon: '📦' },
  { href: '/ventas', label: 'Ventas', icon: '🧾' },
  { href: '/finanzas', label: 'Finanzas', icon: '💳' },
];

export function Sidebar({
  className,
  onClose,
}: {
  className?: string;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'flex flex-col bg-scrick-charcoal text-scrick-latte',
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center px-6 py-4">
        <img
          src="/logo.png"
          alt="Scrick"
          className="h-14 w-auto object-contain brightness-0 invert"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3">
        {links.map((link) => {
          const isActive =
            link.href === '/'
              ? pathname === '/'
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-scrick-salmon text-scrick-charcoal'
                  : 'text-scrick-latte/70 hover:bg-scrick-charcoal/80 hover:text-scrick-latte'
              }`}
            >
              <span className="text-base">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Cerrar sesión */}
      <div className="border-t border-scrick-latte/10 px-3 py-3">
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-scrick-latte/50 transition-colors hover:bg-scrick-latte/10 hover:text-scrick-latte"
          >
            <span className="text-base">🚪</span>
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
