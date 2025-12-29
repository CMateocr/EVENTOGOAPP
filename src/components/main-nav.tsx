'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { User } from '@/lib/types';

interface MainNavProps extends React.HTMLAttributes<HTMLElement> {
  user: User | null;
}

export function MainNav({ className, user, ...props }: MainNavProps) {
  const pathname = usePathname();

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
      className={cn('hidden md:flex items-center space-x-4 lg:space-x-6', className)}
      {...props}
    >
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary',
            route.active ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          {route.label}
        </Link>
      ))}
    </nav>
  );
}
