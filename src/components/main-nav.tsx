'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSession } from '@/hooks/use-session';

interface MainNavProps extends React.HTMLAttributes<HTMLElement> {
  onLinkClick?: () => void;
}

export function MainNav({ className, onLinkClick, ...props }: MainNavProps) {
  const pathname = usePathname();
  const { user } = useSession();

  const baseRoutes = [
    { href: '/', label: 'Events', active: pathname === '/' },
    { href: '/discover', label: 'Discover', active: pathname === '/discover' },
  ];

  const adminRoutes = [
    { href: '/admin/events', label: 'Manage Events', active: pathname.startsWith('/admin/events') },
    { href: '/scan', label: 'Scan Tickets', active: pathname === '/scan' }
  ];

  const routes = user?.role === 'Admin' ? [...baseRoutes, ...adminRoutes] : baseRoutes;

  return (
    <nav
      className={cn('hidden md:flex items-center space-x-4 lg:space-x-6 mx-6 text-sm font-bold text-gray-400', className)}
      {...props}
    >
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          onClick={onLinkClick}
          className={cn(
            'text-sm font-bold transition-colors hover:text-yellow-400',
            route.active ? 'text-yellow-400' : 'text-gray-400'
          )}
        >
          {route.label}
        </Link>
      ))}
    </nav>
  );
}
